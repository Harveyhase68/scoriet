<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Project;
use App\Models\Template;
use App\Services\TemplateCacheService;
use App\Http\Controllers\Api\UltimateTemplateController;
use Illuminate\Support\Facades\Cache;

class WarmCaches extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cache:warm {--force : Force rebuild all caches} {--project= : Warm cache for specific project ID}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Warm up Redis caches (Schema, Gtree) for all projects and templates';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔥 Starting cache warmup...');

        $force = $this->option('force');
        $specificProjectId = $this->option('project');

        // Get projects to warm
        $projects = $specificProjectId
            ? Project::where('id', $specificProjectId)->get()
            : Project::all();

        if ($projects->isEmpty()) {
            $this->error('❌ No projects found!');
            return 1;
        }

        $this->info("📊 Found {$projects->count()} project(s) to warm");

        // Get all active templates
        $templates = Template::all();
        $this->info("📄 Found {$templates->count()} template(s)");

        $controller = new UltimateTemplateController();
        $totalWarmed = 0;
        $totalSkipped = 0;

        // Warm cache for each project
        foreach ($projects as $project) {
            $this->line("");
            $this->info("🔄 Processing Project #{$project->id}: {$project->name}");

            // 1. Warm Schema Data Cache
            $schemaCacheKey = "schema_data:{$project->id}";

            if ($force || !Cache::has($schemaCacheKey)) {
                $this->line("  📦 Building schema cache...");

                try {
                    // Build schema cache by loading tables with relations
                    $linkedSchemas = \App\Models\FloatingSchema::whereHas('projects', function ($query) use ($project) {
                        $query->where('projects.id', $project->id);
                    })->get();

                    $allTables = collect();
                    foreach ($linkedSchemas as $schema) {
                        $latestVersion = \App\Models\SchemaVersion::where('schema_id', $schema->id)
                            ->orderBy('id', 'desc')
                            ->first();

                        if ($latestVersion) {
                            $tables = \App\Models\SchemaTable::where('schema_version_id', $latestVersion->id)
                                ->with(['fields', 'constraints'])
                                ->get();
                            $allTables = $allTables->merge($tables);
                        }
                    }

                    // Cache the schema data for 24 hours
                    Cache::put($schemaCacheKey, [
                        'tables' => $allTables,
                        'tables_count' => $allTables->count(),
                        'cached_at' => now()->toIso8601String(),
                    ], now()->addHours(24));

                    $totalWarmed++;
                    $this->info("  ✅ Schema cache warmed ({$allTables->count()} tables)");
                } catch (\Exception $e) {
                    $this->error("  ❌ Schema cache failed: {$e->getMessage()}");
                }
            } else {
                $this->line("  ⏭️  Schema cache already exists");
                $totalSkipped++;
            }

            // 2. Warm Gtree Cache for each template
            foreach ($templates as $template) {
                $gtreeCacheKey = "gtree:{$project->id}:{$template->id}";

                if ($force || !Cache::has($gtreeCacheKey)) {
                    $this->line("  📦 Building gtree cache for template '{$template->name}'...");

                    try {
                        // Build gtree using controller method
                        $gtreeData = $controller->buildUltimateGtree($project->id, $template->id, $template);

                        // Cache for 24 hours
                        Cache::put($gtreeCacheKey, $gtreeData['gtree'], now()->addHours(24));

                        $totalWarmed++;
                        $this->info("  ✅ Gtree cache warmed for '{$template->name}'");
                    } catch (\Exception $e) {
                        $this->error("  ❌ Gtree cache failed for '{$template->name}': {$e->getMessage()}");
                    }
                } else {
                    $this->line("  ⏭️  Gtree cache already exists for '{$template->name}'");
                    $totalSkipped++;
                }
            }
        }

        $this->line("");
        $this->info("✅ Cache warmup completed!");
        $this->info("   🔥 Warmed: {$totalWarmed}");
        $this->info("   ⏭️  Skipped: {$totalSkipped}");

        return 0;
    }
}
