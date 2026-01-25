<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Project;
use App\Services\ProjectFileTreeGenerator;

class TestTreeUpdate extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:tree-update {project_id}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test tree update for a project';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $projectId = $this->argument('project_id');
        
        $this->info("🌳 Testing tree update for project {$projectId}");
        $this->info("------------------------------------------------");

        $project = Project::find($projectId);
        if (!$project) {
            $this->error("Project {$projectId} not found");
            return 1;
        }

        $generator = new ProjectFileTreeGenerator();
        $tree = $generator->generateAndSave($project);

        $this->info("Tree saved with ID: {$tree->id}");
        $this->info("Tree has " . count($tree->tree_data) . " template groups");
        
        foreach ($tree->tree_data as $templateGroup) {
            $this->info("Template: {$templateGroup['name']}");
            $fileCount = $this->countFilesRecursive($templateGroup);
            $this->info("  Files: {$fileCount}");
        }

        return 0;
    }

    private function countFilesRecursive($node)
    {
        $count = 0;
        if (isset($node['children'])) {
            foreach ($node['children'] as $child) {
                if ($child['type'] === 'generated-file') {
                    $count++;
                } else {
                    $count += $this->countFilesRecursive($child);
                }
            }
        }
        return $count;
    }
}