<?php

namespace App\Services;

use Exception;

class SQLiteParser
{
    private $tokens;

    private $position;

    private $tables;

    private $table_map;

    private $sql_text;

    public function parseSQL($sql_text)
    {
        try {
            $tokenizer = new SQLiteTokenizer($sql_text);
            $this->tokens = $tokenizer->tokenize();
            $this->sql_text = $sql_text;
            $this->position = 0;
            $this->tables = [];
            $this->table_map = [];

            return $this->parse();
        } catch (\Exception $e) {
            throw new \Exception('SQLite Parse Error: '.$e->getMessage());
        }
    }

    private function parse()
    {
        while ($this->position < count($this->tokens)) {
            if ($this->currentTokenMatches('KEYWORD', 'CREATE')) {
                $this->parseCreateStatement();
            } elseif ($this->currentTokenMatches('KEYWORD', 'DROP')) {
                $this->skipToSemicolonOrEnd();
            } elseif ($this->currentTokenMatches('KEYWORD', 'ALTER')) {
                $this->parseAlterStatement();
            } elseif ($this->currentTokenMatches('KEYWORD', 'BEGIN') ||
                       $this->currentTokenMatches('KEYWORD', 'COMMIT') ||
                       $this->currentTokenMatches('KEYWORD', 'ROLLBACK') ||
                       $this->currentTokenMatches('KEYWORD', 'INSERT') ||
                       $this->currentTokenMatches('KEYWORD', 'DELETE') ||
                       $this->currentTokenMatches('KEYWORD', 'UPDATE')) {
                // Skip transaction control and DML statements
                $this->skipToSemicolonOrEnd();
            } else {
                $this->position++;
            }
        }

        return $this->tables;
    }

    private function currentToken()
    {
        if ($this->position < count($this->tokens)) {
            return $this->tokens[$this->position];
        }

        return null;
    }

    private function currentTokenMatches($token_type, $value = null)
    {
        $token = $this->currentToken();
        if (! $token || $token->type !== $token_type) {
            return false;
        }
        if ($value !== null) {
            return $token->value === $value;
        }

        return true;
    }

    private function consumeToken($expected_type = null, $expected_value = null)
    {
        $token = $this->currentToken();
        if ($token) {
            if ($expected_type && $token->type !== $expected_type) {
                $context = $this->getErrorContext();
                throw new Exception("SQLite Syntax Error: Expected token '{$expected_type}', but got '{$token->type}' with value '{$token->value}'{$context}");
            }
            if ($expected_value && $token->value !== $expected_value) {
                $context = $this->getErrorContext();
                throw new Exception("SQLite Syntax Error: Expected '{$expected_value}', but got '{$token->value}'{$context}");
            }
            $this->position++;

            return $token;
        }

        $context = $this->getErrorContext();
        throw new Exception("SQLite Syntax Error: Unexpected end of SQL script{$context}. Missing semicolon or incomplete statement?");
    }

    private function getErrorContext()
    {
        if (empty($this->tokens)) {
            return " (no tokens found)";
        }

        $currentPos = min($this->position, count($this->tokens) - 1);
        $token = $this->tokens[$currentPos] ?? null;

        if (!$token) {
            return " at end of SQL";
        }

        $start = max(0, $currentPos - 2);
        $end = min(count($this->tokens) - 1, $currentPos + 2);

        $contextTokens = [];
        for ($i = $start; $i <= $end; $i++) {
            $t = $this->tokens[$i];
            if ($i === $currentPos) {
                $contextTokens[] = ">>>{$t->value}<<<";
            } else {
                $contextTokens[] = $t->value;
            }
        }

        $sqlPosition = $token->position ?? 0;
        $sqlLines = explode("\n", $this->sql_text ?? '');
        $currentLine = 1;
        $currentChar = 0;
        $charCount = 0;

        foreach ($sqlLines as $lineNum => $line) {
            if ($charCount + strlen($line) >= $sqlPosition) {
                $currentLine = $lineNum + 1;
                $currentChar = $sqlPosition - $charCount + 1;
                break;
            }
            $charCount += strlen($line) + 1;
        }

        return " near: " . implode(' ', $contextTokens) .
               " (SQL line: {$currentLine}, character: {$currentChar}, token position: " . ($currentPos + 1) . "/" . count($this->tokens) . ")";
    }

