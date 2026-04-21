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
            return;
        }

        // Check if we should run synchronously (for development/testing)
        $runSynchronously = config('app.env') === 'local' || config('queue.default') === 'sync';

        // Dispatch queue jobs for each affected project
        foreach ($projectIds as $projectId) {
            try {
                if ($runSynchronously) {
                    // Run the job immediately for development
                    $job = new RegenerateProjectGenerationTree($projectId);
                    $job->handle();
                } else {
                    // Dispatch to queue for production
                    RegenerateProjectGenerationTree::dispatch($projectId);
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
                }

                // 2. Delete Gtree Cache for all templates (all schema-selection variants)
                $templates = \App\Models\Template::all();
                foreach ($templates as $template) {
                    TemplateCacheService::forgetGtreePattern($projectId, $template->id);
                }
            }
        }
    }
}
