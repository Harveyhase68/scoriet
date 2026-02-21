<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\Project;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Routing\Controller;
use App\Jobs\SendPushNotificationJob;

class TeamController extends Controller
{
    /**
     * Check if team is soft-locked and return error response if so
     */
    private function checkTeamSoftLock(Team $team): ?JsonResponse
    {
        $subscription = $team->subscription;
        if ($subscription) {
            $subscription->checkAndApplySoftLock();
            if ($subscription->is_soft_locked) {
                return response()->json([
                    'message' => __('teamcontrollerphp29'),
                    'error_code' => 'TEAM_LOCKED',
                ], 403);
            }
        }
        return null;
    }

    /**
     * Get user's teams (owned + member of)
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $projectId = $request->get('project', 0);
        $showAll = $request->get('all', false);

        if ($showAll) {
            // Get ALL teams where user is owner or member (for Team Management)
            $ownedTeams = Team::where('project_owner_id', $user->id)
                             ->with(['owner', 'members.user', 'projects', 'subscription'])
                             ->get();

            $memberTeamIds = TeamMember::where('user_id', $user->id)->pluck('team_id');
            $memberTeams = Team::whereIn('id', $memberTeamIds)
                               ->where('project_owner_id', '!=', $user->id) // Exclude owned teams
                               ->with(['owner', 'members.user', 'projects', 'subscription'])
                               ->get();
        } else {
            // Get teams filtered by project (for Team Assignment)
            // Get teams assigned to the specified project through project_teams table
            $ownedTeamIds = Team::where('project_owner_id', $user->id)->pluck('id');
            $ownedTeams = Team::whereIn('id', $ownedTeamIds)
                               ->whereHas('projects', function($query) use ($projectId) {
                                   $query->where('project_id', $projectId);
                               })
                               ->with(['owner', 'members.user', 'projects', 'subscription'])
                               ->get();

            $memberTeamIds = TeamMember::where('user_id', $user->id)->pluck('team_id');
            $memberTeams = Team::whereIn('id', $memberTeamIds)
                               ->where('project_owner_id', '!=', $user->id) // Exclude owned teams
                               ->whereHas('projects', function($query) use ($projectId) {
                                   $query->where('project_id', $projectId);
                               })
                               ->with(['owner', 'members.user', 'projects', 'subscription'])
                               ->get();
        }

        // Add subscription lock data to each team
        $addSubscriptionData = function ($team) use ($user) {
            $team->is_soft_locked = false;
            $team->subscription_data = null;

            // Get team owner info
            $teamOwner = $team->owner;
            // Patron, Admin, and System users don't need team subscriptions
            $ownerIsExempt = $teamOwner && ($teamOwner->isPatron() || $teamOwner->isAdmin());

            // Get user's role in this team (for unlock permission)
            $userRole = $team->getUserRole($user);
            $canUnlock = in_array($userRole, ['owner', 'admin']);

            // First check if team has a direct subscription (entity_id = team->id)
            // This is used for soft-locked teams that were transferred
            $subscription = $team->subscription;
            if ($subscription) {
                // Auto-apply soft-lock if expired
                $subscription->checkAndApplySoftLock();
                $team->is_soft_locked = $subscription->is_soft_locked;

                $team->subscription_data = [
                    'id' => $subscription->id,
                    'expires_at' => $subscription->expires_at?->toISOString(),
                    'is_expired' => $subscription->isExpired(),
                    'is_soft_locked' => $subscription->is_soft_locked,
                    'days_remaining' => $subscription->getDaysUntilExpiry(),
                    'can_unlock' => $canUnlock,
                ];
            }
            // If no direct subscription AND owner is not exempt (patron/admin/system), check slot-based system
            elseif (!$ownerIsExempt && $teamOwner) {
                // Count owner's active team slots
                $ownerActiveSlots = Subscription::where('user_id', $teamOwner->id)
                    ->where('subscription_type', Subscription::TYPE_TEAM)
                    ->where('is_active', true)
                    ->where('expires_at', '>', now())
                    ->whereNull('entity_id') // Slot-based subscriptions only
                    ->count();

                // Count owner's total owned teams
                $ownerTeamCount = Team::where('project_owner_id', $teamOwner->id)->count();

                // If owner has more teams than slots, determine which teams should be locked
                // Teams without explicit subscription are locked if slots are exhausted
                if ($ownerTeamCount > $ownerActiveSlots) {
                    // This team should be soft-locked (no subscription found and slots exhausted)
                    $team->is_soft_locked = true;
                    $team->subscription_data = [
                        'id' => null,
                        'expires_at' => null,
                        'is_expired' => true,
                        'is_soft_locked' => true,
                        'days_remaining' => 0,
                        'can_unlock' => $canUnlock,
                        'reason' => 'no_slot', // Team has no subscription slot
                    ];
                }
            }
            // Patron users: teams are always active (no subscription needed)

            return $team;
        };

        $ownedTeams = $ownedTeams->map($addSubscriptionData);
        $memberTeams = $memberTeams->map($addSubscriptionData);

        // Calculate subscription info for free users (slot-based system)
        $subscriptionInfo = null;
        $isFreeUser = $user->user_type === 'free' || !$user->user_type;

        if ($isFreeUser) {
            // Count active team subscription SLOTS (not expired)
            // NOTE: Subscriptions are slot-based (entity_id = null), not tied to specific teams
            $activeSlots = Subscription::where('user_id', $user->id)
                ->where('subscription_type', Subscription::TYPE_TEAM)
                ->where('is_active', true)
                ->where('expires_at', '>', now())
                ->get();

            $activeSubscriptionsCount = $activeSlots->count();

            // Get the earliest expiring slot for warning purposes
            $earliestExpiry = $activeSlots->min('expires_at');
            $daysUntilExpiry = $earliestExpiry ? now()->diffInDays($earliestExpiry, false) : null;

            // Free users have: 0 free teams + number of active subscription slots
            $maxAllowedTeams = 0 + $activeSubscriptionsCount;
            $ownedTeamsCount = $ownedTeams->count();
            $availableSlots = $maxAllowedTeams - $ownedTeamsCount;

            $subscriptionInfo = [
                'active_slots' => $activeSubscriptionsCount,
                'owned_teams' => $ownedTeamsCount,
                'max_allowed' => $maxAllowedTeams,
                'available_slots' => max(0, $availableSlots),
                'needs_unlock' => $ownedTeamsCount >= $maxAllowedTeams,
                'earliest_expiry' => $earliestExpiry?->toISOString(),
                'days_until_expiry' => $daysUntilExpiry,
                'free_teams_allowed' => 0, // Teams are not free for free users
                // Legacy field for backwards compatibility
                'active_subscriptions' => $activeSubscriptionsCount,
            ];
        }

        return response()->json([
            'owned_teams' => $ownedTeams,
            'member_teams' => $memberTeams,
            'subscription_info' => $subscriptionInfo,
        ]);
    }

    /**
     * Store a newly created team
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validator = Validator::make($request->all(), [
            'name' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9_]+$/',
                Rule::unique('teams')->where(function ($query) use ($user) {
                    return $query->where('project_owner_id', $user->id);
                })
            ],
            'description' => 'nullable|string|max:1000',
            'project_ids' => 'required|array|min:1',
            'project_ids.*' => 'required|integer|exists:projects,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => __('teamcontrollerphp214'),
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if user needs to pay for team (Free users only)
        $isFreeUser = $user->user_type === 'free' || !$user->user_type;
        $needsPayment = false;
        $requiredCredits = 50;

        if ($isFreeUser) {
            // Count active team subscriptions
            $activeSubscriptionsCount = Subscription::countActiveForUser($user->id, Subscription::TYPE_TEAM);

            // Count owned teams
            $ownedTeamsCount = Team::where('project_owner_id', $user->id)->count();

            // Free users get 0 free teams, only subscription slots
            $maxAllowedTeams = 0 + $activeSubscriptionsCount;

            if ($ownedTeamsCount >= $maxAllowedTeams) {
                $needsPayment = true;

                // Check if user has enough credits
                if ($user->credits < $requiredCredits) {
                    return response()->json([
                        'message' => __('teamcontrollerphp240') . "{$requiredCredits}" . __('teamcontrollerphp240_2'),
                        'error_code' => 'INSUFFICIENT_CREDITS',
                        'required_credits' => $requiredCredits,
                        'current_credits' => $user->credits,
                    ], 402);
                }
            }
        }

        // Use transaction to ensure all-or-nothing operation
        try {
            $result = DB::transaction(function () use ($user, $request, $needsPayment, $requiredCredits) {
                // 1. Create the team first
                $team = Team::create([
                    'name' => $request->name,
                    'description' => $request->description,
                    'project_owner_id' => $user->id,
                ]);

                // 2. If payment needed, create subscription SLOT (not bound to specific team)
                // NOTE: entity_id is NULL - this is a "slot" subscription
                // This allows users to delete and recreate teams without losing their subscription benefit
                if ($needsPayment) {
                    Subscription::create([
                        'user_id' => $user->id,
                        'subscription_type' => Subscription::TYPE_TEAM,
                        'entity_id' => null, // SLOT-BASED: Not tied to specific team
                        'is_free_tier' => false,
                        'expires_at' => now()->addYear(),
                        'is_active' => true,
                    ]);
                }

                // 3. Add the creator as owner
                TeamMember::create([
                    'team_id' => $team->id,
                    'user_id' => $user->id,
                    'role' => 'owner',
                    'joined_at' => now()
                ]);

                // 4. Assign team to selected projects
                foreach ($request->project_ids as $projectId) {
                    $team->projects()->attach($projectId, [
                        'assigned_by' => $user->id,
                        'assigned_at' => now()
                    ]);
                }

                // 5. Deduct credits and record transaction (only after everything else succeeded)
                if ($needsPayment) {
                    $user->credits -= $requiredCredits;
                    $user->save();

                    \App\Models\CreditTransaction::create([
                        'user_id' => $user->id,
                        'amount' => -$requiredCredits,
                        'type' => 'teams_unlock',
                        'description' => __('teamcontrollerphp298')."{$request->name}",
                    ]);
                }

                return $team;
            });

            return response()->json([
                'message' => __('teamcontrollerphp306'),
                'team' => $result->load(['members.user', 'projects']),
                'credits_deducted' => $needsPayment ? $requiredCredits : 0,
                'new_credits_balance' => $user->fresh()->credits,
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => __('teamcontrollerphp314') . $e->getMessage(),
                'error_code' => 'TRANSACTION_FAILED',
            ], 500);
        }
    }

    /**
     * Display the specified team
     */
    public function show(Team $team): JsonResponse
    {
        $user = Auth::user();

        // Check if user has access to this team (using type-safe comparison)
        if (!$team->hasUser($user) && (string)$team->project_owner_id !== (string)$user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'team' => $team->load(['owner', 'members.user', 'projects'])
        ]);
    }

    /**
     * Update the specified team
     */
    public function update(Request $request, Team $team): JsonResponse
    {
        $user = Auth::user();
        $userRole = $team->getUserRole($user);

        // Only owners and admins can update team info
        if (!in_array($userRole, ['owner', 'admin'])) {
            return response()->json(['message' => __('teamcontrollerphp347')], 403);
        }

        // Check if team is soft-locked (subscription expired)
        if ($lockResponse = $this->checkTeamSoftLock($team)) {
            return $lockResponse;
        }

        $validator = Validator::make($request->all(), [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9_]+$/',
                Rule::unique('teams')->ignore($team->id)->where(function ($query) use ($team) {
                    return $query->where('project_owner_id', $team->project_owner_id);
                })
            ],
            'description' => 'nullable|string|max:1000',
            'project_ids' => 'sometimes|array|min:1',
            'project_ids.*' => 'required|integer|exists:projects,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => __('teamcontrollerphp372'),
                'errors' => $validator->errors()
            ], 422);
        }

        $team->update($request->only(['name', 'description']));

        // Update project assignments if provided
        if ($request->has('project_ids')) {
            // Remove all existing project assignments
            $team->projects()->detach();
            
            // Add new project assignments
            foreach ($request->project_ids as $projectId) {
                $team->projects()->attach($projectId, [
                    'assigned_by' => $user->id,
                    'assigned_at' => now()
                ]);
            }
        }

        return response()->json([
            'message' => __('teamcontrollerphp394'),
            'team' => $team->load(['members.user', 'projects'])
        ]);
    }

    /**
     * Remove the specified team
     */
    public function destroy(Team $team): JsonResponse
    {
        $user = Auth::user();

        // Only team owner can delete the team (using type-safe comparison)
        if ((string)$team->project_owner_id !== (string)$user->id) {
            return response()->json(['message' => __('teamcontrollerphp408')], 403);
        }

        $team->delete();

        return response()->json(['message' => __('teamcontrollerphp413')]);
    }

    /**
     * Remove a member from team
     */
    public function removeMember(Team $team, int $userId): JsonResponse
    {
        $user = Auth::user();
        $userRole = $team->getUserRole($user);

        // Check permissions
        if (!in_array($userRole, ['owner', 'admin']) && $user->id !== $userId) {
            return response()->json(['message' => __('teamcontrollerphp426')], 403);
        }

        // Check if team is soft-locked (subscription expired)
        if ($lockResponse = $this->checkTeamSoftLock($team)) {
            return $lockResponse;
        }

        $member = TeamMember::where('team_id', $team->id)
                           ->where('user_id', $userId)
                           ->first();

        if (!$member) {
            return response()->json(['message' => __('teamcontrollerphp439')], 404);
        }

        // Can't remove the team owner
        if ($member->role === 'owner') {
            return response()->json(['message' => __('teamcontrollerphp444')], 400);
        }

        $member->delete();

        // Send push notification to the removed user
        SendPushNotificationJob::dispatch(
            [$userId],
            __('push.team_removed'),
            $team->name,
            '/',
            'team'
        );

        return response()->json(['message' => __('teamcontrollerphp449')]);
    }

    /**
     * Update member role
     */
    public function updateMemberRole(Request $request, Team $team, int $userId): JsonResponse
    {
        $user = Auth::user();
        $userRole = $team->getUserRole($user);

        // Only owners and admins can change roles
        if (!in_array($userRole, ['owner', 'admin'])) {
            return response()->json(['message' => __('teamcontrollerphp462')], 403);
        }

        // Check if team is soft-locked (subscription expired)
        if ($lockResponse = $this->checkTeamSoftLock($team)) {
            return $lockResponse;
        }

        $validator = Validator::make($request->all(), [
            'role' => 'required|in:admin,member'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $member = TeamMember::where('team_id', $team->id)
                           ->where('user_id', $userId)
                           ->first();

        if (!$member) {
            return response()->json(['message' => __('teamcontrollerphp486')], 404);
        }

        // Can't change the owner's role
        if ($member->role === 'owner') {
            return response()->json(['message' => __('teamcontrollerphp491')], 400);
        }

        $member->update(['role' => $request->role]);

        return response()->json([
            'message' => __('teamcontrollerphp497'),
            'member' => $member->load('user')
        ]);
    }

    /**
     * Add a project member to this team
     */
    public function addMember(Request $request, Team $team): JsonResponse
    {
        $user = Auth::user();

        // Check if user is team owner (using type-safe comparison)
        if ((string)$team->project_owner_id !== (string)$user->id) {
            return response()->json(['message' => __('teamcontrollerphp511')], 403);
        }

        // Check if team is soft-locked (subscription expired)
        if ($lockResponse = $this->checkTeamSoftLock($team)) {
            return $lockResponse;
        }

        $validator = Validator::make($request->all(), [
            'user_id' => 'required|integer|exists:users,id',
            'role' => 'required|string|in:member,admin',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check if user is already a team member
        $existingMember = $team->members()->where('user_id', $request->user_id)->first();
        if ($existingMember) {
            return response()->json([
                'message' => __('teamcontrollerphp535')
            ], 409);
        }

        // Add the user to the team
        $member = TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $request->user_id,
            'role' => $request->role,
            'joined_at' => now(),
        ]);

        // Send push notification to the added user
        SendPushNotificationJob::dispatch(
            [$request->user_id],
            __('push.team_assigned'),
            $team->name,
            '/',
            'team'
        );

        return response()->json([
            'message' => __('teamcontrollerphp548'),
            'member' => $member->load('user')
        ], 201);
    }

    /**
     * Get team members
     */
    public function getMembers(Team $team): JsonResponse
    {
        $user = Auth::user();

        // Check if user has access to this team (using type-safe comparison)
        if (!$team->hasUser($user) && (string)$team->project_owner_id !== (string)$user->id) {
            return response()->json(['message' => __('teamcontrollerphp562')], 403);
        }

        $members = $team->members()
            ->with(['user'])
            ->orderBy('role', 'desc') // Owner first, then admin, then member
            ->orderBy('joined_at', 'asc')
            ->get()
            ->map(function ($membership) {
                return [
                    'id' => $membership->id,
                    'user_id' => $membership->user_id,
                    'role' => $membership->role,
                    'joined_at' => $membership->joined_at,
                    'user' => [
                        'id' => $membership->user->id,
                        'name' => $membership->user->name,
                        'email' => $membership->user->email,
                        'username' => $membership->user->username,
                    ]
                ];
            });

        return response()->json($members->values());
    }

    /**
     * Transfer team ownership to another user
     *
     * NEW SIMPLIFIED FLOW:
     * - Transfer is ALWAYS possible
     * - Owner can optionally transfer their slot with the team
     * - If recipient has no slot and owner doesn't transfer one:
     *   → Team is transferred but LOCKED (soft-locked)
     *   → Recipient can unlock it later (pay 50 credits) or transfer it further
     */
    public function transferOwnership(Request $request, Team $team): JsonResponse
    {
        $owner = Auth::user();

        // Only team owner can transfer
        if ((string)$team->project_owner_id !== (string)$owner->id) {
            return response()->json(['message' => __('teamcontrollerphp604')], 403);
        }

        $validator = Validator::make($request->all(), [
            'new_owner_id' => 'required|integer|exists:users,id',
            'transfer_slot' => 'boolean', // Whether to transfer a slot to the new owner
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => __('teamcontrollerphp614'),
                'errors' => $validator->errors()
            ], 422);
        }

        $newOwnerId = $request->new_owner_id;
        $transferSlot = $request->boolean('transfer_slot', false);

        // Cannot transfer to self
        if ((string)$newOwnerId === (string)$owner->id) {
            return response()->json(['message' => __('teamcontrollerphp624')], 400);
        }

        $newOwner = \App\Models\User::find($newOwnerId);
        if (!$newOwner) {
            return response()->json(['message' => __('teamcontrollerphp629')], 404);
        }

        // Check recipient's status
        $recipientIsPatron = $newOwner->user_type === 'patron';
        $recipientIsFree = $newOwner->user_type === 'free' || !$newOwner->user_type;

        // Check if recipient has team slots
        $recipientHasAvailableSlot = false;
        if ($recipientIsFree) {
            $recipientActiveSlots = Subscription::where('user_id', $newOwnerId)
                ->where('subscription_type', Subscription::TYPE_TEAM)
                ->where('is_active', true)
                ->where('expires_at', '>', now())
                ->count();

            $recipientOwnedTeams = Team::where('project_owner_id', $newOwnerId)->count();
            $recipientMaxTeams = 0 + $recipientActiveSlots;
            $recipientHasAvailableSlot = $recipientOwnedTeams < $recipientMaxTeams;
        }

        // Check owner's slots (for potential transfer)
        $ownerSlot = null;
        if ($transferSlot) {
            $ownerSlot = Subscription::where('user_id', $owner->id)
                ->where('subscription_type', Subscription::TYPE_TEAM)
                ->where('is_active', true)
                ->where('expires_at', '>', now())
                ->first();

            if (!$ownerSlot) {
                return response()->json([
                    'message' => __('teamcontrollerphp661'),
                    'error_code' => 'NO_SLOT_TO_TRANSFER',
                ], 400);
            }
        }

        // Determine if team will be locked after transfer
        $teamWillBeLocked = false;
        if ($recipientIsFree && !$recipientHasAvailableSlot && !$transferSlot) {
            // Recipient is free user without available slot and owner is not transferring a slot
            $teamWillBeLocked = true;
        }

        // Execute transfer in transaction
        try {
            $result = DB::transaction(function () use ($team, $owner, $newOwner, $transferSlot, $ownerSlot, $teamWillBeLocked) {
                $slotTransferred = false;
                $unlinkedProjects = [];

                // 1. Transfer slot if requested
                if ($transferSlot && $ownerSlot) {
                    $ownerSlot->user_id = $newOwner->id;
                    $ownerSlot->save();
                    $slotTransferred = true;
                }

                // 2. Remove project links that the new owner shouldn't have access to
                // Keep: public projects, projects owned by new owner
                // Remove: private projects owned by old owner or others
                $linkedProjects = $team->projects()->get();
                foreach ($linkedProjects as $project) {
                    $isPublic = $project->is_public;
                    $ownedByNewOwner = (string)$project->project_owner_id === (string)$newOwner->id;

                    if (!$isPublic && !$ownedByNewOwner) {
                        // Remove this project link
                        DB::table('project_teams')
                            ->where('team_id', $team->id)
                            ->where('project_id', $project->id)
                            ->delete();

                        $unlinkedProjects[] = $project->name;
                    }
                }

                // 3. Update team ownership
                $team->project_owner_id = $newOwner->id;
                $team->save();

                // 4. If team will be locked, create a soft-locked subscription marker
                // (The team will be soft-locked because recipient has no valid slot)
                if ($teamWillBeLocked) {
                    // Create an expired subscription so the team appears as soft-locked
                    // The recipient can renew it to unlock
                    Subscription::create([
                        'user_id' => $newOwner->id,
                        'subscription_type' => Subscription::TYPE_TEAM,
                        'entity_id' => $team->id, // Link to specific team for soft-lock tracking
                        'is_free_tier' => false,
                        'expires_at' => now()->subDay(), // Already expired = soft-locked
                        'is_active' => true,
                        'is_soft_locked' => true,
                    ]);
                }

                // 5. Update team member roles
                // Old owner becomes admin
                $oldOwnerMember = TeamMember::where('team_id', $team->id)
                    ->where('user_id', $owner->id)
                    ->first();

                if ($oldOwnerMember) {
                    $oldOwnerMember->role = 'admin';
                    $oldOwnerMember->save();
                }

                // New owner gets owner role
                $newOwnerMember = TeamMember::where('team_id', $team->id)
                    ->where('user_id', $newOwner->id)
                    ->first();

                if ($newOwnerMember) {
                    $newOwnerMember->role = 'owner';
                    $newOwnerMember->save();
                } else {
                    TeamMember::create([
                        'team_id' => $team->id,
                        'user_id' => $newOwner->id,
                        'role' => 'owner',
                        'joined_at' => now(),
                    ]);
                }

                return [
                    'slot_transferred' => $slotTransferred,
                    'team_locked' => $teamWillBeLocked,
                    'unlinked_projects' => $unlinkedProjects,
                ];
            });

            $message = __('teamcontrollerphp761');
            if ($result['team_locked']) {
                $message .= __('teamcontrollerphp781');
            } elseif ($result['slot_transferred']) {
                $message .= ' (inkl. Slot)';
            }

            // Add info about unlinked projects
            $unlinkedCount = count($result['unlinked_projects']);
            if ($unlinkedCount > 0) {
                $message .= ". {$unlinkedCount}" . __('teamcontrollerphp789');
            }

            return response()->json([
                'message' => $message,
                'team' => $team->fresh()->load(['owner', 'members.user', 'projects']),
                'slot_transferred' => $result['slot_transferred'],
                'team_locked' => $result['team_locked'],
                'unlinked_projects' => $result['unlinked_projects'],
                'unlinked_count' => $unlinkedCount,
            ]);

        } catch (\Exception $e) {
            \Log::error("Team transfer failed", [
                'team_id' => $team->id,
                'from_user' => $owner->id,
                'to_user' => $newOwnerId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('teamcontrollerphp810') . $e->getMessage(),
                'error_code' => 'TRANSFER_FAILED',
            ], 500);
        }
    }

    /**
     * Check transfer eligibility before initiating transfer
     * Returns info about what options are available
     *
     * NEW SIMPLIFIED LOGIC:
     * - Transfer is ALWAYS possible
     * - Shows if team will be locked or not after transfer
     * - Owner can choose to transfer their slot
     */
    public function checkTransferEligibility(Request $request, Team $team): JsonResponse
    {
        $owner = Auth::user();

        // Only team owner can check transfer
        if ((string)$team->project_owner_id !== (string)$owner->id) {
            return response()->json(['message' => __('teamcontrollerphp831')], 403);
        }

        $validator = Validator::make($request->all(), [
            'new_owner_id' => 'required|integer|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => __('teamcontrollerphp822'),
                'errors' => $validator->errors()
            ], 422);
        }

        $newOwnerId = $request->new_owner_id;
        $newOwner = \App\Models\User::find($newOwnerId);

        if (!$newOwner) {
            return response()->json(['message' => __('teamcontrollerphp849')], 404);
        }

        // Check recipient status
        $recipientIsPatron = $newOwner->user_type === 'patron';
        $recipientIsFree = $newOwner->user_type === 'free' || !$newOwner->user_type;

        $recipientActiveSlots = 0;
        $recipientOwnedTeams = 0;
        $recipientMaxTeams = 0;
        $recipientHasAvailableSlot = false;

        if ($recipientIsFree) {
            $recipientActiveSlots = Subscription::where('user_id', $newOwnerId)
                ->where('subscription_type', Subscription::TYPE_TEAM)
                ->where('is_active', true)
                ->where('expires_at', '>', now())
                ->count();

            $recipientOwnedTeams = Team::where('project_owner_id', $newOwnerId)->count();
            $recipientMaxTeams = 0 + $recipientActiveSlots;
            $recipientHasAvailableSlot = $recipientOwnedTeams < $recipientMaxTeams;
        }

        // Check owner's slots
        $ownerHasSlot = false;
        $ownerSlotExpiry = null;

        $ownerSlot = Subscription::where('user_id', $owner->id)
            ->where('subscription_type', Subscription::TYPE_TEAM)
            ->where('is_active', true)
            ->where('expires_at', '>', now())
            ->first();

        if ($ownerSlot) {
            $ownerHasSlot = true;
            $ownerSlotExpiry = $ownerSlot->expires_at?->toISOString();
        }

        // Determine what happens in each scenario
        $willBeActiveWithoutSlot = $recipientIsPatron || $recipientHasAvailableSlot;
        $willBeActiveWithSlot = true; // If owner transfers slot, always active
        $willBeLockedWithoutSlot = !$willBeActiveWithoutSlot;

        // Analyze project links that will be affected by transfer
        // Links to private projects owned by the OLD owner will be removed
        // Links to public projects or projects owned by the NEW owner will remain
        $linkedProjects = $team->projects()->get();
        $projectsToUnlink = [];
        $projectsToKeep = [];

        foreach ($linkedProjects as $project) {
            $isPublic = $project->is_public;
            $ownedByNewOwner = (string)$project->project_owner_id === (string)$newOwnerId;
            $ownedByOldOwner = (string)$project->project_owner_id === (string)$owner->id;

            if ($isPublic || $ownedByNewOwner) {
                // Keep: public projects or projects owned by new owner
                $projectsToKeep[] = [
                    'id' => $project->id,
                    'name' => $project->name,
                    'is_public' => $isPublic,
                    'reason' => $isPublic ? 'public' : 'owned_by_recipient',
                ];
            } elseif ($ownedByOldOwner) {
                // Unlink: private projects owned by old owner
                $projectsToUnlink[] = [
                    'id' => $project->id,
                    'name' => $project->name,
                    'is_public' => false,
                    'reason' => 'private_owned_by_you',
                    'hint' => __('teamcontrollerphp902'),
                ];
            } else {
                // Unlink: private projects owned by someone else (edge case)
                $projectsToUnlink[] = [
                    'id' => $project->id,
                    'name' => $project->name,
                    'is_public' => false,
                    'reason' => 'private_third_party',
                ];
            }
        }

        return response()->json([
            'recipient' => [
                'id' => $newOwner->id,
                'name' => $newOwner->name,
                'username' => $newOwner->username,
                'is_patron' => $recipientIsPatron,
                'is_free' => $recipientIsFree,
                'active_slots' => $recipientActiveSlots,
                'owned_teams' => $recipientOwnedTeams,
                'max_teams' => $recipientIsPatron ? 'unlimited' : $recipientMaxTeams,
                'has_available_slot' => $recipientHasAvailableSlot,
            ],
            'owner' => [
                'has_slot' => $ownerHasSlot,
                'slot_expiry' => $ownerSlotExpiry,
            ],
            'transfer_outcomes' => [
                'without_slot' => [
                    'team_active' => $willBeActiveWithoutSlot,
                    'team_locked' => $willBeLockedWithoutSlot,
                ],
                'with_slot' => [
                    'team_active' => $willBeActiveWithSlot,
                    'team_locked' => false,
                    'available' => $ownerHasSlot,
                ],
            ],
            // Project link analysis
            'project_links' => [
                'total' => count($linkedProjects),
                'to_keep' => $projectsToKeep,
                'to_unlink' => $projectsToUnlink,
                'unlink_count' => count($projectsToUnlink),
            ],
            // Transfer is ALWAYS possible now
            'can_transfer' => true,
        ]);
    }

    /**
     * Update project links for a team
     */
    public function updateProjectLinks(Request $request, $teamId)
    {
        $user = Auth::user();
        $team = Team::findOrFail($teamId);

        // Check if user is team member
        if (!$team->isMember($user->id)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'project_ids' => 'required|array',
            'project_ids.*' => 'integer|exists:projects,id'
        ]);

        $newProjectIds = $validated['project_ids'];

        // Get current linked projects
        $currentProjectIds = \DB::table('project_teams')
            ->where('team_id', $team->id)
            ->pluck('project_id')
            ->toArray();

        // Determine which to add and which to remove
        $toAdd = array_diff($newProjectIds, $currentProjectIds);
        $toRemove = array_diff($currentProjectIds, $newProjectIds);

        // Remove unlinked projects
        if (!empty($toRemove)) {
            \DB::table('project_teams')
                ->where('team_id', $team->id)
                ->whereIn('project_id', $toRemove)
                ->delete();
        }

        // Add new linked projects
        foreach ($toAdd as $projectId) {
            $project = Project::find($projectId);

            // Check if user has access to this project
            if (!$project || !$project->userCanAccess($user)) {
                continue;
            }

            \DB::table('project_teams')->updateOrInsert(
                [
                    'project_id' => $projectId,
                    'team_id' => $team->id
                ],
                [
                    'assigned_by' => $user->id,
                    'assigned_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now()
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => __('teamcontrollerphp1017')
        ]);
    }

    /**
     * Unlock a team by purchasing a new slot subscription
     * This is used when a team has no subscription (was created via slot system)
     * or when the team was transferred as locked
     */
    public function unlockTeam(Request $request, Team $team): JsonResponse
    {
        $user = Auth::user();

        // Only team owner or admin can unlock
        $userRole = $team->getUserRole($user);
        if (!in_array($userRole, ['owner', 'admin'])) {
            return response()->json([
                'message' => __('teamcontrollerphp1034'),
                'error_code' => 'INSUFFICIENT_PERMISSIONS',
            ], 403);
        }

        // Patron users don't need to unlock (their teams are never locked)
        if ($user->user_type === 'patron') {
            return response()->json([
                'message' => __('teamcontrollerphp1042'),
                'error_code' => 'NOT_REQUIRED',
            ], 400);
        }

        $requiredCredits = 50;

        // Check if user has enough credits
        if ($user->credits < $requiredCredits) {
            return response()->json([
                'message' => __('teamcontrollerphp1052'),
                'error_code' => 'INSUFFICIENT_CREDITS',
                'required_credits' => $requiredCredits,
                'current_credits' => $user->credits,
            ], 400);
        }

        try {
            $result = DB::transaction(function () use ($team, $user, $requiredCredits) {
                // Check if team already has an active subscription (soft-locked one)
                $existingSubscription = $team->subscription;

                if ($existingSubscription) {
                    // Renew existing subscription
                    $existingSubscription->expires_at = now()->addYear();
                    $existingSubscription->is_active = true;
                    $existingSubscription->is_soft_locked = false;
                    $existingSubscription->entity_id = null; // Convert to slot-based
                    $existingSubscription->save();

                    $subscription = $existingSubscription;
                } else {
                    // Create new slot-based subscription
                    $subscription = Subscription::create([
                        'user_id' => $user->id,
                        'subscription_type' => Subscription::TYPE_TEAM,
                        'entity_id' => null, // Slot-based
                        'expires_at' => now()->addYear(),
                        'is_active' => true,
                        'is_soft_locked' => false,
                    ]);
                }

                // Deduct credits
                $user->credits -= $requiredCredits;
                $user->save();

                // Record transaction
                \App\Models\CreditTransaction::create([
                    'user_id' => $user->id,
                    'amount' => -$requiredCredits,
                    'type' => 'teams_unlock',
                    'description' => __('teamcontrollerphp1094')."{$team->name}",
                ]);

                return $subscription;
            });

            return response()->json([
                'message' => __('teamcontrollerphp1101'),
                'subscription' => $result,
                'credits_deducted' => $requiredCredits,
                'new_credits_balance' => $user->fresh()->credits,
                'expires_at' => $result->expires_at->toISOString(),
            ]);

        } catch (\Exception $e) {
            \Log::error("Team unlock failed", [
                'team_id' => $team->id,
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => __('teamcontrollerphp1116') . $e->getMessage(),
                'error_code' => 'UNLOCK_FAILED',
            ], 500);
        }
    }
}
