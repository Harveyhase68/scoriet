<?php

namespace App\Observers;

use App\Models\SchemaVersion;
use App\Jobs\RegenerateProjectGenerationTree;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SchemaVersionObserver
{
    /**
     * Handle the SchemaVersion "created" event.
     */
    public function created(SchemaVersion $schemaVersion): void
    {
        Log::info("SchemaVersionObserver: created event triggered for schema version {$schemaVersion->id}");
        $this->regenerateAffectedProjects($schemaVersion, 'created');
    }

    /**
     * Handle the SchemaVersion "updated" event.
     */
    public function updated(SchemaVersion $schemaVersion): void
    {
        $this->regenerateAffectedProjects($schemaVersion, 'updated');
    }

    /**
     * Handle the SchemaVersion "deleted" event.
     */
    public function deleted(SchemaVersion $schemaVersion): void
    {
        $this->regenerateAffectedProjects($schemaVersion, 'deleted');
    }

    /**
     * Regenerate generation trees for all projects using this schema
     */
    protected function regenerateAffectedProjects(SchemaVersion $schemaVersion, string $action): void
    {
        // Find all projects that use this schema
        $projectIds = DB::table('project_schemas')
            ->where('schema_id', $schemaVersion->schema_id)
            ->pluck('project_id')
            ->unique()
            ->toArray();

        if (empty($projectIds)) {
            Log::info("SchemaVersion {$schemaVersion->id} ({$action}): No projects affected");
            return;
        }

        Log::info("SchemaVersion {$schemaVersion->id} ({$action}): Dispatching regeneration for " . count($projectIds) . " projects");

        // Dispatch queue jobs for each affected project
        foreach ($projectIds as $projectId) {
            RegenerateProjectGenerationTree::dispatch($projectId);
        }
    }
}
