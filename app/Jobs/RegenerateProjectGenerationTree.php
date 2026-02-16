<?php

namespace App\Jobs;

use App\Models\Project;
use App\Services\ProjectFileTreeGenerator;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class RegenerateProjectGenerationTree implements ShouldQueue
{
    use Queueable, InteractsWithQueue, SerializesModels;

    public $timeout = 300; // 5 minutes timeout for large projects

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int $projectId
    ) {
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $project = Project::find($this->projectId);

            if (!$project) {
                Log::warning("Project {$this->projectId} not found for generation tree regeneration");
                return;
            }

            $generator = new ProjectFileTreeGenerator();
            $generationTree = $generator->generateAndSave($project);

        } catch (\Exception $e) {
            Log::error("Failed to regenerate generation tree for project {$this->projectId}: " . $e->getMessage());
            throw $e; // Re-throw to mark job as failed
        }
    }
}
