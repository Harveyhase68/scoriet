<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\UltimateTemplateEngine;
use App\Models\Template;
use App\Models\Project;
use App\Models\FloatingSchema;
use App\Models\SchemaVersion;
use App\Models\SchemaTable;
use App\Models\Language;
use App\Models\SchemaTranslation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

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

            \Log::info("🚀 Main processTemplate", [
                'templateId' => $templateId,
                'projectId' => $projectId,
                'tableName' => $tableName,
                'languageCode' => $languageCode
            ]);

            // Load project and schema data
            $gtreeData = $this->buildUltimateGtree($projectId, $templateId, $template);

            // Initialize Ultimate Template Engine
            $engine = new UltimateTemplateEngine($gtreeData['gtree']);

            // Process each template file
            $processedFiles = [];
            $allUnknownVariables = []; // Collect all unknown variables across all files
            $allRequiredMissing = []; // Collect all required but missing variables
            $allOptionalMissing = []; // Collect all optional but missing variables
            $allSyntaxErrors = []; // Collect all syntax errors across all files
            $allSyntaxWarnings = []; // Collect all syntax warnings across all files

            foreach ($template->files as $file) {
                $fileResult = $this->processTemplateFile($engine, $file, $gtreeData, $compile, $tableName, $languageCode, $includeSource);
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
                'performance' => [
                    'execution_time_ms' => round($executionTime, 2),
                    'memory_usage' => memory_get_usage(true),
                    'peak_memory' => memory_get_peak_usage(true),
                    'files_processed' => count($processedFiles),
                    'variables_available' => count($gtreeData['gtree'][0]['project'][0]) - 1,
                ],
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
     */
    private function buildUltimateGtree(?int $projectId, int $templateId, Template $template): array
    {
        // Load project and schema data
        $actualProject = $projectId ? Project::find($projectId) : null;
        $schemaTables = collect();
        $schemaDescription = ''; // Store schema description
        $schemaName = ''; // Store schema name

        if ($actualProject) {
            // Get floating schemas linked to this project
            $linkedSchemas = FloatingSchema::whereHas('projects', function ($query) use ($projectId) {
                $query->where('projects.id', $projectId);
            })->get();

            foreach ($linkedSchemas as $schema) {
                // Store first schema's name and description
                if (empty($schemaName) && !empty($schema->name)) {
                    $schemaName = $schema->name;
                }
                if (empty($schemaDescription) && !empty($schema->description)) {
                    $schemaDescription = $schema->description;
                }

                $latestVersion = SchemaVersion::where('schema_id', $schema->id)
                    ->orderBy('id', 'desc')
                    ->first();

                if ($latestVersion) {
                    $versionTables = SchemaTable::where('schema_version_id', $latestVersion->id)
                        ->with([
                            'floatingSchema', // 🔗 Load schema info for database name
                            'fields' => function($query) {
                                $query->orderBy('field_order');
                            },
                            'constraints.constraintColumns.field' // 🎯 Load nested relationships for constraint columns
                        ])
                        ->get();
                    $schemaTables = $schemaTables->merge($versionTables);
                }
            }
        }

        // Fallback to demo data
        if ($schemaTables->isEmpty()) {
            $schemaTables = SchemaTable::where('schema_version_id', 1)
                ->with([
                    'floatingSchema', // 🔗 Load schema info for database name
                    'fields',
                    'constraints.constraintColumns.field' // 🎯 Load nested relationships for constraint columns
                ])
                ->get();

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

        // Load all active languages
        $languages = Language::where('is_active', true)->orderBy('id')->get();
        $selectedLanguageCode = request()->query('language_code', 'en'); // Default to English
        $selectedLanguageIndex = 0;

        // Find the index of the selected language
        foreach ($languages as $index => $language) {
            if ($language->code === $selectedLanguageCode) {
                $selectedLanguageIndex = $index;
                break;
            }
        }

        error_log("🌍 Languages Debug: Found " . $languages->count() . " languages, selected: $selectedLanguageCode (index: $selectedLanguageIndex)");

        // Build ultimate project data
        $projectName = $actualProject ? $actualProject->name : 'ScorietDemo';
        $projectData = $this->buildUltimateProjectData($actualProject, $template, $templateId, $schemaDescription, $schemaName);

        // Add language information
        $projectData['selectedlanguage'] = $selectedLanguageCode;
        $projectData['selectedlanguageindex'] = $selectedLanguageIndex;

        // Add languages array (using 'lang' for consistency with template syntax)
        $projectData['lang'] = $languages->map(function ($language, $index) use ($actualProject) {
            return [
                'id' => $language->id, // 🎯 Language database ID
                'code' => $language->code, // 🎯 Language token (e.g., 'en', 'de', 'fr')
                'name' => $language->name,
                'native_name' => $language->native_name,
                'flag' => $language->flag ?? '🏴',
                'index' => $index,
                // Project translations (use project name/description as default)
                'caption' => $actualProject ? $actualProject->name : 'ScorietDemo',
                'filedescription' => $actualProject ? ($actualProject->description ?? '') : 'Demo Project',
            ];
        })->toArray();

        // Update language count
        $projectData['nmaxlanguages'] = $languages->count();

        // Build ultimate table data with translations
        $projectData['tables'] = $this->buildUltimateTableDataWithTranslations($schemaTables, $projectId, $languages);

        // Update table/file counts (files = tables in Scoriet)
        $projectData['nmaxtables'] = count($projectData['tables']);
        $projectData['nmaxfiles'] = count($projectData['tables']);

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
                'features' => [
                    'enhanced_naming_conventions' => true,
                    'extended_metadata' => true,
                    'multiple_data_types' => true,
                    'generation_context' => true,
                    'template_helpers' => true,
                ],
                'generated_at' => now()->toISOString(),
            ]
        ];
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

        \Log::info("🎨 Custom Template Variables Loaded", [
            'templateId' => $templateId,
            'languageCode' => $languageCode,
            'count' => count($customVariables),
            'variables' => $customVariables
        ]);

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
            'projectdbversion' => '1', // Project DB Version (for %9 in filename)
            'projectdbpassword' => $actualProject ? ($actualProject->database_password ?? '') : '',
            'projectdbusername' => $actualProject ? ($actualProject->database_username ?? 'root') : 'root',
            'projectdbserver' => $actualProject ? ($actualProject->database_server ?? '127.0.0.1') : '127.0.0.1',
            'projectdbport' => $actualProject ? ($actualProject->database_port ?? '3306') : '3306',

            // === PATHS AND URLS ===
            'projectdirectory' => $actualProject ? ($actualProject->project_directory ?? 'C:\\Users\\Public\\Documents\\' . $projectName) : 'C:\\Users\\Public\\Documents\\ScorietDemo',
            'projecturl' => $actualProject ? ($actualProject->project_url ?? 'http://localhost/' . strtolower($projectName)) : 'http://localhost/scorietdemo',

            // === TEMPLATE INFO ===
            'templateid' => $templateId,
            'templatename' => $template->name,
            'templatecategory' => $template->category ?? 'General',
            'templatedescription' => $template->description ?? '',
            'templatetags' => $template->tags ?? [],

            // === GENERATION CONTEXT ===
            'generationdatetime' => now()->format('Y-m-d H:i:s'),
            'generationuser' => auth()->user() ? auth()->user()->name : 'System',
            'scorietversion' => '2.0.0',
            'laravelversion' => app()->version(),

            // === LOCALIZATION SETTINGS ===
            'decimal_separator' => $actualProject ? ($actualProject->decimal_separator ?? ',') : ',',
            'thousands_separator' => $actualProject ? ($actualProject->thousands_separator ?? '.') : '.',
            'date_format' => $actualProject ? ($actualProject->date_format ?? 'd.m.Y') : 'd.m.Y',
            'time_format' => $actualProject ? ($actualProject->time_format ?? 'H:i:s') : 'H:i:s',
            'currency_symbol' => $actualProject ? ($actualProject->currency_symbol ?? '€') : '€',
            'timezone' => $actualProject ? ($actualProject->timezone ?? 'Europe/Vienna') : 'Europe/Vienna',

            // === COUNTS (will be updated after table processing) ===
            'nmaxfiles' => 0,
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
     * 🗄️ BUILD ULTIMATE TABLE DATA
     */
    private function buildUltimateTableData($schemaTables, ?int $projectId): array
    {
        $tables = [];

        foreach ($schemaTables as $tableIndex => $table) {
            $fields = $table->fields;
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
                    'type' => strtoupper($field->field_type),

                    // Enhanced metadata
                    'controltype' => 24,
                    'typecast' => $this->getPhpTypecast($field->field_type),
                    'phptype' => $this->getPhpType($field->field_type),
                    'jstype' => $this->getJsType($field->field_type),
                    'notnull' => !$field->is_nullable,
                    'order' => $field->field_order,
                    'id' => $index + 1,
                    'size' => $this->extractFieldSize($field->field_type),
                    'caption' => ucwords(str_replace('_', ' ', $fieldName)),
                    'default' => $field->default_value ?? '',

                    // Boolean flags - 🎯 Read from database (set during SQL import)
                    'isprimary' => $field->is_primary_key ?? false,
                    'isunique' => $field->is_unique ?? false, // 🎯 PRIMARY KEY and UNIQUE constraints
                    'isindex' => $field->is_index ?? false, // 🎯 INDEX/KEY constraints
                    'isforeign' => str_ends_with($fieldName, '_id') && !($field->is_primary_key ?? false),
                    'istimestamp' => in_array($fieldName, ['created_at', 'updated_at', 'deleted_at']),
                    'autoincrement' => $field->is_auto_increment ?? false, // 🎯 Read from database
                    'visible' => true,

                    // 🎯 LINK FIELDS - For ComboBox, ListBox, RadioButtons, etc.
                    'linktable' => $field->link_table ?? '',
                    'linkfield' => $field->link_field ?? '',
                    'linkdisplayfield' => $field->link_display_field ?? '',
                    'linkorderfield' => $field->link_order_field ?? '',
                    'linkorder' => $field->link_order_direction ?? '',

                    // Context
                    'filename' => $tableName,
                    'projectid' => $projectId ?? 1,
                ];
            })->toArray();

            // 🎯 Create filtered field arrays for different use cases
            $mappedFieldsNoKey = collect($mappedFields)->filter(function($field) {
                return !$field['isprimary']; // Exclude primary keys
            })->values()->toArray(); // Re-index after filtering

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
            $mappedForeignKeys = $constraints->where('constraint_type', 'FOREIGN KEY')->map(function($constraint, $index) use ($fields) {
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

                // Get referenced column name from referenceColumns
                $referencedColumn = '';
                if ($reference && $reference->referenceColumns->isNotEmpty()) {
                    $referencedColumn = $reference->referenceColumns->first()->referenced_column_name;
                }

                return [
                    'name' => $columnName, // Field name (e.g., 'user_id')
                    'id' => $index + 1,
                    'type' => $fieldType, // Field type (e.g., 'BIGINT')
                    'typecast' => $typecast, // PHP typecast (e.g., 'int')
                    'constraintname' => $constraint->constraint_name ?? 'fk_' . ($index + 1),
                    'referencedtable' => $referencedTableName, // Referenced table name (e.g., 'users')
                    'referencedcolumn' => $referencedColumn, // Referenced column (e.g., 'id')
                    'ondelete' => $reference->on_delete ?? 'NO ACTION', // ON DELETE action
                    'onupdate' => $reference->on_update ?? 'NO ACTION', // ON UPDATE action
                ];
            })->values()->toArray();

            $tables[] = [
                // Basic table info
                'filename' => $tableName,
                'filenameshort' => $table->file_name_short ?? substr($tableName, 0, 2), // Use DB field or fallback
                'fileid' => $table->id ?? $tableIndex,

                // Counts
                'nmaxitems' => count($mappedFields),
                'nmaxfields' => count($mappedFields),
                'nmaxitemsnokey' => count($mappedFieldsNoKey), // 🎯 Accurate count after filtering
                'nmaxkeys' => count($mappedKeys), // PRIMARY + UNIQUE only (not FOREIGN)
                'nmaxforeignkeys' => $constraints->where('constraint_type', 'FOREIGN KEY')->count(),
                'nmaxsearchkeys' => $this->calculateSearchKeysCount($table, $fields),

                // Master-detail (placeholder - implement when needed)
                'nmaxitemsmasterdetail' => 0,
                'nmaxitemsmasterdetailnokeys' => 0,
                'filegeneratemasterdetail' => false,
                'filedetailfileid' => null,
                'filedetailfilename' => null,
                'filedetailkey' => null,

                // Data arrays
                'fields' => $mappedFields,
                'fieldsnokey' => $mappedFieldsNoKey, // 🎯 Fields without Primary Key (for UPDATE)
                'keys' => $mappedKeys, // PRIMARY + UNIQUE keys only
                'foreignkeys' => $mappedForeignKeys, // 🎯 FOREIGN KEY constraints with reference info
                'constraints' => $mappedConstraints, // ALL constraints (PRIMARY, UNIQUE, FOREIGN)

                // Metadata
                'tableindex' => $tableIndex,
                'primarykeyfield' => $this->getPrimaryKeyField($fields), // 🎯 DAS LÖST DEIN {filekeyname} PROBLEM!
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

        foreach ($schemaTables as $tableIndex => $table) {
            $fields = $table->fields;
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

            // 🐛 DEBUG: Log extracted fields
            \Log::info("🐛 Extracted constraint fields for {$tableName}", [
                'total_constraints' => $constraints->count(),
                'uniqueFields' => $uniqueFields,
                'indexFields' => $indexFields,
                'sample_constraint' => $constraints->first() ? [
                    'name' => $constraints->first()->constraint_name,
                    'type' => $constraints->first()->constraint_type,
                    'columns_count' => $constraints->first()->constraintColumns->count(),
                    'first_column' => $constraints->first()->constraintColumns->first()?->field_name
                ] : null
            ]);

            // Enhanced field mapping with translations
            $mappedFields = $fields->map(function($field, $index) use ($tableName, $projectId, $languages, $primaryKeyFieldName, $uniqueFields, $indexFields) {
                $fieldName = $field->field_name;
                $fullFieldName = $tableName . '.' . $fieldName;

                // Get translations for this field
                $fieldTranslations = $this->getTranslationsForItem($fullFieldName, $languages);

                // 🎯 Base field data
                $fieldData = [
                    // Core field info
                    'name' => $fieldName,
                    'type' => strtoupper($field->field_type),

                    // Enhanced metadata
                    'controltype' => $field->control_type ?? 'TEXT', // 🎯 Read from database
                    'typecast' => $this->getPhpTypecast($field->field_type),
                    'phptype' => $this->getPhpType($field->field_type),
                    'jstype' => $this->getJsType($field->field_type),
                    'notnull' => !$field->is_nullable,
                    'order' => $field->field_order,
                    'id' => $index + 1,
                    'size' => $this->extractFieldSize($field->field_type),
                    'caption' => ucwords(str_replace('_', ' ', $fieldName)),
                    'default' => $field->default_value ?? '',

                    // Boolean flags - 🎯 Read from database (set during SQL import)
                    'isprimary' => $field->is_primary_key ?? false,
                    'isunique' => $field->is_unique ?? false, // 🎯 PRIMARY KEY and UNIQUE constraints
                    'isindex' => $field->is_index ?? false, // 🎯 INDEX/KEY constraints
                    'isforeign' => str_ends_with($fieldName, '_id') && !($field->is_primary_key ?? false),
                    'istimestamp' => in_array($fieldName, ['created_at', 'updated_at', 'deleted_at']),
                    'autoincrement' => $field->is_auto_increment ?? false, // 🎯 Read from database
                    'visible' => true,

                    // 🎯 NEW: ITEMS variables for templates
                    'unsigned' => $field->is_unsigned ?? false, // {item.unsigned}
                    'sort' => $field->field_order, // {item.sort}
                    'sortindex' => $field->field_order, // {item.sortindex} - alias for backward compatibility

                    // Context
                    'filename' => $tableName,
                    'projectid' => $projectId ?? 1,

                    // 🌍 NEW: Language translations array
                    'lang' => $fieldTranslations,
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

            // 🎯 Create filtered field arrays for different use cases
            $mappedFieldsNoKey = collect($mappedFields)->filter(function($field) {
                return !$field['isprimary']; // Exclude primary keys
            })->values()->toArray(); // Re-index after filtering

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
            $mappedForeignKeys = $constraints->where('constraint_type', 'FOREIGN KEY')->map(function($constraint, $index) use ($fields) {
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

                // Get referenced column name from referenceColumns
                $referencedColumn = '';
                if ($reference && $reference->referenceColumns->isNotEmpty()) {
                    $referencedColumn = $reference->referenceColumns->first()->referenced_column_name;
                }

                return [
                    'name' => $columnName, // Field name (e.g., 'user_id')
                    'id' => $index + 1,
                    'type' => $fieldType, // Field type (e.g., 'BIGINT')
                    'typecast' => $typecast, // PHP typecast (e.g., 'int')
                    'constraintname' => $constraint->constraint_name ?? 'fk_' . ($index + 1),
                    'referencedtable' => $referencedTableName, // Referenced table name (e.g., 'users')
                    'referencedcolumn' => $referencedColumn, // Referenced column (e.g., 'id')
                    'ondelete' => $reference->on_delete ?? 'NO ACTION', // ON DELETE action
                    'onupdate' => $reference->on_update ?? 'NO ACTION', // ON UPDATE action
                ];
            })->values()->toArray();

            $tables[] = [
                // Basic table info
                'filename' => $tableName,
                'filenameshort' => $table->file_name_short ?? substr($tableName, 0, 2), // Use DB field or fallback
                'fileid' => $table->id ?? $tableIndex,
                'databasename' => $table->floatingSchema->name ?? 'unknown', // 🔗 Schema/Database name
                'schemaid' => $table->floatingSchema->id ?? null, // 🔗 Schema ID for filtering

                // Counts
                'nmaxitems' => count($mappedFields),
                'nmaxfields' => count($mappedFields),
                'nmaxitemsnokey' => count($mappedFieldsNoKey), // 🎯 Accurate count after filtering
                'nmaxkeys' => count($mappedKeys), // PRIMARY + UNIQUE only (not FOREIGN)
                'nmaxforeignkeys' => $constraints->where('constraint_type', 'FOREIGN KEY')->count(),
                'nmaxsearchkeys' => $this->calculateSearchKeysCount($table, $fields),

                // Master-detail (placeholder - implement when needed)
                'nmaxitemsmasterdetail' => 0,
                'nmaxitemsmasterdetailnokeys' => 0,
                'filegeneratemasterdetail' => false,
                'filedetailfileid' => null,
                'filedetailfilename' => null,
                'filedetailkey' => null,

                // Data arrays
                'fields' => $mappedFields,
                'fieldsnokey' => $mappedFieldsNoKey, // 🎯 Fields without Primary Key (for UPDATE)
                'keys' => $mappedKeys, // PRIMARY + UNIQUE keys only
                'foreignkeys' => $mappedForeignKeys, // 🎯 FOREIGN KEY constraints with reference info
                'constraints' => $mappedConstraints, // ALL constraints (PRIMARY, UNIQUE, FOREIGN)

                // Metadata
                'tableindex' => $tableIndex,
                'primarykeyfield' => $this->getPrimaryKeyField($fields),

                // 🌍 NEW: Language translations array
                'lang' => $tableTranslations,
            ];
        }

        return $tables;
    }

    /**
     * 🌍 GET TRANSLATIONS FOR ITEM (TABLE OR FIELD)
     */
    private function getTranslationsForItem(string $itemName, $languages): array
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

            $translations[] = [
                'caption' => $caption,
                'code' => $languageCode,
                'index' => $index
            ];
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
     * 🔧 REPLACE FILENAME PLACEHOLDERS (%1-%9)
     */
    private function replaceFilenamePlaceholders(string $filename, array $gtreeData, ?string $tableName = null, ?string $languageCode = null, $file = null): string
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
        $date = $now->format('Y-m-d');
        $time = $now->format('H-i-s'); // Use dashes instead of colons for filename compatibility
        $datetime = $now->format('Y-m-d_H-i-s');

        // Build replacements
        $replacements = [
            '%1' => $tableName ?? 'unknown',                          // DB Table name
            '%2' => $languageCode ?? 'en',                             // Language short code
            '%3' => $languageName ?: 'English',                        // Language name
            '%4' => $languageLocale ?: 'en',                           // Language locale
            '%5' => $file->template->name ?? 'template',               // Template name
            '%6' => $date,                                             // Date
            '%7' => $time,                                             // Time
            '%8' => $datetime,                                         // DateTime raw
            '%9' => $project['projectdbversion'] ?? '1',               // Project DB Version
        ];

        return str_replace(array_keys($replacements), array_values($replacements), $filename);
    }

    /**
     * 📝 PROCESS TEMPLATE FILE
     */
    private function processTemplateFile(UltimateTemplateEngine $engine, $file, array $gtreeData, bool $compile, ?string $tableName = null, ?string $languageCode = null, bool $includeSource = false): array
    {
        $content = $file->file_content;

        // Determine if this is a db_table_file and set table metadata
        $generationType = $this->determineGenerationType($file);
        $tableIndex = null;
        $actualTableName = null;

        // OVERRIDE: If table_name parameter is provided, treat this as db_table_file or db_table_file_languages
        if ($tableName) {
            error_log("🔧 Backend Debug: tableName parameter received: " . $tableName);

            // Keep original generation type if it's already a language type
            if ($generationType === 'db_table_file_languages') {
                // Keep as db_table_file_languages
            } else {
                $generationType = 'db_table_file';
            }

            // Find the table in gtree data
            $gtree = $gtreeData['gtree'] ?? [];
            error_log("🔧 Backend Debug: gtree count: " . count($gtree));

            // Access the correct gtree structure: gtree[0]['project'][0]['tables']
            if (isset($gtree[0]['project'][0]['tables'])) {
                $tables = $gtree[0]['project'][0]['tables'];

                foreach ($tables as $index => $tableData) {
                    if (isset($tableData['filename']) && $tableData['filename'] === $tableName) {
                        $tableIndex = $index;
                        $actualTableName = $tableName;
                        error_log("🔧 Backend Debug: Found table at index $index: " . $tableName);
                        break;
                    }
                }
            }

            error_log("🔧 Backend Debug: Final values - tableIndex: " . ($tableIndex ?? 'null') . ", actualTableName: " . ($actualTableName ?? 'null'));
        } else {
            error_log("🔧 Backend Debug: No tableName parameter provided");
        }

        // Replace %1-%9 placeholders in filename
        $processedFileName = $this->replaceFilenamePlaceholders($file->file_name, $gtreeData, $actualTableName, $languageCode, $file);

        // 🎯 INJECT TEMPLATE FILE VARIABLES into gtreeData for this file
        $outputPath = $file->output_path ?? '/';
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

        // ✅ VALIDATE TEMPLATE VARIABLES WITH CONTEXT (informational only, does not block)
        $templateId = $file->template_id ?? null;
        $projectId = $gtreeData['gtree'][0]['project'][0]['projectid'] ?? null;

        \Log::info("📋 Template File processing", [
            'file_id' => $file->id,
            'file_name' => $file->file_name,
            'template_id' => $templateId,
            'projectId' => $projectId,
            'languageCode' => $languageCode
        ]);

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
            'filename' => $processedFileName,
            'original_template' => $file->file_name, // Keep original for debugging
            'file_type' => $file->file_type,
            'original_content' => $content,
            'compiled_content' => $compiledContent,
            'is_compiled' => $compile,
            'output_path' => $file->output_path ?? '/',
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
    private function calculateSearchKeysCount($table, $fields): int
    {
        // Get the file key name (primary search key)
        $fileKeyName = $table->filekeyname ?? $table->primarykeyfield ?? 'id';
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
     * 🔑 GET PRIMARY KEY FIELD - Löst das {filekeyname} Problem
     */
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

            \Log::info("🚀 Full Project Generation Started", [
                'project_id' => $projectId,
                'templates' => count($templateIds),
                'schemas' => count($schemaIds),
                'languages' => count($languageCodes),
            ]);

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

            // Process each template
            foreach ($templates as $template) {
                \Log::info("🔨 Processing template", ['id' => $template->id, 'name' => $template->name]);

                // Build gtree for this template (includes ALL project tables)
                $gtreeData = $this->buildUltimateGtree($projectId, $template->id, $template);
                $engine = new UltimateTemplateEngine($gtreeData['gtree']);

                // Extract tables from gtree
                $tablesFromGtree = $gtreeData['gtree'][0]['project'][0]['tables'] ?? [];

                \Log::info("📊 Gtree tables extracted", [
                    'template_id' => $template->id,
                    'template_name' => $template->name,
                    'tables_count' => count($tablesFromGtree),
                    'gtree_structure_keys' => array_keys($gtreeData),
                    'project_keys' => isset($gtreeData['gtree'][0]['project'][0]) ? array_keys($gtreeData['gtree'][0]['project'][0]) : 'NO PROJECT',
                    'has_tables_key' => isset($gtreeData['gtree'][0]['project'][0]['tables']),
                    'first_table_sample' => !empty($tablesFromGtree) ? array_keys($tablesFromGtree[0]) : 'NO TABLES',
                    'first_table_schemaid' => !empty($tablesFromGtree) ? ($tablesFromGtree[0]['schemaid'] ?? 'NO SCHEMAID') : 'NO TABLES',
                    'first_table_databasename' => !empty($tablesFromGtree) ? ($tablesFromGtree[0]['databasename'] ?? 'NO DATABASENAME') : 'NO TABLES',
                ]);

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
                    \Log::info("🔍 Tables filtered by schema", [
                        'original_count' => $originalCount,
                        'filtered_count' => count($tablesFromGtree),
                        'requested_schema_ids' => $schemaIds,
                        'actual_schema_ids_in_tables' => $actualSchemaIds,
                    ]);
                }

                // Process each file in the template
                foreach ($template->files as $file) {
                    $fileType = $file->file_type ?? 'project_file';

                    if ($fileType === 'db_table_file' || $fileType === 'db_table_file_languages') {
                        // Generate for each table
                        if (empty($tablesFromGtree)) {
                            \Log::warning("⚠️ Skipping db_table_file because no tables available", [
                                'file' => $file->file_name
                            ]);
                            continue;
                        }

                        foreach ($tablesFromGtree as $tableData) {
                            $tableName = $tableData['filename'] ?? $tableData['tablename'] ?? null;
                            if (!$tableName) continue;

                            $languagesToProcess = ($fileType === 'db_table_file_languages') ? $languageCodes : ['en'];

                            foreach ($languagesToProcess as $languageCode) {
                                $result = $this->processTemplateFile(
                                    $engine,
                                    $file,
                                    $gtreeData,
                                    true, // compile
                                    $tableName,
                                    $languageCode,
                                    false // includeSource
                                );

                                if (!$result['has_syntax_errors']) {
                                    // 🎯 Execute JavaScript to get actual output with language context
                                    $output = $this->executeJavaScript($result['compiled_content'], $gtreeData, $languageCode);

                                    $generatedFiles[] = [
                                        'path' => $result['output_path'],
                                        'filename' => $result['filename'],
                                        'content' => $output,
                                        'template' => $template->name,
                                        'table' => $tableName,
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
                                false // includeSource
                            );

                            if (!$result['has_syntax_errors']) {
                                // 🎯 Execute JavaScript to get actual output with language context
                                $output = $this->executeJavaScript($result['compiled_content'], $gtreeData, $languageCode);

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
                            false // includeSource
                        );

                        if (!$result['has_syntax_errors']) {
                            // 🎯 Execute JavaScript to get actual output (no specific language)
                            $output = $this->executeJavaScript($result['compiled_content'], $gtreeData, null);

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

            \Log::info("✅ Generation complete", [
                'files' => count($generatedFiles),
                'operations' => $completedOperations,
                'syntax_errors' => count($syntaxErrors),
            ]);

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

                $replacements = [
                    '%1' => $tableName ?? 'unknown',
                    '%2' => $languageCode ?? 'en',
                    '%3' => $languageCode ?? 'English',  // Language name (simplified for now)
                    '%4' => $languageCode ?? 'en',
                    '%5' => $fileData['template'] ?? 'template',
                    '%6' => date('Y-m-d'),
                    '%7' => date('H-i-s'),
                    '%8' => date('Y-m-d_H-i-s'),
                    '%9' => '1',  // Project DB version
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

            // Create ZIP file
            $zipPath = storage_path('app/temp/' . $project->name . '_' . time() . '.zip');
            $zip = new \ZipArchive();

            if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) !== TRUE) {
                throw new \Exception('Could not create ZIP file');
            }

            // Add all files to ZIP
            $files = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($tempDir),
                \RecursiveIteratorIterator::LEAVES_ONLY
            );

            foreach ($files as $file) {
                if (!$file->isDir()) {
                    $filePath = $file->getRealPath();
                    $relativePath = substr($filePath, strlen($tempDir) + 1);
                    $zip->addFile($filePath, $relativePath);
                }
            }

            $zip->close();

            // Clean up temp directory
            $this->deleteDirectory($tempDir);

            $executionTime = round((microtime(true) - $startTime) * 1000, 2);

            \Log::info("🎉 ZIP created successfully", [
                'path' => $zipPath,
                'size' => filesize($zipPath),
                'execution_time' => $executionTime . 'ms',
                'syntax_errors' => count($syntaxErrors),
            ]);

            // Return download response with error information in headers
            $headers = [
                'Content-Type' => 'application/zip',
                'X-Generation-Errors' => count($syntaxErrors), // Number of errors
                'X-Generation-Files' => count($generatedFiles), // Number of successful files
            ];

            // If there are errors, encode them in base64 for header (limited to first 10 errors to avoid header size limits)
            if (!empty($syntaxErrors)) {
                $limitedErrors = array_slice($syntaxErrors, 0, 10);
                $headers['X-Generation-Error-Details'] = base64_encode(json_encode($limitedErrors));
                if (count($syntaxErrors) > 10) {
                    $headers['X-Generation-Error-More'] = count($syntaxErrors) - 10;
                }
            }

            return response()->download($zipPath, basename($zipPath), $headers)->deleteFileAfterSend(true);

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
}