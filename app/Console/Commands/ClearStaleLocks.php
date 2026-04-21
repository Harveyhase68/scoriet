<?php

namespace App\Console\Commands;

use App\Events\ProjectUnlocked;
use App\Models\Project;
use Illuminate\Console\Command;

class ClearStaleLocks extends Command
{
    protected $signature = 'projects:clear-stale-locks';
    protected $description = 'Clear project edit locks older than 15 minutes';

    public function handle(): void
    {
        $staleProjects = Project::whereNotNull('locked_by_user_id')
            ->where('locked_at', '<', now()->subMinutes(15))
            ->get();

        foreach ($staleProjects as $project) {
            $project->forceUnlock();
            ProjectUnlocked::dispatch($project);
        }

        if ($staleProjects->count() > 0) {
            $this->info("Cleared {$staleProjects->count()} stale lock(s).");
        }
    }
}
