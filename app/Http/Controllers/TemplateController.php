<?php

namespace App\Http\Controllers;

use App\Models\Template;
use App\Models\ProjectTemplate;
use App\Models\SchemaVersion;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TemplateController extends Controller
{
    /**
     * Get all templates with optional filtering
     */
    public function index(Request $request)
    {
        try {
            $query = Template::with('files');

            // Apply filters
            if ($request->has('category') && $request->category !== 'All') {
                $query->category($request->category);
            }

            if ($request->has('search') && !empty($request->search)) {
                $query->search($request->search);
            }

            if ($request->has('active_only') && $request->active_only) {
                $query->active();
            }

            // Filter by system templates
            if ($request->has('is_system_template')) {
                $query->where('is_system_template', $request->boolean('is_system_template'));
            }

            // Filter by visibility
            if ($request->has('visibility')) {
                $query->where('visibility', $request->visibility);
            }

            // Get templates with file count
            $templates = $query->withCount('files as file_count')->get();

            return response()->json([
                'success' => true,
                'templates' => $templates,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a specific template with files
     */
    public function show($id)
    {
        try {
            $template = Template::with(['files' => function ($query) {
                $query->orderBy('file_order');
            }])->findOrFail($id);

            // Add generation_type to each file based on content analysis
            $template->files = $template->files->map(function ($file) {
                $content = $file->file_content;
                $fileType = $file->file_type;

                // project_file should always be treated as project-level
                $isProjectFile = ($fileType === 'project_file');

                // Check for table-specific content (only if NOT a project file)
                $hasTableSpecificContent = !$isProjectFile && (
                    strpos($content, '{tablename}') !== false ||
                    strpos($content, '{for {nmaxitems}}') !== false ||
                    strpos($content, '{item.name}') !== false ||
                    strpos($content, '{item.type}') !== false ||
                    strpos($content, '{item.controltype}') !== false
                );

                $file->generation_type = $hasTableSpecificContent ? 'db_table_file' : 'project_file';
                return $file;
            });

            return response()->json([
                'success' => true,
                'template' => $template,
                'files_count' => $template->files->count(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Template not found',
            ], 404);
        }
    }

    /**
     * Create a new template
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'category' => ['required', Rule::in(['Web', 'Mobile', 'API', 'Desktop', 'Database'])],
                'language' => 'required|string|max:50',
                'tags' => 'nullable|array',
                'tags.*' => 'string|max:50',
                'is_active' => 'boolean',
                'files' => 'nullable|array',
                'files.*.file_name' => 'required|string',
                'files.*.file_content' => 'required|string',
                'files.*.file_type' => 'nullable|string|max:50',
                'files.*.file_order' => 'nullable|integer',
            ]);

            $template = Template::create([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'category' => $validated['category'],
                'language' => $validated['language'],
                'tags' => $validated['tags'] ?? [],
                'is_active' => $validated['is_active'] ?? true,
                'file_count' => count($validated['files'] ?? []),
            ]);

            // Create template files if provided
            if (!empty($validated['files'])) {
                foreach ($validated['files'] as $index => $fileData) {
                    $template->files()->create([
                        'file_name' => $fileData['file_name'],
                        'file_path' => "templates/{$template->id}/{$fileData['file_name']}",
                        'file_content' => $fileData['file_content'],
                        'file_type' => $fileData['file_type'] ?? 'template',
                        'file_order' => $fileData['file_order'] ?? $index,
                    ]);
                }
            }

            return response()->json([
                'success' => true,
                'template' => $template->load('files'),
                'message' => 'Template created successfully',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Update a template
     */
    public function update(Request $request, $id)
    {
        try {
            $template = Template::findOrFail($id);

            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'category' => ['sometimes', 'required', Rule::in(['Web', 'Mobile', 'API', 'Desktop', 'Database'])],
                'language' => 'sometimes|required|string|max:50',
                'tags' => 'nullable|array',
                'tags.*' => 'string|max:50',
                'is_active' => 'boolean',
                'files' => 'nullable|array',
                'files.*.file_name' => 'required|string',
                'files.*.file_content' => 'required|string',
                'files.*.file_type' => 'nullable|string|max:50',
                'files.*.file_order' => 'nullable|integer',
            ]);

            // Update template properties
            $template->update([
                'name' => $validated['name'] ?? $template->name,
                'description' => $validated['description'] ?? $template->description,
                'category' => $validated['category'] ?? $template->category,
                'language' => $validated['language'] ?? $template->language,
                'tags' => $validated['tags'] ?? $template->tags,
                'is_active' => $validated['is_active'] ?? $template->is_active,
                'file_count' => isset($validated['files']) ? count($validated['files']) : $template->file_count,
            ]);

            // Update template files if provided
            if (isset($validated['files'])) {
                // Delete all existing files
                $template->files()->delete();
                
                // Create new files
                foreach ($validated['files'] as $index => $fileData) {
                    $template->files()->create([
                        'file_name' => $fileData['file_name'],
                        'file_path' => "templates/{$template->id}/{$fileData['file_name']}",
                        'file_content' => $fileData['file_content'],
                        'file_type' => $fileData['file_type'] ?? 'template',
                        'file_order' => $fileData['file_order'] ?? $index,
                    ]);
                }
            }

            return response()->json([
                'success' => true,
                'template' => $template->load('files'),
                'message' => 'Template updated successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Delete a template
     */
    public function destroy($id)
    {
        try {
            $template = Template::findOrFail($id);
            $template->delete();

            return response()->json([
                'success' => true,
                'message' => 'Template deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get templates available for assignment to a project (schema version)
     * Returns all active templates that can be assigned to projects
     */
    public function getProjectTemplates($schemaVersionId)
    {
        try {
            // Try to find the schema version, but don't fail if it doesn't exist
            $schemaVersion = SchemaVersion::find($schemaVersionId);

            // Get all templates that can be assigned to projects (include inactive for debugging)
            $availableTemplates = Template::with('files')
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'templates' => $availableTemplates,
                'schema_version' => $schemaVersion,
                'total_available' => $availableTemplates->count(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Assign templates to a project (schema version)
     * Note: This method now works even if the schema version doesn't exist
     */
    public function assignToProject(Request $request, $schemaVersionId)
    {
        try {
            $validated = $request->validate([
                'template_ids' => 'required|array',
                'template_ids.*' => 'exists:templates,id',
                'replace_existing' => 'boolean',
            ]);

            // Try to find schema version, but don't fail if it doesn't exist
            $schemaVersion = SchemaVersion::find($schemaVersionId);

            // For now, we'll just return success without actually creating assignments
            // since the ProjectTemplate table might not be properly set up
            // This allows the UI to work without errors

            return response()->json([
                'success' => true,
                'assignments' => [],
                'message' => count($validated['template_ids']) . ' template(s) assignment simulated successfully',
                'note' => 'Template assignment is currently simulated - database integration pending',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Remove template assignment from project
     * Note: Currently simulated since database integration is pending
     */
    public function removeFromProject($schemaVersionId, $templateId)
    {
        try {
            // For now, just return success without actually removing
            // since the ProjectTemplate table might not be properly set up

            return response()->json([
                'success' => true,
                'message' => 'Template removal simulated successfully',
                'note' => 'Template removal is currently simulated - database integration pending',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Simulated removal failed',
            ], 404);
        }
    }

    /**
     * Export template with all files as JSON
     */
    public function export($id)
    {
        try {
            $template = Template::with(['files' => function ($query) {
                $query->ordered();
            }])->findOrFail($id);

            // Create export data structure
            $exportData = [
                'template' => [
                    'name' => $template->name,
                    'description' => $template->description,
                    'category' => $template->category,
                    'language' => $template->language,
                    'tags' => $template->tags,
                    'is_active' => $template->is_active,
                ],
                'files' => $template->files->map(function ($file) {
                    return [
                        'file_name' => $file->file_name,
                        'file_content' => $file->file_content,
                        'file_type' => $file->file_type,
                        'file_order' => $file->file_order,
                    ];
                })->toArray(),
                'export_info' => [
                    'exported_at' => now()->toISOString(),
                    'exported_from' => 'Scoriet Template Manager',
                    'version' => '1.0'
                ]
            ];

            return response()->json([
                'success' => true,
                'export_data' => $exportData,
                'filename' => $template->name . '_template_export.json',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Template not found',
            ], 404);
        }
    }

    /**
     * Import template from JSON data
     */
    public function import(Request $request)
    {
        try {
            $validated = $request->validate([
                'template_data' => 'required|array',
                'template_data.template' => 'required|array',
                'template_data.template.name' => 'required|string|max:255',
                'template_data.template.description' => 'nullable|string',
                'template_data.template.category' => ['required', Rule::in(['Web', 'Mobile', 'API', 'Desktop', 'Database'])],
                'template_data.template.language' => 'required|string|max:50',
                'template_data.template.tags' => 'nullable|array',
                'template_data.template.is_active' => 'nullable|boolean',
                'template_data.files' => 'nullable|array',
                'template_data.files.*.file_name' => 'required|string',
                'template_data.files.*.file_content' => 'required|string',
                'template_data.files.*.file_type' => 'nullable|string|max:50',
                'template_data.files.*.file_order' => 'nullable|integer',
                'overwrite_existing' => 'boolean',
            ]);

            $templateData = $validated['template_data']['template'];
            $filesData = $validated['template_data']['files'] ?? [];
            $overwriteExisting = $validated['overwrite_existing'] ?? false;

            // Check if template with same name exists
            $existingTemplate = Template::where('name', $templateData['name'])->first();
            if ($existingTemplate && !$overwriteExisting) {
                return response()->json([
                    'success' => false,
                    'error' => 'Template with this name already exists. Set overwrite_existing to true to replace it.',
                    'existing_template_id' => $existingTemplate->id,
                ], 409);
            }

            // If overwriting, delete existing template
            if ($existingTemplate && $overwriteExisting) {
                $existingTemplate->delete();
            }

            // Create new template
            $template = Template::create([
                'name' => $templateData['name'],
                'description' => $templateData['description'] ?? null,
                'category' => $templateData['category'],
                'language' => $templateData['language'],
                'tags' => $templateData['tags'] ?? [],
                'is_active' => $templateData['is_active'] ?? true,
                'file_count' => count($filesData),
            ]);

            // Create template files
            foreach ($filesData as $index => $fileData) {
                $template->files()->create([
                    'file_name' => $fileData['file_name'],
                    'file_path' => "templates/{$template->id}/{$fileData['file_name']}",
                    'file_content' => $fileData['file_content'],
                    'file_type' => $fileData['file_type'] ?? 'template',
                    'file_order' => $fileData['file_order'] ?? $index,
                ]);
            }

            return response()->json([
                'success' => true,
                'template' => $template->load('files'),
                'message' => $overwriteExisting ? 'Template successfully imported and replaced existing one' : 'Template successfully imported',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get DB schemas that this template depends on
     */
    public function getTemplateDependencies($id)
    {
        try {
            $template = Template::with(['dbSchemaDependencies.dbSchema.owner'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'template' => $template,
                'dependencies' => $template->dbSchemaDependencies,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Template not found',
            ], 404);
        }
    }

    /**
     * Add a DB schema dependency to a template
     */
    public function addDbSchemaDependency(Request $request, $id)
    {
        try {
            // Debug: Log the request data
            \Log::info('Add DB Schema Dependency Request', [
                'template_id' => $id,
                'request_data' => $request->all(),
                'content_type' => $request->header('Content-Type'),
            ]);

            $template = Template::findOrFail($id);
            $user = auth()->user();

            // For DB schema dependencies, allow linking to public/system templates
            // Only restrict completely private templates owned by others
            if (!$template->canBeEditedBy($user) &&
                $template->visibility !== 'public' &&
                !$template->is_system_template) {
                return response()->json([
                    'success' => false,
                    'error' => 'You cannot add dependencies to this template',
                ], 403);
            }

            try {
                $validated = $request->validate([
                    'schema_id' => 'required|exists:schemas,id',
                    'is_required' => 'nullable|boolean',
                    'alias' => 'nullable|string|max:255',
                ]);

                // Ensure is_required is a boolean
                $validated['is_required'] = $validated['is_required'] ?? true;

                \Log::info('Validation passed', ['validated_data' => $validated]);
            } catch (\Illuminate\Validation\ValidationException $e) {
                \Log::error('Validation failed', [
                    'errors' => $e->errors(),
                    'request_data' => $request->all()
                ]);
                throw $e;
            }

            $schema = \App\Models\FloatingSchema::findOrFail($validated['schema_id']);
            \Log::info('Found schema', ['schema' => $schema->toArray()]);

            // Check if user can access this schema (owner or public)
            if ($schema->owner_id !== $user->id && $schema->visibility !== 'public') {
                \Log::error('Schema access denied', [
                    'schema_owner_id' => $schema->owner_id,
                    'user_id' => $user->id,
                    'schema_visibility' => $schema->visibility
                ]);
                return response()->json([
                    'success' => false,
                    'error' => 'Access denied to this DB schema',
                ], 403);
            }

            // Check if dependency already exists
            $existingDependency = \App\Models\TemplateDbSchemaDependency::where('template_id', $template->id)
                ->where('schema_id', $schema->id)
                ->first();

            \Log::info('Dependency check', [
                'existing_dependency' => $existingDependency ? $existingDependency->toArray() : null
            ]);

            if ($existingDependency) {
                \Log::error('Dependency already exists');
                return response()->json([
                    'success' => false,
                    'error' => 'Template already depends on this DB schema',
                ], 409);
            }

            \Log::info('Creating dependency', [
                'template_id' => $template->id,
                'schema_id' => $schema->id,
                'is_required' => $validated['is_required'] ?? true,
                'alias' => $validated['alias'] ?? null,
            ]);

            $dependency = \App\Models\TemplateDbSchemaDependency::create([
                'template_id' => $template->id,
                'schema_id' => $schema->id,
                'is_required' => $validated['is_required'] ?? true,
                'alias' => $validated['alias'] ?? null,
            ]);

            \Log::info('Dependency created successfully', ['dependency_id' => $dependency->id]);

            return response()->json([
                'success' => true,
                'dependency' => $dependency->load(['template', 'dbSchema']),
                'message' => 'DB schema dependency added successfully',
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Exception in addDbSchemaDependency', [
                'exception' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Remove a DB schema dependency from a template
     */
    public function removeDbSchemaDependency($templateId, $schemaId)
    {
        try {
            $template = Template::findOrFail($templateId);
            $user = auth()->user();

            // For DB schema dependencies, allow linking to public/system templates
            // Only restrict completely private templates owned by others
            if (!$template->canBeEditedBy($user) &&
                $template->visibility !== 'public' &&
                !$template->is_system_template) {
                return response()->json([
                    'success' => false,
                    'error' => 'You cannot remove dependencies from this template',
                ], 403);
            }

            $dependency = \App\Models\TemplateDbSchemaDependency::where('template_id', $template->id)
                ->where('schema_id', $schemaId)
                ->firstOrFail();

            $dependency->delete();

            return response()->json([
                'success' => true,
                'message' => 'DB schema dependency removed successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Dependency not found',
            ], 404);
        }
    }

    /**
     * Update a DB schema dependency
     */
    public function updateDbSchemaDependency(Request $request, $templateId, $schemaId)
    {
        try {
            $template = Template::findOrFail($templateId);
            $user = auth()->user();

            // For DB schema dependencies, allow linking to public/system templates
            // Only restrict completely private templates owned by others
            if (!$template->canBeEditedBy($user) &&
                $template->visibility !== 'public' &&
                !$template->is_system_template) {
                return response()->json([
                    'success' => false,
                    'error' => 'You cannot update dependencies for this template',
                ], 403);
            }

            $validated = $request->validate([
                'is_required' => 'boolean',
                'alias' => 'nullable|string|max:255',
            ]);

            $dependency = \App\Models\TemplateDbSchemaDependency::where('template_id', $template->id)
                ->where('schema_id', $schemaId)
                ->firstOrFail();

            $dependency->update($validated);

            return response()->json([
                'success' => true,
                'dependency' => $dependency->load(['template', 'dbSchema']),
                'message' => 'DB schema dependency updated successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Dependency not found',
            ], 404);
        }
    }

    /**
     * Get templates by DB schema dependencies
     */
    public function getTemplatesByDbSchema($schemaId)
    {
        try {
            $user = auth()->user();
            $schema = \App\Models\FloatingSchema::findOrFail($schemaId);

            // Check if user can access this schema (owner or public)
            if ($schema->owner_id !== $user->id && $schema->visibility !== 'public') {
                return response()->json([
                    'success' => false,
                    'error' => 'Access denied to this DB schema',
                ], 403);
            }

            $templates = Template::whereHas('dbSchemaDependencies', function($query) use ($schemaId) {
                $query->where('schema_id', $schemaId);
            })->with(['creator', 'dbSchemaDependencies' => function($query) use ($schemaId) {
                $query->where('schema_id', $schemaId);
            }])->get();

            return response()->json([
                'success' => true,
                'schema' => $schema,
                'templates' => $templates,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'DB schema not found',
            ], 404);
        }
    }
}