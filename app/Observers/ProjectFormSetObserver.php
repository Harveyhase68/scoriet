<?php

namespace App\Observers;

use App\Models\ProjectFormSet;
use App\Services\TemplateCacheService;
use Illuminate\Support\Facades\Log;

class ProjectFormSetObserver
{
    /**
     * Handle the ProjectFormSet "created" event.
     */
    public function created(ProjectFormSet $formSet): void
    {
        $this->invalidateProjectCache($formSet->project_id);
    }

    /**
     * Handle the ProjectFormSet "updated" event.
     */
    public function updated(ProjectFormSet $formSet): void
    {
        $this->invalidateProjectCache($formSet->project_id);
    }

    /**
     * Handle the ProjectFormSet "deleted" event.
     */
    public function deleted(ProjectFormSet $formSet): void
    {
        $this->invalidateProjectCache($formSet->project_id);
    }

    /**
     * Invalidate GTree cache for the affected project.
     */
    private function invalidateProjectCache(int $projectId): void
    {
        try {
            $cacheService = app(TemplateCacheService::class);
            $cacheService->invalidateGtreeForProject($projectId);
        } catch (\Exception $e) {
            Log::error("Failed to invalidate cache after FormSet change for project {$projectId}: " . $e->getMessage());
        }
    }
}
