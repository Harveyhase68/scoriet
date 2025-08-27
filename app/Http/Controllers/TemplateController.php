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
            ]);

            $template->update($validated);

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
}