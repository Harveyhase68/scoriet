<?php

namespace App\Jobs;

use App\Http\Controllers\Api\UltimateTemplateController;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * Background code-generation job for the /cli/v1/generate/* endpoints.
 *
 * The legacy controller ran the entire generation inside the HTTP request,
 * which routinely timed out on bigger templates and made the
 * `progress` / `cancel` endpoints meaningless (work was over before any
 * client could poll). This job moves the work onto the queue worker so:
 *
 *   - generate() responds in milliseconds with a job_id and status:pending
 *   - progress() returns the live status (pending → running → completed/failed/cancelled)
 *   - cancel() flips a flag the job checks on its way in
 *   - download() refuses with 425 until the file is actually ready
 *
 * State lives in storage/app/cli-generations/{jobId}.json so a worker
 * crash or restart still leaves a deterministic last-known status on disk
 * for the client to read. Cache would be cheaper but disappears on flush;
 * the JSON file survives until cleanup.
 */
class GenerateCodeJob implements ShouldQueue
{
    use Queueable;

    /** How long the queue will wait before declaring this job stuck. */
    public int $timeout = 600;          // 10 minutes — big projects can take a while
    public int $tries   = 1;            // generation is not idempotent, don't auto-retry

    public function __construct(
        public string $jobId,
        public int    $projectId,
        public int    $templateId,
        public int    $userId,
        public string $outputFormat,
    ) {
    }

    public function handle(): void
    {
        // Honour cancellation flags set before the worker picked us up.
        if ($this->isCancelled()) {
            $this->writeState(['status' => 'cancelled', 'progress_pct' => 0]);
            return;
        }

        $this->writeState(['status' => 'running', 'progress_pct' => 5, 'started_at' => now()->toIso8601String()]);

        try {
            $result = (new UltimateTemplateController())->generateForCli($this->projectId, $this->templateId);

            // Re-check after the long-running call — a /cancel sent during
            // generation should suppress the completion update so polls see
            // "cancelled" instead of a quietly-finished job.
            if ($this->isCancelled()) {
                $this->writeState(['status' => 'cancelled', 'progress_pct' => 100]);
                return;
            }

            if (!is_array($result) || empty($result['success'])) {
                $errors = $result['errors'] ?? ['Generation failed for unknown reason.'];
                Log::error('CLI generate job failed', ['job_id' => $this->jobId, 'errors' => $errors]);
                $this->writeState([
                    'status'       => 'failed',
                    'progress_pct' => 100,
                    'failed_at'    => now()->toIso8601String(),
                    'errors'       => $errors,
                ]);
                return;
            }

            $this->writeState([
                'status'          => 'completed',
                'progress_pct'    => 100,
                'completed_at'    => now()->toIso8601String(),
                'generated_files' => $result['files'] ?? [],
                'gtree'           => $result['gtree'] ?? [],
                'files_count'     => count($result['files'] ?? []),
                'gtree_nodes'     => count($result['gtree'] ?? []),
            ]);
        } catch (\Throwable $e) {
            Log::error('CLI generate job threw exception', [
                'job_id'  => $this->jobId,
                'message' => $e->getMessage(),
                'file'    => $e->getFile(),
                'line'    => $e->getLine(),
            ]);
            $this->writeState([
                'status'       => 'failed',
                'progress_pct' => 100,
                'failed_at'    => now()->toIso8601String(),
                'errors'       => [$e->getMessage()],
            ]);
        }
    }

    /**
     * Failed-callback for the queue worker — fires when even our internal
     * try/catch couldn't save the job (e.g. serialization error, memory limit).
     * Writes a "failed" marker so the client polling progress doesn't get
     * stuck on "running" forever.
     */
    public function failed(\Throwable $exception): void
    {
        $this->writeState([
            'status'       => 'failed',
            'progress_pct' => 100,
            'failed_at'    => now()->toIso8601String(),
            'errors'       => ['Worker failure: ' . $exception->getMessage()],
        ]);
    }

    /** Merge $patch into the existing on-disk state for this job. */
    private function writeState(array $patch): void
    {
        $path = $this->statePath();
        $existing = Storage::disk('local')->exists($path)
            ? (json_decode(Storage::disk('local')->get($path), true) ?: [])
            : [];

        $merged = array_merge($existing, $patch, [
            'job_id'        => $this->jobId,
            'project_id'    => $this->projectId,
            'template_id'   => $this->templateId,
            'user_id'       => $this->userId,
            'output_format' => $this->outputFormat,
            'updated_at'    => now()->toIso8601String(),
        ]);

        Storage::disk('local')->put($path, json_encode($merged, JSON_PRETTY_PRINT));
    }

    /** Read the current cancel flag from the state file (set by /cancel). */
    private function isCancelled(): bool
    {
        $path = $this->statePath();
        if (!Storage::disk('local')->exists($path)) return false;
        $state = json_decode(Storage::disk('local')->get($path), true) ?: [];
        return ($state['cancel_requested'] ?? false) === true
            || ($state['status'] ?? '') === 'cancelled';
    }

    private function statePath(): string
    {
        return "cli-generations/{$this->jobId}.json";
    }
}
