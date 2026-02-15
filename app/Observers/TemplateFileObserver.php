<?php

namespace App\Observers;

use App\Models\TemplateFile;
use App\Jobs\RegenerateProjectGenerationTree;
use App\Jobs\PrecompileTemplatesJob;
use App\Services\TemplateCacheService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TemplateFileObserver
{
    /**
     * Handle the TemplateFile "created" event.
     */
    public function created(TemplateFile $templateFile): void
    {
        Log::info("📄 [TEMPLATE-FILE-OBSERVER] created event triggered for file {$templateFile->id} (template: {$templateFile->template_id})");

        // Invalidate compiled template cache and GTree cache for this template
        $this->invalidateTemplateAndGtreeCache($templateFile);

        $this->regenerateAffectedProjects($templateFile, 'created');
    }

    /**
     * Handle the TemplateFile "updated" event.
     */
    public function updated(TemplateFile $templateFile): void
    {
        Log::info("📄 [TEMPLATE-FILE-OBSERVER] updated event triggered for file {$templateFile->id} (template: {$templateFile->template_id})");

        // Invalidate cache for this specific file
        $this->invalidateFileCache($templateFile);

        // Also invalidate GTree cache for affected projects
        $this->invalidateGtreeCache($templateFile);

        // Regenerate generation trees
        $this->regenerateAffectedProjects($templateFile, 'updated');

        // Optional: Pre-compile in background (only if enabled in config)
        if (config('templates.auto_precompile', false)) {
            $this->precompileFile($templateFile);
        }
    }

    /**
     * Handle the TemplateFile "deleted" event.
     */
    public function deleted(TemplateFile $templateFile): void
    {
        Log::info("📄 [TEMPLATE-FILE-OBSERVER] deleted event triggered for file {$templateFile->id} (template: {$templateFile->template_id})");

        // Invalidate cache for deleted file and GTree cache
        $this->invalidateFileCache($templateFile);
        $this->invalidateGtreeCache($templateFile);

        // Regenerate generation trees
        $this->regenerateAffectedProjects($templateFile, 'deleted');
    }

    /**
     * Regenerate generation trees for all projects using this template
     */
    protected function regenerateAffectedProjects(TemplateFile $templateFile, string $action): void
    {
        // Find all projects that use this template
        $projectIds = DB::table('project_template_usage')
            ->where('template_id', $templateFile->template_id)
            ->where('is_active', true)
            ->pluck('project_id')
            ->unique()
            ->toArray();

        if (empty($projectIds)) {
            Log::info("TemplateFile {$templateFile->id} ({$action}): No projects affected");
            return;
        }

        Log::info("TemplateFile {$templateFile->id} ({$action}): Dispatching regeneration for " . count($projectIds) . " projects");

        // Dispatch queue jobs for each affected project
        foreach ($projectIds as $projectId) {
            try {
                RegenerateProjectGenerationTree::dispatch($projectId);
                Log::info("Successfully dispatched regeneration job for project {$projectId}");
            } catch (\Exception $e) {
                Log::error("Failed to dispatch regeneration job for project {$projectId}: " . $e->getMessage());
            }
        }
    }

    /**
     * Invalidate cache for a specific template file
     * Only invalidates cache entries for THIS file (not entire template)
     */
    protected function invalidateFileCache(TemplateFile $templateFile): void
    {
        try {
            $cacheService = app(TemplateCacheService::class);
            $cacheService->invalidateFile($templateFile->id);

            Log::info("🗑️ [CACHE] Invalidated cache for template file {$templateFile->id} ({$templateFile->file_name})");
        } catch (\Exception $e) {
            Log::error("❌ [CACHE] Failed to invalidate cache for file {$templateFile->id}: " . $e->getMessage());
        }
    }

    /**
     * Invalidate entire template cache AND GTree cache
     * Used when files are created (template structure changed)
     */
    protected function invalidateTemplateAndGtreeCache(TemplateFile $templateFile): void
    {
        try {
            $cacheService = app(TemplateCacheService::class);
            $cacheService->invalidateTemplate($templateFile->template_id);
            $cacheService->invalidateGtreeForTemplate($templateFile->template_id);

            Log::info("🗑️ [CACHE] Invalidated template + GTree cache for template {$templateFile->template_id}");
        } catch (\Exception $e) {
            Log::error("❌ [CACHE] Failed to invalidate template/GTree cache: " . $e->getMessage());
        }
    }

    /**
     * Invalidate GTree cache for all projects using this template
     */
    protected function invalidateGtreeCache(TemplateFile $templateFile): void
    {
        try {
            $cacheService = app(TemplateCacheService::class);
            $cacheService->invalidateGtreeForTemplate($templateFile->template_id);
        } catch (\Exception $e) {
            Log::error("❌ [CACHE] Failed to invalidate GTree cache: " . $e->getMessage());
        }
    }

    /**
     * Trigger background pre-compilation for a specific file
     * Dispatches jobs to pre-compile this file for all affected projects
     */
    protected function precompileFile(TemplateFile $templateFile): void
    {
        // Get all projects using this template
        $projectIds = DB::table('project_template_usage')
            ->where('template_id', $templateFile->template_id)
            ->where('is_active', true)
            ->pluck('project_id')
            ->unique()
            ->toArray();

        if (empty($projectIds)) {
            Log::info("🔥 [PRECOMPILE] No projects to pre-compile for file {$templateFile->id}");
            return;
        }

        Log::info("🔥 [PRECOMPILE] Dispatching pre-compilation for file {$templateFile->id} across " . count($projectIds) . " projects");

        foreach ($projectIds as $projectId) {
            try {
                // 🎯 Only pre-compile this specific file (not entire template!)
                PrecompileTemplatesJob::dispatch(
                    projectId: $projectId,
                    templateId: $templateFile->template_id,
                    fileId: $templateFile->id
                );

                Log::info("🔥 Dispatched pre-compilation job for project {$projectId}, file {$templateFile->id}");
            } catch (\Exception $e) {
                Log::error("❌ Failed to dispatch pre-compilation for project {$projectId}: " . $e->getMessage());
            }
        }
    }
}