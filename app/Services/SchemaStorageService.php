<?php

namespace App\Services;

use App\Models\SchemaConstraint;
use App\Models\SchemaConstraintColumn;
use App\Models\SchemaField;
use App\Models\SchemaForeignKeyReference;
use App\Models\SchemaForeignKeyReferenceColumn;
use App\Models\SchemaTable;
use App\Models\SchemaVersion;
use Illuminate\Support\Facades\DB;

class SchemaStorageService
{
    public function storeSchema(array $parsedTables, string $versionName, ?string $description = null)
    {
        return DB::transaction(function () use ($parsedTables, $versionName, $description) {
            // Schema Version erstellen
            $schemaVersion = SchemaVersion::create([
                'version_name' => $versionName,
                'description' => $description,
            ]);

            $tableMap = []; // For foreign key references

            // First phase: Save tables and fields
            foreach ($parsedTables as $tableData) {
                $table = $this->storeTable($schemaVersion, $tableData);
                $tableMap[$tableData['table_name']] = $table;

                $this->storeFields($table, $tableData['fields']);
            }

            // Zweite Phase: Constraints speichern (nachdem alle Tabellen existieren)
            foreach ($parsedTables as $tableData) {
                $table = $tableMap[$tableData['table_name']];
                $this->storeConstraints($table, $tableData['constraints'], $tableMap);
            }

            return $schemaVersion;
        });
    }

    private function storeTable(SchemaVersion $schemaVersion, array $tableData): SchemaTable
    {
        // Check if table already exists in this schema version
        $existingTable = SchemaTable::where('schema_version_id', $schemaVersion->id)
            ->where('table_name', $tableData['table_name'])
            ->first();

        if ($existingTable) {
            return $existingTable; // Return existing table instead of creating duplicate
        }

        return SchemaTable::create([
            'schema_id' => $schemaVersion->schema_id, // ← ADD: Direct schema relationship
            'schema_version_id' => $schemaVersion->id,
            'table_name' => $tableData['table_name'],
        ]);
    }

    private function storeFields(SchemaTable $table, array $fields): void
    {
        foreach ($fields as $index => $fieldData) {
            // Check if field already exists in this table
            $existingField = SchemaField::where('table_id', $table->id)
                ->where('field_name', $fieldData['name'])
                ->first();

            if (!$existingField) {
                SchemaField::create([
                    'table_id' => $table->id,
                    'field_name' => $fieldData['name'],
                    'field_type' => $fieldData['type'],
                    'is_unsigned' => $fieldData['unsigned'] ?? false,
                    'is_nullable' => $fieldData['nullable'] ?? true,
                    'default_value' => $this->normalizeDefaultValue($fieldData['default'] ?? null),
                    'is_auto_increment' => $fieldData['auto_increment'] ?? false,
                    'field_order' => $index + 1,
                ]);
            }
        }
    }

    private function storeConstraints(SchemaTable $table, array $constraints, array $tableMap): void
    {
        foreach ($constraints as $constraintData) {
            // Generate a name if none provided
            $constraintName = $constraintData['name'] ?? null;
            if (empty($constraintName)) {
                $constraintName = $this->generateConstraintName($constraintData, $table);
            }

            $constraint = SchemaConstraint::create([
                'table_id' => $table->id,
                'constraint_name' => $constraintName,
                'constraint_type' => $constraintData['type'],
            ]);

            // Constraint Columns speichern
            $this->storeConstraintColumns($constraint, $constraintData['columns'], $table);

            // Foreign Key Referenzen speichern
            if ($constraintData['type'] === 'FOREIGN KEY' && isset($constraintData['references'])) {
                $this->storeForeignKeyReference($constraint, $constraintData['references'], $tableMap);
            }
        }
    }

    private function storeConstraintColumns(SchemaConstraint $constraint, array $columns, SchemaTable $table): void
    {
        foreach ($columns as $index => $columnName) {
            // Field finden
            $field = SchemaField::where('table_id', $table->id)
                ->where('field_name', $columnName)
                ->first();

            if ($field) {
                SchemaConstraintColumn::create([
                    'constraint_id' => $constraint->id,
                    'field_id' => $field->id,
                    'column_order' => $index + 1,
                ]);
            }
        }
    }

