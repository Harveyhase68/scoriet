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

            if (!$schema->canBeAccessedBy($user)) {
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
            // Use DISTINCT to avoid duplicate tables when both schema_id and schema_version_id match
            $tables = SchemaTable::with([
                'fields' => function($query) {
                    $query->orderBy('field_order');
                },
                'constraints.constraintColumns.field',
                'constraints.foreignKeyReference.referencedTable', // Load the referenced table for FK
                'constraints.foreignKeyReference.referenceColumns.referencedField'
            ])
            ->where(function($query) use ($schemaId, $schemaVersion) {
                $query->where('schema_id', $schemaId)
                      ->orWhere('schema_version_id', $schemaVersion->id);
            })
            ->orderBy('table_name')
            ->get()
            ->unique('table_name'); // Remove duplicates by table_name

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

            if (!$schema->canBeAccessedBy($user)) {
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
            // Use unique() to avoid duplicate tables when both schema_id and schema_version_id match
            $tables = SchemaTable::with([
                'fields' => function($query) {
                    $query->orderBy('field_order');
                },
                'constraints.constraintColumns.field',
                'constraints.foreignKeyReference.referencedTable', // Load the referenced table for FK
                'constraints.foreignKeyReference.referenceColumns.referencedField'
            ])
            ->where(function($query) use ($schemaId, $schemaVersion) {
                $query->where('schema_id', $schemaId)
                      ->orWhere('schema_version_id', $schemaVersion->id);
            })
            ->orderBy('table_name')
            ->get()
            ->unique('table_name'); // Remove duplicates by table_name

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

        // Sort tables by foreign key dependencies (tables without FKs first)
        // Note: MySQL uses FOREIGN_KEY_CHECKS=0, so order is less critical, but still good practice
        $sortedTables = $this->sortTablesByDependencies($tables);

        foreach ($sortedTables as $table) {
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
                    $defaultValue = $this->convertDefaultValueToMySQL($field->default_value, $field->field_type);
                    $fieldDef .= ' DEFAULT ' . $defaultValue;
                }

                if ($field->comment) {
                    $fieldDef .= ' COMMENT \'' . addslashes($field->comment) . '\'';
                }

                $fieldLines[] = $fieldDef;
            }

            // Add constraint definitions
            $constraintLines = [];

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

                            // Get referenced table name from the relationship
                            $referencedTableName = $reference->referencedTable ? $reference->referencedTable->table_name : null;

                            if ($referenceColumns->isNotEmpty() && $referencedTableName) {
                                $constraintDef = '  CONSTRAINT `' . $constraint->constraint_name . '` FOREIGN KEY (`' . $columns->implode('`, `') . '`) ';
                                $constraintDef .= 'REFERENCES `' . $referencedTableName . '` (`' . $referenceColumns->implode('`, `') . '`)';

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
     * Export schema as PostgreSQL SQL script
     */
    public function exportAsPostgreSQL($schemaId, Request $request)
    {
        try {
            $user = Auth::user();

            // Find the schema and check access permissions
            $schema = FloatingSchema::findOrFail($schemaId);

            if (!$schema->canBeAccessedBy($user)) {
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
            // Use unique() to avoid duplicate tables when both schema_id and schema_version_id match
            $tables = SchemaTable::with([
                'fields' => function ($query) {
                    $query->orderBy('field_order');
                },
                'constraints.constraintColumns.field',
                'constraints.foreignKeyReference.referencedTable', // Load the referenced table for FK
                'constraints.foreignKeyReference.referenceColumns.referencedField'
            ])
            ->where(function ($query) use ($schemaId, $schemaVersion) {
                $query->where('schema_id', $schemaId)
                      ->orWhere('schema_version_id', $schemaVersion->id);
            })
            ->orderBy('table_name')
            ->get()
            ->unique('table_name'); // Remove duplicates by table_name

            if ($tables->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'error' => 'No tables found in this schema',
                ], 404);
            }

            // Generate PostgreSQL SQL script
            $sql = $this->generatePostgreSQLScript($schema, $tables, $schemaVersion->version_number);

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
                'error' => 'PostgreSQL export failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generate PostgreSQL CREATE TABLE script from schema tables
     */
    private function generatePostgreSQLScript(FloatingSchema $schema, $tables, $version)
    {
        $lines = [];
        $lines[] = '-- PostgreSQL Database Export';
        $lines[] = '-- Schema: ' . $schema->name;
        $lines[] = '-- Description: ' . ($schema->description ?: 'No description');
        $lines[] = '-- Version: ' . $version;
        $lines[] = '-- Generated: ' . now()->toDateTimeString();
        $lines[] = '-- Table count: ' . $tables->count();
        $lines[] = '';

        // Sort tables by foreign key dependencies (tables without FKs first)
        $sortedTables = $this->sortTablesByDependencies($tables);

        foreach ($sortedTables as $table) {
            $tableName = $table->table_name;
            $lines[] = '-- ============================================';
            $lines[] = '-- Table: ' . $tableName;
            if ($table->comment) {
                $lines[] = '-- Comment: ' . $table->comment;
            }
            $lines[] = '-- ============================================';
            $lines[] = '';
            $lines[] = 'DROP TABLE IF EXISTS "' . $tableName . '" CASCADE;';
            $lines[] = 'CREATE TABLE "' . $tableName . '" (';

            // Generate field definitions
            $fieldLines = [];
            $primaryKeyField = null;

            foreach ($table->fields as $field) {
                $pgType = $this->mapMySQLToPostgreSQLType($field);

                // Check if this is the primary key with auto_increment
                if ($field->is_auto_increment) {
                    $primaryKeyField = $field->field_name;
                    // Use SERIAL/BIGSERIAL for auto-increment
                    if (stripos($field->field_type, 'bigint') !== false) {
                        $pgType = 'BIGSERIAL';
                    } else {
                        $pgType = 'SERIAL';
                    }
                    $fieldDef = '    "' . $field->field_name . '" ' . $pgType;
                } else {
                    $fieldDef = '    "' . $field->field_name . '" ' . $pgType;
                }

                // NOT NULL constraint (SERIAL types are automatically NOT NULL)
                if (!$field->is_nullable && !$field->is_auto_increment) {
                    $fieldDef .= ' NOT NULL';
                }

                // Default value (not for SERIAL types)
                if ($field->default_value !== null && !$field->is_auto_increment) {
                    $defaultValue = $this->convertDefaultValueToPostgreSQL($field->default_value, $pgType);
                    $fieldDef .= ' DEFAULT ' . $defaultValue;
                }

                $fieldLines[] = $fieldDef;
            }

            // Add constraint definitions
            $constraintLines = [];

            foreach ($table->constraints as $constraint) {
                switch (strtoupper($constraint->constraint_type)) {
                    case 'PRIMARY':
                    case 'PRIMARY KEY':
                        $columns = $constraint->constraintColumns->sortBy('column_order')->map(function ($cc) {
                            return $cc->field ? $cc->field->field_name : null;
                        })->filter();
                        if ($columns->isNotEmpty()) {
                            $constraintLines[] = '    PRIMARY KEY ("' . $columns->implode('", "') . '")';
                        }
                        break;

                    case 'UNIQUE':
                        $columns = $constraint->constraintColumns->sortBy('column_order')->map(function ($cc) {
                            return $cc->field ? $cc->field->field_name : null;
                        })->filter();
                        if ($columns->isNotEmpty()) {
                            $constraintLines[] = '    CONSTRAINT "' . $constraint->constraint_name . '" UNIQUE ("' . $columns->implode('", "') . '")';
                        }
                        break;

                    case 'FOREIGN':
                    case 'FOREIGN KEY':
                        $columns = $constraint->constraintColumns->sortBy('column_order')->map(function ($cc) {
                            return $cc->field ? $cc->field->field_name : null;
                        })->filter();
                        if ($columns->isNotEmpty() && $constraint->foreignKeyReference) {
                            $reference = $constraint->foreignKeyReference;
                            $referenceColumns = $reference->referenceColumns->sortBy('column_order')->map(function ($rc) {
                                return $rc->referencedField ? $rc->referencedField->field_name : null;
                            })->filter();

                            // Get referenced table name from the relationship
                            $referencedTableName = $reference->referencedTable ? $reference->referencedTable->table_name : null;

                            if ($referenceColumns->isNotEmpty() && $referencedTableName) {
                                $constraintDef = '    CONSTRAINT "' . $constraint->constraint_name . '" FOREIGN KEY ("' . $columns->implode('", "') . '") ';
                                $constraintDef .= 'REFERENCES "' . $referencedTableName . '" ("' . $referenceColumns->implode('", "') . '")';

                                // Add ON DELETE and ON UPDATE actions
                                if ($reference->on_delete && strtoupper($reference->on_delete) !== 'RESTRICT') {
                                    $constraintDef .= ' ON DELETE ' . strtoupper($reference->on_delete);
                                }
                                if ($reference->on_update && strtoupper($reference->on_update) !== 'RESTRICT') {
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
            $lines[] = ');';

            // Add table comment separately in PostgreSQL
            if ($table->comment) {
                $lines[] = 'COMMENT ON TABLE "' . $tableName . '" IS \'' . str_replace("'", "''", $table->comment) . '\';';
            }

            // Add column comments
            foreach ($table->fields as $field) {
                if ($field->comment) {
                    $lines[] = 'COMMENT ON COLUMN "' . $tableName . '"."' . $field->field_name . '" IS \'' . str_replace("'", "''", $field->comment) . '\';';
                }
            }

            $lines[] = '';

            // Create indexes separately in PostgreSQL (INDEX/KEY constraints)
            foreach ($table->constraints as $constraint) {
                if (in_array(strtoupper($constraint->constraint_type), ['INDEX', 'KEY'])) {
                    $columns = $constraint->constraintColumns->sortBy('column_order')->map(function ($cc) {
                        return $cc->field ? $cc->field->field_name : null;
                    })->filter();
                    if ($columns->isNotEmpty()) {
                        $lines[] = 'CREATE INDEX "' . $constraint->constraint_name . '" ON "' . $tableName . '" ("' . $columns->implode('", "') . '");';
                    }
                }
            }
        }

        $lines[] = '';
        $lines[] = '-- Export completed successfully';
        $lines[] = '-- Total tables exported: ' . $tables->count();

        return implode("\n", $lines);
    }

    /**
     * Sort tables by foreign key dependencies using topological sort
     * Tables without FK dependencies come first, then tables that depend on already-created tables
     */
    private function sortTablesByDependencies($tables)
    {
        // Build dependency graph
        $tableNames = $tables->pluck('table_name')->toArray();
        $dependencies = [];
        $tableMap = [];

        foreach ($tables as $table) {
            $tableName = $table->table_name;
            $tableMap[$tableName] = $table;
            $dependencies[$tableName] = [];

            // Find all foreign key references
            foreach ($table->constraints as $constraint) {
                if (in_array(strtoupper($constraint->constraint_type), ['FOREIGN', 'FOREIGN KEY'])) {
                    if ($constraint->foreignKeyReference && $constraint->foreignKeyReference->referencedTable) {
                        $referencedTableName = $constraint->foreignKeyReference->referencedTable->table_name;
                        // Only add dependency if the referenced table is in our export set
                        if (in_array($referencedTableName, $tableNames) && $referencedTableName !== $tableName) {
                            $dependencies[$tableName][] = $referencedTableName;
                        }
                    }
                }
            }
        }

        // Topological sort using Kahn's algorithm
        $sorted = [];
        $noDependencies = [];

        // Find tables with no dependencies
        foreach ($dependencies as $tableName => $deps) {
            if (empty($deps)) {
                $noDependencies[] = $tableName;
            }
        }

        while (!empty($noDependencies)) {
            $tableName = array_shift($noDependencies);
            $sorted[] = $tableName;

            // Remove this table from other tables' dependencies
            foreach ($dependencies as $otherTable => &$deps) {
                $key = array_search($tableName, $deps);
                if ($key !== false) {
                    unset($deps[$key]);
                    $deps = array_values($deps); // Re-index array
                    if (empty($deps) && !in_array($otherTable, $sorted)) {
                        $noDependencies[] = $otherTable;
                    }
                }
            }
        }

        // Check for circular dependencies - add remaining tables at the end
        foreach ($tableNames as $tableName) {
            if (!in_array($tableName, $sorted)) {
                $sorted[] = $tableName;
            }
        }

        // Return tables in sorted order
        $result = [];
        foreach ($sorted as $tableName) {
            if (isset($tableMap[$tableName])) {
                $result[] = $tableMap[$tableName];
            }
        }

        return collect($result);
    }

    /**
     * Map MySQL data types to PostgreSQL equivalents
     */
    private function mapMySQLToPostgreSQLType($field)
    {
        $mysqlType = strtolower($field->field_type);

        // Extract base type without length/precision
        $baseType = preg_replace('/\(.*\)/', '', $mysqlType);
        $baseType = trim($baseType);

        // Type mapping from MySQL to PostgreSQL
        $typeMap = [
            // Integer types
            'tinyint' => 'SMALLINT',
            'smallint' => 'SMALLINT',
            'mediumint' => 'INTEGER',
            'int' => 'INTEGER',
            'integer' => 'INTEGER',
            'bigint' => 'BIGINT',

            // Floating point types
            'float' => 'REAL',
            'double' => 'DOUBLE PRECISION',
            'decimal' => 'DECIMAL',
            'numeric' => 'NUMERIC',

            // String types
            'char' => 'CHAR',
            'varchar' => 'VARCHAR',
            'tinytext' => 'TEXT',
            'text' => 'TEXT',
            'mediumtext' => 'TEXT',
            'longtext' => 'TEXT',

            // Binary types
            'tinyblob' => 'BYTEA',
            'blob' => 'BYTEA',
            'mediumblob' => 'BYTEA',
            'longblob' => 'BYTEA',
            'binary' => 'BYTEA',
            'varbinary' => 'BYTEA',

            // Date/Time types
            'date' => 'DATE',
            'datetime' => 'TIMESTAMP',
            'timestamp' => 'TIMESTAMP',
            'time' => 'TIME',
            'year' => 'SMALLINT',

            // Other types
            'bool' => 'BOOLEAN',
            'boolean' => 'BOOLEAN',
            'enum' => 'VARCHAR(255)',  // PostgreSQL doesn't have ENUM by default, use VARCHAR or create custom type
            'set' => 'VARCHAR(255)',   // Similar handling for SET
            'json' => 'JSONB',         // Use JSONB for better performance
        ];

        // Check for TINYINT(1) which is typically BOOLEAN in MySQL
        if ($baseType === 'tinyint') {
            // Check if it's used as boolean (length 1)
            if (preg_match('/tinyint\s*\(\s*1\s*\)/i', $mysqlType)) {
                return 'BOOLEAN';
            }
        }

        // Get the mapped type
        $pgType = $typeMap[$baseType] ?? 'TEXT';

        // Handle types that need length specification
        if (in_array($baseType, ['char', 'varchar'])) {
            // Extract length from original type
            if (preg_match('/\((\d+)\)/', $mysqlType, $matches)) {
                $pgType = strtoupper($baseType) . '(' . $matches[1] . ')';
            }
        }

        // Handle DECIMAL/NUMERIC with precision and scale
        if (in_array($baseType, ['decimal', 'numeric'])) {
            if (preg_match('/\((\d+)(?:,\s*(\d+))?\)/', $mysqlType, $matches)) {
                $precision = $matches[1];
                $scale = $matches[2] ?? '0';
                $pgType = 'NUMERIC(' . $precision . ',' . $scale . ')';
            }
        }

        // Handle ENUM - extract values and create CHECK constraint or use VARCHAR
        if ($baseType === 'enum') {
            // For now, just use VARCHAR(255) - could be improved to create custom types
            $pgType = 'VARCHAR(255)';
        }

        return $pgType;
    }

    /**
     * Convert MySQL default values to PostgreSQL format
     */
    private function convertDefaultValueToPostgreSQL($value, $pgType)
    {
        $upperValue = strtoupper($value);
        $upperPgType = strtoupper($pgType);

        // Handle special MySQL default values
        if (in_array($upperValue, ['CURRENT_TIMESTAMP', 'NOW()'])) {
            return 'CURRENT_TIMESTAMP';
        }

        if ($upperValue === 'NULL') {
            return 'NULL';
        }

        // Handle boolean values for BOOLEAN type
        if ($upperPgType === 'BOOLEAN') {
            if (in_array($value, ['1', 'true', 'TRUE'])) {
                return 'TRUE';
            }
            if (in_array($value, ['0', 'false', 'FALSE'])) {
                return 'FALSE';
            }
        }

        // Handle boolean-like values for numeric types (SMALLINT, INTEGER, BIGINT, etc.)
        // MySQL sometimes uses 'FALSE'/'TRUE' as defaults for numeric columns
        $numericTypes = ['SMALLINT', 'INTEGER', 'INT', 'BIGINT', 'TINYINT', 'MEDIUMINT', 'NUMERIC', 'DECIMAL'];
        if (in_array($upperPgType, $numericTypes)) {
            if (in_array($upperValue, ['TRUE', 'FALSE'])) {
                return $upperValue === 'TRUE' ? '1' : '0';
            }
        }

        // Handle numeric values (no quotes needed)
        if (is_numeric($value)) {
            return $value;
        }

        // Handle string values - use single quotes and escape properly
        return "'" . str_replace("'", "''", $value) . "'";
    }

    /**
     * Convert default values to MySQL format
     * Handles boolean-like values (TRUE/FALSE -> 0/1) for TINYINT columns
     */
    private function convertDefaultValueToMySQL($value, $fieldType)
    {
        $upperValue = strtoupper($value);
        $lowerFieldType = strtolower($fieldType);

        // Extract base type without length/precision
        $baseType = preg_replace('/\(.*\)/', '', $lowerFieldType);
        $baseType = trim($baseType);

        // Handle special MySQL default values
        if (in_array($upperValue, ['CURRENT_TIMESTAMP', 'NOW()'])) {
            return strtoupper($value);
        }

        if ($upperValue === 'NULL') {
            return 'NULL';
        }

        // Handle boolean-like values for TINYINT columns
        // MySQL doesn't accept 'TRUE'/'FALSE' as defaults - must use 0/1
        $integerTypes = ['tinyint', 'smallint', 'mediumint', 'int', 'integer', 'bigint'];
        if (in_array($baseType, $integerTypes)) {
            if (in_array($upperValue, ['TRUE', 'FALSE'])) {
                return $upperValue === 'TRUE' ? '1' : '0';
            }
        }

        // Handle numeric values (no quotes needed)
        if (is_numeric($value)) {
            return $value;
        }

        // Handle string values - use single quotes and escape properly
        return "'" . addslashes($value) . "'";
    }

    /**
     * Get table count for a schema (quick endpoint)
     */
    public function getTableCount($schemaId)
    {
        try {
            $user = Auth::user();

            $schema = FloatingSchema::findOrFail($schemaId);

            if (!$schema->canBeAccessedBy($user)) {
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
            // Use unique() to avoid duplicate tables
            $tables = SchemaTable::with([
                'fields' => function($query) {
                    $query->orderBy('field_order');
                },
                'constraints.constraintColumns.field',
                'constraints.foreignKeyReference.referencedTable', // Load the referenced table for FK
                'constraints.foreignKeyReference.referenceColumns.referencedField'
            ])
            ->where(function($query) use ($schemaId, $schemaVersion) {
                $query->where('schema_id', $schemaId)
                      ->orWhere('schema_version_id', $schemaVersion->id);
            })
            ->orderBy('table_name')
            ->get()
            ->unique('table_name'); // Remove duplicates by table_name

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