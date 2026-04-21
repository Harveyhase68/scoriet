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
    /**
     * Guess English singular form of a table name.
     * Handles compound names by singularizing only the last part.
     * For non-English languages, the user should set singular_name manually.
     */
    private function guessEnglishSingular(string $tableName): string
    {
        $parts = explode('_', $tableName);
        $last = array_pop($parts);

        if (str_ends_with($last, 'ies') && strlen($last) > 4) {
            $last = substr($last, 0, -3) . 'y';           // categories → category
        } elseif (str_ends_with($last, 'sses')) {
            $last = substr($last, 0, -2);                   // classes → class
        } elseif (str_ends_with($last, 'shes') || str_ends_with($last, 'ches')) {
            $last = substr($last, 0, -2);                   // dishes → dish, watches → watch
        } elseif (str_ends_with($last, 'ses') || str_ends_with($last, 'xes') || str_ends_with($last, 'zes')) {
            $last = substr($last, 0, -2);                   // addresses → address, boxes → box
        } elseif (str_ends_with($last, 'ves')) {
            $last = substr($last, 0, -3) . 'f';            // wolves → wolf
        } elseif (str_ends_with($last, 's') && !str_ends_with($last, 'ss') && !str_ends_with($last, 'us') && !str_ends_with($last, 'is') && strlen($last) > 2) {
            $last = substr($last, 0, -1);                   // products → product
        }

        $parts[] = $last;
        return implode('_', $parts);
    }

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

    /**
     * Store schema in an existing FloatingSchema (creates a new version)
     */
    public function storeSchemaInExisting(array $parsedTables, int $schemaId, ?string $description = null)
    {
        return DB::transaction(function () use ($parsedTables, $schemaId, $description) {
            // Get existing schema
            $schema = \App\Models\FloatingSchema::find($schemaId);
            if (!$schema) {
                throw new \Exception("Schema with ID {$schemaId} not found");
            }

            // Create new version (increment last_version)
            $newVersionNumber = $schema->last_version + 1;

            $schemaVersion = SchemaVersion::create([
                'version_name' => $schema->name . ' v' . $newVersionNumber,
                'description' => $description,
                'schema_id' => $schema->id,
                'version_number' => $newVersionNumber,
            ]);

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

            // Update schema's last_version
            $schema->update(['last_version' => $newVersionNumber]);

            // 🔄 Copy Scoriet-specific settings from previous version
            $this->copySettingsFromPreviousVersion($schema, $schemaVersion, $newVersionNumber);

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

        // Auto-guess singular name from table name (English rules)
        $singularName = $tableData['singular_name'] ?? $this->guessEnglishSingular($tableData['table_name']);

        return SchemaTable::create([
            'schema_id' => $schemaId, // Direct schema relationship
            'schema_version_id' => $schemaVersion->id,
            'table_name' => $tableData['table_name'],
            'singular_name' => $singularName, // Auto-guessed or user-provided
            'primarykeyfield' => $primaryKey, // 🔧 Primary key migration
            'filekeyname' => $fileKey, // 🔧 File key for templates
            'file_name_renamed' => $fileNameRenamed, // Auto-generated or provided
            'file_name_short' => $fileNameShort, // Auto-generated or provided
        ]);
    }

    private function storeFields(SchemaTable $table, array $fields): void
    {
        // Build bulk insert data for fields that don't already exist
        $existingFieldNames = SchemaField::where('table_id', $table->id)
            ->pluck('field_name')
            ->toArray();

        $now = now();
        $bulkData = [];
        foreach ($fields as $index => $fieldData) {
            if (!in_array($fieldData['name'], $existingFieldNames)) {
                $bulkData[] = [
                    'table_id' => $table->id,
                    'field_name' => $fieldData['name'],
                    'field_type' => strtolower($fieldData['type']),
                    'is_unsigned' => $fieldData['unsigned'] ?? false,
                    'is_nullable' => $fieldData['nullable'] ?? true,
                    'default_value' => $this->normalizeDefaultValue($fieldData['default'] ?? null),
                    'is_auto_increment' => $fieldData['auto_increment'] ?? false,
                    'field_order' => $index + 1,
                    'comment' => $fieldData['comment'] ?? null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        // Bulk insert in chunks of 100 to avoid query size limits
        if (!empty($bulkData)) {
            foreach (array_chunk($bulkData, 100) as $chunk) {
                SchemaField::insert($chunk);
            }
        }
    }

    private function storeConstraints(SchemaTable $table, array $constraints, array $tableMap, bool $tolerateMissingReferences = false): void
    {
        // Pre-load all fields for this table to avoid N+1 queries
        $fieldsByName = SchemaField::where('table_id', $table->id)
            ->get()
            ->keyBy('field_name');

        // Pre-load existing constraints to check for duplicates
        $existingConstraints = SchemaConstraint::where('table_id', $table->id)
            ->get()
            ->groupBy(fn($c) => $c->constraint_name . '|' . $c->constraint_type);

        foreach ($constraints as $constraintData) {
            // For FOREIGN KEY constraints, check if referenced table exists
            if ($constraintData['type'] === 'FOREIGN KEY' && isset($constraintData['references'])) {
                $referencedTableName = $constraintData['references']['table'] ?? null;
                if ($referencedTableName && !isset($tableMap[$referencedTableName])) {
                    if ($tolerateMissingReferences) {
                        // Skip this FK constraint - referenced table doesn't exist yet
                        continue;
                    }
                    // If not tolerating, the storeForeignKeyReference will throw an exception
                }
            }

            // Generate a name if none provided
            $constraintName = $constraintData['name'] ?? null;
            if (empty($constraintName)) {
                $constraintName = $this->generateConstraintName($constraintData, $table);
            }

            // Check if this constraint already exists on this table (prevent duplicates on re-import)
            $lookupKey = $constraintName . '|' . $constraintData['type'];
            if ($existingConstraints->has($lookupKey)) {
                continue;
            }

            $constraint = SchemaConstraint::create([
                'table_id' => $table->id,
                'constraint_name' => $constraintName,
                'constraint_type' => $constraintData['type'],
            ]);

            // Constraint Columns speichern (pass pre-loaded fields to avoid N+1 queries)
            $this->storeConstraintColumns($constraint, $constraintData['columns'], $table, $fieldsByName);

            // 🎯 UPDATE FIELDS: Set is_primary_key, is_unique and is_index flags based on constraint type
            $constraintType = $constraintData['type'];
            foreach ($constraintData['columns'] as $columnName) {
                $field = $fieldsByName->get($columnName);

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

    private function storeConstraintColumns(SchemaConstraint $constraint, array $columns, SchemaTable $table, ?\Illuminate\Support\Collection $fieldsByName = null): void
    {
        $now = now();
        $bulkData = [];
        foreach ($columns as $index => $columnName) {
            // Use pre-loaded fields if available, otherwise query
            $field = $fieldsByName ? $fieldsByName->get($columnName) : SchemaField::where('table_id', $table->id)->where('field_name', $columnName)->first();

            if ($field) {
                $bulkData[] = [
                    'constraint_id' => $constraint->id,
                    'field_id' => $field->id,
                    'column_order' => $index + 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }
        if (!empty($bulkData)) {
            SchemaConstraintColumn::insert($bulkData);
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
            'on_delete' => $referenceData['on_delete'] ?? 'NO ACTION',
            'on_update' => $referenceData['on_update'] ?? 'NO ACTION',
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
     * Store parsed tables in an existing schema version (REPLACES all tables)
     *
     * @param SchemaVersion $schemaVersion The version to store tables in
     * @param array $parsedTables The parsed table data
     * @param bool $tolerateMissingReferences If true, skip FK constraints that reference non-existent tables
     */
    public function storeParsedTablesInVersion(SchemaVersion $schemaVersion, array $parsedTables, bool $tolerateMissingReferences = false)
    {
        return DB::transaction(function () use ($schemaVersion, $parsedTables, $tolerateMissingReferences) {
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
                $this->storeConstraints($table, $tableData['constraints'], $tableMap, $tolerateMissingReferences);
            }

            // 🔄 Copy Scoriet-specific settings from previous version
            $schema = $schemaVersion->schema;
            if ($schema) {
                $this->copySettingsFromPreviousVersion($schema, $schemaVersion, $schemaVersion->version_number);
            }

            return $schemaVersion;
        });
    }

    /**
     * Add parsed tables to an existing schema version (WITHOUT deleting existing tables)
     *
     * @param SchemaVersion $schemaVersion The version to add tables to
     * @param array $parsedTables The parsed table data
     * @param bool $tolerateMissingReferences If true, skip FK constraints that reference non-existent tables
     */
    public function addTablesToVersion(SchemaVersion $schemaVersion, array $parsedTables, bool $tolerateMissingReferences = false)
    {
        return DB::transaction(function () use ($schemaVersion, $parsedTables, $tolerateMissingReferences) {
            // DON'T clear existing tables - we're ADDING to the version

            // 🔧 PRIMARY KEY MIGRATION - Preserve {filekeyname} across versions
            $parsedTables = $this->migratePrimaryKeysFromPreviousVersion($schemaVersion, $parsedTables);

            // Get existing tables in this version to build complete tableMap
            $existingTables = SchemaTable::where('schema_version_id', $schemaVersion->id)->get();
            $tableMap = [];
            foreach ($existingTables as $existingTable) {
                $tableMap[$existingTable->table_name] = $existingTable;
            }

            // First phase: Save NEW tables and fields
            foreach ($parsedTables as $tableData) {
                $table = $this->storeTable($schemaVersion, $tableData); // storeTable checks for duplicates
                $tableMap[$tableData['table_name']] = $table;

                $this->storeFields($table, $tableData['fields']); // storeFields checks for duplicates
            }

            // Second phase: Store constraints (after all tables exist)
            foreach ($parsedTables as $tableData) {
                $table = $tableMap[$tableData['table_name']];
                $this->storeConstraints($table, $tableData['constraints'], $tableMap, $tolerateMissingReferences);
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
                $previousFileKeys[$table->table_name] = $table->filekeyname ?: $table->primarykeyfield;
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
            } elseif ($detectedPrimaryKey) {
                // Use SQL-detected primary key
                $tableData['primarykeyfield'] = $detectedPrimaryKey;
            } else {
                // Fallback to 'id' or first field
                $fallbackKey = $this->getFallbackPrimaryKey($tableData['fields']);
                $tableData['primarykeyfield'] = $fallbackKey;
            }

            // 🔧 FILEKEYNAME MIGRATION - Preserve template key selection
            if ($previousFileKey && $this->fieldExistsInTable($previousFileKey, $tableData['fields'])) {
                // Previous filekeyname still exists - use it
                $tableData['filekeyname'] = $previousFileKey;
            } else {
                // Default filekeyname to primarykeyfield
                $tableData['filekeyname'] = $tableData['primarykeyfield'];
            }

            // 🔧 FILE NAME RENAMED MIGRATION - Preserve custom file names
            if ($previousFileNameRenamed) {
                // Previous file name renamed exists - preserve it
                $tableData['file_name_renamed'] = $previousFileNameRenamed;
            } else {
                // Leave empty or use provided value
                $tableData['file_name_renamed'] = $tableData['file_name_renamed'] ?? '';
            }

            // 🔧 FILE NAME SHORT MIGRATION - Preserve or auto-generate
            if ($previousFileNameShort) {
                // Previous file name short exists - preserve it
                $tableData['file_name_short'] = $previousFileNameShort;
            } else {
                // Auto-generate file name short
                $autoGeneratedShort = $this->generateFileNameShort($tableName);
                $tableData['file_name_short'] = $autoGeneratedShort;
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

    /**
     * Copy Scoriet-specific settings from previous schema version to new version.
     * Preserves: singular_name, file_name_renamed, file_name_short, filekeyname,
     * and field-level: control_type, comment, link_table, link_field, link_display_field, etc.
     */
    private function copySettingsFromPreviousVersion($schema, SchemaVersion $newVersion, int $newVersionNumber): void
    {
        if ($newVersionNumber <= 1) return; // No previous version

        // Find previous version
        $previousVersion = SchemaVersion::where('schema_id', $schema->id)
            ->where('version_number', $newVersionNumber - 1)
            ->first();

        if (!$previousVersion) return;

        // Load previous tables with fields
        $previousTables = SchemaTable::where('schema_version_id', $previousVersion->id)
            ->with('fields')
            ->get()
            ->keyBy('table_name');

        // Load new tables with fields
        $newTables = SchemaTable::where('schema_version_id', $newVersion->id)
            ->with('fields')
            ->get();

        foreach ($newTables as $newTable) {
            $prevTable = $previousTables->get($newTable->table_name);
            if (!$prevTable) continue;

            // Copy table-level settings
            $tableUpdates = [];
            if ($prevTable->singular_name && !$newTable->singular_name) {
                $tableUpdates['singular_name'] = $prevTable->singular_name;
            }
            // Always copy these user-defined settings (overwrite auto-generated values)
            if ($prevTable->file_name_renamed) {
                $tableUpdates['file_name_renamed'] = $prevTable->file_name_renamed;
            }
            if ($prevTable->file_name_short && $prevTable->file_name_short !== substr($newTable->table_name, 0, 2)) {
                $tableUpdates['file_name_short'] = $prevTable->file_name_short;
            }
            if ($prevTable->filekeyname && $prevTable->filekeyname !== 'id') {
                $tableUpdates['filekeyname'] = $prevTable->filekeyname;
            }
            if ($prevTable->primarykeyfield) {
                $tableUpdates['primarykeyfield'] = $prevTable->primarykeyfield;
            }

            if (!empty($tableUpdates)) {
                $newTable->update($tableUpdates);
            }

            // Copy field-level settings
            $prevFields = $prevTable->fields->keyBy('field_name');

            foreach ($newTable->fields as $newField) {
                $prevField = $prevFields->get($newField->field_name);
                if (!$prevField) continue;

                $fieldUpdates = [];

                // Control type (COMBOBOX, CHECKBOX, etc.)
                if ($prevField->control_type) {
                    $fieldUpdates['control_type'] = $prevField->control_type;
                }

                // Comment (user-defined, not from SQL)
                if ($prevField->comment && !$newField->comment) {
                    $fieldUpdates['comment'] = $prevField->comment;
                }

                // Link/Lookup fields
                if ($prevField->link_table) {
                    $fieldUpdates['link_table'] = $prevField->link_table;
                }
                if ($prevField->link_field) {
                    $fieldUpdates['link_field'] = $prevField->link_field;
                }
                if ($prevField->link_display_field) {
                    $fieldUpdates['link_display_field'] = $prevField->link_display_field;
                }
                if ($prevField->link_order_field) {
                    $fieldUpdates['link_order_field'] = $prevField->link_order_field;
                }
                if ($prevField->link_order_direction) {
                    $fieldUpdates['link_order_direction'] = $prevField->link_order_direction;
                }

                // Edit mask
                if ($prevField->editmask) {
                    $fieldUpdates['editmask'] = $prevField->editmask;
                }

                if (!empty($fieldUpdates)) {
                    $newField->update($fieldUpdates);
                }
            }
        }

        \Log::info("🔄 Copied settings from v" . ($newVersionNumber - 1) . " to v{$newVersionNumber}: " .
            $newTables->count() . " tables checked");
    }
}
