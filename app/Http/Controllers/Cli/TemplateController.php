<?php

namespace App\Http\Controllers\Cli;

use App\Http\Controllers\Concerns\ValidatesPartialUpdate;
use App\Http\Controllers\Controller;
use App\Models\Template;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class TemplateController extends Controller
{
    use ValidatesPartialUpdate;

    /**
     * Check if user has access to project
     */
    private function userHasProjectAccess(Project $project, $user): bool
    {
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
     * List all available templates
     *
     * GET /cli/templates
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function list(Request $request): JsonResponse
    {
        // Get all active templates (system + user's templates)
        $user = $request->user();

        $templates = Template::where(function($query) use ($user) {
            // System templates (is_system_template = true or visibility = public)
            $query->where('is_system_template', true)
                  ->orWhere('visibility', 'public')
                  // Or templates created by this user
                  ->orWhere('creator_user_id', $user->id);
        })
        ->where('is_active', true)
        ->orderBy('name')
        ->get()
        ->map(function ($template) use ($user) {
            return [
                'id' => $template->id,
                'name' => $template->name,
                'full_name' => $template->full_name,
                'description' => $template->description,
                'category' => $template->category,
                'language' => $template->language,
                'tags' => is_string($template->tags) ? json_decode($template->tags, true) : ($template->tags ?? []),
                'file_count' => $template->file_count,
                'is_system' => $template->is_system_template,
                'visibility' => $template->visibility,
                'is_owned' => (string)$template->creator_user_id === (string)$user->id,
                'review_status' => $template->review_status,
                'review_score' => $template->review_score,
                'created_at' => $template->created_at->toIso8601String(),
            ];
        });

        return response()->json([
            'success' => true,
            'templates' => $templates,
            'total' => $templates->count(),
        ], 200);
    }

    /**
     * Get template details
     *
     * GET /cli/templates/{id}
     *
     * @param int $id
     * @param Request $request
     * @return JsonResponse
     */
    public function show(int $id, Request $request): JsonResponse
    {
        $template = Template::with(['files'])->find($id);

        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => __('templatecontrollerphp95'),
            ], 404);
        }

        $user = $request->user();

        // Check if user has access to this template
        $hasAccess = $template->is_system_template || // System template
                     $template->visibility === 'public' || // Public template
                     (string)$template->creator_user_id === (string)$user->id; // Owned by user

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => __('templatecontrollerphp109'),
            ], 403);
        }

        return response()->json([
            'success' => true,
            'template' => [
                'id' => $template->id,
                'name' => $template->name,
                'full_name' => $template->full_name,
                'description' => $template->description,
                'category' => $template->category,
                'language' => $template->language,
                'tags' => is_string($template->tags) ? json_decode($template->tags, true) : ($template->tags ?? []),
                'file_count' => $template->file_count,
                'is_system' => $template->is_system_template,
                'visibility' => $template->visibility,
                'files_count' => $template->files->count(),
                'files' => $template->files->sortBy('file_order')->map(function ($file) {
                    return [
                        'id' => $file->id,
                        'file_name' => $file->file_name,
                        'file_path' => $file->file_path,
                        'file_type' => $file->file_type,
                        'content_type' => $file->content_type,
                        'output_path' => $file->output_path,
                        'content_size' => strlen($file->file_content ?? ''),
                        'file_order' => $file->file_order,
                    ];
                })->values(),
                'created_at' => $template->created_at->toIso8601String(),
            ],
        ], 200);
    }

    /**
     * Clone template (create editable copy with history tracking)
     *
     * POST /cli/templates/{id}/clone
     *
     * @param int $id
     * @param Request $request
     * @return JsonResponse
     */
    public function clone(int $id, Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'new_name'   => 'nullable|string|max:255|regex:/^[a-z0-9_]+$/',
            'visibility' => 'nullable|in:public,private',
            // project_id is no longer required for clone — full_name is now
            // derived from the cloning user's username (not a project name).
            // It's still accepted (optional) for callers who want to record
            // a home project on the clone via the legacy project_id column.
            'project_id' => 'nullable|integer|exists:projects,id',
        ], [
            'new_name.regex' => __('templatecontrollerphp160'),
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => __('templatecontrollerphp166'),
                'errors'  => $validator->errors(),
            ], 422);
        }

        $template = Template::find($id);

        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => __('templatecontrollerphp176'),
            ], 404);
        }

        $user = $request->user();

        // Check if user can clone this template
        if (!$template->canBeClonedBy($user)) {
            return response()->json([
                'success' => false,
                'message' => __('templatecontrollerphp186'),
            ], 403);
        }

        // Optional home-project: if the caller asks to record one, they must
        // actually have access to it. Without project_id the clone simply
        // exists under the user; project_template_usage links can be added
        // later via /templates/{id}/link.
        $project = null;
        if ($request->filled('project_id')) {
            $project = Project::find($request->input('project_id'));
            if (!$this->userHasProjectAccess($project, $user)) {
                return response()->json([
                    'success' => false,
                    'message' => __('templatecontrollerphp196'),
                ], 403);
            }
        }

        try {
            // Clone the template — full_name is built from the cloning user's
            // username inside cloneForUser(), guaranteeing the canonical
            // "username/template_slug" identity.
            $clonedTemplate = $template->cloneForUser(
                $user,
                $request->input('new_name'),
                $request->input('visibility', 'public'),
                $project
            );

            // Set template type to 'cloned'
            $clonedTemplate->update(['template_type' => 'cloned']);

            // Initialize history tracking
            $history = [
                'original_creator_id' => $template->creator_user_id ?? $template->creator->id,
                'original_created_at' => $template->created_at->toIso8601String(),
                'forks' => []
            ];
            $clonedTemplate->update(['history' => $history]);

            return response()->json([
                'success'  => true,
                'message'  => 'Template cloned successfully',
                'template' => [
                    'id'                   => $clonedTemplate->id,
                    'name'                 => $clonedTemplate->name,
                    'full_name'            => $clonedTemplate->full_name,
                    'description'          => $clonedTemplate->description,
                    'template_type'        => $clonedTemplate->template_type,
                    'original_template_id' => $clonedTemplate->original_template_id,
                    'created_at'           => $clonedTemplate->created_at->toIso8601String(),
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => __('templatecontrollerphp236'),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Link template to project
     *
     * POST /cli/templates/{id}/link
     *
     * @param int $id
     * @param Request $request
     * @return JsonResponse
     */
    public function link(int $id, Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'project_id' => 'required|integer|exists:projects,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => __('templatecontrollerphp260'),
                'errors' => $validator->errors(),
            ], 422);
        }

        $template = Template::find($id);

        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => __('templatecontrollerphp270'),
            ], 404);
        }

        $project = Project::find($request->input('project_id'));

        // Check project access
        if (!$this->userHasProjectAccess($project, $request->user())) {
            return response()->json([
                'success' => false,
                'message' => __('templatecontrollerphp280'),
            ], 403);
        }

        try {
            // Check if already linked
            if ($project->templates()->where('templates.id', $template->id)->exists()) {
                return response()->json([
                    'success' => true,
                    'message' => __('templatecontrollerphp289'),
                ], 200);
            }

            // Link template to project
            $project->templates()->attach($template->id, [
                'usage_type' => 'linked',
                'is_active' => true,
                'used_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => __('templatecontrollerphp302'),
                'template' => [
                    'id' => $template->id,
                    'name' => $template->name,
                ],
                'project' => [
                    'id' => $project->id,
                    'name' => $project->name,
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => __('templatecontrollerphp316'),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Unlink template from project
     *
     * POST /cli/templates/{id}/unlink
     *
     * @param int $id
     * @param Request $request
     * @return JsonResponse
     */
    public function unlink(int $id, Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'project_id' => 'required|integer|exists:projects,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => __('templatecontrollerphp340'),
                'errors' => $validator->errors(),
            ], 422);
        }

        $template = Template::find($id);

        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => __('templatecontrollerphp350'),
            ], 404);
        }

        $project = Project::find($request->input('project_id'));

        // Check project access
        if (!$this->userHasProjectAccess($project, $request->user())) {
            return response()->json([
                'success' => false,
                'message' => __('templatecontrollerphp360'),
            ], 403);
        }

        try {
            // Unlink template from project
            $project->templates()->detach($template->id);

            return response()->json([
                'success' => true,
                'message' => __('templatecontrollerphp370'),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => __('templatecontrollerphp376'),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create new template
     *
     * POST /cli/templates
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function create(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9_]+$/'],
            'description' => 'nullable|string|max:1000',
            'category' => 'nullable|string|max:100',
            'language' => 'required|string|max:100',
            'visibility' => 'nullable|in:public,private',
        ], [
            'name.regex' => __('templatecontrollerphp399'),
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => __('templatecontrollerphp405'),
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        // Check if template with this name already exists for this user
        $existingTemplate = Template::where('name', $request->input('name'))
            ->where('creator_user_id', $user->id)
            ->where('is_active', true)
            ->first();

        if ($existingTemplate) {
            return response()->json([
                'success' => false,
                'message' => __('templatecontrollerphp421'),
                'error' => __('templatecontrollerphp422'),
            ], 409); // 409 Conflict
        }

        try {
            $template = Template::create([
                'name'               => $request->input('name'),
                'full_name'          => Template::buildFullName($user->username ?? $user->name, $request->input('name')),
                'description'        => $request->input('description'),
                'category'           => $request->input('category', 'general'),
                'language'           => $request->input('language'),
                'visibility'         => $request->input('visibility', 'private'),
                'creator_user_id'    => $user->id,
                'is_active'          => true,
                'is_system_template' => false,
                'file_count'         => 0,
            ]);

            return response()->json([
                'success' => true,
                'message' => __('templatecontrollerphp442'),
                'template' => [
                    'id' => $template->id,
                    'name' => $template->name,
                    'description' => $template->description,
                    'language' => $template->language,
                    'category' => $template->category,
                    'visibility' => $template->visibility,
                    'created_at' => $template->created_at->toIso8601String(),
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => __('templatecontrollerphp457'),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update an existing template (partial update — only sent fields change)
     *
     * PUT /cli/v1/templates/{id}
     *
     * Body (all optional):
     *   name, description, category, language, tags[], visibility,
     *   is_active, compatibility_tag, generation_order
     *
     * Notes:
     *   - is_system_template is NOT changeable here (system-admin concern,
     *     not a normal-user concern, and flipping it affects pricing rules).
     *   - Changing `name` re-checks the per-user uniqueness constraint that
     *     create() enforces, so callers can't sneak a duplicate in via rename.
     *   - System templates are read-only via CLI (same rule as delete()).
     *
     * @param int $id
     * @param Request $request
     * @return JsonResponse
     */
    public function update(int $id, Request $request): JsonResponse
    {
        $template = Template::find($id);

        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => __('templatecontrollerphp479'),
            ], 404);
        }

        $user = $request->user();

        // Ownership: only the creator can update via CLI
        if ((string)$template->creator_user_id !== (string)$user->id) {
            return response()->json([
                'success' => false,
                'message' => __('templatecontrollerphp489'),
            ], 403);
        }

        // System templates are managed in-house only
        if ($template->is_system_template) {
            return response()->json([
                'success' => false,
                'message' => __('templatecontrollerphp497'),
            ], 403);
        }

        $expectedFields = [
            'name', 'description', 'category', 'language', 'tags',
            'visibility', 'is_active', 'compatibility_tag', 'generation_order',
        ];

        // Short-circuit: body present but nothing matches the schema?
        $fieldCheck = $this->checkBodyFields($request, $expectedFields);
        if ($fieldCheck['all_unknown']) {
            return $this->unknownFieldsResponse($expectedFields, $fieldCheck['received']);
        }

        $validator = Validator::make($request->all(), [
            'name'              => ['sometimes', 'string', 'max:255', 'regex:/^[a-z0-9_]+$/'],
            'description'       => 'sometimes|nullable|string|max:1000',
            'category'          => 'sometimes|nullable|string|max:100',
            'language'          => 'sometimes|string|max:100',
            'tags'              => 'sometimes|nullable|array',
            'tags.*'            => 'string|max:50',
            'visibility'        => 'sometimes|in:public,private',
            'is_active'         => 'sometimes|boolean',
            'compatibility_tag' => 'sometimes|nullable|string|max:255',
            'generation_order'  => 'sometimes|integer|min:0',
        ], [
            'name.regex' => __('templatecontrollerphp399'),
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => __('templatecontrollerphp405'),
                'errors'  => $validator->errors(),
            ], 422);
        }

        // Rename uniqueness check — only when the name actually changes, so
        // a partial update that leaves the name alone never trips on itself.
        if ($request->filled('name') && $request->input('name') !== $template->name) {
            $duplicate = Template::where('name', $request->input('name'))
                ->where('creator_user_id', $user->id)
                ->where('is_active', true)
                ->where('id', '!=', $template->id)
                ->exists();

            if ($duplicate) {
                return response()->json([
                    'success' => false,
                    'message' => __('templatecontrollerphp421'),
                    'error'   => __('templatecontrollerphp422'),
                ], 409);
            }
        }

        try {
            // Only assign fields the caller actually sent. Using $request->only()
            // with array_keys keeps us partial-update-safe without touching any
            // attribute the user didn't mention.
            $updatable = array_intersect_key(
                $request->all(),
                array_flip([
                    'name', 'description', 'category', 'language', 'tags',
                    'visibility', 'is_active', 'compatibility_tag', 'generation_order',
                ])
            );

            // Re-derive full_name on EVERY update — not just on rename.
            // This way templates with a stale "projectname/templatename"
            // identity from older code paths self-heal the next time they
            // are saved, and the canonical form is always in sync with
            // {creator.username}/{template.name}. Use the template's actual
            // creator (not the caller!) because full_name is the template's
            // permanent identity, independent of who happens to be editing.
            $owner = $template->creator ?? $user;
            $finalName = $updatable['name'] ?? $template->name;
            $updatable['full_name'] = Template::buildFullName(
                $owner->username ?? $owner->name,
                $finalName,
                $template->id
            );

            $template->fill($updatable);
            $template->save();

            $response = [
                'success'        => true,
                'message'        => __('templatecontrollerphp_updated'),
                'updated_fields' => array_keys($updatable),
                'template'       => [
                    'id'                => $template->id,
                    'name'              => $template->name,
                    'description'       => $template->description,
                    'language'          => $template->language,
                    'category'          => $template->category,
                    'visibility'        => $template->visibility,
                    'is_active'         => (bool)$template->is_active,
                    'compatibility_tag' => $template->compatibility_tag,
                    'generation_order'  => $template->generation_order,
                    'tags'              => $template->tags,
                    'updated_at'        => $template->updated_at?->toIso8601String(),
                ],
            ];
            if ($warning = $this->unknownFieldsWarning($fieldCheck['unknown'])) {
                $response['warnings'] = $warning;
            }
            return response()->json($response, 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => __('templatecontrollerphp457'),
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete template (HARD delete - permanent!)
     *
     * DELETE /cli/templates/{id}
     *
     * @param int $id
     * @param Request $request
     * @return JsonResponse
     */
    public function delete(int $id, Request $request): JsonResponse
    {
        $template = Template::find($id);

        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => __('templatecontrollerphp479'),
            ], 404);
        }

        $user = $request->user();

        // Only creator or system admin can delete
        if ((string)$template->creator_user_id !== (string)$user->id) {
            return response()->json([
                'success' => false,
                'message' => __('templatecontrollerphp489'),
            ], 403);
        }

        // System templates cannot be deleted via CLI
        if ($template->is_system_template) {
            return response()->json([
                'success' => false,
                'message' => __('templatecontrollerphp497'),
            ], 403);
        }

        try {
            // Hard delete - completely remove from database
            $template->delete();

            return response()->json([
                'success' => true,
                'message' => __('templatecontrollerphp507'),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => __('templatecontrollerphp513'),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Import template from file/zip
     *
     * POST /cli/templates/import
     *
     * Note: This is a simplified version. Full implementation would handle
     * ZIP extraction, file parsing, etc.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function import(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name'        => 'required|string|max:255',
            // full_name is intentionally NOT accepted from the request — the
            // canonical "username/template_slug" identity is derived from the
            // importing user, never user-supplied.
            'description' => 'nullable|string|max:1000',
            'category'    => 'nullable|string|max:100',
            'language'    => 'required|string|max:100',
            'visibility'  => 'in:public,private',
            'tags'        => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => __('templatecontrollerphp545'),
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $importer = $request->user();
            // Create template
            $template = Template::create([
                'name'        => $request->input('name'),
                'full_name'   => Template::buildFullName($importer->username ?? $importer->name, $request->input('name')),
                'description' => $request->input('description'),
                'category'    => $request->input('category', 'general'),
                'language' => $request->input('language'),
                'visibility' => $request->input('visibility', 'private'),
                'tags' => $request->input('tags') ? json_encode($request->input('tags')) : null,
                'creator_user_id' => $request->user()->id,
                'is_active' => true,
                'is_system_template' => false,
                'file_count' => 0,
            ]);

            // TODO: Handle file upload and extraction
            // For now, just return the created template

            return response()->json([
                'success' => true,
                'message' => __('templatecontrollerphp571'),
                'template' => [
                    'id' => $template->id,
                    'name' => $template->name,
                    'language' => $template->language,
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => __('templatecontrollerphp582'),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * List templates linked to a specific project
     *
     * GET /cli/templates/project/{projectId}
     *
     * @param int $projectId
     * @param Request $request
     * @return JsonResponse
     */
    public function projectTemplates(int $projectId, Request $request): JsonResponse
    {
        $project = Project::find($projectId);

        if (!$project) {
            return response()->json([
                'success' => false,
                'message' => __('templatecontrollerphp604'),
            ], 404);
        }

        // Check project access
        if (!$this->userHasProjectAccess($project, $request->user())) {
            return response()->json([
                'success' => false,
                'message' => __('templatecontrollerphp612'),
            ], 403);
        }

        $templates = $project->templates()->get()->map(function ($template) {
            return [
                'id' => $template->id,
                'name' => $template->name,
                'description' => $template->description,
                'language' => $template->language,
                'framework' => $template->framework,
            ];
        });

        return response()->json([
            'success' => true,
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
            ],
            'templates' => $templates,
            'total' => $templates->count(),
        ], 200);
    }
}
