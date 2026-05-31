<?php

namespace App\Http\Controllers\Cli;

use App\Http\Controllers\Controller;
use App\Jobs\GenerateCodeJob;
use App\Models\Project;
use App\Models\Template;
use App\Http\Controllers\Api\UltimateTemplateController;
use App\Services\CreditService;
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

        // 💰 CREDIT CHECK: Charge for generation (skip for Patron Monthly)
        $user = $request->user();
        $chargeResult = CreditService::chargeForGeneration($user, $project->id, $template->id, 'cli');

        if (!$chargeResult['success']) {
            return response()->json([
                'success' => false,
                'message' => $chargeResult['message'],
                'error' => 'insufficient_credits',
                'credits_required' => CreditService::GENERATION_COST,
                'credits_available' => $user->credits,
            ], 402); // 402 Payment Required
        }

        // -------------------------------------------------------------------
        // Async dispatch: create a job_id, seed an initial "pending" state
        // file, queue the GenerateCodeJob, and return 202 immediately.
        // The actual generation runs on the queue worker — the client polls
        // /progress/{jobId} until the status is completed (or failed/cancelled).
        // Credits were already charged above, so a failed job leaves the
        // charge in place (same behaviour as the legacy synchronous flow).
        // -------------------------------------------------------------------
        try {
            $jobId        = Str::uuid()->toString();
            $outputFormat = $request->input('output_format', 'zip');

            // Seed the state file BEFORE dispatching — that way an immediate
            // progress poll never sees a 404 race between dispatch and the
            // worker's first writeState() call.
            Storage::disk('local')->put(
                "cli-generations/{$jobId}.json",
                json_encode([
                    'job_id'        => $jobId,
                    'project_id'    => $project->id,
                    'template_id'   => $template->id,
                    'user_id'       => $user->id,
                    'output_format' => $outputFormat,
                    'status'        => 'pending',
                    'progress_pct'  => 0,
                    'created_at'    => now()->toIso8601String(),
                ], JSON_PRETTY_PRINT)
            );

            GenerateCodeJob::dispatch(
                $jobId,
                $project->id,
                $template->id,
                $user->id,
                $outputFormat
            );

            return response()->json([
                'success'      => true,
                'message'      => 'Code generation queued.',
                'job_id'       => $jobId,
                'status'       => 'pending',
                'project'      => [
                    'id'   => $project->id,
                    'name' => $project->name,
                ],
                'template'     => [
                    'id'   => $template->id,
                    'name' => $template->name,
                ],
                'progress_url' => "/cli/v1/generate/progress/{$jobId}",
                'cancel_url'   => "/cli/v1/generate/cancel/{$jobId}",
                'download_url' => "/cli/v1/generate/download/{$jobId}",
            ], 202); // 202 Accepted — work queued, not yet done

        } catch (\Exception $e) {
            \Log::error('CLI Generate dispatch failed: ' . $e->getMessage(), [
                'trace'       => $e->getTraceAsString(),
                'project_id'  => $request->input('project_id'),
                'template_id' => $request->input('template_id'),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to queue code generation',
                'error'   => $e->getMessage(),
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
        if (!Storage::disk('local')->exists("cli-generations/{$jobId}.json")) {
            return response()->json([
                'success' => false,
                'message' => 'Job not found',
            ], 404);
        }

        $state = json_decode(
            Storage::disk('local')->get("cli-generations/{$jobId}.json"),
            true
        ) ?: [];

        // Ownership check — never let one user poll another user's job state.
        if ((string)($state['user_id'] ?? '') !== (string)$request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        $status = $state['status'] ?? 'unknown';

        $response = [
            'success'      => true,
            'job_id'       => $jobId,
            'status'       => $status,
            'progress_pct' => $state['progress_pct'] ?? 0,
            'created_at'   => $state['created_at']   ?? null,
            'started_at'   => $state['started_at']   ?? null,
            'completed_at' => $state['completed_at'] ?? null,
            'failed_at'    => $state['failed_at']    ?? null,
            'updated_at'   => $state['updated_at']   ?? null,
        ];

        // Only expose result counts once the job is actually done so callers
        // don't accidentally trust "0 files" while the worker is still busy.
        if ($status === 'completed') {
            $response['files_count'] = $state['files_count'] ?? count($state['generated_files'] ?? []);
            $response['gtree_nodes'] = $state['gtree_nodes'] ?? count($state['gtree'] ?? []);
            $response['download_url'] = "/cli/v1/generate/download/{$jobId}";
        }
        if ($status === 'failed') {
            $response['errors'] = $state['errors'] ?? [];
        }

        return response()->json($response, 200);
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
        if (!Storage::disk('local')->exists("cli-generations/{$jobId}.json")) {
            return response()->json([
                'success' => false,
                'message' => 'Job not found',
            ], 404);
        }

        $generationData = json_decode(
            Storage::disk('local')->get("cli-generations/{$jobId}.json"),
            true
        ) ?: [];

        // Verify user has access
        if ((string)($generationData['user_id'] ?? '') !== (string)$request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        // Status gate: only `completed` jobs have files to download.
        // 425 (Too Early) tells clients "try again later" without making
        // them parse a generic 4xx; 410 (Gone) covers cancelled/failed
        // jobs that will never produce a file.
        $status = $generationData['status'] ?? 'unknown';
        if ($status !== 'completed') {
            $tooEarly  = in_array($status, ['pending', 'running'], true);
            return response()->json([
                'success'      => false,
                'message'      => $tooEarly
                    ? 'Generation is still in progress — poll /progress/{jobId} until status is "completed".'
                    : "Generation ended with status '{$status}', no download available.",
                'status'       => $status,
                'progress_pct' => $generationData['progress_pct'] ?? 0,
            ], $tooEarly ? 425 : 410);
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
        $path = "cli-generations/{$jobId}.json";
        if (!Storage::disk('local')->exists($path)) {
            return response()->json([
                'success' => false,
                'message' => 'Job not found',
            ], 404);
        }

        $state = json_decode(Storage::disk('local')->get($path), true) ?: [];

        if ((string)($state['user_id'] ?? '') !== (string)$request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied',
            ], 403);
        }

        $currentStatus = $state['status'] ?? 'unknown';

        // Already-terminal states can't be cancelled. Return the current
        // status so the caller can decide whether to keep polling or move on.
        if (in_array($currentStatus, ['completed', 'failed', 'cancelled'], true)) {
            return response()->json([
                'success'         => false,
                'message'         => "Job is already '{$currentStatus}' — cannot cancel.",
                'status'          => $currentStatus,
                'cancel_accepted' => false,
            ], 409);
        }

        // Co-operative cancellation: we can't actually preempt a running
        // worker (PHP doesn't have safe thread interruption), so we flip
        // a flag in the state file and the GenerateCodeJob checks it
        // at its yield points (start of handle() and after generateForCli()
        // returns). If the job is still pending in the queue, the very
        // first check will short-circuit it before any work is done.
        $state['cancel_requested']    = true;
        $state['cancel_requested_at'] = now()->toIso8601String();
        Storage::disk('local')->put($path, json_encode($state, JSON_PRETTY_PRINT));

        return response()->json([
            'success'         => true,
            'message'         => 'Cancellation requested. The worker will pick this up at its next check.',
            'job_id'          => $jobId,
            'status'          => $currentStatus,
            'cancel_accepted' => true,
        ], 200);
    }
}
