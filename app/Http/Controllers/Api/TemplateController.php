<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Template;
use App\Models\Project;
use App\Models\ProjectTemplateUsage;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TemplateController extends Controller
{
    /**
     * Get available templates for a project (system + accessible)
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $projectId = $request->get('project_id');

        if ($projectId) {
            // If project_id is specified, only show templates specifically for this project
            $project = Project::find($projectId);
            if (!$project || !$project->userCanAccess($user)) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            // Get templates linked to this project via project_template_usage table
            $templateIds = \DB::table('project_template_usage')
                ->where('project_id', $projectId)
                ->where('is_active', true)
                ->pluck('template_id');

            $templates = Template::whereIn('id', $templateIds)
                ->with(['creator', 'project'])
                ->orderBy('is_system_template', 'desc')
                ->orderBy('name')
                ->get();
        } else {
            // No project filter - show all accessible templates (including inactive)
            $templates = Template::accessibleByUser($user->id, $projectId)
                ->with(['creator', 'project'])
                ->orderBy('is_system_template', 'desc') // System templates first
                ->orderBy('is_active', 'desc') // Active templates first
                ->orderBy('name')
                ->get();
        }

        // Add usage information if project context is provided
        if ($projectId && isset($project)) {
            $templates->map(function ($template) use ($project) {
                $usage = $project->getTemplateUsage($template);
                $template->current_usage = $usage;
                $template->is_used_by_project = $usage !== null;
                $template->can_edit = $template->canBeEditedBy($project->owner);
                $template->can_clone = $template->canBeClonedBy($project->owner);
                $template->can_use = $template->canBeUsedBy($project->owner);
                return $template;
            });
        }

        return response()->json([
            'templates' => $templates,
            'system_templates' => $templates->where('is_system_template', true)->values(),
            'project_templates' => $templates->where('is_system_template', false)->values(),
        ]);
    }

    /**
     * Link a template to a project (USE button)
     */
    public function linkToProject(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'template_id' => 'required|exists:templates,id',
            'project_id' => 'required|exists:projects,id',
            'alias' => 'nullable|string|max:255',
            'config' => 'nullable|array',
        ]);

        $template = Template::findOrFail($validated['template_id']);
        $project = Project::findOrFail($validated['project_id']);

        // Check permissions
        if (!$project->userCanAccess($user)) {
            return response()->json(['message' => 'Unauthorized to access this project'], 403);
        }

        if (!$template->canBeUsedBy($user)) {
            return response()->json(['message' => 'Cannot use this template'], 403);
        }

        // Check if already using this template
        if ($project->isUsingTemplate($template)) {
            return response()->json(['message' => 'Template is already used by this project'], 400);
        }

        // Link the template
        $usage = $project->linkTemplate($template, $validated['alias'] ?? null, $validated['config'] ?? null);

        return response()->json([
            'message' => 'Template linked successfully',
            'usage' => $usage->load('template'),
        ]);
    }

    /**
     * Clone a template for a project (CLONE button)
     */
    public function cloneToProject(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'template_id' => 'required|exists:templates,id',
            'project_id' => 'required|exists:projects,id',
            'new_name' => [
                'nullable',
                'string',
                'max:255',
                function ($attribute, $value, $fail) {
                    if ($value && !\App\Models\Template::validateTemplateName($value)) {
                        $fail('Template name must be lowercase letters, numbers, and max one underscore.');
                    }
                },
            ],
            'visibility' => 'in:public,private',
        ]);

        $template = Template::findOrFail($validated['template_id']);
        $project = Project::findOrFail($validated['project_id']);

        // Check permissions
        if (!$project->userCanAccess($user)) {
            return response()->json(['message' => 'Unauthorized to access this project'], 403);
        }

        if (!$template->canBeClonedBy($user)) {
            return response()->json(['message' => 'Cannot clone this template'], 403);
        }

        // Clone the template
        $result = $project->cloneTemplate(
            $template,
            $validated['new_name'] ?? null,
            $validated['visibility'] ?? 'public'
        );

        return response()->json([
            'message' => 'Template cloned successfully',
            'template' => $result['template'],
            'usage' => $result['usage'],
        ]);
    }

    /**
     * Get project template usages
     */
    public function projectUsages(Project $project): JsonResponse
    {
        $user = Auth::user();

        if (!$project->userCanAccess($user)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $usages = $project->usedTemplates()->get();

        return response()->json([
            'usages' => $usages,
            'linked_count' => $usages->where('usage_type', 'linked')->count(),
            'cloned_count' => $usages->where('usage_type', 'cloned')->count(),
        ]);
    }

    /**
     * Get project templates (legacy endpoint for schema-versions)
     */
    public function getProjectTemplates(Request $request, $id): JsonResponse
    {
        try {
            $user = Auth::user();
            $projectId = $id; // Using the ID from the route parameter

            // Try to find the project (using project ID instead of schema version ID)
            $project = \App\Models\Project::find($projectId);

            // Get all templates that can be assigned to projects (include inactive for debugging)
            $availableTemplates = \App\Models\Template::with('files')
                ->orderBy('name')
                ->get();

            // Get templates linked to this project via project_template_usage table
            $linkedTemplateIds = \DB::table('project_template_usage')
                ->where('project_id', $projectId)
                ->where('is_active', true)
                ->pluck('template_id')
                ->toArray();

            // Mark which templates are assigned to this project
            $templatesWithAssignment = $availableTemplates->map(function ($template) use ($linkedTemplateIds) {
                $template->is_assigned = in_array($template->id, $linkedTemplateIds);
                return $template;
            });

            return response()->json([
                'success' => true,
                'templates' => $templatesWithAssignment,
                'project' => $project,
                'total_available' => $availableTemplates->count(),
                'assigned_count' => count($linkedTemplateIds),
                'linked_template_ids' => $linkedTemplateIds,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Assign templates to project (legacy endpoint)
     */
    public function assignToProject(Request $request, $id): JsonResponse
    {
        $user = Auth::user();
        $projectId = $id; // Schema version ID, but we'll treat it as project ID for now

        $validated = $request->validate([
            'template_ids' => 'required|array',
            'template_ids.*' => 'required|exists:templates,id',
        ]);

        $project = Project::findOrFail($projectId);

        // Check permissions
        if (!$project->userCanAccess($user)) {
            return response()->json(['message' => 'Unauthorized to access this project'], 403);
        }

        $assignedCount = 0;
        foreach ($validated['template_ids'] as $templateId) {
            $template = Template::findOrFail($templateId);

            // Check if user can use this template
            if (!$template->canBeUsedBy($user)) {
                continue; // Skip this template
            }

            // Check if already using this template
            if ($project->isUsingTemplate($template)) {
                continue; // Skip if already assigned
            }

            // Link the template to the project
            $project->linkTemplate($template);
            $assignedCount++;
        }

        return response()->json([
            'message' => "Successfully assigned {$assignedCount} template(s) to project",
            'assigned_count' => $assignedCount,
        ]);
    }

    /**
     * Remove template from project (legacy endpoint for schema-versions)
     */
    public function removeFromProject($schemaId, $templateId): JsonResponse
    {
        $user = Auth::user();

        // Cast to integers to ensure proper comparison
        $projectId = (int) $schemaId;
        $templateId = (int) $templateId;

        $project = Project::find($projectId);
        $template = Template::find($templateId);

        if (!$project) {
            return response()->json(['message' => 'Project not found'], 404);
        }

        if (!$template) {
            return response()->json(['message' => 'Template not found'], 404);
        }

        // Check permissions
        if (!$project->userCanAccess($user)) {
            return response()->json(['message' => 'Unauthorized to access this project'], 403);
        }

        // Find and deactivate the template usage (using strict integer comparison)
        $usage = ProjectTemplateUsage::where('project_id', $projectId)
            ->where('template_id', $templateId)
            ->where('is_active', true)
            ->first();

        if (!$usage) {
            return response()->json(['message' => 'Template is not assigned to this project'], 404);
        }

        // Deactivate the usage (soft delete)
        $usage->update(['is_active' => false]);

        return response()->json([
            'message' => 'Template removed from project successfully',
            'success' => true,
        ]);
    }

    /**
     * Remove template usage from project
     */
    public function removeUsage(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'usage_id' => 'required|exists:project_template_usage,id',
        ]);

        $usage = ProjectTemplateUsage::findOrFail($validated['usage_id']);

        if (!$usage->project->userCanAccess($user)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $usage->update(['is_active' => false]);

        return response()->json(['message' => 'Template usage removed successfully']);
    }

    /**
     * Store a newly created template
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
                Rule::unique('templates')->where(function ($query) use ($user) {
                    return $query->where('creator_user_id', $user->id);
                })
            ],
            'description' => 'nullable|string',
            'category' => 'required|string|max:100',
            'language' => 'required|string|max:50',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'is_active' => 'boolean',
            'visibility' => 'nullable|in:public,private',
            'is_system_template' => 'nullable|boolean',
            'files' => 'array',
            'files.*.file_name' => 'required|string',
            'files.*.file_content' => 'required|string',
            'files.*.file_type' => 'required|string',
            'files.*.file_order' => 'integer',
        ]);

        // Only system users can create system templates
        $isSystemTemplate = ($user->user_type === 'system' && ($validated['is_system_template'] ?? false));

        $template = Template::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'category' => $validated['category'],
            'language' => $validated['language'],
            'tags' => $validated['tags'] ?? [],
            'creator_user_id' => $user->id,
            'is_active' => $validated['is_active'] ?? true,
            'visibility' => $validated['visibility'] ?? 'public',
            'is_system_template' => $isSystemTemplate,
        ]);

        // Add files if provided
        if (isset($validated['files'])) {
            foreach ($validated['files'] as $fileData) {
                $template->files()->create([
                    'file_name' => $fileData['file_name'],
                    'file_path' => $fileData['file_name'], // Use file_name as file_path for now
                    'file_content' => $fileData['file_content'],
                    'file_type' => $fileData['file_type'],
                    'file_order' => $fileData['file_order'] ?? 0,
                ]);
            }
        }

        // Update file_count based on actual number of files
        $template->update(['file_count' => $template->files()->count()]);

        return response()->json($template->load('files'), 201);
    }

    /**
     * Display the specified template
     */
    public function show(Template $template): JsonResponse
    {
        $user = Auth::user();

        // Check if user can view this template
        if (!$template->canBeViewedBy($user)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($template->load(['files', 'creator']));
    }

    /**
     * Update the specified template
     */
    public function update(Request $request, Template $template): JsonResponse
    {
        $user = Auth::user();

        // Check if user can edit this template
        if (!$template->canBeEditedBy($user)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(_[a-z0-9]+)*$/', // Lowercase letters, numbers, and underscores for snake_case
                Rule::unique('templates')->ignore($template->id)->where(function ($query) use ($user) {
                    return $query->where('creator_user_id', $user->id);
                })
            ],
            'description' => 'nullable|string',
            'category' => 'required|string|max:100',
            'language' => 'required|string|max:50',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'is_active' => 'boolean',
            'visibility' => 'nullable|in:public,private',
            'is_system_template' => 'nullable|boolean',
            'files' => 'array',
            'files.*.file_name' => 'required|string',
            'files.*.file_content' => 'required|string',
            'files.*.file_type' => 'required|string',
            'files.*.file_order' => 'integer',
        ]);

        // Only system users can set/change system template flag
        $updateData = [
            'name' => $validated['name'],
            'description' => $validated['description'],
            'category' => $validated['category'],
            'language' => $validated['language'],
            'tags' => $validated['tags'] ?? [],
            'is_active' => $validated['is_active'] ?? true,
        ];

        if (isset($validated['visibility'])) {
            $updateData['visibility'] = $validated['visibility'];
        }

        if ($user->user_type === 'system' && isset($validated['is_system_template'])) {
            $updateData['is_system_template'] = $validated['is_system_template'];
        }

        $template->update($updateData);

        // Update files - delete existing and recreate
        if (isset($validated['files'])) {
            $template->files()->delete();

            foreach ($validated['files'] as $fileData) {
                $template->files()->create([
                    'file_name' => $fileData['file_name'],
                    'file_path' => $fileData['file_name'], // Use file_name as file_path for now
                    'file_content' => $fileData['file_content'],
                    'file_type' => $fileData['file_type'],
                    'file_order' => $fileData['file_order'] ?? 0,
                ]);
            }

            // Update file_count based on actual number of files
            $template->update(['file_count' => $template->files()->count()]);
        }

        return response()->json($template->load('files'));
    }

    /**
     * Remove the specified template (soft delete)
     */
    public function destroy(Template $template): JsonResponse
    {
        $user = Auth::user();

        // Check if user can delete this template
        if (!$template->canBeEditedBy($user)) {
            if ($template->is_system_template) {
                return response()->json(['message' => 'System-Templates können nicht gelöscht werden'], 403);
            } elseif ($template->visibility === 'public' && $template->creator_user_id !== $user->id) {
                return response()->json(['message' => 'Public Templates anderer Benutzer können nicht gelöscht werden'], 403);
            } else {
                return response()->json(['message' => 'Sie haben keine Berechtigung, dieses Template zu löschen'], 403);
            }
        }

        // Delete the template (CASCADE will automatically delete related files and project usages)
        $template->delete();

        return response()->json(['message' => 'Template deleted successfully']);
    }

    /**
     * Permanently delete the specified template (hard delete)
     */
    public function forceDestroy(Template $template): JsonResponse
    {
        $user = Auth::user();

        // Check if user can delete this template
        if (!$template->canBeEditedBy($user)) {
            if ($template->is_system_template) {
                return response()->json(['message' => 'System-Templates können nicht permanent gelöscht werden'], 403);
            } elseif ($template->visibility === 'public' && $template->creator_user_id !== $user->id) {
                return response()->json(['message' => 'Public Templates anderer Benutzer können nicht permanent gelöscht werden'], 403);
            } else {
                return response()->json(['message' => 'Sie haben keine Berechtigung, dieses Template permanent zu löschen'], 403);
            }
        }

        // Delete related files first
        $template->files()->delete();

        // Delete template usage records
        $template->projectUsages()->delete();

        // Delete the template itself
        $template->delete();

        return response()->json(['message' => 'Template permanently deleted']);
    }

    /**
     * Toggle active status of the specified template
     */
    public function toggleActive(Template $template): JsonResponse
    {
        $user = Auth::user();

        // Check if user can edit this template
        if (!$template->canBeEditedBy($user)) {
            if ($template->is_system_template) {
                return response()->json(['message' => 'System-Templates können nicht aktiviert/deaktiviert werden'], 403);
            } elseif ($template->visibility === 'public' && $template->creator_user_id !== $user->id) {
                return response()->json(['message' => 'Public Templates anderer Benutzer können nicht geändert werden'], 403);
            } else {
                return response()->json(['message' => 'Sie haben keine Berechtigung, dieses Template zu ändern'], 403);
            }
        }

        $newStatus = !$template->is_active;
        $template->update(['is_active' => $newStatus]);

        $message = $newStatus ? 'Template activated successfully' : 'Template deactivated successfully';

        return response()->json([
            'message' => $message,
            'is_active' => $newStatus
        ]);
    }

    /**
     * Clone a template
     */
    public function cloneTemplate(Request $request, Template $template): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('templates')->where(function ($query) use ($user) {
                    return $query->where('creator_user_id', $user->id);
                })
            ],
            'visibility' => 'required|in:public,private',
        ]);

        // Check if user can view the source template
        if (!$template->canBeViewedBy($user)) {
            return response()->json(['message' => 'Sie haben keine Berechtigung, dieses Template zu klonen'], 403);
        }

        // Create the cloned template
        $clonedTemplate = Template::create([
            'name' => $validated['name'],
            'description' => $template->description,
            'category' => $template->category,
            'language' => $template->language,
            'tags' => $template->tags,
            'creator_user_id' => $user->id,
            'visibility' => $validated['visibility'],
            'is_active' => true,
            'is_system_template' => false, // Cloned templates are never system templates
            'file_count' => $template->file_count,
        ]);

        // Clone template files
        foreach ($template->files as $file) {
            $clonedTemplate->files()->create([
                'file_name' => $file->file_name,
                'file_path' => $file->file_path,
                'file_content' => $file->file_content,
                'file_type' => $file->file_type,
                'file_order' => $file->file_order,
            ]);
        }

        return response()->json([
            'message' => 'Template erfolgreich geklont',
            'template' => $clonedTemplate->load('files'),
        ]);
    }

    /**
     * Check if template name exists for current user
     */
    public function checkTemplateName(Request $request): JsonResponse
    {
        $user = Auth::user();
        $name = $request->get('name');

        if (!$name) {
            return response()->json(['exists' => false]);
        }

        $exists = Template::where('creator_user_id', $user->id)
            ->where('name', $name)
            ->exists();

        return response()->json(['exists' => $exists]);
    }

    /**
     * Get template dependencies (DB schemas)
     */
    public function getTemplateDependencies(Template $template): JsonResponse
    {
        $user = Auth::user();

        // Check if user can view this template
        if (!$template->canBeViewedBy($user)) {
            return response()->json(['message' => 'Sie haben keine Berechtigung, dieses Template zu betrachten'], 403);
        }

        try {
            $dependencies = \App\Models\TemplateDbSchemaDependency::where('template_id', $template->id)
                ->with(['dbSchema.owner'])
                ->get();

            return response()->json([
                'success' => true,
                'dependencies' => $dependencies->map(function ($dependency) {
                    return [
                        'id' => $dependency->id,
                        'template_id' => $dependency->template_id,
                        'schema_id' => $dependency->schema_id,
                        'is_required' => $dependency->is_required,
                        'alias' => $dependency->alias,
                        'db_schema' => [
                            'id' => $dependency->dbSchema->id,
                            'name' => $dependency->dbSchema->name,
                            'description' => $dependency->dbSchema->description,
                            'owner_id' => $dependency->dbSchema->owner_id,
                            'visibility' => $dependency->dbSchema->visibility,
                            'last_version' => $dependency->dbSchema->last_version,
                            'owner' => $dependency->dbSchema->owner ? [
                                'name' => $dependency->dbSchema->owner->name,
                                'user_type' => $dependency->dbSchema->owner->user_type,
                            ] : null,
                        ],
                    ];
                })
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to load template dependencies'
            ], 500);
        }
    }

    /**
     * Add a DB schema dependency to a template
     */
    public function addDbSchemaDependency(Request $request, Template $template): JsonResponse
    {
        $user = Auth::user();

        // Check if user can edit this template
        if (!$template->canBeEditedBy($user)) {
            return response()->json(['message' => 'Sie haben keine Berechtigung, dieses Template zu bearbeiten'], 403);
        }

        try {
            $validated = $request->validate([
                'schema_id' => 'required|exists:schemas,id',
                'is_required' => 'boolean',
                'alias' => 'nullable|string|max:255',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation failed for add DB schema dependency', [
                'template_id' => $template->id,
                'request_data' => $request->all(),
                'validation_errors' => $e->errors()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'validation_errors' => $e->errors()
            ], 422);
        }

        try {
            // Check if this dependency already exists
            $existing = \App\Models\TemplateDbSchemaDependency::where('template_id', $template->id)
                ->where('schema_id', $validated['schema_id'])
                ->first();

            if ($existing) {
                return response()->json([
                    'success' => false,
                    'error' => 'Diese Abhängigkeit existiert bereits'
                ], 422);
            }

            // Create the dependency
            $dependency = \App\Models\TemplateDbSchemaDependency::create([
                'template_id' => $template->id,
                'schema_id' => $validated['schema_id'],
                'is_required' => $validated['is_required'] ?? true,
                'alias' => $validated['alias'] ?? null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'DB Schema Abhängigkeit erfolgreich hinzugefügt',
                'dependency' => $dependency->load('dbSchema.owner')
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to add DB schema dependency: ' . $e->getMessage(), [
                'template_id' => $template->id,
                'request_data' => $validated ?? $request->all(),
                'exception' => $e
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to add dependency: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove a DB schema dependency from a template
     */
    public function removeDbSchemaDependency(Template $template, $schemaId): JsonResponse
    {
        $user = Auth::user();

        // Check if user can edit this template
        if (!$template->canBeEditedBy($user)) {
            return response()->json(['message' => 'Sie haben keine Berechtigung, dieses Template zu bearbeiten'], 403);
        }

        try {
            $dependency = \App\Models\TemplateDbSchemaDependency::where('template_id', $template->id)
                ->where('schema_id', $schemaId)
                ->first();

            if (!$dependency) {
                return response()->json([
                    'success' => false,
                    'error' => 'Abhängigkeit nicht gefunden'
                ], 404);
            }

            $dependency->delete();

            return response()->json([
                'success' => true,
                'message' => 'DB Schema Abhängigkeit erfolgreich entfernt'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to remove dependency'
            ], 500);
        }
    }

    /**
     * Get all files for a template
     */
    public function getTemplateFiles($id): JsonResponse
    {
        $template = Template::with('files')->findOrFail($id);
        $user = Auth::user();

        if (!$template->canBeViewedBy($user)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($template->files);
    }

    /**
     * Add a file to a template
     */
    public function addTemplateFile(Request $request, $id): JsonResponse
    {
        $template = Template::findOrFail($id);
        $user = Auth::user();

        if (!$template->canBeEditedBy($user)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'file_name' => 'required|string',
            'file_content' => 'required|string',
            'file_type' => 'required|string',
            'file_order' => 'integer',
            'output_path' => 'nullable|string',
        ]);

        $file = $template->files()->create([
            'file_name' => $validated['file_name'],
            'file_path' => $validated['file_name'],
            'file_content' => $validated['file_content'],
            'file_type' => $validated['file_type'],
            'file_order' => $validated['file_order'] ?? 0,
            'output_path' => $validated['output_path'] ?? '/',
        ]);

        // Update file_count
        $template->update(['file_count' => $template->files()->count()]);

        return response()->json($file, 201);
    }

    /**
     * Update a template file
     */
    public function updateTemplateFile(Request $request, $templateId, $fileId): JsonResponse
    {
        $template = Template::findOrFail($templateId);
        $user = Auth::user();

        if (!$template->canBeEditedBy($user)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $file = $template->files()->findOrFail($fileId);

        $validated = $request->validate([
            'file_name' => 'required|string',
            'file_content' => 'required|string',
            'file_type' => 'required|string',
            'file_order' => 'integer',
            'output_path' => 'nullable|string',
        ]);

        $file->update([
            'file_name' => $validated['file_name'],
            'file_path' => $validated['file_name'],
            'file_content' => $validated['file_content'],
            'file_type' => $validated['file_type'],
            'file_order' => $validated['file_order'] ?? $file->file_order,
            'output_path' => $validated['output_path'] ?? $file->output_path,
        ]);

        return response()->json($file);
    }

    /**
     * Delete a template file
     */
    public function deleteTemplateFile($templateId, $fileId): JsonResponse
    {
        $template = Template::findOrFail($templateId);
        $user = Auth::user();

        if (!$template->canBeEditedBy($user)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $file = $template->files()->findOrFail($fileId);
        $file->delete();

        // Update file_count
        $template->update(['file_count' => $template->files()->count()]);

        return response()->json(['message' => 'File deleted successfully']);
    }
}
