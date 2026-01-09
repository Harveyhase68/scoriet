<?php

namespace App\Services;

use Exception;

class PostgreSQLParser
{
    private $tokens;

    private $position;

    private $tables;

    private $table_map;

    private $sql_text;

    public function parseSQL($sql_text)
    {
        try {
            $tokenizer = new PostgreSQLTokenizer($sql_text);
            $this->tokens = $tokenizer->tokenize();
            $this->sql_text = $sql_text;
            $this->position = 0;
            $this->tables = [];
            $this->table_map = [];

            return $this->parse();
        } catch (\Exception $e) {
            throw new \Exception('PostgreSQL Parse Error: '.$e->getMessage());
        }
    }

    private function parse()
    {
        while ($this->position < count($this->tokens)) {
            if ($this->currentTokenMatches('KEYWORD', 'CREATE')) {
                $this->parseCreateStatement();
            } elseif ($this->currentTokenMatches('KEYWORD', 'ALTER')) {
                $this->parseAlterStatement();
            } elseif ($this->currentTokenMatches('KEYWORD', 'DROP')) {
                $this->parseDropStatement();
            } elseif ($this->currentTokenMatches('KEYWORD', 'COMMENT')) {
                // Skip COMMENT ON statements
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
                throw new Exception("PostgreSQL Syntax Error: Expected token '{$expected_type}', but got '{$token->type}' with value '{$token->value}'{$context}");
            }
            if ($expected_value && $token->value !== $expected_value) {
                $context = $this->getErrorContext();
                throw new Exception("PostgreSQL Syntax Error: Expected '{$expected_value}', but got '{$token->value}'{$context}");
            }
            $this->position++;

            return $token;
        }

        $context = $this->getErrorContext();
        throw new Exception("PostgreSQL Syntax Error: Unexpected end of SQL script{$context}. Missing semicolon or incomplete statement?");
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

        // Get surrounding tokens for context
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

        // Calculate approximate line and character position
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

        // Skip optional keywords: TEMPORARY, TEMP, UNLOGGED
        while ($this->currentTokenMatches('KEYWORD', 'TEMPORARY') ||
               $this->currentTokenMatches('KEYWORD', 'TEMP') ||
               $this->currentTokenMatches('KEYWORD', 'UNLOGGED')) {
            $this->consumeToken();
        }

        // Check what comes after CREATE
        $nextToken = $this->currentToken();

        // We only care about CREATE TABLE - skip everything else (SEQUENCE, TYPE, FUNCTION, etc.)
        if (!$nextToken || !$this->currentTokenMatches('KEYWORD', 'TABLE')) {
            $this->skipToSemicolonOrEnd();
            return;
        }

        $this->consumeToken('KEYWORD', 'TABLE');

        // Optional IF NOT EXISTS
        if ($this->currentTokenMatches('KEYWORD', 'IF')) {
            $this->consumeToken('KEYWORD', 'IF');
            $this->consumeToken('KEYWORD', 'NOT');
            $this->consumeToken('KEYWORD', 'EXISTS');
        }

        // Table name (may include schema: schema.table_name)
        $table_name = $this->parseTableName();

        // Parse table definition
        $this->consumeToken('LPAREN');
        [$fields, $constraints] = $this->parseTableDefinition();
        $this->consumeToken('RPAREN');

        // Skip table options (INHERITS, PARTITION BY, WITH, TABLESPACE, etc.)
        $this->skipToSemicolonOrEnd();

        $table = [
            'table_name' => $table_name,
            'fields' => $fields,
            'constraints' => $constraints,
        ];

        \Log::info("[PG-Parser] CREATE TABLE parsed", [
            'table_name' => $table_name,
            'fields_count' => count($fields),
            'constraints_count' => count($constraints),
        ]);

        // Check if table already exists - merge instead of duplicate
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
            \Log::info("[PG-Parser] Table added to table_map with key: '{$table_name}'");
        }
    }

    private function parseTableName()
    {
        $name_token = $this->consumeToken();
        $table_name = $name_token->value;

        // Check for schema.table notation (e.g., "public"."addresses" or public.addresses)
        if ($this->currentTokenMatches('DOT')) {
            // Skip the dot - we only want the table name, not schema
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
                // Skip CHECK constraints for now
                $this->skipCheckConstraint();
            } elseif ($this->currentTokenMatches('KEYWORD', 'EXCLUDE')) {
                // Skip EXCLUDE constraints
                $this->skipToCommaOrRparen();
            } elseif ($this->currentTokenMatches('KEYWORD', 'FOREIGN')) {
                $constraints[] = $this->parseForeignKeyInline();
            } else {
                $fields[] = $this->parseFieldDefinition();
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
        if ($field_name_token->type === 'QUOTED_STRING') {
            $field_name = $field_name_token->value;
        } elseif ($field_name_token->type === 'IDENTIFIER') {
            $field_name = $field_name_token->value;
        } elseif ($field_name_token->type === 'KEYWORD') {
            // Sometimes keywords are used as field names
            $field_name = $field_name_token->value;
        } else {
            throw new Exception("Expected field name, got {$field_name_token->type}");
        }

        // Data type
        $data_type = $this->parseDataType();

        // Parse field attributes
        $auto_increment = false;
        $nullable = true;
        $default_value = null;
        $is_primary_key = false;

        // Check if data type implies auto_increment
        $upperType = strtoupper($data_type);
        if (in_array($upperType, ['SERIAL', 'BIGSERIAL', 'SMALLSERIAL'])) {
            $auto_increment = true;
            $nullable = false;
            // Normalize serial types to their integer equivalents for display
            if ($upperType === 'SERIAL') {
                $data_type = 'INTEGER';
            } elseif ($upperType === 'BIGSERIAL') {
                $data_type = 'BIGINT';
            } elseif ($upperType === 'SMALLSERIAL') {
                $data_type = 'SMALLINT';
            }
        }

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
                        break;
                    case 'UNIQUE':
                        $this->consumeToken();
                        break;
                    case 'REFERENCES':
                        // Inline foreign key reference - skip for now
                        $this->skipInlineReferences();
                        break;
                    case 'GENERATED':
                        // GENERATED ALWAYS AS IDENTITY or GENERATED BY DEFAULT AS IDENTITY
                        $this->parseGeneratedIdentity();
                        $auto_increment = true;
                        $nullable = false;
                        break;
                    case 'CHECK':
                        // Skip CHECK constraint
                        $this->skipCheckConstraint();
                        break;
                    case 'COLLATE':
                        $this->consumeToken('KEYWORD', 'COLLATE');
                        $this->consumeToken(); // collation name (e.g., "pg_catalog")
                        // Handle schema.collation notation (e.g., "pg_catalog"."default")
                        if ($this->currentTokenMatches('DOT')) {
                            $this->consumeToken('DOT');
                            $this->consumeToken(); // actual collation name
                        }
                        break;
                    case 'CONSTRAINT':
                        // Named inline constraint - skip
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

        $field = [
            'name' => $field_name,
            'type' => $data_type,
            'unsigned' => false, // PostgreSQL doesn't have UNSIGNED
            'nullable' => $nullable,
            'default' => $default_value,
            'auto_increment' => $auto_increment,
        ];

        if ($is_primary_key) {
            $field['primary_key'] = true;
        }

        return $field;
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
        } elseif ($data_type === 'TIME' || $data_type === 'TIMESTAMP') {
            // Handle TIME/TIMESTAMP WITH/WITHOUT TIME ZONE
            if ($this->currentTokenMatches('KEYWORD', 'WITH') ||
                $this->currentTokenMatches('KEYWORD', 'WITHOUT')) {
                $withWithout = $this->consumeToken()->value;
                if ($this->currentTokenMatches('KEYWORD', 'TIME')) {
                    $this->consumeToken('KEYWORD', 'TIME');
                    $this->consumeToken('KEYWORD', 'ZONE');
                    if ($withWithout === 'WITH') {
                        $data_type = $data_type === 'TIMESTAMP' ? 'TIMESTAMPTZ' : 'TIMETZ';
                    }
                }
            }
        } elseif ($data_type === 'BIT' && $this->currentTokenMatches('KEYWORD', 'VARYING')) {
            $this->consumeToken('KEYWORD', 'VARYING');
            $data_type = 'VARBIT';
        }

        // Handle data type with size (e.g., VARCHAR(255), NUMERIC(10,2))
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

        // Handle array notation []
        while ($this->currentTokenMatches('LBRACKET')) {
            $this->consumeToken('LBRACKET');
            // Optional array size
            if ($this->currentTokenMatches('NUMBER')) {
                $this->consumeToken('NUMBER');
            }
            $this->consumeToken('RBRACKET');
            $data_type .= '[]';
        }

        return $data_type;
    }

    private function parseDefaultValue()
    {
        $token = $this->currentToken();

        if (!$token) {
            return null;
        }

        // Handle function calls like NOW(), CURRENT_TIMESTAMP, etc.
        if ($token->type === 'KEYWORD') {
            $value = $token->value;
            $this->consumeToken();

            // Check for function call with parentheses
            if ($this->currentTokenMatches('LPAREN')) {
                $this->consumeToken('LPAREN');
                $value .= '(';
                // Consume any arguments
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

            // Handle type cast ::
            if ($this->currentTokenMatches('TYPECAST')) {
                $this->consumeToken('TYPECAST');
                $castType = $this->parseDataType();
                $value .= '::' . $castType;
            }

            return $value;
        }

        return null;
    }

    private function parseGeneratedIdentity()
    {
        $this->consumeToken('KEYWORD', 'GENERATED');

        // ALWAYS or BY DEFAULT
        if ($this->currentTokenMatches('KEYWORD', 'ALWAYS')) {
            $this->consumeToken('KEYWORD', 'ALWAYS');
        } elseif ($this->currentTokenMatches('KEYWORD', 'BY')) {
            $this->consumeToken('KEYWORD', 'BY');
            $this->consumeToken('KEYWORD', 'DEFAULT');
        }

        $this->consumeToken('KEYWORD', 'AS');
        $this->consumeToken('KEYWORD', 'IDENTITY');

        // Optional sequence options in parentheses
        if ($this->currentTokenMatches('LPAREN')) {
            $this->consumeToken('LPAREN');
            // Skip sequence options
            $depth = 1;
            while ($depth > 0 && $this->currentToken()) {
                if ($this->currentTokenMatches('LPAREN')) {
                    $depth++;
                } elseif ($this->currentTokenMatches('RPAREN')) {
                    $depth--;
                }
                $this->consumeToken();
            }
        }
    }

    private function skipInlineReferences()
    {
        $this->consumeToken('KEYWORD', 'REFERENCES');
        $this->consumeToken(); // table name

        // Optional column list
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
               $this->currentTokenMatches('KEYWORD', 'DEFERRABLE') ||
               $this->currentTokenMatches('KEYWORD', 'INITIALLY') ||
               $this->currentTokenMatches('KEYWORD', 'NOT')) {

            if ($this->currentTokenMatches('KEYWORD', 'ON')) {
                $this->consumeToken();
                $this->consumeToken(); // DELETE or UPDATE
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
        while (! $this->currentTokenMatches('RPAREN')) {
            $col_token = $this->consumeToken();
            if (in_array($col_token->type, ['QUOTED_STRING', 'IDENTIFIER', 'KEYWORD'])) {
                $columns[] = $col_token->value;
            }

            if ($this->currentTokenMatches('COMMA')) {
                $this->consumeToken('COMMA');
            } else {
                break;
            }
        }

        $this->consumeToken('RPAREN');

        return [
            'type' => 'PRIMARY KEY',
            'name' => 'PRIMARY',
            'columns' => $columns,
        ];
    }

    private function parseConstraint()
    {
        $this->consumeToken('KEYWORD', 'CONSTRAINT');

        // Constraint name
        $name_token = $this->consumeToken();
        $constraint_name = $name_token->value;

        // What type of constraint?
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
                if ($this->currentTokenMatches('COMMA')) {
                    $this->consumeToken('COMMA');
                } else {
                    break;
                }
            }
            $this->consumeToken('RPAREN');

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
                if ($this->currentTokenMatches('COMMA')) {
                    $this->consumeToken('COMMA');
                } else {
                    break;
                }
            }
            $this->consumeToken('RPAREN');

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
        } elseif ($this->currentTokenMatches('KEYWORD', 'EXCLUDE')) {
            $this->skipToCommaOrRparen();
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

        // Reference table (may include schema)
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

        // Parse ON DELETE and ON UPDATE actions
        $on_delete = 'NO ACTION';
        $on_update = 'NO ACTION';

        while ($this->currentTokenMatches('KEYWORD', 'ON') ||
               $this->currentTokenMatches('KEYWORD', 'MATCH') ||
               $this->currentTokenMatches('KEYWORD', 'DEFERRABLE') ||
               $this->currentTokenMatches('KEYWORD', 'INITIALLY') ||
               $this->currentTokenMatches('KEYWORD', 'NOT')) {

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
                $this->consumeToken(); // FULL, PARTIAL, or SIMPLE
            } elseif ($this->currentTokenMatches('KEYWORD', 'NOT')) {
                $this->consumeToken('KEYWORD', 'NOT');
                $this->consumeToken('KEYWORD', 'DEFERRABLE');
            } elseif ($this->currentTokenMatches('KEYWORD', 'DEFERRABLE')) {
                $this->consumeToken('KEYWORD', 'DEFERRABLE');
            } elseif ($this->currentTokenMatches('KEYWORD', 'INITIALLY')) {
                $this->consumeToken('KEYWORD', 'INITIALLY');
                $this->consumeToken(); // DEFERRED or IMMEDIATE
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

        // Parse referential actions
        $on_delete = 'NO ACTION';
        $on_update = 'NO ACTION';

        while ($this->currentTokenMatches('KEYWORD', 'ON') ||
               $this->currentTokenMatches('KEYWORD', 'MATCH') ||
               $this->currentTokenMatches('KEYWORD', 'DEFERRABLE') ||
               $this->currentTokenMatches('KEYWORD', 'INITIALLY') ||
               $this->currentTokenMatches('KEYWORD', 'NOT')) {

            if ($this->currentTokenMatches('KEYWORD', 'ON')) {
                $this->consumeToken('KEYWORD', 'ON');

                if ($this->currentTokenMatches('KEYWORD', 'DELETE')) {
                    $this->consumeToken('KEYWORD', 'DELETE');
                    $on_delete = $this->parseReferentialAction();
                } elseif ($this->currentTokenMatches('KEYWORD', 'UPDATE')) {
                    $this->consumeToken('KEYWORD', 'UPDATE');
                    $on_update = $this->parseReferentialAction();
                }
            } else {
                $this->consumeToken();
            }
        }

        return [
            'type' => 'FOREIGN KEY',
            'name' => null,
            'columns' => $source_cols,
            'references' => [
                'table' => $ref_table,
                'columns' => $ref_cols,
            ],
            'on_delete' => $on_delete,
            'on_update' => $on_update,
        ];
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

            if ($this->currentTokenMatches('COMMA')) {
                $this->consumeToken('COMMA');
            } else {
                break;
            }
        }

        $this->consumeToken('RPAREN');

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

        // We only care about ALTER TABLE
        if (!$this->currentTokenMatches('KEYWORD', 'TABLE')) {
            $this->skipToSemicolonOrEnd();
            return;
        }

        $this->consumeToken('KEYWORD', 'TABLE');

        // Optional IF EXISTS
        if ($this->currentTokenMatches('KEYWORD', 'IF')) {
            $this->consumeToken('KEYWORD', 'IF');
            $this->consumeToken('KEYWORD', 'EXISTS');
        }

        // Optional ONLY
        if ($this->currentTokenMatches('KEYWORD', 'ONLY')) {
            $this->consumeToken('KEYWORD', 'ONLY');
        }

        // Table name
        $table_name = $this->parseTableName();

        // Check if this is ADD CONSTRAINT
        if (!$this->currentTokenMatches('KEYWORD', 'ADD')) {
            $this->skipToSemicolonOrEnd();
            return;
        }

        $this->consumeToken('KEYWORD', 'ADD');

        // Check if it's ADD CONSTRAINT
        if (!$this->currentTokenMatches('KEYWORD', 'CONSTRAINT')) {
            $this->skipToSemicolonOrEnd();
            return;
        }

        $this->consumeToken('KEYWORD', 'CONSTRAINT');

        // Constraint name
        $constraint_name_token = $this->consumeToken();
        $constraint_name = $constraint_name_token->value;

        // Only handle FOREIGN KEY constraints
        if (!$this->currentTokenMatches('KEYWORD', 'FOREIGN')) {
            $this->skipToSemicolonOrEnd();
            return;
        }

        $fk = $this->parseForeignKeyConstraint($constraint_name);

        \Log::info("[PG-Parser] ALTER TABLE ADD CONSTRAINT", [
            'table_name' => $table_name,
            'constraint_name' => $constraint_name,
            'fk' => $fk,
            'table_exists_in_map' => isset($this->table_map[$table_name]),
            'table_map_keys' => array_keys($this->table_map),
        ]);

        if ($fk && isset($this->table_map[$table_name])) {
            $this->table_map[$table_name]['constraints'][] = $fk;
            \Log::info("[PG-Parser] FK added to table {$table_name}");
        } else {
            \Log::warning("[PG-Parser] FK NOT added - table '{$table_name}' not in table_map");
        }

        $this->skipToSemicolonOrEnd();
    }

    private function parseDropStatement()
    {
        $this->consumeToken('KEYWORD', 'DROP');

        // Skip all DROP statements
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

    private function skipToCommaOrRparen()
    {
        $depth = 0;
        while ($this->currentToken()) {
            if ($this->currentTokenMatches('LPAREN')) {
                $depth++;
                $this->consumeToken();
            } elseif ($this->currentTokenMatches('RPAREN')) {
                if ($depth === 0) {
                    break;
                }
                $depth--;
                $this->consumeToken();
            } elseif ($this->currentTokenMatches('COMMA') && $depth === 0) {
                break;
            } else {
                $this->consumeToken();
            }
        }
    }
}
