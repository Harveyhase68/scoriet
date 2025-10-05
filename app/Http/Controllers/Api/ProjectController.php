<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\FloatingSchema;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use App\Models\Team;

class ProjectController extends Controller
{
    /**
     * Check if user has access to project (owner or team member)
     */
    private function userHasProjectAccess(Project $project, $user = null): bool
    {
        $user = $user ?? Auth::user();
        
        
        if (!$user) {
            return false;
        }
        
        // Owner has access (force string comparison for cross-platform compatibility)
        if ((string)$project->owner_id === (string)$user->id) {
            return true;
        }
        
        // Team members have access
        return $project->teams()->whereHas('members', function($query) use ($user) {
            $query->where('user_id', $user->id);
        })->exists();
    }
    /**
     * Display a listing of projects visible to the user
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $showPublic = $request->get('public', false);
        
        if ($showPublic) {
            // Public project gallery - all public projects
            $projects = Project::with(['owner'])
                ->public()
                ->active()
                ->latest()
                ->get()
                ->map(function ($project) {
                    $counts = $project->getCounts();
                    return [
                        'id' => $project->id,
                        'name' => $project->name,
                        'description' => $project->description,
                        'owner' => $project->owner->only(['id', 'name', 'username']),
                        'is_public' => $project->is_public,
                        'created_at' => $project->created_at,
                        'teams_count' => $counts['teams_count'],
                        'can_join' => $project->allow_join_requests && !empty($project->join_code),
                    ];
                });
        } else {
            // Simple approach: just get projects owned by the user for now
            $projects = Project::with(['owner'])
                ->where('owner_id', $user->id)
                ->active()
                ->latest()
                ->get()
                ->map(function ($project) use ($user) {
                    // Get actual counts using the Project model's getCounts() method
                    $counts = $project->getCounts();
                    return array_merge($project->toArray(), [
                        'teams_count' => $counts['teams_count'],
                        'members_count' => $counts['members_count'],
                        'applications_count' => $counts['applications_count'],
                        'templates_count' => $counts['templates_count'],
                        'schemas_count' => $counts['schemas_count'],
                        'databases_count' => $counts['databases_count'],
                        'is_owner' => true, // Since we only get owned projects
                    ]);
                });

            // Get current project (for now, just the latest one)
            $currentProject = $projects->first();

            return response()->json([
                'projects' => $projects,
                'current_project' => $currentProject,
                'total_projects' => $projects->count(),
            ]);
        }

        return response()->json([
            'projects' => $projects,
            'total_projects' => $projects->count(),
        ]);
    }

    /**
     * Store a newly created project
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(_[a-z0-9]+)*$/', // Lowercase letters, numbers, and underscores for snake_case
                Rule::unique('projects')->where(function ($query) use ($user) {
                    return $query->where('owner_id', $user->id);
                })
            ],
            'description' => 'nullable|string|max:1000',
            'is_public' => 'boolean',
            'allow_join_requests' => 'boolean',
            // Database connection fields
            'database_name' => 'nullable|string|max:255',
            'database_type' => 'nullable|string|max:50',
            'database_server' => 'nullable|string|max:255',
            'database_port' => 'nullable|string|max:10',
            'database_username' => 'nullable|string|max:255',
            'database_password' => 'nullable|string|max:255',
            // Project paths
            'project_directory' => 'nullable|string|max:500',
            'project_url' => 'nullable|string|max:500',
            // Project properties
            'start_page' => 'nullable|string|max:255',
            'default_language' => 'nullable|string|max:10',
            'filename_short_length' => 'nullable|integer|min:2|max:5',
            // Localization settings
            'decimal_separator' => 'nullable|string|max:1',
            'thousands_separator' => 'nullable|string|max:1',
            'date_format' => 'nullable|string|max:20',
            'time_format' => 'nullable|string|max:20',
            'currency_symbol' => 'nullable|string|max:5',
            'timezone' => 'nullable|string|max:50',
            // API Keys
            'google_translate_api_key' => 'nullable|string|max:500',
        ]);

        // Check if user can create private projects
        if (isset($validated['is_public']) && !$validated['is_public']) {
            if (!$user->canCreatePrivateProjects()) {
                return response()->json([
                    'message' => 'Private Projekte sind nur für Premium-User verfügbar'
                ], 403);
            }
        }

        $project = Project::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'owner_id' => $user->id,
            'is_active' => true,
            'is_public' => $validated['is_public'] ?? true,
            'allow_join_requests' => $validated['allow_join_requests'] ?? false,
            // Database connection settings
            'database_name' => $validated['database_name'] ?? null,
            'database_type' => $validated['database_type'] ?? 'MySQL',
            'database_server' => $validated['database_server'] ?? '127.0.0.1',
            'database_port' => $validated['database_port'] ?? '3306',
            'database_username' => $validated['database_username'] ?? null,
            'database_password' => $validated['database_password'] ?? null,
            // Project paths
            'project_directory' => $validated['project_directory'] ?? null,
            'project_url' => $validated['project_url'] ?? null,
            // Project properties
            'start_page' => $validated['start_page'] ?? 'index.php',
            'default_language' => $validated['default_language'] ?? 'en',
            'filename_short_length' => $validated['filename_short_length'] ?? 2,
            // Localization settings
            'decimal_separator' => $validated['decimal_separator'] ?? ',',
            'thousands_separator' => $validated['thousands_separator'] ?? '.',
            'date_format' => $validated['date_format'] ?? 'd.m.Y',
            'time_format' => $validated['time_format'] ?? 'H:i:s',
            'currency_symbol' => $validated['currency_symbol'] ?? '€',
            'timezone' => $validated['timezone'] ?? 'Europe/Vienna',
            // API Keys
            'google_translate_api_key' => $validated['google_translate_api_key'] ?? null,
        ]);

        // Generate join code if join requests are allowed
        if ($project->allow_join_requests) {
            $project->generateJoinCode();
        }

        // Add the owner as the first project member with 'owner' role
        $project->members()->create([
            'user_id' => $user->id,
            'role' => 'owner',
            'joined_at' => now(),
        ]);

        // Note: Projects no longer create automatic schema versions
        // Schema versions are now created when schemas are associated with projects
        // via the project_schemas relationship

        // Load the owner relationship
        $project->load('owner');

        // Add counts
        $counts = $project->getCounts();
        $projectData = array_merge($project->toArray(), $counts);

        return response()->json($projectData, 201);
    }

    /**
     * Display the specified project
     */
    public function show(Project $project): JsonResponse
    {
        // Check if user has access to this project
        if (!$this->userHasProjectAccess($project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $counts = $project->getCounts();
        $projectData = array_merge($project->toArray(), $counts);

        return response()->json($projectData);
    }

    /**
     * Update the specified project
     */
    public function update(Request $request, Project $project): JsonResponse
    {
        // Check if user has access to this project
        if (!$this->userHasProjectAccess($project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(_[a-z0-9]+)*$/', // Lowercase letters, numbers, and underscores for snake_case
                Rule::unique('projects')->ignore($project->id)->where(function ($query) use ($project) {
                    return $query->where('owner_id', $project->owner_id);
                })
            ],
            'description' => 'nullable|string|max:1000',
            'is_active' => 'sometimes|boolean',
            'is_public' => 'sometimes|boolean',
            'join_code' => 'nullable|string|max:50|unique:projects,join_code,' . $project->id,
            'new_owner_id' => 'nullable|integer|exists:users,id',
            // Database connection fields
            'database_name' => 'nullable|string|max:255',
            'database_type' => 'nullable|string|max:50',
            'database_server' => 'nullable|string|max:255',
            'database_port' => 'nullable|string|max:10',
            'database_username' => 'nullable|string|max:255',
            'database_password' => 'nullable|string|max:255',
            // Project paths
            'project_directory' => 'nullable|string|max:500',
            'project_url' => 'nullable|string|max:500',
            // Project properties
            'start_page' => 'nullable|string|max:255',
            'default_language' => 'nullable|string|max:10',
            'filename_short_length' => 'nullable|integer|min:2|max:5',
            // Localization settings
            'decimal_separator' => 'nullable|string|max:1',
            'thousands_separator' => 'nullable|string|max:1',
            'date_format' => 'nullable|string|max:20',
            'time_format' => 'nullable|string|max:20',
            'currency_symbol' => 'nullable|string|max:5',
            'timezone' => 'nullable|string|max:50',
            // API Keys
            'google_translate_api_key' => 'nullable|string|max:500',
        ]);

        // Handle owner transfer first if requested
        if (isset($validated['new_owner_id']) && $validated['new_owner_id']) {
            // Only current owner can transfer ownership
            $user = Auth::user();
            if ($project->owner_id !== $user->id) {
                return response()->json(['message' => 'Only the project owner can transfer ownership'], 403);
            }

            // Check if new owner is a project member
            $newOwnerMembership = $project->members()->where('user_id', $validated['new_owner_id'])->first();
            if (!$newOwnerMembership) {
                return response()->json(['message' => 'New owner must be a project member'], 400);
            }

            // Transfer ownership
            $project->update(['owner_id' => $validated['new_owner_id']]);

            // Update memberships: new owner becomes owner, old owner becomes admin
            $newOwnerMembership->update(['role' => 'owner']);
            $oldOwnerMembership = $project->members()->where('user_id', $user->id)->first();
            if ($oldOwnerMembership) {
                $oldOwnerMembership->update(['role' => 'admin']);
            }

            // Transfer all teams associated with this project to the new owner
            $projectTeams = $project->teams()->get();
            foreach ($projectTeams as $team) {
                // Only transfer teams that belong to the old owner
                if ($team->project_owner_id == $user->id) {
                    $team->update(['project_owner_id' => $validated['new_owner_id']]);
                }
            }

            // Transfer all floating schemas associated with this project to the new owner
            $projectSchemas = $project->floatingSchemas()->get();
            foreach ($projectSchemas as $schema) {
                // Only transfer schemas that belong to the old owner
                if ($schema->owner_id == $user->id) {
                    $schema->update(['owner_id' => $validated['new_owner_id']]);
                }
            }

            // Transfer all project templates to the new owner
            // Note: creator_user_id stays the same (preserves original creator attribution)
            // Only project ownership changes via project_id relationship
            $projectTemplates = \App\Models\Template::where('project_id', $project->id)->get();
            // Templates automatically belong to new owner via project relationship
            // No additional updates needed for templates
        }

        // Remove new_owner_id from validated data before updating other fields
        unset($validated['new_owner_id']);
        $project->update($validated);

        // Refresh the project with owner
        $project->refresh();
        $project->load('owner');

        // Add counts
        $counts = $project->getCounts();
        $projectData = array_merge($project->toArray(), $counts);

        return response()->json($projectData);
    }

    /**
     * Remove the specified project (soft delete by setting is_active = false)
     */
    public function destroy(Project $project): JsonResponse
    {
        // Check if user has access to this project
        if (!$this->userHasProjectAccess($project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Soft delete by setting is_active to false
        $project->update(['is_active' => false]);

        return response()->json(['message' => 'Project deactivated successfully']);
    }

    /**
     * Permanently delete the project
     */
    public function forceDestroy(Project $project): JsonResponse
    {
        // Check if user has access to this project
        if (!$this->userHasProjectAccess($project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $project->delete();

        return response()->json(['message' => 'Project permanently deleted']);
    }

    /**
     * Restore a deactivated project
     */
    public function restore(Project $project): JsonResponse
    {
        // Check if user has access to this project
        if (!$this->userHasProjectAccess($project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $project->update(['is_active' => true]);

        return response()->json(['message' => 'Project restored successfully']);
    }

    /**
     * Get available teams for assignment to project
     */
    public function getAvailableTeams(Project $project): JsonResponse
    {
        // Check if user has access to this project
        if (!$this->userHasProjectAccess($project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Get teams that are not yet assigned to this project
        $assignedTeamIds = $project->teams()->pluck('teams.id')->toArray();
        
        $availableTeams = Team::with(['owner'])
            ->where('project_owner_id', Auth::id()) // Teams owned by current user
            ->whereNotIn('id', $assignedTeamIds) // Not already assigned to this project
            ->where('is_active', true)
            ->get();

        return response()->json($availableTeams);
    }

    /**
     * Get teams assigned to project
     */
    public function getAssignedTeams(Project $project): JsonResponse
    {
        // Check if user has access to this project
        if (!$this->userHasProjectAccess($project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $assignedTeams = $project->teams()->with(['owner'])->get();

        return response()->json($assignedTeams);
    }

    /**
     * Assign teams to project
     */
    public function assignTeams(Request $request, Project $project): JsonResponse
    {
        // Check if user has access to this project
        if (!$this->userHasProjectAccess($project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'team_ids' => 'required|array',
            'team_ids.*' => 'exists:teams,id',
        ]);

        $teamIds = $validated['team_ids'];

        // Verify all teams belong to the current user
        $userTeams = Team::whereIn('id', $teamIds)
            ->where('project_owner_id', Auth::id())
            ->pluck('id')
            ->toArray();

        if (count($userTeams) !== count($teamIds)) {
            return response()->json(['message' => 'Some teams do not belong to you'], 403);
        }

        // Assign teams to project using pivot table
        $pivotData = [];
        foreach ($teamIds as $teamId) {
            $pivotData[$teamId] = [
                'assigned_at' => now(),
                'assigned_by' => Auth::id(),
                'created_at' => now(),
                'updated_at' => now()
            ];
        }
        
        $project->teams()->attach($pivotData);

        return response()->json(['message' => 'Teams assigned successfully']);
    }

    /**
     * Remove team from project
     */
    public function removeTeam(Project $project, Team $team): JsonResponse
    {
        // Check if user has access to this project
        if (!$this->userHasProjectAccess($project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if team belongs to user
        if ((string)$team->project_owner_id !== (string)Auth::id()) {
            return response()->json(['message' => 'Team does not belong to you'], 403);
        }

        // Check if team is assigned to this project
        if (!$project->teams()->where('teams.id', $team->id)->exists()) {
            return response()->json(['message' => 'Team is not assigned to this project'], 400);
        }

        // Remove team from project using pivot table
        $project->teams()->detach($team->id);

        return response()->json(['message' => 'Team removed from project successfully']);
    }

    /**
     * Associate a schema with this project
     */
    public function associateSchema(Request $request, Project $project): JsonResponse
    {
        // Check if user has access to this project
        if (!$this->userHasProjectAccess($project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'schema_id' => 'required|exists:schemas,id',
            'association_type' => 'required|in:linked,cloned,imported',
            'alias' => 'nullable|string|max:255',
        ]);

        $schema = FloatingSchema::findOrFail($validated['schema_id']);
        
        // Check if user can access the schema
        if (!$schema->canBeAccessedBy(Auth::user())) {
            return response()->json(['message' => 'Schema not found'], 404);
        }

        // Check if association already exists
        if ($project->hasSchemaAccess($schema)) {
            return response()->json(['message' => 'Schema is already associated with this project'], 422);
        }

        // Associate the schema
        $project->associateSchema($schema, $validated['association_type'], $validated['alias']);

        return response()->json(['message' => 'Schema associated successfully']);
    }

    /**
     * Remove schema association from project
     */
    public function dissociateSchema(Project $project, FloatingSchema $schema): JsonResponse
    {
        // Check if user has access to this project
        if (!$this->userHasProjectAccess($project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if association exists
        if (!$project->hasSchemaAccess($schema)) {
            return response()->json(['message' => 'Schema is not associated with this project'], 422);
        }

        // Remove association
        $project->dissociateSchema($schema);

        return response()->json(['message' => 'Schema association removed successfully']);
    }

    /**
     * Get schemas associated with this project
     */
    public function getProjectSchemas(Project $project): JsonResponse
    {
        $user = Auth::user();
        
        // Check if user has access to the project
        if (!$project->visibleTo($user)->exists()) {
            return response()->json(['message' => 'Project not found'], 404);
        }

        $schemas = $project->floatingSchemas()
            ->with(['owner'])
            ->get()
            ->map(function ($schema) {
                return array_merge($schema->toArray(), [
                    'association_type' => $schema->pivot->association_type,
                    'alias' => $schema->pivot->alias,
                    'associated_at' => $schema->pivot->created_at,
                ]);
            });

        return response()->json($schemas);
    }

    /**
     * Get editable schemas for this project (cloned/imported/linked if owner)
     */
    public function getEditableSchemas(Project $project): JsonResponse
    {
        $user = Auth::user();

        // Check if user has access to the project
        if (!$project->visibleTo($user)->exists()) {
            return response()->json(['message' => 'Project not found'], 404);
        }

        // Get all schemas associated with the project
        $allSchemas = $project->floatingSchemas()
            ->with(['owner'])
            ->get();

        // Filter to only include editable schemas:
        // - cloned and imported schemas are always editable
        // - linked schemas are editable only if user is the owner
        $editableSchemas = $allSchemas->filter(function ($schema) use ($user) {
            $associationType = $schema->pivot->association_type;

            // Cloned and imported schemas are always editable
            if (in_array($associationType, ['cloned', 'imported'])) {
                return true;
            }

            // Linked schemas are editable only if user is the owner
            if ($associationType === 'linked' && (string)$schema->owner_id === (string)$user->id) {
                return true;
            }

            return false;
        })->map(function ($schema) {
            return [
                'id' => $schema->id,
                'name' => $schema->name,
                'description' => $schema->description,
                'last_version' => $schema->last_version,
                'association_type' => $schema->pivot->association_type,
                'alias' => $schema->pivot->alias,
                'owner' => $schema->owner->only(['id', 'name']),
            ];
        })->values(); // Re-index the collection

        return response()->json($editableSchemas);
    }

    /**
     * Get project members
     */
    public function getProjectMembers(Project $project): JsonResponse
    {
        $user = Auth::user();

        // Check if user has access to the project
        if (!$project->visibleTo($user)->exists()) {
            return response()->json(['message' => 'Project not found'], 404);
        }

        // Get all project members with user details
        $members = $project->members()
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

        // Add project owner if not already in members list (fallback for old projects)
        $ownerAlreadyInList = $members->where('user_id', $project->owner_id)->isNotEmpty();
        if (!$ownerAlreadyInList && $project->owner) {
            $members->prepend([
                'id' => 0, // Special ID for owner
                'user_id' => $project->owner->id,
                'role' => 'owner',
                'joined_at' => $project->created_at,
                'user' => [
                    'id' => $project->owner->id,
                    'name' => $project->owner->name,
                    'email' => $project->owner->email,
                    'username' => $project->owner->username,
                ]
            ]);
        }

        return response()->json($members->values());
    }

    /**
     * Remove project member
     */
    public function removeProjectMember(Project $project, Request $request): JsonResponse
    {
        $user = Auth::user();

        // Check if user is project owner or admin
        $userMembership = $project->members()->where('user_id', $user->id)->first();
        if (!$userMembership || !in_array($userMembership->role, ['owner', 'admin'])) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $request->validate([
            'user_id' => 'required|integer|exists:users,id'
        ]);

        $memberToRemove = $project->members()->where('user_id', $request->user_id)->first();

        if (!$memberToRemove) {
            return response()->json(['message' => 'User is not a member of this project'], 404);
        }

        // Prevent removing project owner
        if ($memberToRemove->role === 'owner') {
            return response()->json(['message' => 'Cannot remove project owner'], 400);
        }

        // Prevent non-owners from removing admins
        if ($userMembership->role !== 'owner' && $memberToRemove->role === 'admin') {
            return response()->json(['message' => 'Only project owner can remove admins'], 403);
        }

        // Get the user ID before deleting the membership
        $userIdToRemove = $memberToRemove->user_id;

        // Remove the project membership
        $memberToRemove->delete();

        // Also remove the user from all teams associated with this project
        $projectTeams = $project->teams;
        foreach ($projectTeams as $team) {
            $team->members()->where('user_id', $userIdToRemove)->delete();
        }

        return response()->json([
            'message' => 'Member removed successfully from project and all associated teams'
        ]);
    }

    /**
     * Update project member role
     */
    public function updateProjectMemberRole(Project $project, Request $request): JsonResponse
    {
        $user = Auth::user();

        // Check if user is project owner (only owners can change roles)
        $userMembership = $project->members()->where('user_id', $user->id)->first();
        if (!$userMembership || $userMembership->role !== 'owner') {
            return response()->json(['message' => 'Only project owner can change member roles'], 403);
        }

        $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'role' => 'required|in:member,admin'
        ]);

        $memberToUpdate = $project->members()->where('user_id', $request->user_id)->first();

        if (!$memberToUpdate) {
            return response()->json(['message' => 'User is not a member of this project'], 404);
        }

        // Prevent changing owner role
        if ($memberToUpdate->role === 'owner') {
            return response()->json(['message' => 'Cannot change owner role'], 400);
        }

        $memberToUpdate->update(['role' => $request->role]);

        return response()->json(['message' => 'Member role updated successfully']);
    }

    /**
     * Update project settings (language settings)
     */
    public function updateSettings(Request $request, Project $project)
    {
        $user = Auth::user();

        // Check if user has access to this project
        if (!$project->userCanAccess($user)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'enabled_languages' => 'nullable|array',
            'enabled_languages.*' => 'string|max:10',
            'default_language' => 'nullable|string|max:10',
        ]);

        $project->update([
            'enabled_languages' => $validated['enabled_languages'] ?? [],
            'default_language' => $validated['default_language'] ?? $project->default_language,
        ]);

        return response()->json([
            'message' => 'Project settings updated successfully',
            'project' => $project
        ]);
    }

    /**
     * Get project settings
     */
    public function getSettings(Project $project)
    {
        $user = Auth::user();

        // Check if user has access to this project
        if (!$project->userCanAccess($user)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json([
            'enabled_languages' => $project->enabled_languages ?? [],
            'default_language' => $project->default_language,
        ]);
    }
}
