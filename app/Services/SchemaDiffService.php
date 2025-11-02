<?php

namespace App\Services;

use App\Models\SchemaVersion;
use App\Models\SchemaTable;
use Illuminate\Support\Facades\Log;

/**
 * Schema Diff & Migration Generator Service
 *
 * Vergleicht zwei Schema-Versionen und generiert SQL Migration Scripts
 *
 * Unterstützt:
 * - CREATE TABLE / DROP TABLE
 * - ADD COLUMN / DROP COLUMN / MODIFY COLUMN
 * - ADD/DROP PRIMARY KEY, UNIQUE KEY, INDEX, FOREIGN KEY
 */
class SchemaDiffService
{
    /**
     * Vergleiche zwei Schema-Versionen und generiere Migration Script
     *
     * @param int $fromVersionId Source Version (alt)
     * @param int $toVersionId Target Version (neu)
     * @return array ['sql' => string, 'changes' => array, 'summary' => array]
     */
    public function compareVersions(int $fromVersionId, int $toVersionId): array
    {
        // Load Schema Versions with all relationships
        $fromVersion = SchemaVersion::with([
            'tables.fields',
            'tables.constraints.constraintColumns',
            'tables.constraints.foreignKeyReference.referencedTable',
            'tables.constraints.foreignKeyReference.referenceColumns.referencedField'
        ])->findOrFail($fromVersionId);

        $toVersion = SchemaVersion::with([
            'tables.fields',
            'tables.constraints.constraintColumns',
            'tables.constraints.foreignKeyReference.referencedTable',
            'tables.constraints.foreignKeyReference.referenceColumns.referencedField'
        ])->findOrFail($toVersionId);

        Log::info("🔍 Schema Diff: Comparing versions", [
            'from' => $fromVersion->id,
            'to' => $toVersion->id,
        ]);

        // Collect all changes
        $changes = [];

        // 1. Compare Tables (CREATE/DROP)
        $tableChanges = $this->compareTables($fromVersion, $toVersion);
        $changes = array_merge($changes, $tableChanges);

        // 2. Compare Fields for existing tables
        $fieldChanges = $this->compareFields($fromVersion, $toVersion);
        $changes = array_merge($changes, $fieldChanges);

        // 3. Compare Constraints (PK, UK, INDEX, FK)
        $constraintChanges = $this->compareConstraints($fromVersion, $toVersion);
        $changes = array_merge($changes, $constraintChanges);

        // 4. Generate SQL Migration Script in correct order
        $sql = $this->generateMigrationSQL($changes);

        // 5. Generate Summary
        $summary = $this->generateSummary($changes);

        return [
            'sql' => $sql,
            'changes' => $changes,
            'summary' => $summary,
            'from_version' => [
                'id' => $fromVersion->id,
                'version_number' => $fromVersion->version_number,
                'schema_name' => $fromVersion->schema->name ?? 'Unknown',
            ],
            'to_version' => [
                'id' => $toVersion->id,
                'version_number' => $toVersion->version_number,
                'schema_name' => $toVersion->schema->name ?? 'Unknown',
            ],
        ];
    }

    /**
     * Compare Tables between two versions
     * Returns: CREATE TABLE, DROP TABLE changes
     */
    private function compareTables(SchemaVersion $from, SchemaVersion $to): array
    {
        $changes = [];

        $fromTables = $from->tables->keyBy('table_name');
        $toTables = $to->tables->keyBy('table_name');

        // Find new tables (in TO but not in FROM) -> CREATE TABLE
        foreach ($toTables as $tableName => $table) {
            if (!$fromTables->has($tableName)) {
                $changes[] = [
                    'type' => 'CREATE_TABLE',
                    'table' => $tableName,
                    'table_data' => $table,
                    'priority' => 5, // CREATE TABLE: middle priority
                ];
            }
        }

        // Find dropped tables (in FROM but not in TO) -> DROP TABLE
        foreach ($fromTables as $tableName => $table) {
            if (!$toTables->has($tableName)) {
                $changes[] = [
                    'type' => 'DROP_TABLE',
                    'table' => $tableName,
                    'priority' => 11, // DROP TABLE: lowest priority (last!)
                ];
            }
        }

        return $changes;
    }

