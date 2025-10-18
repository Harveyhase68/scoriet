<?php

namespace App\Observers;

use App\Models\TemplateFile;
use App\Jobs\RegenerateProjectGenerationTree;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TemplateFileObserver
{
    /**
     * Handle the TemplateFile "created" event.
     */
    public function created(TemplateFile $templateFile): void
    {
        Log::info("📄 [TEMPLATE-FILE-OBSERVER] created event triggered for file {$templateFile->id} (template: {$templateFile->template_id})");
        $this->regenerateAffectedProjects($templateFile, 'created');
    }

    /**
     * Handle the TemplateFile "updated" event.
     */
    public function updated(TemplateFile $templateFile): void
    {
        Log::info("📄 [TEMPLATE-FILE-OBSERVER] updated event triggered for file {$templateFile->id} (template: {$templateFile->template_id})");
        $this->regenerateAffectedProjects($templateFile, 'updated');
    }

    /**
     * Handle the TemplateFile "deleted" event.
     */
    public function deleted(TemplateFile $templateFile): void
    {
        Log::info("📄 [TEMPLATE-FILE-OBSERVER] deleted event triggered for file {$templateFile->id} (template: {$templateFile->template_id})");
        $this->regenerateAffectedProjects($templateFile, 'deleted');
    }

    /**
     * Regenerate generation trees for all projects using this template
     */
    protected function regenerateAffectedProjects(TemplateFile $templateFile, string $action): void
    {
        // Find all projects that use this template
        $projectIds = DB::table('project_template_usage')
            ->where('template_id', $templateFile->template_id)
            ->where('is_active', true)
            ->pluck('project_id')
            ->unique()
            ->toArray();

        if (empty($projectIds)) {
            Log::info("TemplateFile {$templateFile->id} ({$action}): No projects affected");
            return;
        }

        Log::info("TemplateFile {$templateFile->id} ({$action}): Dispatching regeneration for " . count($projectIds) . " projects");

        // Dispatch queue jobs for each affected project
        foreach ($projectIds as $projectId) {
            try {
                RegenerateProjectGenerationTree::dispatch($projectId);
                Log::info("Successfully dispatched regeneration job for project {$projectId}");
            } catch (\Exception $e) {
                Log::error("Failed to dispatch regeneration job for project {$projectId}: " . $e->getMessage());
            }
        }
    }
}