<?php

namespace App\Http\Controllers\Cli;

use App\Http\Controllers\Concerns\ValidatesPartialUpdate;
use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ProjectController extends Controller
{
    use ValidatesPartialUpdate;

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

        $expectedFields = ['name', 'description', 'is_public', 'allow_join_requests'];

        // Short-circuit: body present but nothing matches the schema?
        $fieldCheck = $this->checkBodyFields($request, $expectedFields);
        if ($fieldCheck['all_unknown']) {
            return $this->unknownFieldsResponse($expectedFields, $fieldCheck['received']);
        }

        $validator = Validator::make($request->all(), [
            'name'                => 'string|max:255',
            'description'         => 'nullable|string|max:1000',
            'is_public'           => 'boolean',
            'allow_join_requests' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $validator->errors(),
            ], 422);
        }

        try {
            $updatable = $request->only($expectedFields);
            $project->update($updatable);

            $response = [
                'success'        => true,
                'message'        => 'Project updated successfully',
                'updated_fields' => array_keys($updatable),
                'project' => [
                    'id'          => $project->id,
                    'name'        => $project->name,
                    'description' => $project->description,
                    'is_public'   => $project->is_public,
                    'updated_at'  => $project->updated_at->toIso8601String(),
                ],
            ];
            if ($warning = $this->unknownFieldsWarning($fieldCheck['unknown'])) {
                $response['warnings'] = $warning;
            }
            return response()->json($response, 200);

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

        // Grouped by concern so callers (and humans) can find what they need.
        // Sensitive values (database_password, ftp_password, google_translate_api_key)
        // are deliberately NOT exposed here — they require a separate scoped call.
        return response()->json([
            'success' => true,
            'settings' => [
                'identity' => [
                    'id'          => $project->id,
                    'name'        => $project->name,
                    'description' => $project->description,
                    'is_active'   => (bool) $project->is_active,
                ],
                'visibility' => [
                    'is_public'           => (bool) $project->is_public,
                    'allow_join_requests' => (bool) $project->allow_join_requests,
                    'join_code'           => $project->join_code,
                ],
                'languages' => [
                    'default_language'  => $project->default_language,
                    'target_language'   => $project->target_language,
                    'enabled_languages' => $project->enabled_languages,
                ],
                'output' => [
                    'archive_format'        => $project->archive_format,
                    'project_directory'     => $project->project_directory,
                    'project_url'           => $project->project_url,
                    'start_page'            => $project->start_page,
                    'filename_short_length' => $project->filename_short_length,
                ],
                'database' => [
                    'database_name'     => $project->database_name,
                    'database_type'     => $project->database_type,
                    'database_server'   => $project->database_server,
                    'database_port'     => $project->database_port,
                    'database_username' => $project->database_username,
                    // database_password is intentionally omitted
                ],
                'deployment' => [
                    'deployment_type' => $project->deployment_type,
                    'ftp_host'        => $project->ftp_host,
                    'ftp_port'        => $project->ftp_port,
                    'ftp_username'    => $project->ftp_username,
                    'ftp_directory'   => $project->ftp_directory,
                    'ftp_passive'     => $project->ftp_passive !== null ? (bool) $project->ftp_passive : null,
                    'ftp_ssl'         => $project->ftp_ssl !== null ? (bool) $project->ftp_ssl : null,
                    // ftp_password is intentionally omitted — fetch via /ftp-settings
                ],
                'git' => [
                    'git_provider_id'       => $project->git_provider_id,
                    'git_repository'        => $project->git_repository,
                    'git_default_branch'    => $project->git_default_branch,
                    'git_main_branch'       => $project->git_main_branch,
                    'git_target_directory'  => $project->git_target_directory,
                    'git_workflow'          => $project->git_workflow,
                    'git_auto_delete_branch' => $project->git_auto_delete_branch !== null ? (bool) $project->git_auto_delete_branch : null,
                ],
                'designer' => [
                    'diagram_max_tables_per_row' => $project->diagram_max_tables_per_row,
                    'diagram_table_width'        => $project->diagram_table_width,
                    'diagram_table_height'       => $project->diagram_table_height,
                    'diagram_horizontal_spacing' => $project->diagram_horizontal_spacing,
                    'diagram_vertical_spacing'   => $project->diagram_vertical_spacing,
                    'form_designer_snap_to_grid'   => $project->form_designer_snap_to_grid !== null ? (bool) $project->form_designer_snap_to_grid : null,
                    'form_designer_grid_size'      => $project->form_designer_grid_size,
                    'report_designer_snap_to_grid' => $project->report_designer_snap_to_grid !== null ? (bool) $project->report_designer_snap_to_grid : null,
                    'report_designer_grid_unit'    => $project->report_designer_grid_unit,
                    'report_designer_grid_size'    => $project->report_designer_grid_size,
                ],
                'timestamps' => [
                    'created_at' => $project->created_at?->toIso8601String(),
                    'updated_at' => $project->updated_at?->toIso8601String(),
                ],
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