    /**
     * Compare Fields for tables that exist in both versions
     * Returns: ADD COLUMN, DROP COLUMN, MODIFY COLUMN changes
     */
    private function compareFields(SchemaVersion $from, SchemaVersion $to): array
    {
        $changes = [];

        $fromTables = $from->tables->keyBy('table_name');
        $toTables = $to->tables->keyBy('table_name');

        // Only compare tables that exist in both versions
        foreach ($toTables as $tableName => $toTable) {
            if (!$fromTables->has($tableName)) {
                continue; // New table, skip (handled by compareTables)
            }

            $fromTable = $fromTables->get($tableName);
            $fromFields = $fromTable->fields->keyBy('field_name');
            $toFields = $toTable->fields->keyBy('field_name');

            // Find new fields (ADD COLUMN)
            foreach ($toFields as $fieldName => $toField) {
                if (!$fromFields->has($fieldName)) {
                    $changes[] = [
                        'type' => 'ADD_COLUMN',
                        'table' => $tableName,
                        'field' => $fieldName,
                        'field_data' => $toField,
                        'priority' => 6, // ADD COLUMN: after CREATE TABLE
                    ];
                }
            }

            // Find dropped fields (DROP COLUMN)
            foreach ($fromFields as $fieldName => $fromField) {
                if (!$toFields->has($fieldName)) {
                    $changes[] = [
                        'type' => 'DROP_COLUMN',
                        'table' => $tableName,
                        'field' => $fieldName,
                        'priority' => 3, // DROP COLUMN: after DROP INDEX
                    ];
                }
            }

            // Find modified fields (MODIFY COLUMN)
            foreach ($toFields as $fieldName => $toField) {
                if ($fromFields->has($fieldName)) {
                    $fromField = $fromFields->get($fieldName);

                    if ($this->isFieldModified($fromField, $toField)) {
                        $changes[] = [
                            'type' => 'MODIFY_COLUMN',
                            'table' => $tableName,
                            'field' => $fieldName,
                            'from_field' => $fromField,
                            'to_field' => $toField,
                            'priority' => 7, // MODIFY COLUMN: after ADD COLUMN
                        ];
                    }
                }
            }
        }

        return $changes;
    }

    /**
     * Check if field definition was modified
     */
    private function isFieldModified($fromField, $toField): bool
    {
        // Normalize boolean values to handle NULL, 0, false, 1, true consistently
        $fromNullable = !empty($fromField->is_nullable);
        $toNullable = !empty($toField->is_nullable);

        $fromUnsigned = !empty($fromField->is_unsigned);
        $toUnsigned = !empty($toField->is_unsigned);

        $fromAutoInc = !empty($fromField->is_auto_increment);
        $toAutoInc = !empty($toField->is_auto_increment);

        // Normalize default values: NULL, empty string, and '0' for numeric types
        $fromDefault = $this->normalizeDefaultValue($fromField);
        $toDefault = $this->normalizeDefaultValue($toField);

        // Normalize numeric fields (NULL or 0 should be treated as same)
        $fromLength = $fromField->field_length ?? 0;
        $toLength = $toField->field_length ?? 0;

        $fromPrecision = $fromField->field_precision ?? 0;
        $toPrecision = $toField->field_precision ?? 0;

        $fromScale = $fromField->field_scale ?? 0;
        $toScale = $toField->field_scale ?? 0;

        // Compare field properties
        $typeChanged = $fromField->field_type !== $toField->field_type;
        $lengthChanged = $fromLength !== $toLength;
        $precisionChanged = $fromPrecision !== $toPrecision;
        $scaleChanged = $fromScale !== $toScale;
        $nullableChanged = $fromNullable !== $toNullable;
        $unsignedChanged = $fromUnsigned !== $toUnsigned;
        $defaultChanged = $fromDefault !== $toDefault;
        $autoIncChanged = $fromAutoInc !== $toAutoInc;

        // Debug logging for false positives
        if ($typeChanged || $lengthChanged || $precisionChanged || $scaleChanged ||
            $nullableChanged || $unsignedChanged || $defaultChanged || $autoIncChanged) {

            $changedProperties = [];
            if ($typeChanged) $changedProperties[] = "type: {$fromField->field_type} -> {$toField->field_type}";
            if ($lengthChanged) $changedProperties[] = "length: {$fromField->field_length} -> {$toField->field_length}";
            if ($precisionChanged) $changedProperties[] = "precision: {$fromField->field_precision} -> {$toField->field_precision}";
            if ($scaleChanged) $changedProperties[] = "scale: {$fromField->field_scale} -> {$toField->field_scale}";
            if ($nullableChanged) $changedProperties[] = "nullable: " . ($fromNullable ? 'YES' : 'NO') . " -> " . ($toNullable ? 'YES' : 'NO');
            if ($unsignedChanged) $changedProperties[] = "unsigned: " . ($fromUnsigned ? 'YES' : 'NO') . " -> " . ($toUnsigned ? 'YES' : 'NO');
            if ($defaultChanged) $changedProperties[] = "default: '{$fromDefault}' -> '{$toDefault}'";
            if ($autoIncChanged) $changedProperties[] = "auto_increment: " . ($fromAutoInc ? 'YES' : 'NO') . " -> " . ($toAutoInc ? 'YES' : 'NO');

            Log::debug("Field modified: {$fromField->field_name}", [
                'changes' => $changedProperties
            ]);
        }

        return $typeChanged || $lengthChanged || $precisionChanged || $scaleChanged ||
               $nullableChanged || $unsignedChanged || $defaultChanged || $autoIncChanged;
    }

