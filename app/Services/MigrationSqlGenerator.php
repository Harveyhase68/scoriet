<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

/**
 * Multi-Dialect Migration SQL Generator
 *
 * Generates database-specific SQL statements from schema changes.
 * Supports: MySQL, PostgreSQL, SQLite, MS-SQL (SQL Server)
 */
class MigrationSqlGenerator
{
    private string $dialect;

    /**
     * Supported database dialects
     */
    public const DIALECT_MYSQL = 'mysql';
    public const DIALECT_PGSQL = 'pgsql';
    public const DIALECT_SQLITE = 'sqlite';
    public const DIALECT_SQLSRV = 'sqlsrv';

    /**
     * Generate SQL statements for all changes in the specified dialect
     *
     * @param array $changes Array of changes from SchemaDiffService
     * @param string $dialect Database dialect (mysql, pgsql, sqlite, sqlsrv)
     * @return array Array of formatted change items with SQL
     */
    public function generate(array $changes, string $dialect = self::DIALECT_MYSQL): array
    {
        $this->dialect = $dialect;

        // Sort changes by priority for correct execution order
        usort($changes, fn($a, $b) => $a['priority'] <=> $b['priority']);

        $result = [];

        foreach ($changes as $change) {
            $sql = $this->generateSQL($change);

            if ($sql) {
                $result[] = $this->formatChange($change, $sql);
            }
        }

        return $result;
    }

    /**
     * Generate complete migration script
     *
     * @param array $changes Array of changes from SchemaDiffService
     * @param string $dialect Database dialect
     * @param int $fromVersion Source version number
     * @param int $toVersion Target version number
     * @return string Complete SQL script
     */
    public function generateScript(array $changes, string $dialect, int $fromVersion, int $toVersion): string
    {
        $this->dialect = $dialect;

        // Sort changes by priority
        usort($changes, fn($a, $b) => $a['priority'] <=> $b['priority']);

        $dialectName = match($dialect) {
            self::DIALECT_MYSQL => 'MySQL',
            self::DIALECT_PGSQL => 'PostgreSQL',
            self::DIALECT_SQLITE => 'SQLite',
            self::DIALECT_SQLSRV => 'SQL Server',
            default => 'MySQL',
        };

        $script = "-- ========================================\n";
        $script .= "-- Migration Script: v{$fromVersion} -> v{$toVersion}\n";
        $script .= "-- Dialect: {$dialectName}\n";
        $script .= "-- Generated: " . date('Y-m-d H:i:s') . "\n";
        $script .= "-- ========================================\n\n";

        foreach ($changes as $change) {
            $sql = $this->generateSQL($change);
            if ($sql) {
                $script .= "-- {$change['type']}: {$change['table']}\n";
                $script .= $sql . "\n";
            }
        }

        return $script;
    }

    /**
     * Get grouped changes for template usage
     *
     * @param array $changes Array of changes from SchemaDiffService
     * @param string $dialect Database dialect
     * @return array Grouped changes: tables, fields, indexes, foreignKeys
     */
    public function getGroupedChanges(array $changes, string $dialect): array
    {
        $this->dialect = $dialect;

        $groups = [
            'tables' => [],
            'fields' => [],
            'indexes' => [],
            'foreignKeys' => [],
        ];

        // Sort changes by priority
        usort($changes, fn($a, $b) => $a['priority'] <=> $b['priority']);

        foreach ($changes as $change) {
            $sql = $this->generateSQL($change);
            if (!$sql) {
                continue;
            }

            $item = $this->formatChange($change, $sql);

            switch ($change['type']) {
                case 'CREATE_TABLE':
                case 'DROP_TABLE':
                    $groups['tables'][] = $item;
                    break;

                case 'ADD_COLUMN':
                case 'DROP_COLUMN':
                case 'MODIFY_COLUMN':
                    $groups['fields'][] = $item;
                    break;

                case 'ADD_INDEX':
                case 'DROP_INDEX':
                case 'ADD_UNIQUE_KEY':
                case 'DROP_UNIQUE_KEY':
                case 'ADD_PRIMARY_KEY':
                case 'DROP_PRIMARY_KEY':
                    $groups['indexes'][] = $item;
                    break;

                case 'ADD_FOREIGN_KEY':
                case 'DROP_FOREIGN_KEY':
                    $groups['foreignKeys'][] = $item;
                    break;
            }
        }

        return $groups;
    }

