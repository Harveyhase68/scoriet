<?php

namespace App\Observers;

use App\Models\TemplateFileFieldAssignment;
use App\Services\TemplateCacheService;
use Illuminate\Support\Facades\Log;

class TemplateFileFieldAssignmentObserver
{
    /**
     * Handle the TemplateFileFieldAssignment "saved" event.
     */
    public function saved(TemplateFileFieldAssignment $assignment): void
    {
        $this->invalidateCache($assignment);
    }

    /**
     * Handle the TemplateFileFieldAssignment "deleted" event.
     */
    public function deleted(TemplateFileFieldAssignment $assignment): void
    {
        $this->invalidateCache($assignment);
    }

    /**
     * Invalidate template + GTree caches for the affected template.
     */
    private function invalidateCache(TemplateFileFieldAssignment $assignment): void
    {
        try {
            $templateFile = $assignment->templateFile;
            if (!$templateFile) {
                return;
            }

            $cacheService = app(TemplateCacheService::class);
            $cacheService->invalidateTemplate($templateFile->template_id);
            $cacheService->invalidateGtreeForTemplate($templateFile->template_id);
        } catch (\Exception $e) {
            Log::error('Failed to invalidate cache after field assignment change: ' . $e->getMessage());
        }
    }
}
