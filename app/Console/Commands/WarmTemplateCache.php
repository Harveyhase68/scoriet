<?php

namespace App\Console\Commands;

use App\Jobs\PrecompileTemplatesJob;
use App\Models\Project;
use App\Models\Template;
use App\Services\TemplateCacheService;
use Illuminate\Console\Command;

class WarmTemplateCache extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'template:warm-cache
                            {--project= : Project ID to warm cache for (optional, default: all)}
                            {--template= : Template ID to warm cache for (optional, default: all)}
                            {--clear : Clear all cache before warming}
                            {--stats : Show cache statistics}
                            {--sync : Run synchronously (default: queue)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Warm up template compilation cache for faster code generation';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $cacheService = app(TemplateCacheService::class);

        // Show stats only
        if ($this->option('stats')) {
            $this->showStats($cacheService);
            return 0;
        }

        // Clear cache if requested
        if ($this->option('clear')) {
            $this->info('🗑️  Clearing all template cache...');
            $cacheService->clearAll();
            $this->info('✅ Cache cleared!');
        }

        // Get project and template filters
        $projectId = $this->option('project');
        $templateId = $this->option('template');
        $sync = $this->option('sync');

        // Get projects to warm
        $projects = $projectId
            ? Project::where('id', $projectId)->get()
            : Project::all();

        if ($projects->isEmpty()) {
            $this->error('❌ No projects found!');
            return 1;
        }

        $this->info("🔥 Warming cache for " . $projects->count() . " project(s)...");

        $jobsDispatched = 0;

        foreach ($projects as $project) {
            $this->info("\n📦 Project: {$project->name} (ID: {$project->id})");

            // Get templates for this project
            $templates = $templateId
                ? Template::where('id', $templateId)->get()
                : $project->templates; // via template_usages

            if ($templates->isEmpty()) {
                $this->warn("  ⚠️  No templates found for this project");
                continue;
            }

            $this->info("  📄 Templates: " . $templates->count());

            foreach ($templates as $template) {
                $this->line("    - {$template->name}");

                if ($sync) {
                    // Run synchronously (blocking)
                    $this->info("      ⏳ Warming cache synchronously...");
                    $job = new PrecompileTemplatesJob($project->id, $template->id);
                    $job->handle();
                    $this->info("      ✅ Done!");
                } else {
                    // Queue job (background)
                    PrecompileTemplatesJob::dispatch($project->id, $template->id);
                    $jobsDispatched++;
                    $this->line("      🚀 Queued for background processing");
                }
            }
        }

        if (!$sync) {
            $this->newLine();
            $this->info("✅ Dispatched {$jobsDispatched} cache warming job(s) to queue!");
            $this->info("💡 Monitor progress: tail -f storage/logs/laravel.log | grep PrecompileTemplates");
            $this->info("💡 Check queue: php artisan queue:work");
        }

        $this->newLine();
        $this->info("🎉 Cache warming initiated!");

        // Show stats after warming (if sync)
        if ($sync) {
            $this->newLine();
            $this->showStats($cacheService);
        }

        return 0;
    }

    /**
     * Show cache statistics
     */
    private function showStats(TemplateCacheService $cacheService): void
    {
        $stats = $cacheService->getStats();

        $this->info("📊 Cache Statistics:");
        $this->table(
            ['Metric', 'Value'],
            [
                ['Cache Driver', $stats['driver']],
                ['Supports Tags', $stats['supports_tags'] ? 'Yes' : 'No'],
                ['Cached Templates', $stats['cached_templates'] ?? 'N/A'],
                ['Total Size (MB)', $stats['total_size_mb'] ?? 'N/A'],
            ]
        );

        if (isset($stats['error'])) {
            $this->warn("⚠️  Error getting stats: {$stats['error']}");
        }
    }
}
