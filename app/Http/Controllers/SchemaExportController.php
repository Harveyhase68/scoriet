<?php

namespace App\Http\Controllers;

use App\Models\FloatingSchema;
use App\Models\SchemaTable;
use App\Models\SchemaField;
use App\Models\SchemaConstraint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class SchemaExportController extends Controller
{
    /**
     * Export schema tables with complete structure information
     * Returns proper table data from schema_tables + schema_fields + schema_constraints
     * NOT from schema_designer_layouts (which only contains positioning info)
     */
    public function exportSchema($schemaId, Request $request)
    {
        try {
            $user = Auth::user();

            // Find the schema and check access permissions
            $schema = FloatingSchema::findOrFail($schemaId);

            if (!$schema->canBeAccessedBy($user->id)) {
                return response()->json([
                    'success' => false,
                    'error' => 'Access denied to this schema',
                ], 403);
            }

            // Get version if specified, otherwise use current version from schema_versions table
            $requestedVersion = $request->input('version');

            // Find the correct schema_version_id for this schema
            $schemaVersion = null;
            if ($requestedVersion) {
                $schemaVersion = DB::table('schema_versions')
                    ->where('schema_id', $schemaId)
                    ->where('version_number', $requestedVersion)
                    ->first();
            } else {
                // Get the latest version for this schema
                $schemaVersion = DB::table('schema_versions')
                    ->where('schema_id', $schemaId)
                    ->orderBy('version_number', 'desc')
                    ->first();
            }

            if (!$schemaVersion) {
                return response()->json([
                    'success' => false,
                    'error' => 'No version found for this schema',
                ], 404);
            }

            // Get all tables for this schema version with their complete structure
            // Support both direct schema_id lookup AND schema_version_id lookup
            $tables = SchemaTable::with([
                'fields' => function($query) {
                    $query->orderBy('field_order');
                },
                'constraints.constraintColumns.field',
                'constraints.foreignKeyReference.referenceColumns.referencedField'
            ])
            ->where(function($query) use ($schemaId, $schemaVersion) {
                // NEW: Try direct schema_id lookup first (proper architecture)
                $query->where('schema_id', $schemaId)
                      // FALLBACK: Use schema_version_id for legacy data
                      ->orWhere('schema_version_id', $schemaVersion->id);
            })
            ->orderBy('table_name')
            ->get();

            // Transform to a more export-friendly format
            $exportData = $tables->map(function ($table) {
                return [
                    'table_name' => $table->table_name,
                    'comment' => $table->comment,
                    'fields' => $table->fields->map(function ($field) {
                        return [
                            'field_name' => $field->field_name,
                            'field_type' => strtolower($field->field_type),
                            'is_nullable' => $field->is_nullable,
                            'is_unsigned' => $field->is_unsigned,
                            'is_auto_increment' => $field->is_auto_increment,
                            'default_value' => $field->default_value,
                            'field_order' => $field->field_order,
                            'comment' => $field->comment,
                        ];
                    }),
                    'constraints' => $table->constraints->map(function ($constraint) {
                        return [
                            'constraint_name' => $constraint->constraint_name,
                            'constraint_type' => $constraint->constraint_type,
                            'columns' => $constraint->constraintColumns->map(function ($col) {
                                return [
                                    'field_name' => $col->field->field_name,
                                    'column_order' => $col->column_order,
                                ];
                            }),
                        ];
                    }),
                ];
            });

            return response()->json([
                'success' => true,
                'schema_id' => $schemaId,
                'schema_name' => $schema->name,
                'version' => $schemaVersion->version_number,
                'version_name' => $schemaVersion->version_name,
                'table_count' => $tables->count(),
                'tables' => $exportData,
                'export_format' => 'structured_json',
                'generated_at' => now()->toISOString(),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Export failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export schema as MySQL SQL script
     */
    public function exportAsMySQL($schemaId, Request $request)
    {
        try {
            $user = Auth::user();

            // Find the schema and check access permissions
            $schema = FloatingSchema::findOrFail($schemaId);

            if (!$schema->canBeAccessedBy($user->id)) {
                return response()->json([
                    'success' => false,
                    'error' => 'Access denied to this schema',
                ], 403);
            }

            // Get version if specified, otherwise use current version from schema_versions table
            $requestedVersion = $request->input('version');

            // Find the correct schema_version_id for this schema
            $schemaVersion = null;
            if ($requestedVersion) {
                $schemaVersion = DB::table('schema_versions')
                    ->where('schema_id', $schemaId)
                    ->where('version_number', $requestedVersion)
                    ->first();
            } else {
                // Get the latest version for this schema
                $schemaVersion = DB::table('schema_versions')
                    ->where('schema_id', $schemaId)
                    ->orderBy('version_number', 'desc')
                    ->first();
            }

            if (!$schemaVersion) {
                return response()->json([
                    'success' => false,
                    'error' => 'No version found for this schema',
                ], 404);
            }

            // Get all tables for this schema version with their complete structure
            $tables = SchemaTable::with([
                'fields' => function($query) {
                    $query->orderBy('field_order');
                },
                'constraints.constraintColumns.field',
                'constraints.foreignKeyReference.referenceColumns.referencedField'
            ])
            ->where(function($query) use ($schemaId, $schemaVersion) {
                // NEW: Try direct schema_id lookup first (proper architecture)
                $query->where('schema_id', $schemaId)
                      // FALLBACK: Use schema_version_id for legacy data
                      ->orWhere('schema_version_id', $schemaVersion->id);
            })
            ->orderBy('table_name')
            ->get();

            if ($tables->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'error' => 'No tables found in this schema',
                ], 404);
            }

            // Generate MySQL SQL script
            $sql = $this->generateMySQLScript($schema, $tables, $schemaVersion->version_number);

            return response()->json([
                'success' => true,
                'sql' => $sql,
                'schema_name' => $schema->name,
                'version' => $schemaVersion->version_number,
                'version_name' => $schemaVersion->version_name,
                'table_count' => $tables->count(),
                'generated_at' => now()->toISOString(),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'MySQL export failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate MySQL CREATE TABLE script from schema tables
     */
    private function generateMySQLScript(FloatingSchema $schema, $tables, $version)
    {
        $lines = [];
        $lines[] = '-- MySQL Database Export';
        $lines[] = '-- Schema: ' . $schema->name;
        $lines[] = '-- Description: ' . ($schema->description ?: 'No description');
        $lines[] = '-- Version: ' . $version;
        $lines[] = '-- Generated: ' . now()->toDateTimeString();
        $lines[] = '-- Table count: ' . $tables->count();
        $lines[] = '';
        $lines[] = 'SET FOREIGN_KEY_CHECKS = 0;';
        $lines[] = '';

        foreach ($tables as $table) {
            $tableName = $table->table_name;
            $lines[] = '-- ============================================';
            $lines[] = '-- Table: ' . $tableName;
            if ($table->comment) {
                $lines[] = '-- Comment: ' . $table->comment;
            }
            $lines[] = '-- ============================================';
            $lines[] = '';
            $lines[] = 'DROP TABLE IF EXISTS `' . $tableName . '`;';
            $lines[] = 'CREATE TABLE `' . $tableName . '` (';

            // Generate field definitions
            $fieldLines = [];
            foreach ($table->fields as $field) {
                $fieldDef = '  `' . $field->field_name . '` ' . strtoupper($field->field_type);

                if ($field->is_unsigned) {
                    $fieldDef .= ' UNSIGNED';
                }

                if (!$field->is_nullable) {
                    $fieldDef .= ' NOT NULL';
                }

                if ($field->is_auto_increment) {
                    $fieldDef .= ' AUTO_INCREMENT';
                }

                if ($field->default_value !== null) {
                    if (in_array(strtolower($field->default_value), ['current_timestamp', 'now()'])) {
                        $fieldDef .= ' DEFAULT ' . strtoupper($field->default_value);
                    } else {
                        $fieldDef .= ' DEFAULT \'' . addslashes($field->default_value) . '\'';
                    }
                }

                if ($field->comment) {
                    $fieldDef .= ' COMMENT \'' . addslashes($field->comment) . '\'';
                }

                $fieldLines[] = $fieldDef;
            }

            // Add constraint definitions
            $constraintLines = [];

            // DEBUG: Log constraint processing for the first few tables
            if (in_array($table->table_name, ['accounting_log', 'atm_log', 'banking_accounts'])) {
                \Log::info("Processing constraints for table: {$table->table_name}");
                \Log::info("Constraint count: " . $table->constraints->count());
                foreach ($table->constraints as $constraint) {
                    \Log::info("Constraint: {$constraint->constraint_name} (type: {$constraint->constraint_type})");
                    \Log::info("ConstraintColumns count: " . $constraint->constraintColumns->count());
                }
            }

            foreach ($table->constraints as $constraint) {
                switch (strtoupper($constraint->constraint_type)) {
                    case 'PRIMARY':
                    case 'PRIMARY KEY':
                        $columns = $constraint->constraintColumns->sortBy('column_order')->map(function($cc) {
                            return $cc->field ? $cc->field->field_name : null;
                        })->filter();
                        if ($columns->isNotEmpty()) {
                            $constraintLines[] = '  PRIMARY KEY (`' . $columns->implode('`, `') . '`)';
                        }
                        break;

                    case 'UNIQUE':
                        $columns = $constraint->constraintColumns->sortBy('column_order')->map(function($cc) {
                            return $cc->field ? $cc->field->field_name : null;
                        })->filter();
                        if ($columns->isNotEmpty()) {
                            $constraintLines[] = '  UNIQUE KEY `' . $constraint->constraint_name . '` (`' . $columns->implode('`, `') . '`)';
                        }
                        break;

                    case 'INDEX':
                    case 'KEY':
                        $columns = $constraint->constraintColumns->sortBy('column_order')->map(function($cc) {
                            return $cc->field ? $cc->field->field_name : null;
                        })->filter();
                        if ($columns->isNotEmpty()) {
                            $constraintLines[] = '  KEY `' . $constraint->constraint_name . '` (`' . $columns->implode('`, `') . '`)';
                        }
                        break;

                    case 'FOREIGN':
                    case 'FOREIGN KEY':
                        $columns = $constraint->constraintColumns->sortBy('column_order')->map(function($cc) {
                            return $cc->field ? $cc->field->field_name : null;
                        })->filter();
                        if ($columns->isNotEmpty() && $constraint->foreignKeyReference) {
                            $reference = $constraint->foreignKeyReference;
                            $referenceColumns = $reference->referenceColumns->sortBy('column_order')->map(function($rc) {
                                return $rc->referencedField ? $rc->referencedField->field_name : null;
                            })->filter();

                            if ($referenceColumns->isNotEmpty()) {
                                $constraintDef = '  CONSTRAINT `' . $constraint->constraint_name . '` FOREIGN KEY (`' . $columns->implode('`, `') . '`) ';
                                $constraintDef .= 'REFERENCES `' . $reference->referenced_table . '` (`' . $referenceColumns->implode('`, `') . '`)';

                                // Add ON DELETE and ON UPDATE actions if specified
                                if ($reference->on_delete && $reference->on_delete !== 'RESTRICT') {
                                    $constraintDef .= ' ON DELETE ' . strtoupper($reference->on_delete);
                                }
                                if ($reference->on_update && $reference->on_update !== 'RESTRICT') {
                                    $constraintDef .= ' ON UPDATE ' . strtoupper($reference->on_update);
                                }

                                $constraintLines[] = $constraintDef;
                            }
                        }
                        break;
                }
            }

            // Combine fields and constraints
            $allLines = array_merge($fieldLines, $constraintLines);
            $lines[] = implode(",\n", $allLines);
            $lines[] = ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';

            if ($table->comment) {
                $lines[count($lines)-1] .= ' COMMENT=\'' . addslashes($table->comment) . '\'';
            }

            $lines[count($lines)-1] .= ';';
            $lines[] = '';
        }

        $lines[] = 'SET FOREIGN_KEY_CHECKS = 1;';
        $lines[] = '';
        $lines[] = '-- Export completed successfully';
        $lines[] = '-- Total tables exported: ' . $tables->count();

        return implode("\n", $lines);
    }

    /**
     * Get table count for a schema (quick endpoint)
     */
    public function getTableCount($schemaId)
    {
        try {
            $user = Auth::user();

            $schema = FloatingSchema::findOrFail($schemaId);

            if (!$schema->canBeAccessedBy($user->id)) {
                return response()->json([
                    'success' => false,
                    'error' => 'Access denied to this schema',
                ], 403);
            }

            $tableCount = SchemaTable::where('schema_id', $schemaId)->count();

            return response()->json([
                'success' => true,
                'schema_id' => $schemaId,
                'schema_name' => $schema->name,
                'table_count' => $tableCount,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to get table count: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Debug endpoint to test data loading (no auth required)
     */
    public function debug($schemaId)
    {
        try {
            // Get the floating schema
            $schema = FloatingSchema::find($schemaId);

            if (!$schema) {
                return response()->json([
                    'error' => 'Schema not found',
                    'schema_id' => $schemaId
                ], 404);
            }

            // Get current version from schema
            $version = $schema->last_version ?? 0;

            // Check database models and relationships
            $allSchemas = FloatingSchema::select('id', 'name')->get()->toArray();

            // Find the correct schema version
            $schemaVersion = DB::table('schema_versions')
                ->where('schema_id', $schemaId)
                ->orderBy('version_number', 'desc')
                ->first();

            if (!$schemaVersion) {
                return response()->json([
                    'error' => 'No version found for this schema',
                    'schema_id' => $schemaId
                ], 404);
            }

            // Get tables using the correct schema_version_id
            $tables = SchemaTable::with([
                'fields' => function($query) {
                    $query->orderBy('field_order');
                },
                'constraints.constraintColumns.field',
                'constraints.foreignKeyReference.referenceColumns.referencedField'
            ])
            ->where(function($query) use ($schemaId, $schemaVersion) {
                // NEW: Try direct schema_id lookup first (proper architecture)
                $query->where('schema_id', $schemaId)
                      // FALLBACK: Use schema_version_id for legacy data
                      ->orWhere('schema_version_id', $schemaVersion->id);
            })
            ->orderBy('table_name')
            ->get();

            // Let's examine the actual relationship structure
            $allSchemaVersions = DB::table('schema_versions')->get()->toArray();
            $sampleTables = DB::table('schema_tables')->select('id', 'schema_id', 'schema_version_id', 'table_name')->limit(10)->get()->toArray();

            // Check how many tables belong to different schema_version_ids
            $tablesPerVersion = DB::table('schema_tables')
                ->select('schema_version_id', DB::raw('count(*) as table_count'))
                ->groupBy('schema_version_id')
                ->get()
                ->toArray();

            return response()->json([
                'debug' => 'Schema relationship investigation - DEEP DIVE',
                'schema_id' => $schemaId,
                'schema_info' => $schema,
                'schema_version' => $schemaVersion,
                'correct_schema_version_id' => $schemaVersion->id,
                'found_tables_count' => $tables->count(),
                'table_names' => $tables->pluck('table_name')->toArray(),
                'relationship_analysis' => [
                    'all_schema_versions' => $allSchemaVersions,
                    'sample_tables_with_ids' => $sampleTables,
                    'tables_per_schema_version' => $tablesPerVersion
                ],
                'key_insight' => 'Schema → schema_versions → schema_tables (via schema_version_id)',
                'schema_id_in_tables' => 'NULL (not used in this system)'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Debug failed: ' . $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }
}