<?php

namespace App\Observers;

use App\Models\ProjectTemplateUsage;
use App\Jobs\RegenerateProjectGenerationTree;
use Illuminate\Support\Facades\Log;

class ProjectTemplateUsageObserver
{
    /**
     * Handle the ProjectTemplateUsage "created" event.
     */
    public function created(ProjectTemplateUsage $projectTemplateUsage): void
    {
        $this->regenerateProject($projectTemplateUsage, 'created');
    }

    /**
     * Handle the ProjectTemplateUsage "updated" event.
     */
    public function updated(ProjectTemplateUsage $projectTemplateUsage): void
    {
        // Check if is_active was changed
        if ($projectTemplateUsage->isDirty('is_active')) {
            $this->regenerateProject($projectTemplateUsage, 'updated');
        }
    }

    /**
     * Handle the ProjectTemplateUsage "deleted" event.
     */
    public function deleted(ProjectTemplateUsage $projectTemplateUsage): void
    {
        $this->regenerateProject($projectTemplateUsage, 'deleted');
    }

    /**
     * Regenerate generation tree for the affected project
     */
    protected function regenerateProject(ProjectTemplateUsage $projectTemplateUsage, string $action): void
    {
        $projectId = $projectTemplateUsage->project_id;

        try {
            RegenerateProjectGenerationTree::dispatch($projectId);
        } catch (\Exception $e) {
            Log::error("Failed to dispatch regeneration job for project {$projectId}: " . $e->getMessage());
        }
    }
}