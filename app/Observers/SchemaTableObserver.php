<?php

namespace App\Observers;

use App\Models\SchemaTable;
use App\Jobs\RegenerateProjectGenerationTree;
use App\Services\TemplateCacheService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class SchemaTableObserver
{
    /**
     * Columns whose mutation counts as a "table change" — bumping the
     * table's version + audit. Pure field-content edits do NOT bump the
     * table version (decision per user); add/remove of fields DOES, and
     * that path runs through SchemaFieldObserver::created/deleted.
     */
    private const TABLE_VERSION_COLUMNS = [
        'table_name',
        'comment',
        'primarykeyfield',
        'filekeyname',
        'singular_name',
        'file_name_renamed',
        'file_name_short',
        'display_state',
        'generation_mode',
    ];

    /**
     * Set audit + version on a brand-new row BEFORE the INSERT hits the DB.
     * Honours the suppress flag so SchemaStorageService can set everything
     * explicitly during SQL import without our defaults clobbering it.
     */
    public function creating(SchemaTable $schemaTable): void
    {
        if (SchemaTable::$suppressAudit) {
            return;
        }
        if (empty($schemaTable->version)) {
            $schemaTable->version = 1;
        }
        $schemaTable->applyAuditOnCreate();
    }

    /**
     * Bump version + refresh audit on meaningful changes only. "Meaningful"
     * is the whitelist above — purely audit/version self-updates are
     * ignored so we don't recurse forever.
     */
    public function updating(SchemaTable $schemaTable): void
    {
        if (SchemaTable::$suppressAudit) {
            return;
        }
        $dirtyKeys = array_keys($schemaTable->getDirty());
        $relevant = array_intersect($dirtyKeys, self::TABLE_VERSION_COLUMNS);
        if (empty($relevant)) {
            return;
        }
        $schemaTable->bumpVersion();
        $schemaTable->applyAuditOnUpdate();
    }

    /**
     * Handle the SchemaTable "created" event.
     */
    public function created(SchemaTable $schemaTable): void
    {
        // Clear all template cache as schema structure changed
        app(TemplateCacheService::class)->clearAll();

        // Also invalidate schema data cache
        $this->invalidateSchemaCache($schemaTable);

        $this->regenerateAffectedProjects($schemaTable, 'created');
    }

    /**
     * Handle the SchemaTable "updated" event.
     */
    public function updated(SchemaTable $schemaTable): void
    {
        // Clear all template cache as schema structure changed
        app(TemplateCacheService::class)->clearAll();

        // Also invalidate schema data cache
        $this->invalidateSchemaCache($schemaTable);

        $this->regenerateAffectedProjects($schemaTable, 'updated');
    }

    /**
     * Handle the SchemaTable "deleted" event.
     */
    public function deleted(SchemaTable $schemaTable): void
    {
        // Clear all template cache as schema structure changed
        app(TemplateCacheService::class)->clearAll();

        // Also invalidate schema data cache
        $this->invalidateSchemaCache($schemaTable);

        $this->regenerateAffectedProjects($schemaTable, 'deleted');
    }

    /**
     * Regenerate generation trees for ALL projects (since ProjectFileTreeGenerator now uses ALL schemas)
     */
    protected function regenerateAffectedProjects(SchemaTable $schemaTable, string $action): void
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
     * Invalidate schema data cache for this table's version
     */
    private function invalidateSchemaCache(SchemaTable $schemaTable): void
    {
        if ($schemaTable->schema_version_id) {
            $cacheKey = "schema_tables:{$schemaTable->schema_version_id}";
            Cache::forget($cacheKey);
        }

        // 🆕 INVALIDATE NEW CACHE KEYS (schema_data + gtree)
        // Get affected projects via schema version → schema → projects
        $schemaVersion = $schemaTable->schemaVersion;
        if ($schemaVersion && $schemaVersion->schema) {
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