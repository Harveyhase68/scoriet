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
        Log::info("🔗 [PROJECT-TEMPLATE-USAGE-OBSERVER] created event triggered for usage {$projectTemplateUsage->id} (project: {$projectTemplateUsage->project_id}, template: {$projectTemplateUsage->template_id})");
        $this->regenerateProject($projectTemplateUsage, 'created');
    }

    /**
     * Handle the ProjectTemplateUsage "updated" event.
     */
    public function updated(ProjectTemplateUsage $projectTemplateUsage): void
    {
        // Check if is_active was changed
        if ($projectTemplateUsage->isDirty('is_active')) {
            Log::info("🔗 [PROJECT-TEMPLATE-USAGE-OBSERVER] is_active changed for usage {$projectTemplateUsage->id} (project: {$projectTemplateUsage->project_id}, template: {$projectTemplateUsage->template_id})");
            $this->regenerateProject($projectTemplateUsage, 'updated');
        }
    }

    /**
     * Handle the ProjectTemplateUsage "deleted" event.
     */
    public function deleted(ProjectTemplateUsage $projectTemplateUsage): void
    {
        Log::info("🔗 [PROJECT-TEMPLATE-USAGE-OBSERVER] deleted event triggered for usage {$projectTemplateUsage->id} (project: {$projectTemplateUsage->project_id}, template: {$projectTemplateUsage->template_id})");
        $this->regenerateProject($projectTemplateUsage, 'deleted');
    }

    /**
     * Regenerate generation tree for the affected project
     */
    protected function regenerateProject(ProjectTemplateUsage $projectTemplateUsage, string $action): void
    {
        $projectId = $projectTemplateUsage->project_id;
        
        Log::info("ProjectTemplateUsage {$projectTemplateUsage->id} ({$action}): Dispatching regeneration for project {$projectId}");

        try {
            RegenerateProjectGenerationTree::dispatch($projectId);
            Log::info("Successfully dispatched regeneration job for project {$projectId}");
        } catch (\Exception $e) {
            Log::error("Failed to dispatch regeneration job for project {$projectId}: " . $e->getMessage());
        }
    }
}