<?php

namespace App\Services;

class SQLParser {
    private $tokens;
    private $position;
    private $tables;
    private $table_map;
    
    public function __construct($tokens) {
        $this->tokens = $tokens;
        $this->position = 0;
        $this->tables = [];
        $this->table_map = [];
    }
    
    public function parse() {
        while ($this->position < count($this->tokens)) {
            if ($this->currentTokenMatches('KEYWORD', 'CREATE')) {
                $this->parseCreateStatement();
            } elseif ($this->currentTokenMatches('KEYWORD', 'ALTER')) {
                $this->parseAlterStatement();
            } else {
                $this->position++;
            }
        }
        return $this->tables;
    }
    
    private function currentToken() {
        if ($this->position < count($this->tokens)) {
            return $this->tokens[$this->position];
        }
        return null;
    }
    
    private function currentTokenMatches($token_type, $value = null) {
        $token = $this->currentToken();
        if (!$token || $token->type !== $token_type) {
            return false;
        }
        if ($value !== null) {
            return $token->value === $value;
        }
        return true;
    }
    
    private function consumeToken($expected_type = null, $expected_value = null) {
        $token = $this->currentToken();
        if ($token) {
            if ($expected_type && $token->type !== $expected_type) {
                throw new Exception("Expected {$expected_type}, got {$token->type}");
            }
            if ($expected_value && $token->value !== $expected_value) {
                throw new Exception("Expected {$expected_value}, got {$token->value}");
            }
            $this->position++;
            return $token;
        }
        throw new Exception("Unexpected end of tokens");
    }
    
    private function parseCreateStatement() {
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
        list($fields, $constraints) = $this->parseTableDefinition();
        $this->consumeToken('RPAREN');
        
        // Skip ENGINE and other options
        $this->skipToSemicolonOrEnd();
        
        $table = [
            'table_name' => $table_name,
            'fields' => $fields,
            'constraints' => $constraints,
        ];
        $this->tables[] = $table;
        $this->table_map[$table_name] = &$this->tables[count($this->tables) - 1];
    }
    
    private function parseTableDefinition() {
        $fields = [];
        $constraints = [];
        
        while (!$this->currentTokenMatches('RPAREN')) {
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
            } elseif (!$this->currentTokenMatches('RPAREN')) {
                // If no comma and not closing paren, might be end of statement
                break;
            }
        }
        
        return [$fields, $constraints];
    }
    
    private function parseFieldDefinition() {
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
        
        // Parse field attributes
        $unsigned = false;
        $auto_increment = false;
        $nullable = true;
        $default_value = null;
        
        while ($this->currentToken() && 
               !$this->currentTokenMatches('COMMA') && 
               !$this->currentTokenMatches('RPAREN')) {
            
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
            'auto_increment' => $auto_increment
        ];
    }
    
    private function parsePrimaryKey() {
        $this->consumeToken('KEYWORD', 'PRIMARY');
        $this->consumeToken('KEYWORD', 'KEY');
        $this->consumeToken('LPAREN');
        
        $columns = [];
        while (!$this->currentTokenMatches('RPAREN')) {
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
            'columns' => $columns
        ];
    }
    
    private function parseKeyConstraint() {
        $key_type = $this->consumeToken('KEYWORD')->value; // KEY or INDEX
        
        // Key name
        $key_name = null;
        if (!$this->currentTokenMatches('LPAREN')) {
            $name_token = $this->consumeToken();
            if (in_array($name_token->type, ['QUOTED_STRING', 'IDENTIFIER'])) {
                $key_name = $name_token->value;
            }
        }
        
        $this->consumeToken('LPAREN');
        
        $columns = [];
        while (!$this->currentTokenMatches('RPAREN')) {
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
            'type' => 'KEY',
            'name' => $key_name,
            'columns' => $columns
        ];
    }
    
    private function parseUniqueConstraint() {
        $this->consumeToken('KEYWORD', 'UNIQUE');
        
        // Optional KEY or INDEX
        if ($this->currentTokenMatches('KEYWORD', 'KEY') || 
            $this->currentTokenMatches('KEYWORD', 'INDEX')) {
            $this->consumeToken();
        }
        
        // Key name (optional)
        $key_name = null;
        if (!$this->currentTokenMatches('LPAREN')) {
            $name_token = $this->consumeToken();
            if (in_array($name_token->type, ['QUOTED_STRING', 'IDENTIFIER'])) {
                $key_name = $name_token->value;
            }
        }
        
        $this->consumeToken('LPAREN');
        
        $columns = [];
        while (!$this->currentTokenMatches('RPAREN')) {
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
            'type' => 'UNIQUE',
            'name' => $key_name,
            'columns' => $columns
        ];
    }
    
    private function parseAlterStatement() {
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
        while (!$this->currentTokenMatches('RPAREN')) {
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
        while (!$this->currentTokenMatches('RPAREN')) {
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
        
        $fk = [
            'type' => 'FOREIGN KEY',
            'name' => $constraint_name,
            'columns' => $source_cols,
            'references' => [
                'table' => $ref_table,
                'columns' => $ref_cols
            ]
        ];
        
        if (isset($this->table_map[$table_name])) {
            $this->table_map[$table_name]['constraints'][] = $fk;
        }
    }
    
    private function skipToSemicolonOrEnd() {
        while ($this->position < count($this->tokens) && 
               !$this->currentTokenMatches('SEMICOLON')) {
            $this->position++;
        }
        
        if ($this->currentTokenMatches('SEMICOLON')) {
            $this->consumeToken('SEMICOLON');
        }
    }
}