    private function parseCreateStatement()
    {
        $this->consumeToken('KEYWORD', 'CREATE');

        // Skip optional TEMPORARY/TEMP
        if ($this->currentTokenMatches('KEYWORD', 'TEMPORARY') ||
            $this->currentTokenMatches('KEYWORD', 'TEMP')) {
            $this->consumeToken();
        }

        // We only care about CREATE TABLE
        if ($this->currentTokenMatches('KEYWORD', 'TABLE')) {
            $this->consumeToken('KEYWORD', 'TABLE');
        } else {
            // Skip CREATE VIEW, CREATE INDEX, CREATE TRIGGER, etc.
            $this->skipToSemicolonOrEnd();
            return;
        }

        // Optional IF NOT EXISTS
        if ($this->currentTokenMatches('KEYWORD', 'IF')) {
            $this->consumeToken('KEYWORD', 'IF');
            $this->consumeToken('KEYWORD', 'NOT');
            $this->consumeToken('KEYWORD', 'EXISTS');
        }

        // Table name (may include schema: schema.table_name)
        $table_name = $this->parseTableName();

        // Parse table definition
        if (!$this->currentTokenMatches('LPAREN')) {
            // CREATE TABLE ... AS SELECT — skip
            $this->skipToSemicolonOrEnd();
            return;
        }

        $this->consumeToken('LPAREN');
        [$fields, $constraints] = $this->parseTableDefinition();
        $this->consumeToken('RPAREN');

        // Skip table options (WITHOUT ROWID, STRICT, etc.)
        $this->skipToSemicolonOrEnd();

        // Apply AUTOINCREMENT from table-level PRIMARY KEY constraint to the field
        // SQLite syntax: PRIMARY KEY("col_name" AUTOINCREMENT)
        foreach ($constraints as &$constraint) {
            if ($constraint['type'] === 'PRIMARY KEY' && !empty($constraint['autoincrement'])) {
                foreach ($fields as &$field) {
                    if (count($constraint['columns']) === 1 &&
                        strtoupper($field['name']) === strtoupper($constraint['columns'][0])) {
                        $field['auto_increment'] = true;
                        $field['nullable'] = false;
                    }
                }
                unset($field);
                // Remove the internal autoincrement flag from the constraint output
                unset($constraint['autoincrement']);
            }
        }
        unset($constraint);

        $table = [
            'table_name' => $table_name,
            'fields' => $fields,
            'constraints' => $constraints,
        ];

        // Check if table already exists - merge
        if (isset($this->table_map[$table_name])) {
            $existingTable = &$this->table_map[$table_name];

            foreach ($fields as $newField) {
                $fieldExists = false;
                foreach ($existingTable['fields'] as $existingField) {
                    if ($existingField['name'] === $newField['name']) {
                        $fieldExists = true;
                        break;
                    }
                }
                if (!$fieldExists) {
                    $existingTable['fields'][] = $newField;
                }
            }

            foreach ($constraints as $newConstraint) {
                $existingTable['constraints'][] = $newConstraint;
            }
        } else {
            $this->tables[] = $table;
            $this->table_map[$table_name] = &$this->tables[count($this->tables) - 1];
        }
    }

    private function parseTableName()
    {
        $name_token = $this->consumeToken();
        $table_name = $name_token->value;

        // Check for schema.table notation
        if ($this->currentTokenMatches('DOT')) {
            $this->consumeToken('DOT');
            $table_token = $this->consumeToken();
            $table_name = $table_token->value;
        }

        return $table_name;
    }

