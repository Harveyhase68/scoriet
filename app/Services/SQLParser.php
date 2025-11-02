<?php

namespace App\Services;

class SQLParser
{
    private $tokens;

    private $position;

    private $tables;

    private $table_map;
    
    private $sql_text;

    public function __construct($tokens, $sql_text = null)
    {
        $this->tokens = $tokens;
        $this->sql_text = $sql_text;
        $this->position = 0;
        $this->tables = [];
        $this->table_map = [];
    }

    public function parse()
    {
        while ($this->position < count($this->tokens)) {
            if ($this->currentTokenMatches('KEYWORD', 'CREATE')) {
                $this->parseCreateStatement();
            } elseif ($this->currentTokenMatches('KEYWORD', 'ALTER')) {
                $this->parseAlterStatement();
            } elseif ($this->currentTokenMatches('KEYWORD', 'DROP')) {
                $this->parseDropStatement();
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
                throw new Exception("SQL Syntax Error: Expected token '{$expected_type}', but got '{$token->type}' with value '{$token->value}'{$context}");
            }
            if ($expected_value && $token->value !== $expected_value) {
                $context = $this->getErrorContext();
                throw new Exception("SQL Syntax Error: Expected '{$expected_value}', but got '{$token->value}'{$context}");
            }
            $this->position++;

            return $token;
        }
        
        $context = $this->getErrorContext();
        throw new Exception("SQL Syntax Error: Unexpected end of SQL script{$context}. Missing semicolon or incomplete statement?");
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
                $contextTokens[] = ">>>{$t->value}<<<";  // Highlight current token
            } else {
                $contextTokens[] = $t->value;
            }
        }
        
        // Calculate approximate line and character position in original SQL
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
            $charCount += strlen($line) + 1; // +1 for newline
        }
        
        return " near: " . implode(' ', $contextTokens) . 
               " (SQL line: {$currentLine}, character: {$currentChar}, token position: " . ($currentPos + 1) . "/" . count($this->tokens) . ")";
    }

    private function parseCreateStatement()
    {
        $this->consumeToken('KEYWORD', 'CREATE');
        $this->consumeToken('KEYWORD', 'TABLE');

        // Optional IF NOT EXISTS
        if ($this->currentTokenMatches('KEYWORD', 'IF')) {
            $this->consumeToken('KEYWORD', 'IF');
            $this->consumeToken('KEYWORD', 'NOT');
            $this->consumeToken('KEYWORD', 'EXISTS');
        }

        // Table name
        $table_name_token = $this->consumeToken();
        if ($table_name_token->type === 'QUOTED_STRING') {
            $table_name = $table_name_token->value;
        } elseif ($table_name_token->type === 'IDENTIFIER') {
            $table_name = $table_name_token->value;
        } else {
            throw new Exception("Expected table name, got {$table_name_token->type}");
        }

        // Parse table definition
        $this->consumeToken('LPAREN');
        [$fields, $constraints] = $this->parseTableDefinition();
        $this->consumeToken('RPAREN');

        // Skip ENGINE and other options
        $this->skipToSemicolonOrEnd();

        $table = [
            'table_name' => $table_name,
            'fields' => $fields,
            'constraints' => $constraints,
        ];

        // Check if table already exists - merge instead of duplicate
        if (isset($this->table_map[$table_name])) {
            // Merge fields and constraints with existing table (avoid duplicates)
            $existingTable = &$this->table_map[$table_name];

            // Merge fields (only add if field name doesn't exist)
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

            // Merge constraints (avoid duplicates)
            foreach ($constraints as $newConstraint) {
                $existingTable['constraints'][] = $newConstraint;
            }
        } else {
            // Add new table
            $this->tables[] = $table;
            $this->table_map[$table_name] = &$this->tables[count($this->tables) - 1];
        }
    }

    private function parseTableDefinition()
    {
        $fields = [];
        $constraints = [];

        while (! $this->currentTokenMatches('RPAREN')) {
            if ($this->currentTokenMatches('KEYWORD', 'PRIMARY')) {
                $constraints[] = $this->parsePrimaryKey();
            } elseif ($this->currentTokenMatches('KEYWORD', 'KEY') ||
                      $this->currentTokenMatches('KEYWORD', 'INDEX')) {
                $constraints[] = $this->parseKeyConstraint();
            } elseif ($this->currentTokenMatches('KEYWORD', 'UNIQUE')) {
                $constraints[] = $this->parseUniqueConstraint();
            } else {
                $fields[] = $this->parseFieldDefinition();
            }

            // Handle comma
            if ($this->currentTokenMatches('COMMA')) {
                $this->consumeToken('COMMA');
            } elseif (! $this->currentTokenMatches('RPAREN')) {
                // If no comma and not closing paren, might be end of statement
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
        } else {
            throw new Exception("Expected field name, got {$field_name_token->type}");
        }

        // Data type
        $data_type_token = $this->consumeToken();
        $data_type = $data_type_token->value;

        // Handle data type with size (e.g., VARCHAR(255))
        if ($this->currentTokenMatches('LPAREN')) {
            $this->consumeToken('LPAREN');
            $size_parts = [];

            // Handle size parameters (can be multiple, e.g., DECIMAL(10,2))
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

        // Parse field attributes
        $unsigned = false;
        $auto_increment = false;
        $nullable = true;
        $default_value = null;

        while ($this->currentToken() &&
               ! $this->currentTokenMatches('COMMA') &&
               ! $this->currentTokenMatches('RPAREN')) {

            $token = $this->currentToken();

            if ($token->type === 'KEYWORD') {
                switch ($token->value) {
                    case 'UNSIGNED':
                        $unsigned = true;
                        $this->consumeToken();
                        break;
                    case 'AUTO_INCREMENT':
                        $auto_increment = true;
                        $this->consumeToken();
                        break;
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
                        $default_token = $this->consumeToken();
                        if ($default_token->type === 'QUOTED_STRING') {
                            $default_value = $default_token->value;
                        } elseif ($default_token->type === 'NUMBER') {
                            $default_value = $default_token->value;
                        } elseif ($default_token->type === 'KEYWORD' && $default_token->value === 'NULL') {
                            $default_value = 'NULL'; // Explicit NULL as default
                        } elseif ($default_token->type === 'IDENTIFIER') {
                            $default_value = $default_token->value;
                        }
                        break;
                    default:
                        $this->consumeToken(); // Skip unknown keywords
                        break;
                }
            } else {
                $this->consumeToken(); // Skip other tokens
            }
        }

        return [
            'name' => $field_name,
            'type' => $data_type,
            'unsigned' => $unsigned,
            'nullable' => $nullable,
            'default' => $default_value,
            'auto_increment' => $auto_increment,
        ];
    }

    private function parsePrimaryKey()
    {
        $this->consumeToken('KEYWORD', 'PRIMARY');
        $this->consumeToken('KEYWORD', 'KEY');
        $this->consumeToken('LPAREN');

        $columns = [];
        while (! $this->currentTokenMatches('RPAREN')) {
            $col_token = $this->consumeToken();
            if (in_array($col_token->type, ['QUOTED_STRING', 'IDENTIFIER'])) {
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
            'name' => 'PRIMARY', // Standard name for PRIMARY KEY constraints
            'columns' => $columns,
        ];
    }

    private function parseKeyConstraint()
    {
        $key_type = $this->consumeToken('KEYWORD')->value; // KEY or INDEX

        // Key name
        $key_name = null;
        if (! $this->currentTokenMatches('LPAREN')) {
            $name_token = $this->consumeToken();
            if (in_array($name_token->type, ['QUOTED_STRING', 'IDENTIFIER'])) {
                $key_name = $name_token->value;
            }
        }

        $this->consumeToken('LPAREN');

        $columns = [];
        while (! $this->currentTokenMatches('RPAREN')) {
            $col_token = $this->consumeToken();
            if (in_array($col_token->type, ['QUOTED_STRING', 'IDENTIFIER'])) {
                $columns[] = $col_token->value;
            }

            if ($this->currentTokenMatches('COMMA')) {
                $this->consumeToken('COMMA');
            } else {
                break;
            }
        }

        $this->consumeToken('RPAREN');

        // Optional USING BTREE/HASH
        if ($this->currentTokenMatches('KEYWORD', 'USING')) {
            $this->consumeToken('KEYWORD', 'USING');
            $this->consumeToken(); // BTREE or HASH
        }

        return [
            'type' => 'KEY',
            'name' => $key_name,
            'columns' => $columns,
        ];
    }

    private function parseUniqueConstraint()
    {
        $this->consumeToken('KEYWORD', 'UNIQUE');

        // Optional KEY or INDEX
        if ($this->currentTokenMatches('KEYWORD', 'KEY') ||
            $this->currentTokenMatches('KEYWORD', 'INDEX')) {
            $this->consumeToken();
        }

        // Key name (optional)
        $key_name = null;
        if (! $this->currentTokenMatches('LPAREN')) {
            $name_token = $this->consumeToken();
            if (in_array($name_token->type, ['QUOTED_STRING', 'IDENTIFIER'])) {
                $key_name = $name_token->value;
            }
        }

        $this->consumeToken('LPAREN');

        $columns = [];
        while (! $this->currentTokenMatches('RPAREN')) {
            $col_token = $this->consumeToken();
            if (in_array($col_token->type, ['QUOTED_STRING', 'IDENTIFIER'])) {
                $columns[] = $col_token->value;
            }

            if ($this->currentTokenMatches('COMMA')) {
                $this->consumeToken('COMMA');
            } else {
                break;
            }
        }

        $this->consumeToken('RPAREN');

        // Optional USING BTREE/HASH
        if ($this->currentTokenMatches('KEYWORD', 'USING')) {
            $this->consumeToken('KEYWORD', 'USING');
            $this->consumeToken(); // BTREE or HASH
        }

        return [
            'type' => 'UNIQUE',
            'name' => $key_name,
            'columns' => $columns,
        ];
    }

    private function parseAlterStatement()
    {
        $this->consumeToken('KEYWORD', 'ALTER');
        $this->consumeToken('KEYWORD', 'TABLE');

        // Table name
        $table_name_token = $this->consumeToken();
        if ($table_name_token->type === 'QUOTED_STRING') {
            $table_name = $table_name_token->value;
        } elseif ($table_name_token->type === 'IDENTIFIER') {
            $table_name = $table_name_token->value;
        } else {
            throw new Exception("Expected table name, got {$table_name_token->type}");
        }

        $this->consumeToken('KEYWORD', 'ADD');
        $this->consumeToken('KEYWORD', 'CONSTRAINT');

        // Constraint name
        $constraint_name_token = $this->consumeToken();
        $constraint_name = $constraint_name_token->value;

        $this->consumeToken('KEYWORD', 'FOREIGN');
        $this->consumeToken('KEYWORD', 'KEY');

        // Source columns
        $this->consumeToken('LPAREN');
        $source_cols = [];
        while (! $this->currentTokenMatches('RPAREN')) {
            $col_token = $this->consumeToken();
            if (in_array($col_token->type, ['QUOTED_STRING', 'IDENTIFIER'])) {
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
        $ref_table_token = $this->consumeToken();
        $ref_table = $ref_table_token->value;

        // Reference columns
        $this->consumeToken('LPAREN');
        $ref_cols = [];
        while (! $this->currentTokenMatches('RPAREN')) {
            $col_token = $this->consumeToken();
            if (in_array($col_token->type, ['QUOTED_STRING', 'IDENTIFIER'])) {
                $ref_cols[] = $col_token->value;
            }

            if ($this->currentTokenMatches('COMMA')) {
                $this->consumeToken('COMMA');
            } else {
                break;
            }
        }
        $this->consumeToken('RPAREN');

        // Parse ON DELETE and ON UPDATE actions
        $on_delete = 'NO ACTION';
        $on_update = 'NO ACTION';

        // Check for ON DELETE
        if ($this->currentTokenMatches('KEYWORD', 'ON')) {
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
        }

        $fk = [
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

        if (isset($this->table_map[$table_name])) {
            $this->table_map[$table_name]['constraints'][] = $fk;
        }
    }

    private function parseReferentialAction(): string
    {
        // Parse referential actions: CASCADE, RESTRICT, SET NULL, NO ACTION, SET DEFAULT
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

        return 'NO ACTION'; // Default
    }

    private function parseDropStatement()
    {
        $this->consumeToken('KEYWORD', 'DROP');
        $this->consumeToken('KEYWORD', 'TABLE');

        // Optional IF EXISTS
        if ($this->currentTokenMatches('KEYWORD', 'IF')) {
            $this->consumeToken('KEYWORD', 'IF');
            $this->consumeToken('KEYWORD', 'EXISTS');
        }

        // Table name (we don't need to store DROP statements)
        $this->consumeToken(); // table name

        // Skip to semicolon
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
