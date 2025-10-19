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
    /**
     * Generate short file name from table name
     * Examples: "customer_custody_value" -> "ccv", "customers" -> "cus"
     */
    private function generateFileNameShort(string $tableName): string
    {
        if (empty(trim($tableName))) {
            return '';
        }

        // Remove numbers and underscores, split by underscore
        $cleanName = preg_replace('/[0-9_]/', ' ', $tableName);
        $cleanName = trim($cleanName);
        $words = array_filter(preg_split('/\s+/', $cleanName));

        if (empty($words)) {
            return '';
        }

        if (count($words) === 1) {
            // Single word: take first 3 characters
            return strtolower(substr($words[0], 0, 3));
        } else {
            // Multiple words: take first letter of each word, max 3
            $firstLetters = array_slice(array_map(function($word) {
                return strtolower(substr($word, 0, 1));
            }, $words), 0, 3);
            return implode('', $firstLetters);
        }
    }

    public function storeSchema(array $parsedTables, string $versionName, ?string $description = null)
    {
        return DB::transaction(function () use ($parsedTables, $versionName, $description) {
            // Create floating schema first
            $schema = \App\Models\FloatingSchema::create([
                'name' => $versionName,
                'description' => $description,
                'owner_id' => 1, // Default owner for testing
                'visibility' => 'private',
                'last_version' => 0, // Start at 0, will be incremented to 1 when first version is created
            ]);

            // Schema Version erstellen (erste Version ist 0)
            $schemaVersion = SchemaVersion::create([
                'version_name' => $versionName,
                'description' => $description,
                'schema_id' => $schema->id,
                'version_number' => 0, // Start bei 0
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

            // Update schema's last_version to match the created version
            $schema->update(['last_version' => $schemaVersion->version_number]);

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

        // Detect primary key if not provided
        $primaryKey = $tableData['primarykeyfield'] ?? $this->detectPrimaryKeyFromFields($tableData['fields']) ?? 'id';
        $fileKey = $tableData['filekeyname'] ?? $primaryKey;

        // Auto-generate file name short and renamed if not provided
        $fileNameShort = !empty($tableData['file_name_short']) ? $tableData['file_name_short'] : $this->generateFileNameShort($tableData['table_name']);
        $fileNameRenamed = $tableData['file_name_renamed'] ?? '';

        // Ensure schema_id is set - fallback to loading from relationship if needed
        $schemaId = $schemaVersion->schema_id;
        if (!$schemaId && $schemaVersion->schema) {
            $schemaId = $schemaVersion->schema->id;
        }

        return SchemaTable::create([
            'schema_id' => $schemaId, // Direct schema relationship
            'schema_version_id' => $schemaVersion->id,
            'table_name' => $tableData['table_name'],
            'primarykeyfield' => $primaryKey, // 🔧 Primary key migration
            'filekeyname' => $fileKey, // 🔧 File key for templates
            'file_name_renamed' => $fileNameRenamed, // Auto-generated or provided
            'file_name_short' => $fileNameShort, // Auto-generated or provided
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

            // 🎯 UPDATE FIELDS: Set is_primary_key, is_unique and is_index flags based on constraint type
            $constraintType = $constraintData['type'];
            foreach ($constraintData['columns'] as $columnName) {
                $field = SchemaField::where('table_id', $table->id)
                    ->where('field_name', $columnName)
                    ->first();

                if ($field) {
                    // PRIMARY KEY sets both is_primary_key and is_unique = true
                    if ($constraintType === 'PRIMARY KEY') {
                        $field->update([
                            'is_primary_key' => true,
                            'is_unique' => true
                        ]);
                    }

                    // UNIQUE constraints set is_unique = true
                    if ($constraintType === 'UNIQUE') {
                        $field->update(['is_unique' => true]);
                    }

                    // INDEX and KEY constraints set is_index = true
                    if ($constraintType === 'INDEX' || $constraintType === 'KEY') {
                        $field->update(['is_index' => true]);
                    }
                }
            }

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

            // 🔧 PRIMARY KEY MIGRATION - Preserve {filekeyname} across versions
            $parsedTables = $this->migratePrimaryKeysFromPreviousVersion($schemaVersion, $parsedTables);

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

    /**
     * 🔧 PRIMARY KEY MIGRATION - Preserve {filekeyname} across schema versions
     *
     * Ensures that primary key configurations survive SQL imports by:
     * 1. Reading primary keys from previous version
     * 2. Auto-detecting primary keys from new SQL
     * 3. Merging the information intelligently
     */
    private function migratePrimaryKeysFromPreviousVersion(SchemaVersion $schemaVersion, array $parsedTables): array
    {
        // Get previous version primary keys
        $previousVersion = SchemaVersion::where('schema_id', $schemaVersion->schema_id)
            ->where('version_number', '<', $schemaVersion->version_number)
            ->orderBy('version_number', 'desc')
            ->first();

        $previousPrimaryKeys = [];
        $previousFileKeys = [];
        $previousFileNamesRenamed = [];
        $previousFileNamesShort = [];
        if ($previousVersion) {
            $previousTables = SchemaTable::where('schema_version_id', $previousVersion->id)
                ->whereNotNull('primarykeyfield')
                ->get(['table_name', 'primarykeyfield', 'filekeyname', 'file_name_renamed', 'file_name_short']);

            foreach ($previousTables as $table) {
                $previousPrimaryKeys[$table->table_name] = $table->primarykeyfield;
                $previousFileKeys[$table->table_name] = $table->filekeyname ?? $table->primarykeyfield;
                $previousFileNamesRenamed[$table->table_name] = $table->file_name_renamed ?? '';
                $previousFileNamesShort[$table->table_name] = $table->file_name_short ?? '';
            }
        }

        // Process each table for primary key migration
        foreach ($parsedTables as $tableName => &$tableData) {
            $detectedPrimaryKey = $this->detectPrimaryKeyFromFields($tableData['fields']);
            $previousPrimaryKey = $previousPrimaryKeys[$tableName] ?? null;
            $previousFileKey = $previousFileKeys[$tableName] ?? null;
            $previousFileNameRenamed = $previousFileNamesRenamed[$tableName] ?? null;
            $previousFileNameShort = $previousFileNamesShort[$tableName] ?? null;

            // Priority: Previous version > SQL-detected > fallback to 'id'
            if ($previousPrimaryKey && $this->fieldExistsInTable($previousPrimaryKey, $tableData['fields'])) {
                // Previous primary key still exists in new structure - use it
                $tableData['primarykeyfield'] = $previousPrimaryKey;
                \Log::info("🔧 Primary key migrated", [
                    'table' => $tableName,
                    'primary_key' => $previousPrimaryKey,
                    'source' => 'previous_version'
                ]);
            } elseif ($detectedPrimaryKey) {
                // Use SQL-detected primary key
                $tableData['primarykeyfield'] = $detectedPrimaryKey;
                \Log::info("🔧 Primary key detected from SQL", [
                    'table' => $tableName,
                    'primary_key' => $detectedPrimaryKey,
                    'source' => 'sql_detection'
                ]);
            } else {
                // Fallback to 'id' or first field
                $fallbackKey = $this->getFallbackPrimaryKey($tableData['fields']);
                $tableData['primarykeyfield'] = $fallbackKey;
                \Log::info("🔧 Primary key fallback", [
                    'table' => $tableName,
                    'primary_key' => $fallbackKey,
                    'source' => 'fallback'
                ]);
            }

            // 🔧 FILEKEYNAME MIGRATION - Preserve template key selection
            if ($previousFileKey && $this->fieldExistsInTable($previousFileKey, $tableData['fields'])) {
                // Previous filekeyname still exists - use it
                $tableData['filekeyname'] = $previousFileKey;
                \Log::info("🔧 File key migrated", [
                    'table' => $tableName,
                    'file_key' => $previousFileKey,
                    'source' => 'previous_version'
                ]);
            } else {
                // Default filekeyname to primarykeyfield
                $tableData['filekeyname'] = $tableData['primarykeyfield'];
                \Log::info("🔧 File key defaulted to primary key", [
                    'table' => $tableName,
                    'file_key' => $tableData['primarykeyfield'],
                    'source' => 'primary_key_default'
                ]);
            }

            // 🔧 FILE NAME RENAMED MIGRATION - Preserve custom file names
            if ($previousFileNameRenamed) {
                // Previous file name renamed exists - preserve it
                $tableData['file_name_renamed'] = $previousFileNameRenamed;
                \Log::info("🔧 File name renamed migrated", [
                    'table' => $tableName,
                    'file_name_renamed' => $previousFileNameRenamed,
                    'source' => 'previous_version'
                ]);
            } else {
                // Leave empty or use provided value
                $tableData['file_name_renamed'] = $tableData['file_name_renamed'] ?? '';
            }

            // 🔧 FILE NAME SHORT MIGRATION - Preserve or auto-generate
            if ($previousFileNameShort) {
                // Previous file name short exists - preserve it
                $tableData['file_name_short'] = $previousFileNameShort;
                \Log::info("🔧 File name short migrated", [
                    'table' => $tableName,
                    'file_name_short' => $previousFileNameShort,
                    'source' => 'previous_version'
                ]);
            } else {
                // Auto-generate file name short
                $autoGeneratedShort = $this->generateFileNameShort($tableName);
                $tableData['file_name_short'] = $autoGeneratedShort;
                \Log::info("🔧 File name short auto-generated", [
                    'table' => $tableName,
                    'file_name_short' => $autoGeneratedShort,
                    'source' => 'auto_generation'
                ]);
            }
        }

        return $parsedTables;
    }

    /**
     * Detect primary key from SQL field definitions
     */
    private function detectPrimaryKeyFromFields(array $fields): ?string
    {
        foreach ($fields as $field) {
            // Look for explicit PRIMARY KEY declaration
            if (isset($field['is_primary']) && $field['is_primary']) {
                return $field['name'];
            }

            // Look for AUTO_INCREMENT (usually indicates primary key)
            if (isset($field['auto_increment']) && $field['auto_increment']) {
                return $field['name'];
            }
        }

        // Look for 'id' field
        foreach ($fields as $field) {
            if ($field['name'] === 'id') {
                return 'id';
            }
        }

        // Look for fields ending with '_id'
        foreach ($fields as $field) {
            if (str_ends_with($field['name'], '_id')) {
                return $field['name'];
            }
        }

        return null;
    }

    /**
     * Check if a field exists in the table structure
     */
    private function fieldExistsInTable(string $fieldName, array $fields): bool
    {
        foreach ($fields as $field) {
            if ($field['name'] === $fieldName) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get fallback primary key when nothing else works
     */
    private function getFallbackPrimaryKey(array $fields): string
    {
        // Prefer 'id' if it exists
        foreach ($fields as $field) {
            if ($field['name'] === 'id') {
                return 'id';
            }
        }

        // Otherwise use first field
        return $fields[0]['name'] ?? 'id';
    }

    private function generateConstraintName(array $constraintData, SchemaTable $table): string
    {
        $type = $constraintData['type'];
        $tableName = $table->table_name;

        switch ($type) {
            case 'PRIMARY KEY':
                $columns = implode('_', $constraintData['columns'] ?? []);
                return $columns ? "pk_{$tableName}_{$columns}" : "pk_{$tableName}";

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
