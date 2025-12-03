<?php

namespace App\Http\Controllers\Cli;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

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

        // Owner has access
        if ((string)$project->owner_id === (string)$user->id) {
            return true;
        }

        // Team members have access
        return $project->teams()->whereHas('members', function($query) use ($user) {
            $query->where('user_id', $user->id);
        })->exists();
    }

    /**
     * List all projects user has access to
     *
     * GET /cli/projects
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function list(Request $request): JsonResponse
    {
        $user = $request->user();

        // Get projects owned by user
        $ownedProjects = Project::where('owner_id', $user->id)
            ->active()
            ->latest()
            ->get();

        // Get projects user is member of via teams
        $teamProjects = Project::whereHas('teams.members', function($query) use ($user) {
            $query->where('user_id', $user->id);
        })
        ->where('owner_id', '!=', $user->id) // Exclude owned projects (already in ownedProjects)
        ->active()
        ->latest()
        ->get();

        // Combine and format projects
        $allProjects = $ownedProjects->merge($teamProjects)->map(function ($project) use ($user) {
            $isOwner = (string)$project->owner_id === (string)$user->id;
            $counts = $project->getCounts();

            return [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'is_owner' => $isOwner,
                'access_type' => $isOwner ? 'owner' : 'team_member',
                'created_at' => $project->created_at->toIso8601String(),
                'updated_at' => $project->updated_at->toIso8601String(),
                'counts' => [
                    'templates' => $counts['templates_count'],
                    'schemas' => $counts['schemas_count'],
                    'databases' => $counts['databases_count'],
                    'teams' => $counts['teams_count'],
                    'members' => $counts['members_count'],
                ],
            ];
        });

        return response()->json([
            'success' => true,
            'projects' => $allProjects->values(),
            'total' => $allProjects->count(),
        ], 200);
    }

    /**
     * Create a new project
     *
     * POST /cli/projects
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function create(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9_]+$/'],
            'description' => 'nullable|string|max:1000',
            'is_public' => 'boolean',
            'allow_join_requests' => 'boolean',
        ], [
            'name.regex' => 'Project name must contain only lowercase letters, numbers, and underscores',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        // Check if project with this name already exists for this user
        $existingProject = Project::where('name', $request->input('name'))
            ->where('owner_id', $user->id)
            ->where('is_active', true)
            ->first();

        if ($existingProject) {
            return response()->json([
                'success' => false,
                'message' => 'A project with this name already exists',
                'error' => 'Project name must be unique',
            ], 409); // 409 Conflict
        }

        try {
            $project = Project::create([
                'name' => $request->input('name'),
                'description' => $request->input('description'),
                'owner_id' => $user->id,
                'is_public' => $request->input('is_public', false),
                'allow_join_requests' => $request->input('allow_join_requests', false),
                'is_active' => true,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Project created successfully',
                'project' => [
                    'id' => $project->id,
                    'name' => $project->name,
                    'description' => $project->description,
                    'is_public' => $project->is_public,
                    'created_at' => $project->created_at->toIso8601String(),
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create project',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Show project details
     *
     * GET /cli/projects/{id}
     *
     * @param int $id
     * @param Request $request
     * @return JsonResponse
     */
    public function show(int $id, Request $request): JsonResponse
    {
        $project = Project::with(['owner', 'floatingSchemas', 'templates'])->find($id);

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Project not found',
            ], 404);
        }

        // Check access
        if (!$this->userHasProjectAccess($project, $request->user())) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        $counts = $project->getCounts();

        return response()->json([
            'success' => true,
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'owner' => [
                    'id' => $project->owner->id,
                    'name' => $project->owner->name,
                    'email' => $project->owner->email,
                ],
                'is_public' => $project->is_public,
                'allow_join_requests' => $project->allow_join_requests,
                'created_at' => $project->created_at->toIso8601String(),
                'updated_at' => $project->updated_at->toIso8601String(),
                'counts' => [
                    'templates' => $counts['templates_count'],
                    'schemas' => $counts['schemas_count'],
                    'databases' => $counts['databases_count'],
                    'teams' => $counts['teams_count'],
                    'members' => $counts['members_count'],
                ],
                'schemas' => $project->floatingSchemas->map(function ($schema) {
                    return [
                        'id' => $schema->id,
                        'name' => $schema->name,
                        'created_at' => $schema->created_at->toIso8601String(),
                    ];
                }),
                'templates' => $project->templates->map(function ($template) {
                    return [
                        'id' => $template->id,
                        'name' => $template->name,
                        'language' => $template->language,
                    ];
                }),
            ],
        ], 200);
    }

    /**
     * Update project
     *
     * PUT /cli/projects/{id}
     *
     * @param int $id
     * @param Request $request
     * @return JsonResponse
     */
    public function update(int $id, Request $request): JsonResponse
    {
        $project = Project::find($id);

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Project not found',
            ], 404);
        }

        // Check if user is owner (only owner can update)
        if ((string)$project->owner_id !== (string)$request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Only project owner can update project',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'string|max:255',
            'description' => 'nullable|string|max:1000',
            'is_public' => 'boolean',
            'allow_join_requests' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $project->update($request->only([
                'name',
                'description',
                'is_public',
                'allow_join_requests',
            ]));

            return response()->json([
                'success' => true,
                'message' => 'Project updated successfully',
                'project' => [
                    'id' => $project->id,
                    'name' => $project->name,
                    'description' => $project->description,
                    'is_public' => $project->is_public,
                    'updated_at' => $project->updated_at->toIso8601String(),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update project',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete project (soft delete)
     *
     * DELETE /cli/projects/{id}
     *
     * @param int $id
     * @param Request $request
     * @return JsonResponse
     */
    public function delete(int $id, Request $request): JsonResponse
    {
        $project = Project::find($id);

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Project not found',
            ], 404);
        }

        // Check if user is owner (only owner can delete)
        if ((string)$project->owner_id !== (string)$request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Only project owner can delete project',
            ], 403);
        }

        try {
            // Hard delete - completely remove from database
            // Laravel will handle cascade deletes based on foreign key constraints
            $project->delete();

            return response()->json([
                'success' => true,
                'message' => 'Project deleted successfully',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete project',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get project settings
     *
     * GET /cli/projects/{id}/settings
     *
     * @param int $id
     * @param Request $request
     * @return JsonResponse
     */
    public function settings(int $id, Request $request): JsonResponse
    {
        $project = Project::find($id);

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Project not found',
            ], 404);
        }

        // Check access
        if (!$this->userHasProjectAccess($project, $request->user())) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'settings' => [
                'base_namespace' => $project->base_namespace,
                'archive_format' => $project->archive_format,
                'is_public' => $project->is_public,
                'allow_join_requests' => $project->allow_join_requests,
            ],
        ], 200);
    }

    /**
     * Get deployment settings for a project
     * Returns aggregated protected files and scripts from templates and project
     *
     * GET /cli/projects/{id}/deployment-settings
     *
     * @param string|int $id Project ID
     * @param Request $request
     * @return JsonResponse
     */
    public function deploymentSettings(string|int $id, Request $request): JsonResponse
    {
        // Validate ID is numeric
        if (!is_numeric($id)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid project ID format',
            ], 400);
        }

        $project = Project::find((int)$id);

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => 'Project not found',
            ], 404);
        }

        // Check access
        if (!$this->userHasProjectAccess($project, $request->user())) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        // Load linked templates with protected_files
        $templates = $project->templates()
            ->select(['templates.id', 'templates.name', 'templates.protected_files', 'templates.install_script', 'templates.update_script'])
            ->get();

        // Aggregate all protected files from templates
        $templateProtectedFiles = [];
        foreach ($templates as $template) {
            $files = $template->protected_files ?? [];
            foreach ($files as $file) {
                if (!in_array($file, $templateProtectedFiles)) {
                    $templateProtectedFiles[] = $file;
                }
            }
        }

        // Combine template and project protected files (remove duplicates)
        $projectProtectedFiles = $project->protected_files ?? [];
        $allProtectedFiles = array_unique(array_merge($templateProtectedFiles, $projectProtectedFiles));

        // Combine install and update scripts from ALL templates + project
        $installScript = [];
        $updateScript = [];

        // First, add all template scripts
        foreach ($templates as $template) {
            $templateInstallScript = $template->install_script ?? [];
            $templateUpdateScript = $template->update_script ?? [];

            if (!empty($templateInstallScript)) {
                $installScript = array_merge($installScript, $templateInstallScript);
            }

            if (!empty($templateUpdateScript)) {
                $updateScript = array_merge($updateScript, $templateUpdateScript);
            }
        }

        // Then, add project scripts (they run AFTER template scripts)
        $projectInstallScript = $project->install_script ?? [];
        $projectUpdateScript = $project->update_script ?? [];

        if (!empty($projectInstallScript)) {
            $installScript = array_merge($installScript, $projectInstallScript);
        }

        if (!empty($projectUpdateScript)) {
            $updateScript = array_merge($updateScript, $projectUpdateScript);
        }

        return response()->json([
            'success' => true,
            'deployment' => [
                'project_directory' => $project->project_directory,
                'protected_files' => array_values($allProtectedFiles),
                'install_script' => $installScript,
                'update_script' => $updateScript,
                'templates' => $templates->map(function ($template) {
                    return [
                        'id' => $template->id,
                        'name' => $template->name,
                        'protected_files' => $template->protected_files ?? [],
                    ];
                }),
            ],
        ], 200);
    }
}