    private function parseTableDefinition()
    {
        $fields = [];
        $constraints = [];

        while (! $this->currentTokenMatches('RPAREN')) {
            if ($this->currentTokenMatches('KEYWORD', 'PRIMARY')) {
                $constraints[] = $this->parsePrimaryKey();
            } elseif ($this->currentTokenMatches('KEYWORD', 'CONSTRAINT')) {
                $constraint = $this->parseConstraint();
                if ($constraint) {
                    $constraints[] = $constraint;
                }
            } elseif ($this->currentTokenMatches('KEYWORD', 'UNIQUE')) {
                $constraints[] = $this->parseUniqueConstraint();
            } elseif ($this->currentTokenMatches('KEYWORD', 'CHECK')) {
                $this->skipCheckConstraint();
            } elseif ($this->currentTokenMatches('KEYWORD', 'FOREIGN')) {
                $constraints[] = $this->parseForeignKeyInline();
            } else {
                $field = $this->parseFieldDefinition();
                if ($field) {
                    $fields[] = $field;
                }
            }

            // Handle comma
            if ($this->currentTokenMatches('COMMA')) {
                $this->consumeToken('COMMA');
            } elseif (! $this->currentTokenMatches('RPAREN')) {
                break;
            }
        }

        return [$fields, $constraints];
    }

    private function parseFieldDefinition()
    {
        // Field name
        $field_name_token = $this->consumeToken();
        if (!in_array($field_name_token->type, ['QUOTED_STRING', 'IDENTIFIER', 'KEYWORD'])) {
            return null;
        }
        $field_name = $field_name_token->value;

        // Data type (optional in SQLite — if missing, defaults to BLOB affinity)
        $data_type = '';
        if ($this->currentToken() &&
            !$this->currentTokenMatches('COMMA') &&
            !$this->currentTokenMatches('RPAREN') &&
            !$this->currentTokenMatches('KEYWORD', 'PRIMARY') &&
            !$this->currentTokenMatches('KEYWORD', 'NOT') &&
            !$this->currentTokenMatches('KEYWORD', 'NULL') &&
            !$this->currentTokenMatches('KEYWORD', 'DEFAULT') &&
            !$this->currentTokenMatches('KEYWORD', 'UNIQUE') &&
            !$this->currentTokenMatches('KEYWORD', 'CHECK') &&
            !$this->currentTokenMatches('KEYWORD', 'REFERENCES') &&
            !$this->currentTokenMatches('KEYWORD', 'CONSTRAINT') &&
            !$this->currentTokenMatches('KEYWORD', 'COLLATE') &&
            !$this->currentTokenMatches('KEYWORD', 'ON') &&
            !$this->currentTokenMatches('KEYWORD', 'AUTOINCREMENT') &&
            !$this->currentTokenMatches('KEYWORD', 'FOREIGN')) {
            $data_type = $this->parseDataType();
        }

        if (empty($data_type)) {
            $data_type = 'BLOB';
        }

        // Parse field attributes
        $auto_increment = false;
        $nullable = true;
        $default_value = null;
        $is_primary_key = false;

        while ($this->currentToken() &&
               ! $this->currentTokenMatches('COMMA') &&
               ! $this->currentTokenMatches('RPAREN')) {

            $token = $this->currentToken();

            if ($token->type === 'KEYWORD') {
                switch ($token->value) {
                    case 'NOT':
                        $this->consumeToken('KEYWORD', 'NOT');
                        if ($this->currentTokenMatches('KEYWORD', 'NULL')) {
                            $this->consumeToken('KEYWORD', 'NULL');
                            $nullable = false;
                        }
                        break;
                    case 'NULL':
                        $nullable = true;
                        $this->consumeToken();
                        break;
                    case 'DEFAULT':
                        $this->consumeToken('KEYWORD', 'DEFAULT');
                        $default_value = $this->parseDefaultValue();
                        break;
                    case 'PRIMARY':
                        // Inline PRIMARY KEY
                        $this->consumeToken('KEYWORD', 'PRIMARY');
                        $this->consumeToken('KEYWORD', 'KEY');
                        $is_primary_key = true;
                        $nullable = false;
                        // In SQLite, INTEGER PRIMARY KEY = auto_increment (ROWID alias)
                        $upperType = strtoupper($data_type);
                        if ($upperType === 'INTEGER') {
                            $auto_increment = true;
                        }
                        // Check for optional ASC/DESC
                        if ($this->currentTokenMatches('KEYWORD', 'ASC') ||
                            $this->currentTokenMatches('KEYWORD', 'DESC')) {
                            $this->consumeToken();
                        }
                        // Check for optional AUTOINCREMENT
                        if ($this->currentTokenMatches('KEYWORD', 'AUTOINCREMENT')) {
                            $this->consumeToken('KEYWORD', 'AUTOINCREMENT');
                            $auto_increment = true;
                        }
                        // Check for optional ON CONFLICT clause
                        if ($this->currentTokenMatches('KEYWORD', 'ON')) {
                            $this->parseOnConflict();
                        }
                        break;
                    case 'AUTOINCREMENT':
                        $this->consumeToken('KEYWORD', 'AUTOINCREMENT');
                        $auto_increment = true;
                        break;
                    case 'UNIQUE':
                        $this->consumeToken();
                        // Optional ON CONFLICT
                        if ($this->currentTokenMatches('KEYWORD', 'ON')) {
                            $this->parseOnConflict();
                        }
                        break;
                    case 'REFERENCES':
                        // Inline foreign key reference — skip
                        $this->skipInlineReferences();
                        break;
                    case 'CHECK':
                        $this->skipCheckConstraint();
                        break;
                    case 'COLLATE':
                        $this->consumeToken('KEYWORD', 'COLLATE');
                        $this->consumeToken(); // collation name
                        break;
                    case 'ON':
                        // ON CONFLICT clause
                        $this->parseOnConflict();
                        break;
                    case 'CONSTRAINT':
                        // Named inline constraint
                        $this->consumeToken('KEYWORD', 'CONSTRAINT');
                        $this->consumeToken(); // constraint name
                        break;
                    default:
                        $this->consumeToken();
                        break;
                }
            } else {
                $this->consumeToken();
            }
        }

        return [
            'name' => $field_name,
            'type' => $data_type,
            'unsigned' => false, // SQLite doesn't have UNSIGNED
            'nullable' => $nullable,
            'default' => $default_value,
            'auto_increment' => $auto_increment,
        ];
    }