    /**
     * Format a change item for template usage
     */
    private function formatChange(array $change, string $sql): array
    {
        $action = match($change['type']) {
            'CREATE_TABLE' => 'CREATE',
            'DROP_TABLE' => 'DROP',
            'ADD_COLUMN' => 'ADD',
            'DROP_COLUMN' => 'DROP',
            'MODIFY_COLUMN' => 'MODIFY',
            'ADD_INDEX', 'ADD_UNIQUE_KEY', 'ADD_PRIMARY_KEY' => 'ADD',
            'DROP_INDEX', 'DROP_UNIQUE_KEY', 'DROP_PRIMARY_KEY' => 'DROP',
            'ADD_FOREIGN_KEY' => 'ADD',
            'DROP_FOREIGN_KEY' => 'DROP',
            default => 'UNKNOWN',
        };

        $name = match($change['type']) {
            'CREATE_TABLE', 'DROP_TABLE' => $change['table'],
            'ADD_COLUMN', 'DROP_COLUMN', 'MODIFY_COLUMN' => $change['field'] ?? '',
            'ADD_INDEX', 'DROP_INDEX' => $change['index_name'] ?? '',
            'ADD_UNIQUE_KEY', 'DROP_UNIQUE_KEY' => $change['constraint_name'] ?? '',
            'ADD_PRIMARY_KEY', 'DROP_PRIMARY_KEY' => 'PRIMARY',
            'ADD_FOREIGN_KEY', 'DROP_FOREIGN_KEY' => $change['constraint_name'] ?? $change['constraint']->constraint_name ?? '',
            default => '',
        };

        return [
            'action' => $action,
            'type' => $change['type'],
            'table' => $change['table'],
            'name' => $name,
            'sql' => trim($sql),
            'priority' => $change['priority'],
        ];
    }

    /**
     * Generate SQL for a single change based on dialect
     */
    private function generateSQL(array $change): string
    {
        return match($this->dialect) {
            self::DIALECT_MYSQL => $this->generateMySQL($change),
            self::DIALECT_PGSQL => $this->generatePostgreSQL($change),
            self::DIALECT_SQLITE => $this->generateSQLite($change),
            self::DIALECT_SQLSRV => $this->generateSQLServer($change),
            default => $this->generateMySQL($change),
        };
    }

    // ========================================
    // MySQL Generation
    // ========================================

    private function generateMySQL(array $change): string
    {
        $table = $this->quoteIdentifierMySQL($change['table']);

        return match($change['type']) {
            'CREATE_TABLE' => $this->generateCreateTableMySQL($change),
            'DROP_TABLE' => "DROP TABLE IF EXISTS {$table};",
            'ADD_COLUMN' => $this->generateAddColumnMySQL($change),
            'DROP_COLUMN' => "ALTER TABLE {$table} DROP COLUMN " . $this->quoteIdentifierMySQL($change['field']) . ";",
            'MODIFY_COLUMN' => $this->generateModifyColumnMySQL($change),
            'ADD_PRIMARY_KEY' => "ALTER TABLE {$table} ADD PRIMARY KEY (" . $this->quoteColumnsMySQL($change['columns']) . ");",
            'DROP_PRIMARY_KEY' => "ALTER TABLE {$table} DROP PRIMARY KEY;",
            'ADD_INDEX' => "ALTER TABLE {$table} ADD INDEX " . $this->quoteIdentifierMySQL($change['index_name']) . " (" . $this->quoteColumnsMySQL($change['columns']) . ");",
            'DROP_INDEX' => "ALTER TABLE {$table} DROP INDEX " . $this->quoteIdentifierMySQL($change['index_name']) . ";",
            'ADD_UNIQUE_KEY' => "ALTER TABLE {$table} ADD UNIQUE KEY " . $this->quoteIdentifierMySQL($change['constraint_name']) . " (" . $this->quoteColumnsMySQL($change['columns']) . ");",
            'DROP_UNIQUE_KEY' => "ALTER TABLE {$table} DROP INDEX " . $this->quoteIdentifierMySQL($change['constraint_name']) . ";",
            'ADD_FOREIGN_KEY' => $this->generateAddForeignKeyMySQL($change),
            'DROP_FOREIGN_KEY' => "ALTER TABLE {$table} DROP FOREIGN KEY " . $this->quoteIdentifierMySQL($change['constraint_name']) . ";",
            default => '',
        };
    }

