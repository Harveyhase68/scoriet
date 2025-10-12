<?php

namespace App\Observers;

use App\Models\Template;
use App\Jobs\RegenerateProjectGenerationTree;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TemplateObserver
{
    /**
     * Handle the Template "created" event.
     */
    public function created(Template $template): void
    {
        // When a template is created, it's not yet assigned to projects
        // So no need to regenerate anything yet
    }

    /**
     * Handle the Template "updated" event.
     */
    public function updated(Template $template): void
    {
        $this->regenerateAffectedProjects($template, 'updated');
    }

    /**
     * Handle the Template "deleted" event.
     */
    public function deleted(Template $template): void
    {
        $this->regenerateAffectedProjects($template, 'deleted');
    }

    /**
     * Handle the Template "restored" event.
     */
    public function restored(Template $template): void
    {
        $this->regenerateAffectedProjects($template, 'restored');
    }

    /**
     * Handle the Template "force deleted" event.
     */
    public function forceDeleted(Template $template): void
    {
        // After force delete, the template is gone, so just log it
        Log::info("Template {$template->id} was force deleted");
    }

    /**
     * Regenerate generation trees for all projects using this template
     */
    protected function regenerateAffectedProjects(Template $template, string $action): void
    {
        // Find all projects that use this template
        $projectIds = DB::table('project_template_usage')
            ->where('template_id', $template->id)
            ->pluck('project_id')
            ->unique()
            ->toArray();

        if (empty($projectIds)) {
            Log::info("Template {$template->id} ({$action}): No projects affected");
            return;
        }

        Log::info("Template {$template->id} ({$action}): Dispatching regeneration for " . count($projectIds) . " projects");

        // Dispatch queue jobs for each affected project
        foreach ($projectIds as $projectId) {
            RegenerateProjectGenerationTree::dispatch($projectId);
        }
    }
}
