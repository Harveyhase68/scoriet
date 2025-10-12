<?php

namespace App\Observers;

use App\Models\Project;
use App\Jobs\RegenerateProjectGenerationTree;
use Illuminate\Support\Facades\Log;

class ProjectObserver
{
    /**
     * Handle the Project "updated" event.
     */
    public function updated(Project $project): void
    {
        // Check if enabled_languages was changed
        if ($project->isDirty('enabled_languages')) {
            Log::info("Project {$project->id} languages updated: Dispatching regeneration");
            RegenerateProjectGenerationTree::dispatch($project->id);
        }
    }
}
