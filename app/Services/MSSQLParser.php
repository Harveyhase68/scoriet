<?php

namespace App\Services;

use Exception;

class MSSQLParser
{
    private $tokens;

    private $position;

    private $tables;

    private $table_map;

    private $sql_text;

    public function parseSQL($sql_text)
    {
        try {
            $tokenizer = new MSSQLTokenizer($sql_text);
            $this->tokens = $tokenizer->tokenize();
            $this->sql_text = $sql_text;
            $this->position = 0;
            $this->tables = [];
            $this->table_map = [];

            return $this->parse();
        } catch (\Exception $e) {
            throw new \Exception('T-SQL Parse Error: '.$e->getMessage());
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
                $this->skipToSemicolonOrEnd();
            } elseif ($this->currentTokenMatches('KEYWORD', 'SET')) {
                // Skip SET ANSI_NULLS ON, SET QUOTED_IDENTIFIER ON, etc.
                $this->skipToSemicolonOrEnd();
            } elseif ($this->currentTokenMatches('KEYWORD', 'USE')) {
                // Skip USE [database]
                $this->skipToSemicolonOrEnd();
            } elseif ($this->currentTokenMatches('KEYWORD', 'EXEC') ||
                       $this->currentTokenMatches('KEYWORD', 'EXECUTE')) {
                $this->skipToSemicolonOrEnd();
            } elseif ($this->currentTokenMatches('KEYWORD', 'PRINT')) {
                $this->skipToSemicolonOrEnd();
            } elseif ($this->currentTokenMatches('KEYWORD', 'IF')) {
                // Skip IF EXISTS (...) or IF NOT EXISTS (...)
                $this->skipToSemicolonOrEnd();
            } elseif ($this->currentTokenMatches('KEYWORD', 'BEGIN')) {
                // Skip BEGIN...END blocks (not CREATE TABLE)
                $this->consumeToken();
            } elseif ($this->currentTokenMatches('KEYWORD', 'END')) {
                $this->consumeToken();
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
                throw new Exception("T-SQL Syntax Error: Expected token '{$expected_type}', but got '{$token->type}' with value '{$token->value}'{$context}");
            }
            if ($expected_value && $token->value !== $expected_value) {
                $context = $this->getErrorContext();
                throw new Exception("T-SQL Syntax Error: Expected '{$expected_value}', but got '{$token->value}'{$context}");
            }
            $this->position++;

            return $token;
        }

        $context = $this->getErrorContext();
        throw new Exception("T-SQL Syntax Error: Unexpected end of SQL script{$context}. Missing semicolon or GO statement?");
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

        // We only care about CREATE TABLE
        if (!$this->currentTokenMatches('KEYWORD', 'TABLE')) {
            // Skip CREATE VIEW, CREATE PROCEDURE, CREATE FUNCTION, CREATE INDEX, etc.
            // Also skip CREATE CLUSTERED INDEX, CREATE NONCLUSTERED INDEX
            $this->skipToSemicolonOrEnd();
            return;
        }

        $this->consumeToken('KEYWORD', 'TABLE');

        // Table name (may include schema: [dbo].[table_name] or dbo.table_name)
        $table_name = $this->parseTableName();

        // Parse table definition
        if (!$this->currentTokenMatches('LPAREN')) {
            $this->skipToSemicolonOrEnd();
            return;
        }

        $this->consumeToken('LPAREN');
        [$fields, $constraints] = $this->parseTableDefinition();
        $this->consumeToken('RPAREN');

        // Skip trailing table options: ON [PRIMARY], TEXTIMAGE_ON [PRIMARY]
        $this->skipTableSuffix();

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

