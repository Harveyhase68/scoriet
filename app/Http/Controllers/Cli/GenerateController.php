<?php

namespace App\Http\Controllers\Cli;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Template;
use App\Http\Controllers\Api\UltimateTemplateController;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use ZipArchive;

class GenerateController extends Controller
{
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
     * Generate code for a project with a template
     *
     * POST /cli/generate
     *
     * This endpoint generates code using the Ultimate Template Generator
     * and returns a job ID for progress tracking and download.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function generate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'project_id' => 'required|integer|exists:projects,id',
            'template_id' => 'required|integer|exists:templates,id',
            'output_format' => 'in:zip,tar,tar.gz', // Archive format
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $project = Project::find($request->input('project_id'));
        $template = Template::find($request->input('template_id'));

        // Check project access
        if (!$this->userHasProjectAccess($project, $request->user())) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied to this project',
            ], 403);
        }

        // Check if template is linked to project
        if (!$project->templates()->where('templates.id', $template->id)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Template is not linked to this project',
            ], 400);
        }

        try {
            // Use UltimateTemplateController to generate code
            $ultimateController = new UltimateTemplateController();

            try {
                $generationResult = $ultimateController->generateForCli($project->id, $template->id);
            } catch (\Exception $genException) {
                \Log::error('generateForCli threw exception: ' . $genException->getMessage(), [
                    'trace' => $genException->getTraceAsString(),
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Code generation failed',
                    'error' => $genException->getMessage(),
                    'file' => $genException->getFile(),
                    'line' => $genException->getLine(),
                ], 500);
            }

            // Validate result structure
            if (!is_array($generationResult)) {
                \Log::error('Generation result is not an array', [
                    'result_type' => gettype($generationResult),
                    'result' => $generationResult,
                ]);
                throw new \Exception('Invalid generation result format: ' . gettype($generationResult));
            }

            if (!isset($generationResult['success'])) {
                \Log::error('Generation result missing success key', [
                    'result_keys' => array_keys($generationResult),
                    'result' => $generationResult,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Code generation failed',
                    'errors' => ['Invalid result structure - missing success key'],
                    'debug' => [
                        'result_keys' => array_keys($generationResult),
                        'has_errors' => isset($generationResult['errors']),
                    ],
                ], 400);
            }

            if (!$generationResult['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Code generation failed',
                    'errors' => $generationResult['errors'] ?? ['Unknown error occurred'],
                ], 400);
            }

            // Create a unique job ID for tracking
            $jobId = Str::uuid()->toString();
            $outputFormat = $request->input('output_format', 'zip');

            // Store generation result temporarily
            $generationData = [
                'job_id' => $jobId,
                'project_id' => $project->id,
                'template_id' => $template->id,
                'user_id' => $request->user()->id,
                'generated_files' => $generationResult['files'] ?? [],
                'gtree' => $generationResult['gtree'] ?? [],
                'output_format' => $outputFormat,
                'created_at' => now()->toIso8601String(),
                'status' => 'completed',
            ];

            // Store in temp storage (cache or database)
            Storage::disk('local')->put(
                "cli-generations/{$jobId}.json",
                json_encode($generationData, JSON_PRETTY_PRINT)
            );

            return response()->json([
                'success' => true,
                'message' => 'Code generation completed successfully',
                'job_id' => $jobId,
                'project' => [
                    'id' => $project->id,
                    'name' => $project->name,
                ],
                'template' => [
                    'id' => $template->id,
                    'name' => $template->name,
                ],
                'generation' => [
                    'files_count' => count($generationResult['files'] ?? []),
                    'gtree_nodes' => count($generationResult['gtree'] ?? []),
                ],
                'download_url' => "/cli/generate/download/{$jobId}",
            ], 201);

        } catch (\Exception $e) {
            \Log::error('CLI Generate failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'project_id' => $request->input('project_id'),
                'template_id' => $request->input('template_id'),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Code generation failed',
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ], 500);
        }
    }

    /**
     * Get generation progress (for future async implementation)
     *
     * GET /cli/generate/progress/{jobId}
     *
     * @param string $jobId
     * @param Request $request
     * @return JsonResponse
     */
    public function progress(string $jobId, Request $request): JsonResponse
    {
        // Check if generation data exists
        if (!Storage::disk('local')->exists("cli-generations/{$jobId}.json")) {
            return response()->json([
                'success' => false,
                'message' => 'Job not found',
            ], 404);
        }

        $generationData = json_decode(
            Storage::disk('local')->get("cli-generations/{$jobId}.json"),
            true
        );

        // Verify user has access
        if ((string)$generationData['user_id'] !== (string)$request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'job_id' => $jobId,
            'status' => $generationData['status'],
            'progress' => 100, // Always 100% for now (sync generation)
            'files_count' => count($generationData['generated_files'] ?? []),
            'created_at' => $generationData['created_at'],
        ], 200);
    }

    /**
     * Download generated files as archive
     *
     * GET /cli/generate/download/{jobId}
     *
     * @param string $jobId
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\BinaryFileResponse|JsonResponse
     */
    public function download(string $jobId, Request $request)
    {
        // Check if generation data exists
        if (!Storage::disk('local')->exists("cli-generations/{$jobId}.json")) {
            return response()->json([
                'success' => false,
                'message' => 'Job not found',
            ], 404);
        }

        $generationData = json_decode(
            Storage::disk('local')->get("cli-generations/{$jobId}.json"),
            true
        );

        // Verify user has access
        if ((string)$generationData['user_id'] !== (string)$request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        try {
            // Ensure directory exists
            $generationDir = storage_path('app/cli-generations');
            if (!is_dir($generationDir)) {
                mkdir($generationDir, 0755, true);
            }

            // Create ZIP archive
            $zipFileName = "generation_{$jobId}.zip";
            $zipPath = storage_path("app/cli-generations/{$zipFileName}");

            $zip = new ZipArchive();
            $zipOpenResult = $zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);

            if ($zipOpenResult !== true) {
                throw new \Exception("Failed to create ZIP archive. Error code: {$zipOpenResult}, Path: {$zipPath}");
            }

            // Add generated files to ZIP
            $filesAdded = 0;
            foreach ($generationData['generated_files'] as $file) {
                $filePath = $file['path'] ?? $file['filepath'] ?? '';
                $fileContent = $file['content'] ?? '';

                if ($filePath && $fileContent) {
                    $zip->addFromString($filePath, $fileContent);
                    $filesAdded++;
                }
            }

            $zip->close();

            if ($filesAdded === 0) {
                throw new \Exception('No files were added to the archive');
            }

            // Return ZIP file for download
            return response()->download($zipPath, $zipFileName, [
                'Content-Type' => 'application/zip',
            ])->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            \Log::error('ZIP download failed', [
                'error' => $e->getMessage(),
                'job_id' => $jobId,
                'files_count' => count($generationData['generated_files'] ?? []),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create download archive',
                'error' => $e->getMessage(),
                'debug' => [
                    'files_count' => count($generationData['generated_files'] ?? []),
                    'storage_path' => storage_path('app/cli-generations'),
                ],
            ], 500);
        }
    }

    /**
     * Cancel generation job (for future async implementation)
     *
     * POST /cli/generate/cancel/{jobId}
     *
     * @param string $jobId
     * @param Request $request
     * @return JsonResponse
     */
    public function cancel(string $jobId, Request $request): JsonResponse
    {
        // Check if generation data exists
        if (!Storage::disk('local')->exists("cli-generations/{$jobId}.json")) {
            return response()->json([
                'success' => false,
                'message' => 'Job not found',
            ], 404);
        }

        $generationData = json_decode(
            Storage::disk('local')->get("cli-generations/{$jobId}.json"),
            true
        );

        // Verify user has access
        if ((string)$generationData['user_id'] !== (string)$request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        // For sync generation, jobs are already completed
        // For future async implementation, this would cancel the running job

        return response()->json([
            'success' => true,
            'message' => 'Job already completed (cannot cancel)',
            'status' => $generationData['status'],
        ], 200);
    }
}
