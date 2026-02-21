<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\TeamRole;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class TeamRoleController extends Controller
{
    /**
     * Get all available permissions grouped by category
     * GET /api/team-roles/permissions
     */
    public function getPermissions(): JsonResponse
    {
        $permissions = Permission::all()->groupBy('category')->map(function ($group) {
            return $group->map(function ($permission) {
                return [
                    'id' => $permission->id,
                    'name' => $permission->name,
                    'display_name' => $permission->display_name,
                    'description' => $permission->description,
                ];
            })->values();
        });

        return response()->json(['permissions' => $permissions]);
    }

    /**
     * Get system default roles
     * GET /api/team-roles/system-roles
     */
    public function getSystemRoles(): JsonResponse
    {
        $roles = TeamRole::getSystemRoles()->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
                'description' => $role->description,
                'is_system' => $role->is_system,
                'sort_order' => $role->sort_order,
                'permissions' => $role->permissions->pluck('id')->toArray(),
            ];
        });

        return response()->json(['roles' => $roles]);
    }

    /**
     * Get roles for a specific team
     * GET /api/teams/{teamId}/roles
     */
    public function getTeamRoles(int $teamId): JsonResponse
    {
        $team = Team::find($teamId);
        if (!$team) {
            return response()->json(['message' => __('teamrolecontrollerphp66')], 404);
        }

        // Check access
        if (!$this->canAccessTeam($team)) {
            return response()->json(['message' => __('teamrolecontrollerphp71')], 403);
        }

        // Get roles for this team (team-specific roles only)
        $roles = TeamRole::getRolesForTeam($teamId)->map(function ($role) use ($teamId) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
                'description' => $role->description,
                'is_owner_role' => $role->slug === 'owner', // Owner role cannot be deleted
                'sort_order' => $role->sort_order,
                'permissions' => $role->permissions->pluck('id')->toArray(),
                'member_count' => TeamMember::where('team_id', $teamId)
                    ->where('team_role_id', $role->id)
                    ->count(),
            ];
        });

        return response()->json(['roles' => $roles]);
    }

    /**
     * Create a custom role for a team
     * POST /api/teams/{teamId}/roles
     */
    public function createRole(Request $request, int $teamId): JsonResponse
    {
        $team = Team::find($teamId);
        if (!$team) {
            return response()->json(['message' => __('teamrolecontrollerphp101')], 404);
        }

        // Check manage roles permission
        if (!$this->canManageRoles($team)) {
            return response()->json(['message' => __('teamrolecontrollerphp106')], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'permissions' => 'sometimes|array',
            'permissions.*' => 'integer|exists:permissions,id',
            'copy_from_role_id' => 'nullable|integer|exists:team_roles,id',
        ]);

        // Check for duplicate name in this team
        $existingName = TeamRole::where('team_id', $teamId)
            ->whereRaw('LOWER(name) = ?', [strtolower(trim($validated['name']))])
            ->exists();
        if ($existingName) {
            return response()->json([
                'message' => __('teamrolecontrollerphp123'),
            ], 422);
        }

        // Generate slug
        $slug = Str::slug($validated['name']);

        // Check for duplicate slug in this team
        $existingSlug = TeamRole::where('team_id', $teamId)
            ->where('slug', $slug)
            ->exists();
        if ($existingSlug) {
            $slug = $slug . '-' . time();
        }

        // Get max sort order
        $maxSortOrder = TeamRole::where(function ($query) use ($teamId) {
            $query->where('team_id', $teamId)
                ->orWhereNull('team_id');
        })->max('sort_order') ?? 0;

        // Create the role
        $role = TeamRole::create([
            'team_id' => $teamId,
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'is_system' => false,
            'sort_order' => $maxSortOrder + 1,
        ]);

        // Copy permissions from another role if specified
        if (!empty($validated['copy_from_role_id'])) {
            $sourceRole = TeamRole::find($validated['copy_from_role_id']);
            if ($sourceRole) {
                $permissionIds = $sourceRole->permissions()->pluck('permissions.id')->toArray();
                $role->syncPermissions($permissionIds);
            }
        } elseif (!empty($validated['permissions'])) {
            // Or set permissions directly
            $role->syncPermissions($validated['permissions']);
        }

        return response()->json([
            'message' => __('teamrolecontrollerphp167'),
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
                'description' => $role->description,
                'is_owner_role' => $role->slug === 'owner',
                'sort_order' => $role->sort_order,
                'permissions' => $role->permissions->pluck('id')->toArray(),
                'member_count' => 0,
            ],
        ], 201);
    }

    /**
     * Update a team role
     * PUT /api/teams/{teamId}/roles/{roleId}
     */
    public function updateRole(Request $request, int $teamId, int $roleId): JsonResponse
    {
        $team = Team::find($teamId);
        if (!$team) {
            return response()->json(['message' => __('teamrolecontrollerphp189')], 404);
        }

        if (!$this->canManageRoles($team)) {
            return response()->json(['message' => __('teamrolecontrollerphp193')], 403);
        }

        $role = TeamRole::find($roleId);
        if (!$role) {
            return response()->json(['message' => __('teamrolecontrollerphp198')], 404);
        }

        // Can only edit roles belonging to this team
        if ($role->team_id !== $teamId) {
            return response()->json(['message' => __('teamrolecontrollerphp203')], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'description' => 'nullable|string|max:500',
            'permissions' => 'sometimes|array',
            'permissions.*' => 'integer|exists:permissions,id',
        ]);

        // Check for duplicate name in this team (excluding current role)
        if (isset($validated['name'])) {
            $existingName = TeamRole::where('team_id', $teamId)
                ->whereRaw('LOWER(name) = ?', [strtolower(trim($validated['name']))])
                ->where('id', '!=', $roleId)
                ->exists();
            if ($existingName) {
                return response()->json([
                    'message' => __('teamrolecontrollerphp221'),
                ], 422);
            }
        }

        // Update name/description
        if (isset($validated['name'])) {
            $role->name = $validated['name'];
        }
        if (array_key_exists('description', $validated)) {
            $role->description = $validated['description'];
        }
        $role->save();

        // Update permissions
        if (isset($validated['permissions'])) {
            $role->syncPermissions($validated['permissions']);
        }

        return response()->json([
            'message' => __('teamrolecontrollerphp241'),
            'role' => [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
                'description' => $role->description,
                'is_owner_role' => $role->slug === 'owner',
                'sort_order' => $role->sort_order,
                'permissions' => $role->permissions->pluck('id')->toArray(),
                'member_count' => TeamMember::where('team_id', $teamId)
                    ->where('team_role_id', $role->id)
                    ->count(),
            ],
        ]);
    }

    /**
     * Delete a team role
     * DELETE /api/teams/{teamId}/roles/{roleId}
     */
    public function deleteRole(int $teamId, int $roleId): JsonResponse
    {
        $team = Team::find($teamId);
        if (!$team) {
            return response()->json(['message' => __('teamrolecontrollerphp265')], 404);
        }

        if (!$this->canManageRoles($team)) {
            return response()->json(['message' => __('teamrolecontrollerphp269')], 403);
        }

        $role = TeamRole::find($roleId);
        if (!$role) {
            return response()->json(['message' => __('teamrolecontrollerphp274')], 404);
        }

        // Can only delete roles belonging to this team
        if ($role->team_id !== $teamId) {
            return response()->json(['message' => __('teamrolecontrollerphp279')], 403);
        }

        // Cannot delete the Owner role (slug = 'owner')
        if ($role->slug === 'owner') {
            return response()->json(['message' => __('teamrolecontrollerphp284')], 422);
        }

        // Check if any members have this role
        $memberCount = TeamMember::where('team_id', $teamId)
            ->where('team_role_id', $roleId)
            ->count();

        if ($memberCount > 0) {
            return response()->json([
                'message' => __('teamrolecontrollerphp294')."{$memberCount}".__('teamrolecontrollerphp294_2'),
            ], 422);
        }

        $role->delete();

        return response()->json(['message' => __('teamrolecontrollerphp300')]);
    }

    /**
     * Assign a role to a team member
     * PUT /api/teams/{teamId}/members/{memberId}/role
     */
    public function assignRoleToMember(Request $request, int $teamId, int $memberId): JsonResponse
    {
        $team = Team::find($teamId);
        if (!$team) {
            return response()->json(['message' => __('teamrolecontrollerphp311')], 404);
        }

        if (!$this->canManageRoles($team)) {
            return response()->json(['message' => __('teamrolecontrollerphp315')], 403);
        }

        $member = TeamMember::where('team_id', $teamId)
            ->where('id', $memberId)
            ->first();

        if (!$member) {
            return response()->json(['message' => __('teamrolecontrollerphp323')], 404);
        }

        // Get team_role_id from request - handle null, empty string, and valid integers
        $teamRoleId = $request->input('team_role_id');

        // Normalize null values
        if ($teamRoleId === '' || $teamRoleId === 'null' || $teamRoleId === 0) {
            $teamRoleId = null;
        }

        // Validate if not null
        if ($teamRoleId !== null) {
            $teamRoleId = (int) $teamRoleId;
            $role = TeamRole::find($teamRoleId);

            if (!$role) {
                return response()->json(['message' => __('teamrolecontrollerphp340')], 422);
            }

            // Verify role is valid for this team (team-specific or system default)
            if ($role->team_id !== null && $role->team_id !== $teamId) {
                return response()->json(['message' => __('teamrolecontrollerphp345')], 422);
            }
        }

        $member->team_role_id = $teamRoleId;
        $member->save();

        $member->load(['user', 'teamRole.permissions']);

        return response()->json([
            'message' => 'Role assigned successfully',
            'member' => [
                'id' => $member->id,
                'user_id' => $member->user_id,
                'username' => $member->user->username,
                'email' => $member->user->email,
                'role' => $member->role,  // legacy role
                'team_role_id' => $member->team_role_id,
                'team_role' => $member->teamRole ? [
                    'id' => $member->teamRole->id,
                    'name' => $member->teamRole->name,
                    'slug' => $member->teamRole->slug,
                ] : null,
            ],
        ]);
    }

    /**
     * Get members of a team with their roles
     * GET /api/teams/{teamId}/members-with-roles
     */
    public function getMembersWithRoles(int $teamId): JsonResponse
    {
        $team = Team::find($teamId);
        if (!$team) {
            return response()->json(['message' => __('teamrolecontrollerphp380')], 404);
        }

        if (!$this->canAccessTeam($team)) {
            return response()->json(['message' => __('teamrolecontrollerphp384')], 403);
        }

        $members = TeamMember::where('team_id', $teamId)
            ->with(['user', 'teamRole.permissions'])
            ->get()
            ->map(function ($member) {
                return [
                    'id' => $member->id,
                    'user_id' => $member->user_id,
                    'username' => $member->user->username,
                    'email' => $member->user->email,
                    'avatar_url' => $member->user->avatar_url ?? null,
                    'role' => $member->role,  // legacy role
                    'team_role_id' => $member->team_role_id,
                    'team_role' => $member->teamRole ? [
                        'id' => $member->teamRole->id,
                        'name' => $member->teamRole->name,
                        'slug' => $member->teamRole->slug,
                        'description' => $member->teamRole->description,
                        'permissions' => $member->teamRole->permissions->pluck('name')->toArray(),
                    ] : null,
                    'joined_at' => $member->joined_at,
                ];
            });

        return response()->json(['members' => $members]);
    }

    /**
     * Create a copy of a role for customization
     * POST /api/teams/{teamId}/roles/{roleId}/copy
     */
    public function copyRoleToTeam(int $teamId, int $roleId): JsonResponse
    {
        $team = Team::find($teamId);
        if (!$team) {
            return response()->json(['message' => __('teamrolecontrollerphp421')], 404);
        }

        if (!$this->canManageRoles($team)) {
            return response()->json(['message' => __('teamrolecontrollerphp425')], 403);
        }

        $sourceRole = TeamRole::find($roleId);
        if (!$sourceRole) {
            return response()->json(['message' => __('teamrolecontrollerphp430')], 404);
        }

        // Can only copy roles from this team
        if ($sourceRole->team_id !== $teamId && $sourceRole->team_id !== null) {
            return response()->json(['message' => __('teamrolecontrollerphp435')], 422);
        }

        // Generate unique name and slug for the copy
        $baseName = $sourceRole->name . ' (Kopie)';
        $baseSlug = $sourceRole->slug . '-copy';

        // Check for duplicates and add number if needed
        $counter = 1;
        $newName = $baseName;
        $newSlug = $baseSlug;

        while (TeamRole::where('team_id', $teamId)->where('slug', $newSlug)->exists()) {
            $counter++;
            $newName = $sourceRole->name . ' (Kopie ' . $counter . ')';
            $newSlug = $sourceRole->slug . '-copy-' . $counter;
        }

        // Get max sort order
        $maxSortOrder = TeamRole::where('team_id', $teamId)->max('sort_order') ?? 0;

        // Create the new role
        $newRole = TeamRole::create([
            'team_id' => $teamId,
            'name' => $newName,
            'slug' => $newSlug,
            'description' => $sourceRole->description,
            'is_system' => false,
            'sort_order' => $maxSortOrder + 1,
        ]);

        // Copy permissions
        $permissionIds = $sourceRole->permissions()->pluck('permissions.id')->toArray();
        $newRole->syncPermissions($permissionIds);

        return response()->json([
            'message' => __('teamrolecontrollerphp471'),
            'role' => [
                'id' => $newRole->id,
                'name' => $newRole->name,
                'slug' => $newRole->slug,
                'description' => $newRole->description,
                'is_owner_role' => false,
                'sort_order' => $newRole->sort_order,
                'permissions' => $newRole->permissions->pluck('id')->toArray(),
                'member_count' => 0,
            ],
        ], 201);
    }

    /**
     * Helper: Check if current user can access team
     */
    private function canAccessTeam(Team $team): bool
    {
        $user = Auth::user();

        // Owner always has access
        if ($team->project_owner_id === $user->id) {
            return true;
        }

        // Team member has access
        return $team->isMember($user->id);
    }

    /**
     * Helper: Check if current user can manage roles
     */
    private function canManageRoles(Team $team): bool
    {
        $user = Auth::user();

        // Owner always can manage
        if ($team->project_owner_id === $user->id) {
            return true;
        }

        // Check team member permissions
        $member = TeamMember::where('team_id', $team->id)
            ->where('user_id', $user->id)
            ->first();

        if (!$member) {
            return false;
        }

        return $member->canManageRoles();
    }
}
