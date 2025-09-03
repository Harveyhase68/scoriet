<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use App\Models\Team;
use App\Models\SchemaVersion;

class ProjectController extends Controller
{
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
            // User's own projects + projects they're team members of
            $projects = Project::with(['owner'])
                ->visibleTo($user)
                ->active()
                ->latest()
                ->get()
                ->map(function ($project) use ($user) {
                    $counts = $project->getCounts();
                    return array_merge($project->toArray(), $counts, [
                        'is_owner' => $project->owner_id === $user->id,
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
                Rule::unique('projects')->where(function ($query) use ($user) {
                    return $query->where('owner_id', $user->id);
                })
            ],
            'description' => 'nullable|string|max:1000',
            'is_public' => 'boolean',
            'allow_join_requests' => 'boolean',
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
        ]);

        // Generate join code if join requests are allowed
        if ($project->allow_join_requests) {
            $project->generateJoinCode();
        }

        // Create a default schema version for this project
        // Try to create with project ID, if it fails, let auto-increment handle it
        try {
            SchemaVersion::create([
                'id' => $project->id, // Use project ID as schema version ID
                'version_name' => $project->name,
                'description' => 'Default schema version for ' . $project->name,
            ]);
        } catch (\Exception $e) {
            // If explicit ID fails, let auto-increment handle it
            SchemaVersion::create([
                'version_name' => $project->name,
                'description' => 'Default schema version for ' . $project->name,
            ]);
        }

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
        // Check if user owns the project
        if ($project->owner_id !== Auth::id()) {
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
        // Check if user owns the project
        if ($project->owner_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('projects')->ignore($project->id)->where(function ($query) use ($project) {
                    return $query->where('owner_id', $project->owner_id);
                })
            ],
            'description' => 'nullable|string|max:1000',
            'is_active' => 'sometimes|boolean',
        ]);

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
        // Check if user owns the project
        if ($project->owner_id !== Auth::id()) {
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
        // Check if user owns the project
        if ($project->owner_id !== Auth::id()) {
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
        // Check if user owns the project
        if ($project->owner_id !== Auth::id()) {
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
        // Check if user owns the project
        if ($project->owner_id !== Auth::id()) {
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
        // Check if user owns the project
        if ($project->owner_id !== Auth::id()) {
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
        // Check if user owns the project
        if ($project->owner_id !== Auth::id()) {
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
        // Check if user owns the project
        if ($project->owner_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if team belongs to user
        if ($team->project_owner_id !== Auth::id()) {
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
}
