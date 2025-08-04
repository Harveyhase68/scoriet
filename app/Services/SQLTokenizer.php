<?php

namespace App\Services;

class SQLTokenizer {
    private $sql_text;
    private $position;
    private $tokens;
    private $keywords;
    
    public function __construct($sql_text) {
        $this->sql_text = trim($sql_text);
        $this->position = 0;
        $this->tokens = [];
        $this->keywords = [
            'CREATE', 'TABLE', 'ALTER', 'ADD', 'CONSTRAINT', 'FOREIGN', 'KEY', 
            'REFERENCES', 'PRIMARY', 'IF', 'NOT', 'EXISTS', 'NULL', 'DEFAULT',
            'AUTO_INCREMENT', 'UNSIGNED', 'ENGINE', 'UNIQUE', 'INDEX'
        ];
    }
    
    public function tokenize() {
        while ($this->position < strlen($this->sql_text)) {
            $this->skipWhitespace();
            if ($this->position >= strlen($this->sql_text)) {
                break;
            }
            
            $char = $this->sql_text[$this->position];
            
            switch ($char) {
                case '(':
                    $this->tokens[] = new SQLToken('LPAREN', '(', $this->position);
                    $this->position++;
                    break;
                case ')':
                    $this->tokens[] = new SQLToken('RPAREN', ')', $this->position);
                    $this->position++;
                    break;
                case ',':
                    $this->tokens[] = new SQLToken('COMMA', ',', $this->position);
                    $this->position++;
                    break;  
                case ';':
                    $this->tokens[] = new SQLToken('SEMICOLON', ';', $this->position);
                    $this->position++;
                    break;
                case '=':
                    $this->tokens[] = new SQLToken('EQUALS', '=', $this->position);
                    $this->position++;
                    break;
                case '"':
                case "'":
                case '`':
                    $this->readQuotedString($char);
                    break;
                default:
                    if (ctype_alpha($char) || $char === '_') {
                        $this->readIdentifierOrKeyword();
                    } elseif (ctype_digit($char)) {
                        $this->readNumber();
                    } else {
                        $this->position++;
                    }
                    break;
            }
        }
        
        return $this->tokens;
    }
    
    private function skipWhitespace() {
        while ($this->position < strlen($this->sql_text) && 
               ctype_space($this->sql_text[$this->position])) {
            $this->position++;
        }
    }
    
    private function readQuotedString($quote_char) {
        $start_pos = $this->position;
        $this->position++; // Skip opening quote
        $value = "";
        
        while ($this->position < strlen($this->sql_text)) {
            $char = $this->sql_text[$this->position];
            if ($char === $quote_char) {
                $this->position++;
                break;
            } elseif ($char === '\\' && $this->position + 1 < strlen($this->sql_text)) {
                // Handle escaped characters
                $this->position++;
                $value .= $this->sql_text[$this->position];
                $this->position++;
            } else {
                $value .= $char;
                $this->position++;
            }
        }
        
        $this->tokens[] = new SQLToken('QUOTED_STRING', $value, $start_pos);
    }
    
    private function readIdentifierOrKeyword() {
        $start_pos = $this->position;
        $value = "";
        
        while ($this->position < strlen($this->sql_text) && 
               (ctype_alnum($this->sql_text[$this->position]) || 
                $this->sql_text[$this->position] === '_')) {
            $value .= $this->sql_text[$this->position];
            $this->position++;
        }
        
        $upper_value = strtoupper($value);
        $token_type = in_array($upper_value, $this->keywords) ? 'KEYWORD' : 'IDENTIFIER';
        $this->tokens[] = new SQLToken($token_type, $upper_value, $start_pos);
    }
    
    private function readNumber() {
        $start_pos = $this->position;
        $value = "";
        
        while ($this->position < strlen($this->sql_text) && 
               (ctype_digit($this->sql_text[$this->position]) || 
                $this->sql_text[$this->position] === '.')) {
            $value .= $this->sql_text[$this->position];
            $this->position++;
        }
        
        $this->tokens[] = new SQLToken('NUMBER', $value, $start_pos);
    }
}