    /**
     * Normalize default values for consistent comparison
     */
    private function normalizeDefaultValue($field): string
    {
        $default = $field->default_value;

        // If NULL or empty, return empty string
        if ($default === null || $default === '') {
            return '';
        }

        // Convert to string and trim
        return trim((string) $default);
    }

    /**
     * Compare Constraints (PRIMARY KEY, UNIQUE, INDEX, FOREIGN KEY)
     */
    private function compareConstraints(SchemaVersion $from, SchemaVersion $to): array
    {
        $changes = [];

        $fromTables = $from->tables->keyBy('table_name');
        $toTables = $to->tables->keyBy('table_name');

        foreach ($toTables as $tableName => $toTable) {
            if (!$fromTables->has($tableName)) {
                continue; // New table, constraints handled in CREATE TABLE
            }

            $fromTable = $fromTables->get($tableName);

            // Compare Primary Keys
            $pkChanges = $this->comparePrimaryKeys($fromTable, $toTable, $tableName);
            $changes = array_merge($changes, $pkChanges);

            // Compare Unique Keys
            $ukChanges = $this->compareUniqueKeys($fromTable, $toTable, $tableName);
            $changes = array_merge($changes, $ukChanges);

            // Compare Indexes
            $indexChanges = $this->compareIndexes($fromTable, $toTable, $tableName);
            $changes = array_merge($changes, $indexChanges);

            // Compare Foreign Keys
            $fkChanges = $this->compareForeignKeys($fromTable, $toTable, $tableName);
            $changes = array_merge($changes, $fkChanges);
        }

        return $changes;
    }

    private function comparePrimaryKeys($fromTable, $toTable, string $tableName): array
    {
        $changes = [];

        $fromPK = $fromTable->constraints->firstWhere('constraint_type', 'PRIMARY KEY');
        $toPK = $toTable->constraints->firstWhere('constraint_type', 'PRIMARY KEY');

        $fromColumns = $fromPK ? $fromPK->constraintColumns->pluck('field_name')->sort()->values()->toArray() : [];
        $toColumns = $toPK ? $toPK->constraintColumns->pluck('field_name')->sort()->values()->toArray() : [];

        // If PK changed
        if ($fromColumns !== $toColumns) {
            // Drop old PK
            if (!empty($fromColumns)) {
                $changes[] = [
                    'type' => 'DROP_PRIMARY_KEY',
                    'table' => $tableName,
                    'priority' => 4, // DROP PK: after DROP COLUMN
                ];
            }

            // Add new PK
            if (!empty($toColumns)) {
                $changes[] = [
                    'type' => 'ADD_PRIMARY_KEY',
                    'table' => $tableName,
                    'columns' => $toColumns,
                    'priority' => 8, // ADD PK: after MODIFY COLUMN
                ];
            }
        }

        return $changes;
    }

    private function compareUniqueKeys($fromTable, $toTable, string $tableName): array
    {
        // Similar logic for UNIQUE keys
        // TODO: Implement
        return [];
    }

    private function compareIndexes($fromTable, $toTable, string $tableName): array
    {
        // Similar logic for INDEX
        // TODO: Implement
        return [];
    }

