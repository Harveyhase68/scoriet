<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Template;
use App\Models\Project;
use App\Models\ProjectTemplateUsage;
use App\Services\CodeScannerService;
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

        // Add linked project IDs to all templates (only projects user has access to)
        $templates->map(function ($template) use ($user) {
            // Get all linked project IDs from project_template_usage (including inactive)
            $linkedProjectsData = \DB::table('project_template_usage')
                ->where('template_id', $template->id)
                ->select('project_id', 'is_active')
                ->get();

            $allLinkedProjectIds = $linkedProjectsData->pluck('project_id')->toArray();

            // Filter to only include projects the user has access to
            $accessibleProjects = Project::whereIn('id', $allLinkedProjectIds)
                ->where(function($query) use ($user) {
                    // User's own projects
                    $query->where('owner_id', $user->id)
                        // OR projects where user is a team member
                        ->orWhereHas('teams.members', function($teamQuery) use ($user) {
                            $teamQuery->where('user_id', $user->id);
                        });
                })
                ->select('id', 'name')
                ->get();

            // Add is_active status to each project
            $accessibleProjectsWithStatus = $accessibleProjects->map(function($project) use ($linkedProjectsData) {
                $linkData = $linkedProjectsData->firstWhere('project_id', $project->id);
                return [
                    'id' => $project->id,
                    'name' => $project->name,
                    'is_active' => $linkData ? (bool)$linkData->is_active : false
                ];
            });

            $template->linked_project_ids = $accessibleProjects->pluck('id')->toArray();
            $template->linked_projects = $accessibleProjectsWithStatus->toArray();
            return $template;
        });

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
            'protected_files' => 'nullable|array',
            'protected_files.*' => 'string',
            'install_script' => 'nullable|array',
            'install_script.*.step' => 'required|integer',
            'install_script.*.description' => 'required|string',
            'install_script.*.command' => 'nullable|string',
            'update_script' => 'nullable|array',
            'update_script.*.step' => 'required|integer',
            'update_script.*.description' => 'required|string',
            'update_script.*.command' => 'nullable|string',
            'files' => 'array',
            'files.*.file_name' => 'required|string',
            'files.*.file_path' => 'nullable|string',
            'files.*.file_content' => 'nullable|string', // 🆕 Nullable for managed_files mode
            'files.*.file_type' => 'required|string',
            'files.*.file_order' => 'integer',
            'files.*.output_path' => 'nullable|string',
            'files.*.content_type' => 'nullable|string|in:text,zip', // 🎯 text or zip
            'files.*.zip_filename' => 'nullable|string', // 🎯 Original ZIP filename
            'files.*.managed_files' => 'nullable|array', // 🆕 File Manager mode
            'files.*.managed_files.*.name' => 'required_with:files.*.managed_files|string',
            'files.*.managed_files.*.relativePath' => 'nullable|string',
            'files.*.managed_files.*.content' => 'required_with:files.*.managed_files|string',
            'files.*.managed_files.*.size' => 'required_with:files.*.managed_files|integer',
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
            'protected_files' => $validated['protected_files'] ?? [],
            'install_script' => $validated['install_script'] ?? [],
            'update_script' => $validated['update_script'] ?? [],
        ]);

        // Add files if provided
        if (isset($validated['files'])) {
            foreach ($validated['files'] as $fileData) {
                $processedContent = null;

                // 🆕 Check if this is a managed files list (File Manager mode)
                if (isset($fileData['managed_files']) && is_array($fileData['managed_files']) && count($fileData['managed_files']) > 0) {
                    // Create ZIP from managed files list
                    \Log::info("Creating ZIP from managed files", ['count' => count($fileData['managed_files'])]);

                    try {
                        $zipBase64 = $this->createZipFromFileList($fileData['managed_files']);
                        $processedContent = [
                            'file_content' => $zipBase64,
                            'content_type' => 'zip',
                            'zip_filename' => $fileData['zip_filename'] ?? $fileData['file_name'],
                        ];
                    } catch (\Exception $e) {
                        \Log::error("Failed to create ZIP from managed files", ['error' => $e->getMessage()]);
                        throw new \Exception('Failed to create archive from managed files: ' . $e->getMessage());
                    }
                } else {
                    // Process archive content (auto-converts TAR.GZ/TAR.XZ to ZIP)
                    $processedContent = $this->processArchiveFileContent(
                        $fileData['file_content'],
                        $fileData['zip_filename'] ?? $fileData['file_name']
                    );
                }

                $template->files()->create([
                    'file_name' => $fileData['file_name'],
                    'file_path' => $fileData['file_path'] ?? $fileData['file_name'], // Use provided file_path or fallback to file_name
                    'file_content' => $processedContent['file_content'],
                    'file_type' => $fileData['file_type'],
                    'file_order' => $fileData['file_order'] ?? 0,
                    'output_path' => $fileData['output_path'] ?? '/',
                    'content_type' => $processedContent['content_type'], // Auto-detected
                    'zip_filename' => $processedContent['zip_filename'], // Original filename preserved
                ]);
            }
        }

        // Update file_count based on actual number of files
        $template->update(['file_count' => $template->files()->count()]);

        // 🔄 QUEUE JOBS: Dispatch regeneration jobs for projects using this template
        $this->dispatchRegenerationJobsForTemplate($template);

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
            'protected_files' => 'nullable|array',
            'protected_files.*' => 'string',
            'install_script' => 'nullable|array',
            'install_script.*.step' => 'required|integer',
            'install_script.*.description' => 'required|string',
            'install_script.*.command' => 'nullable|string',
            'update_script' => 'nullable|array',
            'update_script.*.step' => 'required|integer',
            'update_script.*.description' => 'required|string',
            'update_script.*.command' => 'nullable|string',
            'files' => 'array',
            'files.*.file_name' => 'required|string',
            'files.*.file_path' => 'nullable|string',
            'files.*.file_content' => 'nullable|string', // 🆕 Nullable for managed_files mode
            'files.*.file_type' => 'required|string',
            'files.*.file_order' => 'integer',
            'files.*.output_path' => 'nullable|string',
            'files.*.content_type' => 'nullable|string|in:text,zip', // 🎯 text or zip
            'files.*.zip_filename' => 'nullable|string', // 🎯 Original ZIP filename
            'files.*.managed_files' => 'nullable|array', // 🆕 File Manager mode
            'files.*.managed_files.*.name' => 'required_with:files.*.managed_files|string',
            'files.*.managed_files.*.relativePath' => 'nullable|string',
            'files.*.managed_files.*.content' => 'required_with:files.*.managed_files|string',
            'files.*.managed_files.*.size' => 'required_with:files.*.managed_files|integer',
        ]);

        // Only system users can set/change system template flag
        $updateData = [
            'name' => $validated['name'],
            'description' => $validated['description'],
            'category' => $validated['category'],
            'language' => $validated['language'],
            'tags' => $validated['tags'] ?? [],
            'is_active' => $validated['is_active'] ?? true,
            'protected_files' => $validated['protected_files'] ?? [],
            'install_script' => $validated['install_script'] ?? [],
            'update_script' => $validated['update_script'] ?? [],
        ];

        if (isset($validated['visibility'])) {
            $updateData['visibility'] = $validated['visibility'];
        }

        if ($user->user_type === 'system' && isset($validated['is_system_template'])) {
            $updateData['is_system_template'] = $validated['is_system_template'];
        }

        // 🛡️ SECURITY SCAN: Check for malicious code
        // Scan wenn: (1) Template wird auf public gesetzt ODER (2) Template IST bereits public UND Dateien werden geändert
        $scanResult = null;
        $needsScan = false;
        $isBecomingPublic = false;
        $wasPublicBeforeUpdate = $template->visibility === 'public';
        $autoSetToPrivate = false;

        // Fall 1: Template wird gerade auf public gesetzt (von private/unlisted zu public)
        if (isset($validated['visibility']) && $validated['visibility'] === 'public' && $template->visibility !== 'public') {
            $needsScan = true;
            $isBecomingPublic = true;
        }

        // Fall 2: Template IST bereits public UND Dateien werden geändert
        if ($template->visibility === 'public' && isset($validated['files'])) {
            $needsScan = true;
        }

        if ($needsScan) {
            // Prepare files to scan
            $filesToScan = [];

            if (isset($validated['files'])) {
                // Use files from request (if being updated)
                $filesToScan = $validated['files'];
            } else {
                // Load existing files from database
                $filesToScan = $template->files()->get()->toArray();
            }

            // Perform security scan
            $scanResult = CodeScannerService::scanTemplateFiles($filesToScan);

            // If critical issues found, automatically set to private (NEVER block with 400!)
            if ($scanResult['blocked']) {
                // Automatisch auf PRIVATE setzen, egal ob user versuchte auf public zu setzen oder nicht
                $updateData['visibility'] = 'private';
                $autoSetToPrivate = true;

                \Log::warning('Code Scanner: Malicious code detected - automatically set template to private', [
                    'template_id' => $template->id,
                    'template_name' => $template->name,
                    'was_trying_to_go_public' => $isBecomingPublic,
                    'was_already_public' => $wasPublicBeforeUpdate,
                    'scan_result' => $scanResult,
                ]);
            }

            // If becoming public and no warnings, set review_status to pending_review
            if ($isBecomingPublic && !($scanResult['blocked'] ?? false) && $scanResult['summary']['warning_count'] === 0) {
                $updateData['review_status'] = 'pending_review';
            }
        }

        $template->update($updateData);

        // Update files - delete existing and recreate
        if (isset($validated['files'])) {
            $template->files()->delete();

            foreach ($validated['files'] as $fileData) {
                $processedContent = null;

                // 🆕 Check if this is a managed files list (File Manager mode)
                if (isset($fileData['managed_files']) && is_array($fileData['managed_files']) && count($fileData['managed_files']) > 0) {
                    // Create ZIP from managed files list
                    \Log::info("Creating ZIP from managed files", ['count' => count($fileData['managed_files'])]);

                    try {
                        $zipBase64 = $this->createZipFromFileList($fileData['managed_files']);
                        $processedContent = [
                            'file_content' => $zipBase64,
                            'content_type' => 'zip',
                            'zip_filename' => $fileData['zip_filename'] ?? $fileData['file_name'],
                        ];
                    } catch (\Exception $e) {
                        \Log::error("Failed to create ZIP from managed files", ['error' => $e->getMessage()]);
                        throw new \Exception('Failed to create archive from managed files: ' . $e->getMessage());
                    }
                } else {
                    // Process archive content (auto-converts TAR.GZ/TAR.XZ to ZIP)
                    $processedContent = $this->processArchiveFileContent(
                        $fileData['file_content'],
                        $fileData['zip_filename'] ?? $fileData['file_name']
                    );
                }

                $template->files()->create([
                    'file_name' => $fileData['file_name'],
                    'file_path' => $fileData['file_path'] ?? $fileData['file_name'], // Use provided file_path or fallback to file_name
                    'file_content' => $processedContent['file_content'],
                    'file_type' => $fileData['file_type'],
                    'file_order' => $fileData['file_order'] ?? 0,
                    'output_path' => $fileData['output_path'] ?? '/',
                    'content_type' => $processedContent['content_type'], // Auto-detected
                    'zip_filename' => $processedContent['zip_filename'], // Original filename preserved
                ]);
            }

            // Update file_count based on actual number of files
            $template->update(['file_count' => $template->files()->count()]);
        }

        // 🔄 QUEUE JOBS: Dispatch regeneration jobs for projects using this template
        $this->dispatchRegenerationJobsForTemplate($template);

        // Return response with scan result if available
        $response = $template->load('files');

        if ($scanResult !== null) {
            $responseData = [
                'template' => $response,
                'scan_result' => $scanResult,
                'warnings_found' => $scanResult['summary']['warning_count'] > 0,
            ];

            // If template was automatically set to private due to malicious code
            if ($autoSetToPrivate) {
                $responseData['auto_set_to_private'] = true;
                $responseData['warning'] = 'Template unusual content detected, switching back to private.';

                // Detaillierte Issue-Liste für Frontend
                if (!empty($scanResult['issues']['hard_blocks'])) {
                    $detectedPatterns = array_map(function($issue) {
                        return $issue['pattern'] . ' (line ' . $issue['line'] . ')';
                    }, $scanResult['issues']['hard_blocks']);

                    $responseData['detected_issues'] = implode(', ', $detectedPatterns);
                }
            }

            return response()->json($responseData);
        }

        return response()->json($response);
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
            } elseif ($template->visibility === 'public' && $template->creator_user_id !== (string)$user->id) {
                return response()->json(['message' => 'Public Templates anderer Benutzer können nicht gelöscht werden'], 403);
            } else {
                return response()->json(['message' => 'Sie haben keine Berechtigung, dieses Template zu löschen'], 403);
            }
        }

        // Delete the template (CASCADE will automatically delete related files and project usages)
        $template->delete();

        // 🔄 QUEUE JOBS: Dispatch regeneration jobs for projects using this template (before deletion)
        // Note: Observer will handle this automatically, but we ensure it's dispatched
        // $this->dispatchRegenerationJobsForTemplate($template); // Not needed - Observer handles it

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
            } elseif ($template->visibility === 'public' && $template->creator_user_id !== (string)$user->id) {
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
            } elseif ($template->visibility === 'public' && $template->creator_user_id !== (string)$user->id) {
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
            'file_path' => 'nullable|string',
            'file_content' => 'required|string',
            'file_type' => 'required|string',
            'file_order' => 'integer',
            'output_path' => 'nullable|string',
        ]);

        $file = $template->files()->create([
            'file_name' => $validated['file_name'],
            'file_path' => $validated['file_path'] ?? $validated['file_name'], // Use provided file_path or fallback to file_name
            'file_content' => $this->normalizeLineEndings($validated['file_content']), // Normalize line endings
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
            'file_path' => 'nullable|string',
            'file_content' => 'required|string',
            'file_type' => 'required|string',
            'file_order' => 'integer',
            'output_path' => 'nullable|string',
        ]);

        $file->update([
            'file_name' => $validated['file_name'],
            'file_path' => $validated['file_path'] ?? $file->file_path, // Preserve original file_path if not provided
            'file_content' => $this->normalizeLineEndings($validated['file_content']), // Normalize line endings
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

    /**
     * 🔄 QUEUE JOBS: Dispatch regeneration jobs for all projects using this template
     */
    private function dispatchRegenerationJobsForTemplate(Template $template): void
    {
        \Log::info("🧪 [API-TEMPLATE-QUEUE] Starting job dispatch for template {$template->id} ({$template->name})");
        
        // Find all projects that use this template
        $projectIds = \DB::table('project_template_usage')
            ->where('template_id', $template->id)
            ->where('is_active', true)
            ->pluck('project_id')
            ->unique()
            ->toArray();

        \Log::info("🧪 [API-TEMPLATE-QUEUE] Found project IDs: " . json_encode($projectIds));

        if (empty($projectIds)) {
            \Log::info("🧪 [API-TEMPLATE-QUEUE] Template {$template->id}: No projects using this template yet");
            return;
        }

        \Log::info("🧪 [API-TEMPLATE-QUEUE] Template {$template->id}: Dispatching regeneration for " . count($projectIds) . " projects");

        // Get job count before dispatching
        $jobsBefore = \DB::table('jobs')->count();
        \Log::info("🧪 [API-TEMPLATE-QUEUE] Jobs in queue before dispatch: {$jobsBefore}");

        // Dispatch queue jobs for each affected project
        $dispatchedJobs = 0;
        foreach ($projectIds as $projectId) {
            \Log::info("🧪 [API-TEMPLATE-QUEUE] Dispatching RegenerateProjectGenerationTree job for project {$projectId}");
            
            try {
                $job = \App\Jobs\RegenerateProjectGenerationTree::dispatch($projectId);
                $dispatchedJobs++;
                \Log::info("🧪 [API-TEMPLATE-QUEUE] Successfully dispatched job for project {$projectId}");
            } catch (\Exception $e) {
                \Log::error("🧪 [API-TEMPLATE-QUEUE] Failed to dispatch job for project {$projectId}: " . $e->getMessage());
            }
        }

        // Get job count after dispatching
        $jobsAfter = \DB::table('jobs')->count();
        \Log::info("🧪 [API-TEMPLATE-QUEUE] Jobs in queue after dispatch: {$jobsAfter}");
        \Log::info("🧪 [API-TEMPLATE-QUEUE] Total dispatched jobs: {$dispatchedJobs}");
        \Log::info("🧪 [API-TEMPLATE-QUEUE] Job dispatch completed for template {$template->id}");
    }

    /**
     * Export template as JSON (for review/download)
     */
    public function exportTemplate($templateId)
    {
        $user = Auth::user();

        // Find template
        $template = Template::with(['files', 'creator'])->find($templateId);

        if (!$template) {
            return response()->json([
                'message' => 'Template not found.',
            ], 404);
        }

        // Check permissions (owner, inner core, or admin can export)
        if ($template->creator_user_id != $user->id &&
            !in_array($user->user_type, ['admin', 'system']) &&
            !$user->is_inner_core) {
            return response()->json([
                'message' => 'Unauthorized to export this template.',
            ], 403);
        }

        // Build export data
        $exportData = [
            'template' => [
                'name' => $template->name,
                'description' => $template->description,
                'category' => $template->category,
                'language' => $template->language,
                'tags' => $template->tags,
                'visibility' => $template->visibility,
                'is_system_template' => $template->is_system_template,
                'created_at' => $template->created_at,
                'creator' => [
                    'name' => $template->creator->name,
                    'email' => $template->creator->email,
                ],
            ],
            'files' => $template->files->map(function ($file) {
                return [
                    'file_name' => $file->file_name,
                    'file_path' => $file->file_path,
                    'output_path' => $file->output_path,
                    'file_content' => $file->file_content,
                    'file_type' => $file->file_type,
                    'file_order' => $file->file_order,
                ];
            }),
            'export_info' => [
                'exported_at' => now(),
                'exported_by' => $user->name,
                'scoriet_version' => '1.0.0',
            ],
        ];

        return response()->json($exportData, 200);
    }

    /**
     * Download template files as ZIP
     */
    public function downloadTemplateZip($templateId)
    {
        $user = Auth::user();

        // Find template
        $template = Template::with(['files', 'creator'])->find($templateId);

        if (!$template) {
            return response()->json([
                'message' => 'Template not found.',
            ], 404);
        }

        // Check permissions (owner, inner core, or admin can download)
        if ($template->creator_user_id != $user->id &&
            !in_array($user->user_type, ['admin', 'system']) &&
            !$user->is_inner_core) {
            return response()->json([
                'message' => 'Unauthorized to download this template.',
            ], 403);
        }

        // Create a temporary zip file
        $zipFileName = 'template_' . $template->id . '_' . time() . '.zip';
        $zipFilePath = storage_path('app/temp/' . $zipFileName);

        // Ensure temp directory exists
        if (!file_exists(storage_path('app/temp'))) {
            mkdir(storage_path('app/temp'), 0755, true);
        }

        // Create ZIP archive
        $zip = new \ZipArchive();
        if ($zip->open($zipFilePath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
            return response()->json([
                'message' => 'Failed to create ZIP archive.',
            ], 500);
        }

        // Add README with template info
        $readme = "Template: {$template->name}\n";
        $readme .= "Description: {$template->description}\n";
        $readme .= "Category: {$template->category}\n";
        $readme .= "Language: {$template->language}\n";
        $readme .= "Creator: {$template->creator->name} ({$template->creator->email})\n";
        $readme .= "Created: {$template->created_at}\n";
        $readme .= "\n";
        $readme .= "Files:\n";
        foreach ($template->files as $file) {
            $readme .= "- {$file->file_name} ({$file->file_type})\n";
        }
        $zip->addFromString('README.txt', $readme);

        // Add all template files
        foreach ($template->files as $file) {
            // Use file_name as the name in the ZIP
            $zip->addFromString($file->file_name, $file->file_content);
        }

        $zip->close();

        // Return the ZIP file as download and delete after sending
        return response()->download($zipFilePath, $template->name . '.zip')->deleteFileAfterSend(true);
    }

    /**
     * Normalize line endings in template content
     * Converts all line endings (Linux \n, Mac \r, Windows \r\n) to consistent \r\n
     * This prevents parsing issues when templates are copied between systems
     */
    private function normalizeLineEndings(string $content): string
    {
        // Step 1: Convert \r\n to \n (normalize to single format)
        $content = str_replace("\r\n", "\n", $content);

        // Step 2: Convert \r to \n (old Mac style)
        $content = str_replace("\r", "\n", $content);

        // Step 3: Convert all \n to \r\n (Windows style for consistency)
        $content = str_replace("\n", "\r\n", $content);

        return $content;
    }

    /**
     * Download template as archive (ZIP, TAR.GZ, TAR.XZ)
     */
    public function downloadTemplateArchive(Request $request, $templateId)
    {
        $user = auth()->user();
        $format = $request->query('format', 'zip');

        if (!in_array($format, ['zip', 'tar.gz', 'tar.xz'])) {
            return response()->json(['error' => 'Invalid format'], 400);
        }

        $template = Template::with(['files', 'creator'])->find($templateId);

        if (!$template) {
            return response()->json(['message' => 'Template not found.'], 404);
        }

        if ($template->creator_user_id != $user->id &&
            !in_array($user->user_type, ['admin', 'system']) &&
            !$user->is_inner_core) {
            return response()->json(['message' => 'Unauthorized to download this template.'], 403);
        }

        $tempDir = storage_path('app/temp/template_export_' . uniqid());
        \Illuminate\Support\Facades\File::makeDirectory($tempDir, 0755, true);

        try {
            // Debug: Log all files being exported
            \Log::info('Exporting template files', [
                'template_id' => $template->id,
                'template_name' => $template->name,
                'file_count' => $template->files->count(),
                'files' => $template->files->map(function ($file) {
                    return [
                        'name' => $file->file_name,
                        'path' => $file->file_path,
                        'type' => $file->file_type,
                        'content_type' => $file->content_type,
                        'has_content' => !empty($file->file_content),
                    ];
                })->toArray()
            ]);

            // Detect duplicate file names and prepare archive file mapping
            $fileNameCount = [];
            $fileArchiveMapping = []; // Maps original file to archive filename

            foreach ($template->files as $file) {
                $fileName = $file->file_name;

                if (!isset($fileNameCount[$fileName])) {
                    $fileNameCount[$fileName] = 0;
                }
                $fileNameCount[$fileName]++;
            }

            // Build file data with archive_source for duplicates
            $filesData = [];
            $fileNameCounter = [];

            foreach ($template->files as $file) {
                $fileName = $file->file_name;
                $isDuplicate = $fileNameCount[$fileName] > 1;

                if ($isDuplicate) {
                    // Track how many times we've seen this filename
                    if (!isset($fileNameCounter[$fileName])) {
                        $fileNameCounter[$fileName] = 0;
                    }
                    $fileNameCounter[$fileName]++;

                    // Generate unique archive name: app.php.1, app.php.2, etc.
                    $archiveFileName = $fileName . '.' . $fileNameCounter[$fileName];
                    $fileArchiveMapping[$file->id] = $archiveFileName;

                    $filesData[] = [
                        'file_name' => $fileName,
                        'archive_source' => $archiveFileName,  // Only for duplicates
                        'output_path' => $file->output_path,
                        'file_type' => $file->file_type,
                        'file_order' => $file->file_order,
                    ];
                } else {
                    // No duplicate - no archive_source needed
                    $fileArchiveMapping[$file->id] = $fileName;

                    $filesData[] = [
                        'file_name' => $fileName,
                        'output_path' => $file->output_path,
                        'file_type' => $file->file_type,
                        'file_order' => $file->file_order,
                    ];
                }
            }

            // Add template metadata as JSON (WITHOUT file_content - files are in archive)
            $templateData = [
                'template' => [
                    'name' => $template->name,
                    'description' => $template->description,
                    'category' => $template->category,
                    'language' => $template->language,
                    'tags' => $template->tags,
                    'is_active' => $template->is_active,
                ],
                'files' => $filesData,
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

            // Add all template files (flat structure - all in root, with unique names for duplicates)
            $writtenFiles = [];
            foreach ($template->files as $file) {
                // Skip template.json and README.txt to avoid conflicts
                if (in_array($file->file_name, ['template.json', 'README.txt'])) {
                    \Log::info("Skipping file: {$file->file_name}");
                    continue;
                }

                // Use mapped archive filename (handles duplicates)
                $archiveFileName = $fileArchiveMapping[$file->id];
                $filePath = $tempDir . '/' . $archiveFileName;

                \Log::info("Writing file to archive", [
                    'file_name' => $file->file_name,
                    'archive_name' => $archiveFileName,
                    'output_path' => $file->output_path,
                    'content_type' => $file->content_type,
                    'content_length' => strlen($file->file_content)
                ]);

                // Handle different content types
                if ($file->content_type === 'zip') {
                    // ZIP file - decode base64 and save as binary
                    $binaryContent = base64_decode($file->file_content);
                    \Illuminate\Support\Facades\File::put($filePath, $binaryContent);
                } else {
                    // Regular file - save as-is
                    \Illuminate\Support\Facades\File::put($filePath, $file->file_content);
                }

                $writtenFiles[] = $archiveFileName;
            }

            \Log::info("Written files to temp directory", [
                'temp_dir' => $tempDir,
                'file_count' => count($writtenFiles),
                'files' => $writtenFiles
            ]);

            // Create archive
            $archiveName = $template->name . '_' . time();
            $archivePath = storage_path('app/temp/' . $archiveName);

            if ($format === 'zip') {
                $zip = new \ZipArchive();
                $zipPath = $archivePath . '.zip';

                if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
                    throw new \Exception('Failed to create ZIP archive');
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
                $xzAvailable = shell_exec('which xz 2>/dev/null') || shell_exec('where xz 2>nul');

                if (!$xzAvailable) {
                    $tarPath = $archivePath . '.tar';
                    $phar = new \PharData($tarPath);
                    $phar->buildFromDirectory($tempDir);
                    $phar->compress(\Phar::GZ);
                    \Illuminate\Support\Facades\File::delete($tarPath);
                    $finalArchive = $tarPath . '.gz';
                    $format = 'tar.gz';
                } else {
                    $tarPath = $archivePath . '.tar';
                    $phar = new \PharData($tarPath);
                    $phar->buildFromDirectory($tempDir);
                    $xzPath = $archivePath . '.tar.xz';
                    shell_exec(sprintf('xz -z -9 -c %s > %s', escapeshellarg($tarPath), escapeshellarg($xzPath)));
                    \Illuminate\Support\Facades\File::delete($tarPath);
                    $finalArchive = $xzPath;
                }
            }

            return response()->download($finalArchive, $template->name . '.' . $format)->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            \Log::error('Template archive download failed', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Failed to create archive: ' . $e->getMessage()], 500);
        } finally {
            if (\Illuminate\Support\Facades\File::exists($tempDir)) {
                \Illuminate\Support\Facades\File::deleteDirectory($tempDir);
            }
        }
    }

    private function addFilesToZipRecursive($zip, $sourceDir, $relativePath)
    {
        // Use Symfony Finder to include hidden files (files starting with .)
        $finder = new \Symfony\Component\Finder\Finder();
        $finder->files()->in($sourceDir)->depth(0)->ignoreDotFiles(false);

        foreach ($finder as $file) {
            $filename = $file->getFilename();
            $localPath = $relativePath ? $relativePath . '/' . $filename : $filename;

            \Log::info("Adding file to ZIP", [
                'filename' => $filename,
                'local_path' => $localPath,
                'real_path' => $file->getRealPath()
            ]);

            $zip->addFile($file->getRealPath(), $localPath);
        }

        // Process subdirectories
        $directories = \Illuminate\Support\Facades\File::directories($sourceDir);
        foreach ($directories as $directory) {
            $dirname = basename($directory);
            $localPath = $relativePath ? $relativePath . '/' . $dirname : $dirname;
            $this->addFilesToZipRecursive($zip, $directory, $localPath);
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
     * Import template from archive file (ZIP, TAR.GZ, TAR.XZ)
     */
    private function importFromArchive(Request $request)
    {
        $validated = $request->validate([
            'template_file' => 'required|file|mimes:zip,gz,tar,xz|max:51200', // Max 50MB
            'overwrite_existing' => 'nullable|in:true,false,0,1', // Accept boolean or string
        ]);

        $file = $request->file('template_file');
        // Convert string 'true'/'false' or '1'/'0' to boolean
        $overwriteExisting = filter_var($validated['overwrite_existing'] ?? false, FILTER_VALIDATE_BOOLEAN);
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
                // Check if it's tar.gz or plain tar
                if (str_ends_with(strtolower($filename), '.tar.gz')) {
                    $this->extractTarGz($file->getRealPath(), $tempDir);
                } elseif ($extension === 'tar') {
                    // Plain TAR file
                    $this->extractTar($file->getRealPath(), $tempDir);
                } else {
                    throw new \Exception('Only TAR, TAR.GZ archives are supported (not standalone .gz files)');
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
                    'creator_user_id' => Auth::user()->id, // Set current user as creator
                ]);

                // Create template files - read content from physical files in archive
                foreach ($filesData as $index => $fileData) {
                    $fileName = $fileData['file_name'];

                    // Check if archive_source is specified (for duplicate filenames)
                    $archiveFileName = $fileData['archive_source'] ?? $fileName;
                    $physicalFilePath = $tempDir . '/' . $archiveFileName;

                    // Read file content from extracted archive (not from JSON)
                    $fileContent = '';
                    $contentType = 'text'; // Default
                    $zipFilename = null;

                    if (\Illuminate\Support\Facades\File::exists($physicalFilePath)) {
                        // Check if this is a ZIP file (binary file)
                        $isZipFile = $this->isZipFile($physicalFilePath);

                        if ($isZipFile) {
                            // ZIP file - read as binary and encode to base64
                            $fileContent = base64_encode(\Illuminate\Support\Facades\File::get($physicalFilePath));
                            $contentType = 'zip';
                            $zipFilename = $fileName; // Store original filename
                        } else {
                            // Regular text file
                            $fileContent = \Illuminate\Support\Facades\File::get($physicalFilePath);
                            $contentType = 'text';
                        }
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
                        'content_type' => $contentType,
                        'zip_filename' => $zipFilename,
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
                    'creator_user_id' => Auth::user()->id, // Set current user as creator
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
     * Extract plain TAR archive
     */
    private function extractTar(string $tarPath, string $destination): void
    {
        try {
            $phar = new \PharData($tarPath);
            $phar->extractTo($destination, null, true);
        } catch (\Exception $e) {
            throw new \Exception('Failed to extract TAR archive: ' . $e->getMessage());
        }
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
     * Create ZIP archive from list of managed files
     * @param array $files Array of ['name' => '', 'relativePath' => '', 'content' => 'base64', 'size' => 0]
     * @return string Base64 encoded ZIP content
     */
    private function createZipFromFileList(array $files): string
    {
        $zipPath = storage_path('app/temp/managed_files_' . uniqid() . '.zip');
        $zip = new \ZipArchive();

        if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
            throw new \Exception('Failed to create ZIP archive from managed files');
        }

        try {
            foreach ($files as $file) {
                $fileName = $file['name'];
                $relativePath = rtrim($file['relativePath'] ?? '', '/');
                $fullPath = $relativePath ? $relativePath . '/' . $fileName : $fileName;

                // Decode base64 content
                $binaryContent = base64_decode($file['content'], true);
                if ($binaryContent === false) {
                    throw new \Exception("Failed to decode content for file: {$fileName}");
                }

                // Add file to ZIP with relative path
                $zip->addFromString($fullPath, $binaryContent);
            }

            $zip->close();

            // Read ZIP file and encode as base64
            $zipContent = \Illuminate\Support\Facades\File::get($zipPath);
            $zipBase64 = base64_encode($zipContent);

            // Clean up
            \Illuminate\Support\Facades\File::delete($zipPath);

            return $zipBase64;

        } catch (\Exception $e) {
            $zip->close();
            if (\Illuminate\Support\Facades\File::exists($zipPath)) {
                \Illuminate\Support\Facades\File::delete($zipPath);
            }
            throw $e;
        }
    }

    /**
     * Check if a file is a ZIP archive by reading magic bytes
     */
    private function isZipFile(string $filePath): bool
    {
        if (!file_exists($filePath)) {
            return false;
        }

        // Read first 4 bytes to check for ZIP signature
        $handle = fopen($filePath, 'rb');
        if ($handle === false) {
            return false;
        }

        $bytes = fread($handle, 4);
        fclose($handle);

        if ($bytes === false || strlen($bytes) < 4) {
            return false;
        }

        // ZIP files start with PK\x03\x04 (50 4B 03 04 in hex)
        // Also check for empty ZIP: PK\x05\x06 (50 4B 05 06)
        // And spanned ZIP: PK\x07\x08 (50 4B 07 08)
        return substr($bytes, 0, 2) === 'PK' && (
            ord($bytes[2]) === 0x03 && ord($bytes[3]) === 0x04 ||  // Normal ZIP
            ord($bytes[2]) === 0x05 && ord($bytes[3]) === 0x06 ||  // Empty ZIP
            ord($bytes[2]) === 0x07 && ord($bytes[3]) === 0x08     // Spanned ZIP
        );
    }

    /**
     * Check if a file is an archive (ZIP, TAR.GZ, TAR.XZ) by reading magic bytes
     * Returns the archive type: 'zip', 'tar.gz', 'tar.xz', or false if not an archive
     */
    private function isArchiveFile(string $filePath)
    {
        if (!file_exists($filePath)) {
            return false;
        }

        // Read first 6 bytes to detect different archive formats
        $handle = fopen($filePath, 'rb');
        if ($handle === false) {
            return false;
        }

        $bytes = fread($handle, 6);
        fclose($handle);

        if ($bytes === false || strlen($bytes) < 2) {
            return false;
        }

        // Check ZIP signature: PK (50 4B)
        if (strlen($bytes) >= 4 && substr($bytes, 0, 2) === 'PK' && (
            ord($bytes[2]) === 0x03 && ord($bytes[3]) === 0x04 ||  // Normal ZIP
            ord($bytes[2]) === 0x05 && ord($bytes[3]) === 0x06 ||  // Empty ZIP
            ord($bytes[2]) === 0x07 && ord($bytes[3]) === 0x08     // Spanned ZIP
        )) {
            return 'zip';
        }

        // Check GZIP signature: 1F 8B (TAR.GZ starts with this)
        if (strlen($bytes) >= 2 && ord($bytes[0]) === 0x1F && ord($bytes[1]) === 0x8B) {
            return 'tar.gz';
        }

        // Check XZ signature: FD 37 7A 58 5A 00 (TAR.XZ starts with this)
        if (strlen($bytes) >= 6 &&
            ord($bytes[0]) === 0xFD &&
            ord($bytes[1]) === 0x37 &&
            ord($bytes[2]) === 0x7A &&
            ord($bytes[3]) === 0x58 &&
            ord($bytes[4]) === 0x5A &&
            ord($bytes[5]) === 0x00) {
            return 'tar.xz';
        }

        return false;
    }

    /**
     * Convert TAR.GZ or TAR.XZ archive to ZIP format
     * Returns the path to the newly created ZIP file
     */
    private function convertArchiveToZip(string $archivePath, string $archiveType): string
    {
        $tempExtractDir = storage_path('app/temp/archive_extract_' . uniqid());
        \Illuminate\Support\Facades\File::makeDirectory($tempExtractDir, 0755, true);

        try {
            // Extract the archive based on type
            if ($archiveType === 'tar.gz') {
                $this->extractTarGz($archivePath, $tempExtractDir);
            } elseif ($archiveType === 'tar.xz') {
                $this->extractTarXz($archivePath, $tempExtractDir);
            } else {
                throw new \Exception('Unsupported archive type for conversion: ' . $archiveType);
            }

            // Create a new ZIP archive
            $zipPath = storage_path('app/temp/converted_' . uniqid() . '.zip');
            $zip = new \ZipArchive();

            if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== true) {
                throw new \Exception('Failed to create ZIP archive during conversion');
            }

            // Add all extracted files to the ZIP
            $this->addFilesToZipRecursive($zip, $tempExtractDir, '');
            $zip->close();

            return $zipPath;

        } finally {
            // Clean up temporary extraction directory
            if (\Illuminate\Support\Facades\File::exists($tempExtractDir)) {
                \Illuminate\Support\Facades\File::deleteDirectory($tempExtractDir);
            }
        }
    }

    /**
     * Process archive file content - converts TAR.GZ/TAR.XZ to ZIP automatically
     * Takes Base64 encoded content, returns processed Base64 content
     */
    private function processArchiveFileContent(string $fileContent, string $originalFilename): array
    {
        // Check if content starts with "data:" (base64 data URL format)
        $isDataUrl = str_starts_with($fileContent, 'data:');

        if ($isDataUrl) {
            // Extract base64 part from data URL (format: data:mime/type;base64,XXXXX)
            $parts = explode(',', $fileContent, 2);
            if (count($parts) !== 2) {
                return [
                    'file_content' => $fileContent,
                    'content_type' => 'text',
                    'zip_filename' => null,
                ];
            }
            $base64Content = $parts[1];
        } else {
            $base64Content = $fileContent;
        }

        // Decode base64 to get binary content
        $binaryContent = base64_decode($base64Content, true);

        if ($binaryContent === false) {
            // Not base64 - treat as text
            return [
                'file_content' => $fileContent,
                'content_type' => 'text',
                'zip_filename' => null,
            ];
        }

        // Write to temporary file to check magic bytes
        $tempFilePath = storage_path('app/temp/archive_check_' . uniqid());
        \Illuminate\Support\Facades\File::put($tempFilePath, $binaryContent);

        try {
            // Check archive type using magic bytes
            $archiveType = $this->isArchiveFile($tempFilePath);

            if ($archiveType === false) {
                // Not an archive - treat as text
                return [
                    'file_content' => $fileContent,
                    'content_type' => 'text',
                    'zip_filename' => null,
                ];
            }

            // If it's TAR.GZ or TAR.XZ, convert to ZIP
            if ($archiveType === 'tar.gz' || $archiveType === 'tar.xz') {
                \Log::info("Converting {$archiveType} to ZIP", ['filename' => $originalFilename]);

                // Rename temp file with correct extension for PharData
                $tempFilePathWithExt = $tempFilePath . '.' . $archiveType;
                rename($tempFilePath, $tempFilePathWithExt);

                $zipPath = $this->convertArchiveToZip($tempFilePathWithExt, $archiveType);

                // Clean up renamed temp file
                if (\Illuminate\Support\Facades\File::exists($tempFilePathWithExt)) {
                    \Illuminate\Support\Facades\File::delete($tempFilePathWithExt);
                }

                // Read ZIP file and encode as base64
                $zipContent = \Illuminate\Support\Facades\File::get($zipPath);
                $zipBase64 = base64_encode($zipContent);

                // Clean up converted ZIP
                \Illuminate\Support\Facades\File::delete($zipPath);

                return [
                    'file_content' => $zipBase64,
                    'content_type' => 'zip',
                    'zip_filename' => $originalFilename, // Keep original filename
                ];
            }

            // If it's already ZIP, just return as-is
            if ($archiveType === 'zip') {
                return [
                    'file_content' => $base64Content, // Use cleaned base64 (without data URL prefix)
                    'content_type' => 'zip',
                    'zip_filename' => $originalFilename,
                ];
            }

            // Fallback
            return [
                'file_content' => $fileContent,
                'content_type' => 'text',
                'zip_filename' => null,
            ];

        } finally {
            // Clean up temp file (original without extension)
            if (\Illuminate\Support\Facades\File::exists($tempFilePath)) {
                \Illuminate\Support\Facades\File::delete($tempFilePath);
            }

            // Also clean up any renamed temp files with extensions
            $possibleExtensions = ['tar.gz', 'tar.xz'];
            foreach ($possibleExtensions as $ext) {
                $tempFileWithExt = $tempFilePath . '.' . $ext;
                if (\Illuminate\Support\Facades\File::exists($tempFileWithExt)) {
                    \Illuminate\Support\Facades\File::delete($tempFileWithExt);
                }
            }
        }
    }

    /**
     * Link a template to projects (creates reference, gets updates)
     * POST /api/templates/{id}/link
     */
    public function linkTemplate(Request $request, int $id): JsonResponse
    {
        $template = Template::find($id);

        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => 'Template not found',
            ], 404);
        }

        $user = $request->user();

        // Check if user can use this template
        if (!$template->canBeUsedBy($user)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to link this template',
            ], 403);
        }

        $validated = $request->validate([
            'project_ids' => 'required|array|min:1',
            'project_ids.*' => 'exists:projects,id',
        ]);

        $linkedCount = 0;
        $errors = [];

        foreach ($validated['project_ids'] as $projectId) {
            $project = Project::find($projectId);

            if (!$project || !$project->userCanAccess($user)) {
                $errors[] = "Access denied to project #{$projectId}";
                continue;
            }

            // Check if already linked
            $existing = $project->templates()->where('templates.id', $template->id)->first();
            if ($existing) {
                $errors[] = "Template already linked to project #{$projectId}";
                continue;
            }

            // Link template to project
            $project->templates()->attach($template->id);
            $linkedCount++;
        }

        return response()->json([
            'success' => true,
            'message' => "Template linked to {$linkedCount} project(s)",
            'linked_count' => $linkedCount,
            'errors' => $errors,
        ]);
    }

    /**
     * Unlink a template from projects
     * POST /api/templates/{id}/unlink
     */
    public function unlinkTemplate(Request $request, int $id): JsonResponse
    {
        $template = Template::find($id);

        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => 'Template not found',
            ], 404);
        }

        $user = $request->user();

        $validated = $request->validate([
            'project_ids' => 'required|array|min:1',
            'project_ids.*' => 'exists:projects,id',
        ]);

        $unlinkedCount = 0;
        $errors = [];

        foreach ($validated['project_ids'] as $projectId) {
            $project = Project::find($projectId);

            if (!$project || !$project->userCanAccess($user)) {
                $errors[] = "Access denied to project #{$projectId}";
                continue;
            }

            // Unlink template from project
            $project->templates()->detach($template->id);
            $unlinkedCount++;
        }

        return response()->json([
            'success' => true,
            'message' => "Template unlinked from {$unlinkedCount} project(s)",
            'unlinked_count' => $unlinkedCount,
            'errors' => $errors,
        ]);
    }

    /**
     * Get user's own templates (for upper table)
     * GET /api/templates/my-templates
     */
    public function getMyTemplates(Request $request): JsonResponse
    {
        $user = $request->user();

        $templates = Template::ownedBy($user->id)
            ->with(['creator', 'originalTemplate', 'project'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'templates' => $templates,
        ]);
    }

    /**
     * Get community templates (system + public from others)
     * GET /api/templates/community
     */
    public function getCommunityTemplates(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Template::community($user->id)
            ->with(['creator', 'originalTemplate']);

        // Apply filters
        if ($request->has('type')) {
            $type = $request->input('type');
            if ($type === 'system') {
                $query->where('is_system_template', true);
            } elseif ($type === 'community') {
                $query->where('is_system_template', false);
            }
        }

        if ($request->has('language')) {
            $query->where('language', $request->input('language'));
        }

        if ($request->has('category')) {
            $query->where('category', $request->input('category'));
        }

        if ($request->has('search')) {
            $query->search($request->input('search'));
        }

        $templates = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'templates' => $templates,
        ]);
    }

    /**
     * Get linked projects for a template
     */
    public function getLinkedProjects($id): JsonResponse
    {
        $user = Auth::user();
        $template = Template::findOrFail($id);

        // Check if user owns this template or can use it
        if ($template->creator_user_id != $user->id && !$template->canBeUsedBy($user)) {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized'
            ], 403);
        }

        // Get linked project IDs from project_template_usage table
        $projectIds = \DB::table('project_template_usage')
            ->where('template_id', $template->id)
            ->where('is_active', true)
            ->pluck('project_id')
            ->toArray();

        return response()->json([
            'success' => true,
            'project_ids' => $projectIds
        ]);
    }

    /**
     * Update linked projects for a template
     */
    public function updateLinkedProjects(Request $request, $id): JsonResponse
    {
        $user = Auth::user();
        $template = Template::findOrFail($id);

        \Log::info('updateLinkedProjects START', [
            'template_id' => $id,
            'user_id' => $user->id,
            'request_project_ids' => $request->input('project_ids')
        ]);

        // Check if user can link this template
        // System templates and public templates can be linked by anyone
        // Private templates can only be linked by their creator
        $canLink = $template->is_system_template
                || $template->visibility === 'public'
                || $template->creator_user_id == $user->id;

        if (!$canLink) {
            \Log::warning('updateLinkedProjects UNAUTHORIZED', [
                'template_id' => $id,
                'user_id' => $user->id,
                'is_system' => $template->is_system_template,
                'visibility' => $template->visibility,
                'creator' => $template->creator_user_id
            ]);
            return response()->json([
                'success' => false,
                'error' => 'Sie haben keine Berechtigung, dieses Template zu verknüpfen'
            ], 403);
        }

        $validated = $request->validate([
            'project_ids' => 'array', // Allow empty array to remove all links
            'project_ids.*' => 'integer|exists:projects,id'
        ]);

        $newProjectIds = $validated['project_ids'];
        \Log::info('updateLinkedProjects VALIDATED', ['new_project_ids' => $newProjectIds]);

        // Get current linked projects (only for user's accessible projects)
        $userAccessibleProjectIds = Project::where(function($query) use ($user) {
            $query->where('owner_id', $user->id)
                ->orWhereHas('teams.members', function($teamQuery) use ($user) {
                    $teamQuery->where('user_id', $user->id);
                });
        })->pluck('id')->toArray();

        // Filter to only user's projects
        $newProjectIds = array_intersect($newProjectIds, $userAccessibleProjectIds);

        // Get current linked projects (only user's projects)
        $currentProjectIds = \DB::table('project_template_usage')
            ->where('template_id', $template->id)
            ->whereIn('project_id', $userAccessibleProjectIds)
            ->pluck('project_id')
            ->toArray();

        // Determine which to add and which to remove
        $toAdd = array_diff($newProjectIds, $currentProjectIds);
        $toRemove = array_diff($currentProjectIds, $newProjectIds);

        // Remove unlinked projects (only user's projects)
        if (!empty($toRemove)) {
            \DB::table('project_template_usage')
                ->where('template_id', $template->id)
                ->whereIn('project_id', $toRemove)
                ->whereIn('project_id', $userAccessibleProjectIds) // Only remove user's projects
                ->delete();
        }

        // Add new linked projects
        foreach ($toAdd as $projectId) {
            $project = Project::find($projectId);

            // Check if user has access to this project
            if (!$project || !$project->userCanAccess($user)) {
                continue;
            }

            \DB::table('project_template_usage')->updateOrInsert(
                [
                    'project_id' => $projectId,
                    'template_id' => $template->id
                ],
                [
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now()
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Template-Verknüpfungen erfolgreich aktualisiert'
        ]);
    }

    /**
     * Toggle is_active status for a specific project-template link
     */
    public function toggleProjectLinkActive(Request $request, $templateId, $projectId): JsonResponse
    {
        $user = Auth::user();
        $template = Template::findOrFail($templateId);
        $project = Project::findOrFail($projectId);

        // Check if user has access to this project
        if (!$project->userCanAccess($user)) {
            return response()->json([
                'success' => false,
                'error' => 'Sie haben keine Berechtigung für dieses Projekt'
            ], 403);
        }

        // Check if user can use this template
        if (!$template->canBeUsedBy($user) && $template->creator_user_id != $user->id) {
            return response()->json([
                'success' => false,
                'error' => 'Sie haben keine Berechtigung, dieses Template zu verwenden'
            ], 403);
        }

        $validated = $request->validate([
            'is_active' => 'required|boolean'
        ]);

        // Update the is_active status
        \DB::table('project_template_usage')
            ->where('template_id', $templateId)
            ->where('project_id', $projectId)
            ->update([
                'is_active' => $validated['is_active'],
                'updated_at' => now()
            ]);

        return response()->json([
            'success' => true,
            'message' => 'Verknüpfung erfolgreich aktualisiert'
        ]);
    }
}
