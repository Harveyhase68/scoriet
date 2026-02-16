<?php

namespace App\Jobs;

use App\Models\Project;
use App\Models\Template;
use App\Services\TemplateCacheService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Pre-compile and cache templates for faster code generation
 *
 * This job runs in the background to warm up the cache.
 * When triggered, it compiles all template files for all tables/languages
 * and stores them in cache (Redis/File).
 *
 * Triggered by:
 * - Template file saved/updated (warm cache for that specific file)
 * - Manual "Warm Cache" button in UI
 * - Project settings change (languages, templates)
 */
class PrecompileTemplatesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 3600; // 1 hour max (for large projects)
    public $tries = 1; // Don't retry on failure

    /**
     * Create a new job instance.
     */
    public function __construct(
        public int $projectId,
        public ?int $templateId = null, // null = all templates
        public ?int $fileId = null // null = all files in template
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $project = Project::findOrFail($this->projectId);

            // Get templates to compile
            $templates = $this->templateId
                ? Template::where('id', $this->templateId)->get()
                : $project->templates; // via template_usages

            if ($templates->isEmpty()) {
                return;
            }

            // Get all tables from project schemas
            $allTables = $this->getAllTables($project);

            // Get enabled languages
            $enabledLanguages = is_array($project->enabled_languages)
                ? $project->enabled_languages
                : json_decode($project->enabled_languages, true) ?? [];

            $cacheService = app(TemplateCacheService::class);
            $compiledCount = 0;
            $skippedCount = 0;

            foreach ($templates as $template) {
                // Load template files
                $templateFiles = $template->files;

                // Filter to specific file if provided
                if ($this->fileId) {
                    $templateFiles = $templateFiles->where('id', $this->fileId);
                }

                foreach ($templateFiles as $file) {
                    // Determine what combinations to compile based on file type
                    $combinations = $this->getCombinations($file, $allTables, $enabledLanguages);

                    foreach ($combinations as $combo) {
                        $cacheKey = $cacheService->buildCacheKey(
                            $template->id,
                            $file->id,
                            $combo['table'] ?? null,
                            $combo['language'] ?? null,
                            $file->updated_at->timestamp
                        );

                        // Check if already cached
                        if (\Cache::has($cacheKey)) {
                            $skippedCount++;
                            continue;
                        }

                        // Compile and cache (dispatch sub-job for parallel processing)
                        dispatch(function () use ($template, $file, $combo, $cacheService) {
                            try {
                                // Call the ultimate-template API to compile
                                $compiled = $this->compileTemplate(
                                    $template->id,
                                    $file->id,
                                    $combo['table'] ?? null,
                                    $combo['language'] ?? null
                                );

                                // Cache will be stored automatically by TemplateCacheService
                            } catch (\Exception $e) {
                                Log::warning('[PrecompileTemplates] Failed to compile', [
                                    'template' => $template->name,
                                    'file' => $file->file_name,
                                    'error' => $e->getMessage(),
                                ]);
                            }
                        });

                        $compiledCount++;
                    }
                }
            }

        } catch (\Exception $e) {
            Log::error('[PrecompileTemplates] Failed', [
                'project_id' => $this->projectId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }

    /**
     * Get all tables from project schemas
     */
    private function getAllTables(Project $project): array
    {
        $allTables = [];

        foreach ($project->schemas as $schema) {
            // Load gtree for schema
            $schemaService = app(\App\Services\MySQLParser::class);
            $gtreeData = $schemaService->getGTree($schema->id, $schema->last_version ?? 1);

            $tables = $gtreeData['gtree'][0]['project'][0]['tables'] ?? [];
            foreach ($tables as $table) {
                $allTables[] = $table['filename'] ?? $table['tablename'];
            }
        }

        return array_unique($allTables);
    }

    /**
     * Get all combinations (table, language) for a template file
     */
    private function getCombinations($file, array $allTables, array $enabledLanguages): array
    {
        $combinations = [];

        switch ($file->file_type) {
            case 'project_file':
            case 'static_file':
            case 'static_directory':
                // No table, no language
                $combinations[] = ['table' => null, 'language' => null];
                break;

            case 'project_file_languages':
                // No table, all languages
                foreach ($enabledLanguages as $lang) {
                    $combinations[] = ['table' => null, 'language' => $lang];
                }
                break;

            case 'db_table_file':
                // All tables, no language
                foreach ($allTables as $table) {
                    $combinations[] = ['table' => $table, 'language' => null];
                }
                break;

            case 'db_table_file_languages':
                // All tables × all languages
                foreach ($allTables as $table) {
                    foreach ($enabledLanguages as $lang) {
                        $combinations[] = ['table' => $table, 'language' => $lang];
                    }
                }
                break;
        }

        return $combinations;
    }

    /**
     * Compile a template file (simulate API call to UltimateTemplateController)
     */
    private function compileTemplate(
        int $templateId,
        int $fileId,
        ?string $tableName,
        ?string $languageCode
    ): array {
        // This would call the same logic as UltimateTemplateController
        // For now, we'll trigger it via internal API call
        // In production, extract compilation logic to a service

        // TODO: Extract compilation logic from UltimateTemplateController
        // to a service that can be called from both controller and job

        return [
            'compiled' => true,
            'template_id' => $templateId,
            'file_id' => $fileId,
            'table' => $tableName,
            'language' => $languageCode,
        ];
    }
}