    private function parseDataType()
    {
        $type_token = $this->consumeToken();
        $data_type = $type_token->value;

        // Handle compound types like DOUBLE PRECISION, CHARACTER VARYING, etc.
        if ($data_type === 'DOUBLE' && $this->currentTokenMatches('KEYWORD', 'PRECISION')) {
            $this->consumeToken('KEYWORD', 'PRECISION');
            $data_type = 'DOUBLE PRECISION';
        } elseif ($data_type === 'CHARACTER' && $this->currentTokenMatches('KEYWORD', 'VARYING')) {
            $this->consumeToken('KEYWORD', 'VARYING');
            $data_type = 'VARCHAR';
        } elseif ($data_type === 'NATIVE' && $this->currentTokenMatches('KEYWORD', 'CHARACTER')) {
            $this->consumeToken('KEYWORD', 'CHARACTER');
            $data_type = 'NCHAR';
        }

        // Handle data type with size: VARCHAR(255), NUMERIC(10,2)
        if ($this->currentTokenMatches('LPAREN')) {
            $this->consumeToken('LPAREN');
            $size_parts = [];

            while (! $this->currentTokenMatches('RPAREN')) {
                $size_token = $this->consumeToken();
                $size_parts[] = $size_token->value;

                if ($this->currentTokenMatches('COMMA')) {
                    $this->consumeToken('COMMA');
                    $size_parts[] = ',';
                } elseif (! $this->currentTokenMatches('RPAREN')) {
                    break;
                }
            }

            $data_type .= '('.implode('', $size_parts).')';
            $this->consumeToken('RPAREN');
        }

        return $data_type;
    }

