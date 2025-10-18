<?php

namespace App\Observers;

use App\Models\ProjectSchema;
use App\Jobs\RegenerateProjectGenerationTree;
use Illuminate\Support\Facades\Log;

/**
 * Observer für ProjectSchema (Pivot-Tabelle project_schemas)
 *
 * Triggert Generation Tree Regeneration wenn Schemas zu/von Projects hinzugefügt/entfernt werden
 */
class ProjectSchemaObserver
{
    /**
     * Handle the ProjectSchema "created" event.
     *
     * Wird gefeuert wenn ein Schema zu einem Project zugewiesen wird
     */
    public function created(ProjectSchema $projectSchema): void
    {
        Log::info("🔔 [PROJECT-SCHEMA-OBSERVER] Schema zugewiesen zu Project", [
            'project_id' => $projectSchema->project_id,
            'schema_id' => $projectSchema->schema_id,
        ]);

        // Queue: Regenerate Generation Tree für das betroffene Project
        try {
            RegenerateProjectGenerationTree::dispatch($projectSchema->project_id)
                ->onQueue('default');

            Log::info("✅ [PROJECT-SCHEMA-OBSERVER] Generation Tree Job dispatched", [
                'project_id' => $projectSchema->project_id,
            ]);
        } catch (\Exception $e) {
            Log::error("❌ [PROJECT-SCHEMA-OBSERVER] Failed to dispatch job", [
                'project_id' => $projectSchema->project_id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle the ProjectSchema "deleted" event.
     *
     * Wird gefeuert wenn ein Schema von einem Project entfernt wird
     */
    public function deleted(ProjectSchema $projectSchema): void
    {
        Log::info("🔔 [PROJECT-SCHEMA-OBSERVER] Schema entfernt von Project", [
            'project_id' => $projectSchema->project_id,
            'schema_id' => $projectSchema->schema_id,
        ]);

        // Queue: Regenerate Generation Tree für das betroffene Project
        try {
            RegenerateProjectGenerationTree::dispatch($projectSchema->project_id)
                ->onQueue('default');

            Log::info("✅ [PROJECT-SCHEMA-OBSERVER] Generation Tree Job dispatched", [
                'project_id' => $projectSchema->project_id,
            ]);
        } catch (\Exception $e) {
            Log::error("❌ [PROJECT-SCHEMA-OBSERVER] Failed to dispatch job", [
                'project_id' => $projectSchema->project_id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
