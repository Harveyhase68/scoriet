<?php

namespace App\Http\Controllers;

use App\Services\MySQLParser;
use App\Services\SchemaStorageService;
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
        // Optional: JSON with additional parameters
        if ($request->isJson()) {
            $data = $request->json()->all();
            $sqlScript = $data['sql_script'] ?? '';
            $versionName = $data['version_name'] ?? 'Version '.date('Y-m-d H:i:s');
            $description = $data['description'] ?? null;
        } else {
            // Raw body for SQL script
            $sqlScript = $request->getContent();
            $versionName = $request->header('X-Version-Name', 'Version '.date('Y-m-d H:i:s'));
            $description = $request->header('X-Description');
        }

        // Validation
        if (empty(trim($sqlScript))) {
            return response()->json([
                'success' => false,
                'error' => 'SQL script is required',
            ], 400);
        }

        try {
            // SQL parsen
            $parser = new MySQLParser;
            $parsedTables = $parser->parseSQL($sqlScript);

            // In Datenbank speichern
            $schemaVersion = $this->schemaStorageService->storeSchema(
                $parsedTables,
                $versionName,
                $description
            );

            return response()->json([
                'success' => true,
                'schema_version_id' => $schemaVersion->id,
                'version_name' => $schemaVersion->version_name,
                'tables_count' => count($parsedTables),
                'parsed_data' => $parsedTables,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 400);
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
}
