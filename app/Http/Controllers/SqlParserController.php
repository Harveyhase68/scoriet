<?php

namespace App\Http\Controllers;

use App\Services\MySQLParser;
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

    public function parse(Request $request)
    {
        // Read raw body instead of JSON
        $sqlScript = $request->getContent();

        // Validation for raw data
        if (empty(trim($sqlScript))) {
            return response()->json([
                'success' => false,
                'error' => 'SQL script is required',
            ], 400);
        }

        try {
            $parser = new MySQLParser;
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
        } else {
            // Raw body for SQL script
            $sqlScript = $request->getContent();
            $schemaId = $request->header('X-Schema-Id');
            $description = $request->header('X-Description');
        }

        // Validation
        if (empty(trim($sqlScript))) {
            return response()->json([
                'success' => false,
                'error' => 'SQL script is required',
            ], 400);
        }

        if (!$schemaId) {
            return response()->json([
                'success' => false,
                'error' => 'Schema ID is required',
            ], 400);
        }

        try {
            // Check if schema exists and user has access
            $schema = FloatingSchema::find($schemaId);
            if (!$schema) {
                return response()->json([
                    'success' => false,
                    'error' => 'Schema not found',
                ], 404);
            }

            // Check if user can edit this schema
            $user = auth()->user();
            if (!$schema->canBeEditedBy($user)) {
                return response()->json([
                    'success' => false,
                    'error' => 'You do not have permission to edit this schema',
                ], 403);
            }

            // SQL parsen
            $parser = new MySQLParser;
            $parsedTables = $parser->parseSQL($sqlScript);

            // 🛡️ BREAKING CHANGE DETECTION - Critical Security Check
            $this->validateNonBreakingChange($schema, $parsedTables);

            // Create new schema version for the floating schema
            $schemaVersion = SchemaVersion::createNewVersion(
                $schema,
                $description
            );

            // Store parsed tables in the new version using the existing service
            $this->schemaStorageService->storeParsedTablesInVersion($schemaVersion, $parsedTables);

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
            \Log::error('SQL Import failed', [
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
                $errorDetails['type'] = 'Syntax Error';
                $errorDetails['suggestion'] = 'Please check your SQL syntax for missing semicolons, parentheses, or invalid keywords.';
            }
            // Check for unsupported SQL features
            elseif (strpos($errorMessage, 'unsupported') !== false || 
                     strpos($errorMessage, 'not supported') !== false) {
                $errorDetails['type'] = 'Unsupported Feature';
                $errorDetails['suggestion'] = 'This SQL feature is not yet supported by our parser. Please try simplifying your SQL.';
            }
            // Check for table/column related errors
            elseif (strpos($errorMessage, 'table') !== false || 
                     strpos($errorMessage, 'column') !== false) {
                $errorDetails['type'] = 'Table/Column Error';
                $errorDetails['suggestion'] = 'Please check table and column definitions for correct syntax.';
            }
            // Generic parsing error
            else {
                $errorDetails['type'] = 'Parsing Error';
                $errorDetails['suggestion'] = 'Please check your SQL for common issues like missing semicolons, incorrect keywords, or unsupported syntax.';
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

        // 🐛 DEBUG: Log what we found
        \Log::info("🐛 Breaking change debug", [
            'existing_tables_raw' => $existingTables,
            'new_table_names_raw' => $newTableNames,
            'parsed_tables_keys' => array_keys($newParsedTables),
            'parsed_tables_sample' => array_slice($newParsedTables, 0, 2)
        ]);

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

        // 🐛 DEBUG: Log after filtering
        \Log::info("🐛 After system table filtering", [
            'business_existing_tables' => $businessExistingTables,
            'business_new_tables' => $businessNewTables,
            'system_tables_filtered' => $systemTables
        ]);

        // Find overlap between business tables
        $tableOverlap = array_intersect($businessExistingTables, $businessNewTables);

        // If no business tables overlap, this is a breaking change
        if (empty($tableOverlap)) {
            $existingBusinessCount = count($businessExistingTables);
            $newBusinessCount = count($businessNewTables);

            // 🐛 DEBUG: Log the exact values before creating lists
            \Log::error("🐛 Error message debug", [
                'businessExistingTables' => $businessExistingTables,
                'businessNewTables' => $businessNewTables,
                'existingBusinessCount' => $existingBusinessCount,
                'newBusinessCount' => $newBusinessCount,
                'businessExistingTables_type' => gettype($businessExistingTables),
                'businessNewTables_type' => gettype($businessNewTables)
            ]);

            // Create readable table lists - fix array handling
            $existingTablesList = empty($businessExistingTables) ? 'none' : implode(', ', array_slice(array_values($businessExistingTables), 0, 5));
            if ($existingBusinessCount > 5) $existingTablesList .= '...';

            $newTablesList = empty($businessNewTables) ? 'none' : implode(', ', array_slice(array_values($businessNewTables), 0, 5));
            if ($newBusinessCount > 5) $newTablesList .= '...';

            throw new \Exception(
                "🛡️ BREAKING CHANGE DETECTED: This SQL import would create a completely new database structure with no table overlap.\n\n" .
                "Current version has {$existingBusinessCount} business tables: {$existingTablesList}\n" .
                "New import has {$newBusinessCount} business tables: {$newTablesList}\n\n" .
                "🚨 For data safety, this import has been blocked.\n" .
                "✅ Solution: Create a new database/schema for this structure instead of versioning the existing one.\n" .
                "✅ Alternative: Ensure at least one business table name matches between versions."
            );
        }

        \Log::info("✅ Breaking change validation passed", [
            'schema_id' => $schema->id,
            'schema_name' => $schema->name,
            'overlapping_tables' => $tableOverlap,
            'existing_business_tables' => count($businessExistingTables),
            'new_business_tables' => count($businessNewTables)
        ]);
    }

    public function getSchemaVersion($id)
    {
        try {
            $schemaVersion = $this->schemaStorageService->getSchemaVersion($id);

            if (! $schemaVersion) {
                return response()->json([
                    'success' => false,
                    'error' => 'Schema version not found',
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
                    'error' => 'Schema version not found',
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
            } else {
                $sqlScript = $request->getContent();
            }

            if (empty(trim($sqlScript))) {
                return response()->json([
                    'success' => false,
                    'error' => 'SQL script is required',
                ], 400);
            }

            // Try to parse and return detailed debug info
            $parser = new MySQLParser;
            $parsedTables = $parser->parseSQL($sqlScript);

            return response()->json([
                'success' => true,
                'message' => 'SQL parsed successfully',
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
}