    private function parseDefaultValue()
    {
        $token = $this->currentToken();

        if (!$token) {
            return null;
        }

        // Handle function calls like CURRENT_TIMESTAMP
        if ($token->type === 'KEYWORD') {
            $value = $token->value;
            $this->consumeToken();

            // Check for function call with parentheses
            if ($this->currentTokenMatches('LPAREN')) {
                $this->consumeToken('LPAREN');
                $value .= '(';
                $depth = 1;
                while ($depth > 0 && $this->currentToken()) {
                    if ($this->currentTokenMatches('LPAREN')) {
                        $depth++;
                        $value .= '(';
                    } elseif ($this->currentTokenMatches('RPAREN')) {
                        $depth--;
                        if ($depth > 0) {
                            $value .= ')';
                        }
                    } else {
                        $value .= $this->currentToken()->value;
                    }
                    $this->consumeToken();
                }
                $value .= ')';
            }

            return $value;
        } elseif ($token->type === 'QUOTED_STRING') {
            $this->consumeToken();
            return $token->value;
        } elseif ($token->type === 'NUMBER') {
            $this->consumeToken();
            return $token->value;
        } elseif ($token->type === 'IDENTIFIER') {
            $value = $token->value;
            $this->consumeToken();

            // Check for function call
            if ($this->currentTokenMatches('LPAREN')) {
                $this->consumeToken('LPAREN');
                $value .= '(';
                $depth = 1;
                while ($depth > 0 && $this->currentToken()) {
                    if ($this->currentTokenMatches('LPAREN')) {
                        $depth++;
                        $value .= '(';
                    } elseif ($this->currentTokenMatches('RPAREN')) {
                        $depth--;
                        if ($depth > 0) {
                            $value .= ')';
                        }
                    } else {
                        $value .= $this->currentToken()->value;
                    }
                    $this->consumeToken();
                }
                $value .= ')';
            }

            return $value;
        } elseif ($token->type === 'LPAREN') {
            // Parenthesized expression as default: DEFAULT (expression)
            $this->consumeToken('LPAREN');
            $value = '(';
            $depth = 1;
            while ($depth > 0 && $this->currentToken()) {
                if ($this->currentTokenMatches('LPAREN')) {
                    $depth++;
                    $value .= '(';
                } elseif ($this->currentTokenMatches('RPAREN')) {
                    $depth--;
                    if ($depth > 0) {
                        $value .= ')';
                    }
                } else {
                    $value .= $this->currentToken()->value;
                }
                $this->consumeToken();
            }
            $value .= ')';
            return $value;
        }

        return null;
    }

    private function parseOnConflict()
    {
        if ($this->currentTokenMatches('KEYWORD', 'ON')) {
            $this->consumeToken('KEYWORD', 'ON');
            if ($this->currentTokenMatches('KEYWORD', 'CONFLICT')) {
                $this->consumeToken('KEYWORD', 'CONFLICT');
                // ROLLBACK, ABORT, FAIL, IGNORE, REPLACE
                if ($this->currentToken() && $this->currentToken()->type === 'KEYWORD') {
                    $this->consumeToken();
                }
            }
        }
    }

    private function skipInlineReferences()
    {
        $this->consumeToken('KEYWORD', 'REFERENCES');
        $this->consumeToken(); // table name

        // Optional (column list)
        if ($this->currentTokenMatches('LPAREN')) {
            $this->consumeToken('LPAREN');
            while (!$this->currentTokenMatches('RPAREN')) {
                $this->consumeToken();
                if ($this->currentTokenMatches('COMMA')) {
                    $this->consumeToken();
                }
            }
            $this->consumeToken('RPAREN');
        }

        // Skip ON DELETE/UPDATE
        while ($this->currentTokenMatches('KEYWORD', 'ON') ||
               $this->currentTokenMatches('KEYWORD', 'MATCH') ||
               $this->currentTokenMatches('KEYWORD', 'NOT') ||
               $this->currentTokenMatches('KEYWORD', 'DEFERRABLE') ||
               $this->currentTokenMatches('KEYWORD', 'INITIALLY')) {

            if ($this->currentTokenMatches('KEYWORD', 'ON')) {
                $this->consumeToken();
                if ($this->currentToken()) {
                    $this->consumeToken(); // DELETE or UPDATE
                }
                $this->parseReferentialAction();
            } else {
                $this->consumeToken();
            }
        }
    }

    private function skipCheckConstraint()
    {
        if ($this->currentTokenMatches('KEYWORD', 'CHECK')) {
            $this->consumeToken('KEYWORD', 'CHECK');
        }

        if ($this->currentTokenMatches('LPAREN')) {
            $this->consumeToken('LPAREN');
            $depth = 1;
            while ($depth > 0 && $this->currentToken()) {
                if ($this->currentTokenMatches('LPAREN')) {
                    $depth++;
                } elseif ($this->currentTokenMatches('RPAREN')) {
                    $depth--;
                }
                if ($depth > 0) {
                    $this->consumeToken();
                }
            }
            $this->consumeToken('RPAREN');
        }
    }

