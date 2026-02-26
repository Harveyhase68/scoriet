<?php

namespace App\Observers;

use App\Models\SchemaTranslation;
use App\Models\SchemaTable;
use App\Models\SchemaVersion;
use App\Services\TemplateCacheService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SchemaTranslationObserver
{
    /**
     * Handle the SchemaTranslation "saved" event (covers both created and updated).
     */
    public function saved(SchemaTranslation $translation): void
    {
        $this->invalidateAffectedProjectCaches($translation);
    }

    /**
     * Handle the SchemaTranslation "deleted" event.
     */
    public function deleted(SchemaTranslation $translation): void
    {
        $this->invalidateAffectedProjectCaches($translation);
    }

    /**
     * Invalidate GTree cache for all projects whose schemas contain
     * the table referenced by this translation's item_name.
     */
    private function invalidateAffectedProjectCaches(SchemaTranslation $translation): void
    {
        try {
            $tableName = $translation->getTableName();

            // Find schema_tables with this table_name
            $tableIds = SchemaTable::where('table_name', $tableName)->pluck('id');
            if ($tableIds->isEmpty()) {
                return;
            }

            // Find schema_versions that contain these tables
            $versionIds = SchemaTable::whereIn('id', $tableIds)
                ->pluck('schema_version_id')
                ->unique();

            if ($versionIds->isEmpty()) {
                return;
            }

            // Find floating schemas with these versions
            $schemaIds = SchemaVersion::whereIn('id', $versionIds)
                ->pluck('schema_id')
                ->unique();

            if ($schemaIds->isEmpty()) {
                return;
            }

            // Find projects using these schemas
            $projectIds = DB::table('project_schemas')
                ->whereIn('schema_id', $schemaIds)
                ->pluck('project_id')
                ->unique();

            if ($projectIds->isEmpty()) {
                return;
            }

            $cacheService = app(TemplateCacheService::class);
            foreach ($projectIds as $projectId) {
                $cacheService->invalidateGtreeForProject($projectId);
            }
        } catch (\Exception $e) {
            Log::error('Failed to invalidate cache after translation change: ' . $e->getMessage());
        }
    }
}
