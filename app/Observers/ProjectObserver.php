<?php

namespace App\Observers;

use App\Models\Project;
use App\Jobs\RegenerateProjectGenerationTree;
use App\Services\TemplateCacheService;
use Illuminate\Support\Facades\Log;

class ProjectObserver
{
    /**
     * Fields that do NOT affect the GTree (no cache invalidation needed).
     * Everything not in this list WILL trigger cache invalidation.
     */
    private const CACHE_IRRELEVANT_FIELDS = [
        'install_script',
        'update_script',
        'archive_format',
    ];

    /**
     * Handle the Project "updated" event.
     */
    public function updated(Project $project): void
    {
        // Check if enabled_languages was changed
        if ($project->isDirty('enabled_languages')) {
            RegenerateProjectGenerationTree::dispatch($project->id);
        }

        // Invalidate GTree + compiled template cache when any GTree-relevant field changes
        // This covers: name, description, DB settings, paths, URLs, localization settings,
        // default language, decimal_separator, date_format, etc.
        $changedFields = array_keys($project->getDirty());
        $relevantChanges = array_diff($changedFields, self::CACHE_IRRELEVANT_FIELDS, ['updated_at']);

        if (!empty($relevantChanges)) {
            try {
                $cacheService = app(TemplateCacheService::class);
                $cacheService->invalidateGtreeForProject($project->id);
                $cacheService->invalidateCompiledForProject($project->id);
            } catch (\Exception $e) {
                Log::error("Failed to invalidate cache for project {$project->id}: " . $e->getMessage());
            }
        }
    }
}