    private function parsePrimaryKey()
    {
        $this->consumeToken('KEYWORD', 'PRIMARY');
        $this->consumeToken('KEYWORD', 'KEY');
        $this->consumeToken('LPAREN');

        $columns = [];
        $autoIncrement = false;
        while (! $this->currentTokenMatches('RPAREN')) {
            $col_token = $this->consumeToken();
            if (in_array($col_token->type, ['QUOTED_STRING', 'IDENTIFIER', 'KEYWORD'])) {
                $columns[] = $col_token->value;
            }

            // Skip ASC/DESC
            if ($this->currentTokenMatches('KEYWORD', 'ASC') ||
                $this->currentTokenMatches('KEYWORD', 'DESC')) {
                $this->consumeToken();
            }

            // SQLite allows AUTOINCREMENT inside PRIMARY KEY(col AUTOINCREMENT)
            if ($this->currentTokenMatches('KEYWORD', 'AUTOINCREMENT')) {
                $this->consumeToken('KEYWORD', 'AUTOINCREMENT');
                $autoIncrement = true;
            }

            // ON CONFLICT clause inside PRIMARY KEY
            if ($this->currentTokenMatches('KEYWORD', 'ON')) {
                $this->parseOnConflict();
            }

            if ($this->currentTokenMatches('COMMA')) {
                $this->consumeToken('COMMA');
            } elseif (! $this->currentTokenMatches('RPAREN')) {
                break;
            }
        }

        $this->consumeToken('RPAREN');

        // Optional ON CONFLICT clause after the parentheses
        if ($this->currentTokenMatches('KEYWORD', 'ON')) {
            $this->parseOnConflict();
        }

        // If AUTOINCREMENT was found, mark the PK column as auto_increment
        // We store this info so the caller can apply it to the field
        $result = [
            'type' => 'PRIMARY KEY',
            'name' => 'PRIMARY',
            'columns' => $columns,
        ];

        if ($autoIncrement) {
            $result['autoincrement'] = true;
        }

        return $result;
    }

    private function parseConstraint()
    {
        $this->consumeToken('KEYWORD', 'CONSTRAINT');

        // Constraint name
        $name_token = $this->consumeToken();
        $constraint_name = $name_token->value;

        if ($this->currentTokenMatches('KEYWORD', 'PRIMARY')) {
            $this->consumeToken('KEYWORD', 'PRIMARY');
            $this->consumeToken('KEYWORD', 'KEY');
            $this->consumeToken('LPAREN');

            $columns = [];
            while (! $this->currentTokenMatches('RPAREN')) {
                $col_token = $this->consumeToken();
                if (in_array($col_token->type, ['QUOTED_STRING', 'IDENTIFIER', 'KEYWORD'])) {
                    $columns[] = $col_token->value;
                }
                if ($this->currentTokenMatches('KEYWORD', 'ASC') ||
                    $this->currentTokenMatches('KEYWORD', 'DESC')) {
                    $this->consumeToken();
                }
                if ($this->currentTokenMatches('COMMA')) {
                    $this->consumeToken('COMMA');
                } else {
                    break;
                }
            }
            $this->consumeToken('RPAREN');

            // Optional ON CONFLICT
            if ($this->currentTokenMatches('KEYWORD', 'ON')) {
                $this->parseOnConflict();
            }

            return [
                'type' => 'PRIMARY KEY',
                'name' => $constraint_name,
                'columns' => $columns,
            ];
        } elseif ($this->currentTokenMatches('KEYWORD', 'UNIQUE')) {
            $this->consumeToken('KEYWORD', 'UNIQUE');
            $this->consumeToken('LPAREN');

            $columns = [];
            while (! $this->currentTokenMatches('RPAREN')) {
                $col_token = $this->consumeToken();
                if (in_array($col_token->type, ['QUOTED_STRING', 'IDENTIFIER', 'KEYWORD'])) {
                    $columns[] = $col_token->value;
                }
                if ($this->currentTokenMatches('KEYWORD', 'ASC') ||
                    $this->currentTokenMatches('KEYWORD', 'DESC')) {
                    $this->consumeToken();
                }
                if ($this->currentTokenMatches('COMMA')) {
                    $this->consumeToken('COMMA');
                } else {
                    break;
                }
            }
            $this->consumeToken('RPAREN');

            // Optional ON CONFLICT
            if ($this->currentTokenMatches('KEYWORD', 'ON')) {
                $this->parseOnConflict();
            }

            return [
                'type' => 'UNIQUE',
                'name' => $constraint_name,
                'columns' => $columns,
            ];
        } elseif ($this->currentTokenMatches('KEYWORD', 'FOREIGN')) {
            return $this->parseForeignKeyConstraint($constraint_name);
        } elseif ($this->currentTokenMatches('KEYWORD', 'CHECK')) {
            $this->skipCheckConstraint();
            return null;
        }

        return null;
    }