    private function generateCreateTableMySQL(array $change): string
    {
        $tableData = $change['table_data'];
        $tableName = $this->quoteIdentifierMySQL($change['table']);

        $sql = "CREATE TABLE {$tableName} (\n";

        $fieldDefinitions = [];
        foreach ($tableData->fields->sortBy('field_order') as $field) {
            $fieldDefinitions[] = "  " . $this->getFieldDefinitionMySQL($field);
        }

        $sql .= implode(",\n", $fieldDefinitions);

        // Add PRIMARY KEY
        $pk = $tableData->constraints->firstWhere('constraint_type', 'PRIMARY KEY');
        if ($pk) {
            $pkColumns = $this->quoteColumnsMySQL($pk->constraintColumns->pluck('field_name')->toArray());
            $sql .= ",\n  PRIMARY KEY ({$pkColumns})";
        }

        $sql .= "\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

        return $sql;
    }

    private function generateAddColumnMySQL(array $change): string
    {
        $table = $this->quoteIdentifierMySQL($change['table']);
        $definition = $this->getFieldDefinitionMySQL($change['field_data']);
        return "ALTER TABLE {$table} ADD COLUMN {$definition};";
    }

    private function generateModifyColumnMySQL(array $change): string
    {
        $table = $this->quoteIdentifierMySQL($change['table']);
        $definition = $this->getFieldDefinitionMySQL($change['to_field']);
        return "ALTER TABLE {$table} MODIFY COLUMN {$definition};";
    }

    private function generateAddForeignKeyMySQL(array $change): string
    {
        $table = $this->quoteIdentifierMySQL($change['table']);
        $constraint = $change['constraint'];
        $constraintName = $this->quoteIdentifierMySQL($constraint->constraint_name);

        $columns = $this->quoteColumnsMySQL($constraint->constraintColumns->pluck('field_name')->toArray());

        $ref = $constraint->foreignKeyReference;
        $refTable = $this->quoteIdentifierMySQL($ref->referencedTable->table_name);
        $refColumns = $this->quoteColumnsMySQL(
            $ref->referenceColumns->map(fn($rc) => $rc->referencedField->field_name)->toArray()
        );

        $onDelete = $ref->on_delete ?? 'NO ACTION';
        $onUpdate = $ref->on_update ?? 'NO ACTION';

        $sql = "ALTER TABLE {$table} ADD CONSTRAINT {$constraintName} ";
        $sql .= "FOREIGN KEY ({$columns}) ";
        $sql .= "REFERENCES {$refTable} ({$refColumns})";

        if ($onDelete !== 'NO ACTION') {
            $sql .= " ON DELETE {$onDelete}";
        }
        if ($onUpdate !== 'NO ACTION') {
            $sql .= " ON UPDATE {$onUpdate}";
        }

        return $sql . ";";
    }

    private function getFieldDefinitionMySQL($field): string
    {
        $def = $this->quoteIdentifierMySQL($field->field_name) . " {$field->field_type}";

        if (!empty($field->field_length)) {
            $def .= "({$field->field_length})";
        }

        if (!empty($field->is_unsigned)) {
            $def .= " UNSIGNED";
        }

        if (empty($field->is_nullable)) {
            $def .= " NOT NULL";
        } else {
            $def .= " NULL";
        }

        if (!empty($field->is_auto_increment)) {
            $def .= " AUTO_INCREMENT";
        }

        if ($field->default_value !== null && $field->default_value !== '' && empty($field->is_auto_increment)) {
            $def .= " DEFAULT '{$field->default_value}'";
        }

        if (!empty($field->comment)) {
            $comment = addslashes($field->comment);
            $def .= " COMMENT '{$comment}'";
        }

        return $def;
    }

    private function quoteIdentifierMySQL(string $identifier): string
    {
        return '`' . str_replace('`', '``', $identifier) . '`';
    }

    private function quoteColumnsMySQL(array $columns): string
    {
        return implode(', ', array_map(fn($c) => $this->quoteIdentifierMySQL($c), $columns));
    }

    // ========================================
    // PostgreSQL Generation
    // ========================================

