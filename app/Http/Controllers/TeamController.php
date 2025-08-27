<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Team;
use App\Models\TeamMember;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Routing\Controller;

class TeamController extends Controller
{

    /**
     * Get user's teams (owned + member of)
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $projectName = $request->get('project', 'default');

        // Get teams where user is owner
        $ownedTeams = Team::where('project_owner_id', $user->id)
                         ->where('project_name', $projectName)
                         ->with(['members.user', 'pendingInvitations'])
                         ->get();

        // Get teams where user is a member
        $memberTeamIds = TeamMember::where('user_id', $user->id)->pluck('team_id');
        $memberTeams = Team::whereIn('id', $memberTeamIds)
                           ->where('project_name', $projectName)
                           ->where('project_owner_id', '!=', $user->id) // Exclude owned teams
                           ->with(['owner', 'members.user', 'pendingInvitations'])
                           ->get();

        return response()->json([
            'owned_teams' => $ownedTeams,
            'member_teams' => $memberTeams
        ]);
    }

    /**
     * Store a newly created team
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'project_name' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();

        // Create the team
        $team = Team::create([
            'name' => $request->name,
            'description' => $request->description,
            'project_owner_id' => $user->id,
            'project_name' => $request->project_name,
        ]);

        // Add the creator as owner
        TeamMember::create([
            'team_id' => $team->id,
            'user_id' => $user->id,
            'role' => 'owner',
            'joined_at' => now()
        ]);

        return response()->json([
            'message' => 'Team created successfully',
            'team' => $team->load(['members.user', 'pendingInvitations'])
        ], 201);
    }

    /**
     * Display the specified team
     */
    public function show(Team $team): JsonResponse
    {
        $user = Auth::user();

        // Check if user has access to this team
        if (!$team->hasUser($user) && $team->project_owner_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'team' => $team->load(['owner', 'members.user', 'invitations.inviter'])
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
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $team->update($request->only(['name', 'description']));

        return response()->json([
            'message' => 'Team updated successfully',
            'team' => $team->load(['members.user', 'pendingInvitations'])
        ]);
    }

    /**
     * Remove the specified team
     */
    public function destroy(Team $team): JsonResponse
    {
        $user = Auth::user();

        // Only team owner can delete the team
        if ($team->project_owner_id !== $user->id) {
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
}
