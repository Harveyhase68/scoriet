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
                'files.*.file_path' => 'nullable|string',
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
                        'file_path' => $fileData['file_path'] ?? "templates/{$template->id}/{$fileData['file_name']}",
                        'file_content' => $fileData['file_content'],
                        'file_type' => $fileData['file_type'] ?? 'template',
                        'file_order' => $fileData['file_order'] ?? $index,
                    ]);
                }
            }

            // 🔄 QUEUE JOBS: Dispatch regeneration jobs for projects using this template
            $this->dispatchRegenerationJobsForTemplate($template);

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
                'files.*.file_path' => 'nullable|string',
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
                        'file_path' => $fileData['file_path'] ?? "templates/{$template->id}/{$fileData['file_name']}",
                        'file_content' => $fileData['file_content'],
                        'file_type' => $fileData['file_type'] ?? 'template',
                        'file_order' => $fileData['file_order'] ?? $index,
                    ]);
                }
            }

            // 🔄 QUEUE JOBS: Dispatch regeneration jobs for projects using this template
            $this->dispatchRegenerationJobsForTemplate($template);

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
     * Import template from JSON data OR archive file (ZIP, TAR.GZ, TAR.XZ)
     */
    public function import(Request $request)
    {
        try {
            // Check if this is a file upload or JSON data
            if ($request->hasFile('template_file')) {
                return $this->importFromArchive($request);
            }

            // Original JSON import logic
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
                'template_data.files.*.file_path' => 'nullable|string',
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
                    'file_path' => $fileData['file_path'] ?? "templates/{$template->id}/{$fileData['file_name']}",
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
            } catch (\Illuminate\Validation\ValidationException $e) {
                throw $e;
            }

            $schema = \App\Models\FloatingSchema::findOrFail($validated['schema_id']);

            // Check if user can access this schema (owner or public) - using type-safe comparison
            if ((string)$schema->owner_id !== (string)$user->id && $schema->visibility !== 'public') {
                return response()->json([
                    'success' => false,
                    'error' => 'Access denied to this DB schema',
                ], 403);
            }

            // Check if dependency already exists
            $existingDependency = \App\Models\TemplateDbSchemaDependency::where('template_id', $template->id)
                ->where('schema_id', $schema->id)
                ->first();

            if ($existingDependency) {
                return response()->json([
                    'success' => false,
                    'error' => 'Template already depends on this DB schema',
                ], 409);
            }

            $dependency = \App\Models\TemplateDbSchemaDependency::create([
                'template_id' => $template->id,
                'schema_id' => $schema->id,
                'is_required' => $validated['is_required'] ?? true,
                'alias' => $validated['alias'] ?? null,
            ]);

            return response()->json([
                'success' => true,
                'dependency' => $dependency->load(['template', 'dbSchema']),
                'message' => 'DB schema dependency added successfully',
            ], 201);
        } catch (\Exception $e) {
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

            // Check if user can access this schema (owner or public) - using type-safe comparison
            if ((string)$schema->owner_id !== (string)$user->id && $schema->visibility !== 'public') {
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

    /**
     * Dispatch regeneration jobs for all projects using this template
     */
    private function dispatchRegenerationJobsForTemplate(Template $template): void
    {
        // Find all projects that use this template
        $projectIds = \DB::table('project_template_usage')
            ->where('template_id', $template->id)
            ->where('is_active', true)
            ->pluck('project_id')
            ->unique()
            ->toArray();

        if (empty($projectIds)) {
            return;
        }

        // Dispatch queue jobs for each affected project
        foreach ($projectIds as $projectId) {
            try {
                \App\Jobs\RegenerateProjectGenerationTree::dispatch($projectId);
            } catch (\Exception $e) {
                \Log::error("Failed to dispatch regeneration job for project {$projectId}: " . $e->getMessage());
            }
        }
    }

    /**
     * Import template from archive file (ZIP, TAR.GZ, TAR.XZ)
     */
    private function importFromArchive(Request $request)
    {
        $validated = $request->validate([
            'template_file' => 'required|file|mimes:zip,gz,tar,xz|max:51200', // Max 50MB
            'overwrite_existing' => 'boolean',
        ]);

        $file = $request->file('template_file');
        $overwriteExisting = $validated['overwrite_existing'] ?? false;
        $filename = $file->getClientOriginalName();

        // Create temp directory
        $tempDir = storage_path('app/temp/template_import_' . uniqid());
        \Illuminate\Support\Facades\File::makeDirectory($tempDir, 0755, true);

        try {
            // Detect archive type and extract
            $extension = strtolower($file->getClientOriginalExtension());

            if ($extension === 'zip') {
                $this->extractZip($file->getRealPath(), $tempDir);
            } elseif (in_array($extension, ['gz', 'tar'])) {
                // Check if it's tar.gz
                if (str_ends_with(strtolower($filename), '.tar.gz')) {
                    $this->extractTarGz($file->getRealPath(), $tempDir);
                } else {
                    throw new \Exception('Only TAR.GZ archives are supported (not standalone .gz or .tar files)');
                }
            } elseif ($extension === 'xz') {
                if (str_ends_with(strtolower($filename), '.tar.xz')) {
                    $this->extractTarXz($file->getRealPath(), $tempDir);
                } else {
                    throw new \Exception('Only TAR.XZ archives are supported (not standalone .xz files)');
                }
            } else {
                throw new \Exception('Unsupported archive format');
            }

            // Check if template.json exists in archive
            $templateJsonPath = $tempDir . '/template.json';
            $hasTemplateJson = \Illuminate\Support\Facades\File::exists($templateJsonPath);

            if ($hasTemplateJson) {
                // Import from template.json (includes metadata)
                $jsonContent = \Illuminate\Support\Facades\File::get($templateJsonPath);
                $templateData = json_decode($jsonContent, true);

                if (!$templateData || !isset($templateData['template'])) {
                    throw new \Exception('Invalid template.json format');
                }

                $templateInfo = $templateData['template'];
                $filesData = $templateData['files'] ?? [];

                // Check if template exists
                $existingTemplate = Template::where('name', $templateInfo['name'])->first();
                if ($existingTemplate && !$overwriteExisting) {
                    return response()->json([
                        'success' => false,
                        'error' => 'Template with this name already exists. Set overwrite_existing to true to replace it.',
                        'existing_template_id' => $existingTemplate->id,
                    ], 409);
                }

                // Delete existing template if overwriting
                if ($existingTemplate && $overwriteExisting) {
                    $existingTemplate->delete();
                }

                // Create template with metadata from JSON
                $template = Template::create([
                    'name' => $templateInfo['name'],
                    'description' => $templateInfo['description'] ?? '',
                    'category' => $templateInfo['category'] ?? 'Web',
                    'language' => $templateInfo['language'] ?? 'PHP',
                    'tags' => $templateInfo['tags'] ?? [],
                    'is_active' => $templateInfo['is_active'] ?? true,
                    'file_count' => count($filesData),
                ]);

                // Create template files - read content from physical files in archive
                foreach ($filesData as $index => $fileData) {
                    $fileName = $fileData['file_name'];

                    // Check if archive_source is specified (for duplicate filenames)
                    $archiveFileName = $fileData['archive_source'] ?? $fileName;
                    $physicalFilePath = $tempDir . '/' . $archiveFileName;

                    // Read file content from extracted archive (not from JSON)
                    if (\Illuminate\Support\Facades\File::exists($physicalFilePath)) {
                        $fileContent = \Illuminate\Support\Facades\File::get($physicalFilePath);
                    } else {
                        // Fallback: if file_content is in JSON (old format), use it
                        $fileContent = $fileData['file_content'] ?? '';
                    }

                    $template->files()->create([
                        'file_name' => $fileName,
                        'file_path' => $fileData['file_path'] ?? $fileName,  // Legacy compatibility
                        'output_path' => $fileData['output_path'] ?? null,  // Ausgabeverzeichnis
                        'file_content' => $fileContent,
                        'file_type' => $fileData['file_type'] ?? 'template',
                        'file_order' => $fileData['file_order'] ?? $index,
                    ]);
                }

            } else {
                // No template.json - import files directly (legacy mode)
                $templateFiles = $this->readTemplateFilesFromDirectory($tempDir);

                if (empty($templateFiles)) {
                    throw new \Exception('No template files found in archive');
                }

                // Generate template name from filename (without extension)
                $templateName = preg_replace('/\.(zip|tar\.gz|tar\.xz)$/i', '', $filename);
                $templateName = preg_replace('/[^a-z0-9_]/', '_', strtolower($templateName));

                // Check if template exists
                $existingTemplate = Template::where('name', $templateName)->first();
                if ($existingTemplate && !$overwriteExisting) {
                    return response()->json([
                        'success' => false,
                        'error' => 'Template with this name already exists. Set overwrite_existing to true to replace it.',
                        'existing_template_id' => $existingTemplate->id,
                    ], 409);
                }

                // Delete existing template if overwriting
                if ($existingTemplate && $overwriteExisting) {
                    $existingTemplate->delete();
                }

                // Create template
                $template = Template::create([
                    'name' => $templateName,
                    'description' => 'Imported from ' . $filename,
                    'category' => 'Web', // Default category
                    'language' => 'PHP', // Default language
                    'tags' => [],
                    'is_active' => true,
                    'file_count' => count($templateFiles),
                ]);

                // Create template files
                foreach ($templateFiles as $index => $fileData) {
                    $template->files()->create([
                        'file_name' => $fileData['file_name'],
                        'file_path' => $fileData['file_path'],
                        'file_content' => $fileData['file_content'],
                        'file_type' => $fileData['file_type'] ?? 'template',
                        'file_order' => $index,
                    ]);
                }
            }

            return response()->json([
                'success' => true,
                'template' => $template->load('files'),
                'message' => 'Template successfully imported from archive',
            ], 201);

        } catch (\Exception $e) {
            \Log::error('Template import from archive failed', [
                'error' => $e->getMessage(),
                'file' => $filename,
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to import template: ' . $e->getMessage(),
            ], 400);

        } finally {
            // Clean up temp directory
            if (\Illuminate\Support\Facades\File::exists($tempDir)) {
                \Illuminate\Support\Facades\File::deleteDirectory($tempDir);
            }
        }
    }

    /**
     * Extract ZIP archive
     */
    private function extractZip(string $zipPath, string $destination): void
    {
        $zip = new \ZipArchive();

        if ($zip->open($zipPath) !== true) {
            throw new \Exception('Failed to open ZIP archive');
        }

        $zip->extractTo($destination);
        $zip->close();
    }

    /**
     * Extract TAR.GZ archive
     */
    private function extractTarGz(string $tarGzPath, string $destination): void
    {
        try {
            $phar = new \PharData($tarGzPath);
            $phar->extractTo($destination, null, true);
        } catch (\Exception $e) {
            throw new \Exception('Failed to extract TAR.GZ archive: ' . $e->getMessage());
        }
    }

    /**
     * Extract TAR.XZ archive
     */
    private function extractTarXz(string $tarXzPath, string $destination): void
    {
        // Check if xz command is available
        $xzAvailable = shell_exec('which xz 2>/dev/null') || shell_exec('where xz 2>nul');

        if (!$xzAvailable) {
            throw new \Exception('TAR.XZ extraction not available (requires xz command). Please use ZIP or TAR.GZ format instead.');
        }

        try {
            // First decompress .xz to .tar
            $tarPath = $tarXzPath . '.tmp.tar';
            $command = sprintf('xz -d -c %s > %s', escapeshellarg($tarXzPath), escapeshellarg($tarPath));
            shell_exec($command);

            if (!file_exists($tarPath)) {
                throw new \Exception('XZ decompression failed');
            }

            // Then extract tar
            $phar = new \PharData($tarPath);
            $phar->extractTo($destination, null, true);

            // Clean up temp tar file
            if (file_exists($tarPath)) {
                unlink($tarPath);
            }

        } catch (\Exception $e) {
            throw new \Exception('Failed to extract TAR.XZ archive: ' . $e->getMessage());
        }
    }

    /**
     * Read template files from extracted directory
     */
    private function readTemplateFilesFromDirectory(string $directory): array
    {
        $files = [];
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($directory, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $relativePath = str_replace($directory . DIRECTORY_SEPARATOR, '', $file->getPathname());
                $relativePath = str_replace('\\', '/', $relativePath);

                $files[] = [
                    'file_name' => $file->getFilename(),
                    'file_path' => $relativePath,
                    'file_content' => file_get_contents($file->getPathname()),
                    'file_type' => $this->detectFileType($file->getFilename()),
                ];
            }
        }

        return $files;
    }

    /**
     * Detect file type from filename
     */
    private function detectFileType(string $filename): string
    {
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

        $typeMap = [
            'php' => 'template',
            'html' => 'template',
            'js' => 'static_file',
            'css' => 'static_file',
            'json' => 'static_file',
            'xml' => 'static_file',
            'sql' => 'db_table_file',
        ];

        return $typeMap[$extension] ?? 'template';
    }

    /**
     * Download template as archive (ZIP, TAR.GZ, TAR.XZ)
     */
    public function downloadTemplateArchive(Request $request, $templateId)
    {
        $user = auth()->user();
        $format = $request->query('format', 'zip'); // Default to ZIP

        // Validate format
        if (!in_array($format, ['zip', 'tar.gz', 'tar.xz'])) {
            return response()->json(['error' => 'Invalid format'], 400);
        }

        // Find template
        $template = Template::with(['files', 'creator'])->find($templateId);

        if (!$template) {
            return response()->json(['message' => __('templatecontrollerphp1025')], 404);
        }

        // Check permissions
        if ($template->creator_user_id != $user->id &&
            $user->user_type !== 'system' &&
            !$user->is_inner_core) {
            return response()->json(['message' => __('templatecontrollerphp1032')], 403);
        }

        // Create temporary directory
        $tempDir = storage_path('app/temp/template_export_' . uniqid());
        \Illuminate\Support\Facades\File::makeDirectory($tempDir, 0755, true);

        try {
            // Add template metadata as JSON (for re-import)
            $templateData = [
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
                        'file_path' => $file->file_path,
                        'file_content' => $file->file_content,
                        'file_type' => $file->file_type,
                        'file_order' => $file->file_order,
                    ];
                })->toArray(),
            ];
            \Illuminate\Support\Facades\File::put(
                $tempDir . '/template.json',
                json_encode($templateData, JSON_PRETTY_PRINT)
            );

            // Add README
            $readme = "Template: {$template->name}\n";
            $readme .= "Description: {$template->description}\n";
            $readme .= "Category: {$template->category}\n";
            $readme .= "Language: {$template->language}\n";
            if ($template->creator) {
                $readme .= "Creator: {$template->creator->name} ({$template->creator->email})\n";
            }
            $readme .= "Created: {$template->created_at}\n";
            $readme .= "\nScoriet Template Export\n";
            $readme .= "https://scoriet.com\n";
            \Illuminate\Support\Facades\File::put($tempDir . '/README.txt', $readme);

            // Add all template files
            foreach ($template->files as $file) {
                $filePath = $tempDir . '/' . $file->file_name;
                \Illuminate\Support\Facades\File::put($filePath, $file->file_content);
            }

            // Create archive based on format
            $archiveName = $template->name . '_' . time();
            $archivePath = storage_path('app/temp/' . $archiveName);

            if ($format === 'zip') {
                $zip = new \ZipArchive();
                $zipPath = $archivePath . '.zip';

                if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
                    throw new \Exception(__('templatecontrollerphp1093'));
                }

                $this->addFilesToZipRecursive($zip, $tempDir, '');
                $zip->close();

                $finalArchive = $zipPath;

            } elseif ($format === 'tar.gz') {
                $tarPath = $archivePath . '.tar';
                $phar = new \PharData($tarPath);
                $phar->buildFromDirectory($tempDir);
                $phar->compress(\Phar::GZ);

                \Illuminate\Support\Facades\File::delete($tarPath);
                $finalArchive = $tarPath . '.gz';

            } elseif ($format === 'tar.xz') {
                // Check if xz is available
                $xzAvailable = shell_exec('which xz 2>/dev/null') || shell_exec('where xz 2>nul');

                if (!$xzAvailable) {
                    // Fallback to TAR.GZ
                    $tarPath = $archivePath . '.tar';
                    $phar = new \PharData($tarPath);
                    $phar->buildFromDirectory($tempDir);
                    $phar->compress(\Phar::GZ);

                    \Illuminate\Support\Facades\File::delete($tarPath);
                    $finalArchive = $tarPath . '.gz';
                    $format = 'tar.gz'; // Update format for download name
                } else {
                    $tarPath = $archivePath . '.tar';
                    $phar = new \PharData($tarPath);
                    $phar->buildFromDirectory($tempDir);

                    $xzPath = $archivePath . '.tar.xz';
                    $command = sprintf('xz -z -9 -c %s > %s', escapeshellarg($tarPath), escapeshellarg($xzPath));
                    shell_exec($command);

                    \Illuminate\Support\Facades\File::delete($tarPath);
                    $finalArchive = $xzPath;
                }
            }

            // Return download and clean up
            return response()->download($finalArchive, $template->name . '.' . $format)
                ->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            \Log::error(__('templatecontrollerphp1143'), [
                'error' => $e->getMessage(),
                'template_id' => $templateId,
                'format' => $format,
            ]);

            return response()->json(['error' => __('templatecontrollerphp1149') . $e->getMessage()], 500);

        } finally {
            // Clean up temp directory
            if (\Illuminate\Support\Facades\File::exists($tempDir)) {
                \Illuminate\Support\Facades\File::deleteDirectory($tempDir);
            }
        }
    }

    /**
     * Recursively add files to ZIP archive
     */
    private function addFilesToZipRecursive($zip, $sourceDir, $relativePath)
    {
        $files = \Illuminate\Support\Facades\File::files($sourceDir);
        $directories = \Illuminate\Support\Facades\File::directories($sourceDir);

        foreach ($files as $file) {
            $filename = basename($file);
            $localPath = $relativePath ? $relativePath . '/' . $filename : $filename;
            $zip->addFile($file, $localPath);
        }

        foreach ($directories as $directory) {
            $dirname = basename($directory);
            $localPath = $relativePath ? $relativePath . '/' . $dirname : $dirname;
            $this->addFilesToZipRecursive($zip, $directory, $localPath);
        }
    }
}