    private function storeForeignKeyReference(SchemaConstraint $constraint, array $referenceData, array $tableMap): void
    {
        $referencedTableName = $referenceData['table'];
        $referencedTable = $tableMap[$referencedTableName] ?? null;

        if (! $referencedTable) {
            throw new \Exception("Referenced table '{$referencedTableName}' not found");
        }

        $reference = SchemaForeignKeyReference::create([
            'constraint_id' => $constraint->id,
            'referenced_table_id' => $referencedTable->id,
        ]);

        // Referenced Columns speichern
        foreach ($referenceData['columns'] as $index => $columnName) {
            $referencedField = SchemaField::where('table_id', $referencedTable->id)
                ->where('field_name', $columnName)
                ->first();

            if ($referencedField) {
                SchemaForeignKeyReferenceColumn::create([
                    'reference_id' => $reference->id,
                    'referenced_field_id' => $referencedField->id,
                    'column_order' => $index + 1,
                ]);
            }
        }
    }

    private function normalizeDefaultValue($defaultValue): ?string
    {
        if ($defaultValue === null || $defaultValue === 'NULL') {
            return null;
        }

        // Remove quotes if present
        if (is_string($defaultValue)) {
            $defaultValue = trim($defaultValue, '"\'');
        }

        return (string) $defaultValue;
    }

    public function getSchemaVersion(int $versionId): ?SchemaVersion
    {
        return SchemaVersion::with([
            'tables.fields',
            'tables.constraints.constraintColumns.field',
            'tables.constraints.foreignKeyReference.referencedTable',
            'tables.constraints.foreignKeyReference.referenceColumns.referencedField',
        ])->find($versionId);
    }

    public function getSchemaVersionByName(string $versionName): ?SchemaVersion
    {
        return SchemaVersion::with([
            'tables.fields',
            'tables.constraints.constraintColumns.field',
            'tables.constraints.foreignKeyReference.referencedTable',
            'tables.constraints.foreignKeyReference.referenceColumns.referencedField',
        ])->where('version_name', $versionName)->first();
    }

    public function getAllSchemaVersions(): \Illuminate\Database\Eloquent\Collection
    {
        return SchemaVersion::orderBy('created_at', 'desc')->get();
    }

    /**
     * Store parsed tables in an existing schema version
     */
    public function storeParsedTablesInVersion(SchemaVersion $schemaVersion, array $parsedTables)
    {
        return DB::transaction(function () use ($schemaVersion, $parsedTables) {
            // Clear existing tables for this version
            $schemaVersion->tables()->delete();

            $tableMap = []; // For foreign key references

            // First phase: Save tables and fields
            foreach ($parsedTables as $tableData) {
                $table = $this->storeTable($schemaVersion, $tableData);
                $tableMap[$tableData['table_name']] = $table;

                $this->storeFields($table, $tableData['fields']);
            }

            // Second phase: Store constraints (after all tables exist)
            foreach ($parsedTables as $tableData) {
                $table = $tableMap[$tableData['table_name']];
                $this->storeConstraints($table, $tableData['constraints'], $tableMap);
            }

            return $schemaVersion;
        });
    }

    private function generateConstraintName(array $constraintData, SchemaTable $table): string
    {
        $type = $constraintData['type'];
        $tableName = $table->table_name;

        switch ($type) {
            case 'PRIMARY KEY':
                return 'pk_' . $tableName;

            case 'FOREIGN KEY':
                $columns = implode('_', $constraintData['columns'] ?? []);
                if (isset($constraintData['references']['table'])) {
                    $refTable = $constraintData['references']['table'];
                    return "fk_{$tableName}_{$columns}_{$refTable}";
                }
                return "fk_{$tableName}_{$columns}";

            case 'UNIQUE':
                $columns = implode('_', $constraintData['columns'] ?? []);
                return "uk_{$tableName}_{$columns}";

            case 'KEY':
            case 'INDEX':
                $columns = implode('_', $constraintData['columns'] ?? []);
                return "idx_{$tableName}_{$columns}";

            default:
                $columns = implode('_', $constraintData['columns'] ?? []);
                return strtolower($type) . "_{$tableName}_{$columns}";
        }
    }
}
