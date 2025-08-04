<?php

namespace App\Services;

use App\Models\SchemaVersion;
use App\Models\SchemaTable;
use App\Models\SchemaField;
use App\Models\SchemaConstraint;
use App\Models\SchemaConstraintColumn;
use App\Models\SchemaForeignKeyReference;
use App\Models\SchemaForeignKeyReferenceColumn;
use Illuminate\Support\Facades\DB;

class SchemaStorageService
{
    public function storeSchema(array $parsedTables, string $versionName, string $description = null)
    {
        return DB::transaction(function () use ($parsedTables, $versionName, $description) {
            // Schema Version erstellen
            $schemaVersion = SchemaVersion::create([
                'version_name' => $versionName,
                'description' => $description
            ]);

            $tableMap = []; // Für Foreign Key Referenzen

            // Erste Phase: Tabellen und Felder speichern
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
        return SchemaTable::create([
            'schema_version_id' => $schemaVersion->id,
            'table_name' => $tableData['table_name']
        ]);
    }

    private function storeFields(SchemaTable $table, array $fields): void
    {
        foreach ($fields as $index => $fieldData) {
            SchemaField::create([
                'table_id' => $table->id,
                'field_name' => $fieldData['name'],
                'field_type' => $fieldData['type'],
                'is_unsigned' => $fieldData['unsigned'] ?? false,
                'is_nullable' => $fieldData['nullable'] ?? true,
                'default_value' => $this->normalizeDefaultValue($fieldData['default'] ?? null),
                'is_auto_increment' => $fieldData['auto_increment'] ?? false,
                'field_order' => $index + 1
            ]);
        }
    }

    private function storeConstraints(SchemaTable $table, array $constraints, array $tableMap): void
    {
        foreach ($constraints as $constraintData) {
            $constraint = SchemaConstraint::create([
                'table_id' => $table->id,
                'constraint_name' => $constraintData['name'] ?? null,
                'constraint_type' => $constraintData['type']
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
                    'column_order' => $index + 1
                ]);
            }
        }
    }

    private function storeForeignKeyReference(SchemaConstraint $constraint, array $referenceData, array $tableMap): void
    {
        $referencedTableName = $referenceData['table'];
        $referencedTable = $tableMap[$referencedTableName] ?? null;

        if (!$referencedTable) {
            throw new \Exception("Referenced table '{$referencedTableName}' not found");
        }

        $reference = SchemaForeignKeyReference::create([
            'constraint_id' => $constraint->id,
            'referenced_table_id' => $referencedTable->id
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
                    'column_order' => $index + 1
                ]);
            }
        }
    }

    private function normalizeDefaultValue($defaultValue): ?string
    {
        if ($defaultValue === null || $defaultValue === 'NULL') {
            return null;
        }

        // Anführungszeichen entfernen falls vorhanden
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
            'tables.constraints.foreignKeyReference.referenceColumns.referencedField'
        ])->find($versionId);
    }

    public function getSchemaVersionByName(string $versionName): ?SchemaVersion
    {
        return SchemaVersion::with([
            'tables.fields',
            'tables.constraints.constraintColumns.field',
            'tables.constraints.foreignKeyReference.referencedTable',
            'tables.constraints.foreignKeyReference.referenceColumns.referencedField'
        ])->where('version_name', $versionName)->first();
    }

    public function getAllSchemaVersions(): \Illuminate\Database\Eloquent\Collection
    {
        return SchemaVersion::orderBy('created_at', 'desc')->get();
    }
}