        // Check for schema.table notation (e.g., [dbo].[table] or dbo.table)
        if ($this->currentTokenMatches('DOT')) {
            $this->consumeToken('DOT');
            $table_token = $this->consumeToken();
            $table_name = $table_token->value;

            // Handle three-part names: [database].[schema].[table]
            if ($this->currentTokenMatches('DOT')) {
                $this->consumeToken('DOT');
                $table_token = $this->consumeToken();
                $table_name = $table_token->value;
            }
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
            } elseif ($this->currentTokenMatches('KEYWORD', 'INDEX')) {
                // Inline index definition — skip
                $this->skipToCommaOrRparen();
            } elseif ($this->currentTokenMatches('KEYWORD', 'PERIOD')) {
                // PERIOD FOR SYSTEM_TIME ([ValidFrom], [ValidTo]) — temporal tables
                $this->consumeToken('KEYWORD', 'PERIOD');
                if ($this->currentTokenMatches('KEYWORD', 'FOR')) {
                    $this->consumeToken('KEYWORD', 'FOR');
                }
                if ($this->currentTokenMatches('KEYWORD', 'SYSTEM_TIME')) {
                    $this->consumeToken('KEYWORD', 'SYSTEM_TIME');
                }
                if ($this->currentTokenMatches('LPAREN')) {
                    $this->skipBalancedParens();
                }
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

        // Check for computed column: column_name AS (expression)
        if ($this->currentTokenMatches('KEYWORD', 'AS')) {
            $this->consumeToken('KEYWORD', 'AS');
            // Skip the expression (could be parenthesized or not)
            if ($this->currentTokenMatches('LPAREN')) {
                $this->skipBalancedParens();
            } else {
                // Skip tokens until comma or rparen
                while ($this->currentToken() &&
                       !$this->currentTokenMatches('COMMA') &&
                       !$this->currentTokenMatches('RPAREN')) {
                    // PERSISTED keyword can follow
                    if ($this->currentTokenMatches('KEYWORD', 'PERSISTED')) {
                        $this->consumeToken();
                        break;
                    }
                    $this->consumeToken();
                }
            }
            // Skip PERSISTED if it comes after parens
            if ($this->currentTokenMatches('KEYWORD', 'PERSISTED')) {
                $this->consumeToken();
            }
            // Skip NOT NULL / NULL after computed column
            $computedNullable = true;
            if ($this->currentTokenMatches('KEYWORD', 'NOT')) {
                $this->consumeToken('KEYWORD', 'NOT');
                if ($this->currentTokenMatches('KEYWORD', 'NULL')) {
                    $this->consumeToken('KEYWORD', 'NULL');
                    $computedNullable = false;
                }
            } elseif ($this->currentTokenMatches('KEYWORD', 'NULL')) {
                $this->consumeToken('KEYWORD', 'NULL');
            }
            return [
                'name' => $field_name,
                'type' => 'COMPUTED',
                'unsigned' => false,
                'nullable' => $computedNullable,
                'default' => null,
                'auto_increment' => false,
            ];
        }

        // Data type
        $data_type = $this->parseDataType();

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
                    case 'IDENTITY':
                        $this->consumeToken('KEYWORD', 'IDENTITY');
                        $auto_increment = true;
                        $nullable = false;
                        // Optional (seed, increment)
                        if ($this->currentTokenMatches('LPAREN')) {
                            $this->skipBalancedParens();
                        }
                        break;
                    case 'NOT':
                        $this->consumeToken('KEYWORD', 'NOT');
                        if ($this->currentTokenMatches('KEYWORD', 'NULL')) {
                            $this->consumeToken('KEYWORD', 'NULL');
                            $nullable = false;
                        } elseif ($this->currentTokenMatches('KEYWORD', 'FOR')) {
                            // NOT FOR REPLICATION
                            $this->consumeToken('KEYWORD', 'FOR');
                            $this->consumeToken('KEYWORD', 'REPLICATION');
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
                    case 'CONSTRAINT':
                        // Named inline constraint: CONSTRAINT [DF_xxx] DEFAULT (value)
                        $this->consumeToken('KEYWORD', 'CONSTRAINT');
                        $this->consumeToken(); // constraint name
                        if ($this->currentTokenMatches('KEYWORD', 'DEFAULT')) {
                            $this->consumeToken('KEYWORD', 'DEFAULT');
                            $default_value = $this->parseDefaultValue();
                        } elseif ($this->currentTokenMatches('KEYWORD', 'PRIMARY')) {
                            $this->consumeToken('KEYWORD', 'PRIMARY');
                            $this->consumeToken('KEYWORD', 'KEY');
                            $is_primary_key = true;
                            $nullable = false;
                            // Skip CLUSTERED/NONCLUSTERED
                            if ($this->currentTokenMatches('KEYWORD', 'CLUSTERED') ||
                                $this->currentTokenMatches('KEYWORD', 'NONCLUSTERED')) {
                                $this->consumeToken();
                            }
                        } elseif ($this->currentTokenMatches('KEYWORD', 'UNIQUE')) {
                            $this->consumeToken();
                            // Skip CLUSTERED/NONCLUSTERED
                            if ($this->currentTokenMatches('KEYWORD', 'CLUSTERED') ||
                                $this->currentTokenMatches('KEYWORD', 'NONCLUSTERED')) {
                                $this->consumeToken();
                            }
                        } elseif ($this->currentTokenMatches('KEYWORD', 'CHECK')) {
                            $this->skipCheckConstraint();
                        } elseif ($this->currentTokenMatches('KEYWORD', 'FOREIGN')) {
                            // Skip inline FK — not common but possible
                            $this->skipToCommaOrRparen();
                            return [
                                'name' => $field_name,
                                'type' => $data_type,
                                'unsigned' => false,
                                'nullable' => $nullable,
                                'default' => $default_value,
                                'auto_increment' => $auto_increment,
                            ];
                        }
                        break;
                    case 'PRIMARY':
                        // Inline PRIMARY KEY
                        $this->consumeToken('KEYWORD', 'PRIMARY');
                        $this->consumeToken('KEYWORD', 'KEY');
                        $is_primary_key = true;
                        $nullable = false;
                        // Skip optional CLUSTERED/NONCLUSTERED
                        if ($this->currentTokenMatches('KEYWORD', 'CLUSTERED') ||
                            $this->currentTokenMatches('KEYWORD', 'NONCLUSTERED')) {
                            $this->consumeToken();
                        }
                        break;
                    case 'UNIQUE':
                        $this->consumeToken();
                        // Skip CLUSTERED/NONCLUSTERED
                        if ($this->currentTokenMatches('KEYWORD', 'CLUSTERED') ||
                            $this->currentTokenMatches('KEYWORD', 'NONCLUSTERED')) {
                            $this->consumeToken();
                        }
                        break;
                    case 'REFERENCES':
                        $this->skipInlineReferences();
                        break;
                    case 'CHECK':
                        $this->skipCheckConstraint();
                        break;
                    case 'COLLATE':
                        $this->consumeToken('KEYWORD', 'COLLATE');
                        $this->consumeToken(); // collation name
                        break;
                    case 'ROWGUIDCOL':
                        $this->consumeToken();
                        break;
                    case 'SPARSE':
                        $this->consumeToken();
                        break;
                    case 'GENERATED':
                        // GENERATED ALWAYS AS ROW START / ROW END (temporal tables)
                        $this->consumeToken('KEYWORD', 'GENERATED');
                        if ($this->currentTokenMatches('KEYWORD', 'ALWAYS')) {
                            $this->consumeToken('KEYWORD', 'ALWAYS');
                        }
                        if ($this->currentTokenMatches('KEYWORD', 'AS')) {
                            $this->consumeToken('KEYWORD', 'AS');
                        }
                        if ($this->currentTokenMatches('KEYWORD', 'ROW')) {
                            $this->consumeToken('KEYWORD', 'ROW');
                        }
                        // START or END
                        if ($this->currentTokenMatches('KEYWORD', 'START') ||
                            $this->currentTokenMatches('KEYWORD', 'END')) {
                            $this->consumeToken();
                        }
                        break;
                    case 'MASKED':
                        // MASKED WITH (FUNCTION = '...') — dynamic data masking
                        $this->consumeToken('KEYWORD', 'MASKED');
                        if ($this->currentTokenMatches('KEYWORD', 'WITH')) {
                            $this->consumeToken('KEYWORD', 'WITH');
                            if ($this->currentTokenMatches('LPAREN')) {
                                $this->skipBalancedParens();
                            }
                        }
                        break;
                    case 'WITH':
                        // WITH (options) — skip
                        $this->consumeToken('KEYWORD', 'WITH');
                        if ($this->currentTokenMatches('LPAREN')) {
                            $this->skipBalancedParens();
                        }
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
            'unsigned' => false, // T-SQL doesn't have UNSIGNED
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

        // Handle compound types
        if ($data_type === 'DOUBLE' && $this->currentTokenMatches('KEYWORD', 'PRECISION')) {
            $this->consumeToken('KEYWORD', 'PRECISION');
            $data_type = 'DOUBLE PRECISION';
        } elseif ($data_type === 'CHARACTER' && $this->currentTokenMatches('KEYWORD', 'VARYING')) {
            $this->consumeToken('KEYWORD', 'VARYING');
            $data_type = 'VARCHAR';
        } elseif (($data_type === 'TIME' || $data_type === 'DATETIME2' || $data_type === 'DATETIMEOFFSET')
                  && $this->currentTokenMatches('LPAREN')) {
            // TIME(7), DATETIME2(7), DATETIMEOFFSET(7)
            // Fall through to size parsing below
        }

        // Handle data type with size: VARCHAR(255), NUMERIC(10,2), NVARCHAR(MAX)
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

        // Handle parenthesized defaults: DEFAULT ((0)), DEFAULT (getdate()), DEFAULT (N'value')
        if ($token->type === 'LPAREN') {
            $this->consumeToken('LPAREN');
            $value = '';
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
                    $t = $this->currentToken();
                    if ($t->type === 'QUOTED_STRING') {
                        $value .= "'" . $t->value . "'";
                    } else {
                        $value .= $t->value;
                    }
                }
                $this->consumeToken();
            }
            return $value;
        }