    private function parseForeignKeyConstraint($constraint_name)
    {
        $this->consumeToken('KEYWORD', 'FOREIGN');
        $this->consumeToken('KEYWORD', 'KEY');

        // Source columns
        $this->consumeToken('LPAREN');
        $source_cols = [];
        while (! $this->currentTokenMatches('RPAREN')) {
            $col_token = $this->consumeToken();
            if (in_array($col_token->type, ['QUOTED_STRING', 'IDENTIFIER', 'KEYWORD'])) {
                $source_cols[] = $col_token->value;
            }
            if ($this->currentTokenMatches('COMMA')) {
                $this->consumeToken('COMMA');
            } else {
                break;
            }
        }
        $this->consumeToken('RPAREN');

        $this->consumeToken('KEYWORD', 'REFERENCES');

        // Reference table
        $ref_table = $this->parseTableName();

        // Reference columns
        $ref_cols = [];
        if ($this->currentTokenMatches('LPAREN')) {
            $this->consumeToken('LPAREN');
            while (! $this->currentTokenMatches('RPAREN')) {
                $col_token = $this->consumeToken();
                if (in_array($col_token->type, ['QUOTED_STRING', 'IDENTIFIER', 'KEYWORD'])) {
                    $ref_cols[] = $col_token->value;
                }
                if ($this->currentTokenMatches('COMMA')) {
                    $this->consumeToken('COMMA');
                } else {
                    break;
                }
            }
            $this->consumeToken('RPAREN');
        }

        // Parse ON DELETE / ON UPDATE actions
        $on_delete = 'NO ACTION';
        $on_update = 'NO ACTION';

        while ($this->currentTokenMatches('KEYWORD', 'ON') ||
               $this->currentTokenMatches('KEYWORD', 'MATCH') ||
               $this->currentTokenMatches('KEYWORD', 'NOT') ||
               $this->currentTokenMatches('KEYWORD', 'DEFERRABLE') ||
               $this->currentTokenMatches('KEYWORD', 'INITIALLY')) {

            if ($this->currentTokenMatches('KEYWORD', 'ON')) {
                $this->consumeToken('KEYWORD', 'ON');

                if ($this->currentTokenMatches('KEYWORD', 'DELETE')) {
                    $this->consumeToken('KEYWORD', 'DELETE');
                    $on_delete = $this->parseReferentialAction();
                } elseif ($this->currentTokenMatches('KEYWORD', 'UPDATE')) {
                    $this->consumeToken('KEYWORD', 'UPDATE');
                    $on_update = $this->parseReferentialAction();
                }
            } elseif ($this->currentTokenMatches('KEYWORD', 'MATCH')) {
                $this->consumeToken('KEYWORD', 'MATCH');
                $this->consumeToken(); // SIMPLE, PARTIAL, FULL
            } elseif ($this->currentTokenMatches('KEYWORD', 'NOT')) {
                $this->consumeToken('KEYWORD', 'NOT');
                // NOT DEFERRABLE
                if ($this->currentToken() && $this->currentToken()->type === 'KEYWORD') {
                    $this->consumeToken();
                }
            } else {
                $this->consumeToken();
            }
        }

        return [
            'type' => 'FOREIGN KEY',
            'name' => $constraint_name,
            'columns' => $source_cols,
            'references' => [
                'table' => $ref_table,
                'columns' => $ref_cols,
            ],
            'on_delete' => $on_delete,
            'on_update' => $on_update,
        ];
    }

