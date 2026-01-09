<?php

namespace App\Http\Controllers\Cli;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\FloatingSchema;
use App\Models\SchemaVersion;
use App\Models\SchemaTable;
use App\Models\SchemaField;
use App\Models\SchemaConstraint;
use App\Models\SchemaConstraintColumn;
use App\Models\SchemaForeignKeyReference;
use App\Models\SchemaForeignKeyReferenceColumn;
use App\Services\MySQLParser;
use App\Services\SchemaStorageService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class DatabaseController extends Controller
{
    /**
     * Check if user has access to project
     */
    private function userHasProjectAccess(Project $project, $user): bool
    {
        // Owner has access
        if ((string)$project->owner_id === (string)$user->id) {
            return true;
        }

        // Team members have access
        return $project->teams()->whereHas('members', function($query) use ($user) {
            $query->where('user_id', $user->id); // This is correct - team_members table uses user_id
        })->exists();
    }

    /**
     * Create a new database schema (empty)
     *
     * POST /cli/database/create
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function createSchema(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'project_id' => 'required|integer|exists:projects,id',
            'schema_name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $project = Project::find($request->input('project_id'));

        // Check access
        if (!$this->userHasProjectAccess($project, $request->user())) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied to this project',
            ], 403);
        }

        try {
            $schemaName = $request->input('schema_name');
            $description = $request->input('description', '');

            // Check if schema with same name already exists for this user
            $existingSchema = FloatingSchema::where('name', $schemaName)
                ->where('owner_id', $request->user()->id)
                ->first();

            if ($existingSchema) {
                return response()->json([
                    'success' => false,
                    'message' => 'Schema with this name already exists',
                ], 422);
            }

            // Create new schema
            $schema = FloatingSchema::create([
                'name' => $schemaName,
                'owner_id' => $request->user()->id,
                'description' => $description,
                'visibility' => 'private',
                'last_version' => 0,
            ]);

            // Link schema to project
            $project->floatingSchemas()->attach($schema->id, [
                'association_type' => 'linked',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Database schema created successfully',
                'schema' => [
                    'id' => $schema->id,
                    'name' => $schema->name,
                    'description' => $schema->description,
                    'version' => 0,
                    'created_at' => $schema->created_at->toIso8601String(),
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create schema',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Import database schema from SQL string into existing schema
     *
     * POST /cli/database/import-sql
     *
     * This endpoint expects raw SQL content (e.g., from mysqldump or local database export)
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function importSql(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'schema_id' => 'required|integer|exists:schemas,id',
            'sql_content' => 'required|string',
            'schema_version' => 'nullable|integer|min:1',
            'description' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $schema = FloatingSchema::find($request->input('schema_id'));

        // Check if user owns this schema
        if ((string)$schema->owner_id !== (string)$request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied to this schema',
            ], 403);
        }

        try {
            $sqlContent = $request->input('sql_content');
            $clientIp = $request->ip();
            $description = $request->input('description', "CLI Import from IP: {$clientIp}");
            $requestedVersion = $request->input('schema_version');

            // Parse SQL using MySQLParser
            $parser = new MySQLParser();
            $parsedTables = $parser->parseSQL($sqlContent);

            $storageService = new SchemaStorageService();

            // Check if user wants to import into existing version or create new one
            if ($requestedVersion) {
                // Import into EXISTING version (add tables, don't replace)
                $schemaVersion = SchemaVersion::where('schema_id', $schema->id)
                    ->where('version_number', $requestedVersion)
                    ->first();

                if (!$schemaVersion) {
                    return response()->json([
                        'success' => false,
                        'message' => "Version {$requestedVersion} not found for this schema",
                    ], 404);
                }

                // Add tables to existing version
                $storageService->addTablesToVersion($schemaVersion, $parsedTables);

                // Update description and imported_at
                $schemaVersion->update([
                    'description' => $description,
                    'imported_at' => now(),
                ]);

                $tablesCount = $schemaVersion->tables()->count();

                return response()->json([
                    'success' => true,
                    'message' => 'SQL imported into existing version successfully',
                    'schema' => [
                        'id' => $schema->id,
                        'name' => $schema->name,
                        'version' => $schemaVersion->version_number,
                        'tables_count' => $tablesCount,
                        'mode' => 'added_to_existing_version',
                    ],
                ], 200);

            } else {
                // Create NEW version (replace all tables)
                $latestVersion = $schema->versions()->orderBy('version_number', 'desc')->first();
                $newVersionNumber = $latestVersion ? $latestVersion->version_number + 1 : 1;

                $schemaVersion = SchemaVersion::create([
                    'schema_id' => $schema->id,
                    'version_number' => $newVersionNumber,
                    'version_name' => 'CLI Import v' . $newVersionNumber,
                    'description' => $description,
                    'imported_at' => now(),
                ]);

                // Store parsed tables (replaces all tables in this version)
                $storageService->storeParsedTablesInVersion($schemaVersion, $parsedTables);

                // Update schema's last_version
                $schema->update(['last_version' => $newVersionNumber]);

                return response()->json([
                    'success' => true,
                    'message' => 'SQL imported as new version successfully',
                    'schema' => [
                        'id' => $schema->id,
                        'name' => $schema->name,
                        'version' => $newVersionNumber,
                        'tables_count' => count($parsedTables),
                        'mode' => 'new_version_created',
                    ],
                ], 201);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'SQL import failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Copy a schema version to create a new version
     *
     * POST /cli/database/copy-version
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function copyVersion(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'schema_id' => 'required|integer|exists:schemas,id',
            'from_version' => 'nullable|integer|min:1',
            'description' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $schema = FloatingSchema::find($request->input('schema_id'));

        // Check if user owns this schema
        if ((string)$schema->owner_id !== (string)$request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied to this schema',
            ], 403);
        }

        try {
            $fromVersionNumber = $request->input('from_version');
            $clientIp = $request->ip();
            $description = $request->input('description', "Version copied from CLI IP: {$clientIp}");

            // Get source version (latest if not specified)
            if ($fromVersionNumber) {
                $sourceVersion = SchemaVersion::where('schema_id', $schema->id)
                    ->where('version_number', $fromVersionNumber)
                    ->first();

                if (!$sourceVersion) {
                    return response()->json([
                        'success' => false,
                        'message' => "Source version {$fromVersionNumber} not found",
                    ], 404);
                }
            } else {
                $sourceVersion = $schema->versions()->orderBy('version_number', 'desc')->first();

                if (!$sourceVersion) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No versions found to copy from',
                    ], 404);
                }
            }

            // Get next version number
            $latestVersion = $schema->versions()->orderBy('version_number', 'desc')->first();
            $newVersionNumber = $latestVersion->version_number + 1;

            // Create new version
            $newVersion = SchemaVersion::create([
                'schema_id' => $schema->id,
                'version_number' => $newVersionNumber,
                'version_name' => "Copy of v{$sourceVersion->version_number}",
                'description' => $description,
                'imported_at' => now(),
            ]);

            // Copy all tables from source version
            $sourceTables = $sourceVersion->tables()->with(['fields', 'constraints.constraintColumns', 'constraints.foreignKeyReference.referenceColumns'])->get();
            $tableIdMap = []; // Map old table IDs to new table IDs for foreign keys

            foreach ($sourceTables as $sourceTable) {
                // Create new table
                $newTable = SchemaTable::create([
                    'schema_id' => $schema->id,
                    'schema_version_id' => $newVersion->id,
                    'table_name' => $sourceTable->table_name,
                    'primarykeyfield' => $sourceTable->primarykeyfield,
                    'filekeyname' => $sourceTable->filekeyname,
                    'file_name_renamed' => $sourceTable->file_name_renamed,
                    'file_name_short' => $sourceTable->file_name_short,
                ]);

                $tableIdMap[$sourceTable->id] = $newTable->id;
                $fieldIdMap = []; // Map old field IDs to new field IDs

                // Copy fields
                foreach ($sourceTable->fields as $sourceField) {
                    $newField = SchemaField::create([
                        'table_id' => $newTable->id,
                        'field_name' => $sourceField->field_name,
                        'field_type' => $sourceField->field_type,
                        'field_length' => $sourceField->field_length,
                        'is_unsigned' => $sourceField->is_unsigned,
                        'is_nullable' => $sourceField->is_nullable,
                        'default_value' => $sourceField->default_value,
                        'is_auto_increment' => $sourceField->is_auto_increment,
                        'is_primary_key' => $sourceField->is_primary_key,
                        'is_unique' => $sourceField->is_unique,
                        'is_index' => $sourceField->is_index,
                        'field_order' => $sourceField->field_order,
                        'comment' => $sourceField->comment,
                    ]);

                    $fieldIdMap[$sourceField->id] = $newField->id;
                }

                // Copy constraints
                foreach ($sourceTable->constraints as $sourceConstraint) {
                    $newConstraint = SchemaConstraint::create([
                        'table_id' => $newTable->id,
                        'constraint_name' => $sourceConstraint->constraint_name,
                        'constraint_type' => $sourceConstraint->constraint_type,
                    ]);

                    // Copy constraint columns
                    foreach ($sourceConstraint->constraintColumns as $sourceConstraintColumn) {
                        if (isset($fieldIdMap[$sourceConstraintColumn->field_id])) {
                            SchemaConstraintColumn::create([
                                'constraint_id' => $newConstraint->id,
                                'field_id' => $fieldIdMap[$sourceConstraintColumn->field_id],
                                'column_order' => $sourceConstraintColumn->column_order,
                            ]);
                        }
                    }

                    // Copy foreign key reference if exists
                    if ($sourceConstraint->foreignKeyReference) {
                        $fkRef = $sourceConstraint->foreignKeyReference;

                        // Note: We'll need to update referenced_table_id after all tables are created
                        $newFkRef = SchemaForeignKeyReference::create([
                            'constraint_id' => $newConstraint->id,
                            'referenced_table_id' => $fkRef->referenced_table_id, // Will update later
                            'on_delete' => $fkRef->on_delete,
                            'on_update' => $fkRef->on_update,
                        ]);

                        // Copy reference columns
                        foreach ($fkRef->referenceColumns as $sourceRefColumn) {
                            SchemaForeignKeyReferenceColumn::create([
                                'reference_id' => $newFkRef->id,
                                'referenced_field_id' => $sourceRefColumn->referenced_field_id, // Will update later
                                'column_order' => $sourceRefColumn->column_order,
                            ]);
                        }
                    }
                }
            }

            // Update foreign key references to point to new table IDs
            $newTables = $newVersion->tables()->with(['constraints.foreignKeyReference'])->get();
            foreach ($newTables as $newTable) {
                foreach ($newTable->constraints as $constraint) {
                    if ($constraint->foreignKeyReference) {
                        $oldReferencedTableId = $constraint->foreignKeyReference->referenced_table_id;
                        if (isset($tableIdMap[$oldReferencedTableId])) {
                            $constraint->foreignKeyReference->update([
                                'referenced_table_id' => $tableIdMap[$oldReferencedTableId],
                            ]);
                        }
                    }
                }
            }

            // Copy schema_designer_layouts if they exist
            $designerLayout = DB::table('schema_designer_layouts')
                ->where('schema_id', $schema->id)
                ->where('version_number', $sourceVersion->version_number)
                ->first();

            if ($designerLayout) {
                DB::table('schema_designer_layouts')->insert([
                    'schema_id' => $schema->id,
                    'version_number' => $newVersionNumber,
                    'layout_data' => $designerLayout->layout_data,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Update schema's last_version
            $schema->update(['last_version' => $newVersionNumber]);

            $tablesCount = $newVersion->tables()->count();

            return response()->json([
                'success' => true,
                'message' => 'Version copied successfully',
                'schema' => [
                    'id' => $schema->id,
                    'name' => $schema->name,
                    'from_version' => $sourceVersion->version_number,
                    'new_version' => $newVersionNumber,
                    'tables_count' => $tablesCount,
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to copy version',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Import database schema (alias for importSql for backward compatibility)
     *
     * POST /cli/database/import
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function import(Request $request): JsonResponse
    {
        return $this->importSql($request);
    }

    /**
     * Export database schema as SQL
     *
     * POST /cli/database/export
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function export(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'schema_id' => 'required|integer|exists:schemas,id',
            'version_id' => 'nullable|integer|exists:schema_versions,id',
            'format' => 'in:mysql,postgresql,sqlite', // Future: support multiple formats
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $schema = FloatingSchema::find($request->input('schema_id'));

            // Check if user owns this schema
            if ((string)$schema->owner_id !== (string)$request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Access denied to this schema',
                ], 403);
            }

            // Get version (latest if not specified)
            $versionId = $request->input('version_id');
            if ($versionId) {
                $version = SchemaVersion::find($versionId);
            } else {
                $version = $schema->versions()->orderBy('version_number', 'desc')->first();
            }

            if (!$version) {
                return response()->json([
                    'success' => false,
                    'message' => 'No schema version found',
                ], 404);
            }

            // Get all tables for this version with all relationships
            $tables = $version->tables()->with([
                'fields',
                'constraints.constraintColumns.field',
                'constraints.foreignKeyReference.referencedTable',
                'constraints.foreignKeyReference.referenceColumns.referencedField'
            ])->get();

            // Generate SQL
            $sql = "-- Schema: {$schema->name}\n";
            $sql .= "-- Version: {$version->version_number}\n";
            $sql .= "-- Generated: " . now()->toDateTimeString() . "\n\n";

            foreach ($tables as $table) {
                $sql .= "CREATE TABLE `{$table->table_name}` (\n";

                // Fields
                $fieldSql = [];
                foreach ($table->fields as $field) {
                    $fieldLine = "  `{$field->field_name}` " . strtoupper($field->field_type);

                    // Add length for types that support it
                    if ($field->field_length && in_array(strtoupper($field->field_type), ['VARCHAR', 'CHAR', 'DECIMAL', 'NUMERIC', 'FLOAT', 'DOUBLE'])) {
                        $fieldLine .= "({$field->field_length})";
                    }

                    // Unsigned
                    if ($field->is_unsigned) {
                        $fieldLine .= " UNSIGNED";
                    }

                    // Nullable
                    if (!$field->is_nullable) {
                        $fieldLine .= " NOT NULL";
                    }

                    // Default value
                    if ($field->default_value !== null) {
                        $defaultValue = $field->default_value;

                        // Special SQL keywords (no quotes)
                        if (in_array(strtoupper($defaultValue), ['CURRENT_TIMESTAMP', 'NULL'])) {
                            $fieldLine .= " DEFAULT " . strtoupper($defaultValue);
                        }
                        // Boolean values (no quotes)
                        elseif (in_array(strtoupper($defaultValue), ['TRUE', 'FALSE'])) {
                            $fieldLine .= " DEFAULT " . strtoupper($defaultValue);
                        }
                        // Numeric values (no quotes)
                        elseif (is_numeric($defaultValue)) {
                            $fieldLine .= " DEFAULT " . $defaultValue;
                        }
                        // String values (with quotes)
                        else {
                            $fieldLine .= " DEFAULT '" . addslashes($defaultValue) . "'";
                        }
                    }

                    // Auto increment
                    if ($field->is_auto_increment) {
                        $fieldLine .= " AUTO_INCREMENT";
                    }

                    // Comment
                    if ($field->comment) {
                        $fieldLine .= " COMMENT '" . addslashes($field->comment) . "'";
                    }

                    $fieldSql[] = $fieldLine;
                }

                // Constraints
                foreach ($table->constraints as $constraint) {
                    // Get field names from constraint columns
                    $fieldNames = $constraint->constraintColumns
                        ->sortBy('column_order')
                        ->map(function($col) {
                            return "`{$col->field->field_name}`";
                        })
                        ->join(', ');

                    if ($constraint->constraint_type === 'PRIMARY KEY') {
                        $fieldSql[] = "  PRIMARY KEY ({$fieldNames})";
                    }
                    elseif ($constraint->constraint_type === 'UNIQUE') {
                        $constraintName = $constraint->constraint_name ?: 'uk_' . $table->table_name;
                        $fieldSql[] = "  UNIQUE KEY `{$constraintName}` ({$fieldNames})";
                    }
                    elseif ($constraint->constraint_type === 'KEY' || $constraint->constraint_type === 'INDEX') {
                        $constraintName = $constraint->constraint_name ?: 'idx_' . $table->table_name;
                        $fieldSql[] = "  KEY `{$constraintName}` ({$fieldNames})";
                    }
                    elseif ($constraint->constraint_type === 'FOREIGN KEY' && $constraint->foreignKeyReference) {
                        $fk = $constraint->foreignKeyReference;
                        $referencedTable = $fk->referencedTable;

                        $referencedFieldNames = $fk->referenceColumns
                            ->sortBy('column_order')
                            ->map(function($col) {
                                return "`{$col->referencedField->field_name}`";
                            })
                            ->join(', ');

                        $constraintName = $constraint->constraint_name ?: 'fk_' . $table->table_name;
                        $fkLine = "  CONSTRAINT `{$constraintName}` FOREIGN KEY ({$fieldNames}) REFERENCES `{$referencedTable->table_name}` ({$referencedFieldNames})";

                        if ($fk->on_delete && $fk->on_delete !== 'NO ACTION') {
                            $fkLine .= " ON DELETE " . strtoupper($fk->on_delete);
                        }
                        if ($fk->on_update && $fk->on_update !== 'NO ACTION') {
                            $fkLine .= " ON UPDATE " . strtoupper($fk->on_update);
                        }

                        $fieldSql[] = $fkLine;
                    }
                }

                $sql .= implode(",\n", $fieldSql);
                $sql .= "\n);\n\n";
            }

            return response()->json([
                'success' => true,
                'schema' => [
                    'id' => $schema->id,
                    'name' => $schema->name,
                    'version' => $version->version_number,
                    'tables_count' => $tables->count(),
                ],
                'sql' => $sql,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Database export failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * List databases/schemas for a project
     *
     * GET /cli/database/list?project_id=1
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function list(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'project_id' => 'required|integer|exists:projects,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $project = Project::find($request->input('project_id'));

        // Check access
        if (!$this->userHasProjectAccess($project, $request->user())) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied to this project',
            ], 403);
        }

        $schemas = $project->floatingSchemas()->with(['versions' => function($query) {
            $query->orderBy('version_number', 'desc');
        }])->get()->map(function ($schema) {
            $latestVersion = $schema->versions->first();
            $tablesCount = $latestVersion ? $latestVersion->tables()->count() : 0;

            return [
                'id' => $schema->id,
                'name' => $schema->name,
                'description' => $schema->description,
                'version' => $latestVersion ? $latestVersion->version_number : null,
                'version_id' => $latestVersion ? $latestVersion->id : null,
                'tables_count' => $tablesCount,
                'created_at' => $schema->created_at->toIso8601String(),
            ];
        });

        return response()->json([
            'success' => true,
            'schemas' => $schemas,
            'total' => $schemas->count(),
        ], 200);
    }

    /**
     * Get database structure (tables, fields, constraints)
     *
     * GET /cli/database/{schemaId}/structure
     *
     * @param int $schemaId
     * @param Request $request
     * @return JsonResponse
     */
    public function structure(int $schemaId, Request $request): JsonResponse
    {
        $schema = FloatingSchema::with(['versions' => function($query) {
            $query->orderBy('version_number', 'desc');
        }])->find($schemaId);

        if (!$schema) {
            return response()->json([
                'success' => false,
                'message' => 'Schema not found',
            ], 404);
        }

        // Check if user owns this schema or has access via project
        $hasAccess = (string)$schema->owner_id === (string)$request->user()->id;

        if (!$hasAccess) {
            // Check if user has access via project as direct member
            $hasAccess = $schema->projects()->whereHas('members', function($query) use ($request) {
                $query->where('user_id', $request->user()->id);
            })->exists();
        }

        if (!$hasAccess) {
            // Check if user has access via project as team member
            $hasAccess = $schema->projects()->whereHas('teams.members', function($query) use ($request) {
                $query->where('user_id', $request->user()->id);
            })->exists();
        }

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied to this schema',
            ], 403);
        }

        $latestVersion = $schema->versions->first();

        if (!$latestVersion) {
            return response()->json([
                'success' => false,
                'message' => 'No version found',
            ], 404);
        }

        // Get all tables with fields and constraints
        $tables = $latestVersion->tables()->with([
            'fields',
            'constraints.constraintColumns.field',
            'constraints.foreignKeyReference.referencedTable',
            'constraints.foreignKeyReference.referenceColumns.referencedField'
        ])->get()->map(function ($table) {
            return [
                'name' => $table->table_name,
                'primary_key' => $table->primarykeyfield,
                'file_key' => $table->filekeyname,
                'file_name_short' => $table->file_name_short,
                'file_name_renamed' => $table->file_name_renamed,
                'fields' => $table->fields->sortBy('field_order')->map(function ($field) {
                    return [
                        'name' => $field->field_name,
                        'type' => $field->field_type,
                        'length' => $field->field_length,
                        'unsigned' => $field->is_unsigned,
                        'nullable' => $field->is_nullable,
                        'default' => $field->default_value,
                        'auto_increment' => $field->is_auto_increment,
                        'primary_key' => $field->is_primary_key,
                        'unique' => $field->is_unique,
                        'index' => $field->is_index,
                        'comment' => $field->comment,
                    ];
                })->values(),
                'constraints' => $table->constraints->map(function ($constraint) {
                    // Get field names from constraint columns
                    $fields = $constraint->constraintColumns
                        ->sortBy('column_order')
                        ->map(function($col) {
                            return $col->field->field_name;
                        })
                        ->values()
                        ->toArray();

                    $constraintData = [
                        'type' => $constraint->constraint_type,
                        'name' => $constraint->constraint_name,
                        'fields' => $fields,
                        'referenced_table' => null,
                        'referenced_fields' => null,
                        'on_delete' => null,
                        'on_update' => null,
                    ];

                    // Add foreign key information if exists
                    if ($constraint->constraint_type === 'FOREIGN KEY' && $constraint->foreignKeyReference) {
                        $fk = $constraint->foreignKeyReference;
                        $constraintData['referenced_table'] = $fk->referencedTable->table_name;
                        $constraintData['referenced_fields'] = $fk->referenceColumns
                            ->sortBy('column_order')
                            ->map(function($col) {
                                return $col->referencedField->field_name;
                            })
                            ->values()
                            ->toArray();
                        $constraintData['on_delete'] = $fk->on_delete;
                        $constraintData['on_update'] = $fk->on_update;
                    }

                    return $constraintData;
                })->values(),
            ];
        });

        return response()->json([
            'success' => true,
            'schema' => [
                'id' => $schema->id,
                'name' => $schema->name,
                'version' => $latestVersion->version_number,
            ],
            'tables' => $tables,
        ], 200);
    }

    /**
     * List all versions of a schema
     *
     * GET /cli/database/{schemaId}/versions
     *
     * @param int $schemaId
     * @param Request $request
     * @return JsonResponse
     */
    public function listVersions(int $schemaId, Request $request): JsonResponse
    {
        $schema = FloatingSchema::find($schemaId);

        if (!$schema) {
            return response()->json([
                'success' => false,
                'message' => 'Schema not found',
            ], 404);
        }

        // Check if user owns this schema or has access via project
        $hasAccess = (string)$schema->owner_id === (string)$request->user()->id;

        if (!$hasAccess) {
            // Check if user has access via project as direct member
            $hasAccess = $schema->projects()->whereHas('members', function($query) use ($request) {
                $query->where('user_id', $request->user()->id);
            })->exists();
        }

        if (!$hasAccess) {
            // Check if user has access via project as team member
            $hasAccess = $schema->projects()->whereHas('teams.members', function($query) use ($request) {
                $query->where('user_id', $request->user()->id);
            })->exists();
        }

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'Access denied to this schema',
            ], 403);
        }

        $versions = SchemaVersion::where('schema_id', $schemaId)
            ->orderBy('version_number', 'asc')
            ->get()
            ->map(function ($version) {
                return [
                    'id' => $version->id,
                    'version_number' => $version->version_number,
                    'description' => $version->description,
                    'tables_count' => $version->tables()->count(),
                    'created_at' => $version->created_at->toIso8601String(),
                    'imported_at' => $version->imported_at ? $version->imported_at->toIso8601String() : null,
                ];
            });

        return response()->json([
            'success' => true,
            'schema' => [
                'id' => $schema->id,
                'name' => $schema->name,
            ],
            'versions' => $versions,
            'total' => $versions->count(),
        ], 200);
    }

    /**
     * Delete schema (hard delete)
     *
     * DELETE /cli/database/{schemaId}
     *
     * @param int $schemaId
     * @param Request $request
     * @return JsonResponse
     */
    public function delete(int $schemaId, Request $request): JsonResponse
    {
        $schema = FloatingSchema::find($schemaId);

        if (!$schema) {
            return response()->json([
                'success' => false,
                'message' => 'Schema not found',
            ], 404);
        }

        // Check if user owns this schema
        if ((string)$schema->owner_id !== (string)$request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Only schema owner can delete schema',
            ], 403);
        }

        try {
            // Hard delete - completely remove from database
            // Laravel will handle cascade deletes based on foreign key constraints
            $schema->delete();

            return response()->json([
                'success' => true,
                'message' => 'Schema deleted successfully',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete schema',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete schema version (hard delete)
     *
     * DELETE /cli/database/{schemaId}/versions/{versionIdentifier}
     *
     * @param int $schemaId
     * @param string $versionIdentifier - Can be version ID or version number (prefixed with 'v')
     * @param Request $request
     * @return JsonResponse
     */
    public function deleteVersion(int $schemaId, string $versionIdentifier, Request $request): JsonResponse
    {
        $schema = FloatingSchema::find($schemaId);

        if (!$schema) {
            return response()->json([
                'success' => false,
                'message' => 'Schema not found',
            ], 404);
        }

        // Check if user owns this schema
        if ((string)$schema->owner_id !== (string)$request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Only schema owner can delete versions',
            ], 403);
        }

        // Check if versionIdentifier is a version number (starts with 'v') or version ID
        if (str_starts_with($versionIdentifier, 'v')) {
            // Version number (e.g., 'v3')
            $versionNumber = (int)substr($versionIdentifier, 1);
            $version = SchemaVersion::where('schema_id', $schemaId)
                ->where('version_number', $versionNumber)
                ->first();
        } else {
            // Version ID
            $version = SchemaVersion::where('schema_id', $schemaId)
                ->where('id', (int)$versionIdentifier)
                ->first();
        }

        if (!$version) {
            return response()->json([
                'success' => false,
                'message' => 'Version not found',
            ], 404);
        }

        // Check if this is the last version - cannot delete if it's the only one
        $versionCount = SchemaVersion::where('schema_id', $schemaId)->count();
        if ($versionCount <= 1) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete the only version. Delete the schema instead.',
            ], 422);
        }

        try {
            // Hard delete - completely remove version with all tables, fields, constraints
            // Laravel will handle cascade deletes based on foreign key constraints
            $version->delete();

            return response()->json([
                'success' => true,
                'message' => 'Schema version deleted successfully',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete version',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