    private function generatePostgreSQL(array $change): string
    {
        $table = $this->quoteIdentifierPgSQL($change['table']);

        return match($change['type']) {
            'CREATE_TABLE' => $this->generateCreateTablePgSQL($change),
            'DROP_TABLE' => "DROP TABLE IF EXISTS {$table} CASCADE;",
            'ADD_COLUMN' => $this->generateAddColumnPgSQL($change),
            'DROP_COLUMN' => "ALTER TABLE {$table} DROP COLUMN " . $this->quoteIdentifierPgSQL($change['field']) . ";",
            'MODIFY_COLUMN' => $this->generateModifyColumnPgSQL($change),
            'ADD_PRIMARY_KEY' => "ALTER TABLE {$table} ADD PRIMARY KEY (" . $this->quoteColumnsPgSQL($change['columns']) . ");",
            'DROP_PRIMARY_KEY' => "ALTER TABLE {$table} DROP CONSTRAINT IF EXISTS " . $this->quoteIdentifierPgSQL($change['table'] . '_pkey') . ";",
            'ADD_INDEX' => "CREATE INDEX " . $this->quoteIdentifierPgSQL($change['index_name']) . " ON {$table} (" . $this->quoteColumnsPgSQL($change['columns']) . ");",
            'DROP_INDEX' => "DROP INDEX IF EXISTS " . $this->quoteIdentifierPgSQL($change['index_name']) . ";",
            'ADD_UNIQUE_KEY' => "ALTER TABLE {$table} ADD CONSTRAINT " . $this->quoteIdentifierPgSQL($change['constraint_name']) . " UNIQUE (" . $this->quoteColumnsPgSQL($change['columns']) . ");",
            'DROP_UNIQUE_KEY' => "ALTER TABLE {$table} DROP CONSTRAINT IF EXISTS " . $this->quoteIdentifierPgSQL($change['constraint_name']) . ";",
            'ADD_FOREIGN_KEY' => $this->generateAddForeignKeyPgSQL($change),
            'DROP_FOREIGN_KEY' => "ALTER TABLE {$table} DROP CONSTRAINT IF EXISTS " . $this->quoteIdentifierPgSQL($change['constraint_name']) . ";",
            default => '',
        };
    }

    private function generateCreateTablePgSQL(array $change): string
    {
        $tableData = $change['table_data'];
        $tableName = $this->quoteIdentifierPgSQL($change['table']);

        $sql = "CREATE TABLE {$tableName} (\n";

        $fieldDefinitions = [];
        foreach ($tableData->fields->sortBy('field_order') as $field) {
            $fieldDefinitions[] = "  " . $this->getFieldDefinitionPgSQL($field);
        }

        $sql .= implode(",\n", $fieldDefinitions);

        // Add PRIMARY KEY
        $pk = $tableData->constraints->firstWhere('constraint_type', 'PRIMARY KEY');
        if ($pk) {
            $pkColumns = $this->quoteColumnsPgSQL($pk->constraintColumns->pluck('field_name')->toArray());
            $sql .= ",\n  PRIMARY KEY ({$pkColumns})";
        }

        $sql .= "\n);";

        return $sql;
    }

    private function generateAddColumnPgSQL(array $change): string
    {
        $table = $this->quoteIdentifierPgSQL($change['table']);
        $definition = $this->getFieldDefinitionPgSQL($change['field_data']);
        return "ALTER TABLE {$table} ADD COLUMN {$definition};";
    }

    private function generateModifyColumnPgSQL(array $change): string
    {
        // PostgreSQL requires multiple ALTER statements for different changes
        $table = $this->quoteIdentifierPgSQL($change['table']);
        $fieldName = $this->quoteIdentifierPgSQL($change['to_field']->field_name);
        $field = $change['to_field'];

        $statements = [];

        // Change type
        $pgType = $this->mapToPgSQLType($field->field_type, $field->field_length);
        $statements[] = "ALTER TABLE {$table} ALTER COLUMN {$fieldName} TYPE {$pgType};";

        // Change nullable
        if (empty($field->is_nullable)) {
            $statements[] = "ALTER TABLE {$table} ALTER COLUMN {$fieldName} SET NOT NULL;";
        } else {
            $statements[] = "ALTER TABLE {$table} ALTER COLUMN {$fieldName} DROP NOT NULL;";
        }

        // Change default
        if ($field->default_value !== null && $field->default_value !== '') {
            $statements[] = "ALTER TABLE {$table} ALTER COLUMN {$fieldName} SET DEFAULT '{$field->default_value}';";
        } else {
            $statements[] = "ALTER TABLE {$table} ALTER COLUMN {$fieldName} DROP DEFAULT;";
        }

        return implode("\n", $statements);
    }

