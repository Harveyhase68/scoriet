<?php

namespace App\Services;

use Exception;

class FirebirdParser
{
    private $tokens;

    private $position;

    private $tables;

    private $table_map;

    private $sql_text;

    /** @var array<string, bool> Map of generator/sequence names */
    private $generators;

    /** @var array<string, array{type: string, default: ?string, nullable: bool}> Domain definitions */
    private $domains;

    /** @var array<string, string> Map of table.field => generator name (from trigger analysis) */
    private $autoIncrementFields;

    public function parseSQL($sql_text)
    {
        try {
            $tokenizer = new FirebirdTokenizer($sql_text);
            $this->tokens = $tokenizer->tokenize();
            $this->sql_text = $sql_text;
            $this->position = 0;
            $this->tables = [];
            $this->table_map = [];
            $this->generators = [];
            $this->domains = [];
            $this->autoIncrementFields = [];

            // Two-pass approach:
            // Pass 1: Collect generators, domains, and detect auto-increment triggers
            // Pass 2: Parse CREATE TABLE statements and apply auto-increment info
            $this->firstPass();

            $this->position = 0;
            $this->secondPass();

            // Apply auto-increment detection from triggers
            $this->applyAutoIncrementFromTriggers();

            return $this->tables;
        } catch (\Exception $e) {
            throw new \Exception('Firebird Parse Error: '.$e->getMessage());
        }
    }

    /**
     * First pass: Collect generators, domains, and auto-increment triggers
     */
    private function firstPass()
    {
        while ($this->position < count($this->tokens)) {
            if ($this->currentTokenMatches('KEYWORD', 'CREATE')) {
                $savedPos = $this->position;
                $this->consumeToken('KEYWORD', 'CREATE');

                // Handle CREATE OR ALTER / CREATE OR REPLACE
                if ($this->currentTokenMatches('KEYWORD', 'OR')) {
                    $this->consumeToken('KEYWORD', 'OR');
                    $this->consumeToken(); // ALTER or REPLACE
                }

                if ($this->currentTokenMatches('KEYWORD', 'GENERATOR')) {
                    $this->consumeToken('KEYWORD', 'GENERATOR');
                    $genName = $this->consumeToken()->value;
                    $this->generators[$genName] = true;
                    $this->skipToSemicolonOrEnd();
                } elseif ($this->currentTokenMatches('KEYWORD', 'SEQUENCE')) {
                    $this->consumeToken('KEYWORD', 'SEQUENCE');
                    $seqName = $this->consumeToken()->value;
                    $this->generators[$seqName] = true;
                    $this->skipToSemicolonOrEnd();
                } elseif ($this->currentTokenMatches('KEYWORD', 'DOMAIN')) {
                    $this->parseDomainDefinition();
                } elseif ($this->currentTokenMatches('KEYWORD', 'TRIGGER')) {
                    $this->parseTriggerForAutoIncrement();
                } else {
                    $this->skipToSemicolonOrEnd();
                }
            } elseif ($this->currentTokenMatches('KEYWORD', 'SET')) {
                $savedPos = $this->position;
                $this->consumeToken('KEYWORD', 'SET');
                if ($this->currentTokenMatches('KEYWORD', 'GENERATOR')) {
                    // SET GENERATOR name TO value — skip
                    $this->skipToSemicolonOrEnd();
                } else {
                    $this->skipToSemicolonOrEnd();
                }
            } elseif ($this->currentTokenMatches('KEYWORD', 'RECREATE')) {
                // RECREATE treated like CREATE in first pass — skip
                $this->skipToSemicolonOrEnd();
            } else {
                $this->position++;
            }
        }
    }

