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
                $query->ordered();
            }])->findOrFail($id);

            return response()->json([
                'success' => true,
                'template' => $template,
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
     * Get templates assigned to a project (schema version)
     */
    public function getProjectTemplates($schemaVersionId)
    {
        try {
            $schemaVersion = SchemaVersion::findOrFail($schemaVersionId);
            
            $projectTemplates = ProjectTemplate::with('template.files')
                ->where('schema_version_id', $schemaVersionId)
                ->enabled()
                ->get();

            return response()->json([
                'success' => true,
                'project_templates' => $projectTemplates,
                'schema_version' => $schemaVersion,
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
     */
    public function assignToProject(Request $request, $schemaVersionId)
    {
        try {
            $validated = $request->validate([
                'template_ids' => 'required|array',
                'template_ids.*' => 'exists:templates,id',
                'replace_existing' => 'boolean',
            ]);

            $schemaVersion = SchemaVersion::findOrFail($schemaVersionId);

            // If replace_existing is true, remove all current assignments
            if ($validated['replace_existing'] ?? false) {
                ProjectTemplate::where('schema_version_id', $schemaVersionId)->delete();
                
                // Create fresh assignments
                $assignments = [];
                foreach ($validated['template_ids'] as $templateId) {
                    $assignment = ProjectTemplate::create([
                        'schema_version_id' => $schemaVersionId,
                        'template_id' => $templateId,
                        'is_enabled' => true,
                        'template_config' => [],
                    ]);
                    $assignments[] = $assignment;
                }
            } else {
                // Only update/create if not replacing
                $assignments = [];
                foreach ($validated['template_ids'] as $templateId) {
                    $assignment = ProjectTemplate::updateOrCreate(
                        [
                            'schema_version_id' => $schemaVersionId,
                            'template_id' => $templateId,
                        ],
                        [
                            'is_enabled' => true,
                            'template_config' => [],
                        ]
                    );
                    $assignments[] = $assignment;
                }
            }

            return response()->json([
                'success' => true,
                'assignments' => $assignments,
                'message' => count($validated['template_ids']) . ' template(s) assigned to project',
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
     */
    public function removeFromProject($schemaVersionId, $templateId)
    {
        try {
            $assignment = ProjectTemplate::where('schema_version_id', $schemaVersionId)
                ->where('template_id', $templateId)
                ->firstOrFail();

            $assignment->delete();

            return response()->json([
                'success' => true,
                'message' => 'Template removed from project',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Assignment not found',
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
}