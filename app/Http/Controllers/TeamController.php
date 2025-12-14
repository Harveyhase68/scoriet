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

class TeamController extends Controller
{

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
                             ->with(['owner', 'members.user', 'projects'])
                             ->get();

            $memberTeamIds = TeamMember::where('user_id', $user->id)->pluck('team_id');
            $memberTeams = Team::whereIn('id', $memberTeamIds)
                               ->where('project_owner_id', '!=', $user->id) // Exclude owned teams
                               ->with(['owner', 'members.user', 'projects'])
                               ->get();
        } else {
            // Get teams filtered by project (for Team Assignment)
            // Get teams assigned to the specified project through project_teams table
            $ownedTeamIds = Team::where('project_owner_id', $user->id)->pluck('id');
            $ownedTeams = Team::whereIn('id', $ownedTeamIds)
                               ->whereHas('projects', function($query) use ($projectId) {
                                   $query->where('project_id', $projectId);
                               })
                               ->with(['owner', 'members.user', 'projects'])
                               ->get();

            $memberTeamIds = TeamMember::where('user_id', $user->id)->pluck('team_id');
            $memberTeams = Team::whereIn('id', $memberTeamIds)
                               ->where('project_owner_id', '!=', $user->id) // Exclude owned teams
                               ->whereHas('projects', function($query) use ($projectId) {
                                   $query->where('project_id', $projectId);
                               })
                               ->with(['owner', 'members.user', 'projects'])
                               ->get();
        }

        // Calculate subscription info for free users
        $subscriptionInfo = null;
        $isFreeUser = $user->user_type === 'free' || !$user->user_type;

        if ($isFreeUser) {
            // Count active team subscriptions (not expired)
            $activeSubscriptionsCount = Subscription::countActiveForUser($user->id, Subscription::TYPE_TEAM);

            // Free users have: 0 free teams + number of active subscriptions
            $maxAllowedTeams = 0 + $activeSubscriptionsCount;
            $ownedTeamsCount = $ownedTeams->count();

            $subscriptionInfo = [
                'active_subscriptions' => $activeSubscriptionsCount,
                'owned_teams' => $ownedTeamsCount,
                'max_allowed' => $maxAllowedTeams,
                'needs_unlock' => $ownedTeamsCount >= $maxAllowedTeams,
                'free_teams_allowed' => 0, // Teams are not free for free users
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
                'message' => 'Validation failed',
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
                        'message' => "Nicht genug Credits. Sie benötigen {$requiredCredits} Credits um ein neues Team freizuschalten.",
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

                // 2. If payment needed, create subscription for this team
                if ($needsPayment) {
                    Subscription::create([
                        'user_id' => $user->id,
                        'subscription_type' => Subscription::TYPE_TEAM,
                        'entity_id' => $team->id,
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
                        'description' => "Team freischalten: {$request->name}",
                    ]);
                }

                return $team;
            });

            return response()->json([
                'message' => 'Team created successfully',
                'team' => $result->load(['members.user', 'projects']),
                'credits_deducted' => $needsPayment ? $requiredCredits : 0,
                'new_credits_balance' => $user->fresh()->credits,
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create team: ' . $e->getMessage(),
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
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
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
                'message' => 'Validation failed',
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
            'message' => 'Team updated successfully',
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
            return response()->json(['message' => 'Only team owner can delete the team'], 403);
        }

        $team->delete();

        return response()->json(['message' => 'Team deleted successfully']);
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
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $member = TeamMember::where('team_id', $team->id)
                           ->where('user_id', $userId)
                           ->first();

        if (!$member) {
            return response()->json(['message' => 'Member not found'], 404);
        }

        // Can't remove the team owner
        if ($member->role === 'owner') {
            return response()->json(['message' => 'Cannot remove team owner'], 400);
        }

        $member->delete();

        return response()->json(['message' => 'Member removed successfully']);
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
            return response()->json(['message' => 'Insufficient permissions'], 403);
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
            return response()->json(['message' => 'Member not found'], 404);
        }

        // Can't change the owner's role
        if ($member->role === 'owner') {
            return response()->json(['message' => 'Cannot change owner role'], 400);
        }

        $member->update(['role' => $request->role]);

        return response()->json([
            'message' => 'Member role updated successfully',
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
            return response()->json(['message' => 'Unauthorized'], 403);
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
                'message' => 'User is already a member of this team'
            ], 409);
        }

        // Add the user to the team
        $member = TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $request->user_id,
            'role' => $request->role,
            'joined_at' => now(),
        ]);

        return response()->json([
            'message' => 'Member added to team successfully',
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
            return response()->json(['message' => 'Unauthorized'], 403);
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
            'message' => 'Team-Verknüpfungen erfolgreich aktualisiert'
        ]);
    }
}
