<?php

namespace App\Observers;

use App\Models\SchemaVersion;
use App\Jobs\RegenerateProjectGenerationTree;
use App\Services\TemplateCacheService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class SchemaVersionObserver
{
    /**
     * Handle the SchemaVersion "created" event.
     */
    public function created(SchemaVersion $schemaVersion): void
    {
        Log::info("SchemaVersionObserver: created event triggered for schema version {$schemaVersion->id}");

        // Clear all template cache as schema version changed
        app(TemplateCacheService::class)->clearAll();

        // 🆕 INVALIDATE NEW CACHE KEYS (schema_data + gtree)
        $this->invalidateSchemaCache($schemaVersion);

        $this->regenerateAffectedProjects($schemaVersion, 'created');
    }

    /**
     * Handle the SchemaVersion "updated" event.
     */
    public function updated(SchemaVersion $schemaVersion): void
    {
        // Clear all template cache as schema version changed
        app(TemplateCacheService::class)->clearAll();

        // 🆕 INVALIDATE NEW CACHE KEYS (schema_data + gtree)
        $this->invalidateSchemaCache($schemaVersion);

        $this->regenerateAffectedProjects($schemaVersion, 'updated');
    }

    /**
     * Handle the SchemaVersion "deleted" event.
     */
    public function deleted(SchemaVersion $schemaVersion): void
    {
        // Clear all template cache as schema version changed
        app(TemplateCacheService::class)->clearAll();

        // 🆕 INVALIDATE NEW CACHE KEYS (schema_data + gtree)
        $this->invalidateSchemaCache($schemaVersion);

        $this->regenerateAffectedProjects($schemaVersion, 'deleted');
    }

    /**
     * Regenerate generation trees for ALL projects (since ProjectFileTreeGenerator now uses ALL schemas)
     */
    protected function regenerateAffectedProjects(SchemaVersion $schemaVersion, string $action): void
    {
        // Get ALL projects (not just projects using this schema)
        // Since ProjectFileTreeGenerator now considers ALL schemas, we need to update ALL projects
        $projectIds = DB::table('projects')
            ->where('is_active', true)
            ->pluck('id')
            ->toArray();

        if (empty($projectIds)) {
            Log::info("SchemaVersion {$schemaVersion->id} ({$action}): No active projects found");
            return;
        }

        Log::info("SchemaVersion {$schemaVersion->id} ({$action}): Dispatching regeneration for ALL " . count($projectIds) . " active projects");

        // Check if we should run synchronously (for development/testing)
        $runSynchronously = config('app.env') === 'local' || config('queue.default') === 'sync';

        // Dispatch queue jobs for each affected project
        foreach ($projectIds as $projectId) {
            try {
                if ($runSynchronously) {
                    // Run the job immediately for development
                    Log::info("SchemaVersion {$schemaVersion->id} ({$action}): Running regeneration job synchronously for project {$projectId}");
                    $job = new RegenerateProjectGenerationTree($projectId);
                    $job->handle();
                } else {
                    // Dispatch to queue for production
                    RegenerateProjectGenerationTree::dispatch($projectId);
                    Log::info("Successfully dispatched regeneration job for project {$projectId}");
                }
            } catch (\Exception $e) {
                Log::error("Failed to dispatch/run regeneration job for project {$projectId}: " . $e->getMessage());
            }
        }
    }

    /**
     * Invalidate schema data cache for affected projects
     */
    private function invalidateSchemaCache(SchemaVersion $schemaVersion): void
    {
        // Get affected projects via schema → projects
        if ($schemaVersion->schema) {
            $projectIds = $schemaVersion->schema->projects()->pluck('projects.id')->toArray();

            foreach ($projectIds as $projectId) {
                // 1. Delete Schema Data Cache
                $schemaCacheKey = "schema_data:{$projectId}";
                if (Cache::has($schemaCacheKey)) {
                    Cache::forget($schemaCacheKey);
                    Log::info("🗑️ [CACHE INVALIDATED] Schema cache for project #{$projectId}", [
                        'schema_version' => $schemaVersion->id,
                        'cache_key' => $schemaCacheKey,
                    ]);
                }

                // 2. Delete Gtree Cache for all templates
                $templates = \App\Models\Template::all();
                foreach ($templates as $template) {
                    $gtreeCacheKey = "gtree:{$projectId}:{$template->id}";
                    if (Cache::has($gtreeCacheKey)) {
                        Cache::forget($gtreeCacheKey);
                        Log::info("🗑️ [CACHE INVALIDATED] Gtree cache for project #{$projectId} template #{$template->id}", [
                            'schema_version' => $schemaVersion->id,
                            'cache_key' => $gtreeCacheKey,
                        ]);
                    }
                }
            }
        }
    }
}