    private function generateAddForeignKeyPgSQL(array $change): string
    {
        $table = $this->quoteIdentifierPgSQL($change['table']);
        $constraint = $change['constraint'];
        $constraintName = $this->quoteIdentifierPgSQL($constraint->constraint_name);

        $columns = $this->quoteColumnsPgSQL($constraint->constraintColumns->pluck('field_name')->toArray());

        $ref = $constraint->foreignKeyReference;
        $refTable = $this->quoteIdentifierPgSQL($ref->referencedTable->table_name);
        $refColumns = $this->quoteColumnsPgSQL(
            $ref->referenceColumns->map(fn($rc) => $rc->referencedField->field_name)->toArray()
        );

        $onDelete = $ref->on_delete ?? 'NO ACTION';
        $onUpdate = $ref->on_update ?? 'NO ACTION';

        $sql = "ALTER TABLE {$table} ADD CONSTRAINT {$constraintName} ";
        $sql .= "FOREIGN KEY ({$columns}) ";
        $sql .= "REFERENCES {$refTable} ({$refColumns})";

        if ($onDelete !== 'NO ACTION') {
            $sql .= " ON DELETE {$onDelete}";
        }
        if ($onUpdate !== 'NO ACTION') {
            $sql .= " ON UPDATE {$onUpdate}";
        }

        return $sql . ";";
    }

    private function getFieldDefinitionPgSQL($field): string
    {
        $fieldName = $this->quoteIdentifierPgSQL($field->field_name);

        // Handle auto-increment with SERIAL types
        if (!empty($field->is_auto_increment)) {
            $serialType = match(strtolower($field->field_type)) {
                'bigint' => 'BIGSERIAL',
                'smallint' => 'SMALLSERIAL',
                default => 'SERIAL',
            };
            return "{$fieldName} {$serialType}" . (empty($field->is_nullable) ? ' NOT NULL' : '');
        }

        $pgType = $this->mapToPgSQLType($field->field_type, $field->field_length);
        $def = "{$fieldName} {$pgType}";

        if (empty($field->is_nullable)) {
            $def .= " NOT NULL";
        }

        if ($field->default_value !== null && $field->default_value !== '') {
            $def .= " DEFAULT '{$field->default_value}'";
        }

        return $def;
    }

    private function mapToPgSQLType(string $mysqlType, $length = null): string
    {
        $type = strtolower($mysqlType);

        return match($type) {
            'tinyint' => 'SMALLINT',
            'smallint' => 'SMALLINT',
            'mediumint' => 'INTEGER',
            'int', 'integer' => 'INTEGER',
            'bigint' => 'BIGINT',
            'float' => 'REAL',
            'double' => 'DOUBLE PRECISION',
            'decimal', 'numeric' => 'NUMERIC' . ($length ? "({$length})" : ''),
            'char' => 'CHAR' . ($length ? "({$length})" : '(1)'),
            'varchar' => 'VARCHAR' . ($length ? "({$length})" : '(255)'),
            'tinytext', 'text', 'mediumtext', 'longtext' => 'TEXT',
            'tinyblob', 'blob', 'mediumblob', 'longblob' => 'BYTEA',
            'date' => 'DATE',
            'datetime', 'timestamp' => 'TIMESTAMP',
            'time' => 'TIME',
            'year' => 'SMALLINT',
            'enum', 'set' => 'VARCHAR(255)', // PostgreSQL doesn't have native ENUM
            'json' => 'JSONB',
            'boolean', 'bool' => 'BOOLEAN',
            default => 'TEXT',
        };
    }

    private function quoteIdentifierPgSQL(string $identifier): string
    {
        return '"' . str_replace('"', '""', $identifier) . '"';
    }

    private function quoteColumnsPgSQL(array $columns): string
    {
        return implode(', ', array_map(fn($c) => $this->quoteIdentifierPgSQL($c), $columns));
    }

    // ========================================
    // SQLite Generation
    // ========================================