    private function parseForeignKeyInline()
    {
        return $this->parseForeignKeyConstraint(null);
    }

    private function parseUniqueConstraint()
    {
        $this->consumeToken('KEYWORD', 'UNIQUE');
        $this->consumeToken('LPAREN');

        $columns = [];
        while (! $this->currentTokenMatches('RPAREN')) {
            $col_token = $this->consumeToken();
            if (in_array($col_token->type, ['QUOTED_STRING', 'IDENTIFIER', 'KEYWORD'])) {
                $columns[] = $col_token->value;
            }
            if ($this->currentTokenMatches('KEYWORD', 'ASC') ||
                $this->currentTokenMatches('KEYWORD', 'DESC')) {
                $this->consumeToken();
            }
            if ($this->currentTokenMatches('COMMA')) {
                $this->consumeToken('COMMA');
            } else {
                break;
            }
        }
        $this->consumeToken('RPAREN');

        // Optional ON CONFLICT
        if ($this->currentTokenMatches('KEYWORD', 'ON')) {
            $this->parseOnConflict();
        }

        return [
            'type' => 'UNIQUE',
            'name' => null,
            'columns' => $columns,
        ];
    }

    private function parseReferentialAction(): string
    {
        if ($this->currentTokenMatches('KEYWORD', 'CASCADE')) {
            $this->consumeToken('KEYWORD', 'CASCADE');
            return 'CASCADE';
        } elseif ($this->currentTokenMatches('KEYWORD', 'RESTRICT')) {
            $this->consumeToken('KEYWORD', 'RESTRICT');
            return 'RESTRICT';
        } elseif ($this->currentTokenMatches('KEYWORD', 'SET')) {
            $this->consumeToken('KEYWORD', 'SET');
            if ($this->currentTokenMatches('KEYWORD', 'NULL')) {
                $this->consumeToken('KEYWORD', 'NULL');
                return 'SET NULL';
            } elseif ($this->currentTokenMatches('KEYWORD', 'DEFAULT')) {
                $this->consumeToken('KEYWORD', 'DEFAULT');
                return 'SET DEFAULT';
            }
        } elseif ($this->currentTokenMatches('KEYWORD', 'NO')) {
            $this->consumeToken('KEYWORD', 'NO');
            $this->consumeToken('KEYWORD', 'ACTION');
            return 'NO ACTION';
        }

        return 'NO ACTION';
    }

    private function parseAlterStatement()
    {
        $this->consumeToken('KEYWORD', 'ALTER');

        // SQLite has limited ALTER TABLE support (ADD COLUMN, RENAME)
        // No ALTER TABLE ADD CONSTRAINT for FK
        if (!$this->currentTokenMatches('KEYWORD', 'TABLE')) {
            $this->skipToSemicolonOrEnd();
            return;
        }

        $this->consumeToken('KEYWORD', 'TABLE');

        // Table name
        $table_name = $this->parseTableName();

        // ALTER TABLE ... ADD COLUMN
        if ($this->currentTokenMatches('KEYWORD', 'ADD')) {
            $this->consumeToken('KEYWORD', 'ADD');

            // Optional COLUMN keyword
            if ($this->currentTokenMatches('KEYWORD', 'COLUMN')) {
                $this->consumeToken('KEYWORD', 'COLUMN');
            }

            // Parse the field definition
            $field = $this->parseFieldDefinition();

            if ($field && isset($this->table_map[$table_name])) {
                // Add field to existing table
                $fieldExists = false;
                foreach ($this->table_map[$table_name]['fields'] as $existingField) {
                    if ($existingField['name'] === $field['name']) {
                        $fieldExists = true;
                        break;
                    }
                }
                if (!$fieldExists) {
                    $this->table_map[$table_name]['fields'][] = $field;
                }
            }
        }

        $this->skipToSemicolonOrEnd();
    }

    private function skipToSemicolonOrEnd()
    {
        while ($this->position < count($this->tokens) &&
               ! $this->currentTokenMatches('SEMICOLON')) {
            $this->position++;
        }

        if ($this->currentTokenMatches('SEMICOLON')) {
            $this->consumeToken('SEMICOLON');
        }
    }
}
