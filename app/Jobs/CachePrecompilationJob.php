<?php

namespace App\Jobs;

use App\Models\User;
use App\Models\Template;
use App\Models\TemplateFile;
use App\Models\Project;
use App\Services\TemplateCacheService;
use App\Services\CacheProgressService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class CachePrecompilationJob implements ShouldQueue
{
    use Queueable;

    public int $userId;
    public ?int $projectId;
    public ?int $templateId;

    /**
     * Create a new job instance.
     *
     * @param int $userId User who triggered the precompilation
     * @param int|null $projectId Optional: Precompile only for specific project
     * @param int|null $templateId Optional: Precompile only specific template
     */
    public function __construct(int $userId, ?int $projectId = null, ?int $templateId = null)
    {
        $this->userId = $userId;
        $this->projectId = $projectId;
        $this->templateId = $templateId;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $progressService = app(CacheProgressService::class);
        $cacheService = app(TemplateCacheService::class);

        try {
            // Check if user is still online
            if (!$this->isUserOnline()) {
                Log::info("User {$this->userId} is offline, skipping cache precompilation");
                return;
            }

            // Get templates to precompile
            $templates = $this->getTemplatesToPrecompile();

            if ($templates->isEmpty()) {
                Log::info("No templates to precompile for user {$this->userId}");
                return;
            }

            // Count total items (template files)
            $totalItems = 0;
            foreach ($templates as $template) {
                $totalItems += $template->files()->count();
            }

            // Start progress tracking
            $sessionId = $progressService->start($this->userId, $totalItems);

            $completedItems = 0;

            // Process each template
            foreach ($templates as $template) {
                $templateFiles = $template->files;

                foreach ($templateFiles as $file) {
                    // Check if still online before each file
                    if (!$this->isUserOnline()) {
                        Log::info("User went offline during precompilation");
                        $progressService->fail($sessionId, 'User went offline');
                        return;
                    }

                    // Update progress with current file
                    $progressService->update(
                        $sessionId,
                        $completedItems,
                        "Template: {$template->name} - File: {$file->file_name}"
                    );

                    // Check if already cached (using file's updated_at)
                    $cacheKey = $cacheService->buildCacheKey(
                        $template->id,
                        $file->id,
                        null, // table_name - for project-level files
                        null, // language_code
                        $file->updated_at->timestamp
                    );

                    if (Cache::has($cacheKey)) {
                        Log::debug("File already cached, skipping", [
                            'template_id' => $template->id,
                            'file_id' => $file->id,
                            'cache_key' => $cacheKey
                        ]);
                        $completedItems++;
                        continue;
                    }

                    // Simulate compilation (in production, this would be actual template compilation)
                    $compiledContent = $this->simulateCompilation($template, $file);

                    // Store in cache
                    Cache::put($cacheKey, $compiledContent, now()->addHours(24));

                    Log::debug("File cached successfully", [
                        'template_id' => $template->id,
                        'file_id' => $file->id,
                        'size_bytes' => strlen($compiledContent)
                    ]);

                    $completedItems++;

                    // Update progress
                    $progressService->update($sessionId, $completedItems);

                    // Small delay to prevent overwhelming the system
                    usleep(100000); // 0.1 seconds
                }
            }

            // Mark as completed
            $progressService->complete($sessionId);

            Log::info("Cache precompilation completed successfully", [
                'user_id' => $this->userId,
                'total_items' => $totalItems,
                'completed_items' => $completedItems
            ]);

        } catch (\Exception $e) {
            Log::error("Cache precompilation failed", [
                'user_id' => $this->userId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            if (isset($sessionId)) {
                $progressService->fail($sessionId, $e->getMessage());
            }
        }
    }

    /**
     * Check if user is still online
     * Uses session/cache to determine if user is active
     */
    protected function isUserOnline(): bool
    {
        // Check if user has an active session (last activity within 5 minutes)
        $lastActivity = Cache::get("user_online_{$this->userId}");

        if (!$lastActivity) {
            return false;
        }

        // Consider online if activity within last 5 minutes
        return now()->diffInMinutes($lastActivity) <= 5;
    }

    /**
     * Get templates that need precompilation
     */
    protected function getTemplatesToPrecompile()
    {
        $query = Template::with('files')->where('is_active', true);

        if ($this->templateId) {
            $query->where('id', $this->templateId);
        } elseif ($this->projectId) {
            // Get templates used by this project
            $query->whereHas('projectUsages', function ($q) {
                $q->where('project_id', $this->projectId)
                  ->where('is_active', true);
            });
        }

        return $query->get();
    }

    /**
     * Simulate template compilation
     * In production, this would call the actual template compiler
     */
    protected function simulateCompilation(Template $template, TemplateFile $file): string
    {
        // Simulate compilation
        $compiled = "// Precompiled: {$template->name} - {$file->file_name}\n";
        $compiled .= "// Compiled at: " . now()->toDateTimeString() . "\n";
        $compiled .= "// Template ID: {$template->id}\n";
        $compiled .= "// File ID: {$file->id}\n\n";
        $compiled .= "// This would contain the actual compiled template code\n";
        $compiled .= "// Original content length: " . strlen($file->file_content ?? '') . " bytes\n";

        return $compiled;
    }
}