    private function generateSQLite(array $change): string
    {
        $table = $this->quoteIdentifierSQLite($change['table']);

        // Note: SQLite has very limited ALTER TABLE support
        return match($change['type']) {
            'CREATE_TABLE' => $this->generateCreateTableSQLite($change),
            'DROP_TABLE' => "DROP TABLE IF EXISTS {$table};",
            'ADD_COLUMN' => $this->generateAddColumnSQLite($change),
            'DROP_COLUMN' => "ALTER TABLE {$table} DROP COLUMN " . $this->quoteIdentifierSQLite($change['field']) . ";", // SQLite 3.35.0+
            'MODIFY_COLUMN' => "-- SQLite does not support MODIFY COLUMN directly. Table recreation required for: {$change['field']}",
            'ADD_PRIMARY_KEY' => "-- SQLite does not support adding PRIMARY KEY to existing table",
            'DROP_PRIMARY_KEY' => "-- SQLite does not support dropping PRIMARY KEY from existing table",
            'ADD_INDEX' => "CREATE INDEX " . $this->quoteIdentifierSQLite($change['index_name']) . " ON {$table} (" . $this->quoteColumnsSQLite($change['columns']) . ");",
            'DROP_INDEX' => "DROP INDEX IF EXISTS " . $this->quoteIdentifierSQLite($change['index_name']) . ";",
            'ADD_UNIQUE_KEY' => "CREATE UNIQUE INDEX " . $this->quoteIdentifierSQLite($change['constraint_name']) . " ON {$table} (" . $this->quoteColumnsSQLite($change['columns']) . ");",
            'DROP_UNIQUE_KEY' => "DROP INDEX IF EXISTS " . $this->quoteIdentifierSQLite($change['constraint_name']) . ";",
            'ADD_FOREIGN_KEY' => "-- SQLite does not support ADD CONSTRAINT for foreign keys. Table recreation required.",
            'DROP_FOREIGN_KEY' => "-- SQLite does not support DROP CONSTRAINT. Table recreation required.",
            default => '',
        };
    }

    private function generateCreateTableSQLite(array $change): string
    {
        $tableData = $change['table_data'];
        $tableName = $this->quoteIdentifierSQLite($change['table']);

        $sql = "CREATE TABLE {$tableName} (\n";

        $fieldDefinitions = [];
        foreach ($tableData->fields->sortBy('field_order') as $field) {
            $fieldDefinitions[] = "  " . $this->getFieldDefinitionSQLite($field);
        }

        $sql .= implode(",\n", $fieldDefinitions);

        // Add PRIMARY KEY
        $pk = $tableData->constraints->firstWhere('constraint_type', 'PRIMARY KEY');
        if ($pk && $pk->constraintColumns->count() > 1) {
            // Composite primary key
            $pkColumns = $this->quoteColumnsSQLite($pk->constraintColumns->pluck('field_name')->toArray());
            $sql .= ",\n  PRIMARY KEY ({$pkColumns})";
        }

        $sql .= "\n);";

        return $sql;
    }

    private function generateAddColumnSQLite(array $change): string
    {
        $table = $this->quoteIdentifierSQLite($change['table']);
        $definition = $this->getFieldDefinitionSQLite($change['field_data']);
        return "ALTER TABLE {$table} ADD COLUMN {$definition};";
    }

    private function getFieldDefinitionSQLite($field): string
    {
        $fieldName = $this->quoteIdentifierSQLite($field->field_name);

        $sqliteType = $this->mapToSQLiteType($field->field_type);
        $def = "{$fieldName} {$sqliteType}";

        // Handle PRIMARY KEY with AUTOINCREMENT
        if (!empty($field->is_auto_increment)) {
            $def .= " PRIMARY KEY AUTOINCREMENT";
        } else {
            if (empty($field->is_nullable)) {
                $def .= " NOT NULL";
            }

            if ($field->default_value !== null && $field->default_value !== '') {
                $def .= " DEFAULT '{$field->default_value}'";
            }
        }

        return $def;
    }

    private function mapToSQLiteType(string $mysqlType): string
    {
        $type = strtolower($mysqlType);

        return match($type) {
            'tinyint', 'smallint', 'mediumint', 'int', 'integer', 'bigint', 'boolean', 'bool', 'year' => 'INTEGER',
            'float', 'double', 'decimal', 'numeric' => 'REAL',
            'char', 'varchar', 'tinytext', 'text', 'mediumtext', 'longtext', 'enum', 'set', 'json' => 'TEXT',
            'tinyblob', 'blob', 'mediumblob', 'longblob' => 'BLOB',
            'date', 'datetime', 'timestamp', 'time' => 'TEXT', // SQLite uses TEXT for dates
            default => 'TEXT',
        };
    }

