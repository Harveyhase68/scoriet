<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CodeAdjustment;
use App\Models\CodeAdjustmentInsertion;
use App\Models\Project;
use App\Models\ProjectGeneration;
use App\Models\UserGitProvider;
use App\Services\CodeAdjustmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CodeAdjustmentController extends Controller
{
    private CodeAdjustmentService $service;

    public function __construct(CodeAdjustmentService $service)
    {
        $this->service = $service;
    }

    /**
     * List all code adjustments for a project
     */
    public function index(int $projectId): JsonResponse
    {
        $project = Project::findOrFail($projectId);
        $this->authorizeProject($project);

        $adjustments = CodeAdjustment::forProject($projectId)
            ->with('insertions', 'createdBy:id,name')
            ->ordered()
            ->get();

        // The project's templates feed the optional per-template scope dropdown
        // in the panel. Only templates actually linked to THIS project are
        // offered, so an adjustment can't be scoped to a template that would
        // never generate here (the silent "why doesn't it apply" trap).
        $templates = $project->templates()
            ->select('templates.id', 'templates.name')
            ->orderBy('templates.name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $adjustments->map(fn($a) => $a->toApiArray()),
            'templates' => $templates,
        ]);
    }

    /**
     * Get a single code adjustment
     */
    public function show(int $projectId, int $id): JsonResponse
    {
        $project = Project::findOrFail($projectId);
        $this->authorizeProject($project);

        $adjustment = CodeAdjustment::where('project_id', $projectId)
            ->with('insertions', 'createdBy:id,name')
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $adjustment->toApiArray(),
        ]);
    }

    /**
     * Create a new code adjustment
     */
    public function store(Request $request, int $projectId): JsonResponse
    {
        $project = Project::findOrFail($projectId);
        $this->authorizeProject($project);

        $validated = $request->validate([
            // Per-project uniqueness: same project can't have two adjustments
            // with the same name. Different projects may reuse names.
            'name' => [
                'required', 'string', 'max:255',
                \Illuminate\Validation\Rule::unique('code_adjustments', 'name')
                    ->where(fn ($q) => $q->where('project_id', $projectId)),
            ],
            'description' => 'nullable|string',
            'file_pattern' => 'required|string|max:500',
            'min_confidence' => 'nullable|numeric|min:0|max:1',
            'execution_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
            // Optional per-template scope. Must be a template LINKED to this
            // project (via project_template_usage) — null = applies to all.
            'template_id' => [
                'nullable', 'integer',
                \Illuminate\Validation\Rule::exists('project_template_usage', 'template_id')
                    ->where(fn ($q) => $q->where('project_id', $projectId)),
            ],
        ]);

        $adjustment = CodeAdjustment::create([
            'project_id' => $projectId,
            'template_id' => $validated['template_id'] ?? null,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'file_pattern' => $validated['file_pattern'],
            'min_confidence' => $validated['min_confidence'] ?? 0.80,
            'execution_order' => $validated['execution_order'] ?? 0,
            'is_active' => $validated['is_active'] ?? true,
            'created_by_user_id' => Auth::id(),
        ]);

        $adjustment->load('insertions');

        return response()->json([
            'success' => true,
            'message' => __('codeadjustmentcontrollerphp94'),
            'data' => $adjustment->toApiArray(),
        ], 201);
    }

    /**
     * Update a code adjustment
     */
    public function update(Request $request, int $projectId, int $id): JsonResponse
    {
        $project = Project::findOrFail($projectId);
        $this->authorizeProject($project);

        $adjustment = CodeAdjustment::where('project_id', $projectId)->findOrFail($id);

        $validated = $request->validate([
            'name' => [
                'sometimes', 'required', 'string', 'max:255',
                \Illuminate\Validation\Rule::unique('code_adjustments', 'name')
                    ->ignore($adjustment->id)
                    ->where(fn ($q) => $q->where('project_id', $projectId)),
            ],
            'description' => 'nullable|string',
            'file_pattern' => 'sometimes|required|string|max:500',
            'min_confidence' => 'nullable|numeric|min:0|max:1',
            'execution_order' => 'nullable|integer|min:0',
            'is_active' => 'nullable|boolean',
            'template_id' => [
                'nullable', 'integer',
                \Illuminate\Validation\Rule::exists('project_template_usage', 'template_id')
                    ->where(fn ($q) => $q->where('project_id', $projectId)),
            ],
        ]);

        $adjustment->update($validated);
        $adjustment->load('insertions');

        return response()->json([
            'success' => true,
            'message' => __('codeadjustmentcontrollerphp123'),
            'data' => $adjustment->toApiArray(),
        ]);
    }

    /**
     * Delete a code adjustment
     */
    public function destroy(int $projectId, int $id): JsonResponse
    {
        $project = Project::findOrFail($projectId);
        $this->authorizeProject($project);

        $adjustment = CodeAdjustment::where('project_id', $projectId)->findOrFail($id);
        $adjustment->delete();

        return response()->json([
            'success' => true,
            'message' => __('codeadjustmentcontrollerphp141'),
        ]);
    }

    /**
     * Toggle active status of an adjustment
     */
    public function toggleActive(int $projectId, int $id): JsonResponse
    {
        $project = Project::findOrFail($projectId);
        $this->authorizeProject($project);

        $adjustment = CodeAdjustment::where('project_id', $projectId)->findOrFail($id);
        $adjustment->update(['is_active' => !$adjustment->is_active]);

        return response()->json([
            'success' => true,
            'message' => $adjustment->is_active ? __('codeadjustmentcontrollerphp158') : __('codeadjustmentcontrollerphp158_2'),
            'data' => ['is_active' => $adjustment->is_active],
        ]);
    }

    /**
     * Duplicate an adjustment
     */
    public function duplicate(int $projectId, int $id): JsonResponse
    {
        $project = Project::findOrFail($projectId);
        $this->authorizeProject($project);

        $original = CodeAdjustment::where('project_id', $projectId)
            ->with('insertions')
            ->findOrFail($id);

        $newAdjustment = $original->replicate();
        $newAdjustment->name = $this->suggestCopyName($original->name, $projectId);
        $newAdjustment->created_by_user_id = Auth::id();
        $newAdjustment->save();

        // Duplicate insertions
        foreach ($original->insertions as $insertion) {
            $newInsertion = $insertion->replicate();
            $newInsertion->code_adjustment_id = $newAdjustment->id;
            $newInsertion->save();
        }

        $newAdjustment->load('insertions');

        return response()->json([
            'success' => true,
            'message' => __('codeadjustmentcontrollerphp191'),
            'data' => $newAdjustment->toApiArray(),
        ], 201);
    }

    /**
     * Build a unique copy-name suggestion within a project. Delegates to the
     * shared CopyNameSuggester so re-cloning "x_copy" yields "x_copy_1"
     * instead of "x_copy_copy". Scope: per project (Code Adjustments are
     * project-bound).
     */
    private function suggestCopyName(string $base, int $projectId): string
    {
        return \App\Support\CopyNameSuggester::suggest(
            $base,
            fn (string $candidate) => CodeAdjustment::where('project_id', $projectId)
                ->where('name', $candidate)
                ->exists(),
            255 // name column is varchar(255)
        );
    }

    // ========== INSERTIONS ==========

    /**
     * Add an insertion to an adjustment
     */
    public function storeInsertion(Request $request, int $projectId, int $adjustmentId): JsonResponse
    {
        $project = Project::findOrFail($projectId);
        $this->authorizeProject($project);

        $adjustment = CodeAdjustment::where('project_id', $projectId)->findOrFail($adjustmentId);

        $validated = $request->validate([
            'operation' => 'nullable|in:insert,delete,replace',
            'insertion_type' => 'required|in:beginning,end,middle',
            // anchor_text = the block to locate. Required for delete (block to
            // remove) and replace (BEFORE block); for insert, required except a
            // 'beginning' insert.
            'anchor_text' => 'required_if:operation,delete|required_if:operation,replace|required_unless:insertion_type,beginning|nullable|string',
            // insertion_content = what to add (insert) / the AFTER block
            // (replace); irrelevant for delete.
            'insertion_content' => 'required_unless:operation,delete|nullable|string',
            'line_offset' => 'nullable|integer',
            'insertion_order' => 'nullable|integer|min:0',
            'description' => 'nullable|string|max:500',
        ]);

        $insertion = CodeAdjustmentInsertion::create([
            'code_adjustment_id' => $adjustmentId,
            'operation' => $validated['operation'] ?? 'insert',
            'insertion_type' => $validated['insertion_type'],
            'anchor_text' => $validated['anchor_text'] ?? '',
            'insertion_content' => $validated['insertion_content'] ?? '',
            'line_offset' => $validated['line_offset'] ?? 0,
            'insertion_order' => $validated['insertion_order'] ?? 0,
            'description' => $validated['description'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => __('codeadjustmentcontrollerphp229'),
            'data' => $insertion->toApiArray(),
        ], 201);
    }

    /**
     * Update an insertion
     */
    public function updateInsertion(
        Request $request,
        int $projectId,
        int $adjustmentId,
        int $insertionId
    ): JsonResponse {
        $project = Project::findOrFail($projectId);
        $this->authorizeProject($project);

        // Verify adjustment belongs to project
        CodeAdjustment::where('project_id', $projectId)->findOrFail($adjustmentId);

        $insertion = CodeAdjustmentInsertion::where('code_adjustment_id', $adjustmentId)
            ->findOrFail($insertionId);

        $validated = $request->validate([
            'operation' => 'sometimes|in:insert,delete,replace',
            'insertion_type' => 'sometimes|required|in:beginning,end,middle',
            'anchor_text' => 'nullable|string',
            'insertion_content' => 'nullable|string',
            'line_offset' => 'nullable|integer',
            'insertion_order' => 'nullable|integer|min:0',
            'description' => 'nullable|string|max:500',
        ]);

        // Ensure anchor_text is empty string if null (for 'beginning' type)
        if (array_key_exists('anchor_text', $validated) && $validated['anchor_text'] === null) {
            $validated['anchor_text'] = '';
        }

        $insertion->update($validated);

        return response()->json([
            'success' => true,
            'message' => __('codeadjustmentcontrollerphp270'),
            'data' => $insertion->toApiArray(),
        ]);
    }

    /**
     * Delete an insertion
     */
    public function destroyInsertion(int $projectId, int $adjustmentId, int $insertionId): JsonResponse
    {
        $project = Project::findOrFail($projectId);
        $this->authorizeProject($project);

        // Verify adjustment belongs to project
        CodeAdjustment::where('project_id', $projectId)->findOrFail($adjustmentId);

        $insertion = CodeAdjustmentInsertion::where('code_adjustment_id', $adjustmentId)
            ->findOrFail($insertionId);

        $insertion->delete();

        return response()->json([
            'success' => true,
            'message' => __('codeadjustmentcontrollerphp293'),
        ]);
    }

    // ========== REVERSE ENGINEERING ==========

    /**
     * Analyze a modified file to extract insertions (Reverse Engineering)
     */
    public function analyze(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'template_content' => 'required|string',
            'modified_content' => 'required|string',
            'filename' => 'required|string',
        ]);

        $result = $this->service->analyze(
            $validated['template_content'],
            $validated['modified_content'],
            $validated['filename']
        );

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * Preview how adjustments would be applied
     */
    public function preview(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'content' => 'required|string',
            'filename' => 'required|string',
            'project_id' => 'required|integer|exists:projects,id',
            'context' => 'nullable|array',
        ]);

        $project = Project::findOrFail($validated['project_id']);
        $this->authorizeProject($project);

        $result = $this->service->preview(
            $validated['content'],
            $validated['filename'],
            $validated['project_id'],
            $validated['context'] ?? []
        );

        return response()->json([
            'success' => true,
            'data' => $result,
        ]);
    }

    /**
     * Get available template variables for insertions
     */
    public function getVariables(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->service->getAvailableVariables(),
        ]);
    }

    /**
     * Create adjustment from analysis result
     */
    public function createFromAnalysis(Request $request, int $projectId): JsonResponse
    {
        $project = Project::findOrFail($projectId);
        $this->authorizeProject($project);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'file_pattern' => 'required|string|max:500',
            'insertions' => 'required|array|min:1',
            'insertions.*.operation' => 'nullable|in:insert,delete,replace',
            'insertions.*.insertion_type' => 'required|in:beginning,end,middle',
            'insertions.*.anchor_text' => 'nullable|string',
            // Content may be empty for delete entries (the anchor is the block
            // to remove); the analysis frontend sends correct per-item data.
            'insertions.*.insertion_content' => 'nullable|string',
            'insertions.*.line_offset' => 'nullable|integer',
            'insertions.*.description' => 'nullable|string|max:500',
        ]);

        // Create adjustment
        $adjustment = CodeAdjustment::create([
            'project_id' => $projectId,
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'file_pattern' => $validated['file_pattern'],
            'min_confidence' => 0.80,
            'execution_order' => 0,
            'is_active' => true,
            'created_by_user_id' => Auth::id(),
        ]);

        // Create insertions
        foreach ($validated['insertions'] as $index => $insertionData) {
            CodeAdjustmentInsertion::create([
                'code_adjustment_id' => $adjustment->id,
                'operation' => $insertionData['operation'] ?? 'insert',
                'insertion_type' => $insertionData['insertion_type'],
                'anchor_text' => $insertionData['anchor_text'] ?? '',
                'insertion_content' => $insertionData['insertion_content'] ?? '',
                'line_offset' => $insertionData['line_offset'] ?? 0,
                'insertion_order' => $index,
                'description' => $insertionData['description'] ?? null,
            ]);
        }

        $adjustment->load('insertions');

        return response()->json([
            'success' => true,
            'message' => __('codeadjustmentcontrollerphp410'),
            'data' => $adjustment->toApiArray(),
        ], 201);
    }

    // ========== PROJECT GENERATIONS ==========

    /**
     * Get all generations for a project
     */
    public function getGenerations(int $projectId): JsonResponse
    {
        $project = Project::findOrFail($projectId);
        $this->authorizeProject($project);

        $generations = ProjectGeneration::forProject($projectId)
            ->completed()
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'data' => $generations->map(fn($g) => $g->toApiArray()),
        ]);
    }

    /**
     * Get list of files in a generation's archive
     */
    public function getGenerationFiles(int $projectId, int $generationId): JsonResponse
    {
        $project = Project::findOrFail($projectId);
        $this->authorizeProject($project);

        $generation = ProjectGeneration::where('project_id', $projectId)
            ->findOrFail($generationId);

        if (!$generation->fileExists()) {
            return response()->json([
                'success' => false,
                'message' => __('codeadjustmentcontrollerphp450'),
            ], 404);
        }

        try {
            $files = $this->service->listArchiveFiles($generation->file_path);

            return response()->json([
                'success' => true,
                'data' => [
                    'generation' => $generation->toApiArray(),
                    'files' => $files,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Fetch a specific file's content from a generation's archive
     */
    public function fetchFileFromGeneration(Request $request, int $projectId, int $generationId): JsonResponse
    {
        $project = Project::findOrFail($projectId);
        $this->authorizeProject($project);

        $validated = $request->validate([
            'file_path' => 'required|string|max:500',
        ]);

        $generation = ProjectGeneration::where('project_id', $projectId)
            ->findOrFail($generationId);

        if (!$generation->fileExists()) {
            return response()->json([
                'success' => false,
                'message' => __('codeadjustmentcontrollerphp490'),
            ], 404);
        }

        try {
            $content = $this->service->extractFileFromArchive(
                $generation->file_path,
                $validated['file_path']
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'file_path' => $validated['file_path'],
                    'content' => $content,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Compare an uploaded directory/archive against the generated project
     */
    public function compareDirectory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'project_id' => 'required|integer|exists:projects,id',
            'generation_id' => 'required|integer|exists:project_generations,id',
            'source' => 'required|in:upload,service',
            'archive' => 'required_if:source,upload|file|max:102400', // 100MB max
        ]);

        $project = Project::findOrFail($validated['project_id']);
        $this->authorizeProject($project);

        // Get the reference generation
        $generation = ProjectGeneration::where('project_id', $validated['project_id'])
            ->findOrFail($validated['generation_id']);

        if (!$generation->fileExists()) {
            return response()->json([
                'success' => false,
                'message' => __('codeadjustmentcontrollerphp537'),
            ], 404);
        }

        try {
            if ($validated['source'] === 'upload') {
                $result = $this->service->compareUploadedArchive(
                    $request->file('archive'),
                    $generation->file_path
                );
            } else {
                // Service source - call the Rust service
                $result = $this->service->compareFromService($project, $generation);
            }

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Compare files from a Git repository against the generated project
     */
    public function compareGit(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'project_id' => 'required|integer|exists:projects,id',
            'generation_id' => 'required|integer|exists:project_generations,id',
            'provider' => 'required|in:github,gitlab',
            'repository' => 'required|string|max:255',
            'branch' => 'required|string|max:255',
            'directory' => 'nullable|string|max:500',
        ]);

        $project = Project::findOrFail($validated['project_id']);
        $this->authorizeProject($project);

        // Get the user's Git provider connection
        $user = Auth::user();
        $gitProvider = UserGitProvider::where('user_id', $user->id)
            ->where('provider', $validated['provider'])
            ->first();

        if (!$gitProvider) {
            return response()->json([
                'success' => false,
                'message' => __('codeadjustmentcontrollerphp537') . ucfirst($validated['provider']) . __('codeadjustmentcontrollerphp590'),
            ], 400);
        }

        // Get the reference generation
        $generation = ProjectGeneration::where('project_id', $validated['project_id'])
            ->findOrFail($validated['generation_id']);

        if (!$generation->fileExists()) {
            return response()->json([
                'success' => false,
                'message' => __('codeadjustmentcontrollerphp601'),
            ], 404);
        }

        try {
            $result = $this->service->compareFromGit(
                $gitProvider,
                $validated['repository'],
                $validated['branch'],
                $validated['directory'] ?? '',
                $generation->file_path
            );

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    // ========== EXPORT / IMPORT ==========

    /**
     * Export all code adjustments for a project as JSON
     */
    public function export(int $projectId): JsonResponse
    {
        $project = Project::findOrFail($projectId);
        $this->authorizeProject($project);

        $adjustments = CodeAdjustment::forProject($projectId)
            ->with('insertions')
            ->ordered()
            ->get();

        $exportData = [
            'version' => '1.0',
            'exported_at' => now()->toISOString(),
            'project_name' => $project->name,
            'adjustments' => $adjustments->map(function ($adjustment) {
                return [
                    'name' => $adjustment->name,
                    'description' => $adjustment->description,
                    'file_pattern' => $adjustment->file_pattern,
                    'min_confidence' => (float) $adjustment->min_confidence,
                    'execution_order' => $adjustment->execution_order,
                    'is_active' => $adjustment->is_active,
                    'insertions' => $adjustment->insertions->map(function ($insertion) {
                        return [
                            'operation' => $insertion->operation ?? 'insert',
                            'insertion_type' => $insertion->insertion_type,
                            'anchor_text' => $insertion->anchor_text,
                            'insertion_content' => $insertion->insertion_content,
                            'line_offset' => $insertion->line_offset,
                            'insertion_order' => $insertion->insertion_order,
                            'description' => $insertion->description,
                        ];
                    })->toArray(),
                ];
            })->toArray(),
        ];

        return response()->json([
            'success' => true,
            'data' => $exportData,
        ]);
    }

    /**
     * Import code adjustments from JSON
     */
    public function import(Request $request, int $projectId): JsonResponse
    {
        $project = Project::findOrFail($projectId);
        $this->authorizeProject($project);

        $validated = $request->validate([
            'data' => 'required|array',
            'data.version' => 'required|string',
            'data.adjustments' => 'required|array',
            'data.adjustments.*.name' => 'required|string|max:255',
            'data.adjustments.*.description' => 'nullable|string',
            'data.adjustments.*.file_pattern' => 'required|string|max:500',
            'data.adjustments.*.min_confidence' => 'nullable|numeric|min:0|max:1',
            'data.adjustments.*.execution_order' => 'nullable|integer|min:0',
            'data.adjustments.*.is_active' => 'nullable|boolean',
            'data.adjustments.*.insertions' => 'required|array',
            'data.adjustments.*.insertions.*.operation' => 'nullable|in:insert,delete,replace',
            'data.adjustments.*.insertions.*.insertion_type' => 'required|in:beginning,end,middle',
            'data.adjustments.*.insertions.*.anchor_text' => 'nullable|string',
            'data.adjustments.*.insertions.*.insertion_content' => 'nullable|string',
            'data.adjustments.*.insertions.*.line_offset' => 'nullable|integer',
            'data.adjustments.*.insertions.*.insertion_order' => 'nullable|integer|min:0',
            'data.adjustments.*.insertions.*.description' => 'nullable|string|max:500',
            'mode' => 'nullable|in:merge,replace',
        ]);

        $importData = $validated['data'];
        $mode = $validated['mode'] ?? 'merge';

        // If replace mode, delete all existing adjustments first
        if ($mode === 'replace') {
            CodeAdjustment::where('project_id', $projectId)->delete();
        }

        $importedCount = 0;
        $skippedCount = 0;

        foreach ($importData['adjustments'] as $adjustmentData) {
            // Check if adjustment with same name and file_pattern already exists (merge mode)
            if ($mode === 'merge') {
                $existing = CodeAdjustment::where('project_id', $projectId)
                    ->where('name', $adjustmentData['name'])
                    ->where('file_pattern', $adjustmentData['file_pattern'])
                    ->first();

                if ($existing) {
                    $skippedCount++;
                    continue;
                }
            }

            // Create adjustment
            $adjustment = CodeAdjustment::create([
                'project_id' => $projectId,
                'name' => $adjustmentData['name'],
                'description' => $adjustmentData['description'] ?? null,
                'file_pattern' => $adjustmentData['file_pattern'],
                'min_confidence' => $adjustmentData['min_confidence'] ?? 0.80,
                'execution_order' => $adjustmentData['execution_order'] ?? 0,
                'is_active' => $adjustmentData['is_active'] ?? true,
                'created_by_user_id' => Auth::id(),
            ]);

            // Create insertions
            foreach ($adjustmentData['insertions'] as $index => $insertionData) {
                CodeAdjustmentInsertion::create([
                    'code_adjustment_id' => $adjustment->id,
                    'operation' => $insertionData['operation'] ?? 'insert',
                    'insertion_type' => $insertionData['insertion_type'],
                    'anchor_text' => $insertionData['anchor_text'] ?? '',
                    'insertion_content' => $insertionData['insertion_content'] ?? '',
                    'line_offset' => $insertionData['line_offset'] ?? 0,
                    'insertion_order' => $insertionData['insertion_order'] ?? $index,
                    'description' => $insertionData['description'] ?? null,
                ]);
            }

            $importedCount++;
        }

        return response()->json([
            'success' => true,
            'message' => $mode === 'replace'
                ? __('codeadjustmentcontrollerphp757')."{$importedCount}".__('codeadjustmentcontrollerphp757_2')
                : __('codeadjustmentcontrollerphp758')."{$importedCount}".__('codeadjustmentcontrollerphp758_2'),
            'data' => [
                'imported' => $importedCount,
                'skipped' => $skippedCount,
                'mode' => $mode,
            ],
        ]);
    }

    /**
     * Authorize user access to project
     */
    private function authorizeProject(Project $project): void
    {
        $user = Auth::user();

        // Check if user is owner or has access
        if ($project->owner_id !== $user->id) {
            // Check team membership or other access
            $hasAccess = $project->members()->where('user_id', $user->id)->exists()
                || $project->teams()->whereHas('members', fn($q) => $q->where('user_id', $user->id))->exists();

            if (!$hasAccess && $user->user_type !== 'system') {
                abort(403, __('codeadjustmentcontrollerphp781'));
            }
        }
    }
}