    private function compareForeignKeys($fromTable, $toTable, string $tableName): array
    {
        $changes = [];

        $fromFKs = $fromTable->constraints->where('constraint_type', 'FOREIGN KEY');
        $toFKs = $toTable->constraints->where('constraint_type', 'FOREIGN KEY');

        // Build FK signatures for comparison
        $fromFKMap = [];
        foreach ($fromFKs as $fk) {
            $signature = $this->getForeignKeySignature($fk);
            $fromFKMap[$signature] = $fk;
        }

        $toFKMap = [];
        foreach ($toFKs as $fk) {
            $signature = $this->getForeignKeySignature($fk);
            $toFKMap[$signature] = $fk;
        }

        // Find dropped FKs
        foreach ($fromFKMap as $signature => $fk) {
            if (!isset($toFKMap[$signature])) {
                $changes[] = [
                    'type' => 'DROP_FOREIGN_KEY',
                    'table' => $tableName,
                    'constraint_name' => $fk->constraint_name,
                    'priority' => 1, // DROP FK: highest priority (first!)
                ];
            }
        }

        // Find new FKs
        foreach ($toFKMap as $signature => $fk) {
            if (!isset($fromFKMap[$signature])) {
                $changes[] = [
                    'type' => 'ADD_FOREIGN_KEY',
                    'table' => $tableName,
                    'constraint' => $fk,
                    'priority' => 10, // ADD FK: after ADD INDEX
                ];
            }
        }

        return $changes;
    }

    private function getForeignKeySignature($constraint): string
    {
        $columns = $constraint->constraintColumns->pluck('field_name')->sort()->join(',');
        $ref = $constraint->foreignKeyReference;
        $refTable = $ref ? $ref->referencedTable->table_name : '';
        $refColumns = $ref && $ref->referenceColumns ? $ref->referenceColumns->pluck('referenced_column_name')->sort()->join(',') : '';

        return "{$columns}->{$refTable}({$refColumns})";
    }

    /**
     * Generate SQL Migration Script in correct order
     */
    private function generateMigrationSQL(array $changes): string
    {
        // Sort by priority (ascending: 1=first, 11=last)
        usort($changes, function($a, $b) {
            return $a['priority'] <=> $b['priority'];
        });

        $sql = "-- ========================================\n";
        $sql .= "-- Database Migration Script\n";
        $sql .= "-- Generated: " . date('Y-m-d H:i:s') . "\n";
        $sql .= "-- ========================================\n\n";

        foreach ($changes as $change) {
            $sql .= $this->generateSQL($change);
        }

        return $sql;
    }

    /**
     * Generate SQL for individual change
     */
    private function generateSQL(array $change): string
    {
        $table = $change['table'];
        $sql = "\n-- " . $change['type'] . ": {$table}\n";

        switch ($change['type']) {
            case 'CREATE_TABLE':
                $sql .= $this->generateCreateTable($change);
                break;

            case 'DROP_TABLE':
                $sql .= "DROP TABLE IF EXISTS `{$table}`;\n";
                break;

            case 'ADD_COLUMN':
                $sql .= $this->generateAddColumn($change);
                break;

            case 'DROP_COLUMN':
                $sql .= "ALTER TABLE `{$table}` DROP COLUMN `{$change['field']}`;\n";
                break;

            case 'MODIFY_COLUMN':
                $sql .= $this->generateModifyColumn($change);
                break;

            case 'DROP_PRIMARY_KEY':
                $sql .= "ALTER TABLE `{$table}` DROP PRIMARY KEY;\n";
                break;

            case 'ADD_PRIMARY_KEY':
                $columns = implode('`, `', $change['columns']);
                $sql .= "ALTER TABLE `{$table}` ADD PRIMARY KEY (`{$columns}`);\n";
                break;

            case 'DROP_FOREIGN_KEY':
                $sql .= "ALTER TABLE `{$table}` DROP FOREIGN KEY `{$change['constraint_name']}`;\n";
                break;

            case 'ADD_FOREIGN_KEY':
                $sql .= $this->generateAddForeignKey($change);
                break;
        }

        return $sql;
    }

    private function generateCreateTable(array $change): string
    {
        $table = $change['table_data'];
        $tableName = $change['table'];

        $sql = "CREATE TABLE `{$tableName}` (\n";

        $fieldDefinitions = [];
        foreach ($table->fields->sortBy('field_order') as $field) {
            $fieldDefinitions[] = "  " . $this->getFieldDefinition($field);
        }

        $sql .= implode(",\n", $fieldDefinitions);

        // Add PRIMARY KEY
        $pk = $table->constraints->firstWhere('constraint_type', 'PRIMARY KEY');
        if ($pk) {
            $pkColumns = $pk->constraintColumns->pluck('field_name')->implode('`, `');
            $sql .= ",\n  PRIMARY KEY (`{$pkColumns}`)";
        }

        $sql .= "\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n";

        return $sql;
    }