    private function quoteIdentifierSQLite(string $identifier): string
    {
        return '"' . str_replace('"', '""', $identifier) . '"';
    }

    private function quoteColumnsSQLite(array $columns): string
    {
        return implode(', ', array_map(fn($c) => $this->quoteIdentifierSQLite($c), $columns));
    }

    // ========================================
    // SQL Server (MS-SQL) Generation
    // ========================================

    private function generateSQLServer(array $change): string
    {
        $table = $this->quoteIdentifierSQLSrv($change['table']);

        return match($change['type']) {
            'CREATE_TABLE' => $this->generateCreateTableSQLServer($change),
            'DROP_TABLE' => "DROP TABLE IF EXISTS {$table};",
            'ADD_COLUMN' => $this->generateAddColumnSQLServer($change),
            'DROP_COLUMN' => "ALTER TABLE {$table} DROP COLUMN " . $this->quoteIdentifierSQLSrv($change['field']) . ";",
            'MODIFY_COLUMN' => $this->generateModifyColumnSQLServer($change),
            'ADD_PRIMARY_KEY' => "ALTER TABLE {$table} ADD PRIMARY KEY (" . $this->quoteColumnsSQLSrv($change['columns']) . ");",
            'DROP_PRIMARY_KEY' => $this->generateDropPrimaryKeySQLServer($change),
            'ADD_INDEX' => "CREATE INDEX " . $this->quoteIdentifierSQLSrv($change['index_name']) . " ON {$table} (" . $this->quoteColumnsSQLSrv($change['columns']) . ");",
            'DROP_INDEX' => "DROP INDEX " . $this->quoteIdentifierSQLSrv($change['index_name']) . " ON {$table};",
            'ADD_UNIQUE_KEY' => "ALTER TABLE {$table} ADD CONSTRAINT " . $this->quoteIdentifierSQLSrv($change['constraint_name']) . " UNIQUE (" . $this->quoteColumnsSQLSrv($change['columns']) . ");",
            'DROP_UNIQUE_KEY' => "ALTER TABLE {$table} DROP CONSTRAINT " . $this->quoteIdentifierSQLSrv($change['constraint_name']) . ";",
            'ADD_FOREIGN_KEY' => $this->generateAddForeignKeySQLServer($change),
            'DROP_FOREIGN_KEY' => "ALTER TABLE {$table} DROP CONSTRAINT " . $this->quoteIdentifierSQLSrv($change['constraint_name']) . ";",
            default => '',
        };
    }

    private function generateCreateTableSQLServer(array $change): string
    {
        $tableData = $change['table_data'];
        $tableName = $this->quoteIdentifierSQLSrv($change['table']);

        $sql = "CREATE TABLE {$tableName} (\n";

        $fieldDefinitions = [];
        foreach ($tableData->fields->sortBy('field_order') as $field) {
            $fieldDefinitions[] = "  " . $this->getFieldDefinitionSQLServer($field);
        }

        $sql .= implode(",\n", $fieldDefinitions);

        // Add PRIMARY KEY
        $pk = $tableData->constraints->firstWhere('constraint_type', 'PRIMARY KEY');
        if ($pk) {
            $pkColumns = $this->quoteColumnsSQLSrv($pk->constraintColumns->pluck('field_name')->toArray());
            $sql .= ",\n  PRIMARY KEY ({$pkColumns})";
        }

        $sql .= "\n);";

        return $sql;
    }

    private function generateAddColumnSQLServer(array $change): string
    {
        $table = $this->quoteIdentifierSQLSrv($change['table']);
        $definition = $this->getFieldDefinitionSQLServer($change['field_data']);
        return "ALTER TABLE {$table} ADD {$definition};";
    }

    private function generateModifyColumnSQLServer(array $change): string
    {
        $table = $this->quoteIdentifierSQLSrv($change['table']);
        $field = $change['to_field'];
        $fieldName = $this->quoteIdentifierSQLSrv($field->field_name);

        $sqlType = $this->mapToSQLServerType($field->field_type, $field->field_length);
        $nullable = empty($field->is_nullable) ? 'NOT NULL' : 'NULL';

        return "ALTER TABLE {$table} ALTER COLUMN {$fieldName} {$sqlType} {$nullable};";
    }