        // Handle keyword defaults
        if ($token->type === 'KEYWORD') {
            $value = $token->value;
            $this->consumeToken();

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
        }

        return null;
    }

    private function skipInlineReferences()
    {
        $this->consumeToken('KEYWORD', 'REFERENCES');
        // Table name (possibly schema-qualified)
        $this->parseTableName();

        // Optional (column list)
        if ($this->currentTokenMatches('LPAREN')) {
            $this->skipBalancedParens();
        }

        // Skip ON DELETE/UPDATE
        while ($this->currentTokenMatches('KEYWORD', 'ON') ||
               $this->currentTokenMatches('KEYWORD', 'NOT')) {
            if ($this->currentTokenMatches('KEYWORD', 'ON')) {
                $this->consumeToken();
                $this->consumeToken(); // DELETE or UPDATE
                $this->parseReferentialAction();
            } else {
                // NOT FOR REPLICATION
                $this->consumeToken('KEYWORD', 'NOT');
                if ($this->currentTokenMatches('KEYWORD', 'FOR')) {
                    $this->consumeToken('KEYWORD', 'FOR');
                    $this->consumeToken('KEYWORD', 'REPLICATION');
                }
            }
        }
    }

    private function skipCheckConstraint()
    {
        if ($this->currentTokenMatches('KEYWORD', 'CHECK')) {
            $this->consumeToken('KEYWORD', 'CHECK');
        }

        // NOT FOR REPLICATION
        if ($this->currentTokenMatches('KEYWORD', 'NOT')) {
            $this->consumeToken('KEYWORD', 'NOT');
            if ($this->currentTokenMatches('KEYWORD', 'FOR')) {
                $this->consumeToken('KEYWORD', 'FOR');
                $this->consumeToken('KEYWORD', 'REPLICATION');
            }
            return;
        }

        if ($this->currentTokenMatches('LPAREN')) {
            $this->skipBalancedParens();
        }
    }

    private function parsePrimaryKey()
    {
        $this->consumeToken('KEYWORD', 'PRIMARY');
        $this->consumeToken('KEYWORD', 'KEY');

        // Optional CLUSTERED/NONCLUSTERED
        if ($this->currentTokenMatches('KEYWORD', 'CLUSTERED') ||
            $this->currentTokenMatches('KEYWORD', 'NONCLUSTERED')) {
            $this->consumeToken();
        }

        $this->consumeToken('LPAREN');

        $columns = [];
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

            if ($this->currentTokenMatches('COMMA')) {
                $this->consumeToken('COMMA');
            } else {
                break;
            }
        }

        $this->consumeToken('RPAREN');

        // Skip WITH (...), ON [PRIMARY]
        $this->skipConstraintSuffix();

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

        if ($this->currentTokenMatches('KEYWORD', 'PRIMARY')) {
            $this->consumeToken('KEYWORD', 'PRIMARY');
            $this->consumeToken('KEYWORD', 'KEY');

            // Optional CLUSTERED/NONCLUSTERED
            if ($this->currentTokenMatches('KEYWORD', 'CLUSTERED') ||
                $this->currentTokenMatches('KEYWORD', 'NONCLUSTERED')) {
                $this->consumeToken();
            }

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

            // Skip WITH (...), ON [PRIMARY]
            $this->skipConstraintSuffix();

            return [
                'type' => 'PRIMARY KEY',
                'name' => $constraint_name,
                'columns' => $columns,
            ];
        } elseif ($this->currentTokenMatches('KEYWORD', 'UNIQUE')) {
            $this->consumeToken('KEYWORD', 'UNIQUE');

            // Optional CLUSTERED/NONCLUSTERED
            if ($this->currentTokenMatches('KEYWORD', 'CLUSTERED') ||
                $this->currentTokenMatches('KEYWORD', 'NONCLUSTERED')) {
                $this->consumeToken();
            }

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

            // Skip WITH (...), ON [PRIMARY]
            $this->skipConstraintSuffix();

            return [
                'type' => 'UNIQUE',
                'name' => $constraint_name,
                'columns' => $columns,
            ];
        } elseif ($this->currentTokenMatches('KEYWORD', 'FOREIGN')) {
            return $this->parseForeignKeyConstraint($constraint_name);
        } elseif ($this->currentTokenMatches('KEYWORD', 'DEFAULT')) {
            // CONSTRAINT [DF_xxx] DEFAULT value — this is a table-level DEFAULT, skip
            $this->consumeToken('KEYWORD', 'DEFAULT');
            $this->parseDefaultValue();
            // FOR column_name
            if ($this->currentTokenMatches('KEYWORD', 'FOR')) {
                $this->consumeToken('KEYWORD', 'FOR');
                $this->consumeToken(); // column name
            }
            return null;
        } elseif ($this->currentTokenMatches('KEYWORD', 'CHECK')) {
            $this->skipCheckConstraint();
            return null;
        }

        // Unknown constraint — skip to comma or rparen
        $this->skipToCommaOrRparen();
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

        // Parse ON DELETE / ON UPDATE actions
        $on_delete = 'NO ACTION';
        $on_update = 'NO ACTION';

        while ($this->currentTokenMatches('KEYWORD', 'ON') ||
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
            } elseif ($this->currentTokenMatches('KEYWORD', 'NOT')) {
                // NOT FOR REPLICATION
                $this->consumeToken('KEYWORD', 'NOT');
                if ($this->currentTokenMatches('KEYWORD', 'FOR')) {
                    $this->consumeToken('KEYWORD', 'FOR');
                    $this->consumeToken('KEYWORD', 'REPLICATION');
                }
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

        // Optional CLUSTERED/NONCLUSTERED
        if ($this->currentTokenMatches('KEYWORD', 'CLUSTERED') ||
            $this->currentTokenMatches('KEYWORD', 'NONCLUSTERED')) {
            $this->consumeToken();
        }

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

        // Skip WITH (...), ON [PRIMARY]
        $this->skipConstraintSuffix();

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

        if (!$this->currentTokenMatches('KEYWORD', 'TABLE')) {
            $this->skipToSemicolonOrEnd();
            return;
        }

        $this->consumeToken('KEYWORD', 'TABLE');

        // Table name
        $table_name = $this->parseTableName();

        // WITH CHECK / WITH NOCHECK
        if ($this->currentTokenMatches('KEYWORD', 'WITH')) {
            $this->consumeToken('KEYWORD', 'WITH');
            if ($this->currentTokenMatches('KEYWORD', 'CHECK') ||
                $this->currentTokenMatches('KEYWORD', 'NOCHECK')) {
                $this->consumeToken();
            }
        }

        // CHECK CONSTRAINT [name] or NOCHECK CONSTRAINT [name] — skip
        if ($this->currentTokenMatches('KEYWORD', 'CHECK') ||
            $this->currentTokenMatches('KEYWORD', 'NOCHECK')) {
            $this->skipToSemicolonOrEnd();
            return;
        }

        if (!$this->currentTokenMatches('KEYWORD', 'ADD')) {
            $this->skipToSemicolonOrEnd();
            return;
        }

        $this->consumeToken('KEYWORD', 'ADD');

        // Multiple constraints can follow in one ALTER TABLE ... ADD
        while ($this->currentToken() &&
               !$this->currentTokenMatches('SEMICOLON')) {

            if ($this->currentTokenMatches('KEYWORD', 'CONSTRAINT')) {
                $this->consumeToken('KEYWORD', 'CONSTRAINT');
                $constraint_name_token = $this->consumeToken();
                $constraint_name = $constraint_name_token->value;

                if ($this->currentTokenMatches('KEYWORD', 'FOREIGN')) {
                    $fk = $this->parseForeignKeyConstraint($constraint_name);

                    if ($fk && isset($this->table_map[$table_name])) {
                        $this->table_map[$table_name]['constraints'][] = $fk;
                    }
                } elseif ($this->currentTokenMatches('KEYWORD', 'PRIMARY')) {
                    $this->consumeToken('KEYWORD', 'PRIMARY');
                    $this->consumeToken('KEYWORD', 'KEY');

                    if ($this->currentTokenMatches('KEYWORD', 'CLUSTERED') ||
                        $this->currentTokenMatches('KEYWORD', 'NONCLUSTERED')) {
                        $this->consumeToken();
                    }

                    $this->consumeToken('LPAREN');
                    $columns = [];
                    while (!$this->currentTokenMatches('RPAREN')) {
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
                    $this->skipConstraintSuffix();

                    if (isset($this->table_map[$table_name])) {
                        $this->table_map[$table_name]['constraints'][] = [
                            'type' => 'PRIMARY KEY',
                            'name' => $constraint_name,
                            'columns' => $columns,
                        ];
                    }
                } elseif ($this->currentTokenMatches('KEYWORD', 'UNIQUE')) {
                    $this->consumeToken('KEYWORD', 'UNIQUE');

                    if ($this->currentTokenMatches('KEYWORD', 'CLUSTERED') ||
                        $this->currentTokenMatches('KEYWORD', 'NONCLUSTERED')) {
                        $this->consumeToken();
                    }

                    $this->consumeToken('LPAREN');
                    $columns = [];
                    while (!$this->currentTokenMatches('RPAREN')) {
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
                    $this->skipConstraintSuffix();

                    if (isset($this->table_map[$table_name])) {
                        $this->table_map[$table_name]['constraints'][] = [
                            'type' => 'UNIQUE',
                            'name' => $constraint_name,
                            'columns' => $columns,
                        ];
                    }
                } elseif ($this->currentTokenMatches('KEYWORD', 'DEFAULT')) {
                    $this->consumeToken('KEYWORD', 'DEFAULT');
                    $this->parseDefaultValue();
                    if ($this->currentTokenMatches('KEYWORD', 'FOR')) {
                        $this->consumeToken('KEYWORD', 'FOR');
                        $this->consumeToken(); // column name
                    }
                } elseif ($this->currentTokenMatches('KEYWORD', 'CHECK')) {
                    $this->skipCheckConstraint();
                } else {
                    // Unknown constraint type — skip to next comma or semicolon
                    $this->skipToCommaOrRparen();
                }
            } elseif ($this->currentTokenMatches('KEYWORD', 'PRIMARY')) {
                // ADD PRIMARY KEY without CONSTRAINT name
                $pk = $this->parsePrimaryKey();
                if ($pk && isset($this->table_map[$table_name])) {
                    $this->table_map[$table_name]['constraints'][] = $pk;
                }
            } elseif ($this->currentTokenMatches('KEYWORD', 'FOREIGN')) {
                $fk = $this->parseForeignKeyInline();
                if ($fk && isset($this->table_map[$table_name])) {
                    $this->table_map[$table_name]['constraints'][] = $fk;
                }
            } else {
                break;
            }

            // Multiple constraints can be separated by commas
            if ($this->currentTokenMatches('COMMA')) {
                $this->consumeToken('COMMA');
            } else {
                break;
            }
        }

        $this->skipToSemicolonOrEnd();
    }

    /**
     * Skip WITH (...) and ON [PRIMARY] / TEXTIMAGE_ON [PRIMARY] after constraints
     */
    private function skipConstraintSuffix()
    {
        while ($this->currentToken()) {
            if ($this->currentTokenMatches('KEYWORD', 'WITH')) {
                $this->consumeToken('KEYWORD', 'WITH');
                if ($this->currentTokenMatches('LPAREN')) {
                    $this->skipBalancedParens();
                }
            } elseif ($this->currentTokenMatches('KEYWORD', 'ON')) {
                $this->consumeToken('KEYWORD', 'ON');
                $this->consumeToken(); // [PRIMARY] or filegroup name
            } else {
                break;
            }
        }
    }

    /**
     * Skip trailing table options after CREATE TABLE: ON [PRIMARY], TEXTIMAGE_ON [PRIMARY]
     */
    private function skipTableSuffix()
    {
        while ($this->currentToken() &&
               !$this->currentTokenMatches('SEMICOLON')) {
            if ($this->currentTokenMatches('KEYWORD', 'ON')) {
                $this->consumeToken('KEYWORD', 'ON');
                $this->consumeToken(); // [PRIMARY] or filegroup name
            } elseif ($this->currentTokenMatches('KEYWORD', 'TEXTIMAGE_ON')) {
                $this->consumeToken('KEYWORD', 'TEXTIMAGE_ON');
                $this->consumeToken(); // [PRIMARY]
            } elseif ($this->currentTokenMatches('KEYWORD', 'WITH')) {
                $this->consumeToken('KEYWORD', 'WITH');
                if ($this->currentTokenMatches('LPAREN')) {
                    $this->skipBalancedParens();
                }
            } else {
                break;
            }
        }

        // Consume trailing semicolon/GO if present
        if ($this->currentTokenMatches('SEMICOLON')) {
            $this->consumeToken('SEMICOLON');
        }
    }

    private function skipBalancedParens()
    {
        if (!$this->currentTokenMatches('LPAREN')) {
            return;
        }

        $this->consumeToken('LPAREN');
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