    /**
     * Parse CREATE DOMAIN definitions
     */
    private function parseDomainDefinition()
    {
        $this->consumeToken('KEYWORD', 'DOMAIN');
        $domainName = $this->consumeToken()->value;

        $this->consumeToken('KEYWORD', 'AS');

        // Parse data type
        $data_type = $this->parseDataType();

        $default_value = null;
        $nullable = true;

        // Parse optional DEFAULT, NOT NULL, CHECK
        while ($this->currentToken() && !$this->currentTokenMatches('SEMICOLON')) {
            if ($this->currentTokenMatches('KEYWORD', 'DEFAULT')) {
                $this->consumeToken('KEYWORD', 'DEFAULT');
                $default_value = $this->parseDefaultValue();
            } elseif ($this->currentTokenMatches('KEYWORD', 'NOT')) {
                $this->consumeToken('KEYWORD', 'NOT');
                if ($this->currentTokenMatches('KEYWORD', 'NULL')) {
                    $this->consumeToken('KEYWORD', 'NULL');
                    $nullable = false;
                }
            } elseif ($this->currentTokenMatches('KEYWORD', 'CHECK')) {
                $this->skipCheckConstraint();
            } elseif ($this->currentTokenMatches('KEYWORD', 'COLLATE')) {
                $this->consumeToken('KEYWORD', 'COLLATE');
                $this->consumeToken(); // collation name
            } elseif ($this->currentTokenMatches('KEYWORD', 'CHARACTER')) {
                $this->consumeToken('KEYWORD', 'CHARACTER');
                $this->consumeToken('KEYWORD', 'SET');
                $this->consumeToken(); // charset name
            } else {
                break;
            }
        }

        $this->domains[$domainName] = [
            'type' => $data_type,
            'default' => $default_value,
            'nullable' => $nullable,
        ];

        $this->skipToSemicolonOrEnd();
    }

    /**
     * Parse trigger body to detect auto-increment patterns:
     * - GEN_ID(generator_name, 1)
     * - NEXT VALUE FOR sequence_name
     */
    private function parseTriggerForAutoIncrement()
    {
        $this->consumeToken('KEYWORD', 'TRIGGER');

        $triggerName = $this->consumeToken()->value;

        // FOR table_name
        if (!$this->currentTokenMatches('KEYWORD', 'FOR')) {
            $this->skipToSemicolonOrEnd();
            return;
        }
        $this->consumeToken('KEYWORD', 'FOR');
        $tableName = $this->consumeToken()->value;

        // Check for ACTIVE BEFORE INSERT
        $isBefore = false;
        $isInsert = false;

        while ($this->currentToken() && !$this->currentTokenMatches('KEYWORD', 'AS')) {
            if ($this->currentTokenMatches('KEYWORD', 'BEFORE')) {
                $isBefore = true;
            } elseif ($this->currentTokenMatches('KEYWORD', 'INSERT')) {
                $isInsert = true;
            }
            $this->consumeToken();
        }

        if (!$isBefore || !$isInsert) {
            $this->skipToSemicolonOrEnd();
            return;
        }

        // Skip AS keyword
        if ($this->currentTokenMatches('KEYWORD', 'AS')) {
            $this->consumeToken('KEYWORD', 'AS');
        }

        // Now scan the trigger body for patterns:
        // NEW.field_name = GEN_ID(generator, 1)
        // NEW.field_name = NEXT VALUE FOR sequence
        while ($this->currentToken() && !$this->currentTokenMatches('SEMICOLON')) {
            if ($this->currentTokenMatches('KEYWORD', 'NEW')) {
                $savedPos = $this->position;
                $this->consumeToken('KEYWORD', 'NEW');

                if ($this->currentTokenMatches('DOT')) {
                    $this->consumeToken('DOT');
                    $fieldToken = $this->consumeToken();
                    $fieldName = $fieldToken->value;

                    // Look for = GEN_ID(...) or = NEXT VALUE FOR
                    if ($this->currentTokenMatches('EQUALS')) {
                        $this->consumeToken('EQUALS');

                        if ($this->currentTokenMatches('KEYWORD', 'GEN_ID')) {
                            // GEN_ID(generator_name, increment)
                            $this->autoIncrementFields[$tableName . '.' . $fieldName] = true;
                        } elseif ($this->currentTokenMatches('KEYWORD', 'NEXT')) {
                            // NEXT VALUE FOR sequence_name
                            $this->autoIncrementFields[$tableName . '.' . $fieldName] = true;
                        }
                    }
                }
            }
            $this->position++;
        }

        // Consume the terminator
        if ($this->currentTokenMatches('SEMICOLON')) {
            $this->consumeToken('SEMICOLON');
        }
    }

    /**
     * Second pass: Parse CREATE TABLE / RECREATE TABLE and ALTER TABLE
     */
    private function secondPass()
    {
        while ($this->position < count($this->tokens)) {
            if ($this->currentTokenMatches('KEYWORD', 'CREATE')) {
                $this->parseCreateStatement();
            } elseif ($this->currentTokenMatches('KEYWORD', 'RECREATE')) {
                // RECREATE TABLE = DROP + CREATE
                $this->consumeToken('KEYWORD', 'RECREATE');
                if ($this->currentTokenMatches('KEYWORD', 'TABLE')) {
                    $this->position--; // Back up so parseCreateTable works
                    // Fake a CREATE token position
                    $this->parseCreateTable();
                } else {
                    $this->skipToSemicolonOrEnd();
                }
            } elseif ($this->currentTokenMatches('KEYWORD', 'ALTER')) {
                $this->parseAlterStatement();
            } elseif ($this->currentTokenMatches('KEYWORD', 'DROP')) {
                $this->skipToSemicolonOrEnd();
            } else {
                $this->position++;
            }
        }
    }