    private function generateDropPrimaryKeySQLServer(array $change): string
    {
        $table = $change['table'];
        // SQL Server requires knowing the constraint name to drop PK
        return "ALTER TABLE " . $this->quoteIdentifierSQLSrv($table) . " DROP CONSTRAINT PK_{$table};";
    }

    private function generateAddForeignKeySQLServer(array $change): string
    {
        $table = $this->quoteIdentifierSQLSrv($change['table']);
        $constraint = $change['constraint'];
        $constraintName = $this->quoteIdentifierSQLSrv($constraint->constraint_name);

        $columns = $this->quoteColumnsSQLSrv($constraint->constraintColumns->pluck('field_name')->toArray());

        $ref = $constraint->foreignKeyReference;
        $refTable = $this->quoteIdentifierSQLSrv($ref->referencedTable->table_name);
        $refColumns = $this->quoteColumnsSQLSrv(
            $ref->referenceColumns->map(fn($rc) => $rc->referencedField->field_name)->toArray()
        );

        $onDelete = $ref->on_delete ?? 'NO ACTION';
        $onUpdate = $ref->on_update ?? 'NO ACTION';

        $sql = "ALTER TABLE {$table} ADD CONSTRAINT {$constraintName} ";
        $sql .= "FOREIGN KEY ({$columns}) ";
        $sql .= "REFERENCES {$refTable} ({$refColumns})";

        if ($onDelete !== 'NO ACTION') {
            $sql .= " ON DELETE {$onDelete}";
        }
        if ($onUpdate !== 'NO ACTION') {
            $sql .= " ON UPDATE {$onUpdate}";
        }

        return $sql . ";";
    }

    private function getFieldDefinitionSQLServer($field): string
    {
        $fieldName = $this->quoteIdentifierSQLSrv($field->field_name);

        $sqlType = $this->mapToSQLServerType($field->field_type, $field->field_length);
        $def = "{$fieldName} {$sqlType}";

        if (!empty($field->is_auto_increment)) {
            $def .= " IDENTITY(1,1)";
        }

        if (empty($field->is_nullable)) {
            $def .= " NOT NULL";
        } else {
            $def .= " NULL";
        }

        if ($field->default_value !== null && $field->default_value !== '' && empty($field->is_auto_increment)) {
            $def .= " DEFAULT '{$field->default_value}'";
        }

        return $def;
    }

    private function mapToSQLServerType(string $mysqlType, $length = null): string
    {
        $type = strtolower($mysqlType);

        return match($type) {
            'tinyint' => 'TINYINT',
            'smallint' => 'SMALLINT',
            'mediumint' => 'INT',
            'int', 'integer' => 'INT',
            'bigint' => 'BIGINT',
            'float' => 'FLOAT',
            'double' => 'FLOAT',
            'decimal', 'numeric' => 'DECIMAL' . ($length ? "({$length})" : '(18,2)'),
            'char' => 'CHAR' . ($length ? "({$length})" : '(1)'),
            'varchar' => 'VARCHAR' . ($length ? "({$length})" : '(255)'),
            'tinytext', 'text' => 'VARCHAR(MAX)',
            'mediumtext', 'longtext' => 'VARCHAR(MAX)',
            'tinyblob', 'blob', 'mediumblob', 'longblob' => 'VARBINARY(MAX)',
            'date' => 'DATE',
            'datetime' => 'DATETIME2',
            'timestamp' => 'DATETIME2',
            'time' => 'TIME',
            'year' => 'SMALLINT',
            'enum', 'set' => 'VARCHAR(255)',
            'json' => 'NVARCHAR(MAX)',
            'boolean', 'bool' => 'BIT',
            default => 'NVARCHAR(MAX)',
        };
    }

    private function quoteIdentifierSQLSrv(string $identifier): string
    {
        return '[' . str_replace(']', ']]', $identifier) . ']';
    }

    private function quoteColumnsSQLSrv(array $columns): string
    {
        return implode(', ', array_map(fn($c) => $this->quoteIdentifierSQLSrv($c), $columns));
    }
}
