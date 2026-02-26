<?php

namespace App\Observers;

use App\Models\Language;
use App\Services\TemplateCacheService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LanguageObserver
{
    /**
     * Handle the Language "created" event.
     */
    public function created(Language $language): void
    {
        if ($language->is_active) {
            $this->invalidateAllProjectCaches();
        }
    }

    /**
     * Handle the Language "updated" event.
     */
    public function updated(Language $language): void
    {
        // Invalidate when is_active, is_default, sort_order, name, or native_name changes
        $relevantFields = ['is_active', 'is_default', 'sort_order', 'name', 'native_name', 'flag'];
        $changedFields = array_keys($language->getDirty());

        if (!empty(array_intersect($changedFields, $relevantFields))) {
            $this->invalidateAllProjectCaches();
        }
    }

    /**
     * Handle the Language "deleted" event.
     */
    public function deleted(Language $language): void
    {
        $this->invalidateAllProjectCaches();
    }

    /**
     * Invalidate GTree + compiled cache for ALL projects.
     * Languages are global, so any change affects all projects.
     */
    private function invalidateAllProjectCaches(): void
    {
        try {
            $cacheService = app(TemplateCacheService::class);

            $projectIds = DB::table('project_template_usage')
                ->where('is_active', true)
                ->pluck('project_id')
                ->unique();

            foreach ($projectIds as $projectId) {
                $cacheService->invalidateGtreeForProject($projectId);
            }
        } catch (\Exception $e) {
            Log::error("Failed to invalidate caches after language change: " . $e->getMessage());
        }
    }
}
