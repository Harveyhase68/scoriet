<?php

namespace App\Observers;

use App\Models\SchemaTable;
use App\Jobs\RegenerateProjectGenerationTree;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SchemaTableObserver
{
    /**
     * Handle the SchemaTable "created" event.
     */
    public function created(SchemaTable $schemaTable): void
    {
        Log::info("📋 [SCHEMA-TABLE-OBSERVER] created event triggered for table {$schemaTable->id} ({$schemaTable->table_name})");
        $this->regenerateAffectedProjects($schemaTable, 'created');
    }

    /**
     * Handle the SchemaTable "updated" event.
     */
    public function updated(SchemaTable $schemaTable): void
    {
        Log::info("📋 [SCHEMA-TABLE-OBSERVER] updated event triggered for table {$schemaTable->id} ({$schemaTable->table_name})");
        $this->regenerateAffectedProjects($schemaTable, 'updated');
    }

    /**
     * Handle the SchemaTable "deleted" event.
     */
    public function deleted(SchemaTable $schemaTable): void
    {
        Log::info("📋 [SCHEMA-TABLE-OBSERVER] deleted event triggered for table {$schemaTable->id} ({$schemaTable->table_name})");
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
            Log::info("📋 [SCHEMA-TABLE-OBSERVER] SchemaTable {$schemaTable->id} ({$action}): No active projects found");
            return;
        }

        Log::info("📋 [SCHEMA-TABLE-OBSERVER] SchemaTable {$schemaTable->id} ({$action}): Dispatching regeneration for ALL " . count($projectIds) . " active projects");

        // Check if we should run synchronously (for development/testing)
        $runSynchronously = config('app.env') === 'local' || config('queue.default') === 'sync';

        // Dispatch queue jobs for each affected project
        foreach ($projectIds as $projectId) {
            try {
                if ($runSynchronously) {
                    // Run the job immediately for development
                    Log::info("📋 [SCHEMA-TABLE-OBSERVER] Running regeneration job synchronously for project {$projectId}");
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
}