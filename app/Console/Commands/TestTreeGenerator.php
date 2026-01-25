<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Project;
use App\Services\ProjectFileTreeGenerator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TestTreeGenerator extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'tree:test {project_id}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test ProjectFileTreeGenerator functionality';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $projectId = $this->argument('project_id');
        
        $this->info('🌳 Testing ProjectFileTreeGenerator');
        $this->info('------------------------------------');

        // Get project
        $project = Project::find($projectId);
        if (!$project) {
            $this->error("Project {$projectId} not found");
            return 1;
        }

        $this->info("Project: {$project->name} (ID: {$project->id})");

        // Check project template usages
        $templateUsages = DB::table('project_template_usage')
            ->where('project_id', $projectId)
            ->where('is_active', true)
            ->get();

        $this->info("Active template usages: " . $templateUsages->count());
        foreach ($templateUsages as $usage) {
            $template = DB::table('templates')->where('id', $usage->template_id)->first();
            $this->info("  - Template ID: {$usage->template_id}, Name: " . ($template->name ?? 'Unknown') . ", Usage: {$usage->usage_type}");
        }

        // Test tree generation
        $generator = new ProjectFileTreeGenerator();
        $tree = $generator->generateTreeForProject($project);

        $this->info("\nGenerated tree nodes: " . count($tree));
        
        // Debug: Check template files
        foreach ($templateUsages as $usage) {
            $templateFiles = DB::table('template_files')
                ->where('template_id', $usage->template_id)
                ->get(['id', 'file_name', 'file_type']);
            
            $template = DB::table('templates')->where('id', $usage->template_id)->first();
            $this->info("\nTemplate {$usage->template_id} ({$template->name}) files: " . $templateFiles->count());
            foreach ($templateFiles as $file) {
                $this->info("  - {$file->file_name} ({$file->file_type})");
            }
        }
        
        // Show tree structure
        foreach ($tree as $node) {
            $this->info("\n  - {$node['type']}: {$node['name']} (ID: {$node['id']})");
            if (isset($node['children'])) {
                $this->info("    Children: " . count($node['children']));
                foreach ($node['children'] as $child) {
                    if ($child['type'] === 'directory') {
                        $this->info("      📁 {$child['name']} ({$child['type']})");
                        if (isset($child['children'])) {
                            foreach ($child['children'] as $grandChild) {
                                $this->info("        📄 {$grandChild['name']} ({$grandChild['type']})");
                            }
                        }
                    } else {
                        $this->info("      📄 {$child['name']} ({$child['type']})");
                    }
                }
            } else {
                $this->info("    No children!");
            }
        }

        // Save and check
        $generationTree = $generator->generateAndSave($project);
        $this->info("\nSaved generation tree ID: {$generationTree->id}");
        $this->info("Tree data items: " . count($generationTree->tree_data));
        $this->info("Is fresh: " . ($generationTree->is_fresh ? 'Yes' : 'No'));

        return 0;
    }
}