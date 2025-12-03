<?php

namespace App\Observers;

use Illuminate\Support\Facades\Cache;
use App\Models\FloatingSchema;
use App\Models\Template;

class CacheInvalidationObserver
{
    /**
     * 🗑️ Invalidate cache for affected projects when schema changes
     *
     * This observer is attached to:
     * - SchemaTable (created, updated, deleted)
     * - SchemaField (created, updated, deleted)
     * - SchemaConstraint (created, updated, deleted)
     * - SchemaVersion (created, updated, deleted)
     * - FloatingSchema (created, updated, deleted)
     */

    public function created($model)
    {
        $this->invalidateCache($model, 'created');
    }

    public function updated($model)
    {
        $this->invalidateCache($model, 'updated');
    }

    public function deleted($model)
    {
        $this->invalidateCache($model, 'deleted');
    }

    /**
     * Invalidate cache for all projects affected by this model change
     */
    private function invalidateCache($model, $action)
    {
        try {
            // Find affected projects
            $projectIds = $this->getAffectedProjectIds($model);

            if (empty($projectIds)) {
                return;
            }

            foreach ($projectIds as $projectId) {
                // 1. Delete Schema Data Cache
                $schemaCacheKey = "schema_data:{$projectId}";
                if (Cache::has($schemaCacheKey)) {
                    Cache::forget($schemaCacheKey);
                    \Log::info("🗑️ [CACHE INVALIDATED] Schema cache for project #{$projectId} ({$action})", [
                        'model' => class_basename($model),
                        'cache_key' => $schemaCacheKey,
                    ]);
                }

                // 2. Delete Gtree Cache for all templates
                $templates = Template::all();
                foreach ($templates as $template) {
                    $gtreeCacheKey = "gtree:{$projectId}:{$template->id}";
                    if (Cache::has($gtreeCacheKey)) {
                        Cache::forget($gtreeCacheKey);
                        \Log::info("🗑️ [CACHE INVALIDATED] Gtree cache for project #{$projectId} template #{$template->id} ({$action})", [
                            'model' => class_basename($model),
                            'cache_key' => $gtreeCacheKey,
                        ]);
                    }
                }
            }

        } catch (\Exception $e) {
            \Log::error("❌ Cache invalidation failed: {$e->getMessage()}");
        }
    }

    /**
     * Get project IDs affected by this model change
     */
    private function getAffectedProjectIds($model): array
    {
        $modelClass = get_class($model);

        // SchemaTable → get projects via schema_version → schema → projects
        if ($modelClass === 'App\Models\SchemaTable') {
            $schemaVersion = $model->schemaVersion;
            if ($schemaVersion && $schemaVersion->schema) {
                return $schemaVersion->schema->projects()->pluck('projects.id')->toArray();
            }
        }

        // SchemaField → get projects via table → schema_version → schema → projects
        if ($modelClass === 'App\Models\SchemaField') {
            $table = $model->table;
            if ($table && $table->schemaVersion && $table->schemaVersion->schema) {
                return $table->schemaVersion->schema->projects()->pluck('projects.id')->toArray();
            }
        }

        // SchemaConstraint → get projects via table → schema_version → schema → projects
        if ($modelClass === 'App\Models\SchemaConstraint') {
            $table = $model->table;
            if ($table && $table->schemaVersion && $table->schemaVersion->schema) {
                return $table->schemaVersion->schema->projects()->pluck('projects.id')->toArray();
            }
        }

        // SchemaVersion → get projects via schema → projects
        if ($modelClass === 'App\Models\SchemaVersion') {
            $schema = $model->schema;
            if ($schema) {
                return $schema->projects()->pluck('projects.id')->toArray();
            }
        }

        // FloatingSchema → get projects directly
        if ($modelClass === 'App\Models\FloatingSchema') {
            return $model->projects()->pluck('projects.id')->toArray();
        }

        return [];
    }
}
