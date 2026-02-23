<?php

namespace App\Services;

class FirebirdTokenizer
{
    private $sql_text;

    private $position;

    private $tokens;

    private $keywords;

    private $terminator;

    public function __construct($sql_text)
    {
        $this->sql_text = trim($sql_text);
        $this->position = 0;
        $this->tokens = [];
        $this->terminator = ';'; // Default terminator, can be changed via SET TERM
        $this->keywords = [
            // DDL keywords
            'CREATE', 'TABLE', 'ALTER', 'ADD', 'CONSTRAINT', 'FOREIGN', 'KEY',
            'REFERENCES', 'PRIMARY', 'IF', 'NOT', 'EXISTS', 'NULL', 'DEFAULT',
            'UNIQUE', 'INDEX', 'DROP', 'CASCADE', 'RESTRICT', 'ON', 'DELETE',
            'UPDATE', 'SET', 'NO', 'ACTION', 'CHECK', 'WITH',

            // Firebird-specific keywords
            'GENERATOR', 'SEQUENCE', 'DOMAIN', 'POSITION', 'SEGMENT', 'SIZE',
            'COMPUTED', 'BY', 'RECREATE', 'EXECUTE', 'BLOCK', 'RETURNS',
            'SUSPEND', 'TERM', 'ACTIVE', 'INACTIVE', 'BEFORE', 'AFTER',
            'TRIGGER', 'FOR', 'AS', 'BEGIN', 'END', 'THEN', 'ELSE', 'WHEN',
            'NEW', 'OLD', 'EXCEPTION', 'EXIT',
            'OR', 'REPLACE', 'EXTERNAL', 'FILE',
            'GEN_ID', 'NEXT', 'VALUE',

            // Schema keywords
            'COLLATE', 'CHARACTER', 'COLLATION',

            // Constraint keywords
            'ASC', 'DESC', 'ASCENDING', 'DESCENDING',

            // Firebird data types
            'INTEGER', 'INT', 'SMALLINT', 'BIGINT', 'INT128',
            'FLOAT', 'REAL', 'DOUBLE', 'PRECISION', 'D_FLOAT',
            'NUMERIC', 'DECIMAL', 'DECFLOAT',
            'VARCHAR', 'CHAR', 'CHARACTER', 'VARYING', 'CSTRING',
            'NCHAR', 'NATIONAL',
            'BLOB', 'SUB_TYPE', 'TEXT', 'BINARY',
            'BOOLEAN',
            'DATE', 'TIME', 'TIMESTAMP', 'ZONE',
            'CURRENT_TIMESTAMP', 'CURRENT_DATE', 'CURRENT_TIME',
            'NOW',

            // Non-table DDL (to skip)
            'VIEW', 'PROCEDURE', 'FUNCTION',
            'GRANT', 'REVOKE', 'ROLE', 'TO', 'FROM',
            'INSERT', 'INTO', 'VALUES',
            'COMMENT', 'IS',
        ];
    }

    public function tokenize()
    {
        while ($this->position < strlen($this->sql_text)) {
            $this->skipWhitespace();
            if ($this->position >= strlen($this->sql_text)) {
                break;
            }

            // Check for SET TERM before normal tokenization
            if ($this->checkSetTerm()) {
                continue;
            }

            // Check for custom terminator (if not default semicolon)
            if ($this->terminator !== ';' && $this->checkCustomTerminator()) {
                continue;
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
                case '.':
                    $this->tokens[] = new SQLToken('DOT', '.', $this->position);
                    $this->position++;
                    break;
                case '"':
                    // Double-quoted identifier (Firebird standard)
                    $this->readDoubleQuotedIdentifier();
                    break;
                case "'":
                    $this->readQuotedString("'");
                    break;
                default:
                    if (ctype_alpha($char) || $char === '_' || $char === '$') {
                        $this->readIdentifierOrKeyword();
                    } elseif (ctype_digit($char) || ($char === '-' && $this->position + 1 < strlen($this->sql_text) && ctype_digit($this->sql_text[$this->position + 1]))) {
                        $this->readNumber();
                    } else {
                        $this->position++;
                    }
                    break;
            }
        }

        return $this->tokens;
    }

    /**
     * Check for SET TERM pattern and update the terminator
     * SET TERM ^^ ;  or  SET TERM ; ^^
     */
    private function checkSetTerm()
    {
        $remaining = substr($this->sql_text, $this->position);

        // Case-insensitive check for "SET TERM"
        $upperRemaining = strtoupper(substr($remaining, 0, 8));
        if (strpos($upperRemaining, 'SET') !== 0) {
            return false;
        }

        // Try to match: SET + whitespace + TERM + whitespace + new_terminator + whitespace + old_terminator
        $saved_position = $this->position;

        // Skip "SET"
        $this->position += 3;
        $this->skipInlineWhitespace();

        $nextWord = $this->peekWord();
        if (strtoupper($nextWord) !== 'TERM') {
            $this->position = $saved_position;
            return false;
        }

        // Skip "TERM"
        $this->position += 4;
        $this->skipInlineWhitespace();

        // Read the new terminator (non-whitespace characters until whitespace)
        $newTerm = '';
        while ($this->position < strlen($this->sql_text) &&
               !ctype_space($this->sql_text[$this->position])) {
            $newTerm .= $this->sql_text[$this->position];
            $this->position++;
        }

        $this->skipInlineWhitespace();

        // Read the old terminator (non-whitespace characters until whitespace or end of line)
        $oldTerm = '';
        while ($this->position < strlen($this->sql_text) &&
               !ctype_space($this->sql_text[$this->position]) &&
               $this->sql_text[$this->position] !== "\n" &&
               $this->sql_text[$this->position] !== "\r") {
            $oldTerm .= $this->sql_text[$this->position];
            $this->position++;
        }

        // Update the terminator
        $this->terminator = $newTerm;

        return true;
    }

