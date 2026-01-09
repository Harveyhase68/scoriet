<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MessageThread;
use App\Models\MessageThreadParticipant;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Models\User;
use App\Models\Subscription;
use App\Mail\NewMessageMail;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MessageController extends Controller
{
    /**
     * Check if email notification should be sent based on user preferences
     *
     * @param User $recipient The user to receive the email
     * @param bool $isBroadcast Whether this is a system broadcast message
     * @return bool True if email should be sent
     */
    private function shouldSendEmailNotification(User $recipient, bool $isBroadcast = false): bool
    {
        if ($isBroadcast) {
            // System broadcasts: check email_system_notifications (default true)
            return $recipient->email_system_notifications ?? true;
        }

        // User messages: check email_user_notifications (default true)
        return $recipient->email_user_notifications ?? true;
    }

    /**
     * Get all message threads for the current user
     */
    public function threads(Request $request): JsonResponse
    {
        $user = Auth::user();

        $threads = MessageThread::forUser($user->id)
            ->with([
                'latestMessage.sender:id,name,username',
                'participants.user:id,name,username',
                'messages' => function ($query) {
                    $query->orderBy('created_at', 'desc')->limit(1);
                }
            ])
            ->orderBy('updated_at', 'desc')
            ->get();

        // Add unread status and other participant info
        $threads->map(function ($thread) use ($user) {
            $participant = $thread->participants->firstWhere('user_id', $user->id);
            $thread->last_read_at = $participant?->last_read_at;
            $thread->has_unread = $thread->hasUnreadFor($user->id);

            // Get other participants
            $thread->other_participants = $thread->participants
                ->where('user_id', '!=', $user->id)
                ->filter(function ($p) {
                    return $p->deleted_at === null;
                })
                ->values()
                ->map(function ($p) {
                    return [
                        'id' => $p->user->id ?? 0,
                        'name' => $p->user->name ?? 'Unbekannt',
                        'username' => $p->user->username ?? null,
                    ];
                });

            return $thread;
        });

        return response()->json([
            'threads' => $threads,
        ]);
    }

    /**
     * Get a single thread with all messages
     */
    public function showThread(int $id, Request $request): JsonResponse
    {
        $user = Auth::user();

        // Pagination parameters
        $limit = $request->get('limit', 15);
        $beforeId = $request->get('before_id'); // Load messages before this ID (for infinite scroll up)

        $thread = MessageThread::with([
            'participants.user:id,name,username',
        ])->findOrFail($id);

        // Check if user is participant
        if (!$thread->hasParticipant($user->id)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Mark as read
        $thread->participants()
            ->where('user_id', $user->id)
            ->update(['last_read_at' => now()]);

        // Get total message count
        $totalMessages = $thread->messages()->count();

        // Load messages with pagination (newest last, but we want to load oldest first when scrolling up)
        // Use reorder() to override the default ASC ordering in the relationship
        $messagesQuery = $thread->messages()
            ->with(['sender:id,name,username', 'attachments'])
            ->reorder()
            ->orderBy('created_at', 'desc'); // Get newest first, then reverse for display

        if ($beforeId) {
            $messagesQuery->where('id', '<', $beforeId);
        }

        $messages = $messagesQuery->limit($limit)->get()->reverse()->values();

        // Check if there are more older messages
        $hasMoreOlder = false;
        $oldestLoadedId = null;
        if ($messages->isNotEmpty()) {
            // After reverse(), first() is the OLDEST message in the loaded set
            $oldestLoadedId = $messages->first()->id;
            $hasMoreOlder = $thread->messages()->where('id', '<', $oldestLoadedId)->exists();
        }

        // Get other participants
        $thread->other_participants = $thread->participants
            ->where('user_id', '!=', $user->id)
            ->whereNull('deleted_at')
            ->values()
            ->map(function ($p) {
                return [
                    'id' => $p->user->id,
                    'name' => $p->user->name,
                    'username' => $p->user->username,
                ];
            });

        // Attach messages to thread
        $thread->setRelation('messages', $messages);

        return response()->json([
            'thread' => $thread,
            'total_messages' => $totalMessages,
            'has_more_older' => $hasMoreOlder,
            'oldest_loaded_id' => $messages->isNotEmpty() ? $messages->first()->id : null,
        ]);
    }

    /**
     * Create a new thread with initial message
     */
    public function createThread(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'recipient_ids' => 'required|array|min:1',
            'recipient_ids.*' => 'exists:users,id',
            'subject' => 'required|string|max:255',
            'body' => 'required|string|max:10000',
            'attachments' => 'sometimes|array',
            'attachments.*' => 'file|max:10240', // 10MB max per file
        ]);

        // Check for attachments permission
        if ($request->hasFile('attachments') && !$user->hasMessageAttachmentsAccess()) {
            return response()->json([
                'message' => 'Nachrichten-Anhänge sind ein Premium-Feature. Bitte freischalten für 50 Credits/Jahr.',
                'requires_subscription' => true,
                'unlock_cost' => Subscription::MESSAGE_ATTACHMENTS_UNLOCK_COST,
            ], 403);
        }

        // Check storage limit for attachments
        if ($request->hasFile('attachments')) {
            $storageError = $this->checkStorageForAttachments($user, $request->file('attachments'));
            if ($storageError) {
                return $storageError;
            }
        }

        // Create thread with initial message
        $thread = MessageThread::createWithMessage(
            $validated['subject'],
            $user->id,
            $validated['recipient_ids'],
            $validated['body']
        );

        // Handle attachments
        if ($request->hasFile('attachments')) {
            $message = $thread->messages()->first();
            $this->handleAttachments($request->file('attachments'), $message);
        }

        // Send email notifications to recipients (respecting user preferences)
        $thread->load('messages.sender', 'participants.user');
        $message = $thread->messages()->first();
        $isBroadcast = $thread->is_broadcast ?? false;

        foreach ($validated['recipient_ids'] as $recipientId) {
            $recipient = User::find($recipientId);
            if ($recipient && $recipient->email && $this->shouldSendEmailNotification($recipient, $isBroadcast)) {
                try {
                    Mail::to($recipient->email)->queue(new NewMessageMail($message, $recipient));
                } catch (\Exception $e) {
                    \Log::error('Failed to send message notification email: ' . $e->getMessage());
                }
            }
        }

        return response()->json([
            'message' => 'Nachricht gesendet',
            'thread' => $thread->load([
                'messages.sender:id,name,username',
                'messages.attachments',
                'participants.user:id,name,username',
            ]),
        ], 201);
    }

    /**
     * Reply to an existing thread
     */
    public function reply(int $id, Request $request): JsonResponse
    {
        $user = Auth::user();

        $thread = MessageThread::findOrFail($id);

        // Check if user is participant
        if (!$thread->hasParticipant($user->id)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'body' => 'required|string|max:10000',
            'attachments' => 'sometimes|array',
            'attachments.*' => 'file|max:10240',
        ]);

        // Check for attachments permission
        if ($request->hasFile('attachments') && !$user->hasMessageAttachmentsAccess()) {
            return response()->json([
                'message' => 'Nachrichten-Anhänge sind ein Premium-Feature. Bitte freischalten für 50 Credits/Jahr.',
                'requires_subscription' => true,
                'unlock_cost' => Subscription::MESSAGE_ATTACHMENTS_UNLOCK_COST,
            ], 403);
        }

        // Check storage limit for attachments
        if ($request->hasFile('attachments')) {
            $storageError = $this->checkStorageForAttachments($user, $request->file('attachments'));
            if ($storageError) {
                return $storageError;
            }
        }

        // Create message
        $message = $thread->messages()->create([
            'sender_id' => $user->id,
            'body' => $validated['body'],
        ]);

        // Handle attachments
        if ($request->hasFile('attachments')) {
            $this->handleAttachments($request->file('attachments'), $message);
        }

        // Mark as read for sender
        $thread->participants()
            ->where('user_id', $user->id)
            ->update(['last_read_at' => now()]);

        // Load relationships
        $message->load(['sender:id,name,username', 'attachments']);

        // Send email notifications to other participants (respecting user preferences)
        $otherParticipants = $thread->participants()
            ->where('user_id', '!=', $user->id)
            ->whereNull('deleted_at')
            ->with('user')
            ->get();
        $isBroadcast = $thread->is_broadcast ?? false;

        foreach ($otherParticipants as $participant) {
            if ($participant->user && $participant->user->email && $this->shouldSendEmailNotification($participant->user, $isBroadcast)) {
                try {
                    Mail::to($participant->user->email)->queue(new NewMessageMail($message, $participant->user));
                } catch (\Exception $e) {
                    \Log::error('Failed to send message notification email: ' . $e->getMessage());
                }
            }
        }

        return response()->json([
            'message' => 'Antwort gesendet',
            'reply' => $message,
        ]);
    }

    /**
     * Delete (soft delete) a thread for the current user
     */
    public function deleteThread(int $id): JsonResponse
    {
        $user = Auth::user();

        $thread = MessageThread::findOrFail($id);

        // Check if user is participant
        if (!$thread->hasParticipant($user->id)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Soft delete for this user only
        $thread->removeParticipant($user->id);

        return response()->json([
            'message' => 'Konversation gelöscht',
        ]);
    }

    /**
     * Mark a thread as read
     */
    public function markAsRead(int $id): JsonResponse
    {
        $user = Auth::user();

        $thread = MessageThread::findOrFail($id);

        if (!$thread->hasParticipant($user->id)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $thread->participants()
            ->where('user_id', $user->id)
            ->update(['last_read_at' => now()]);

        return response()->json([
            'message' => 'Als gelesen markiert',
        ]);
    }

    /**
     * Get unread thread count for current user
     */
    public function unreadCount(): JsonResponse
    {
        $user = Auth::user();

        // Count threads with unread messages and find the latest unread thread
        $count = 0;
        $latestUnreadThreadId = null;
        $latestUnreadTime = null;
        $threads = MessageThread::forUser($user->id)->get();

        foreach ($threads as $thread) {
            if ($thread->hasUnreadFor($user->id)) {
                $count++;
                // Track the most recently updated unread thread
                if ($latestUnreadTime === null || $thread->updated_at > $latestUnreadTime) {
                    $latestUnreadTime = $thread->updated_at;
                    $latestUnreadThreadId = $thread->id;
                }
            }
        }

        return response()->json([
            'count' => $count,
            'latest_unread_thread_id' => $latestUnreadThreadId,
        ]);
    }

    /**
     * Send system broadcast to all users (admin only)
     */
    public function broadcast(Request $request): JsonResponse
    {
        $user = Auth::user();

        // Check if user is admin
        if (!$user->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'body' => 'required|string|max:10000',
            'attachments' => 'sometimes|array',
            'attachments.*' => 'file|max:10240',
        ]);

        // Get all active user IDs (excluding the sender)
        $recipientIds = User::where('id', '!=', $user->id)
            ->where('is_active', true)
            ->pluck('id')
            ->toArray();

        if (empty($recipientIds)) {
            return response()->json([
                'message' => 'Keine Empfänger gefunden',
            ], 400);
        }

        // Create broadcast thread
        $thread = MessageThread::create([
            'subject' => '[System] ' . $validated['subject'],
            'is_broadcast' => true,
        ]);

        // Add sender
        $thread->addParticipant($user->id);

        // Add all recipients
        foreach ($recipientIds as $recipientId) {
            $thread->addParticipant($recipientId);
        }

        // Create message
        $message = $thread->messages()->create([
            'sender_id' => $user->id,
            'body' => $validated['body'],
        ]);

        // Handle attachments
        if ($request->hasFile('attachments')) {
            $this->handleAttachments($request->file('attachments'), $message);
        }

        // Mark as read for sender
        $thread->participants()
            ->where('user_id', $user->id)
            ->update(['last_read_at' => now()]);

        return response()->json([
            'message' => 'Broadcast gesendet an ' . count($recipientIds) . ' Benutzer',
            'recipient_count' => count($recipientIds),
        ]);
    }

    /**
     * Get recipient options: projects and teams the user can message
     */
    public function recipientOptions(): JsonResponse
    {
        $user = Auth::user();

        // Get projects where user is owner
        $ownedProjects = \App\Models\Project::where('owner_id', $user->id)
            ->select('id', 'name')
            ->get()
            ->map(function ($p) {
                // Get team IDs for this project
                $teamIds = \DB::table('project_teams')
                    ->where('project_id', $p->id)
                    ->pluck('team_id');
                $memberCount = \App\Models\TeamMember::whereIn('team_id', $teamIds)
                    ->distinct('user_id')
                    ->count('user_id');
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'member_count' => $memberCount,
                    'is_owner' => true,
                ];
            });

        // Get projects where user is team member (via project_teams pivot)
        $userTeamIds = \App\Models\TeamMember::where('user_id', $user->id)->pluck('team_id');
        $memberProjectIds = \DB::table('project_teams')
            ->whereIn('team_id', $userTeamIds)
            ->pluck('project_id')
            ->unique();

        $memberProjects = \App\Models\Project::whereIn('id', $memberProjectIds)
            ->where('owner_id', '!=', $user->id) // Exclude already owned projects
            ->select('id', 'name', 'owner_id')
            ->get()
            ->map(function ($p) use ($user) {
                $teamIds = \DB::table('project_teams')
                    ->where('project_id', $p->id)
                    ->pluck('team_id');
                $memberCount = \App\Models\TeamMember::whereIn('team_id', $teamIds)
                    ->distinct('user_id')
                    ->count('user_id');
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'member_count' => $memberCount,
                    'is_owner' => $p->owner_id === $user->id,
                ];
            });

        $projects = $ownedProjects->merge($memberProjects)->unique('id')->values();

        // Get teams where user is owner (via owned projects)
        $ownedProjectIds = \App\Models\Project::where('owner_id', $user->id)->pluck('id');
        $ownedTeamIds = \DB::table('project_teams')
            ->whereIn('project_id', $ownedProjectIds)
            ->pluck('team_id')
            ->unique();

        $ownedTeams = \App\Models\Team::whereIn('id', $ownedTeamIds)
            ->withCount('members')
            ->get()
            ->map(function ($t) use ($ownedProjectIds) {
                // Get first project name for this team
                $projectId = \DB::table('project_teams')
                    ->where('team_id', $t->id)
                    ->whereIn('project_id', $ownedProjectIds)
                    ->value('project_id');
                $project = $projectId ? \App\Models\Project::find($projectId) : null;
                return [
                    'id' => $t->id,
                    'name' => $t->name,
                    'project_name' => $project?->name,
                    'member_count' => $t->members_count,
                    'is_owner' => true,
                ];
            });

        // Get teams where user is member
        $memberTeams = \App\Models\TeamMember::where('user_id', $user->id)
            ->with(['team' => function ($q) {
                $q->withCount('members');
            }])
            ->get()
            ->filter(fn($m) => $m->team)
            ->map(function ($m) {
                // Get first project name for this team
                $projectId = \DB::table('project_teams')
                    ->where('team_id', $m->team->id)
                    ->value('project_id');
                $project = $projectId ? \App\Models\Project::find($projectId) : null;
                return [
                    'id' => $m->team->id,
                    'name' => $m->team->name,
                    'project_name' => $project?->name,
                    'member_count' => $m->team->members_count,
                    'is_owner' => false,
                ];
            });

        $teams = $ownedTeams->merge($memberTeams)->unique('id')->values();

        // Check if user is admin (for broadcast option)
        $isAdmin = $user->isAdmin();

        return response()->json([
            'projects' => $projects,
            'teams' => $teams,
            'can_broadcast' => $isAdmin,
        ]);
    }

    /**
     * Get list of individual users that can be messaged
     */
    public function users(Request $request): JsonResponse
    {
        $user = Auth::user();
        $search = $request->get('search', '');

        // If no search query, return empty (user must type to search)
        if (strlen($search) < 2) {
            return response()->json(['users' => []]);
        }

        $userIds = collect();
        $userContext = [];

        // 1. Get users from previous conversations
        $previousContacts = MessageThreadParticipant::whereIn('thread_id', function ($query) use ($user) {
                $query->select('thread_id')
                    ->from('message_thread_participants')
                    ->where('user_id', $user->id);
            })
            ->where('user_id', '!=', $user->id)
            ->pluck('user_id')
            ->unique();

        foreach ($previousContacts as $contactId) {
            $userIds->push($contactId);
            $userContext[$contactId] = ['Frühere Konversation'];
        }

        // 2. Get project members from projects where user is owner
        $ownedProjects = \App\Models\Project::where('owner_id', $user->id)
            ->with(['teams.members'])
            ->get();

        foreach ($ownedProjects as $project) {
            foreach ($project->teams as $team) {
                foreach ($team->members as $member) {
                    if ($member->user_id != $user->id) {
                        $userIds->push($member->user_id);
                        if (!isset($userContext[$member->user_id])) {
                            $userContext[$member->user_id] = [];
                        }
                        $userContext[$member->user_id][] = "Projekt: {$project->name}";
                    }
                }
            }
        }

        // 3. Get users from teams where current user is a member
        $memberTeams = \App\Models\TeamMember::where('user_id', $user->id)
            ->with(['team.members'])
            ->get();

        foreach ($memberTeams as $membership) {
            $team = $membership->team;
            if ($team) {
                foreach ($team->members as $member) {
                    if ($member->user_id != $user->id) {
                        $userIds->push($member->user_id);
                        if (!isset($userContext[$member->user_id])) {
                            $userContext[$member->user_id] = [];
                        }
                        $teamContext = "Team: {$team->name}";
                        $userContext[$member->user_id][] = $teamContext;
                    }
                }
                // Add project owners (team can belong to multiple projects)
                $projectIds = \DB::table('project_teams')
                    ->where('team_id', $team->id)
                    ->pluck('project_id');
                $projectOwners = \App\Models\Project::whereIn('id', $projectIds)
                    ->where('owner_id', '!=', $user->id)
                    ->get();
                foreach ($projectOwners as $project) {
                    $userIds->push($project->owner_id);
                    if (!isset($userContext[$project->owner_id])) {
                        $userContext[$project->owner_id] = [];
                    }
                    $userContext[$project->owner_id][] = "Projekt-Besitzer: {$project->name}";
                }
            }
        }

        // Get unique user IDs
        $uniqueUserIds = $userIds->unique()->values()->toArray();

        if (empty($uniqueUserIds)) {
            return response()->json(['users' => []]);
        }

        // Query users with search filter
        $users = User::whereIn('id', $uniqueUserIds)
            ->where('is_active', true)
            ->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            })
            ->select('id', 'name', 'username', 'email')
            ->orderBy('name')
            ->limit(20)
            ->get();

        // Add context to each user
        $users = $users->map(function ($u) use ($userContext) {
            $context = $userContext[$u->id] ?? [];
            $u->context = array_unique($context);
            $u->context_display = implode(', ', array_slice($u->context, 0, 2));
            if (count($u->context) > 2) {
                $u->context_display .= ' +' . (count($u->context) - 2);
            }
            return $u;
        });

        return response()->json([
            'users' => $users,
        ]);
    }

    /**
     * Send message to all members of a project
     */
    public function sendToProject(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'subject' => 'required|string|max:255',
            'body' => 'required|string|max:10000',
            'attachments' => 'sometimes|array',
            'attachments.*' => 'file|max:10240',
        ]);

        // Check for attachments permission
        if ($request->hasFile('attachments') && !$user->hasMessageAttachmentsAccess()) {
            return response()->json([
                'message' => 'Nachrichten-Anhänge sind ein Premium-Feature. Bitte freischalten für 50 Credits/Jahr.',
                'requires_subscription' => true,
                'unlock_cost' => Subscription::MESSAGE_ATTACHMENTS_UNLOCK_COST,
            ], 403);
        }

        // Check storage limit for attachments
        if ($request->hasFile('attachments')) {
            $storageError = $this->checkStorageForAttachments($user, $request->file('attachments'));
            if ($storageError) {
                return $storageError;
            }
        }

        $project = \App\Models\Project::find($validated['project_id']);

        // Get team IDs for this project (using explicit DB query to avoid JOIN ambiguity)
        $teamIds = \DB::table('project_teams')
            ->where('project_id', $project->id)
            ->pluck('team_id');

        // Check if user has access to this project
        $isOwner = $project->owner_id === $user->id;
        $isMember = \App\Models\TeamMember::where('user_id', $user->id)
            ->whereIn('team_id', $teamIds)
            ->exists();

        if (!$isOwner && !$isMember) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Get all project member IDs
        $recipientIds = \App\Models\TeamMember::whereIn('team_id', $teamIds)
            ->where('user_id', '!=', $user->id)
            ->distinct()
            ->pluck('user_id')
            ->toArray();

        // Add project owner if not the sender
        if ($project->owner_id !== $user->id) {
            $recipientIds[] = $project->owner_id;
        }

        $recipientIds = array_unique($recipientIds);

        if (empty($recipientIds)) {
            return response()->json([
                'message' => 'Keine Empfänger im Projekt gefunden',
            ], 400);
        }

        // Create thread
        $thread = MessageThread::createWithMessage(
            "[{$project->name}] " . $validated['subject'],
            $user->id,
            $recipientIds,
            $validated['body']
        );

        // Handle attachments
        if ($request->hasFile('attachments')) {
            $message = $thread->messages()->first();
            $this->handleAttachments($request->file('attachments'), $message);
        }

        // Send email notifications (respecting user preferences)
        foreach ($recipientIds as $recipientId) {
            $recipient = User::find($recipientId);
            if ($recipient && $recipient->email && $this->shouldSendEmailNotification($recipient, false)) {
                try {
                    Mail::to($recipient->email)->queue(new NewMessageMail($thread->messages()->first(), $recipient));
                } catch (\Exception $e) {
                    \Log::error('Failed to send message notification: ' . $e->getMessage());
                }
            }
        }

        return response()->json([
            'message' => 'Nachricht an ' . count($recipientIds) . ' Projekt-Mitglieder gesendet',
            'thread' => $thread->load(['messages.sender:id,name,username', 'participants.user:id,name,username']),
        ]);
    }

    /**
     * Send message to all members of a team
     */
    public function sendToTeam(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'team_id' => 'required|exists:teams,id',
            'subject' => 'required|string|max:255',
            'body' => 'required|string|max:10000',
            'attachments' => 'sometimes|array',
            'attachments.*' => 'file|max:10240',
        ]);

        // Check for attachments permission
        if ($request->hasFile('attachments') && !$user->hasMessageAttachmentsAccess()) {
            return response()->json([
                'message' => 'Nachrichten-Anhänge sind ein Premium-Feature. Bitte freischalten für 50 Credits/Jahr.',
                'requires_subscription' => true,
                'unlock_cost' => Subscription::MESSAGE_ATTACHMENTS_UNLOCK_COST,
            ], 403);
        }

        // Check storage limit for attachments
        if ($request->hasFile('attachments')) {
            $storageError = $this->checkStorageForAttachments($user, $request->file('attachments'));
            if ($storageError) {
                return $storageError;
            }
        }

        $team = \App\Models\Team::find($validated['team_id']);

        // Get projects this team belongs to
        $projectIds = \DB::table('project_teams')
            ->where('team_id', $team->id)
            ->pluck('project_id');
        $projects = \App\Models\Project::whereIn('id', $projectIds)->get();

        // Check if user has access to this team (is owner of any related project or is team member)
        $isProjectOwner = $projects->contains(fn($p) => $p->owner_id === $user->id);
        $isMember = \App\Models\TeamMember::where('user_id', $user->id)
            ->where('team_id', $team->id)
            ->exists();

        if (!$isProjectOwner && !$isMember) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Get all team member IDs
        $recipientIds = \App\Models\TeamMember::where('team_id', $team->id)
            ->where('user_id', '!=', $user->id)
            ->pluck('user_id')
            ->toArray();

        if (empty($recipientIds)) {
            return response()->json([
                'message' => 'Keine anderen Mitglieder im Team gefunden',
            ], 400);
        }

        // Create thread - use first project name if available
        $projectName = $projects->first()?->name ?? '';
        $prefix = $projectName ? "[{$projectName} / {$team->name}]" : "[{$team->name}]";

        $thread = MessageThread::createWithMessage(
            $prefix . ' ' . $validated['subject'],
            $user->id,
            $recipientIds,
            $validated['body']
        );

        // Handle attachments
        if ($request->hasFile('attachments')) {
            $message = $thread->messages()->first();
            $this->handleAttachments($request->file('attachments'), $message);
        }

        // Send email notifications (respecting user preferences)
        foreach ($recipientIds as $recipientId) {
            $recipient = User::find($recipientId);
            if ($recipient && $recipient->email && $this->shouldSendEmailNotification($recipient, false)) {
                try {
                    Mail::to($recipient->email)->queue(new NewMessageMail($thread->messages()->first(), $recipient));
                } catch (\Exception $e) {
                    \Log::error('Failed to send message notification: ' . $e->getMessage());
                }
            }
        }

        return response()->json([
            'message' => 'Nachricht an ' . count($recipientIds) . ' Team-Mitglieder gesendet',
            'thread' => $thread->load(['messages.sender:id,name,username', 'participants.user:id,name,username']),
        ]);
    }

    /**
     * Get message attachment access status and storage info
     */
    public function attachmentAccess(): JsonResponse
    {
        $user = Auth::user();

        return response()->json([
            'status' => $user->getMessageAttachmentsAccessStatus(),
            'storage' => $user->getAttachmentStorageStatus(),
        ]);
    }

    /**
     * Unlock message attachments with credits
     */
    public function unlockAttachments(): JsonResponse
    {
        $user = Auth::user();

        // Check if already has access
        if ($user->hasMessageAttachmentsAccess()) {
            return response()->json([
                'message' => 'Sie haben bereits Zugang zu Nachrichten-Anhängen',
                'status' => $user->getMessageAttachmentsAccessStatus(),
            ]);
        }

        // Check credits
        if ($user->credits < Subscription::MESSAGE_ATTACHMENTS_UNLOCK_COST) {
            return response()->json([
                'message' => 'Nicht genügend Credits. Benötigt: ' . Subscription::MESSAGE_ATTACHMENTS_UNLOCK_COST,
                'required' => Subscription::MESSAGE_ATTACHMENTS_UNLOCK_COST,
                'available' => $user->credits,
            ], 400);
        }

        // Unlock
        $subscription = Subscription::unlockMessageAttachmentsWithCredits($user->id);

        if (!$subscription) {
            return response()->json([
                'message' => 'Fehler beim Freischalten',
            ], 500);
        }

        return response()->json([
            'message' => 'Nachrichten-Anhänge freigeschaltet für 1 Jahr',
            'status' => $user->fresh()->getMessageAttachmentsAccessStatus(),
        ]);
    }

    /**
     * Download an attachment
     * Note: Downloading/receiving attachments is FREE for all users
     * Only SENDING attachments requires the premium feature
     */
    public function downloadAttachment(int $attachmentId)
    {
        $user = Auth::user();
        $attachment = MessageAttachment::findOrFail($attachmentId);

        // Check if user is participant of the thread
        $message = $attachment->message;
        $thread = $message->thread;

        if (!$thread->hasParticipant($user->id)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // No premium check for downloading - receiving is free!
        // Only sending attachments requires the premium feature

        $disk = Storage::disk('local');

        if (!$disk->exists($attachment->path)) {
            return response()->json(['message' => 'Datei nicht gefunden'], 404);
        }

        return $disk->download($attachment->path, $attachment->original_filename);
    }

    /**
     * Download an attachment via signed URL (public, no auth required)
     * Used for email download links - signature validates the request
     */
    public function downloadSigned(int $attachment)
    {
        $attachmentModel = MessageAttachment::findOrFail($attachment);

        $disk = Storage::disk('local');

        if (!$disk->exists($attachmentModel->path)) {
            return response()->json(['message' => 'Datei nicht gefunden'], 404);
        }

        return $disk->download($attachmentModel->path, $attachmentModel->original_filename);
    }

    /**
     * Handle file attachments upload
     */
    private function handleAttachments(array $files, Message $message): void
    {
        foreach ($files as $file) {
            $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('message-attachments/' . $message->thread_id, $filename, 'local');

            MessageAttachment::create([
                'message_id' => $message->id,
                'filename' => $filename,
                'original_filename' => $file->getClientOriginalName(),
                'mime_type' => $file->getMimeType(),
                'size' => $file->getSize(),
                'path' => $path,
            ]);
        }
    }

    /**
     * Calculate total size of uploaded files
     */
    private function calculateUploadSize(array $files): int
    {
        $totalSize = 0;
        foreach ($files as $file) {
            $totalSize += $file->getSize();
        }
        return $totalSize;
    }

    /**
     * Check if user has enough storage for attachments
     * Returns error response if not enough storage, null otherwise
     */
    private function checkStorageForAttachments(User $user, array $files): ?JsonResponse
    {
        $uploadSize = $this->calculateUploadSize($files);
        $storageStatus = $user->getAttachmentStorageStatus();

        if ($storageStatus['is_full']) {
            return response()->json([
                'message' => 'Speicherplatz voll! Bitte löschen Sie alte Nachrichten um Platz zu schaffen.',
                'storage_full' => true,
                'storage' => $storageStatus,
            ], 400);
        }

        if (!$user->hasEnoughStorageFor($uploadSize)) {
            return response()->json([
                'message' => 'Nicht genügend Speicherplatz für diese Anhänge. ' .
                    'Benötigt: ' . User::formatBytes($uploadSize) . ', ' .
                    'Verfügbar: ' . $storageStatus['remaining_formatted'],
                'storage_insufficient' => true,
                'required' => $uploadSize,
                'available' => $storageStatus['remaining'],
                'storage' => $storageStatus,
            ], 400);
        }

        return null;
    }
}
