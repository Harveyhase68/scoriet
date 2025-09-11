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