    /**
     * Check if the current position matches the custom terminator
     */
    private function checkCustomTerminator()
    {
        $termLen = strlen($this->terminator);
        if ($this->position + $termLen > strlen($this->sql_text)) {
            return false;
        }

        $candidate = substr($this->sql_text, $this->position, $termLen);
        if ($candidate === $this->terminator) {
            // Make sure the terminator is not part of a longer identifier
            $afterTerm = $this->position + $termLen;
            if ($afterTerm < strlen($this->sql_text) &&
                (ctype_alnum($this->sql_text[$afterTerm]) || $this->sql_text[$afterTerm] === '_')) {
                return false;
            }

            $this->tokens[] = new SQLToken('SEMICOLON', $this->terminator, $this->position);
            $this->position += $termLen;
            return true;
        }

        return false;
    }

    private function peekWord()
    {
        $word = '';
        $pos = $this->position;
        while ($pos < strlen($this->sql_text) &&
               (ctype_alnum($this->sql_text[$pos]) || $this->sql_text[$pos] === '_')) {
            $word .= $this->sql_text[$pos];
            $pos++;
        }
        return $word;
    }

    private function skipInlineWhitespace()
    {
        while ($this->position < strlen($this->sql_text) &&
               ($this->sql_text[$this->position] === ' ' ||
                $this->sql_text[$this->position] === "\t")) {
            $this->position++;
        }
    }

    private function skipWhitespace()
    {
        while ($this->position < strlen($this->sql_text)) {
            $char = $this->sql_text[$this->position];

            if (ctype_space($char)) {
                $this->position++;
                continue;
            }

            // Skip SQL comments starting with --
            if ($char === '-' && $this->position + 1 < strlen($this->sql_text) &&
                $this->sql_text[$this->position + 1] === '-') {
                $this->skipLineComment();
                continue;
            }

            // Skip multi-line comments /* */
            if ($char === '/' && $this->position + 1 < strlen($this->sql_text) &&
                $this->sql_text[$this->position + 1] === '*') {
                $this->skipBlockComment();
                continue;
            }

            break;
        }
    }

    private function skipLineComment()
    {
        while ($this->position < strlen($this->sql_text) &&
               $this->sql_text[$this->position] !== "\n") {
            $this->position++;
        }
        if ($this->position < strlen($this->sql_text)) {
            $this->position++;
        }
    }

    private function skipBlockComment()
    {
        $this->position += 2; // Skip /*

        while ($this->position + 1 < strlen($this->sql_text)) {
            if ($this->sql_text[$this->position] === '*' &&
                $this->sql_text[$this->position + 1] === '/') {
                $this->position += 2;
                break;
            }
            $this->position++;
        }
    }

    private function readDoubleQuotedIdentifier()
    {
        $start_pos = $this->position;
        $this->position++; // Skip opening quote
        $value = '';

        while ($this->position < strlen($this->sql_text)) {
            $char = $this->sql_text[$this->position];
            if ($char === '"') {
                if ($this->position + 1 < strlen($this->sql_text) &&
                    $this->sql_text[$this->position + 1] === '"') {
                    $value .= '"';
                    $this->position += 2;
                } else {
                    $this->position++;
                    break;
                }
            } else {
                $value .= $char;
                $this->position++;
            }
        }

        $this->tokens[] = new SQLToken('QUOTED_STRING', $value, $start_pos);
    }

    private function readQuotedString($quote_char)
    {
        $start_pos = $this->position;
        $this->position++; // Skip opening quote
        $value = '';

        while ($this->position < strlen($this->sql_text)) {
            $char = $this->sql_text[$this->position];
            if ($char === $quote_char) {
                // Check for escaped quote ''
                if ($this->position + 1 < strlen($this->sql_text) &&
                    $this->sql_text[$this->position + 1] === $quote_char) {
                    $value .= $quote_char;
                    $this->position += 2;
                } else {
                    $this->position++;
                    break;
                }
            } else {
                $value .= $char;
                $this->position++;
            }
        }

        $this->tokens[] = new SQLToken('QUOTED_STRING', $value, $start_pos);
    }

    private function readIdentifierOrKeyword()
    {
        $start_pos = $this->position;
        $value = '';

        while ($this->position < strlen($this->sql_text) &&
               (ctype_alnum($this->sql_text[$this->position]) ||
                $this->sql_text[$this->position] === '_' ||
                $this->sql_text[$this->position] === '$')) {
            $value .= $this->sql_text[$this->position];
            $this->position++;
        }

        $upper_value = strtoupper($value);
        $token_type = in_array($upper_value, $this->keywords) ? 'KEYWORD' : 'IDENTIFIER';
        $this->tokens[] = new SQLToken($token_type, $upper_value, $start_pos);
    }

    private function readNumber()
    {
        $start_pos = $this->position;
        $value = '';

        // Handle negative numbers
        if ($this->sql_text[$this->position] === '-') {
            $value .= '-';
            $this->position++;
        }

        while ($this->position < strlen($this->sql_text) &&
               (ctype_digit($this->sql_text[$this->position]) ||
                $this->sql_text[$this->position] === '.')) {
            $value .= $this->sql_text[$this->position];
            $this->position++;
        }

        $this->tokens[] = new SQLToken('NUMBER', $value, $start_pos);
    }
}
