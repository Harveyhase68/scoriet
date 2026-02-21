<?php

namespace App\Http\Controllers;

use App\Services\MySQLParser;
use App\Services\PostgreSQLParser;
use App\Services\SchemaStorageService;
use App\Models\FloatingSchema;
use App\Models\SchemaVersion;
use Illuminate\Http\Request;

class SqlParserController extends Controller
{
    private $schemaStorageService;

    public function __construct(SchemaStorageService $schemaStorageService)
    {
        $this->schemaStorageService = $schemaStorageService;
    }

    /**
     * Get the appropriate SQL parser based on database type
     */
    private function getParser(string $databaseType = 'mysql')
    {
        $databaseType = strtolower($databaseType);

        switch ($databaseType) {
            case 'postgresql':
            case 'postgres':
            case 'pgsql':
                return new PostgreSQLParser();
            case 'mysql':
            case 'mariadb':
            default:
                return new MySQLParser();
        }
    }

    public function parse(Request $request)
    {
        // Read raw body instead of JSON
        $sqlScript = $request->getContent();
        $databaseType = $request->header('X-Database-Type', 'mysql');

        // Validation for raw data
        if (empty(trim($sqlScript))) {
            return response()->json([
                'success' => false,
                'error' => __('sqlparsercontrollerphp50'),
            ], 400);
        }

        try {
            $parser = $this->getParser($databaseType);
            $version = $parser->parseSQL($sqlScript);

            return response()->json([
                'success' => true,
                'version' => $version,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    public function parseAndStore(Request $request)
    {
        // Increase PHP limits for large SQL import operations
        ini_set('memory_limit', '1024M');
        ini_set('max_execution_time', 300); // 5 minutes

        // Optional: JSON with additional parameters
        if ($request->isJson()) {
            $data = $request->json()->all();
            $sqlScript = $data['sql_script'] ?? '';
            $schemaId = $data['schema_id'] ?? null;
            $description = $data['description'] ?? null;
            $databaseType = $data['database_type'] ?? null;
            $appendToCurrentVersion = $data['append_to_current_version'] ?? false;
            $skipBreakingChangeCheck = $data['skip_breaking_change_check'] ?? false;
        } else {
            // Raw body for SQL script
            $sqlScript = $request->getContent();
            $schemaId = $request->header('X-Schema-Id');
            $description = $request->header('X-Description');
            $databaseType = $request->header('X-Database-Type');
            $appendToCurrentVersion = filter_var($request->header('X-Append-To-Current-Version', 'false'), FILTER_VALIDATE_BOOLEAN);
            $skipBreakingChangeCheck = filter_var($request->header('X-Skip-Breaking-Change-Check', 'false'), FILTER_VALIDATE_BOOLEAN);
        }

        // Validation
        if (empty(trim($sqlScript))) {
            return response()->json([
                'success' => false,
                'error' => __('sqlparsercontrollerphp99'),
            ], 400);
        }

        if (!$schemaId) {
            return response()->json([
                'success' => false,
                'error' => __('sqlparsercontrollerphp106'),
            ], 400);
        }

        try {
            // Check if schema exists and user has access
            $schema = FloatingSchema::find($schemaId);
            if (!$schema) {
                return response()->json([
                    'success' => false,
                    'error' => __('sqlparsercontrollerphp116'),
                ], 404);
            }

            // Check if user can edit this schema
            $user = auth()->user();
            if (!$schema->canBeEditedBy($user)) {
                return response()->json([
                    'success' => false,
                    'error' => __('sqlparsercontrollerphp125'),
                ], 403);
            }

            // Get database type from project settings if not provided in request
            if (!$databaseType) {
                $project = $schema->projects()->first();
                $databaseType = $project ? ($project->database_type ?? 'mysql') : 'mysql';
            }

            // SQL parsen with appropriate parser
            $parser = $this->getParser($databaseType);
            $parsedTables = $parser->parseSQL($sqlScript);

            // 🛡️ VALIDATION: Check if any tables were parsed before creating a version
            if (empty($parsedTables)) {
                return response()->json([
                    'success' => false,
                    'error' => __('sqlparsercontrollerphp143'),
                    'error_type' => __('sqlparsercontrollerphp144'),
                    'suggestion' => __('sqlparsercontrollerphp145')."CREATE TABLE".__('sqlparsercontrollerphp145_2'),
                ], 400);
            }

            // 🛡️ BREAKING CHANGE DETECTION - Critical Security Check (can be skipped)
            if (!$skipBreakingChangeCheck) {
                $this->validateNonBreakingChange($schema, $parsedTables);
            }

            // 🔄 TRANSACTION: Wrap entire import in transaction to prevent orphan versions
            // tolerateMissingReferences=true allows importing tables with FK to non-existent tables
            $schemaVersion = \DB::transaction(function () use ($schema, $parsedTables, $appendToCurrentVersion, $description) {
                // Either append to current version or create new version
                if ($appendToCurrentVersion) {
                    // Get the latest existing version
                    $schemaVersion = SchemaVersion::where('schema_id', $schema->id)
                        ->orderBy('version_number', 'desc')
                        ->first();

                    if (!$schemaVersion) {
                        // No version exists yet, create first one
                        $schemaVersion = SchemaVersion::createNewVersion($schema, $description);
                        $schemaVersion->refresh();
                    }

                    // Append parsed tables to existing version (merge with existing tables)
                    $this->schemaStorageService->addTablesToVersion($schemaVersion, $parsedTables, true);
                } else {
                    // Create new schema version for the floating schema
                    $schemaVersion = SchemaVersion::createNewVersion(
                        $schema,
                        $description
                    );

                    // Refresh to ensure schema_id is loaded
                    $schemaVersion->refresh();

                    // Store parsed tables in the new version using the existing service
                    // tolerateMissingReferences=true - user was already warned about missing FKs
                    $this->schemaStorageService->storeParsedTablesInVersion($schemaVersion, $parsedTables, true);
                }

                return $schemaVersion;
            });

            // 🎯 AUTOMATISCHES LAYOUT: Nur bei erster Version (wenn DB leer ist)
            if ($schema->last_version == 1) {
                try {
                    // Tabellennamen extrahieren
                    $tableNames = [];
                    foreach ($parsedTables as $tableData) {
                        if (isset($tableData['table_name'])) {
                            $tableNames[] = $tableData['table_name'];
                        }
                    }

                    // Foreign Keys extrahieren
                    $foreignKeys = [];
                    foreach ($parsedTables as $tableData) {
                        if (isset($tableData['constraints'])) {
                            foreach ($tableData['constraints'] as $constraint) {
                                if (isset($constraint['type']) && $constraint['type'] === 'FOREIGN KEY') {
                                    if (isset($constraint['references_table']) && isset($tableData['table_name'])) {
                                        // [from_table, to_table] Format
                                        $foreignKeys[] = [$tableData['table_name'], $constraint['references_table']];
                                    }
                                }
                            }
                        }
                    }

                    // Projekt-Einstellungen laden für Diagram-Layout
                    $project = $schema->projects()->first();
                    $settings = null;
                    if ($project) {
                        $settings = [
                            'maxNodesPerLevel' => $project->diagram_max_tables_per_row ?? 20,
                            'xStep' => $project->diagram_horizontal_spacing ?? 600,
                            'yStep' => $project->diagram_vertical_spacing ?? 700,
                            'tableWidth' => $project->diagram_table_width ?? 280,
                            'tableHeight' => $project->diagram_table_height ?? 450,
                        ];
                    }

                    // Layout generieren mit interner Methode
                    $diagramLayoutController = new \App\Http\Controllers\DiagramLayoutController();
                    $layoutPositions = $diagramLayoutController->generateLayoutInternal($tableNames, $foreignKeys, $settings);

                    // Layout in Datenbank speichern
                    if (!empty($layoutPositions)) {
                        // Konvertiere das Layout-Format: ['table' => ['x' => x, 'y' => y]]
                        // zu: ['table' => ['x_position' => x, 'y_position' => y, 'width' => w, 'height' => h]]
                        $formattedLayout = [];
                        $tableWidth = $settings['tableWidth'] ?? 280;
                        $tableHeight = $settings['tableHeight'] ?? 450;

                        foreach ($layoutPositions as $tableName => $position) {
                            $formattedLayout[$tableName] = [
                                'x_position' => $position['x'],
                                'y_position' => $position['y'],
                                'width' => $tableWidth,
                                'height' => $tableHeight,
                            ];
                        }

                        \App\Models\SchemaDesignerLayout::updateOrCreate(
                            [
                                'schema_id' => $schema->id,
                                'version_number' => $schemaVersion->version_number,
                            ],
                            [
                                'layout_data' => $formattedLayout, // Laravel cast macht automatisch json_encode
                            ]
                        );
                    }
                } catch (\Exception $e) {
                    \Log::error(__('sqlparsercontrollerphp261') . $e->getMessage());
                    \Log::error(__('sqlparsercontrollerphp262'), [
                        'file' => $e->getFile(),
                        'line' => $e->getLine(),
                        'trace' => $e->getTraceAsString()
                    ]);
                    // Nicht kritisch - Import wird trotzdem fortgesetzt
                }
            } else {
                // Copy schema_designer_layouts from previous version (if exists)
                if ($schema->last_version > 1) {
                    $previousVersion = $schema->last_version - 1;
                    $previousLayouts = \App\Models\SchemaDesignerLayout::where('schema_id', $schema->id)
                        ->where('version_number', $previousVersion)
                        ->get();

                    foreach ($previousLayouts as $layout) {
                        \App\Models\SchemaDesignerLayout::updateOrCreate(
                            [
                                'schema_id' => $schema->id,
                                'version_number' => $schemaVersion->version_number,
                            ],
                            [
                                'layout_data' => $layout->layout_data,
                            ]
                        );
                    }
                }
            }

            // 🔄 QUEUE JOBS: Dispatch regeneration jobs for affected projects
            $this->dispatchRegenerationJobs($schema);

            return response()->json([
                'success' => true,
                'schema_version_id' => $schemaVersion->id,
                'schema_id' => $schema->id,
                'version_number' => $schemaVersion->version_number,
                'version_name' => $schemaVersion->version_name,
                'tables_count' => count($parsedTables),
                'parsed_data' => $parsedTables,
            ]);
        } catch (\Exception $e) {
            // Log the full error for debugging
            \Log::error(__('sqlparsercontrollerphp305'), [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            // Provide detailed error message based on exception type
            $errorMessage = $e->getMessage();
            $errorDetails = [];

            // Check for SQL syntax errors
            if (strpos($errorMessage, 'syntax error') !== false || 
                strpos($errorMessage, 'parse error') !== false) {
                $errorDetails['type'] = __('sqlparsercontrollerphp319');
                $errorDetails['suggestion'] = __('sqlparsercontrollerphp320');
            }
            // Check for unsupported SQL features
            elseif (strpos($errorMessage, 'unsupported') !== false || 
                     strpos($errorMessage, 'not supported') !== false) {
                $errorDetails['type'] = __('sqlparsercontrollerphp325');
                $errorDetails['suggestion'] = __('sqlparsercontrollerphp326');
            }
            // Check for table/column related errors
            elseif (strpos($errorMessage, 'table') !== false || 
                     strpos($errorMessage, 'column') !== false) {
                $errorDetails['type'] = __('sqlparsercontrollerphp331');
                $errorDetails['suggestion'] = __('sqlparsercontrollerphp332');
            }
            // Generic parsing error
            else {
                $errorDetails['type'] = __('sqlparsercontrollerphp336');
                $errorDetails['suggestion'] = __('sqlparsercontrollerphp337');
            }

            // Extract SQL position information from error message if available
            $sqlLineInfo = '';
            if (preg_match('/SQL line: (\d+), character: (\d+)/', $errorMessage, $matches)) {
                $sqlLineInfo = " (SQL line: {$matches[1]}, character: {$matches[2]})";
            }

            return response()->json([
                'success' => false,
                'error' => $errorMessage,
                'error_type' => $errorDetails['type'],
                'suggestion' => $errorDetails['suggestion'],
                'sql_location' => $sqlLineInfo,
                'debug_file' => basename($e->getFile()),
                'debug_line' => $e->getLine(),
            ], 500);
        }
    }

    /**
     * 🛡️ BREAKING CHANGE DETECTION - Protects against data-destroying imports
     *
     * Validates that the new SQL import has at least one business table overlap
     * with the previous version to prevent accidental breaking changes.
     */
    private function validateNonBreakingChange(FloatingSchema $schema, array $newParsedTables): void
    {
        // Get the latest existing version
        $latestVersion = SchemaVersion::where('schema_id', $schema->id)
            ->orderBy('version_number', 'desc')
            ->first();

        // If this is the first version, no validation needed
        if (!$latestVersion) {
            return;
        }

        // Get tables from the latest version
        $existingTables = \App\Models\SchemaTable::where('schema_version_id', $latestVersion->id)
            ->pluck('table_name')
            ->toArray();

        // Get new table names from parsed SQL - fix for numeric indices
        $newTableNames = [];
        foreach ($newParsedTables as $tableData) {
            if (isset($tableData['table_name'])) {
                $newTableNames[] = $tableData['table_name'];
            }
        }

        // Define framework/system tables to ignore (these are common across projects)
        $systemTables = [
            'users', 'user', 'profile', 'profiles', 'cache', 'caches',
            'sessions', 'session', 'migrations', 'migration',
            'password_resets', 'password_reset_tokens', 'failed_jobs',
            'oauth_access_tokens', 'oauth_auth_codes', 'oauth_clients',
            'oauth_device_codes', 'oauth_refresh_tokens', 'oauth_personal_access_clients',
            'personal_access_tokens', 'jobs', 'job_batches',
            'telescope_entries', 'telescope_entries_tags', 'telescope_monitoring',
            'admin_settings', 'admin_users', 'notifications',
            'activity_log', 'model_has_permissions', 'model_has_roles',
            'permissions', 'roles', 'role_has_permissions'
        ];

        // Filter out system tables from both sets
        $businessExistingTables = array_diff($existingTables, $systemTables);
        $businessNewTables = array_diff($newTableNames, $systemTables);

        // Find overlap between business tables
        $tableOverlap = array_intersect($businessExistingTables, $businessNewTables);

        // If no business tables overlap, this is a breaking change
        if (empty($tableOverlap)) {
            $existingBusinessCount = count($businessExistingTables);
            $newBusinessCount = count($businessNewTables);

            // Create readable table lists - fix array handling
            $existingTablesList = empty($businessExistingTables) ? 'none' : implode(', ', array_slice(array_values($businessExistingTables), 0, 5));
            if ($existingBusinessCount > 5) $existingTablesList .= '...';

            $newTablesList = empty($businessNewTables) ? 'none' : implode(', ', array_slice(array_values($businessNewTables), 0, 5));
            if ($newBusinessCount > 5) $newTablesList .= '...';

            throw new \Exception(
                __('sqlparsercontrollerphp423')."\n\n" .
                __('sqlparsercontrollerphp424')."{$existingBusinessCount}".__('sqlparsercontrollerphp424_2')."{$existingTablesList}\n" .
                __('sqlparsercontrollerphp425')."{$newBusinessCount}".__('sqlparsercontrollerphp425_2')."{$newTablesList}\n\n" .
                __('sqlparsercontrollerphp426')."\n" .
                __('sqlparsercontrollerphp427')."\n" .
                __('sqlparsercontrollerphp428')
            );
        }
    }

    public function getSchemaVersion($id)
    {
        try {
            $schemaVersion = $this->schemaStorageService->getSchemaVersion($id);

            if (! $schemaVersion) {
                return response()->json([
                    'success' => false,
                    'error' => __('sqlparsercontrollerphp441'),
                ], 404);
            }

            return response()->json([
                'success' => true,
                'schema_version' => $schemaVersion,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    public function getAllSchemaVersions()
    {
        try {
            $versions = $this->schemaStorageService->getAllSchemaVersions();

            return response()->json([
                'success' => true,
                'versions' => $versions,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    public function getSchemaVersionByName($name)
    {
        try {
            $schemaVersion = $this->schemaStorageService->getSchemaVersionByName($name);

            if (! $schemaVersion) {
                return response()->json([
                    'success' => false,
                    'error' => __('sqlparsercontrollerphp482'),
                ], 404);
            }

            return response()->json([
                'success' => true,
                'schema_version' => $schemaVersion,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Validate SQL before import - check for missing FK references
     * Returns list of missing tables that are referenced by foreign keys
     */
    public function validateImport(Request $request)
    {
        // Increase PHP limits for large SQL operations
        ini_set('memory_limit', '1024M');
        ini_set('max_execution_time', 300); // 5 minutes

        try {
            // Get SQL script from request
            if ($request->isJson()) {
                $data = $request->json()->all();
                $sqlScript = $data['sql_script'] ?? '';
                $databaseType = $data['database_type'] ?? 'mysql';
                $schemaId = $data['schema_id'] ?? null;
                $appendToCurrentVersion = $data['append_to_current_version'] ?? false;
            } else {
                $sqlScript = $request->getContent();
                $databaseType = $request->header('X-Database-Type', 'mysql');
                $schemaId = $request->header('X-Schema-Id');
                $appendToCurrentVersion = filter_var($request->header('X-Append-To-Current-Version', 'false'), FILTER_VALIDATE_BOOLEAN);
            }

            if (empty(trim($sqlScript))) {
                return response()->json([
                    'success' => false,
                    'error' => 'SQL script is required',
                ], 400);
            }

            // Parse the SQL
            $parser = $this->getParser($databaseType);
            $parsedTables = $parser->parseSQL($sqlScript);

            if (empty($parsedTables)) {
                return response()->json([
                    'success' => false,
                    'error' => __('sqlparsercontrollerphp537'),
                ], 400);
            }

            // Get table names from parsed SQL
            $newTableNames = [];
            foreach ($parsedTables as $tableData) {
                if (isset($tableData['table_name'])) {
                    $newTableNames[] = strtolower($tableData['table_name']);
                }
            }

            // Get existing table names from schema (always check, not just for append)
            // This ensures we warn about missing FKs even on first import
            $existingTableNames = [];
            if ($schemaId) {
                $schema = FloatingSchema::find($schemaId);
                if ($schema) {
                    $latestVersion = SchemaVersion::where('schema_id', $schema->id)
                        ->orderBy('version_number', 'desc')
                        ->first();

                    if ($latestVersion) {
                        $existingTableNames = \App\Models\SchemaTable::where('schema_version_id', $latestVersion->id)
                            ->pluck('table_name')
                            ->map(fn($name) => strtolower($name))
                            ->toArray();
                    }
                }
            }

            // Combine all available tables (new tables from SQL + existing tables in schema)
            $allAvailableTables = array_unique(array_merge($newTableNames, $existingTableNames));

            // Find all FK references
            $missingTables = [];
            $fkDetails = [];

            foreach ($parsedTables as $tableData) {
                $tableName = $tableData['table_name'] ?? 'unknown';

                if (isset($tableData['constraints'])) {
                    foreach ($tableData['constraints'] as $constraint) {
                        if (isset($constraint['type']) && $constraint['type'] === 'FOREIGN KEY') {
                            // Support both formats:
                            // MySQL format: $constraint['references_table']
                            // PostgreSQL format: $constraint['references']['table']
                            $referencedTable = $constraint['references_table']
                                ?? $constraint['references']['table']
                                ?? null;

                            $referencedColumns = $constraint['references_columns']
                                ?? $constraint['references']['columns']
                                ?? [];

                            if ($referencedTable) {
                                $referencedTableLower = strtolower($referencedTable);

                                // Check if referenced table is NOT in available tables
                                if (!in_array($referencedTableLower, $allAvailableTables)) {
                                    if (!in_array($referencedTable, $missingTables)) {
                                        $missingTables[] = $referencedTable;
                                    }

                                    // Store FK detail for user info
                                    $fkDetails[] = [
                                        'from_table' => $tableName,
                                        'to_table' => $referencedTable,
                                        'columns' => $constraint['columns'] ?? [],
                                        'references_columns' => $referencedColumns,
                                    ];
                                }
                            }
                        }
                    }
                }
            }

            return response()->json([
                'success' => true,
                'tables_count' => count($parsedTables),
                'table_names' => array_values(array_unique($newTableNames)),
                'missing_fk_tables' => $missingTables,
                'fk_details' => $fkDetails,
                'has_missing_references' => count($missingTables) > 0,
                'existing_tables_count' => count($existingTableNames),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function debugParse(Request $request)
    {
        // Increase PHP limits for large SQL operations
        ini_set('memory_limit', '1024M');
        ini_set('max_execution_time', 300); // 5 minutes

        try {
            // Get SQL script from request
            if ($request->isJson()) {
                $data = $request->json()->all();
                $sqlScript = $data['sql_script'] ?? '';
                $databaseType = $data['database_type'] ?? 'mysql';
            } else {
                $sqlScript = $request->getContent();
                $databaseType = $request->header('X-Database-Type', 'mysql');
            }

            if (empty(trim($sqlScript))) {
                return response()->json([
                    'success' => false,
                    'error' => __('sqlparsercontrollerphp653'),
                ], 400);
            }

            // Try to parse and return detailed debug info
            $parser = $this->getParser($databaseType);
            $parsedTables = $parser->parseSQL($sqlScript);

            return response()->json([
                'success' => true,
                'message' => 'SQL parsed successfully',
                'database_type' => $databaseType,
                'tables_count' => count($parsedTables),
                'parsed_data' => $parsedTables,
            ]);

        } catch (\Exception $e) {
            // Return full exception details for debugging
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'exception_class' => get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'sql_preview' => substr($sqlScript ?? '', 0, 200),
            ], 500);
        }
    }

    /**
     * Dispatch regeneration jobs for all projects using this schema
     */
    private function dispatchRegenerationJobs(FloatingSchema $schema): void
    {
        // Find all projects that use this schema
        $projectIds = \DB::table('project_schemas')
            ->where('schema_id', $schema->id)
            ->pluck('project_id')
            ->unique()
            ->toArray();

        if (empty($projectIds)) {
            return;
        }

        // Dispatch queue jobs for each affected project
        foreach ($projectIds as $projectId) {
            try {
                \App\Jobs\RegenerateProjectGenerationTree::dispatch($projectId);
            } catch (\Exception $e) {
                \Log::error(__('sqlparsercontrollerphp704')."{$projectId}: " . $e->getMessage());
            }
        }
    }
}