    private function parseCreateStatement()
    {
        $this->consumeToken('KEYWORD', 'CREATE');

        // Handle CREATE OR ALTER / CREATE OR REPLACE
        if ($this->currentTokenMatches('KEYWORD', 'OR')) {
            $this->consumeToken('KEYWORD', 'OR');
            $this->consumeToken(); // ALTER or REPLACE
        }

        if ($this->currentTokenMatches('KEYWORD', 'TABLE')) {
            $this->parseCreateTable();
        } else {
            // Skip CREATE GENERATOR, CREATE SEQUENCE, CREATE TRIGGER, CREATE VIEW, etc.
            $this->skipToSemicolonOrEnd();
        }
    }

    private function parseCreateTable()
    {
        $this->consumeToken('KEYWORD', 'TABLE');

        // Table name
        $table_name = $this->parseTableName();

        // EXTERNAL FILE 'path' — skip
        if ($this->currentTokenMatches('KEYWORD', 'EXTERNAL')) {
            $this->skipToSemicolonOrEnd();
            return;
        }

        if (!$this->currentTokenMatches('LPAREN')) {
            $this->skipToSemicolonOrEnd();
            return;
        }

        $this->consumeToken('LPAREN');
        [$fields, $constraints] = $this->parseTableDefinition();
        $this->consumeToken('RPAREN');

        $this->skipToSemicolonOrEnd();

        $table = [
            'table_name' => $table_name,
            'fields' => $fields,
            'constraints' => $constraints,
        ];

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

    /**
     * Apply auto-increment flags detected from triggers in the first pass
     */
    private function applyAutoIncrementFromTriggers()
    {
        foreach ($this->autoIncrementFields as $key => $flag) {
            $parts = explode('.', $key, 2);
            if (count($parts) !== 2) continue;

            [$tableName, $fieldName] = $parts;

            if (isset($this->table_map[$tableName])) {
                foreach ($this->table_map[$tableName]['fields'] as &$field) {
                    if (strtoupper($field['name']) === strtoupper($fieldName)) {
                        $field['auto_increment'] = true;
                        break;
                    }
                }
                unset($field);
            }
        }
    }

    // =====================================================================
    // Standard parser infrastructure
    // =====================================================================

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
        if (!$token || $token->type !== $token_type) {
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
                throw new Exception("Firebird Syntax Error: Expected token '{$expected_type}', but got '{$token->type}' with value '{$token->value}'{$context}");
            }
            if ($expected_value && $token->value !== $expected_value) {
                $context = $this->getErrorContext();
                throw new Exception("Firebird Syntax Error: Expected '{$expected_value}', but got '{$token->value}'{$context}");
            }
            $this->position++;
            return $token;
        }

        $context = $this->getErrorContext();
        throw new Exception("Firebird Syntax Error: Unexpected end of SQL script{$context}.");
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

    // =====================================================================
    // Table definition parsing
    // =====================================================================

    private function parseTableName()
    {
        $name_token = $this->consumeToken();
        return $name_token->value;
    }

    private function parseTableDefinition()
    {
        $fields = [];
        $constraints = [];

        while (!$this->currentTokenMatches('RPAREN')) {
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

            if ($this->currentTokenMatches('COMMA')) {
                $this->consumeToken('COMMA');
            } elseif (!$this->currentTokenMatches('RPAREN')) {
                break;
            }
        }

        return [$fields, $constraints];
    }

