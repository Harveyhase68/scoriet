<?php

namespace App\Observers;

use App\Models\Project;
use App\Jobs\RegenerateProjectGenerationTree;

class ProjectObserver
{
    /**
     * Handle the Project "updated" event.
     */
    public function updated(Project $project): void
    {
        // Check if enabled_languages was changed
        if ($project->isDirty('enabled_languages')) {
            RegenerateProjectGenerationTree::dispatch($project->id);
        }
    }
}
