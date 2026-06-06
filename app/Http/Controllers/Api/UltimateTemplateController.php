<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\UltimateTemplateEngine;
use App\Services\TemplateCacheService;
use App\Services\TemplateIncludeResolver;
use App\Services\SchemaDiffService;
use App\Services\MigrationSqlGenerator;
use App\Models\Template;
use App\Models\Project;
use App\Models\FloatingSchema;
use App\Models\SchemaVersion;
use App\Models\SchemaTable;
use App\Models\Language;
use App\Models\SchemaTranslation;
use App\Models\TemplateFileFieldAssignment;
use App\Models\ProjectFormSet;
use App\Models\ProjectGeneration;
use App\Services\CreditService;
use App\Services\PerformanceTrackingService;
use App\Models\PerformanceMetric;
use App\Support\ProjectNamePlaceholder;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

/**
 * 🚀 ULTIMATE TEMPLATE CONTROLLER
 *
 * API Controller für die Ultimate Template Engine mit erweiterten Features:
 * - Multi-Format Export (JSON, JavaScript, PHP)
 * - Template Compilation und Caching
 * - Performance Monitoring
 * - Advanced Error Handling
 */
class UltimateTemplateController extends Controller
{
    /**
     * 💰 CHARGE CREDITS FOR GENERATION
     *
     * This endpoint should be called BEFORE starting a full project generation.
     * It checks if user has enough credits and deducts them.
     * Patron Monthly users are free.
     *
     * POST /api/generation/charge
     */
    public function chargeForGeneration(Request $request): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized',
            ], 401);
        }

        $projectId = $request->input('project_id');

        // Check and charge credits
        $chargeResult = CreditService::chargeForGeneration(
            $user,
            $projectId ? (int)$projectId : null,
            null,
            'web'
        );

        if (!$chargeResult['success']) {
            return response()->json([
                'success' => false,
                'error' => 'insufficient_credits',
                'message' => $chargeResult['message'],
                'credits_required' => CreditService::GENERATION_COST,
                'credits_available' => $user->credits,
            ], 402); // 402 Payment Required
        }

        return response()->json([
            'success' => true,
            'message' => $chargeResult['message'],
            'credits_charged' => $chargeResult['credits_charged'],
            'credits_remaining' => $user->fresh()->credits,
            'is_free' => $chargeResult['credits_charged'] === 0,
        ]);
    }

    /**
     * 🎯 ULTIMATE TEMPLATE PROCESSING
     *
     * Process templates with the Ultimate Template Engine
     */
    public function processTemplate(Request $request, int $templateId): JsonResponse
    {
        $startTime = microtime(true);

        try {
            // Validate template exists
            $template = Template::with('files')->find($templateId);
            if (!$template) {
                return response()->json([
                    'error' => 'Template not found',
                    'template_id' => $templateId
                ], 404);
            }

            // Get project context
            $projectId = $request->query('project_id');
            $tableName = $request->query('table_name'); // For db_table_file types
            $languageCode = $request->query('language_code'); // For language-enabled file types
            $format = $request->query('format', 'json'); // json, js, php
            $compile = $request->query('compile', true); // Compile templates to JS functions
            $includeSource = $request->query('include_source', false); // Include template source as comments
            // 📊 Per-schema migration versions (JSON object: {schemaId: versionNumber, ...})
            $migrationFromVersions = $request->query('migration_from_versions');
            if ($migrationFromVersions && is_string($migrationFromVersions)) {
                $migrationFromVersions = json_decode($migrationFromVersions, true);
            }
            // 🎯 NEU: schema_version für Project-Dateien - erlaubt Auswahl einer spezifischen Schema-Version
            $schemaVersion = $request->query('schema_version'); // For project_file types - specific schema version
            // 🎯 Filter: Only include tables from these schema IDs (null = all linked schemas)
            $schemaIds = $request->query('schema_ids');
            if ($schemaIds && is_string($schemaIds)) {
                $schemaIds = json_decode($schemaIds, true);
            }

            // Load project and schema data (with optional migration)
            // 🎯 WICHTIG: $tableName wird übergeben, um zu bestimmen, ob Migrations eingebunden werden sollen
            // Wenn $tableName gesetzt ist (db_table_file) → KEINE Migrations im GTree
            // Wenn $tableName NULL ist (project_file) → Migrations im GTree einbinden
            // 🎯 NEU: $schemaVersion erlaubt die Auswahl einer spezifischen Schema-Version (nicht automatisch die neueste)
            $gtreeData = $this->buildUltimateGtree($projectId, $templateId, $template, $migrationFromVersions, $tableName, $schemaVersion, $schemaIds);

            // Initialize Ultimate Template Engine
            $engine = new UltimateTemplateEngine($gtreeData['gtree']);

            // Process each template file
            $processedFiles = [];
            $allUnknownVariables = []; // Collect all unknown variables across all files
            $allRequiredMissing = []; // Collect all required but missing variables
            $allOptionalMissing = []; // Collect all optional but missing variables
            $allSyntaxErrors = []; // Collect all syntax errors across all files
            $allSyntaxWarnings = []; // Collect all syntax warnings across all files

            // 🎯 Initialize cache service (only if enabled in config)
            // skip_cache=1 bypasses Redis cache for debugging/testing
            $skipCache = $request->query('skip_cache', false);

            // 🎯 In-memory file overrides — used by the Debug Generator's
            // "Code vorbereiten" so the user can compile their unsaved
            // editor edits without writing them to the database first.
            // Shape: [{ id: 123, file_content: "..." }, ...]. The compile
            // step replaces matching files' content; everything else
            // (file_name, file_type, output_path, ...) stays as-is.
            //
            // IMPORTANT: when overrides are present we MUST bypass the
            // template cache. The cache key is (templateId, fileId, table,
            // language) and doesn't fingerprint content, so a cached result
            // would shadow the user's edits silently.
            $overrideFiles = $request->input('override_files', []);
            $hasOverrides = is_array($overrideFiles) && !empty($overrideFiles);
            if ($hasOverrides) {
                $skipCache = true;
            }
            $cacheService = (!$skipCache && config('scoriet.template_cache.enabled', false)) ? app(TemplateCacheService::class) : null;

            // Build a working copy of $template->files with the overrides
            // merged in. We don't touch the original Eloquent collection —
            // the change has to be transient (no persistence, no cache).
            $workingFiles = $template->files->toArray();
            if ($hasOverrides) {
                $overrideById = [];
                foreach ($overrideFiles as $ov) {
                    if (!is_array($ov) || !isset($ov['id'])) continue;
                    $overrideById[(int) $ov['id']] = $ov['file_content'] ?? '';
                }
                $workingFiles = array_map(static function ($f) use ($overrideById) {
                    $fid = (int) ($f['id'] ?? 0);
                    if (isset($overrideById[$fid])) {
                        $f['file_content'] = $overrideById[$fid];
                    }
                    return $f;
                }, $workingFiles);
            }

            // 🔗 INCLUDE RESOLUTION: Resolve {:include: path/file.ext:} patterns before processing
            $includeResolution = TemplateIncludeResolver::resolveAllFiles($workingFiles);
            $resolvedFiles = $includeResolution['files'];
            $includeErrors = $includeResolution['errors'];

            // Log include errors if any
            if (!empty($includeErrors)) {
                \Log::warning("⚠️ [INCLUDE RESOLVER] Errors during include resolution", $includeErrors);
            }

            $globalFileCounter = 0; // Global counter for %13

            // Pre-calculate db_table_file positions for %13 global counter
            // ONLY count files that actually USE %13 in their filename or output_path
            $dbTableFilePositions = [];
            $dbTableFileIdx = 0;
            foreach ($resolvedFiles as $rf) {
                $rf = (object) $rf;
                if (($rf->content_type ?? null) === 'zip') continue;
                $rfGenType = $this->determineGenerationType($rf);
                $usesPercent13 = str_contains($rf->file_name ?? '', '%13') || str_contains($rf->output_path ?? '', '%13');
                if (in_array($rfGenType, ['db_table_file', 'db_table_file_languages']) && $usesPercent13) {
                    $dbTableFilePositions[$rf->id] = $dbTableFileIdx;
                    $dbTableFileIdx++;
                }
            }

            foreach ($resolvedFiles as $file) {
                // Convert back to object if needed for compatibility
                $file = (object) $file;

                // 🎯 Skip ZIP files - they are handled client-side in CodeGenerationPanel
                if (($file->content_type ?? null) === 'zip') {
                    continue;
                }

                $filePosition = $dbTableFilePositions[$file->id] ?? 0;

                // 🚀 CACHE: Try to get from cache first
                $fileResult = null;
                if ($cacheService && $compile) {
                    try {
                        $fileResult = $cacheService->getOrCompile(
                            templateId: $templateId,
                            fileId: $file->id,
                            tableName: $tableName,
                            languageCode: $languageCode,
                            compileCallback: function() use ($engine, $file, $gtreeData, $compile, $tableName, $languageCode, $includeSource, &$globalFileCounter, $filePosition) {
                                return $this->processTemplateFile($engine, $file, $gtreeData, $compile, $tableName, $languageCode, $includeSource, 0, $globalFileCounter, $filePosition);
                            },
                            includeSource: $includeSource
                        );
                    } catch (\Exception $e) {
                        \Log::warning("⚠️ [CACHE ERROR] Cache lookup failed for file {$file->id}: {$e->getMessage()}. Compiling without cache.");
                        $fileResult = null;
                    }
                }

                // Fallback: No cache or cache disabled
                if (!$fileResult) {
                    $fileResult = $this->processTemplateFile($engine, $file, $gtreeData, $compile, $tableName, $languageCode, $includeSource, 0, $globalFileCounter, $filePosition);
                }

                // Skip files whose table was excluded at schema level (no tableIdx resolved).
                if (!empty($fileResult['skipped'])) {
                    continue;
                }

                $processedFiles[] = $fileResult;

                // ✅ Collect syntax errors from this file
                if ($fileResult['has_syntax_errors']) {
                    foreach ($fileResult['syntax_errors'] as $error) {
                        $allSyntaxErrors[] = [
                            'file' => $fileResult['filename'],
                            'error' => $error,
                        ];
                    }
                }

                // ✅ Collect syntax warnings from this file
                if (!empty($fileResult['syntax_warnings'])) {
                    foreach ($fileResult['syntax_warnings'] as $warning) {
                        $allSyntaxWarnings[] = [
                            'file' => $fileResult['filename'],
                            'warning' => $warning,
                        ];
                    }
                }

                // ✅ Collect unknown variables from this file
                if ($fileResult['has_unknown_variables']) {
                    foreach ($fileResult['unknown_variables'] as $unknownVar) {
                        $allUnknownVariables[] = [
                            'file' => $fileResult['filename'],
                            'variable' => $unknownVar['variable'],
                            'line' => $unknownVar['line'],
                        ];
                    }
                }

                // ✅ Collect required missing variables
                if (!empty($fileResult['required_missing'])) {
                    foreach ($fileResult['required_missing'] as $reqVar) {
                        $allRequiredMissing[] = [
                            'file' => $fileResult['filename'],
                            'variable' => $reqVar['variable'],
                            'line' => $reqVar['line'],
                            'description' => $reqVar['description'],
                        ];
                    }
                }

                // ✅ Collect optional missing variables
                if (!empty($fileResult['optional_missing'])) {
                    foreach ($fileResult['optional_missing'] as $optVar) {
                        $allOptionalMissing[] = [
                            'file' => $fileResult['filename'],
                            'variable' => $optVar['variable'],
                            'line' => $optVar['line'],
                            'description' => $optVar['description'],
                            'default_value' => $optVar['default_value'],
                        ];
                    }
                }
            }

            // Calculate performance metrics
            $endTime = microtime(true);
            $executionTime = ($endTime - $startTime) * 1000; // Convert to milliseconds

            // 📊 Track performance metric
            $cacheStats = $cacheService ? $cacheService->getHitStats() : ['hits' => 0, 'misses' => 0, 'total' => 0, 'hit_rate' => 0];
            $user = auth()->user();
            try {
                PerformanceMetric::create([
                    'user_id' => $user?->id,
                    'operation' => PerformanceMetric::OP_GENERATION,
                    'operation_detail' => "Template: {$templateId}" . ($tableName ? " ({$tableName})" : ' (project)'),
                    'duration_ms' => (int) $executionTime,
                    'memory_peak_mb' => (int) (memory_get_peak_usage(true) / 1024 / 1024),
                    'tables_count' => null,
                    'fields_count' => null,
                    'from_cache' => $cacheStats['hits'] > 0,
                    'subscription_type' => $user?->subscription?->type ?? ($user?->isPatron() ? 'patron' : 'free'),
                    'metadata' => [
                        'cache_hits' => $cacheStats['hits'],
                        'cache_misses' => $cacheStats['misses'],
                        'cache_hit_rate' => $cacheStats['hit_rate'],
                    ],
                    'created_at' => now(),
                ]);
            } catch (\Exception $e) {
                \Log::error('Performance tracking error: ' . $e->getMessage());
            }

            // 🎯 Base GTree at top level (unfiltered)
            // Each processed file carries its own overlaid_gtree (only when assignments exist)
            // Frontend uses the file-specific overlay when executing a specific file's code

            // Build response based on format
            return $this->buildResponse($format, [
                'template_id' => $templateId,
                'project_id' => $projectId,
                'gtree' => $gtreeData['gtree'],
                'gtree_metadata' => $gtreeData['metadata'],
                'processed_files' => $processedFiles,
                // ✅ Add validation summary (syntax + variables)
                'validation' => [
                    // Syntax validation
                    'has_syntax_errors' => !empty($allSyntaxErrors),
                    'syntax_errors_count' => count($allSyntaxErrors),
                    'syntax_errors' => $allSyntaxErrors,
                    'has_syntax_warnings' => !empty($allSyntaxWarnings),
                    'syntax_warnings_count' => count($allSyntaxWarnings),
                    'syntax_warnings' => $allSyntaxWarnings,
                    // Variable validation (3 categories)
                    'has_unknown_variables' => !empty($allUnknownVariables),
                    'unknown_variables_count' => count($allUnknownVariables),
                    'unknown_variables' => $allUnknownVariables,
                    'has_required_missing' => !empty($allRequiredMissing),
                    'required_missing_count' => count($allRequiredMissing),
                    'required_missing' => $allRequiredMissing,
                    'has_optional_missing' => !empty($allOptionalMissing),
                    'optional_missing_count' => count($allOptionalMissing),
                    'optional_missing' => $allOptionalMissing,
                ],
                'engine_features' => [
                    'enhanced_variables' => true,
                    'nested_loops' => true,
                    'advanced_conditionals' => true,
                    'switch_statements' => true,
                    'built_in_functions' => true,
                    'macro_support' => true,
                    'template_compilation' => $compile,
                ],
                'performance' => array_merge([
                    'execution_time_ms' => round($executionTime, 2),
                    'memory_usage' => memory_get_usage(true),
                    'peak_memory' => memory_get_peak_usage(true),
                    'files_processed' => count($processedFiles),
                    'variables_available' => count($gtreeData['gtree'][0]['project'][0]) - 1,
                ], $cacheService ? $cacheService->getHitStats() : []),
                'timestamp' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Ultimate Template Processing failed',
                'message' => $e->getMessage(),
                'template_id' => $templateId,
                'file' => basename($e->getFile()),
                'line' => $e->getLine(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    /**
     * 🌳 BUILD ULTIMATE GTREE
     *
     * Creates the most comprehensive gtree structure possible
     *
     * @param int|null $projectId Project ID
     * @param int $templateId Template ID
     * @param Template $template Template model
     * @param array|null $migrationFromVersions Per-schema migration versions {schemaId: versionNumber} (null = no migration)
     * @param string|null $tableName Table name for db_table_file types (null = project file)
     * @param int|null $schemaVersion Specific schema version to use (null = use latest)
     */
    public function buildUltimateGtree(?int $projectId, int $templateId, Template $template, $migrationFromVersions = null, ?string $tableName = null, $schemaVersion = null, ?array $schemaIds = null): array
    {
        // Load project and schema data
        $actualProject = $projectId ? Project::find($projectId) : null;
        $schemaTables = collect();
        $schemaDescription = ''; // Store schema description
        $schemaName = ''; // Store schema name
        $migrationData = null; // Will be populated if migration is requested
        $targetVersionId = null; // Track target version for migration comparison (can be specific or latest)

        // 🎯 WICHTIG: Migration-Daten nur für Project-Dateien einbinden, NICHT für DB-Tabellen-Dateien
        // Wenn $tableName gesetzt ist, handelt es sich um eine db_table_file → KEINE Migrations
        // Wenn $tableName NULL ist, handelt es sich um eine project_file → Migrations einbinden
        $isProjectFile = ($tableName === null);

        if ($actualProject) {
            // Get floating schemas linked to this project
            $linkedSchemasQuery = FloatingSchema::whereHas('projects', function ($query) use ($projectId) {
                $query->where('projects.id', $projectId);
            });
            // 🎯 Filter: Only include selected schemas (if specified by frontend)
            if (!empty($schemaIds)) {
                $linkedSchemasQuery->whereIn('id', $schemaIds);
            }
            $linkedSchemas = $linkedSchemasQuery->get();

            foreach ($linkedSchemas as $schema) {
                // Store first schema's name and description
                if (empty($schemaName) && !empty($schema->name)) {
                    $schemaName = $schema->name;
                }
                if (empty($schemaDescription) && !empty($schema->description)) {
                    $schemaDescription = $schema->description;
                }

                // 🎯 NEU: Lade entweder die spezifische Version oder die neueste
                $targetVersion = null;
                if ($schemaVersion !== null) {
                    // Spezifische Version wurde angefordert
                    $targetVersion = SchemaVersion::where('schema_id', $schema->id)
                        ->where('version_number', (int)$schemaVersion)
                        ->first();

                    if (!$targetVersion) {
                        // Fallback: Neueste Version, wenn spezifische nicht gefunden
                        \Log::warning("Schema version {$schemaVersion} not found, using latest");
                        $targetVersion = SchemaVersion::where('schema_id', $schema->id)
                            ->orderBy('id', 'desc')
                            ->first();
                    }
                } else {
                    // Keine spezifische Version → neueste verwenden
                    $targetVersion = SchemaVersion::where('schema_id', $schema->id)
                        ->orderBy('id', 'desc')
                        ->first();
                }

                if ($targetVersion) {
                    // Track target version for migration comparison
                    $targetVersionId = $targetVersion->id;

                    // 🚀 CACHE: Load schema tables from cache if available
                    $versionTables = $this->getCachedSchemaTables($targetVersion->id);
                    $schemaTables = $schemaTables->merge($versionTables);

                    // 📊 Build migration data if per-schema migration version is set
                    // 🎯 WICHTIG: NUR für Project-Dateien, NICHT für DB-Tabellen-Dateien!
                    // Migration = eine Datei pro Version, nicht pro Tabelle
                    if ($isProjectFile && $migrationFromVersions !== null && $targetVersionId !== null) {
                        // Per-schema migration version lookup
                        $schemaSpecificVersion = null;
                        if (is_array($migrationFromVersions)) {
                            $schemaSpecificVersion = $migrationFromVersions[(string)$schema->id] ?? $migrationFromVersions[$schema->id] ?? null;
                        }

                        if ($schemaSpecificVersion !== null) {
                            $fromVersion = SchemaVersion::where('schema_id', $schema->id)
                                ->where('version_number', (int)$schemaSpecificVersion)
                                ->first();

                            if ($fromVersion && $fromVersion->id !== $targetVersionId) {
                                $migrationData = $this->buildMigrationData($fromVersion, $targetVersion, $actualProject);
                            }
                        }
                    }
                }
            }
        }

        // Fallback to demo data
        if ($schemaTables->isEmpty()) {
            // 🚀 CACHE: Load demo schema tables from cache if available
            $schemaTables = $this->getCachedSchemaTables(1);

            // Also load schema name and description for demo data
            if (empty($schemaName) || empty($schemaDescription)) {
                $demoVersion = SchemaVersion::find(1);
                if ($demoVersion && $demoVersion->schema) {
                    if (empty($schemaName)) {
                        $schemaName = $demoVersion->schema->name ?? 'Demo Schema';
                    }
                    if (empty($schemaDescription)) {
                        $schemaDescription = $demoVersion->schema->description ?? 'Demo Database Schema';
                    }
                }
            }
        }

        // Load project-enabled languages in sort_order
        $enabledLanguageCodes = $actualProject ? ($actualProject->enabled_languages ?? []) : [];
        if (empty($enabledLanguageCodes)) {
            // Fallback: use project default_language, or 'en'
            $enabledLanguageCodes = [$actualProject->default_language ?? 'en'];
        }
        $languages = Language::where('is_active', true)
            ->whereIn('code', $enabledLanguageCodes)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        $selectedLanguageCode = request()->query('language_code', $actualProject->default_language ?? 'en');
        $selectedLanguageIndex = 0;

        // Find the index of the selected language
        foreach ($languages as $index => $language) {
            if ($language->code === $selectedLanguageCode) {
                $selectedLanguageIndex = $index;
                break;
            }
        }

        // Build ultimate project data
        $projectName = $actualProject ? $actualProject->name : 'ScorietDemo';
        $projectData = $this->buildUltimateProjectData($actualProject, $template, $templateId, $schemaDescription, $schemaName);

        // Add language information
        $projectData['selectedlanguage'] = $selectedLanguageCode;
        $projectData['selectedlanguageindex'] = $selectedLanguageIndex;

        // Load project translations (per-language captions, descriptions, locale)
        $projectTranslations = $actualProject
            ? \App\Models\ProjectTranslation::where('project_id', $actualProject->id)->get()->keyBy('language_code')
            : collect();
        $defaultLang = $actualProject->default_language ?? 'en';
        $defaultTranslation = $projectTranslations->get($defaultLang);
        $defaultCaption = $defaultTranslation->caption ?? ucwords(str_replace('_', ' ', $actualProject->name ?? 'ScorietDemo'));
        $defaultDescription = $defaultTranslation->description ?? ($actualProject->description ?? '');

        // Add languages array (using 'lang' for consistency with template syntax)
        $projectData['lang'] = $languages->map(function ($language, $index) use ($actualProject, $projectTranslations, $defaultCaption, $defaultDescription, $defaultTranslation) {
            $trans = $projectTranslations->get($language->code);
            // Fallback to default language translation, then project fields
            $fallback = $defaultTranslation;
            return [
                'id' => $language->id,
                'code' => $language->code,
                'name' => $language->name,
                'native_name' => $language->native_name,
                'flag' => $language->flag ?? '🏴',
                'index' => $index,
                // Translated project info (fallback: default language → project name)
                'caption' => $trans->caption ?? $defaultCaption,
                'filedescription' => $trans->description ?? $defaultDescription,
                // Locale settings (fallback: default language translation)
                'decimalsep' => $trans->decimal_separator ?? ($fallback->decimal_separator ?? ','),
                'thousandsep' => $trans->thousands_separator ?? ($fallback->thousands_separator ?? '.'),
                'dateformat' => $trans->date_format ?? ($fallback->date_format ?? 'd.m.Y'),
                'timeformat' => $trans->time_format ?? ($fallback->time_format ?? 'H:i:s'),
                'currencysym' => $trans->currency_symbol ?? ($fallback->currency_symbol ?? '€'),
                'timezone' => $trans->timezone ?? ($fallback->timezone ?? 'Europe/Vienna'),
            ];
        })->toArray();

        // Update language count
        $projectData['nmaxlanguages'] = $languages->count();

        // Override project-level locale + caption/description with selected language's translation
        $selectedTrans = $projectTranslations->get($selectedLanguageCode) ?? $defaultTranslation;
        if ($selectedTrans) {
            $projectData['decimal_separator'] = $selectedTrans->decimal_separator ?? $projectData['decimal_separator'];
            $projectData['thousands_separator'] = $selectedTrans->thousands_separator ?? $projectData['thousands_separator'];
            $projectData['date_format'] = $selectedTrans->date_format ?? $projectData['date_format'];
            $projectData['time_format'] = $selectedTrans->time_format ?? $projectData['time_format'];
            $projectData['currency_symbol'] = $selectedTrans->currency_symbol ?? $projectData['currency_symbol'];
            $projectData['timezone'] = $selectedTrans->timezone ?? $projectData['timezone'];
        }

        // Re-stamp generationdatetime in the resolved project timezone.
        // buildUltimateProjectData() initially formats it with the default Laravel
        // timezone (often UTC), which makes the stamp drift by 1-2h from the user's
        // expected wall-clock time. Now that we know the project's effective TZ
        // (from the selected language), redo the format with that.
        try {
            $projectData['generationdatetime'] = now()->setTimezone($projectData['timezone'])->format('Y-m-d H:i:s');
        } catch (\Exception $e) {
            // Bad timezone string in language settings — keep the UTC stamp rather than crash.
        }

        // {:projectcaption:} = translated project name (fallback: formatted project name)
        // {:projectdescription:} = translated description (fallback: project description)
        // {:projectname:} stays as the raw project name (e.g. "system_project")
        $projectData['projectcaption'] = $defaultCaption;
        $projectData['projectdescription'] = $defaultDescription;

        // Build ultimate table data with translations
        $projectData['tables'] = $this->buildUltimateTableDataWithTranslations($schemaTables, $projectId, $languages);

        // 🎯 Add Form Layout data per table.
        // FormSet resolution is now PER-TABLE: schema_tables.form_set_id can override
        // the project default. If a table has no own form_set_id, the project's
        // active ProjectFormSet is used as a fallback. ReportPattern (per-table)
        // is also resolved here for use by the report generator (Task b).
        $projectFormSet = $actualProject ? ProjectFormSet::getActiveForProject($actualProject->id) : null;
        $projectReportPattern = $actualProject ? \App\Models\ProjectReportPattern::getActiveForProject($actualProject->id) : null;

        // Per-request caches keyed by id. We hold the eager-loaded sub-trees so
        // toGTreeArray() etc. work without re-querying for every table.
        $formSetCache = [];
        if ($projectFormSet) {
            $formSetCache[$projectFormSet->id] = $projectFormSet;
        }
        $reportPatternCache = [];
        if ($projectReportPattern) {
            $reportPatternCache[$projectReportPattern->id] = $projectReportPattern;
        }

        $resolveFormSet = function (?int $id) use (&$formSetCache, $projectFormSet) {
            if ($id === null) {
                return $projectFormSet;
            }
            if (!array_key_exists($id, $formSetCache)) {
                $formSetCache[$id] = \App\Models\FormSet::with('windows.elements')->find($id) ?? $projectFormSet;
            }
            return $formSetCache[$id];
        };

        $resolveReportPattern = function (?int $id) use (&$reportPatternCache, $projectReportPattern) {
            if ($id === null) {
                return $projectReportPattern;
            }
            if (!array_key_exists($id, $reportPatternCache)) {
                $reportPatternCache[$id] = \App\Models\ReportPattern::with('forms.elements')->find($id) ?? $projectReportPattern;
            }
            return $reportPatternCache[$id];
        };

        foreach ($projectData['tables'] as &$tableData) {
            $tblName = $tableData['filename'] ?? '';
            $schemaTable = $schemaTables->firstWhere('table_name', $tblName);
            if (!$schemaTable) continue;

            // Track whether the table has its OWN assignment vs. inheriting from
            // the project default. The resolver returns the effective FormSet/
            // ReportPattern regardless (so layouts work), but templates often
            // need to know "is this a per-table customization, or did we just
            // fall through to the project default?" — exposed via the sentinel
            // `-1` for the *_id field in the fallback case (see below).
            $hasOwnFormSetId       = ($schemaTable->form_set_id !== null);
            $hasOwnReportPatternId = ($schemaTable->report_pattern_id !== null);

            $tableFormSet = $resolveFormSet($schemaTable->form_set_id);
            $tableReportPattern = $resolveReportPattern($schemaTable->report_pattern_id);

            $createEditWindow = $tableFormSet?->windows->firstWhere('window_type', 'create_edit');
            $dataTableWindow = $tableFormSet?->windows->firstWhere('window_type', 'data_table');
            $mainMenuWindow  = $tableFormSet?->windows->firstWhere('window_type', 'main_menu');

            // Expose FormSet provenance in a way the template can branch on,
            // WITHOUT lying about the id when the value is inherited.
            //
            //   - form_set_id        : EFFECTIVE id (real db id of whichever
            //                          FormSet is in play, table-owned OR
            //                          project-default-inherited). `-1` ONLY
            //                          when nothing exists anywhere.
            //   - form_set_name      : EFFECTIVE name; '' when nothing exists.
            //   - form_set_inherited : true when the table had no own
            //                          assignment and we fell back to the
            //                          project default. false when the table
            //                          owns it directly. null when no
            //                          FormSet at all (id will be -1).
            //
            // Templates that previously branched on `form_set_id eq -1` to
            // detect "inherited" need to switch to `form_set_inherited` —
            // the old sentinel hid the real id and made the name field
            // contradict it ("id=-1 but name='system_formset'"). The new
            // shape is self-consistent.
            if ($tableFormSet) {
                $tableData['form_set_id']        = $tableFormSet->id;
                $tableData['form_set_name']      = $tableFormSet->name;
                $tableData['form_set_inherited'] = !$hasOwnFormSetId;
            } else {
                $tableData['form_set_id']        = -1;
                $tableData['form_set_name']      = '';
                $tableData['form_set_inherited'] = null;
            }

            // Build field_name → index lookup from GTree fields array
            $fieldIndexMap = [];
            foreach (($tableData['fields'] ?? []) as $fi => $fd) {
                $fieldIndexMap[$fd['name'] ?? ''] = $fi;
            }

            // Create/Edit layout (single record form). Fields + buttons are merged
            // into one ordered array so the template can render them in true tab
            // order — buttons can sit anywhere in the sequence (between fields,
            // before, after) depending on the template's FormElement.tab_order.
            if ($createEditWindow) {
                $layouts = $this->getOrGenerateFormLayout($createEditWindow, $schemaTable, $selectedLanguageCode ?? null);
                foreach ($layouts as &$l) {
                    $l['field_index'] = $fieldIndexMap[$l['field_name'] ?? ''] ?? -1;
                }
                unset($l);

                $buttons = $this->getOrGenerateFormButtons($createEditWindow, $selectedLanguageCode ?? null, $tableFormSet);

                $merged = array_merge($layouts, $buttons);
                usort($merged, function ($a, $b) {
                    $ta = ($a['tab_order'] ?? 0) > 0 ? $a['tab_order'] : PHP_INT_MAX;
                    $tb = ($b['tab_order'] ?? 0) > 0 ? $b['tab_order'] : PHP_INT_MAX;
                    if ($ta !== $tb) return $ta <=> $tb;
                    return ($a['z_order'] ?? 0) <=> ($b['z_order'] ?? 0);
                });

                $tableData['layoutsingles'] = $merged;
                $tableData['nmaxlayoutsingles'] = count($merged);
                $tableData['layoutsinglecount'] = count($merged);
            }

            // Data Table layout (columns) — fields only.
            if ($dataTableWindow) {
                $layouts = $this->getOrGenerateFormLayout($dataTableWindow, $schemaTable, $selectedLanguageCode ?? null);
                foreach ($layouts as &$l) {
                    $l['field_index'] = $fieldIndexMap[$l['field_name'] ?? ''] ?? -1;
                }
                unset($l);
                $tableData['layoutcolumns'] = $layouts;
                $tableData['nmaxlayoutcolumns'] = count($layouts);
            }

            // ── Per-table FORM WINDOW DESIGNS ──────────────────────────────
            // Mirror the ReportPattern shape: emit each window's design template
            // (the Vorlage — container, named buttons, colors, dimensions) per
            // table, from the table's EFFECTIVE FormSet. Accessed via the
            // self-describing constructs {:formmenu.*:} / {:formedit.*:} /
            // {:formtable.*:} (analogous to {:reportsingle.*:}/{:reportlist.*:}).
            // The per-table field/button PLACEMENTS stay in layoutsingles/
            // layoutcolumns (above). This replaces the old global, file-marker-
            // driven formset.windows[form_window_type-1] access.
            // Each window object already carries .nmaxelements + .elements +
            // direct-access-by-type (button_save, container, …) from
            // FormWindow::toGTreeArray(), so {:formedit.nmaxelements:},
            // {:formedit.button_save.label:} etc. work without extra fields.
            if ($mainMenuWindow) {
                $tableData['formmenu'] = $mainMenuWindow->toGTreeArray();
            }
            if ($createEditWindow) {
                $tableData['formedit'] = $createEditWindow->toGTreeArray();
            }
            if ($dataTableWindow) {
                $tableData['formtable'] = $dataTableWindow->toGTreeArray();
            }

            // ── ReportPattern integration ──────────────────────────────────
            // Mirrors the FormSet pipeline: the design template (Vorlage) and
            // the per-table layout are emitted as two separate sub-trees.
            //   - reportsingle / reportlist        → the design template (form)
            //   - layoutreportsingles / lists      → per-table placement loop
            // If no saved ReportLayoutElement rows exist for (form, table),
            // the placements are auto-generated transiently via
            // ReportLayoutElement::computeAutoPlacements() — no DB writes.
            if ($tableReportPattern) {
                // Same shape as form_set_id above — id is always the real
                // effective id, never a sentinel for "inherited". Use the
                // report_pattern_inherited flag to detect provenance.
                $tableData['report_pattern_id']        = $tableReportPattern->id;
                $tableData['report_pattern_name']      = $tableReportPattern->name;
                $tableData['report_pattern_inherited'] = !$hasOwnReportPatternId;

                $singleForm = $tableReportPattern->forms->firstWhere('form_type', 'report_single');
                $listForm   = $tableReportPattern->forms->firstWhere('form_type', 'report_list');

                if ($singleForm) {
                    $tableData['reportsingle']             = $singleForm->toGTreeArray();
                    $tableData['nmaxreportsingleelements'] = $tableData['reportsingle']['nmaxelements'] ?? 0;

                    $layout = $this->getOrGenerateReportLayout($singleForm, $schemaTable, $selectedLanguageCode ?? null);
                    foreach ($layout as &$l) {
                        $l['field_index'] = $fieldIndexMap[$l['field_name'] ?? ''] ?? -1;
                    }
                    unset($l);
                    $tableData['layoutreportsingles']    = $layout;
                    $tableData['nmaxlayoutreportsingle'] = count($layout);
                }

                if ($listForm) {
                    $tableData['reportlist']             = $listForm->toGTreeArray();
                    $tableData['nmaxreportlistelements'] = $tableData['reportlist']['nmaxelements'] ?? 0;

                    $layout = $this->getOrGenerateReportLayout($listForm, $schemaTable, $selectedLanguageCode ?? null);
                    foreach ($layout as &$l) {
                        $l['field_index'] = $fieldIndexMap[$l['field_name'] ?? ''] ?? -1;
                    }
                    unset($l);
                    $tableData['layoutreportlists']    = $layout;
                    $tableData['nmaxlayoutreportlist'] = count($layout);
                }
            } else {
                // No ReportPattern at all (neither own nor project-default).
                // Surface the explicit "nothing" shape so templates don't see
                // a stale FormSet-style fallback name (e.g. "system_report_2"
                // from some other project's default).
                $tableData['report_pattern_id']        = -1;
                $tableData['report_pattern_name']      = '';
                $tableData['report_pattern_inherited'] = null;
            }
        }
        unset($tableData);

        // Build tablesgen: index array into tables[] for {:for nmaxtables:} iteration.
        // Only full/code_only tables are iterated — template_only, reference_only
        // and excluded tables stay in tables[] (for name/FK lookup) but are
        // skipped from the loop via this indirection. Same pattern as
        // fieldsnokey / fieldsnoblob at the field level.
        //
        // Engine emits:
        //   for (let _tgenI = 0; _tgenI < nmaxtables; _tgenI++) {
        //     const tableIdx = tablesgen[_tgenI];
        //     // body references tables[tableIdx] as before — no template changes needed.
        //   }
        $tablesgen = [];
        foreach ($projectData['tables'] as $idx => $t) {
            $mode = $t['generation_mode'] ?? 'full';
            if (in_array($mode, ['full', 'code_only'])) {
                $tablesgen[] = $idx;
            }
        }
        $projectData['tablesgen'] = $tablesgen;
        $projectData['nmaxtables'] = count($tablesgen);

        // 📊 Add migration data if available
        if ($migrationData !== null) {
            $projectData['migration'] = $migrationData;
            // Also add convenience count variables at project level
            $projectData['nmaxmigration_tables'] = count($migrationData['tables']);
            $projectData['nmaxmigration_fields'] = count($migrationData['fields']);
            $projectData['nmaxmigration_indexes'] = count($migrationData['indexes']);
            $projectData['nmaxmigration_foreignkeys'] = count($migrationData['foreignKeys']);
            $projectData['nmaxmigration_total'] = $migrationData['nmaxmigration_total'];
        } else {
            // Default empty migration data
            $projectData['migration'] = [
                'enabled' => false,
                'from_version' => 0,
                'to_version' => 0,
                'dialect' => '',
                'tables' => [],
                'fields' => [],
                'indexes' => [],
                'foreignKeys' => [],
                'nmaxmigration_tables' => 0,
                'nmaxmigration_fields' => 0,
                'nmaxmigration_indexes' => 0,
                'nmaxmigration_foreignkeys' => 0,
                'nmaxmigration_total' => 0,
                'sql_complete' => '',
            ];
            $projectData['nmaxmigration_tables'] = 0;
            $projectData['nmaxmigration_fields'] = 0;
            $projectData['nmaxmigration_indexes'] = 0;
            $projectData['nmaxmigration_foreignkeys'] = 0;
            $projectData['nmaxmigration_total'] = 0;
        }

        // 🎨 Add FormSet data if available
        if ($actualProject) {
            $formSet = ProjectFormSet::getActiveForProject($actualProject->id);
            if ($formSet) {
                $projectData['formset'] = $formSet->toGTreeArray();
                $projectData['nmaxformsets'] = 1;
                $projectData['nmaxwindows'] = $formSet->windows->count();

                // Add individual window types as direct references for easier access
                foreach ($formSet->windows as $window) {
                    $windowKey = 'window_' . $window->window_type;
                    $projectData[$windowKey] = $window->toGTreeArray();
                }

                error_log("🎨 FormSet Debug: Loaded FormSet '{$formSet->name}' with {$formSet->windows->count()} windows");
            } else {
                // Default empty FormSet data
                $projectData['formset'] = null;
                $projectData['nmaxformsets'] = 0;
                $projectData['nmaxwindows'] = 0;
                error_log("🎨 FormSet Debug: No FormSet linked to project");
            }
        } else {
            // No project - no FormSet
            $projectData['formset'] = null;
            $projectData['nmaxformsets'] = 0;
            $projectData['nmaxwindows'] = 0;
        }

        // Create gtree structure
        $gtree = [
            [
                'project' => [$projectData]
            ]
        ];

        return [
            'gtree' => $gtree,
            'metadata' => [
                'version' => '2.0.0',
                'engine' => 'Ultimate Scoriet Template Engine',
                'project_variables' => count($projectData) - 1, // Minus tables
                'tables_count' => count($projectData['tables']),
                'total_fields' => array_sum(array_column($projectData['tables'], 'nmaxitems')),
                'formset_linked' => isset($projectData['formset']) && $projectData['formset'] !== null,
                'formset_windows' => $projectData['nmaxwindows'] ?? 0,
                'features' => [
                    'enhanced_naming_conventions' => true,
                    'extended_metadata' => true,
                    'multiple_data_types' => true,
                    'generation_context' => true,
                    'template_helpers' => true,
                    'form_designer' => true,
                ],
                'generated_at' => now()->toISOString(),
            ]
        ];
    }

    /**
     * Get schema tables from cache or database
     * Caches the complete schema table data with all relationships for fast access
     *
     * @param int $schemaVersionId
     * @return \Illuminate\Support\Collection
     */
    private function getCachedSchemaTables(int $schemaVersionId)
    {
        $cacheKey = "schema_tables:{$schemaVersionId}";
        $ttl = now()->addHours(24);

        return Cache::remember($cacheKey, $ttl, function() use ($schemaVersionId) {
            return SchemaTable::where('schema_version_id', $schemaVersionId)
                ->with([
                    'floatingSchema', // 🔗 Load schema info for database name
                    'fields' => function($query) {
                        $query->orderBy('field_order');
                    },
                    'constraints.constraintColumns.field' // 🎯 Load nested relationships for constraint columns
                ])
                ->get();
        });
    }

    /**
     * 🏗️ BUILD ULTIMATE PROJECT DATA
     */
    private function buildUltimateProjectData(?Project $actualProject, Template $template, int $templateId, string $schemaDescription = '', string $schemaName = ''): array
    {
        $projectName = $actualProject ? $actualProject->name : 'ScorietDemo';
        $languageCode = request()->query('language_code', 'en'); // Get current language

        // 🎯 Load Custom Template Variables and their values
        $customVariables = [];

        // Load template variables defined by template developer
        $templateVariables = \App\Models\TemplateVariable::where('template_id', $templateId)->get();

        foreach ($templateVariables as $templateVar) {
            $variableName = $templateVar->variable_name;
            $defaultValue = $templateVar->default_value ?? '';

            // Try to get project-specific value for this language
            $projectValue = null;
            if ($actualProject) {
                $projectVarValue = \App\Models\ProjectTemplateVariableValue::where('project_id', $actualProject->id)
                    ->where('template_id', $templateId)
                    ->where('variable_name', $variableName)
                    ->where('language', $languageCode)
                    ->first();

                if ($projectVarValue && !empty($projectVarValue->value)) {
                    $projectValue = $projectVarValue->value;
                }
            }

            // Use project value if set, otherwise use default value
            $customVariables[$variableName] = $projectValue ?? $defaultValue;
        }

        $projectData = [
            // === BASIC PROJECT INFO ===
            'projectname' => $projectName,
            'projectid' => $actualProject ? $actualProject->id : 1,

            // === ENHANCED PROJECT METADATA ===
            'projectcreated' => $actualProject ? $actualProject->created_at->format('Y-m-d H:i:s') : now()->format('Y-m-d H:i:s'),
            'projectupdated' => $actualProject ? $actualProject->updated_at->format('Y-m-d H:i:s') : now()->format('Y-m-d H:i:s'),
            'projectowner' => $actualProject ? ($actualProject->owner->name ?? 'Unknown') : 'Demo User',
            'projectowneremail' => $actualProject ? ($actualProject->owner->email ?? '') : 'demo@scoriet.com',
            'projectdescription' => $actualProject ? ($actualProject->description ?? '') : 'Demo Scoriet Project',

            // === DATABASE CONNECTION ===
            'projectdatabase' => $actualProject ? ($actualProject->database_name ?? $projectName . '_db') : 'scoriet_demo',
            'projectdbid' => $actualProject ? $actualProject->id : 1, // Same as projectid for now
            'projectdbtype' => $actualProject ? ($actualProject->database_type ?? 'MySQL') : 'MySQL',
            'projectdbname' => $schemaName ?: 'Demo Schema', // 🔗 First linked schema name
            'projectdbdesc' => $schemaDescription ?: 'Demo Database Schema', // Use schema description, not project description
            'projectdbversion' => '1', // Project DB Version (for %14 in filename; %9 is now the project name)
            'projectdbpassword' => $actualProject ? ($actualProject->database_password ?? '') : '',
            'projectdbusername' => $actualProject ? ($actualProject->database_username ?? 'root') : 'root',
            'projectdbserver' => $actualProject ? ($actualProject->database_server ?? '127.0.0.1') : '127.0.0.1',
            'projectdbport' => $actualProject ? ($actualProject->database_port ?? '3306') : '3306',

            // === PATHS AND URLS ===
            'projectdirectory' => $actualProject ? ($actualProject->project_directory ?? 'C:\\Users\\Public\\Documents\\' . $projectName) : 'C:\\Users\\Public\\Documents\\ScorietDemo',
            'projecturl' => $actualProject ? ($actualProject->project_url ?? 'http://localhost/' . strtolower($projectName)) : 'http://localhost/scorietdemo',
            'startpage' => $actualProject ? ($actualProject->start_page ?? 'index.php') : 'index.php',

            // === TEMPLATE INFO ===
            'templateid' => $templateId,
            'templatename' => $template->name,
            'templatecategory' => $template->category ?? 'General',
            'templatedescription' => $template->description ?? '',
            'templatetags' => $template->tags ?? [],
            // Per-file template metadata. These get overwritten with real
            // values during processTemplateFile() (see ~line 2043), but we
            // initialize them here so templates referenced outside that
            // per-file context (preview, project-level generation) get an
            // empty string instead of an `undefined` placeholder.
            'templatefolder' => '',
            'templatepage' => '',
            'templatepagename' => '',
            'templatefilepath' => '',
            'templateoutputpath' => '',

            // === GENERATION CONTEXT ===
            'generationdatetime' => now()->format('Y-m-d H:i:s'),
            'generationuser' => auth()->user() ? auth()->user()->name : 'System',
            'scorietversion' => '1.0.0.3',
            'laravelversion' => app()->version(),

            // === LOCALIZATION SETTINGS (overridden later from project_translations) ===
            'decimal_separator' => ',',
            'thousands_separator' => '.',
            'date_format' => 'd.m.Y',
            'time_format' => 'H:i:s',
            'currency_symbol' => '€',
            'timezone' => 'Europe/Vienna',

            // === COUNTS (will be updated after table processing) ===
            'nmaxtables' => 0,
            'nmaxlanguages' => 1,

            // Tables will be added separately
            'tables' => []
        ];

        // 🎯 Inject Custom Template Variables into project data
        // This allows templates to access variables as {variablename}
        foreach ($customVariables as $varName => $varValue) {
            $projectData[$varName] = $varValue;
        }

        return $projectData;
    }

    /**
     * Load per-project ReportPatternFieldAssignment records for the ACTIVE
     * ReportPattern of the project, keyed by schema_field_id for fast lookup.
     *
     * Returns an empty array when:
     *   - no project context is available
     *   - the project has no active report pattern
     *   - the active pattern has no assignments yet
     */
    private function loadReportPatternAssignmentsForProject(?int $projectId): array
    {
        if (!$projectId) {
            return [];
        }

        $activePattern = \App\Models\ProjectReportPattern::getActiveForProject($projectId);
        if (!$activePattern) {
            return [];
        }

        return \App\Models\ReportPatternFieldAssignment::where('report_pattern_id', $activePattern->id)
            ->get()
            ->keyBy('schema_field_id')
            ->map(fn($a) => [
                'visibility_state' => $a->visibility_state,
                'sort_order' => $a->sort_order,
                'report_pattern_id' => $a->report_pattern_id,
            ])
            ->toArray();
    }

    /**
     * 🗄️ BUILD ULTIMATE TABLE DATA
     */
    private function buildUltimateTableData($schemaTables, ?int $projectId): array
    {
        $tables = [];

        // All tables (regardless of generation_mode) stay in gtree.tables[] so
        // templates can still resolve foreign-key targets and reference data by
        // name or index. The caller builds a `tablesgen` index array over this
        // to drive {:for nmaxtables:} iteration — same indirection pattern as
        // fieldsnokey/fieldsnoblob at the field level.
        $schemaTables = collect($schemaTables)->values();

        // 🎯 Preload per-project report-pattern field assignments.
        // If the project has an active ReportPattern, its visibility assignments
        // are applied as a GLOBAL overlay on field metadata (report_visible /
        // report_visibility_state), parallel to the per-template-file form overlay
        // but applied at gtree-build time because reports are not tied to a single
        // template file — they're project-wide.
        $reportAssignments = $this->loadReportPatternAssignmentsForProject($projectId);

        foreach ($schemaTables as $tableIndex => $table) {
            // All fields (incl. excluded/reference_only/template_only) stay in
            // the mapped fields[] array — iteration is driven by fieldsgen[]
            // built below, same indirection pattern as tablesgen[].
            $fields = $table->fields->values();
            $constraints = $table->constraints;
            $tableName = $table->table_name;

            // 🎯 Find primary key field name from constraints
            $primaryKeyConstraint = $constraints
                ->where('constraint_type', 'PRIMARY KEY')
                ->first();
            $primaryKeyFieldName = null;
            if ($primaryKeyConstraint) {
                $firstColumn = $primaryKeyConstraint->constraintColumns->first();
                $primaryKeyFieldName = $firstColumn ? $firstColumn->field_name : null;
            }

            // Fallback: If no PK found in constraints, look for field ending with _id
            if (!$primaryKeyFieldName) {
                // Try: first field ending with _id (most common pattern)
                $pkField = $fields->first(function($field) {
                    return str_ends_with($field->field_name, '_id');
                });

                // Second fallback: just 'id'
                if (!$pkField) {
                    $pkField = $fields->firstWhere('field_name', 'id');
                }

                $primaryKeyFieldName = $pkField ? $pkField->field_name : null;

                \Log::warning("PK not found in constraints for {$tableName}, using fallback: " . ($primaryKeyFieldName ?? 'NONE'));
            }

            // 🎯 Build lists of fields with UNIQUE and INDEX constraints
            $uniqueFields = $constraints
                ->where('constraint_type', 'UNIQUE')
                ->map(function($constraint) {
                    $firstColumn = $constraint->constraintColumns->first();
                    return $firstColumn ? $firstColumn->field_name : null;
                })
                ->filter()
                ->values() // 🎯 Re-index array to 0,1,2... instead of keeping original keys
                ->toArray();

            $indexFields = $constraints
                ->whereIn('constraint_type', ['INDEX', 'KEY'])
                ->map(function($constraint) {
                    $firstColumn = $constraint->constraintColumns->first();
                    return $firstColumn ? $firstColumn->field_name : null;
                })
                ->filter()
                ->values() // 🎯 Re-index array to 0,1,2... instead of keeping original keys
                ->toArray();

            // Enhanced field mapping
            $mappedFields = $fields->map(function($field, $index) use ($tableName, $projectId, $primaryKeyFieldName, $uniqueFields, $indexFields) {
                $fieldName = $field->field_name;

                return [
                    // Core field info
                    'name' => $fieldName,
                    'pascalcase' => str_replace('_', '', ucwords($fieldName, '_')), // PascalCase (e.g. ProdNo)
                    'camelcase' => lcfirst(str_replace('_', '', ucwords($fieldName, '_'))), // camelCase (e.g. prodNo)
                    'type' => strtoupper($field->field_type),
                    'schema_field_id' => $field->id, // For per-file assignment lookup

                    // Enhanced metadata — controltype was previously hardcoded to
                    // the magic number 24 (legacy WinDev mapping). Now the actual
                    // SchemaField.control_type string ('TEXT', 'COMBOBOX', 'SLIDER',
                    // ...) is exposed so templates can branch on it directly:
                    //   {:if item.controltype eq "COMBOBOX":}...{:endif:}
                    'controltype' => $field->control_type ?? 'TEXT',
                    'typecast' => $this->getPhpTypecast($field->field_type),
                    'phptype' => $this->getPhpType($field->field_type),
                    'jstype' => $this->getJsType($field->field_type),
                    'laraveltype' => $this->getLaravelType($field->field_type),
                    'notnull' => !$field->is_nullable,
                    'order' => $field->field_order,
                    'id' => $index + 1,
                    // Structured type metadata — preferred for templates.
                    // size = field_length when set; falls back to legacy string parsing.
                    'size' => $field->field_length ?? $this->extractFieldSize($field->field_type),
                    'precision' => $field->field_precision,
                    'scale' => $field->field_scale,
                    'enum_values' => $field->field_enum_values, // array (Eloquent cast) or null
                    // MySQL GENERATED ALWAYS AS (expression) STORED|VIRTUAL — templates use these
                    // to skip setters / mark columns read-only / reproduce the expression.
                    'is_generated' => (bool) ($field->is_generated ?? false),
                    'generation_expression' => $field->generation_expression,
                    'generation_storage' => $field->generation_storage,
                    'caption' => ucwords(str_replace('_', ' ', $fieldName)),
                    'default' => $field->default_value ?? '',

                    // Boolean flags - 🎯 Read from database (set during SQL import)
                    'isprimary' => $field->is_primary_key ?? false,
                    'isunique' => $field->is_unique ?? false, // 🎯 PRIMARY KEY and UNIQUE constraints
                    'isindex' => $field->is_index ?? false, // 🎯 INDEX/KEY constraints
                    'isforeign' => str_ends_with($fieldName, '_id') && !($field->is_primary_key ?? false),
                    'istimestamp' => in_array($fieldName, ['created_at', 'updated_at', 'deleted_at']),
                    'autoincrement' => $field->is_auto_increment ?? false, // 🎯 Read from database
                    'isblob' => $this->isBlobType($field->field_type), // 🎯 BLOB/TEXT large field detection
                    'isbinaryblob' => $this->isBinaryBlobType($field->field_type), // 🎯 Binary BLOB only (no TEXT)
                    // Default visibility comes from the global schema display_state.
                    // Per-file TemplateFileFieldAssignment overrides this below.
                    'visible' => !in_array(($field->display_state ?? 'enabled'), ['invisible', 'excluded']),

                    // 🎯 LINK FIELDS - For ComboBox, ListBox, RadioButtons, etc.
                    'linktable' => $field->link_table ?? '',
                    'linkfield' => $field->link_field ?? '',
                    'linkdisplayfield' => $field->link_display_field ?? '',
                    'linkorderfield' => $field->link_order_field ?? '',
                    'linkorder' => $field->link_order_direction ?? '',

                    // Context
                    'filename' => $tableName,
                    'projectid' => $projectId ?? 1,

                    // Generation state metadata — user JS in {:code:} blocks can read these
                    'state' => $field->display_state ?? 'enabled',
                    'generation_mode' => $field->generation_mode ?? 'full',
                    'in_iteration' => in_array(($field->generation_mode ?? 'full'), ['full', 'code_only']),
                    'generates_files' => in_array(($field->generation_mode ?? 'full'), ['full', 'template_only']),

                    // Report-pattern assignment overlay (active pattern of the project).
                    // report_visibility_state comes from the assignment when present,
                    // otherwise falls back to 'visible'. report_visible is the derived
                    // boolean so report templates can write {:if item.report_visible:}.
                    'report_visibility_state' => $reportAssignments[$field->id]['visibility_state'] ?? 'visible',
                    'report_visible' => !in_array(
                        $reportAssignments[$field->id]['visibility_state'] ?? 'visible',
                        ['invisible', 'not_available']
                    ),
                    'report_sort_order' => $reportAssignments[$field->id]['sort_order'] ?? null,

                    // Audit + version metadata — exposed so templates can stamp
                    // generated files with the per-field history, e.g.:
                    //   // {:item.name:} v{:item.version:} updated {:item.updated_at:} by {:item.updated_by_username:}
                    // Dates are formatted Y-m-d (same convention as the SQL-COMMENT
                    // JSON codec — single source of truth for human-readable audit).
                    'version' => (int) ($field->version ?? 1),
                    'created_at' => $field->created_at?->format('Y-m-d'),
                    'updated_at' => $field->updated_at?->format('Y-m-d'),
                    'created_by_username' => $field->created_by_username ?? 'system',
                    'updated_by_username' => $field->updated_by_username ?? 'system',
                ];
            })->toArray();

            // 🎯 Create INDEX-BASED filtered field arrays (lightweight references into fields[])
            // Resolve file-key fields (supports composite keys like "field1,field2")
            // Use ?: (Elvis) instead of ?? to also catch empty strings "" (ProjectImportService stores "" as default)
            $fileKeyName = $table->filekeyname ?: ($primaryKeyFieldName ?: 'id');
            $fileKeyNames = $this->resolveSearchKeyFields($table, $fields, $primaryKeyFieldName);

            $fieldsNoKeyIndices = [];
            $fieldsNoKeyAllIndices = [];
            $fieldsNoBlobIndices = [];
            $fieldsNoBlobAllIndices = [];
            $fieldsNoBinaryBlobIndices = [];
            $fieldsNoBinaryBlobAllIndices = [];
            $fieldsSearchKeyIndices = [];
            // fieldsgen drives {:for nmaxitems:} via indirection — only fields
            // with mode full/code_only iterate; template_only, reference_only
            // and excluded fields remain in fields[] (for lookup) but are
            // skipped from ALL iteration subsets below.
            $fieldsGenIndices = [];
            foreach ($mappedFields as $index => $field) {
                $mode = $field['generation_mode'] ?? 'full';
                $isIterable = in_array($mode, ['full', 'code_only']);

                // Non-iterable fields (template_only, reference_only, excluded)
                // never appear in any iteration index array.
                if (!$isIterable) {
                    continue;
                }

                $fieldsGenIndices[] = $index;

                $isKey = $field['isprimary'] || in_array($field['name'], $fileKeyNames);

                if (!$isKey) {
                    // Both fieldsnokey and fieldsnokeyall exclude PK + file-keys
                    // Difference only matters after assignment overlay in processTemplateFile
                    $fieldsNoKeyIndices[] = $index;
                    $fieldsNoKeyAllIndices[] = $index;
                }
                if (!$field['isblob']) {
                    $fieldsNoBlobIndices[] = $index;
                    $fieldsNoBlobAllIndices[] = $index;
                }
                if (!$field['isbinaryblob']) {
                    $fieldsNoBinaryBlobIndices[] = $index;
                    $fieldsNoBinaryBlobAllIndices[] = $index;
                }
                // fieldssearchkeys: indices of the file-key fields (for {:for nmaxsearchkeys:} loop)
                if (in_array($field['name'], $fileKeyNames)) {
                    $fieldsSearchKeyIndices[] = $index;
                }
            }

            // Enhanced constraint mapping (ALL constraints)
            $mappedConstraints = $constraints->map(function($constraint, $index) use ($fields) {
                // Get first column's field name
                $firstColumn = $constraint->constraintColumns->first();
                $columnName = $firstColumn ? $firstColumn->field_name : '';

                $constraintType = $constraint->constraint_type ?? 'INDEX';
                $isPrimary = $constraintType === 'PRIMARY KEY';
                $isUnique = $constraintType === 'UNIQUE';
                $isIndex = in_array($constraintType, ['INDEX', 'KEY']);

                // 🎯 Look up field information for this constraint's column
                $field = $fields->firstWhere('field_name', $columnName);
                $fieldType = $field ? strtoupper($field->field_type) : 'UNKNOWN';
                $typecast = $field ? $this->getPhpTypecast($field->field_type) : 'string';

                return [
                    'name' => $columnName, // 🎯 CHANGED: Use field name (for {keys.name} in templates)
                    'constraintname' => $constraint->constraint_name ?? 'key_' . ($index + 1), // Original constraint name
                    'id' => $index + 1,
                    'column' => $columnName, // Field name (kept for compatibility)
                    'type' => $fieldType, // 🎯 CHANGED: Field type like VARCHAR, INT (for {keys.type} in templates)
                    'constrainttype' => $constraintType, // Original constraint type
                    'typecast' => $typecast, // 🎯 NEW: PHP typecast (for {keys.typecast} in templates)
                    'isprimary' => $isPrimary,
                    'isforeign' => $constraintType === 'FOREIGN KEY',
                    'isunique' => $isPrimary || $isUnique, // 🎯 PRIMARY is always unique!
                    'isindex' => $isIndex, // 🎯 INDEX or KEY constraint
                ];
            })->toArray();

            // 🎯 Keys array = PRIMARY + UNIQUE only (excluding FOREIGN)
            $mappedKeys = collect($mappedConstraints)->filter(function($constraint) {
                return $constraint['isprimary'] || $constraint['isunique'];
            })->values()->toArray();

            // 🎯 Foreign Keys array = FOREIGN KEY constraints with reference information
            $mappedForeignKeys = $constraints->where('constraint_type', 'FOREIGN KEY')->map(function($constraint) use ($fields) {
                // Get first column's field name
                $firstColumn = $constraint->constraintColumns->first();
                $columnName = $firstColumn ? $firstColumn->field_name : '';

                // Look up field information for this foreign key's column
                $field = $fields->firstWhere('field_name', $columnName);
                $fieldType = $field ? strtoupper($field->field_type) : 'UNKNOWN';
                $typecast = $field ? $this->getPhpTypecast($field->field_type) : 'string';

                // Get foreign key reference information
                $reference = $constraint->foreignKeyReference;
                $referencedTableName = $reference ? $reference->referencedTable->table_name : '';

                // Get referenced column name from referenceColumns → referencedField relation
                $referencedColumn = '';
                if ($reference && $reference->referenceColumns->isNotEmpty()) {
                    $refCol = $reference->referenceColumns->first();
                    $referencedColumn = $refCol->referencedField ? $refCol->referencedField->field_name : '';
                }

                return [
                    'name' => $columnName, // Field name (e.g., 'user_id')
                    'id' => $constraint->id, // Real database ID
                    'type' => $fieldType, // Field type (e.g., 'BIGINT')
                    'typecast' => $typecast, // PHP typecast (e.g., 'int')
                    'constraintname' => $constraint->constraint_name ?? 'fk_' . $constraint->id,
                    'referencedtable' => $referencedTableName, // Referenced table name (e.g., 'prod_group')
                    'referencedtablepascalcase' => str_replace('_', '', ucwords($referencedTableName, '_')), // PascalCase (e.g., 'ProdGroup')
                    'referencedtablecamelcase' => lcfirst(str_replace('_', '', ucwords($referencedTableName, '_'))), // camelCase (e.g., 'prodGroup')
                    'referencedcolumn' => $referencedColumn, // Referenced column (e.g., 'id')
                    'referencedfield' => $referencedColumn,  // Alias — naming parity with `linkfield` on lookup-style fields. Templates may use either.
                    'ondelete' => $reference->on_delete ?? 'NO ACTION', // ON DELETE action
                    'onupdate' => $reference->on_update ?? 'NO ACTION', // ON UPDATE action
                ];
            })->values()->toArray();

            // 🎯 Deduplicated Foreign Keys — unique by referencedtable (first FK
            // per referenced table wins). Mirrors the WithTranslations variant —
            // was previously missing here, which left $mappedForeignKeysUnique
            // undefined and crashed any call into this method.
            $seenReferencedTables = [];
            $mappedForeignKeysUnique = [];
            foreach ($mappedForeignKeys as $fk) {
                $refTable = $fk['referencedtable'];
                if (!isset($seenReferencedTables[$refTable])) {
                    $seenReferencedTables[$refTable] = true;
                    $mappedForeignKeysUnique[] = $fk;
                }
            }

            $tables[] = [
                // Basic table info
                'filename' => $tableName,
                'filecamelcase' => lcfirst(str_replace('_', '', ucwords(strtolower($tableName), '_'))), // camelCase (e.g. contactMethods)
                'filepascalcase' => str_replace('_', '', ucwords(strtolower($tableName), '_')), // PascalCase (e.g. ContactMethods)
                'filenameshort' => $table->file_name_short ?? substr($tableName, 0, 2), // Use DB field or fallback
                'filenamerenamed' => $table->file_name_renamed ?? '', // {:filenamerenamed:}
                'fileid' => $table->id ?? $tableIndex,

                // Singular name: user-defined or auto-guessed
                'filesingular' => $table->singular_name ?: $this->guessEnglishSingular($tableName),
                'filesingularpascalcase' => str_replace('_', '', ucwords(strtolower($table->singular_name ?: $this->guessEnglishSingular($tableName)), '_')),
                'filesingularcamelcase' => lcfirst(str_replace('_', '', ucwords(strtolower($table->singular_name ?: $this->guessEnglishSingular($tableName)), '_'))),

                // Counts — iteration counts derived from fieldsgen (the index
                // array of iterable fields). fields[] keeps ALL fields for
                // name/FK lookup; {:for nmaxitems:} walks fields[fieldsgen[i]].
                'nmaxitems' => count($fieldsGenIndices),
                'nmaxfields' => count($fieldsGenIndices),
                'nmaxitemsnokey' => count($fieldsNoKeyIndices),
                'nmaxitemsnokeyall' => count($fieldsNoKeyAllIndices),
                'nmaxitemsnoblob' => count($fieldsNoBlobIndices), // 🎯 Fields without BLOB/TEXT types
                'nmaxitemsnobloball' => count($fieldsNoBlobAllIndices), // 🎯 All fields without BLOB/TEXT (ignores assignments)
                'nmaxitemsnobinaryblob' => count($fieldsNoBinaryBlobIndices), // 🎯 Fields without binary BLOB types
                'nmaxitemsnobinarybloball' => count($fieldsNoBinaryBlobAllIndices), // 🎯 All fields without binary BLOB (ignores assignments)
                'nmaxkeys' => count($mappedKeys), // PRIMARY + UNIQUE only (not FOREIGN)
                'nmaxconstraints' => count($mappedConstraints), // ALL constraints (PRIMARY + UNIQUE + INDEX/KEY + FOREIGN)
                'nmaxforeignkeys' => $constraints->where('constraint_type', 'FOREIGN KEY')->count(),
                'nmaxforeignkeysunique' => count($mappedForeignKeysUnique),
                'nmaxsearchkeys' => $this->calculateSearchKeysCount($table, $fields, $primaryKeyFieldName),

                // Master-detail (placeholder - implement when needed)
                'nmaxitemsmasterdetail' => 0,
                'nmaxitemsmasterdetailnokeys' => 0,
                'filegeneratemasterdetail' => false,
                'filedetailfileid' => null,
                'filedetailfilename' => null,
                'filedetailkey' => null,

                // Data arrays
                'fields' => $mappedFields,
                'fieldsgen' => $fieldsGenIndices, // 🎯 Index array for {:for nmaxitems:} indirection
                'fieldsnokey' => $fieldsNoKeyIndices, // 🎯 Index array → fields[fieldsnokey[i]]
                'fieldsnokeyall' => $fieldsNoKeyAllIndices, // 🎯 Index array → fields[fieldsnokeyall[i]]
                'fieldsnoblob' => $fieldsNoBlobIndices, // 🎯 Index array → fields[fieldsnoblob[i]]
                'fieldsnobloball' => $fieldsNoBlobAllIndices, // 🎯 All non-BLOB fields (ignores assignments)
                'fieldsnobinaryblob' => $fieldsNoBinaryBlobIndices, // 🎯 Index array → fields without binary BLOB
                'fieldsnobinarybloball' => $fieldsNoBinaryBlobAllIndices, // 🎯 All non-binary-BLOB fields (ignores assignments)
                'fieldssearchkeys' => $fieldsSearchKeyIndices, // 🎯 Index array → fields[fieldssearchkeys[i]] (file-key fields)
                'keys' => $mappedKeys, // PRIMARY + UNIQUE keys only
                'foreignkeys' => $mappedForeignKeys, // 🎯 FOREIGN KEY constraints with reference info
                'foreignkeysunique' => $mappedForeignKeysUnique, // 🎯 Deduplicated: one entry per referenced table
                'constraints' => $mappedConstraints, // ALL constraints (PRIMARY, UNIQUE, FOREIGN)

                // Metadata
                'tableindex' => $tableIndex,
                'hastimestamps' => $fields->whereIn('field_name', ['created_at', 'updated_at'])->count() >= 2,
                // Use the actual is_primary_key flag instead of guessing from the
                // field name "id" — schemas with `user_id`, `ug_id` etc. were
                // silently reporting hasprimarykey=false.
                'hasprimarykey' => $fields->where('is_primary_key', true)->count() > 0,

                // Generation state metadata — user JS in {:code:} blocks can read these
                'state' => $table->display_state ?? 'enabled',
                'generation_mode' => $table->generation_mode ?? 'full',
                'in_iteration' => in_array(($table->generation_mode ?? 'full'), ['full', 'code_only']),
                'generates_files' => in_array(($table->generation_mode ?? 'full'), ['full', 'template_only']),
                'hasblob' => $fields->contains(fn($f) => $this->isBlobType($f->field_type)),
                'hasbinaryblob' => $fields->contains(fn($f) => $this->isBinaryBlobType($f->field_type)),
                'hasforeignkeys' => $constraints->where('constraint_type', 'FOREIGN KEY')->count() > 0,
                'primarykeyfield' => $this->getPrimaryKeyField($fields),
                'fileprimarykey' => $fileKeyName, // User-selected key (filekeyname from schema_tables)

                // Audit + version metadata at table level — usable as
                // {:table.version:}, {:table.created_at:}, {:table.updated_by_username:},
                // etc. Same Y-m-d formatting as field-level above.
                'version' => (int) ($table->version ?? 1),
                'created_at' => $table->created_at?->format('Y-m-d'),
                'updated_at' => $table->updated_at?->format('Y-m-d'),
                'created_by_username' => $table->created_by_username ?? 'system',
                'updated_by_username' => $table->updated_by_username ?? 'system',
            ];
        }

        return $tables;
    }

    /**
     * 🌍 BUILD ULTIMATE TABLE DATA WITH TRANSLATIONS
     */
    private function buildUltimateTableDataWithTranslations($schemaTables, ?int $projectId, $languages): array
    {
        $tables = [];

        // All tables stay in gtree.tables[] (see sibling method for rationale).
        // Iteration is driven by the `tablesgen` index array built by the caller.
        $schemaTables = collect($schemaTables)->values();

        // 🎯 Preload per-project report-pattern field assignments (see sibling method for rationale).
        $reportAssignments = $this->loadReportPatternAssignmentsForProject($projectId);

        foreach ($schemaTables as $tableIndex => $table) {
            // All fields stay in fields[] — iteration driven by fieldsgen[] indirection.
            $fields = $table->fields->values();
            $constraints = $table->constraints;
            $tableName = $table->table_name;

            // Get translations for this table
            $tableTranslations = $this->getTranslationsForItem($tableName, $languages);

            // 🎯 Find primary key field name from constraints
            $primaryKeyConstraint = $constraints
                ->where('constraint_type', 'PRIMARY KEY')
                ->first();
            $primaryKeyFieldName = null;
            if ($primaryKeyConstraint) {
                $firstColumn = $primaryKeyConstraint->constraintColumns->first();
                $primaryKeyFieldName = $firstColumn ? $firstColumn->field_name : null;
            }

            // Fallback: If no PK found in constraints, look for field ending with _id
            if (!$primaryKeyFieldName) {
                // Try: first field ending with _id (most common pattern)
                $pkField = $fields->first(function($field) {
                    return str_ends_with($field->field_name, '_id');
                });

                // Second fallback: just 'id'
                if (!$pkField) {
                    $pkField = $fields->firstWhere('field_name', 'id');
                }

                $primaryKeyFieldName = $pkField ? $pkField->field_name : null;

                \Log::warning("PK not found in constraints for {$tableName}, using fallback: " . ($primaryKeyFieldName ?? 'NONE'));
            }

            // 🎯 Build lists of fields with UNIQUE and INDEX constraints
            // Note: Each constraint can have multiple columns, but we only take the first one for now
            $uniqueFields = $constraints
                ->where('constraint_type', 'UNIQUE')
                ->map(function($constraint) {
                    // Get first column's field name from the constraint
                    $firstColumn = $constraint->constraintColumns->first();
                    return $firstColumn ? $firstColumn->field_name : null;
                })
                ->filter() // Remove nulls
                ->values() // 🎯 Re-index array to 0,1,2... instead of keeping original keys
                ->toArray();

            $indexFields = $constraints
                ->whereIn('constraint_type', ['INDEX', 'KEY'])
                ->map(function($constraint) {
                    // Get first column's field name from the constraint
                    $firstColumn = $constraint->constraintColumns->first();
                    return $firstColumn ? $firstColumn->field_name : null;
                })
                ->filter() // Remove nulls
                ->values() // 🎯 Re-index array to 0,1,2... instead of keeping original keys
                ->toArray();

            // Batch-load content translations for all fields of this table (avoids N+1 queries)
            $contentItemNames = $fields->map(fn($f) => $tableName . '.' . $f->field_name . '[content]')->toArray();
            $contentTranslationsLookup = [];
            if (!empty($contentItemNames)) {
                $contentRows = SchemaTranslation::whereIn('item_name', $contentItemNames)
                    ->where('is_active', true)
                    ->get();
                foreach ($contentRows as $row) {
                    $contentTranslationsLookup[$row->item_name . '|' . $row->code] = $row->translated_text;
                }
            }

            // Enhanced field mapping with translations
            $mappedFields = $fields->map(function($field, $index) use ($tableName, $projectId, $languages, $primaryKeyFieldName, $uniqueFields, $indexFields, $contentTranslationsLookup, $reportAssignments) {
                $fieldName = $field->field_name;
                $fullFieldName = $tableName . '.' . $fieldName;

                // Get translations for this field (with content lookup for combobox fields)
                $fieldTranslations = $this->getTranslationsForItem($fullFieldName, $languages, $contentTranslationsLookup);

                // 🎯 Base field data
                $fieldData = [
                    // Core field info
                    'name' => $fieldName,
                    'pascalcase' => str_replace('_', '', ucwords($fieldName, '_')), // PascalCase (e.g. ProdNo)
                    'camelcase' => lcfirst(str_replace('_', '', ucwords($fieldName, '_'))), // camelCase (e.g. prodNo)
                    'type' => strtoupper($field->field_type),
                    'schema_field_id' => $field->id, // For per-file assignment lookup

                    // Enhanced metadata
                    'controltype' => $field->control_type ?? 'TEXT', // 🎯 Read from database
                    'typecast' => $this->getPhpTypecast($field->field_type),
                    'phptype' => $this->getPhpType($field->field_type),
                    'jstype' => $this->getJsType($field->field_type),
                    'laraveltype' => $this->getLaravelType($field->field_type),
                    'notnull' => !$field->is_nullable,
                    'order' => $field->field_order,
                    'id' => $index + 1,
                    // Structured type metadata — same shape as buildUltimateTableData().
                    // Both methods need to expose the new columns or template behaviour
                    // diverges between single-language and translated generations.
                    'size' => $field->field_length ?? $this->extractFieldSize($field->field_type),
                    'precision' => $field->field_precision,
                    'scale' => $field->field_scale,
                    'enum_values' => $field->field_enum_values,
                    'is_generated' => (bool) ($field->is_generated ?? false),
                    'generation_expression' => $field->generation_expression,
                    'generation_storage' => $field->generation_storage,
                    'caption' => ucwords(str_replace('_', ' ', $fieldName)),
                    'default' => $field->default_value ?? '',

                    // Boolean flags - 🎯 Read from database (set during SQL import)
                    'isprimary' => $field->is_primary_key ?? false,
                    'isunique' => $field->is_unique ?? false, // 🎯 PRIMARY KEY and UNIQUE constraints
                    'isindex' => $field->is_index ?? false, // 🎯 INDEX/KEY constraints
                    'isforeign' => str_ends_with($fieldName, '_id') && !($field->is_primary_key ?? false),
                    'istimestamp' => in_array($fieldName, ['created_at', 'updated_at', 'deleted_at']),
                    'autoincrement' => $field->is_auto_increment ?? false, // 🎯 Read from database
                    'isblob' => $this->isBlobType($field->field_type), // 🎯 BLOB/TEXT large field detection
                    'isbinaryblob' => $this->isBinaryBlobType($field->field_type), // 🎯 Binary BLOB only (no TEXT)
                    // Default visibility comes from the global schema display_state.
                    // Per-file TemplateFileFieldAssignment overrides this below.
                    'visible' => !in_array(($field->display_state ?? 'enabled'), ['invisible', 'excluded']),

                    // 🎯 NEW: ITEMS variables for templates
                    'unsigned' => $field->is_unsigned ?? false, // {item.unsigned}
                    'sort' => $field->field_order, // {item.sort}
                    'sortindex' => $field->field_order, // {item.sortindex} - alias for backward compatibility

                    // Context
                    'filename' => $tableName,
                    'projectid' => $projectId ?? 1,

                    // 🌍 NEW: Language translations array
                    'lang' => $fieldTranslations,

                    // Generation state metadata — user JS in {:code:} blocks can read these
                    'state' => $field->display_state ?? 'enabled',
                    'generation_mode' => $field->generation_mode ?? 'full',
                    'in_iteration' => in_array(($field->generation_mode ?? 'full'), ['full', 'code_only']),
                    'generates_files' => in_array(($field->generation_mode ?? 'full'), ['full', 'template_only']),

                    // Report-pattern assignment overlay (active pattern of the project).
                    // report_visibility_state comes from the assignment when present,
                    // otherwise falls back to 'visible'. report_visible is the derived
                    // boolean so report templates can write {:if item.report_visible:}.
                    'report_visibility_state' => $reportAssignments[$field->id]['visibility_state'] ?? 'visible',
                    'report_visible' => !in_array(
                        $reportAssignments[$field->id]['visibility_state'] ?? 'visible',
                        ['invisible', 'not_available']
                    ),
                    'report_sort_order' => $reportAssignments[$field->id]['sort_order'] ?? null,

                    // Audit + version metadata — mirrored from buildUltimateTableData
                    // so single-language and translated generations produce the same
                    // item.* surface. Y-m-d formatting matches the SQL-COMMENT JSON.
                    'version' => (int) ($field->version ?? 1),
                    'created_at' => $field->created_at?->format('Y-m-d'),
                    'updated_at' => $field->updated_at?->format('Y-m-d'),
                    'created_by_username' => $field->created_by_username ?? 'system',
                    'updated_by_username' => $field->updated_by_username ?? 'system',
                ];

                // 🎯 LINK FIELDS - Only add for ComboBox when link fields are populated
                $controlType = strtoupper($field->control_type ?? '');
                $hasLinkData = !empty($field->link_table) && !empty($field->link_field);

                if ($controlType === 'COMBOBOX' && $hasLinkData) {
                    $fieldData['linktable'] = $field->link_table;
                    $fieldData['linkfield'] = $field->link_field;

                    // Only add optional fields if they have values (save space in GTree)
                    if (!empty($field->link_display_field)) {
                        $fieldData['linkdisplayfield'] = $field->link_display_field;
                    }
                    if (!empty($field->link_order_field)) {
                        $fieldData['linkorderfield'] = $field->link_order_field;
                    }
                    if (!empty($field->link_order_direction)) {
                        $fieldData['linkorder'] = $field->link_order_direction;
                    }
                }

                // 🎯 EDITMASK - Only add if populated (save space in GTree)
                if (!empty($field->editmask)) {
                    $fieldData['editmask'] = $field->editmask; // {item.editmask} - framework-agnostic input validation
                }

                return $fieldData;
            })->toArray();

            // 🎯 Create INDEX-BASED filtered field arrays (lightweight references into fields[])
            // Resolve file-key fields (supports composite keys like "field1,field2")
            // Use ?: (Elvis) instead of ?? to also catch empty strings "" (ProjectImportService stores "" as default)
            $fileKeyName = $table->filekeyname ?: ($primaryKeyFieldName ?: 'id');
            $fileKeyNames = $this->resolveSearchKeyFields($table, $fields, $primaryKeyFieldName);

            $fieldsNoKeyIndices = [];
            $fieldsNoKeyAllIndices = [];
            $fieldsNoBlobIndices = [];
            $fieldsNoBlobAllIndices = [];
            $fieldsNoBinaryBlobIndices = [];
            $fieldsNoBinaryBlobAllIndices = [];
            $fieldsSearchKeyIndices = [];
            // fieldsgen drives {:for nmaxitems:} via indirection — only fields
            // with mode full/code_only iterate; template_only, reference_only
            // and excluded fields remain in fields[] (for lookup) but are
            // skipped from ALL iteration subsets below.
            $fieldsGenIndices = [];
            foreach ($mappedFields as $index => $field) {
                $mode = $field['generation_mode'] ?? 'full';
                $isIterable = in_array($mode, ['full', 'code_only']);

                // Non-iterable fields (template_only, reference_only, excluded)
                // never appear in any iteration index array.
                if (!$isIterable) {
                    continue;
                }

                $fieldsGenIndices[] = $index;

                $isKey = $field['isprimary'] || in_array($field['name'], $fileKeyNames);

                if (!$isKey) {
                    // Both fieldsnokey and fieldsnokeyall exclude PK + file-keys
                    // Difference only matters after assignment overlay in processTemplateFile
                    $fieldsNoKeyIndices[] = $index;
                    $fieldsNoKeyAllIndices[] = $index;
                }
                if (!$field['isblob']) {
                    $fieldsNoBlobIndices[] = $index;
                    $fieldsNoBlobAllIndices[] = $index;
                }
                if (!$field['isbinaryblob']) {
                    $fieldsNoBinaryBlobIndices[] = $index;
                    $fieldsNoBinaryBlobAllIndices[] = $index;
                }
                // fieldssearchkeys: indices of the file-key fields (for {:for nmaxsearchkeys:} loop)
                if (in_array($field['name'], $fileKeyNames)) {
                    $fieldsSearchKeyIndices[] = $index;
                }
            }

            // Enhanced constraint mapping (ALL constraints)
            $mappedConstraints = $constraints->map(function($constraint, $index) use ($fields) {
                // Get first column's field name
                $firstColumn = $constraint->constraintColumns->first();
                $columnName = $firstColumn ? $firstColumn->field_name : '';

                $constraintType = $constraint->constraint_type ?? 'INDEX';
                $isPrimary = $constraintType === 'PRIMARY KEY';
                $isUnique = $constraintType === 'UNIQUE';
                $isIndex = in_array($constraintType, ['INDEX', 'KEY']);

                // 🎯 Look up field information for this constraint's column
                $field = $fields->firstWhere('field_name', $columnName);
                $fieldType = $field ? strtoupper($field->field_type) : 'UNKNOWN';
                $typecast = $field ? $this->getPhpTypecast($field->field_type) : 'string';

                return [
                    'name' => $columnName, // 🎯 CHANGED: Use field name (for {keys.name} in templates)
                    'constraintname' => $constraint->constraint_name ?? 'key_' . ($index + 1), // Original constraint name
                    'id' => $index + 1,
                    'column' => $columnName, // Field name (kept for compatibility)
                    'type' => $fieldType, // 🎯 CHANGED: Field type like VARCHAR, INT (for {keys.type} in templates)
                    'constrainttype' => $constraintType, // Original constraint type
                    'typecast' => $typecast, // 🎯 NEW: PHP typecast (for {keys.typecast} in templates)
                    'isprimary' => $isPrimary,
                    'isforeign' => $constraintType === 'FOREIGN KEY',
                    'isunique' => $isPrimary || $isUnique, // 🎯 PRIMARY is always unique!
                    'isindex' => $isIndex, // 🎯 INDEX or KEY constraint
                ];
            })->toArray();

            // 🎯 Keys array = PRIMARY + UNIQUE only (excluding FOREIGN)
            $mappedKeys = collect($mappedConstraints)->filter(function($constraint) {
                return $constraint['isprimary'] || $constraint['isunique'];
            })->values()->toArray();

            // 🎯 Foreign Keys array = FOREIGN KEY constraints with reference information
            $mappedForeignKeys = $constraints->where('constraint_type', 'FOREIGN KEY')->map(function($constraint) use ($fields) {
                // Get first column's field name
                $firstColumn = $constraint->constraintColumns->first();
                $columnName = $firstColumn ? $firstColumn->field_name : '';

                // Look up field information for this foreign key's column
                $field = $fields->firstWhere('field_name', $columnName);
                $fieldType = $field ? strtoupper($field->field_type) : 'UNKNOWN';
                $typecast = $field ? $this->getPhpTypecast($field->field_type) : 'string';

                // Get foreign key reference information
                $reference = $constraint->foreignKeyReference;
                $referencedTableName = $reference ? $reference->referencedTable->table_name : '';

                // Get referenced column name from referenceColumns → referencedField relation
                $referencedColumn = '';
                if ($reference && $reference->referenceColumns->isNotEmpty()) {
                    $refCol = $reference->referenceColumns->first();
                    $referencedColumn = $refCol->referencedField ? $refCol->referencedField->field_name : '';
                }

                return [
                    'name' => $columnName, // Field name (e.g., 'user_id')
                    'id' => $constraint->id, // Real database ID
                    'type' => $fieldType, // Field type (e.g., 'BIGINT')
                    'typecast' => $typecast, // PHP typecast (e.g., 'int')
                    'constraintname' => $constraint->constraint_name ?? 'fk_' . $constraint->id,
                    'referencedtable' => $referencedTableName, // Referenced table name (e.g., 'prod_group')
                    'referencedtablepascalcase' => str_replace('_', '', ucwords($referencedTableName, '_')), // PascalCase (e.g., 'ProdGroup')
                    'referencedtablecamelcase' => lcfirst(str_replace('_', '', ucwords($referencedTableName, '_'))), // camelCase (e.g., 'prodGroup')
                    'referencedcolumn' => $referencedColumn, // Referenced column (e.g., 'id')
                    'referencedfield' => $referencedColumn,  // Alias — naming parity with `linkfield` on lookup-style fields. Templates may use either.
                    'ondelete' => $reference->on_delete ?? 'NO ACTION', // ON DELETE action
                    'onupdate' => $reference->on_update ?? 'NO ACTION', // ON UPDATE action
                ];
            })->values()->toArray();

            // 🎯 Deduplicated Foreign Keys — unique by referencedtable (first FK per referenced table wins)
            $seenReferencedTables = [];
            $mappedForeignKeysUnique = [];
            foreach ($mappedForeignKeys as $fk) {
                $refTable = $fk['referencedtable'];
                if (!isset($seenReferencedTables[$refTable])) {
                    $seenReferencedTables[$refTable] = true;
                    $mappedForeignKeysUnique[] = $fk;
                }
            }

            $tables[] = [
                // Basic table info
                'filename' => $tableName,
                'filecamelcase' => lcfirst(str_replace('_', '', ucwords(strtolower($tableName), '_'))), // camelCase (e.g. contactMethods)
                'filepascalcase' => str_replace('_', '', ucwords(strtolower($tableName), '_')), // PascalCase (e.g. ContactMethods)
                'filenameshort' => $table->file_name_short ?? substr($tableName, 0, 2), // Use DB field or fallback
                'filenamerenamed' => $table->file_name_renamed ?? '', // {:filenamerenamed:}
                'fileid' => $table->id ?? $tableIndex,
                'databasename' => $table->floatingSchema->name ?? 'unknown', // 🔗 Schema/Database name
                'schemaid' => $table->floatingSchema->id ?? null, // 🔗 Schema ID for filtering

                // Singular name: user-defined or auto-guessed
                'filesingular' => $table->singular_name ?: $this->guessEnglishSingular($tableName),
                'filesingularpascalcase' => str_replace('_', '', ucwords(strtolower($table->singular_name ?: $this->guessEnglishSingular($tableName)), '_')),
                'filesingularcamelcase' => lcfirst(str_replace('_', '', ucwords(strtolower($table->singular_name ?: $this->guessEnglishSingular($tableName)), '_'))),

                // Counts — iteration counts derived from fieldsgen (the index
                // array of iterable fields). fields[] keeps ALL fields for
                // name/FK lookup; {:for nmaxitems:} walks fields[fieldsgen[i]].
                'nmaxitems' => count($fieldsGenIndices),
                'nmaxfields' => count($fieldsGenIndices),
                'nmaxitemsnokey' => count($fieldsNoKeyIndices),
                'nmaxitemsnokeyall' => count($fieldsNoKeyAllIndices),
                'nmaxitemsnoblob' => count($fieldsNoBlobIndices), // 🎯 Fields without BLOB/TEXT types
                'nmaxitemsnobloball' => count($fieldsNoBlobAllIndices), // 🎯 All fields without BLOB/TEXT (ignores assignments)
                'nmaxitemsnobinaryblob' => count($fieldsNoBinaryBlobIndices), // 🎯 Fields without binary BLOB types
                'nmaxitemsnobinarybloball' => count($fieldsNoBinaryBlobAllIndices), // 🎯 All fields without binary BLOB (ignores assignments)
                'nmaxkeys' => count($mappedKeys), // PRIMARY + UNIQUE only (not FOREIGN)
                'nmaxconstraints' => count($mappedConstraints), // ALL constraints (PRIMARY + UNIQUE + INDEX/KEY + FOREIGN)
                'nmaxforeignkeys' => $constraints->where('constraint_type', 'FOREIGN KEY')->count(),
                'nmaxforeignkeysunique' => count($mappedForeignKeysUnique),
                'nmaxsearchkeys' => $this->calculateSearchKeysCount($table, $fields, $primaryKeyFieldName),

                // Master-detail (placeholder - implement when needed)
                'nmaxitemsmasterdetail' => 0,
                'nmaxitemsmasterdetailnokeys' => 0,
                'filegeneratemasterdetail' => false,
                'filedetailfileid' => null,
                'filedetailfilename' => null,
                'filedetailkey' => null,

                // Data arrays
                'fields' => $mappedFields,
                'fieldsgen' => $fieldsGenIndices, // 🎯 Index array for {:for nmaxitems:} indirection
                'fieldsnokey' => $fieldsNoKeyIndices, // 🎯 Index array → fields[fieldsnokey[i]]
                'fieldsnokeyall' => $fieldsNoKeyAllIndices, // 🎯 Index array → fields[fieldsnokeyall[i]]
                'fieldsnoblob' => $fieldsNoBlobIndices, // 🎯 Index array → fields[fieldsnoblob[i]]
                'fieldsnobloball' => $fieldsNoBlobAllIndices, // 🎯 All non-BLOB fields (ignores assignments)
                'fieldsnobinaryblob' => $fieldsNoBinaryBlobIndices, // 🎯 Index array → fields without binary BLOB
                'fieldsnobinarybloball' => $fieldsNoBinaryBlobAllIndices, // 🎯 All non-binary-BLOB fields (ignores assignments)
                'fieldssearchkeys' => $fieldsSearchKeyIndices, // 🎯 Index array → fields[fieldssearchkeys[i]] (file-key fields)
                'keys' => $mappedKeys, // PRIMARY + UNIQUE keys only
                'foreignkeys' => $mappedForeignKeys, // 🎯 FOREIGN KEY constraints with reference info
                'foreignkeysunique' => $mappedForeignKeysUnique, // 🎯 Deduplicated: one entry per referenced table
                'constraints' => $mappedConstraints, // ALL constraints (PRIMARY, UNIQUE, FOREIGN)

                // Metadata
                'tableindex' => $tableIndex,
                'hastimestamps' => $fields->whereIn('field_name', ['created_at', 'updated_at'])->count() >= 2,
                // Use the actual is_primary_key flag instead of guessing from the
                // field name "id" — schemas with `user_id`, `ug_id` etc. were
                // silently reporting hasprimarykey=false.
                'hasprimarykey' => $fields->where('is_primary_key', true)->count() > 0,

                // Generation state metadata — user JS in {:code:} blocks can read these
                'state' => $table->display_state ?? 'enabled',
                'generation_mode' => $table->generation_mode ?? 'full',
                'in_iteration' => in_array(($table->generation_mode ?? 'full'), ['full', 'code_only']),
                'generates_files' => in_array(($table->generation_mode ?? 'full'), ['full', 'template_only']),
                'hasblob' => $fields->contains(fn($f) => $this->isBlobType($f->field_type)),
                'hasbinaryblob' => $fields->contains(fn($f) => $this->isBinaryBlobType($f->field_type)),
                'hasforeignkeys' => $constraints->where('constraint_type', 'FOREIGN KEY')->count() > 0,
                'primarykeyfield' => $this->getPrimaryKeyField($fields),
                'fileprimarykey' => $fileKeyName, // User-selected key (filekeyname from schema_tables)

                // Audit + version metadata at table level — mirrors the single-
                // language buildUltimateTableData() so both generation paths
                // expose the same {:table.version:}, {:table.created_at:}, ...
                'version' => (int) ($table->version ?? 1),
                'created_at' => $table->created_at?->format('Y-m-d'),
                'updated_at' => $table->updated_at?->format('Y-m-d'),
                'created_by_username' => $table->created_by_username ?? 'system',
                'updated_by_username' => $table->updated_by_username ?? 'system',

                // 🌍 NEW: Language translations array
                'lang' => $tableTranslations,
            ];
        }

        return $tables;
    }

    /**
     * 🌍 GET TRANSLATIONS FOR ITEM (TABLE OR FIELD)
     */
    private function getTranslationsForItem(string $itemName, $languages, ?array $contentTranslationsLookup = null): array
    {
        $translations = [];

        foreach ($languages as $index => $language) {
            $languageCode = $language->code;

            // Try to find translation in database
            $translation = SchemaTranslation::where('item_name', $itemName)
                ->where('code', $languageCode)
                ->where('is_active', true)
                ->first();

            if ($translation) {
                // Found translation in database
                $caption = $translation->translated_text;
            } else {
                // Fallback: Create readable name from item name
                $caption = $this->createFallbackCaption($itemName);
            }

            $entry = [
                'caption' => $caption,
                'code' => $languageCode,
                'index' => $index
            ];

            // Add combobox content translation if available
            // Uses pre-loaded lookup for performance (avoids N+1 queries)
            if ($contentTranslationsLookup !== null) {
                $contentKey = $itemName . '[content]|' . $languageCode;
                if (isset($contentTranslationsLookup[$contentKey])) {
                    $entry['content'] = $contentTranslationsLookup[$contentKey];
                }
            }

            $translations[] = $entry;
        }

        return $translations;
    }

    /**
     * 🔧 CREATE FALLBACK CAPTION
     */
    private function createFallbackCaption(string $itemName): string
    {
        // Remove table prefix for field names (e.g., "branches.branch_name" -> "branch_name")
        if (strpos($itemName, '.') !== false) {
            $itemName = explode('.', $itemName)[1];
        }

        // Replace underscores with spaces and capitalize first letter
        return ucfirst(str_replace('_', ' ', $itemName));
    }

    /**
     * 🔧 REPLACE FILENAME PLACEHOLDERS (%1-%14)
     *
     * %9  -> project name (supports [u|l|c|p|n] format suffixes via ProjectNamePlaceholder)
     * %14 -> project DB version (formerly %9; moved because %9 now carries the project name)
     */
    private function replaceFilenamePlaceholders(string $filename, array $gtreeData, ?string $tableName = null, ?string $languageCode = null, $file = null, ?int $tableIndex = null, int &$globalFileCounter = 0, int $dbTableFilePosition = 0, int $sequentialTableCounter = 0, int $totalTablesForCounter = 0): string
    {
        $gtree = $gtreeData['gtree'] ?? [];
        $project = $gtree[0]['project'][0] ?? [];

        // Find language details
        $languageName = '';
        $languageLocale = '';
        if ($languageCode && isset($project['lang'])) {
            foreach ($project['lang'] as $lang) {
                if ($lang['code'] === $languageCode) {
                    $languageName = $lang['name'] ?? '';
                    $languageLocale = $lang['code'] ?? '';
                    break;
                }
            }
        }

        // Get current date/time
        $now = now();
        $y = $now->format('Y');
        $mo = $now->format('m');
        $d = $now->format('d');
        $h = $now->format('H');
        $mi = $now->format('i');
        $s = $now->format('s');

        // ── STEP 1: Process parameterized placeholders (with [...] options) ──

        // %6[separatorFormat] — Date with custom separator and optional format
        // %6       → 20260307           (no separator, ISO)
        // %6[-]    → 2026-03-07         (dash separator, ISO)
        // %6[_]    → 2026_03_07         (underscore separator, ISO)
        // %6[.]    → 2026.03.07         (dot separator, ISO)
        // %6[_U]   → 03_07_2026         (underscore, US: MM_DD_YYYY)
        // %6[_E]   → 07_03_2026         (underscore, European: DD_MM_YYYY)
        $filename = preg_replace_callback('/%6(?:\[(.{1,2})\])?/', function($m) use ($y, $mo, $d) {
            $param = $m[1] ?? '';
            $sep = strlen($param) > 0 ? $param[0] : '';
            $fmt = strlen($param) > 1 ? strtoupper($param[1]) : '';
            if ($fmt === 'U') return $mo . $sep . $d . $sep . $y;
            if ($fmt === 'E') return $d . $sep . $mo . $sep . $y;
            return $y . $sep . $mo . $sep . $d;
        }, $filename);

        // %7[separator] — Time with custom separator
        // %7       → 095034             (no separator)
        // %7[:]    → 09:50:34
        // %7[-]    → 09-50-34
        // %7[_]    → 09_50_34
        $filename = preg_replace_callback('/%7(?:\[(.)\])?/', function($m) use ($h, $mi, $s) {
            $sep = $m[1] ?? '';
            return $h . $sep . $mi . $sep . $s;
        }, $filename);

        // %8[separatorDateSep] — DateTime combined
        // %8       → 20260307_095034               (no date-sep, underscore between date/time, no time-sep)
        // %8[-]    → 2026-03-07_09-50-34           (dash for both date and time)
        // %8[_]    → 2026_03_07_09_50_34           (underscore for everything)
        $filename = preg_replace_callback('/%8(?:\[(.)\])?/', function($m) use ($y, $mo, $d, $h, $mi, $s) {
            $sep = $m[1] ?? '';
            return $y . $sep . $mo . $sep . $d . '_' . $h . $sep . $mi . $sep . $s;
        }, $filename);

        // %12[padWidth] — Auto-incrementing counter per template file (resets per file)
        // %12       → 1, 2, 3, ...              (no padding)
        // %12[06]   → 000001, 000002, ...        (zero-padded, width 6)
        // %12[ 6]   → "     1", "     2", ...    (space-padded, width 6)
        // %12[03]   → 001, 002, ...              (zero-padded, width 3)
        // Uses sequential counter (1-based), independent of GTree index
        $counter = $sequentialTableCounter > 0 ? $sequentialTableCounter : (($tableIndex ?? 0) + 1);

        $filename = preg_replace_callback('/%12(?:\[(.)(\\d{1,2})\])?/', function($m) use ($counter) {
            if (isset($m[1]) && isset($m[2])) {
                $padChar = $m[1];
                $width = (int)$m[2];
                return str_pad((string)$counter, $width, $padChar, STR_PAD_LEFT);
            }
            return (string)$counter;
        }, $filename);

        // %13[padWidth] — Global counter across ALL db_table_files in a template
        // Uses the file's auto-calculated position among db_table_files (NOT file_order!)
        // file_order controls SORT ORDER only, dbTableFilePosition controls %13 offset
        // Formula: (dbTableFilePosition × totalTables) + tableCounter
        // Position 0 (1st db_table_file): %13 = 1, 2, 3, ...  (same as %12)
        // Position 1 (2nd db_table_file): %13 = 20, 21, 22, ... (for 19 tables)
        // Position 2 (3rd db_table_file): %13 = 39, 40, 41, ... (for 19 tables)
        // %13       → no padding
        // %13[06]   → 000020, 000021, ...           (zero-padded, width 6)
        // %13[03]   → 020, 021, ...                 (zero-padded, width 3)
        $totalForGlobal = $totalTablesForCounter > 0 ? $totalTablesForCounter : count($gtree[0]['project'][0]['tables'] ?? []);
        $offsetCounter = ($dbTableFilePosition * $totalForGlobal) + $counter;
        $filename = preg_replace_callback('/%13(?:\[(.)(\\d{1,2})\])?/', function($m) use ($offsetCounter) {
            if (isset($m[1]) && isset($m[2])) {
                $padChar = $m[1];
                $width = (int)$m[2];
                return str_pad((string)$offsetCounter, $width, $padChar, STR_PAD_LEFT);
            }
            return (string)$offsetCounter;
        }, $filename);

        // ── STEP 1b: Project-name placeholder %9 / %9[u|l|c|p|n] ──
        // Handled BEFORE the simple str_replace so the bracket suffix isn't
        // mistaken for literal characters during the generic pass.
        $filename = ProjectNamePlaceholder::resolve($filename, (string)($project['projectname'] ?? ''));

        // ── STEP 2: Simple placeholders (no parameters) ──
        // IMPORTANT: Longer numbers MUST come BEFORE shorter ones (%11 before %1)
        $tableNameLower = strtolower($tableName ?? 'unknown');
        // For _languages file types, keep %2 unreplaced — frontend handles per-language replacement
        $generationType = $file ? $this->determineGenerationType($file) : 'project_file';
        $keepPercent2 = in_array($generationType, ['project_file_languages', 'db_table_file_languages']);

        $replacements = [
            '%14' => $project['projectdbversion'] ?? '1',              // Project DB Version (was %9 before the refactor)
            '%11' => strtoupper($tableName ?? 'UNKNOWN'),              // DB Table name UPPERCASE (e.g. TEAMS)
            '%10' => str_replace('_', '', ucwords($tableNameLower, '_')), // DB Table name PascalCase (e.g. ContactMethods)
            '%1' => $tableName ?? 'unknown',                           // DB Table name (e.g. teams)
            '%2' => $keepPercent2 ? '%2' : ($languageCode ?? 'en'),    // Language short code (kept for frontend if _languages type)
            '%3' => $languageName ?: 'English',                        // Language name
            '%4' => $languageLocale ?: 'en',                           // Language locale
            '%5' => $file->template->name ?? 'template',               // Template name
        ];

        return str_replace(array_keys($replacements), array_values($replacements), $filename);
    }

    /**
     * 📝 PROCESS TEMPLATE FILE
     */
    private function processTemplateFile(UltimateTemplateEngine $engine, $file, array $gtreeData, bool $compile, ?string $tableName = null, ?string $languageCode = null, bool $includeSource = false, int $fileCounter = 0, int &$globalFileCounter = 0, int $dbTableFilePosition = 0, int $sequentialTableCounter = 0, int $totalTablesForCounter = 0): array
    {
        $content = $file->file_content;

        // Determine if this is a db_table_file and set table metadata
        $generationType = $this->determineGenerationType($file);
        $tableIndex = null;
        $actualTableName = null;

        // If table_name parameter is provided, resolve table index for db_table types
        // Only override generation type for actual db_table types, NOT for project/static files
        if ($tableName) {
            // Only set generation_type to db_table_file if the file is actually a DB type
            if ($generationType === 'db_table_file' || $generationType === 'db_table_file_languages') {
                // Keep original type (already correct)
            } elseif ($generationType === 'project_file' || $generationType === 'project_file_languages'
                || $generationType === 'static_file' || $generationType === 'static_directory') {
                // Do NOT override - these are not DB table files
            } else {
                // Unknown type with tableName provided - default to db_table_file
                $generationType = 'db_table_file';
            }

            // Find the table in gtree data
            $gtree = $gtreeData['gtree'] ?? [];

            // Access the correct gtree structure: gtree[0]['project'][0]['tables']
            if (isset($gtree[0]['project'][0]['tables'])) {
                $tables = $gtree[0]['project'][0]['tables'];

                foreach ($tables as $index => $tableData) {
                    // Check both 'filename' and 'tablename' fields since gtree structure may vary
                    $tableFilename = $tableData['filename'] ?? null;
                    $tableTablename = $tableData['tablename'] ?? null;

                    if (($tableFilename && $tableFilename === $tableName) ||
                        ($tableTablename && $tableTablename === $tableName)) {
                        $tableIndex = $index;
                        $actualTableName = $tableName;
                        break;
                    }
                }
            }

            // 🎯 Graceful skip for tables excluded at schema level.
            // When $tableName was requested but the table is no longer in the gtree
            // (because SchemaTable.generation_mode is 'excluded' or 'reference_only'),
            // we must NOT fall through to engine compilation — the engine would emit
            // JS that references `tableIdx` without defining it (since tableIdx is
            // only written when $tableIndex !== null). Emitting such code leads to
            // "tableIdx is not defined" runtime errors. Returning a SKIPPED marker
            // lets every caller filter this file out cleanly.
            if (($generationType === 'db_table_file' || $generationType === 'db_table_file_languages')
                && $tableIndex === null) {
                return [
                    'file_id' => $file->id,
                    'filename' => $file->file_name,
                    'original_template' => $file->file_name,
                    'file_type' => $file->file_type,
                    'original_content' => $content,
                    'compiled_content' => '',
                    'is_compiled' => false,
                    'output_path' => $file->output_path ?? '/',
                    'file_size' => 0,
                    'generation_type' => $generationType,
                    'generated_from_template' => $file->file_name,
                    'table' => $tableName,
                    'table_index' => null,
                    'language_code' => $languageCode,
                    'unknown_variables' => [],
                    'required_missing' => [],
                    'optional_missing' => [],
                    'has_unknown_variables' => false,
                    'syntax_errors' => [],
                    'syntax_warnings' => [],
                    'has_syntax_errors' => false,
                    // Skip marker — consumed by upstream loops so nothing is emitted.
                    'skipped' => true,
                    'skip_reason' => "Table '{$tableName}' is excluded from code generation (generation_mode).",
                ];
            }
        } else {
            // No tableName — project_file or static_file
        }

        // Replace %1-%13 placeholders in filename, output path, and inject_target
        // Uses sequential counter (independent of GTree index) for %12/%13
        $counterIndex = $tableIndex ?? 0;
        $processedFileName = $this->replaceFilenamePlaceholders($file->file_name, $gtreeData, $actualTableName, $languageCode, $file, $counterIndex, $globalFileCounter, $dbTableFilePosition, $sequentialTableCounter, $totalTablesForCounter);
        $processedOutputPath = $this->replaceFilenamePlaceholders($file->output_path ?? '/', $gtreeData, $actualTableName, $languageCode, $file, $counterIndex, $globalFileCounter, $dbTableFilePosition, $sequentialTableCounter, $totalTablesForCounter);
        $processedInjectTarget = $file->inject_target
            ? $this->replaceFilenamePlaceholders($file->inject_target, $gtreeData, $actualTableName, $languageCode, $file, $counterIndex, $globalFileCounter, $dbTableFilePosition, $sequentialTableCounter, $totalTablesForCounter)
            : null;

        // 🎯 INJECT TEMPLATE FILE VARIABLES into gtreeData for this file
        $outputPath = $processedOutputPath;
        $templateFolder = dirname($outputPath); // Extract folder from output path
        $templateFolder = ($templateFolder === '.' || $templateFolder === '/') ? '' : $templateFolder;

        // Extract filename without extension for templatepagename
        $pathInfo = pathinfo($file->file_name);
        $templatePageName = $pathInfo['filename'] ?? $file->file_name;

        $gtreeData['gtree'][0]['project'][0]['templatefolder'] = $templateFolder;
        $gtreeData['gtree'][0]['project'][0]['templatepage'] = $file->file_name;
        $gtreeData['gtree'][0]['project'][0]['templatepagename'] = $templatePageName;
        $gtreeData['gtree'][0]['project'][0]['templatefilepath'] = $file->file_path ?? '';
        $gtreeData['gtree'][0]['project'][0]['templateoutputpath'] = $outputPath;

        // 🌐 Language Override: if this template file has a language_override, switch selectedlanguageindex
        if (!empty($file->language_override) && isset($gtreeData['gtree'][0]['project'][0]['lang'])) {
            $languages = $gtreeData['gtree'][0]['project'][0]['lang'];
            foreach ($languages as $langIdx => $lang) {
                if ($lang['code'] === $file->language_override) {
                    $gtreeData['gtree'][0]['project'][0]['selectedlanguage'] = $file->language_override;
                    $gtreeData['gtree'][0]['project'][0]['selectedlanguageindex'] = $langIdx;
                    break;
                }
            }
        }

        // 🎯 Per-file field assignment overlay (visibility + sort on INDEX ARRAYS only, fields order unchanged!)
        $fileAssignments = TemplateFileFieldAssignment::where('template_file_id', $file->id)
            ->get()
            ->keyBy('schema_field_id');

        if ($fileAssignments->isNotEmpty() && isset($gtreeData['gtree'][0]['project'][0]['tables'])) {
            foreach ($gtreeData['gtree'][0]['project'][0]['tables'] as &$tableData) {
                if (!isset($tableData['fields'])) continue;

                // Apply visibility + sort values to field properties (array ORDER stays unchanged!)
                $customSort = []; // field_index → sort_order (only fields with explicit sort_order)
                $notAvail = [];   // field_index → true (for not_available fields)
                foreach ($tableData['fields'] as $idx => &$fieldData) {
                    $sfId = $fieldData['schema_field_id'] ?? null;
                    if ($sfId && isset($fileAssignments[$sfId])) {
                        $assignment = $fileAssignments[$sfId];
                        $fieldData['visibility_state'] = $assignment->visibility_state;
                        $fieldData['visible'] = !in_array($assignment->visibility_state, ['invisible', 'not_available']);
                        if ($assignment->sort_order !== null) {
                            $fieldData['sort'] = $assignment->sort_order;
                            $fieldData['sortindex'] = $assignment->sort_order;
                            $customSort[$idx] = $assignment->sort_order;
                        }
                        if ($assignment->visibility_state === 'not_available') {
                            $notAvail[$idx] = true;
                        }
                    }
                }
                unset($fieldData);

                // Sort comparator: custom sort_order first (numerically), then unassigned (original index)
                $cmp = function ($a, $b) use ($customSort) {
                    $ac = isset($customSort[$a]);
                    $bc = isset($customSort[$b]);
                    if ($ac !== $bc) return $ac ? -1 : 1;
                    if ($ac && $bc) return $customSort[$a] !== $customSort[$b] ? $customSort[$a] - $customSort[$b] : $a - $b;
                    return $a - $b;
                };
                $sort = function ($arr) use ($cmp) { usort($arr, $cmp); return $arr; };
                $excl = function ($arr) use ($notAvail) { return array_values(array_filter($arr, fn($i) => !isset($notAvail[$i]))); };

                // Re-order index arrays by per-file sort_order (fields array stays in original order!)
                $tableData['fieldsnokey']      = $sort($excl($tableData['fieldsnokeyall']));
                $tableData['fieldsnokeyall']   = $sort($tableData['fieldsnokeyall']);
                $tableData['fieldsnoblob']          = $sort($excl($tableData['fieldsnobloball']));
                $tableData['fieldsnobloball']       = $sort($tableData['fieldsnobloball']);
                $tableData['fieldsnobinaryblob']    = $sort($excl($tableData['fieldsnobinarybloball']));
                $tableData['fieldsnobinarybloball'] = $sort($tableData['fieldsnobinarybloball']);
                $tableData['fieldssearchkeys']      = $sort($tableData['fieldssearchkeys']);

                // Update counters to match
                $tableData['nmaxitemsnokey']          = count($tableData['fieldsnokey']);
                $tableData['nmaxitemsnokeyall']       = count($tableData['fieldsnokeyall']);
                $tableData['nmaxitemsnoblob']         = count($tableData['fieldsnoblob']);
                $tableData['nmaxitemsnobloball']      = count($tableData['fieldsnobloball']);
                $tableData['nmaxitemsnobinaryblob']   = count($tableData['fieldsnobinaryblob']);
                $tableData['nmaxitemsnobinarybloball'] = count($tableData['fieldsnobinarybloball']);
                $tableData['nmaxsearchkeys']          = count($tableData['fieldssearchkeys']);
            }
            unset($tableData);
        }

        // ✅ VALIDATE TEMPLATE VARIABLES WITH CONTEXT (informational only, does not block)
        $templateId = $file->template_id ?? null;
        $projectId = $gtreeData['gtree'][0]['project'][0]['projectid'] ?? null;

        // ✅ VALIDATE TEMPLATE SYNTAX FIRST (blocks on errors!)
        $syntaxValidation = $engine->validateTemplateSyntax($content);
        $syntaxErrors = $syntaxValidation['errors'];
        $syntaxWarnings = $syntaxValidation['warnings'];

        $validationResult = $engine->validateVariablesWithContext(
            $content,
            $templateId,
            $projectId,
            $languageCode
        );

        $hasUnknownVariables = !$validationResult['valid'];
        $unknownVariables = $validationResult['unknown_variables'];
        $requiredMissing = $validationResult['required_missing'];
        $optionalMissing = $validationResult['optional_missing'];

        // NOW compile the template with the correct tableIndex
        if ($compile) {
            // Use the Ultimate Template Engine to compile template to JavaScript
            $functionName = 'generate_' . preg_replace('/[^a-zA-Z0-9]/', '_', $processedFileName);
            $compiledContent = $engine->processTemplate($content, $functionName, $tableIndex, $includeSource);
        } else {
            // Simple variable replacement for backward compatibility
            $compiledContent = $content;
        }

        return [
            'file_id' => $file->id,
            'filename' => $processedFileName, // %2 already kept by replaceFilenamePlaceholders for _languages types
            'original_template' => $file->file_name,
            'file_type' => $file->file_type,
            'original_content' => $content,
            'compiled_content' => $compiledContent,
            'is_compiled' => $compile,
            'output_path' => $processedOutputPath, // %2 already kept for _languages types
            'file_size' => strlen($compiledContent),
            'generation_type' => $generationType,
            'generated_from_template' => $file->file_name,
            'table' => $actualTableName,
            'table_index' => $tableIndex,
            'language_code' => $languageCode,
            'is_project_file' => $generationType === 'project_file' || $generationType === 'project_file_languages',
            'is_language_enabled' => in_array($generationType, ['project_file_languages', 'db_table_file_languages']),
            // ✅ Add validation results (3 categories)
            'has_unknown_variables' => $hasUnknownVariables,
            'unknown_variables' => $unknownVariables,
            'required_missing' => $requiredMissing,
            'optional_missing' => $optionalMissing,
            // ✅ Add syntax validation results
            'has_syntax_errors' => !empty($syntaxErrors),
            'syntax_errors' => $syntaxErrors,
            'syntax_warnings' => $syntaxWarnings,
            // 🎯 Per-file overlaid GTree (only included when file has assignments)
            'overlaid_gtree' => $fileAssignments->isNotEmpty() ? $gtreeData['gtree'] : null,
            // Include-only flag (file is only used via {:include:}, not output to ZIP)
            'is_include_only' => (bool) $file->is_include_only,
            // Smart Injection fields
            'inject_target' => $processedInjectTarget,
            'inject_tag' => $file->inject_tag,
        ];
    }

    /**
     * 🏗️ BUILD RESPONSE
     */
    private function buildResponse(string $format, array $data): JsonResponse
    {
        switch ($format) {
            case 'js':
            case 'javascript':
                // Return JavaScript format
                $jsContent = "const gtree = " . json_encode($data['gtree'], JSON_PRETTY_PRINT) . ";\n\n";
                $jsContent .= "// Generated files\n";
                foreach ($data['processed_files'] as $file) {
                    $jsContent .= "// File: {$file['filename']}\n";
                    $jsContent .= $file['compiled_content'] . "\n\n";
                }

                return response()->json([
                    'format' => 'javascript',
                    'content' => $jsContent,
                    'metadata' => $data['gtree_metadata'],
                    'performance' => $data['performance'],
                ]);

            case 'php':
                // Return PHP format
                $phpContent = "<?php\n\n";
                $phpContent .= "\$gtree = " . var_export($data['gtree'], true) . ";\n\n";

                return response()->json([
                    'format' => 'php',
                    'content' => $phpContent,
                    'metadata' => $data['gtree_metadata'],
                    'performance' => $data['performance'],
                ]);

            default:
                // Return JSON format (default)
                return response()->json($data);
        }
    }

    /**
     * 🔧 HELPER METHODS
     */
    private function getPhpTypecast(string $fieldType): string
    {
        return match(strtolower($fieldType)) {
            'int', 'integer', 'bigint', 'smallint', 'tinyint' => '(int)',
            'decimal', 'float', 'double' => '(float)',
            'boolean', 'bool', 'tinyint(1)' => '(bool)',
            default => ''
        };
    }

    private function getPhpType(string $fieldType): string
    {
        return match(strtolower($fieldType)) {
            'int', 'integer', 'bigint', 'smallint', 'tinyint' => 'int',
            'decimal', 'float', 'double' => 'float',
            'boolean', 'bool', 'tinyint(1)' => 'bool',
            default => 'string'
        };
    }

    private function getJsType(string $fieldType): string
    {
        return match(strtolower($fieldType)) {
            'int', 'integer', 'bigint', 'smallint', 'tinyint', 'decimal', 'float', 'double' => 'number',
            'boolean', 'bool', 'tinyint(1)' => 'boolean',
            default => 'string'
        };
    }

    private function getLaravelType(string $fieldType): string
    {
        $type = strtolower(trim($fieldType));
        // tinyint(1) is the canonical MySQL boolean representation
        if ($type === 'tinyint(1)') {
            return 'boolean';
        }
        // Strip size suffix: VARCHAR(50) → varchar, DECIMAL(10,2) → decimal
        $baseType = strpos($type, '(') !== false ? substr($type, 0, strpos($type, '(')) : $type;
        return match($baseType) {
            'int', 'integer', 'bigint', 'smallint', 'mediumint', 'tinyint', 'year' => 'integer',
            'decimal', 'float', 'double', 'numeric', 'real'                        => 'numeric',
            'boolean', 'bool'                                                       => 'boolean',
            'date'                                                                  => 'date',
            'datetime', 'timestamp'                                                 => 'datetime',
            'time'                                                                  => 'date_format:H:i:s',
            'json'                                                                  => 'json',
            'uuid'                                                                  => 'uuid',
            'blob', 'tinyblob', 'mediumblob', 'longblob', 'image'                  => 'file',
            default                                                                 => 'string',
        };
    }

    /**
     * 🎯 Check if a field type is a BLOB/TEXT large data type
     * These are excluded from {:for nmaxitemsnoblob:} loops
     */
    private function isBlobType(string $fieldType): bool
    {
        $type = strtolower($fieldType);
        // Strip size suffix like TEXT(65535) or BLOB(255)
        $baseType = strpos($type, '(') !== false ? substr($type, 0, strpos($type, '(')) : $type;
        return in_array($baseType, [
            'blob', 'tinyblob', 'mediumblob', 'longblob',
            'text', 'tinytext', 'mediumtext', 'longtext',
            'clob',         // Oracle, Firebird, H2
            'image',        // MS-SQL (deprecated but still in use)
            'ntext',        // MS-SQL (deprecated but still in use)
            'binary',       // Binary large data
            'varbinary',    // Variable-length binary
        ]);
    }

    /**
     * 🎯 Check if a field type is a binary BLOB type (NOT text, NOT binary/varbinary)
     * Used for {:hasblob:} table-level flag — only true binary large objects
     */
    private function isBinaryBlobType(string $fieldType): bool
    {
        $type = strtolower($fieldType);
        $baseType = strpos($type, '(') !== false ? substr($type, 0, strpos($type, '(')) : $type;
        return in_array($baseType, [
            'tinyblob', 'blob', 'mediumblob', 'longblob',
            'image',    // MS-SQL binary large object
        ]);
    }

    private function extractFieldSize(string $fieldType): int
    {
        if (preg_match('/\((\d+)\)/', $fieldType, $matches)) {
            return (int)$matches[1];
        }
        return 0;
    }

    private function determineGenerationType($file): string
    {
        if ($file->file_type === 'project_file') {
            return 'project_file';
        }

        if ($file->file_type === 'project_file_languages') {
            return 'project_file_languages';
        }

        if ($file->file_type === 'db_table_file_languages') {
            return 'db_table_file_languages';
        }

        if (in_array($file->file_type, ['model', 'controller', 'view', 'migration', 'db_table_file'])) {
            return 'db_table_file';
        }

        return 'static_file';
    }

    /**
     * 🔧 CALCULATE SEARCH KEYS COUNT FOR COMPOSITE KEYS
     * Determines how many fields make up the search key based on filekeyname
     */
    private function calculateSearchKeysCount($table, $fields, ?string $primaryKeyFieldName = null): int
    {
        // Get the file key name (primary search key)
        // Use ?: (Elvis) instead of ?? to also catch empty strings ""
        // Prefer dynamically detected $primaryKeyFieldName over DB column $table->primarykeyfield
        $fileKeyName = $table->filekeyname ?: ($primaryKeyFieldName ?: ($table->primarykeyfield ?: 'id'));
        $fieldNames = $fields->pluck('field_name')->toArray();

        // 🔧 SAUBERE LÖSUNG: Check if filekeyname is a single existing field first
        if (in_array($fileKeyName, $fieldNames)) {
            // It's a single field that exists in the table
            return 1;
        }

        // Check for explicit composite key patterns with clear separators
        // Only use separators that are NOT commonly used in field names
        $compositeSeparators = [',', '+', '|', ';', ' '];

        foreach ($compositeSeparators as $separator) {
            if (strpos($fileKeyName, $separator) !== false) {
                // Split by separator and validate each part exists as a field
                $keyParts = explode($separator, $fileKeyName);
                $validParts = array_filter($keyParts, function($part) use ($fieldNames) {
                    $trimmedPart = trim($part);
                    return !empty($trimmedPart) && in_array($trimmedPart, $fieldNames);
                });

                if (count($validParts) > 1) {
                    // Valid composite key found - all parts are real field names
                    return count($validParts);
                }
            }
        }

        // Check for underscore separator ONLY if no single field match
        // and all parts are valid field names
        if (strpos($fileKeyName, '_') !== false) {
            $underscoreParts = explode('_', $fileKeyName);
            $validUnderscoreParts = array_filter($underscoreParts, function($part) use ($fieldNames) {
                $trimmedPart = trim($part);
                return !empty($trimmedPart) && in_array($trimmedPart, $fieldNames);
            });

            // Only consider it composite if ALL parts are valid field names
            if (count($validUnderscoreParts) > 1 && count($validUnderscoreParts) === count($underscoreParts)) {
                return count($validUnderscoreParts);
            }
        }

        // Default: single key (even if we don't recognize the pattern)
        return 1;
    }

    /**
     * 🔑 RESOLVE SEARCH KEY FIELDS - Returns array of field names from filekeyname
     * Similar logic to calculateSearchKeysCount() but returns field names instead of count.
     * Supports composite keys (e.g., "field1,field2" or "field1+field2").
     */
    private function resolveSearchKeyFields($table, $fields, ?string $primaryKeyFieldName = null): array
    {
        // Use ?: (Elvis) instead of ?? to also catch empty strings ""
        // Prefer dynamically detected $primaryKeyFieldName over DB column $table->primarykeyfield
        $fileKeyName = $table->filekeyname ?: ($primaryKeyFieldName ?: ($table->primarykeyfield ?: 'id'));
        $fieldNames = $fields->pluck('field_name')->toArray();

        // Single field that exists in the table
        if (in_array($fileKeyName, $fieldNames)) {
            return [$fileKeyName];
        }

        // Check for composite key patterns with clear separators
        $compositeSeparators = [',', '+', '|', ';', ' '];

        foreach ($compositeSeparators as $separator) {
            if (strpos($fileKeyName, $separator) !== false) {
                $keyParts = array_map('trim', explode($separator, $fileKeyName));
                $validParts = array_filter($keyParts, function($part) use ($fieldNames) {
                    return !empty($part) && in_array($part, $fieldNames);
                });

                if (count($validParts) > 1) {
                    return array_values($validParts);
                }
            }
        }

        // Check for underscore separator ONLY if all parts are valid field names
        if (strpos($fileKeyName, '_') !== false) {
            $underscoreParts = explode('_', $fileKeyName);
            $validUnderscoreParts = array_filter($underscoreParts, function($part) use ($fieldNames) {
                return !empty(trim($part)) && in_array(trim($part), $fieldNames);
            });

            if (count($validUnderscoreParts) > 1 && count($validUnderscoreParts) === count($underscoreParts)) {
                return array_values(array_map('trim', $validUnderscoreParts));
            }
        }

        // Default: return the fileKeyName as single entry (even if not found in fields)
        return [$fileKeyName];
    }

    /**
     * 🔑 GET PRIMARY KEY FIELD - Löst das {filekeyname} Problem
     */
    /**
     * Guess English singular form of a table name.
     * Only handles common English patterns — for other languages, use singular_name field.
     */
    private function guessEnglishSingular(string $tableName): string
    {
        // Handle compound names: split by underscore, singularize the LAST part
        $parts = explode('_', $tableName);
        $lastPart = array_pop($parts);

        // Common English pluralization rules (reversed)
        if (str_ends_with($lastPart, 'ies') && strlen($lastPart) > 4) {
            $lastPart = substr($lastPart, 0, -3) . 'y'; // categories → category
        } elseif (str_ends_with($lastPart, 'sses')) {
            $lastPart = substr($lastPart, 0, -2); // addresses → address... wait, "addresses" ends in "es"
        } elseif (str_ends_with($lastPart, 'ses') || str_ends_with($lastPart, 'xes') || str_ends_with($lastPart, 'zes') || str_ends_with($lastPart, 'shes') || str_ends_with($lastPart, 'ches')) {
            $lastPart = substr($lastPart, 0, -2); // addresses → addresse... hmm
        } elseif (str_ends_with($lastPart, 'sses')) {
            $lastPart = substr($lastPart, 0, -2); // classes → class
        } elseif (str_ends_with($lastPart, 'ves')) {
            $lastPart = substr($lastPart, 0, -3) . 'f'; // wolves → wolf (approximate)
        } elseif (str_ends_with($lastPart, 's') && !str_ends_with($lastPart, 'ss') && !str_ends_with($lastPart, 'us') && !str_ends_with($lastPart, 'is')) {
            $lastPart = substr($lastPart, 0, -1); // products → product
        }

        $parts[] = $lastPart;
        return implode('_', $parts);
    }

    private function getPrimaryKeyField($fields): string
    {
        // Suche nach 'id' field
        $idField = $fields->where('field_name', 'id')->first();
        if ($idField) {
            return 'id';
        }

        // Suche nach Feldern die mit '_id' enden und als erste kommen (primary key pattern)
        $primaryField = $fields->filter(function($field) {
            return str_ends_with($field->field_name, '_id');
        })->first();

        if ($primaryField) {
            return $primaryField->field_name;
        }

        // Suche nach dem ersten Integer-Feld (wahrscheinlich primary key)
        $firstIntField = $fields->filter(function($field) {
            return in_array(strtolower($field->field_type), ['int', 'integer', 'bigint']);
        })->first();

        if ($firstIntField) {
            return $firstIntField->field_name;
        }

        // Fallback: erstes Feld
        return $fields->first()?->field_name ?? 'id';
    }

    /**
     * 🚀 GENERATE FULL PROJECT CODE
     *
     * Generates code for ALL selected templates, databases, and languages
     * Returns a ZIP file with all generated code
     */
    public function generateFullProject(Request $request, int $projectId)
    {
        $startTime = microtime(true);

        try {
            // 💰 CREDIT CHECK: Charge 5 credits for full project generation (skip for Patron Monthly)
            $user = $request->user();
            if ($user) {
                $chargeResult = CreditService::chargeForGeneration($user, $projectId, null, 'web');

                if (!$chargeResult['success']) {
                    return response()->json([
                        'error' => 'Insufficient credits',
                        'message' => $chargeResult['message'],
                        'credits_required' => CreditService::GENERATION_COST,
                        'credits_available' => $user->credits,
                    ], 402); // 402 Payment Required
                }
            }

            // Validate input
            $request->validate([
                'template_ids' => 'required|array|min:1',
                'template_ids.*' => 'required|integer|exists:templates,id',
                'schema_ids' => 'nullable|array',
                'schema_ids.*' => 'integer|exists:schemas,id',
                'language_codes' => 'nullable|array',
                'language_codes.*' => 'string|size:2',
            ]);

            $templateIds = $request->input('template_ids');
            $schemaIds = $request->input('schema_ids', []);
            $languageCodes = $request->input('language_codes', ['en']);

            // Load project
            $project = Project::find($projectId);
            if (!$project) {
                return response()->json(['error' => 'Project not found'], 404);
            }

            // Load all templates
            $templates = Template::with('files')->whereIn('id', $templateIds)->get();
            if ($templates->isEmpty()) {
                return response()->json(['error' => 'No templates found'], 404);
            }

            // Create temporary directory for generation
            $tempDir = storage_path('app/temp/generation_' . uniqid());
            if (!file_exists($tempDir)) {
                mkdir($tempDir, 0755, true);
            }

            $generatedFiles = [];
            $completedOperations = 0;
            $syntaxErrors = []; // Collect all syntax errors
            $adjustmentWarnings = []; // Collect code adjustment warnings

            // Process each template
            foreach ($templates as $template) {
                // Build gtree for this template (includes ALL project tables)
                $gtreeData = $this->buildUltimateGtree($projectId, $template->id, $template);
                $engine = new UltimateTemplateEngine($gtreeData['gtree']);

                // Extract tables from gtree
                $tablesFromGtree = $gtreeData['gtree'][0]['project'][0]['tables'] ?? [];

                // Filter tables if specific schemas were selected
                if (!empty($schemaIds)) {
                    $originalCount = count($tablesFromGtree);

                    // Debug: Show actual schema IDs in tables
                    $actualSchemaIds = array_map(function($table) {
                        return $table['schemaid'] ?? 'NO_SCHEMAID';
                    }, $tablesFromGtree);

                    $tablesFromGtree = array_filter($tablesFromGtree, function($tableData) use ($schemaIds) {
                        // Check if table's schema_id is in selected schemas
                        return isset($tableData['schemaid']) && in_array($tableData['schemaid'], $schemaIds);
                    });
                }

                // 🔗 INCLUDE RESOLUTION: Resolve {:include: path/file.ext:} patterns before processing
                $includeResolution = TemplateIncludeResolver::resolveAllFiles($template->files->toArray());
                $resolvedFiles = $includeResolution['files'];
                $includeErrors = $includeResolution['errors'];

                // Log include errors if any
                if (!empty($includeErrors)) {
                    \Log::warning("⚠️ [INCLUDE RESOLVER] Errors during include resolution in generateFullProject", $includeErrors);
                }

                // Global counter for %13 — continues across ALL template files within a generation
                $globalFileCounter = 0;

                // Pre-calculate db_table_file positions for %13 global counter
                // ONLY count files that actually USE %13 in their filename or output_path
                $dbTableFilePositions = [];
                $dbTableFileIdx = 0;
                foreach ($resolvedFiles as $rf) {
                    $rf = (object) $rf;
                    if (($rf->content_type ?? null) === 'zip') continue;
                    $rfGenType = ($rf->file_type ?? 'project_file');
                    $usesPercent13 = str_contains($rf->file_name ?? '', '%13') || str_contains($rf->output_path ?? '', '%13');
                    if (in_array($rfGenType, ['db_table_file', 'db_table_file_languages']) && $usesPercent13) {
                        $dbTableFilePositions[$rf->id] = $dbTableFileIdx;
                        $dbTableFileIdx++;
                    }
                }

                // Process each file in the template
                foreach ($resolvedFiles as $file) {
                    // Convert back to object if needed for compatibility
                    $file = (object) $file;

                    // 🎯 Skip ZIP files - they are handled client-side in CodeGenerationPanel
                    if (($file->content_type ?? null) === 'zip') {
                        continue;
                    }

                    $fileType = $file->file_type ?? 'project_file';
                    $filePosition = $dbTableFilePositions[$file->id] ?? 0;

                    if ($fileType === 'db_table_file' || $fileType === 'db_table_file_languages') {
                        // Generate for each table
                        if (empty($tablesFromGtree)) {
                            \Log::warning("⚠️ Skipping db_table_file because no tables available", [
                                'file' => $file->file_name
                            ]);
                            continue;
                        }

                        // Build schema-relative counters
                        $schemaCounters = [];
                        $schemaCounts = [];
                        $tableSchemaMap = [];
                        foreach ($tablesFromGtree as $gt) {
                            $sid = $gt['schemaid'] ?? 'default';
                            $schemaCounts[$sid] = ($schemaCounts[$sid] ?? 0) + 1;
                        }
                        foreach ($tablesFromGtree as $gt) {
                            $tName = $gt['filename'] ?? $gt['tablename'] ?? null;
                            $sid = $gt['schemaid'] ?? 'default';
                            if ($tName) {
                                $schemaCounters[$sid] = ($schemaCounters[$sid] ?? 0) + 1;
                                $tableSchemaMap[$tName] = ['index' => $schemaCounters[$sid], 'total' => $schemaCounts[$sid]];
                            }
                        }

                        foreach ($tablesFromGtree as $tblIdx => $tableData) {
                            $tableName = $tableData['filename'] ?? $tableData['tablename'] ?? null;
                            if (!$tableName) continue;

                            $languagesToProcess = ($fileType === 'db_table_file_languages') ? $languageCodes : ['en'];
                            $schemaInfo = $tableSchemaMap[$tableName] ?? null;
                            $seqCounter = $schemaInfo ? $schemaInfo['index'] : ($tblIdx + 1);
                            $seqTotal = $schemaInfo ? $schemaInfo['total'] : count($tablesFromGtree);

                            foreach ($languagesToProcess as $languageCode) {
                                $result = $this->processTemplateFile(
                                    $engine,
                                    $file,
                                    $gtreeData,
                                    true, // compile
                                    $tableName,
                                    $languageCode,
                                    false, // includeSource
                                    $tblIdx,
                                    $globalFileCounter,
                                    $filePosition,
                                    $seqCounter,
                                    $seqTotal
                                );

                                // Defense-in-depth: skip files whose table was excluded at schema level.
                                if (!empty($result['skipped'])) {
                                    $completedOperations++;
                                    continue;
                                }

                                if (!$result['has_syntax_errors']) {
                                    // 🎯 Execute JavaScript to get actual output with language context
                                    $output = $this->executeJavaScript($result['compiled_content'], $gtreeData, $languageCode);

                                    // 🔧 Apply code adjustments
                                    $output = $this->applyCodeAdjustments(
                                        $output,
                                        $result['filename'],
                                        $projectId,
                                        $tableName,
                                        $languageCode,
                                        $adjustmentWarnings,
                                        $template->id,
                                        $result['output_path'] ?? null
                                    );

                                    $generatedFiles[] = [
                                        'path' => $result['output_path'],
                                        'filename' => $result['filename'],
                                        'content' => $output,
                                        'template' => $template->name,
                                        'table' => $tableName,
                                        'table_index' => $tblIdx,
                                        'language' => $languageCode,
                                    ];
                                } else {
                                    // ❌ Collect syntax errors
                                    foreach ($result['syntax_errors'] as $error) {
                                        $syntaxErrors[] = [
                                            'file' => $result['filename'],
                                            'template' => $template->name,
                                            'table' => $tableName,
                                            'language' => $languageCode,
                                            'error' => $error,
                                        ];
                                    }
                                    \Log::warning("⚠️ Syntax errors in file", [
                                        'file' => $result['filename'],
                                        'errors' => $result['syntax_errors'],
                                    ]);
                                }

                                $completedOperations++;
                            }
                        }
                    } elseif ($fileType === 'project_file_languages') {
                        // Generate for each language
                        foreach ($languageCodes as $languageCode) {
                            $result = $this->processTemplateFile(
                                $engine,
                                $file,
                                $gtreeData,
                                true, // compile
                                null,
                                $languageCode,
                                false, // includeSource
                                0,
                                $globalFileCounter
                            );

                            if (!$result['has_syntax_errors']) {
                                // 🎯 Execute JavaScript to get actual output with language context
                                $output = $this->executeJavaScript($result['compiled_content'], $gtreeData, $languageCode);

                                // 🔧 Apply code adjustments
                                $output = $this->applyCodeAdjustments(
                                    $output,
                                    $result['filename'],
                                    $projectId,
                                    null,
                                    $languageCode,
                                    $adjustmentWarnings,
                                    $template->id,
                                    $result['output_path'] ?? null
                                );

                                $generatedFiles[] = [
                                    'path' => $result['output_path'],
                                    'filename' => $result['filename'],
                                    'content' => $output,
                                    'template' => $template->name,
                                    'language' => $languageCode,
                                ];
                            } else {
                                // ❌ Collect syntax errors
                                foreach ($result['syntax_errors'] as $error) {
                                    $syntaxErrors[] = [
                                        'file' => $result['filename'],
                                        'template' => $template->name,
                                        'language' => $languageCode,
                                        'error' => $error,
                                    ];
                                }
                                \Log::warning("⚠️ Syntax errors in file", [
                                    'file' => $result['filename'],
                                    'errors' => $result['syntax_errors'],
                                ]);
                            }

                            $completedOperations++;
                        }
                    } else {
                        // Generate once (project_file)
                        $result = $this->processTemplateFile(
                            $engine,
                            $file,
                            $gtreeData,
                            true, // compile
                            null,
                            null,
                            false, // includeSource
                            0,
                            $globalFileCounter
                        );

                        if (!$result['has_syntax_errors']) {
                            // 🎯 Execute JavaScript to get actual output (no specific language)
                            $output = $this->executeJavaScript($result['compiled_content'], $gtreeData, null);

                            // 🔧 Apply code adjustments
                            $output = $this->applyCodeAdjustments(
                                $output,
                                $result['filename'],
                                $projectId,
                                null,
                                null,
                                $adjustmentWarnings,
                                $template->id,
                                $result['output_path'] ?? null
                            );

                            $generatedFiles[] = [
                                'path' => $result['output_path'],
                                'filename' => $result['filename'],
                                'content' => $output,
                                'template' => $template->name,
                            ];
                        } else {
                            // ❌ Collect syntax errors
                            foreach ($result['syntax_errors'] as $error) {
                                $syntaxErrors[] = [
                                    'file' => $result['filename'],
                                    'template' => $template->name,
                                    'error' => $error,
                                ];
                            }
                            \Log::warning("⚠️ Syntax errors in file", [
                                'file' => $result['filename'],
                                'errors' => $result['syntax_errors'],
                            ]);
                        }

                        $completedOperations++;
                    }
                }
            }

            // ⚠️ Log all syntax errors (if any)
            if (!empty($syntaxErrors)) {
                \Log::warning("⚠️ Syntax errors found during generation", [
                    'total_errors' => count($syntaxErrors),
                    'errors' => $syntaxErrors,
                ]);
            }

            // Write files to temp directory
            foreach ($generatedFiles as $fileData) {
                // 🔧 REPLACE PLACEHOLDERS IN DIRECTORY PATH
                $outputPath = $fileData['path'];

                // Apply same placeholder replacements to directory path
                $tableName = $fileData['table'] ?? null;
                $languageCode = $fileData['language'] ?? null;

                $tableIdx = $fileData['table_index'] ?? 0;

                // Use the same parameterized placeholder logic as replaceFilenamePlaceholders
                $now = now();
                $y = $now->format('Y'); $mo = $now->format('m'); $d = $now->format('d');
                $h = $now->format('H'); $mi = $now->format('i'); $s = $now->format('s');
                $counter = $tableIdx + 1;

                // Process parameterized placeholders first
                $outputPath = preg_replace_callback('/%6(?:\[(.{1,2})\])?/', function($m) use ($y, $mo, $d) {
                    $param = $m[1] ?? ''; $sep = strlen($param) > 0 ? $param[0] : '';
                    $fmt = strlen($param) > 1 ? strtoupper($param[1]) : '';
                    if ($fmt === 'U') return $mo . $sep . $d . $sep . $y;
                    if ($fmt === 'E') return $d . $sep . $mo . $sep . $y;
                    return $y . $sep . $mo . $sep . $d;
                }, $outputPath);
                $outputPath = preg_replace_callback('/%7(?:\[(.)\])?/', function($m) use ($h, $mi, $s) {
                    $sep = $m[1] ?? ''; return $h . $sep . $mi . $sep . $s;
                }, $outputPath);
                $outputPath = preg_replace_callback('/%8(?:\[(.)\])?/', function($m) use ($y, $mo, $d, $h, $mi, $s) {
                    $sep = $m[1] ?? ''; return $y . $sep . $mo . $sep . $d . '_' . $h . $sep . $mi . $sep . $s;
                }, $outputPath);
                $outputPath = preg_replace_callback('/%12(?:\[(.)(\\d{1,2})\])?/', function($m) use ($counter) {
                    if (isset($m[1]) && isset($m[2])) return str_pad((string)$counter, (int)$m[2], $m[1], STR_PAD_LEFT);
                    return (string)$counter;
                }, $outputPath);
                // %13 is already resolved in processTemplateFile, no additional handling needed here

                // %9 / %9[u|l|c|p|n] — project name with optional format suffix.
                // Must run before the generic str_replace so the bracket suffix is parsed,
                // not matched as literal text.
                $outputPath = ProjectNamePlaceholder::resolve($outputPath, (string)($project->name ?? ''));

                // Simple placeholders
                // %14 carries what was previously named %9 (project DB version).
                $replacements = [
                    '%14' => '1',
                    '%11' => strtoupper($tableName ?? 'UNKNOWN'),
                    '%10' => str_replace('_', '', ucwords(strtolower($tableName ?? 'unknown'), '_')),
                    '%1' => $tableName ?? 'unknown',
                    '%2' => $languageCode ?? 'en',
                    '%3' => $languageCode ?? 'English',
                    '%4' => $languageCode ?? 'en',
                    '%5' => $fileData['template'] ?? 'template',
                ];

                $outputPath = str_replace(array_keys($replacements), array_values($replacements), $outputPath);

                $filePath = $tempDir . '/' . ltrim($outputPath . '/' . $fileData['filename'], '/');
                $fileDir = dirname($filePath);

                if (!file_exists($fileDir)) {
                    mkdir($fileDir, 0755, true);
                }

                file_put_contents($filePath, $fileData['content']);
            }

            // ⚠️ Write ERRORS.txt if there were syntax errors
            if (!empty($syntaxErrors)) {
                $errorsContent = "🚨 SYNTAX ERRORS FOUND DURING GENERATION\n";
                $errorsContent .= "==========================================\n\n";
                $errorsContent .= "Total Errors: " . count($syntaxErrors) . "\n\n";

                foreach ($syntaxErrors as $index => $errorData) {
                    $errorsContent .= "Error #" . ($index + 1) . ":\n";
                    $errorsContent .= "  File: " . $errorData['file'] . "\n";
                    $errorsContent .= "  Template: " . $errorData['template'] . "\n";
                    if (isset($errorData['table'])) {
                        $errorsContent .= "  Table: " . $errorData['table'] . "\n";
                    }
                    if (isset($errorData['language'])) {
                        $errorsContent .= "  Language: " . $errorData['language'] . "\n";
                    }
                    $errorsContent .= "  Error: " . $errorData['error'] . "\n\n";
                }

                file_put_contents($tempDir . '/ERRORS.txt', $errorsContent);
            }

            // Create permanent storage directory for generated projects
            $generatedProjectsDir = storage_path('app/generated-projects');
            if (!file_exists($generatedProjectsDir)) {
                mkdir($generatedProjectsDir, 0755, true);
            }

            // Get next generation number for this project
            $generationNumber = ProjectGeneration::getNextGenerationNumber($projectId);

            // Create filename with project_id and generation_number
            $zipFilename = sprintf(
                'project_%d_%s_gen%d_%s.zip',
                $projectId,
                preg_replace('/[^a-zA-Z0-9_-]/', '_', $project->name),
                $generationNumber,
                date('Y-m-d_His')
            );
            $zipPath = $generatedProjectsDir . '/' . $zipFilename;

            $zip = new \ZipArchive();

            if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== TRUE) {
                throw new \Exception('Could not create ZIP file');
            }

            // Add all files to ZIP
            $files = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($tempDir),
                \RecursiveIteratorIterator::LEAVES_ONLY
            );

            $filesCount = 0;
            foreach ($files as $file) {
                if (!$file->isDir()) {
                    $filePath = $file->getRealPath();
                    $relativePath = substr($filePath, strlen($tempDir) + 1);
                    $zip->addFile($filePath, $relativePath);
                    $filesCount++;
                }
            }

            $zip->close();

            // Clean up temp directory
            $this->deleteDirectory($tempDir);

            // Get file size after ZIP is closed
            $zipFileSize = filesize($zipPath);

            // Extract table names for metadata
            $tableNames = array_map(function($table) {
                return $table['databasename'] ?? $table['name'] ?? 'unknown';
            }, $tablesFromGtree);

            // Get template names
            $templateNames = $templates->pluck('name')->toArray();
            $primaryTemplateName = $templateNames[0] ?? null;
            $primaryTemplateId = $templateIds[0] ?? null;

            // Get the current schema version for the project (via project_schemas join)
            $currentSchemaVersion = null;
            $projectSchema = \DB::table('project_schemas')
                ->where('project_id', $projectId)
                ->first();

            if ($projectSchema) {
                $currentSchemaVersion = SchemaVersion::where('schema_id', $projectSchema->schema_id)
                    ->orderBy('version_number', 'desc')
                    ->first();
            }

            // Determine generation status
            $generationStatus = empty($syntaxErrors) ? 'completed' : (count($syntaxErrors) > count($generatedFiles) ? 'failed' : 'partial');

            // Create ProjectGeneration record
            $generation = ProjectGeneration::create([
                'project_id' => $projectId,
                'schema_version_id' => $currentSchemaVersion?->id,
                'user_id' => $user?->id,
                'generation_number' => $generationNumber,
                'filename' => $zipFilename,
                'file_path' => $zipPath,
                'archive_type' => 'zip',
                'file_size' => $zipFileSize,
                'languages' => $languageCodes,
                'tables' => $tableNames,
                'tables_count' => count($tableNames),
                'files_count' => $filesCount,
                'template_id' => $primaryTemplateId,
                'template_name' => $primaryTemplateName,
                'status' => $generationStatus,
                'notes' => !empty($syntaxErrors) ? count($syntaxErrors) . ' syntax error(s) during generation' : null,
            ]);

            $executionTime = round((microtime(true) - $startTime) * 1000, 2);

            // Track performance metrics
            try {
                $tablesCount = count($tablesFromGtree ?? []);
                $fieldsCount = 0;
                foreach (($tablesFromGtree ?? []) as $table) {
                    $fieldsCount += count($table['fields'] ?? []);
                }

                // Get cache hit stats from cache service
                $cacheStats = $cacheService ? $cacheService->getHitStats() : ['hits' => 0, 'misses' => 0, 'total' => 0, 'hit_rate' => 0];

                PerformanceMetric::create([
                    'user_id' => $user?->id,
                    'operation' => PerformanceMetric::OP_GENERATION,
                    'operation_detail' => $project->name . ' (' . count($templates) . ' templates)',
                    'duration_ms' => (int) $executionTime,
                    'memory_peak_mb' => (int) (memory_get_peak_usage(true) / 1024 / 1024),
                    'tables_count' => $tablesCount,
                    'fields_count' => $fieldsCount,
                    'from_cache' => $cacheStats['hits'] > 0,
                    'subscription_type' => $user?->subscription?->type ?? ($user?->isPatron() ? 'patron' : 'free'),
                    'metadata' => [
                        'template_count' => count($templates),
                        'files_generated' => count($generatedFiles),
                        'syntax_errors' => count($syntaxErrors),
                        'cache_hits' => $cacheStats['hits'],
                        'cache_misses' => $cacheStats['misses'],
                        'cache_hit_rate' => $cacheStats['hit_rate'],
                    ],
                    'created_at' => now(),
                ]);
            } catch (\Exception $trackingError) {
                \Log::error("❌ Performance tracking failed: " . $trackingError->getMessage() . " | Trace: " . $trackingError->getTraceAsString());
            }

            // Return download response with error information in headers
            // NOTE: File is NOT deleted after send - kept for future comparisons
            $headers = [
                'Content-Type' => 'application/zip',
                'X-Generation-Errors' => count($syntaxErrors),
                'X-Generation-Files' => count($generatedFiles),
                'X-Generation-Id' => $generation->id,
                'X-Generation-Number' => $generationNumber,
            ];

            // If there are errors, encode them in base64 for header (limited to first 10 errors to avoid header size limits)
            if (!empty($syntaxErrors)) {
                $limitedErrors = array_slice($syntaxErrors, 0, 10);
                $headers['X-Generation-Error-Details'] = base64_encode(json_encode($limitedErrors));
                if (count($syntaxErrors) > 10) {
                    $headers['X-Generation-Error-More'] = count($syntaxErrors) - 10;
                }
            }

            // Return download - file is kept for Code Adjustments comparison feature
            return response()->download($zipPath, $zipFilename, $headers);

        } catch (\Exception $e) {
            \Log::error("❌ Full project generation failed", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => 'Generation failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 🎯 EXECUTE JAVASCRIPT AND GET OUTPUT
     *
     * Executes the generated JavaScript function with gtree data and returns the output
     */
    private function executeJavaScript(string $jsCode, array $gtreeData, ?string $languageCode = null): string
    {
        // Check if Node.js is available
        $nodeCheck = shell_exec('node --version 2>&1');
        if (empty($nodeCheck) || strpos($nodeCheck, 'not found') !== false) {
            // Node.js not available, return the JavaScript code as-is
            \Log::warning("⚠️ Node.js not available, returning JavaScript code instead of executed output");
            return $jsCode;
        }

        try {
            // 🎯 MODIFY GTREE: Update selectedlanguage and selectedlanguageindex if language code provided
            if ($languageCode !== null && isset($gtreeData['gtree'][0]['project'][0])) {
                $languages = $gtreeData['gtree'][0]['project'][0]['lang'] ?? [];

                // Find language index by code
                foreach ($languages as $index => $lang) {
                    if ($lang['code'] === $languageCode) {
                        $gtreeData['gtree'][0]['project'][0]['selectedlanguage'] = $languageCode;
                        $gtreeData['gtree'][0]['project'][0]['selectedlanguageindex'] = $index;
                        break;
                    }
                }
            }

            // Extract function name from JavaScript code
            // Function format: "function generate_filename() {"
            preg_match('/function\s+([a-zA-Z0-9_]+)\s*\(\)/', $jsCode, $matches);
            $functionName = $matches[1] ?? 'generate';

            // Create temporary files - use .cjs for CommonJS compatibility
            $tempScriptPath = storage_path('app/temp/exec_' . uniqid() . '.cjs');
            $tempGtreePath = storage_path('app/temp/gtree_' . uniqid() . '.json');

            // Normalize path for Windows (use forward slashes for Node.js)
            $normalizedGtreePath = str_replace('\\', '/', $tempGtreePath);

            // Prepare the JavaScript execution wrapper
            $executionScript = <<<JS
// Load gtree data
const fs = require('fs');
const gtree = JSON.parse(fs.readFileSync('$normalizedGtreePath', 'utf8'));

// Inject generated function
$jsCode

// Execute function and output result
try {
    const result = $functionName();
    console.log(result);
} catch (error) {
    console.error('Execution error:', error.message);
    process.exit(1);
}
JS;

            // Write files
            file_put_contents($tempScriptPath, $executionScript);
            file_put_contents($tempGtreePath, json_encode($gtreeData['gtree']));

            // Execute Node.js
            $output = shell_exec("node \"$tempScriptPath\" 2>&1");

            // Clean up
            @unlink($tempScriptPath);
            @unlink($tempGtreePath);

            if (empty($output)) {
                \Log::warning("⚠️ JavaScript execution returned empty output");
                return $jsCode;
            }

            return $output;

        } catch (\Exception $e) {
            \Log::error("❌ JavaScript execution failed", [
                'error' => $e->getMessage(),
            ]);
            return $jsCode;
        }
    }

    /**
     * 🚀 BATCH TEMPLATE PROCESSING
     *
     * Process templates for multiple tables in a single request
     * Massive performance improvement: 1 HTTP request instead of 36+
     *
     * @param Request $request - Body: { tables: string[], project_id: int, language_code?: string }
     * @param int $templateId
     * @return JsonResponse
     */
    public function processTemplateBatch(Request $request, int $templateId): JsonResponse
    {
        $startTime = microtime(true);

        // 🧹 CRITICAL: Clear memory from previous request in same PHP worker
        gc_collect_cycles();
        if (function_exists('gc_mem_caches')) {
            gc_mem_caches(); // PHP 7.0+ - Clear internal caches
        }

        // 🔥 DISABLE QUERY LOGGING: Massive memory saver!
        \DB::connection()->disableQueryLog();

        try {
            // Validate template exists
            $template = Template::with('files')->find($templateId);
            if (!$template) {
                return response()->json([
                    'error' => 'Template not found',
                    'template_id' => $templateId
                ], 404);
            }

            // Get request parameters
            $tables = $request->input('tables', []); // Array of table names (or null for project files)
            $projectId = $request->input('project_id');
            $languageCode = $request->input('language_code', null);
            $compile = $request->input('compile', true);
            $includeSource = $request->input('include_source', false);
            $includeGtree = $request->input('include_gtree', false); // 🚀 NEW: Only send gtree when requested!
            $migrationFromVersions = $request->input('migration_from_versions'); // 📊 Per-schema migration versions
            $schemaIds = $request->input('schema_ids'); // 🎯 Filter: Only include selected schemas
            $batchOffset = (int) $request->input('batch_offset', 0); // %12: offset of first table in this batch
            $totalTablesAcrossBatches = (int) $request->input('total_tables', 0); // %13: total tables across ALL batches

            if (!$projectId) {
                return response()->json([
                    'error' => 'project_id is required'
                ], 400);
            }

            // Initialize cache service
            // skip_cache=1 bypasses Redis cache for debugging/testing
            $skipCache = $request->input('skip_cache', false);
            $cacheService = (!$skipCache && config('scoriet.template_cache.enabled', false)) ? app(TemplateCacheService::class) : null;

            // 🚀 OPTIMIZATION: Cache gtree in Redis (MASSIVE PERFORMANCE BOOST!)
            // Build gtree only ONCE per project+template, reuse for 24 hours
            $schemaIdsSorted = is_array($schemaIds) ? $schemaIds : [];
            sort($schemaIdsSorted);
            $schemaIdsHash = !empty($schemaIdsSorted) ? ':s' . implode('-', $schemaIdsSorted) : '';
            $gtreeCacheKey = "gtree:{$projectId}:{$templateId}{$schemaIdsHash}";
            $gtreeData = null;

            // Try to get from cache first
            $gtreeFromCache = false;
            if ($cacheService) {
                $cachedGtree = \Cache::get($gtreeCacheKey);
                if ($cachedGtree) {
                    $gtreeData = ['gtree' => $cachedGtree];
                    $gtreeFromCache = true;
                }
            }

            // Build gtree if not cached
            if (!$gtreeData) {
                $gtreeData = $this->buildUltimateGtree($projectId, $templateId, $template, $migrationFromVersions, null, null, $schemaIds);

                // Cache for 24 hours
                if ($cacheService) {
                    \Cache::put($gtreeCacheKey, $gtreeData['gtree'], now()->addHours(24));
                }
            }

            $engine = new UltimateTemplateEngine($gtreeData['gtree']);

            // 🔗 INCLUDE RESOLUTION: Resolve {:include: path/file.ext:} patterns ONCE before processing all tables
            $includeResolution = TemplateIncludeResolver::resolveAllFiles($template->files->toArray());
            $resolvedFiles = $includeResolution['files'];
            $includeErrors = $includeResolution['errors'];

            // Log include errors if any
            if (!empty($includeErrors)) {
                \Log::warning("⚠️ [INCLUDE RESOLVER] Errors during include resolution in processTemplateBatch", $includeErrors);
            }

            // Process each table
            $results = [];
            $tableCount = 0;
            $totalBatchTables = $totalTablesAcrossBatches > 0 ? $totalTablesAcrossBatches : count($tables); // %13 total
            $batchTableIndex = $batchOffset; // Start from offset position within full table list

            // Build schema-relative table index lookup for %12/%13 counters
            // Groups tables by schemaid so counter starts at 1 per schema, not globally
            $gtreeTables = $gtreeData['gtree'][0]['project'][0]['tables'] ?? [];
            $schemaTableCounters = []; // schemaid → next counter (1-based)
            $tableSchemaIndex = [];    // tablename → [schemaRelativeIndex (1-based), schemaTableCount]
            $schemaTableCounts = [];   // schemaid → total table count
            // First pass: count tables per schema
            foreach ($gtreeTables as $gt) {
                $sid = $gt['schemaid'] ?? 'default';
                $schemaTableCounts[$sid] = ($schemaTableCounts[$sid] ?? 0) + 1;
            }
            // Second pass: assign schema-relative indices
            foreach ($gtreeTables as $gt) {
                $tName = $gt['filename'] ?? $gt['tablename'] ?? null;
                $sid = $gt['schemaid'] ?? 'default';
                if ($tName) {
                    $schemaTableCounters[$sid] = ($schemaTableCounters[$sid] ?? 0) + 1;
                    $tableSchemaIndex[$tName] = [
                        'index' => $schemaTableCounters[$sid], // 1-based
                        'total' => $schemaTableCounts[$sid],
                    ];
                }
            }

            // Pre-calculate db_table_file positions for %13 global counter
            // ONLY count files that actually USE %13 in their filename or output_path
            $dbTableFilePositions = [];
            $dbTableFileIdx = 0;
            foreach ($resolvedFiles as $rf) {
                $rf = (object) $rf;
                if (($rf->content_type ?? null) === 'zip') continue;
                $rfGenType = $this->determineGenerationType($rf);
                $usesPercent13 = str_contains($rf->file_name ?? '', '%13') || str_contains($rf->output_path ?? '', '%13');
                if (in_array($rfGenType, ['db_table_file', 'db_table_file_languages']) && $usesPercent13) {
                    $dbTableFilePositions[$rf->id] = $dbTableFileIdx;
                    $dbTableFileIdx++;
                }
            }

            foreach ($tables as $tableName) {
                $tableCount++;
                $batchTableIndex++;

                // Schema-relative counter for %12/%13 (starts at 1 per schema, not globally)
                $schemaInfo = $tableSchemaIndex[$tableName] ?? null;
                $seqCounter = $schemaInfo ? $schemaInfo['index'] : $batchTableIndex;
                $seqTotal = $schemaInfo ? $schemaInfo['total'] : $totalBatchTables;

                try {

                    // Process template files for this table
                    $processedFiles = [];

                    foreach ($resolvedFiles as $file) {
                        // Convert back to object if needed for compatibility
                        $file = (object) $file;

                        // Skip ZIP files
                        if (($file->content_type ?? null) === 'zip') {
                            continue;
                        }

                        // In batch mode (per-table loop), only process DB table files
                        // Static files, project files, and static directories are NOT per-table
                        // They are handled separately by the frontend
                        $fileGenerationType = $this->determineGenerationType($file);
                        if (!in_array($fileGenerationType, ['db_table_file', 'db_table_file_languages'])) {
                            continue;
                        }

                        $filePosition = $dbTableFilePositions[$file->id] ?? 0;

                        // Try cache first
                        $fileResult = null;
                        if ($cacheService && $compile) {
                            try {
                                $fileResult = $cacheService->getOrCompile(
                                    templateId: $templateId,
                                    fileId: $file->id,
                                    tableName: $tableName,
                                    languageCode: $languageCode,
                                    compileCallback: function() use ($engine, $file, $gtreeData, $compile, $tableName, $languageCode, $includeSource, $batchTableIndex, $totalBatchTables, $filePosition, $seqCounter, $seqTotal) {
                                        $gfc = $totalBatchTables;
                                        return $this->processTemplateFile($engine, $file, $gtreeData, $compile, $tableName, $languageCode, $includeSource, $batchTableIndex, $gfc, $filePosition, $seqCounter, $seqTotal);
                                    }
                                );
                            } catch (\Exception $e) {
                                \Log::warning("⚠️ [BATCH CACHE ERROR] file {$file->id}: {$e->getMessage()}");
                                $fileResult = null;
                            }
                        }

                        // Fallback: compile without cache
                        if (!$fileResult) {
                            $gfc = $totalBatchTables;
                            $fileResult = $this->processTemplateFile($engine, $file, $gtreeData, $compile, $tableName, $languageCode, $includeSource, $batchTableIndex, $gfc, $filePosition, $seqCounter, $seqTotal);
                        }

                        // Skip files whose table was excluded at schema level.
                        if (!empty($fileResult['skipped'])) {
                            unset($fileResult);
                            continue;
                        }

                        $processedFiles[] = $fileResult;

                        // 🧹 AGGRESSIVE MEMORY CLEANUP: Clear file result after adding
                        unset($fileResult);
                    }

                    // Store result for this table (WITHOUT gtree to save memory!)
                    $tableKey = $tableName ?? 'project';
                    $results[$tableKey] = [
                        'table_name' => $tableName,
                        'compiled_templates' => $processedFiles,
                    ];

                    // 🧹 AGGRESSIVE MEMORY CLEANUP: Clear processed files after storing
                    unset($processedFiles);

                    // 🧹 Force garbage collection every 2 tables
                    if ($tableCount % 2 === 0) {
                        gc_collect_cycles();
                    }

                } catch (\Exception $e) {
                    \Log::error("❌ [BATCH] Failed to process table {$tableName}", [
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);

                    $tableKey = $tableName ?? 'project';
                    $results[$tableKey] = [
                        'table_name' => $tableName,
                        'error' => $e->getMessage(),
                    ];
                }
            }

            $executionTime = round((microtime(true) - $startTime) * 1000, 2);

            // Get cache hit stats before cleanup
            $cacheStats = $cacheService ? $cacheService->getHitStats() : ['hits' => 0, 'misses' => 0, 'total' => 0, 'hit_rate' => 0];

            // 🔖 GENERATION HASH — only on first batch (include_gtree is true only for first batch)
            // Format: {projectname}_t{template_version}_s{schema_version}_{hash8chars}.zip
            $generationInfo = null;
            if ($includeGtree) {
                $genTemplateVersion = $template->version ?? 1;
                $genFilesVersionSum = $template->files->sum('version') ?: $template->files->count();
                $genSchemaVersion   = !empty($schemaIdsSorted)
                    ? (\DB::table('schema_versions')->whereIn('schema_id', $schemaIdsSorted)->max('version_number') ?? 1)
                    : 1;
                $genTimestamp  = (int)(microtime(true) * 1000);
                $genPayload    = json_encode([
                    'template_version' => $genTemplateVersion,
                    'template_files'   => $genFilesVersionSum,
                    'schema_version'   => $genSchemaVersion,
                    'timestamp'        => $genTimestamp,
                ]);
                $genHashFull   = hash('sha256', $genPayload);
                $genHashShort  = substr($genHashFull, 0, 8);
                $genProjectName = preg_replace('/[^a-zA-Z0-9_-]/', '_',
                    \DB::table('projects')->where('id', $projectId)->value('name') ?? 'project'
                );
                $genFilename = "{$genProjectName}_t{$genTemplateVersion}_s{$genSchemaVersion}_{$genHashShort}.zip";

                try {
                    \App\Models\GenerationLog::create([
                        'project_id'        => $projectId,
                        'template_id'       => $templateId,
                        'schema_ids'        => $schemaIdsSorted,
                        'template_version'  => $genTemplateVersion,
                        'files_version_sum' => $genFilesVersionSum,
                        'schema_version'    => $genSchemaVersion,
                        'hash_timestamp'    => $genTimestamp,
                        'hash_full'         => $genHashFull,
                        'hash_short'        => $genHashShort,
                        'filename'          => $genFilename,
                    ]);
                } catch (\Exception $e) {
                    \Log::warning("GenerationLog write failed: {$e->getMessage()}");
                }

                $generationInfo = [
                    'template_version'  => $genTemplateVersion,
                    'files_version_sum' => $genFilesVersionSum,
                    'schema_version'    => $genSchemaVersion,
                    'hash_short'        => $genHashShort,
                    'filename'          => $genFilename,
                ];
            }

            // 📊 Track performance metric for batch processing
            $user = auth()->user();
            try {
                PerformanceMetric::create([
                    'user_id' => $user?->id,
                    'operation' => PerformanceMetric::OP_GENERATION,
                    'operation_detail' => "Batch: {$templateId} ({$tableCount} tables)",
                    'duration_ms' => (int) $executionTime,
                    'memory_peak_mb' => (int) (memory_get_peak_usage(true) / 1024 / 1024),
                    'tables_count' => count($tables),
                    'fields_count' => null,
                    'from_cache' => $gtreeFromCache || ($cacheStats['hits'] > 0),
                    'subscription_type' => $user?->subscription?->type ?? ($user?->isPatron() ? 'patron' : 'free'),
                    'metadata' => [
                        'batch' => true,
                        'gtree_from_cache' => $gtreeFromCache,
                        'cache_hits' => $cacheStats['hits'],
                        'cache_misses' => $cacheStats['misses'],
                        'cache_hit_rate' => $cacheStats['hit_rate'],
                    ],
                    'created_at' => now(),
                ]);
            } catch (\Exception $e) {
                \Log::error('Performance tracking error: ' . $e->getMessage());
            }

            // 🚀 Build response with optional gtree (MASSIVE BANDWIDTH SAVE!)
            $response = response()->json([
                'success' => true,
                'template_id' => $templateId,
                'project_id' => $projectId,
                'generation_info' => $generationInfo,
                'gtree' => $includeGtree ? $gtreeData['gtree'] : null, // 🚀 Only send 100 MB gtree when needed!
                'results' => $results,
                'performance' => [
                    'execution_time_ms' => $executionTime,
                    'tables_count' => count($tables),
                    'avg_time_per_table_ms' => count($tables) > 0 ? round($executionTime / count($tables), 2) : 0,
                    'gtree_from_cache' => $gtreeFromCache,
                    'cache_hits' => $cacheStats['hits'],
                    'cache_misses' => $cacheStats['misses'],
                    'cache_hit_rate' => $cacheStats['hit_rate'],
                ]
            ]);

            // 🧹 AGGRESSIVE MEMORY CLEANUP: Free everything for next request in same worker
            unset($engine, $gtreeData, $results, $template, $cacheService);

            // Clear Eloquent's model cache (prevents memory leak between requests)
            Template::clearBootedModels();
            \App\Models\SchemaTable::clearBootedModels();

            gc_collect_cycles();
            if (function_exists('gc_mem_caches')) {
                gc_mem_caches();
            }

            // Re-enable query logging for other requests
            \DB::connection()->enableQueryLog();

            return $response;

        } catch (\Exception $e) {
            \Log::error("❌ [BATCH] Fatal error", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Re-enable query logging even on error
            \DB::connection()->enableQueryLog();

            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Helper: Recursively delete directory
     */
    private function deleteDirectory($dir): bool
    {
        if (!file_exists($dir)) {
            return true;
        }

        if (!is_dir($dir)) {
            return unlink($dir);
        }

        foreach (scandir($dir) as $item) {
            if ($item == '.' || $item == '..') {
                continue;
            }

            if (!$this->deleteDirectory($dir . DIRECTORY_SEPARATOR . $item)) {
                return false;
            }
        }

        return rmdir($dir);
    }

    /**
     * 🖥️ CLI GENERATION
     *
     * Generate code for CLI client
     * Returns generated files and gtree without creating archive
     *
     * @param int $projectId
     * @param int $templateId
     * @return array
     */
    public function generateForCli(int $projectId, int $templateId): array
    {
        try {
            // Get project and template
            $project = Project::find($projectId);
            $template = Template::with('files')->find($templateId);

            if (!$project || !$template) {
                return [
                    'success' => false,
                    'errors' => ['Project or template not found'],
                ];
            }

            // Build gtree and generate code
            $gtreeData = $this->buildUltimateGtree($projectId, $templateId, $template);

            // buildUltimateGtree returns ['gtree' => ...], not ['success' => ...]
            if (!isset($gtreeData['gtree']) || empty($gtreeData['gtree'])) {
                return [
                    'success' => false,
                    'errors' => ['Failed to build generation tree - no gtree data'],
                ];
            }

            // Generate files using template engine
            $engine = new UltimateTemplateEngine($gtreeData['gtree']);
            $generatedFiles = [];

            // 🔗 INCLUDE RESOLUTION: Resolve {:include: path/file.ext:} patterns before processing
            $includeResolution = TemplateIncludeResolver::resolveAllFiles($template->files->toArray());
            $resolvedFiles = $includeResolution['files'];
            $includeErrors = $includeResolution['errors'];

            // Log include errors if any
            if (!empty($includeErrors)) {
                \Log::warning("⚠️ [INCLUDE RESOLVER] Errors during include resolution in generateForCli", $includeErrors);
            }

            // 🎯 Extract tables and languages from gtree for per-table/per-language generation
            $tablesFromGtree = $gtreeData['gtree'][0]['project'][0]['tables'] ?? [];
            $languagesFromGtree = $gtreeData['gtree'][0]['project'][0]['lang'] ?? [];
            $languageCodes = !empty($languagesFromGtree)
                ? array_column($languagesFromGtree, 'code')
                : ['en'];

            // Global counter for %13 — continues across ALL template files within a generation
            $globalFileCounter = 0;

            // Pre-calculate db_table_file positions for %13 global counter
            // ONLY count files that actually USE %13 in their filename or output_path
            $dbTableFilePositions = [];
            $dbTableFileIdx = 0;
            foreach ($resolvedFiles as $rf) {
                $rf = (object) $rf;
                if (($rf->content_type ?? null) === 'zip') continue;
                $rfGenType = ($rf->file_type ?? 'project_file');
                $usesPercent13 = str_contains($rf->file_name ?? '', '%13') || str_contains($rf->output_path ?? '', '%13');
                if (in_array($rfGenType, ['db_table_file', 'db_table_file_languages']) && $usesPercent13) {
                    $dbTableFilePositions[$rf->id] = $dbTableFileIdx;
                    $dbTableFileIdx++;
                }
            }

            foreach ($resolvedFiles as $templateFile) {
                // Convert back to object if needed for compatibility
                $templateFile = (object) $templateFile;

                try {
                    // 🎯 Skip ZIP files - they are handled client-side
                    if (($templateFile->content_type ?? null) === 'zip') {
                        continue;
                    }

                    $fileType = $templateFile->file_type ?? 'project_file';
                    $filePosition = $dbTableFilePositions[$templateFile->id] ?? 0;

                    // 🔥 FIX: Handle db_table_file - generate one file per table
                    if ($fileType === 'db_table_file' || $fileType === 'db_table_file_languages') {
                        // Generate for each table
                        if (empty($tablesFromGtree)) {
                            \Log::warning("⚠️ [CLI] Skipping db_table_file because no tables available", [
                                'file' => $templateFile->file_name
                            ]);
                            continue;
                        }

                        // Build schema-relative counters
                        $cliSchemaCounters = [];
                        $cliSchemaCounts = [];
                        $cliTableSchemaMap = [];
                        foreach ($tablesFromGtree as $gt) {
                            $sid = $gt['schemaid'] ?? 'default';
                            $cliSchemaCounts[$sid] = ($cliSchemaCounts[$sid] ?? 0) + 1;
                        }
                        foreach ($tablesFromGtree as $gt) {
                            $tName = $gt['filename'] ?? $gt['tablename'] ?? null;
                            $sid = $gt['schemaid'] ?? 'default';
                            if ($tName) {
                                $cliSchemaCounters[$sid] = ($cliSchemaCounters[$sid] ?? 0) + 1;
                                $cliTableSchemaMap[$tName] = ['index' => $cliSchemaCounters[$sid], 'total' => $cliSchemaCounts[$sid]];
                            }
                        }

                        foreach ($tablesFromGtree as $tblIdx => $tableData) {
                            $tableName = $tableData['filename'] ?? $tableData['tablename'] ?? null;
                            if (!$tableName) continue;

                            $languagesToProcess = ($fileType === 'db_table_file_languages') ? $languageCodes : ['en'];
                            $schemaInfo = $cliTableSchemaMap[$tableName] ?? null;
                            $seqCounter = $schemaInfo ? $schemaInfo['index'] : ($tblIdx + 1);
                            $seqTotal = $schemaInfo ? $schemaInfo['total'] : count($tablesFromGtree);

                            foreach ($languagesToProcess as $languageCode) {
                                $result = $this->processTemplateFile(
                                    $engine,
                                    $templateFile,
                                    $gtreeData,
                                    true, // compile
                                    $tableName,
                                    $languageCode,
                                    false, // includeSource
                                    $tblIdx,
                                    $globalFileCounter,
                                    $filePosition,
                                    $seqCounter,
                                    $seqTotal
                                );

                                // Defense-in-depth: skip files whose table was excluded at schema level.
                                if (!empty($result['skipped'])) {
                                    continue;
                                }

                                if (!$result['has_syntax_errors']) {
                                    // 🎯 Execute JavaScript to get actual output
                                    $output = $this->executeJavaScript($result['compiled_content'], $gtreeData, $languageCode);

                                    // Build full file path (path key must include filename for ZIP)
                                    $fullPath = trim($result['output_path'] ?? '', '/');
                                    $fullPath = $fullPath ? $fullPath . '/' . $result['filename'] : $result['filename'];

                                    $generatedFiles[] = [
                                        'path' => $fullPath,
                                        'filepath' => $fullPath,
                                        'filename' => $result['filename'],
                                        'content' => $output,
                                        'table' => $tableName,
                                        'table_index' => $tblIdx,
                                        'language' => $languageCode,
                                    ];
                                } else {
                                    \Log::warning("⚠️ [CLI] Syntax errors in file", [
                                        'file' => $result['filename'],
                                        'table' => $tableName,
                                        'errors' => $result['syntax_errors'],
                                    ]);
                                }
                            }
                        }
                    } elseif ($fileType === 'project_file_languages') {
                        // Generate for each language (no table iteration)
                        foreach ($languageCodes as $languageCode) {
                            $result = $this->processTemplateFile(
                                $engine,
                                $templateFile,
                                $gtreeData,
                                true, // compile
                                null,
                                $languageCode,
                                false, // includeSource
                                0,
                                $globalFileCounter
                            );

                            if (!$result['has_syntax_errors']) {
                                $output = $this->executeJavaScript($result['compiled_content'], $gtreeData, $languageCode);

                                // Build full file path (path key must include filename for ZIP)
                                $fullPath = trim($result['output_path'] ?? '', '/');
                                $fullPath = $fullPath ? $fullPath . '/' . $result['filename'] : $result['filename'];

                                $generatedFiles[] = [
                                    'path' => $fullPath,
                                    'filepath' => $fullPath,
                                    'filename' => $result['filename'],
                                    'content' => $output,
                                    'language' => $languageCode,
                                ];
                            } else {
                                \Log::warning("⚠️ [CLI] Syntax errors in file", [
                                    'file' => $result['filename'],
                                    'errors' => $result['syntax_errors'],
                                ]);
                            }
                        }
                    } else {
                        // project_file or static_file - generate once
                        $result = $this->processTemplateFile(
                            $engine,
                            $templateFile,
                            $gtreeData,
                            true, // compile
                            null,
                            'en',
                            false, // includeSource
                            0,
                            $globalFileCounter
                        );

                        if (!$result['has_syntax_errors']) {
                            $output = $this->executeJavaScript($result['compiled_content'], $gtreeData, 'en');

                            // Build full file path (path key must include filename for ZIP)
                            $fullPath = trim($result['output_path'] ?? '', '/');
                            $fullPath = $fullPath ? $fullPath . '/' . $result['filename'] : $result['filename'];

                            $generatedFiles[] = [
                                'path' => $fullPath,
                                'filepath' => $fullPath,
                                'filename' => $result['filename'],
                                'content' => $output,
                            ];
                        } else {
                            \Log::warning("⚠️ [CLI] Syntax errors in file", [
                                'file' => $result['filename'],
                                'errors' => $result['syntax_errors'],
                            ]);
                        }
                    }
                } catch (\Exception $e) {
                    // Log error but continue with other files
                    \Log::error("CLI Generation failed for file {$templateFile->file_name}: " . $e->getMessage());
                }
            }

            return [
                'success' => true,
                'files' => $generatedFiles,
                'gtree' => $gtreeData['gtree'],
                'files_count' => count($generatedFiles),
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'errors' => [$e->getMessage()],
            ];
        }
    }

    /**
     * 📊 BUILD MIGRATION DATA
     *
     * Generates migration SQL and structured data for template usage
     *
     * @param SchemaVersion $fromVersion Source version
     * @param SchemaVersion $toVersion Target version
     * @param Project|null $project Project for database dialect
     * @return array Migration data structure for GTree
     */
    private function buildMigrationData(SchemaVersion $fromVersion, SchemaVersion $toVersion, ?Project $project): array
    {
        try {
            // Get database dialect from project settings
            $dialect = 'mysql'; // Default
            if ($project && !empty($project->database_type)) {
                $dialect = strtolower($project->database_type);
            }

            // Normalize dialect names
            $dialect = match($dialect) {
                'postgresql', 'postgres' => 'pgsql',
                'sql server', 'mssql', 'sqlserver' => 'sqlsrv',
                default => $dialect,
            };

            // Use SchemaDiffService to compare versions
            $diffService = app(SchemaDiffService::class);
            $diffResult = $diffService->compareVersions($fromVersion->id, $toVersion->id);

            if (!$diffResult || empty($diffResult['changes'])) {
                // No changes between versions
                return [
                    'enabled' => true,
                    'from_version' => $fromVersion->version_number,
                    'to_version' => $toVersion->version_number,
                    'dialect' => $dialect,
                    'tables' => [],
                    'fields' => [],
                    'indexes' => [],
                    'foreignKeys' => [],
                    'nmaxmigration_tables' => 0,
                    'nmaxmigration_fields' => 0,
                    'nmaxmigration_indexes' => 0,
                    'nmaxmigration_foreignkeys' => 0,
                    'nmaxmigration_total' => 0,
                    'sql_complete' => "-- No changes between v{$fromVersion->version_number} and v{$toVersion->version_number}",
                ];
            }

            // Use MigrationSqlGenerator to generate dialect-specific SQL
            $sqlGenerator = new MigrationSqlGenerator();
            $groupedChanges = $sqlGenerator->getGroupedChanges($diffResult['changes'], $dialect);
            $completeScript = $sqlGenerator->generateScript(
                $diffResult['changes'],
                $dialect,
                $fromVersion->version_number,
                $toVersion->version_number
            );

            // Calculate totals
            $totalTables = count($groupedChanges['tables']);
            $totalFields = count($groupedChanges['fields']);
            $totalIndexes = count($groupedChanges['indexes']);
            $totalForeignKeys = count($groupedChanges['foreignKeys']);
            $total = $totalTables + $totalFields + $totalIndexes + $totalForeignKeys;

            return [
                'enabled' => true,
                'from_version' => $fromVersion->version_number,
                'to_version' => $toVersion->version_number,
                'dialect' => $dialect,
                'tables' => $groupedChanges['tables'],
                'fields' => $groupedChanges['fields'],
                'indexes' => $groupedChanges['indexes'],
                'foreignKeys' => $groupedChanges['foreignKeys'],
                'nmaxmigration_tables' => $totalTables,
                'nmaxmigration_fields' => $totalFields,
                'nmaxmigration_indexes' => $totalIndexes,
                'nmaxmigration_foreignkeys' => $totalForeignKeys,
                'nmaxmigration_total' => $total,
                'sql_complete' => $completeScript,
            ];

        } catch (\Exception $e) {
            \Log::error("Error building migration data: " . $e->getMessage());

            return [
                'enabled' => false,
                'error' => $e->getMessage(),
                'from_version' => $fromVersion->version_number,
                'to_version' => $toVersion->version_number,
                'dialect' => $dialect ?? 'mysql',
                'tables' => [],
                'fields' => [],
                'indexes' => [],
                'foreignKeys' => [],
                'nmaxmigration_tables' => 0,
                'nmaxmigration_fields' => 0,
                'nmaxmigration_indexes' => 0,
                'nmaxmigration_foreignkeys' => 0,
                'nmaxmigration_total' => 0,
                'sql_complete' => "-- Error: {$e->getMessage()}",
            ];
        }
    }

    /**
     * Apply code adjustments to generated output
     *
     * @param string $output The generated code output
     * @param string $filename The output filename
     * @param int $projectId The project ID
     * @param string|null $tableName Current table name (for db_table_file types)
     * @param string|null $languageCode Current language code
     * @param array &$adjustmentWarnings Reference to collect warnings
     * @return string The modified output
     */
    private function applyCodeAdjustments(
        string $output,
        string $filename,
        int $projectId,
        ?string $tableName = null,
        ?string $languageCode = null,
        array &$adjustmentWarnings = [],
        ?int $templateId = null,
        ?string $outputPath = null
    ): string {
        try {
            $service = app(\App\Services\CodeAdjustmentService::class);

            $context = [
                'tablename' => $tableName ?? '',
                'filename' => $filename,
                'languagecode' => $languageCode ?? 'en',
            ];

            // Get project name for context
            $project = \App\Models\Project::find($projectId);
            if ($project) {
                $context['projectname'] = $project->name;
            }

            // Full relative path so directory-restricted patterns
            // (e.g. `data/tables_customers.php`) only match in that folder.
            $relPath = ($outputPath !== null && $outputPath !== '')
                ? rtrim($outputPath, '/') . '/' . ltrim($filename, '/')
                : $filename;

            $result = $service->apply($output, $filename, $projectId, $context, $templateId, $relPath);

            // Collect warnings
            if (!empty($result['warnings'])) {
                foreach ($result['warnings'] as $warning) {
                    $adjustmentWarnings[] = [
                        'file' => $filename,
                        'adjustment' => $warning['name'],
                        'reason' => $warning['reason'],
                    ];
                }
            }

            return $result['content'];
        } catch (\Exception $e) {
            \Log::error("❌ Code adjustment error", [
                'file' => $filename,
                'error' => $e->getMessage(),
            ]);
            // Return original output on error (warn + continue)
            return $output;
        }
    }

    /**
     * Get existing form layout or auto-generate one for a table
     */
    private function getOrGenerateFormLayout(\App\Models\FormWindow $window, $schemaTable, ?string $language = null): array
    {
        // Check if a layout exists for this window + table
        $existing = \App\Models\FormItemPlacement::forWindowAndTable($window->id, $schemaTable->id)
            ->visible()
            ->fields()
            ->orderBy('sort_order')
            ->with(['schemaField', 'lookupTable'])
            ->get();

        if ($existing->isNotEmpty()) {
            return $existing->map(fn($p) => $p->toGTreeArray($language))->toArray();
        }

        // No layout defined — auto-generate intelligently
        return $this->autoGenerateFormLayout($window, $schemaTable, $language);
    }

    /**
     * Returns the report layout for a (ReportPatternForm, SchemaTable) pair.
     * Mirrors getOrGenerateFormLayout(): if saved ReportLayoutElement rows
     * exist for the (form, table), they're used; otherwise the algorithm in
     * ReportLayoutElement::computeAutoPlacements() produces a transient
     * placement array (no DB writes).
     */
    private function getOrGenerateReportLayout(
        \App\Models\ReportPatternForm $form,
        \App\Models\SchemaTable $schemaTable,
        ?string $language = null
    ): array {
        $saved = \App\Models\ReportLayoutElement::forFormAndTable($form->id, $schemaTable->id)
            ->visible()
            ->with(['schemaField', 'containerElement'])
            ->orderBy('sort_order')
            ->get();

        if ($saved->isNotEmpty()) {
            return $saved->map(fn($e) => $e->toGTreeArray($language))->values()->all();
        }

        // No saved layout — transient auto-generation. Fully read-only.
        return \App\Models\ReportLayoutElement::computeAutoPlacements($form, $schemaTable, $language);
    }

    /**
     * Returns button placements for a window in GTree-array form. If the user has
     * saved button placements (FormItemPlacement with item_type='button'), those
     * are used. Otherwise we fall back to the template's FormElement buttons —
     * which already carry the user's tab_order from the form-template editor.
     */
    private function getOrGenerateFormButtons(\App\Models\FormWindow $window, ?string $language = null, $formSet = null): array
    {
        // FormSet default colors used as fallback when a button has no own color set.
        $defaultBg   = $formSet->default_button_color      ?? null;
        $defaultText = $formSet->default_button_text_color ?? null;

        $existing = \App\Models\FormItemPlacement::buttons()
            ->forWindow($window->id)
            ->visible()
            ->orderBy('sort_order')
            ->get();

        if ($existing->isNotEmpty()) {
            $rows = $existing->map(fn($p) => $p->toGTreeArray($language))->toArray();
            // Inject FormSet defaults where the placement has no per-button color.
            foreach ($rows as &$row) {
                if (($row['background_color'] ?? null) === null && $defaultBg !== null) {
                    $row['background_color'] = $defaultBg;
                }
                if (($row['text_color'] ?? null) === null && $defaultText !== null) {
                    $row['text_color'] = $defaultText;
                }
            }
            unset($row);
            return $rows;
        }

        // Fallback: derive from the template's FormElement buttons. Shape mirrors
        // FormItemPlacement::toGTreeArray() so templates see the same keys whether
        // the layout is saved or auto-derived.
        $btns = [];
        foreach ($window->elements as $el) {
            $type = $el->element_type ?? '';
            if (!is_string($type) || !str_starts_with($type, 'button_')) continue;

            $btns[] = [
                // Common
                'id'               => $el->id,
                'type'             => 'button',
                'x'                => $el->x_position,
                'y'                => $el->y_position,
                'width'            => $el->width,
                'height'           => $el->height,
                'visible'          => (bool)$el->is_visible,
                'z_order'          => $el->sort_order ?? 0,
                'tab_order'        => $el->tab_order ?? 0,
                'anchor_right'     => null,
                'anchor_bottom'    => null,
                'anchor_width'     => null,
                'anchor_height'    => null,
                'label'            => $el->button_label,
                'container_id'     => null,
                // Button-specific
                'control_type'     => 'button',
                'button_type'      => $type,
                'icon'             => $el->effective_icon,
                'action'           => $el->button_action,
                'background_color' => $el->button_background_color ?? $defaultBg,
                'text_color'       => $el->button_text_color ?? $defaultText,
            ];
        }

        usort($btns, function ($a, $b) {
            // Positive tab_order first (ASC), then unset (0/−1) sorted by z_order.
            $ta = $a['tab_order'] > 0 ? $a['tab_order'] : PHP_INT_MAX;
            $tb = $b['tab_order'] > 0 ? $b['tab_order'] : PHP_INT_MAX;
            if ($ta !== $tb) return $ta <=> $tb;
            return ($a['z_order'] ?? 0) <=> ($b['z_order'] ?? 0);
        });

        return $btns;
    }

    /**
     * Auto-generate a form layout for a table based on container settings
     */
    private function autoGenerateFormLayout(\App\Models\FormWindow $window, $schemaTable, ?string $language = null): array
    {
        $container = $window->elements->firstWhere('element_type', 'container');
        $fields = $schemaTable->fields
            ->where('is_auto_increment', false)
            ->sortBy('field_order')
            ->values();

        if ($fields->isEmpty() || !$container) return [];

        // Load schema translations for field labels
        $translations = [];
        if ($language) {
            $tableName = $schemaTable->table_name;
            $fieldItems = $fields->map(fn($f) => $tableName . '.' . $f->field_name)->toArray();
            $trans = \App\Models\SchemaTranslation::whereIn('item_name', $fieldItems)
                ->where('code', $language)
                ->pluck('translated_text', 'item_name');
            foreach ($trans as $itemName => $text) {
                $fieldName = str_replace($tableName . '.', '', $itemName);
                $translations[$fieldName] = $text;
            }
        }

        $containerCols = $container->container_columns ?? 1;
        $containerGap = $container->container_gap ?? 8;
        $maxFields = $container->max_fields ?? 999;
        $fieldHeight = $container->default_control_height ?? 32;
        $containerWidth = $container->width ?? 600;

        $placements = [];
        $colWidth = ($containerWidth - ($containerCols - 1) * $containerGap) / max(1, $containerCols);

        foreach ($fields as $idx => $field) {
            if ($idx >= $maxFields) break;

            $col = $idx % $containerCols;
            $row = intdiv($idx, $containerCols);

            $placements[] = [
                'id' => 0,
                'type' => 'field',
                'x' => round($col * ($colWidth + $containerGap)),
                'y' => round($row * ($fieldHeight + $containerGap)),
                'width' => round($colWidth),
                'height' => $fieldHeight,
                'visible' => true,
                'z_order' => $idx,
                'tab_order' => 0, // overwritten by assignAutoTabOrder() below
                // Anchors: width 100% for create_edit forms
                'anchor_right' => null,
                'anchor_bottom' => null,
                'anchor_width' => $window->window_type === 'create_edit' ? 100 : null,
                'anchor_height' => null,
                // Label
                'label' => $translations[$field->field_name] ?? $this->formatFieldNameForLayout($field->field_name),
                'container_id' => $container->id,
                // Field-specific
                'control_type' => $this->detectControlTypeForLayout($field),
                'label_position' => 'top',
                'label_width' => 100,
                'field_name' => $field->field_name,
                'field_type' => $field->field_type,
                'lookup_table' => $field->link_table,
                'lookup_display' => $field->link_display_field,
                'lookup_value' => $field->link_field,
                'lookup_sort' => $field->link_order_field,
            ];
        }

        // Assign tab_order based on the template element layout (FormElement.tab_order):
        // walk template elements in tab-order; when our container's slot comes up,
        // emit one tab_order step per placed field; buttons before/after consume their
        // own slots so the field range slides into the right window of the sequence.
        $this->assignAutoTabOrder($placements, $window->elements, (int)$container->id);

        return $placements;
    }

    /**
     * Assigns tab_order on auto-generated field placements by walking the template
     * elements (FormElement) in their FormElement.tab_order. Container slots get
     * "expanded" into one slot per field; button slots are reserved (counted) so
     * fields are numbered consistently relative to surrounding buttons.
     *
     * Mirrors the frontend tab-order expansion in
     * FormLayoutDesignerPanel.tsx::handleAutoPlace.
     *
     * Fallback: if no template element has tab_order > 0, fields are simply
     * numbered 1..N in their existing sort order (field_order).
     *
     * @param array $placements           Field placement arrays (mutated in place).
     * @param mixed $templateElements     Iterable<FormElement> ($window->elements).
     * @param int   $containerId          The container id whose slot expands into fields.
     */
    private function assignAutoTabOrder(array &$placements, $templateElements, int $containerId): void
    {
        if (empty($placements)) {
            return;
        }

        // Detect whether the template defined any meaningful tab order at all.
        $hasAny = false;
        foreach ($templateElements as $el) {
            if (($el->tab_order ?? 0) > 0) { $hasAny = true; break; }
        }

        if (!$hasAny) {
            // Fallback: pure sequential numbering in field/sort order.
            $i = 1;
            foreach ($placements as &$p) {
                $p['tab_order'] = $i++;
            }
            unset($p);
            return;
        }

        // Sort template elements ASC by tab_order, drop -1 (no tab stop).
        $sorted = [];
        foreach ($templateElements as $el) {
            if (($el->tab_order ?? 0) === -1) continue;
            $sorted[] = $el;
        }
        usort($sorted, fn($a, $b) => ($a->tab_order ?? 0) <=> ($b->tab_order ?? 0));

        $counter = 0;
        $assignedFields = false;
        foreach ($sorted as $el) {
            $type = $el->element_type ?? '';
            $isOurContainer = (int)$el->id === $containerId
                && in_array($type, ['container', 'tab_container', 'tab_panel'], true);
            $isButton = is_string($type) && str_starts_with($type, 'button_');

            if ($isOurContainer && !$assignedFields) {
                // Expand this container slot into one tab_order per field.
                foreach ($placements as &$p) {
                    $counter++;
                    $p['tab_order'] = $counter;
                }
                unset($p);
                $assignedFields = true;
            } elseif ($isButton) {
                // Button consumes one slot in the sequence (we don't return buttons
                // here, but their position determines where the field range falls).
                $counter++;
            }
            // Other elements (other containers, separators, ...) are ignored.
        }

        // Container wasn't part of the template's tab-order list at all → append fields.
        if (!$assignedFields) {
            foreach ($placements as &$p) {
                $counter++;
                $p['tab_order'] = $counter;
            }
            unset($p);
        }
    }

    private function formatFieldNameForLayout(string $fieldName): string
    {
        return str_replace('_', ' ', ucwords(str_replace('_', ' ', $fieldName)));
    }

    private function detectControlTypeForLayout($field): string
    {
        $type = strtolower($field->field_type ?? '');
        $name = strtolower($field->field_name ?? '');

        // Explicit control_type from schema
        if (!empty($field->control_type)) {
            return strtolower($field->control_type);
        }

        // Linked table → combobox
        if (!empty($field->link_table)) return 'combobox';

        // Boolean/tinyint → checkbox
        if ($type === 'tinyint' || str_contains($type, 'bool')) return 'checkbox';

        // Date/time types
        if (str_contains($type, 'datetime') || str_contains($type, 'timestamp')) return 'datetime';
        if ($type === 'date') return 'date';
        if ($type === 'time') return 'time';

        // Large text
        if (in_array($type, ['text', 'mediumtext', 'longtext'])) return 'textarea';

        // Numeric
        if (str_contains($type, 'decimal') || str_contains($type, 'float') || str_contains($type, 'double')) return 'float';
        if (str_contains($type, 'int') || str_contains($type, 'bigint')) return 'integer';

        // File/image names
        if (str_contains($name, 'image') || str_contains($name, 'photo') || str_contains($name, 'file')) return 'file';
        if (str_contains($name, 'password') || str_contains($name, 'passwort')) return 'password';
        if (str_contains($name, 'email')) return 'email';

        // BLOB
        if (str_contains($type, 'blob') || str_contains($type, 'binary')) return 'file';

        return 'text';
    }
}