    private function parseFieldDefinition()
    {
        $field_name_token = $this->consumeToken();
        if (!in_array($field_name_token->type, ['QUOTED_STRING', 'IDENTIFIER', 'KEYWORD'])) {
            return null;
        }
        $field_name = $field_name_token->value;

        // Data type — could be a domain name, a built-in type, or COMPUTED BY
        $data_type = '';
        $nullable = true;
        $default_value = null;
        $auto_increment = false;
        $is_primary_key = false;

        // Check for COMPUTED BY (expression)
        if ($this->currentTokenMatches('KEYWORD', 'COMPUTED')) {
            $this->consumeToken('KEYWORD', 'COMPUTED');
            if ($this->currentTokenMatches('KEYWORD', 'BY')) {
                $this->consumeToken('KEYWORD', 'BY');
            }
            // Skip the expression in parentheses
            if ($this->currentTokenMatches('LPAREN')) {
                $this->skipBalancedParens();
            }
            return [
                'name' => $field_name,
                'type' => 'COMPUTED',
                'unsigned' => false,
                'nullable' => true,
                'default' => null,
                'auto_increment' => false,
            ];
        }

        // Parse data type (could be domain name or built-in)
        $data_type = $this->parseDataType();

        // Check if data type is a domain — resolve it
        $upperType = strtoupper($data_type);
        if (isset($this->domains[$upperType])) {
            $domain = $this->domains[$upperType];
            $data_type = $domain['type'];
            $nullable = $domain['nullable'];
            $default_value = $domain['default'];
        }

        // Parse field attributes
        while ($this->currentToken() &&
               !$this->currentTokenMatches('COMMA') &&
               !$this->currentTokenMatches('RPAREN')) {

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
                        $this->consumeToken('KEYWORD', 'PRIMARY');
                        $this->consumeToken('KEYWORD', 'KEY');
                        $is_primary_key = true;
                        $nullable = false;
                        break;
                    case 'UNIQUE':
                        $this->consumeToken();
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
                    case 'CHARACTER':
                        // CHARACTER SET charset_name
                        $this->consumeToken('KEYWORD', 'CHARACTER');
                        if ($this->currentTokenMatches('KEYWORD', 'SET')) {
                            $this->consumeToken('KEYWORD', 'SET');
                            $this->consumeToken(); // charset name
                        }
                        break;
                    case 'POSITION':
                        // POSITION n — ordinal position (Firebird-specific)
                        $this->consumeToken('KEYWORD', 'POSITION');
                        if ($this->currentTokenMatches('NUMBER')) {
                            $this->consumeToken('NUMBER');
                        }
                        break;
                    case 'SEGMENT':
                        // SEGMENT SIZE n — for BLOB fields
                        $this->consumeToken('KEYWORD', 'SEGMENT');
                        if ($this->currentTokenMatches('KEYWORD', 'SIZE')) {
                            $this->consumeToken('KEYWORD', 'SIZE');
                            if ($this->currentTokenMatches('NUMBER')) {
                                $this->consumeToken('NUMBER');
                            }
                        }
                        break;
                    case 'CONSTRAINT':
                        $this->consumeToken('KEYWORD', 'CONSTRAINT');
                        $this->consumeToken(); // constraint name
                        break;
                    case 'COMPUTED':
                        // Shouldn't get here, but handle gracefully
                        $this->consumeToken('KEYWORD', 'COMPUTED');
                        if ($this->currentTokenMatches('KEYWORD', 'BY')) {
                            $this->consumeToken('KEYWORD', 'BY');
                        }
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
            'unsigned' => false,
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
        } elseif ($data_type === 'NATIONAL' && $this->currentTokenMatches('KEYWORD', 'CHARACTER')) {
            $this->consumeToken('KEYWORD', 'CHARACTER');
            if ($this->currentTokenMatches('KEYWORD', 'VARYING')) {
                $this->consumeToken('KEYWORD', 'VARYING');
                $data_type = 'NCHAR VARYING';
            } else {
                $data_type = 'NCHAR';
            }
        } elseif ($data_type === 'BLOB') {
            // BLOB SUB_TYPE TEXT / BLOB SUB_TYPE BINARY / BLOB SUB_TYPE n
            if ($this->currentTokenMatches('KEYWORD', 'SUB_TYPE')) {
                $this->consumeToken('KEYWORD', 'SUB_TYPE');
                if ($this->currentToken()) {
                    $subtype = $this->consumeToken()->value;
                    $data_type = "BLOB SUB_TYPE {$subtype}";
                }
            }
        } elseif (($data_type === 'TIME' || $data_type === 'TIMESTAMP') &&
                  $this->currentTokenMatches('KEYWORD', 'WITH')) {
            // TIME WITH TIME ZONE / TIMESTAMP WITH TIME ZONE
            $this->consumeToken('KEYWORD', 'WITH');
            $this->consumeToken('KEYWORD', 'TIME');
            $this->consumeToken('KEYWORD', 'ZONE');
            $data_type .= ' WITH TIME ZONE';
        }

        // Handle data type with size: VARCHAR(255), NUMERIC(10,2), CSTRING(255)
        if ($this->currentTokenMatches('LPAREN')) {
            $this->consumeToken('LPAREN');
            $size_parts = [];

            while (!$this->currentTokenMatches('RPAREN')) {
                $size_token = $this->consumeToken();
                $size_parts[] = $size_token->value;

                if ($this->currentTokenMatches('COMMA')) {
                    $this->consumeToken('COMMA');
                    $size_parts[] = ',';
                } elseif (!$this->currentTokenMatches('RPAREN')) {
                    break;
                }
            }

            $data_type .= '(' . implode('', $size_parts) . ')';
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

    // =====================================================================
    // Constraint parsing
    // =====================================================================

    private function parsePrimaryKey()
    {
        $this->consumeToken('KEYWORD', 'PRIMARY');
        $this->consumeToken('KEYWORD', 'KEY');
        $this->consumeToken('LPAREN');

        $columns = [];
        while (!$this->currentTokenMatches('RPAREN')) {
            $col_token = $this->consumeToken();
            if (in_array($col_token->type, ['QUOTED_STRING', 'IDENTIFIER', 'KEYWORD'])) {
                $columns[] = $col_token->value;
            }
            if ($this->currentTokenMatches('KEYWORD', 'ASC') ||
                $this->currentTokenMatches('KEYWORD', 'DESC') ||
                $this->currentTokenMatches('KEYWORD', 'ASCENDING') ||
                $this->currentTokenMatches('KEYWORD', 'DESCENDING')) {
                $this->consumeToken();
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
        $name_token = $this->consumeToken();
        $constraint_name = $name_token->value;

        if ($this->currentTokenMatches('KEYWORD', 'PRIMARY')) {
            $this->consumeToken('KEYWORD', 'PRIMARY');
            $this->consumeToken('KEYWORD', 'KEY');
            $this->consumeToken('LPAREN');

            $columns = [];
            while (!$this->currentTokenMatches('RPAREN')) {
                $col_token = $this->consumeToken();
                if (in_array($col_token->type, ['QUOTED_STRING', 'IDENTIFIER', 'KEYWORD'])) {
                    $columns[] = $col_token->value;
                }
                if ($this->currentTokenMatches('KEYWORD', 'ASC') ||
                    $this->currentTokenMatches('KEYWORD', 'DESC') ||
                    $this->currentTokenMatches('KEYWORD', 'ASCENDING') ||
                    $this->currentTokenMatches('KEYWORD', 'DESCENDING')) {
                    $this->consumeToken();
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
            while (!$this->currentTokenMatches('RPAREN')) {
                $col_token = $this->consumeToken();
                if (in_array($col_token->type, ['QUOTED_STRING', 'IDENTIFIER', 'KEYWORD'])) {
                    $columns[] = $col_token->value;
                }
                if ($this->currentTokenMatches('KEYWORD', 'ASC') ||
                    $this->currentTokenMatches('KEYWORD', 'DESC') ||
                    $this->currentTokenMatches('KEYWORD', 'ASCENDING') ||
                    $this->currentTokenMatches('KEYWORD', 'DESCENDING')) {
                    $this->consumeToken();
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
        }

        return null;
    }

    private function parseForeignKeyConstraint($constraint_name)
    {
        $this->consumeToken('KEYWORD', 'FOREIGN');
        $this->consumeToken('KEYWORD', 'KEY');

        $this->consumeToken('LPAREN');
        $source_cols = [];
        while (!$this->currentTokenMatches('RPAREN')) {
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
        $ref_table = $this->parseTableName();

        $ref_cols = [];
        if ($this->currentTokenMatches('LPAREN')) {
            $this->consumeToken('LPAREN');
            while (!$this->currentTokenMatches('RPAREN')) {
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

        $on_delete = 'NO ACTION';
        $on_update = 'NO ACTION';

        while ($this->currentTokenMatches('KEYWORD', 'ON')) {
            $this->consumeToken('KEYWORD', 'ON');
            if ($this->currentTokenMatches('KEYWORD', 'DELETE')) {
                $this->consumeToken('KEYWORD', 'DELETE');
                $on_delete = $this->parseReferentialAction();
            } elseif ($this->currentTokenMatches('KEYWORD', 'UPDATE')) {
                $this->consumeToken('KEYWORD', 'UPDATE');
                $on_update = $this->parseReferentialAction();
            }
        }

        // USING INDEX constraint_name (Firebird-specific) — skip
        if ($this->currentTokenMatches('KEYWORD', 'USING')) {
            $this->consumeToken('KEYWORD', 'USING');
            if ($this->currentTokenMatches('KEYWORD', 'INDEX')) {
                $this->consumeToken('KEYWORD', 'INDEX');
                if ($this->currentToken() &&
                    in_array($this->currentToken()->type, ['IDENTIFIER', 'QUOTED_STRING', 'KEYWORD'])) {
                    $this->consumeToken(); // index name
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
        $this->consumeToken('LPAREN');

        $columns = [];
        while (!$this->currentTokenMatches('RPAREN')) {
            $col_token = $this->consumeToken();
            if (in_array($col_token->type, ['QUOTED_STRING', 'IDENTIFIER', 'KEYWORD'])) {
                $columns[] = $col_token->value;
            }
            if ($this->currentTokenMatches('KEYWORD', 'ASC') ||
                $this->currentTokenMatches('KEYWORD', 'DESC') ||
                $this->currentTokenMatches('KEYWORD', 'ASCENDING') ||
                $this->currentTokenMatches('KEYWORD', 'DESCENDING')) {
                $this->consumeToken();
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

    // =====================================================================
    // ALTER TABLE
    // =====================================================================

    private function parseAlterStatement()
    {
        $this->consumeToken('KEYWORD', 'ALTER');

        if (!$this->currentTokenMatches('KEYWORD', 'TABLE')) {
            $this->skipToSemicolonOrEnd();
            return;
        }

        $this->consumeToken('KEYWORD', 'TABLE');
        $table_name = $this->parseTableName();

        if ($this->currentTokenMatches('KEYWORD', 'ADD')) {
            $this->consumeToken('KEYWORD', 'ADD');

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
                    $this->consumeToken('LPAREN');

                    $columns = [];
                    while (!$this->currentTokenMatches('RPAREN')) {
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

                    if (isset($this->table_map[$table_name])) {
                        $this->table_map[$table_name]['constraints'][] = [
                            'type' => 'PRIMARY KEY',
                            'name' => $constraint_name,
                            'columns' => $columns,
                        ];
                    }
                } elseif ($this->currentTokenMatches('KEYWORD', 'UNIQUE')) {
                    $this->consumeToken('KEYWORD', 'UNIQUE');
                    $this->consumeToken('LPAREN');

                    $columns = [];
                    while (!$this->currentTokenMatches('RPAREN')) {
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

                    if (isset($this->table_map[$table_name])) {
                        $this->table_map[$table_name]['constraints'][] = [
                            'type' => 'UNIQUE',
                            'name' => $constraint_name,
                            'columns' => $columns,
                        ];
                    }
                } elseif ($this->currentTokenMatches('KEYWORD', 'CHECK')) {
                    $this->skipCheckConstraint();
                }
            } elseif ($this->currentTokenMatches('KEYWORD', 'PRIMARY')) {
                $pk = $this->parsePrimaryKey();
                if ($pk && isset($this->table_map[$table_name])) {
                    $this->table_map[$table_name]['constraints'][] = $pk;
                }
            } elseif ($this->currentTokenMatches('KEYWORD', 'FOREIGN')) {
                $fk = $this->parseForeignKeyInline();
                if ($fk && isset($this->table_map[$table_name])) {
                    $this->table_map[$table_name]['constraints'][] = $fk;
                }
            }
        }

        $this->skipToSemicolonOrEnd();
    }

    // =====================================================================
    // Utility methods
    // =====================================================================

    private function skipInlineReferences()
    {
        $this->consumeToken('KEYWORD', 'REFERENCES');
        $this->consumeToken(); // table name

        if ($this->currentTokenMatches('LPAREN')) {
            $this->skipBalancedParens();
        }

        while ($this->currentTokenMatches('KEYWORD', 'ON')) {
            $this->consumeToken();
            $this->consumeToken(); // DELETE or UPDATE
            $this->parseReferentialAction();
        }
    }

    private function skipCheckConstraint()
    {
        if ($this->currentTokenMatches('KEYWORD', 'CHECK')) {
            $this->consumeToken('KEYWORD', 'CHECK');
        }

        if ($this->currentTokenMatches('LPAREN')) {
            $this->skipBalancedParens();
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
               !$this->currentTokenMatches('SEMICOLON')) {
            $this->position++;
        }

        if ($this->currentTokenMatches('SEMICOLON')) {
            $this->consumeToken('SEMICOLON');
        }
    }
}