    private function generateAddColumn(array $change): string
    {
        $table = $change['table'];
        $field = $change['field_data'];
        $definition = $this->getFieldDefinition($field);

        return "ALTER TABLE `{$table}` ADD COLUMN {$definition};\n";
    }

    private function generateModifyColumn(array $change): string
    {
        $table = $change['table'];
        $field = $change['to_field'];
        $definition = $this->getFieldDefinition($field);

        return "ALTER TABLE `{$table}` MODIFY COLUMN {$definition};\n";
    }

    private function generateAddForeignKey(array $change): string
    {
        $table = $change['table'];
        $constraint = $change['constraint'];
        $constraintName = $constraint->constraint_name;

        $columns = $constraint->constraintColumns->pluck('field_name')->implode('`, `');

        $ref = $constraint->foreignKeyReference;
        $refTable = $ref->referencedTable->table_name;

        // Extract referenced column names from referencedField relationship
        $refColumns = $ref->referenceColumns->map(function ($refCol) {
            return $refCol->referencedField->field_name;
        })->implode('`, `');

        $onDelete = $ref->on_delete ?? 'NO ACTION';
        $onUpdate = $ref->on_update ?? 'NO ACTION';

        $sql = "ALTER TABLE `{$table}` ADD CONSTRAINT `{$constraintName}` ";
        $sql .= "FOREIGN KEY (`{$columns}`) ";
        $sql .= "REFERENCES `{$refTable}` (`{$refColumns}`)";

        if ($onDelete !== 'NO ACTION') {
            $sql .= " ON DELETE {$onDelete}";
        }
        if ($onUpdate !== 'NO ACTION') {
            $sql .= " ON UPDATE {$onUpdate}";
        }

        $sql .= ";\n";

        return $sql;
    }

    /**
     * Generate field definition for SQL
     */
    private function getFieldDefinition($field): string
    {
        $def = "`{$field->field_name}` {$field->field_type}";

        // Add field length if present
        if (!empty($field->field_length)) {
            $def .= "({$field->field_length})";
        }

        // Normalize boolean: treat NULL, 0, false as false, everything else as true
        $isUnsigned = !empty($field->is_unsigned);
        $isNullable = !empty($field->is_nullable);
        $isAutoInc = !empty($field->is_auto_increment);

        if ($isUnsigned) {
            $def .= " UNSIGNED";
        }

        if (!$isNullable) {
            $def .= " NOT NULL";
        } else {
            $def .= " NULL";
        }

        if ($isAutoInc) {
            $def .= " AUTO_INCREMENT";
        }

        // DEFAULT: Never add DEFAULT for AUTO_INCREMENT fields
        if ($field->default_value !== null && $field->default_value !== '' && !$isAutoInc) {
            $def .= " DEFAULT '{$field->default_value}'";
        }

        if ($field->comment) {
            $comment = addslashes($field->comment);
            $def .= " COMMENT '{$comment}'";
        }

        return $def;
    }

    /**
     * Generate summary of changes
     */
    private function generateSummary(array $changes): array
    {
        $summary = [
            'total_changes' => count($changes),
            'tables_created' => 0,
            'tables_dropped' => 0,
            'columns_added' => 0,
            'columns_dropped' => 0,
            'columns_modified' => 0,
            'primary_keys_changed' => 0,
            'foreign_keys_added' => 0,
            'foreign_keys_dropped' => 0,
        ];

        foreach ($changes as $change) {
            switch ($change['type']) {
                case 'CREATE_TABLE':
                    $summary['tables_created']++;
                    break;
                case 'DROP_TABLE':
                    $summary['tables_dropped']++;
                    break;
                case 'ADD_COLUMN':
                    $summary['columns_added']++;
                    break;
                case 'DROP_COLUMN':
                    $summary['columns_dropped']++;
                    break;
                case 'MODIFY_COLUMN':
                    $summary['columns_modified']++;
                    break;
                case 'DROP_PRIMARY_KEY':
                case 'ADD_PRIMARY_KEY':
                    $summary['primary_keys_changed']++;
                    break;
                case 'ADD_FOREIGN_KEY':
                    $summary['foreign_keys_added']++;
                    break;
                case 'DROP_FOREIGN_KEY':
                    $summary['foreign_keys_dropped']++;
                    break;
            }
        }

        return $summary;
    }
}
