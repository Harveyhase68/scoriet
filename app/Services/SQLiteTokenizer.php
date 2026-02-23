<?php

namespace App\Services;

class SQLiteTokenizer
{
    private $sql_text;

    private $position;

    private $tokens;

    private $keywords;

    public function __construct($sql_text)
    {
        $this->sql_text = trim($sql_text);
        $this->position = 0;
        $this->tokens = [];
        $this->keywords = [
            // DDL keywords
            'CREATE', 'TABLE', 'ALTER', 'ADD', 'CONSTRAINT', 'FOREIGN', 'KEY',
            'REFERENCES', 'PRIMARY', 'IF', 'NOT', 'EXISTS', 'NULL', 'DEFAULT',
            'UNIQUE', 'INDEX', 'DROP', 'CASCADE', 'RESTRICT', 'ON', 'DELETE',
            'UPDATE', 'SET', 'NO', 'ACTION', 'CHECK',

            // SQLite-specific keywords
            'AUTOINCREMENT', 'ROWID', 'WITHOUT', 'STRICT', 'TEMPORARY', 'TEMP',
            'ABORT', 'FAIL', 'IGNORE', 'REPLACE', 'ROLLBACK', 'CONFLICT',
            'GLOB', 'REGEXP', 'MATCH', 'RENAME', 'COLUMN', 'TO',
            'COLLATE', 'ASC', 'DESC', 'CURRENT_TIMESTAMP', 'CURRENT_DATE', 'CURRENT_TIME',

            // Data types (SQLite is flexible but these are common)
            'INTEGER', 'INT', 'TINYINT', 'SMALLINT', 'MEDIUMINT', 'BIGINT',
            'REAL', 'FLOAT', 'DOUBLE', 'PRECISION',
            'NUMERIC', 'DECIMAL',
            'TEXT', 'CLOB', 'VARCHAR', 'CHAR', 'CHARACTER', 'VARYING',
            'NCHAR', 'NVARCHAR', 'NATIVE',
            'BLOB', 'NONE',
            'BOOLEAN', 'DATE', 'DATETIME', 'TIMESTAMP', 'TIME',
            'JSON',

            // Non-table DDL (to skip)
            'VIEW', 'TRIGGER', 'VIRTUAL', 'USING',
            'BEGIN', 'END', 'FOR', 'EACH', 'ROW', 'WHEN', 'THEN', 'ELSE',
            'NEW', 'OLD', 'AFTER', 'BEFORE', 'INSTEAD', 'OF',
            'INSERT', 'INTO', 'VALUES',

            // Transaction control (to skip)
            'BEGIN', 'COMMIT', 'ROLLBACK', 'TRANSACTION', 'SAVEPOINT', 'RELEASE',

            // DML keywords (to skip)
            'DELETE', 'UPDATE', 'SELECT', 'WHERE', 'FROM',

            // COMMENT keyword (not used in SQLite but may appear)
            'COMMENT',
        ];
    }

    public function tokenize()
    {
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
                case '.':
                    $this->tokens[] = new SQLToken('DOT', '.', $this->position);
                    $this->position++;
                    break;
                case '[':
                    // Square bracket quoted identifier [identifier]
                    $this->readSquareBracketIdentifier();
                    break;
                case '"':
                    // Double-quoted identifier
                    $this->readDoubleQuotedIdentifier();
                    break;
                case '`':
                    // Backtick-quoted identifier
                    $this->readQuotedString('`');
                    break;
                case "'":
                    $this->readQuotedString("'");
                    break;
                default:
                    if (ctype_alpha($char) || $char === '_') {
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

    private function readSquareBracketIdentifier()
    {
        $start_pos = $this->position;
        $this->position++; // Skip [
        $value = '';

        while ($this->position < strlen($this->sql_text)) {
            $char = $this->sql_text[$this->position];
            if ($char === ']') {
                $this->position++;
                break;
            }
            $value .= $char;
            $this->position++;
        }

        $this->tokens[] = new SQLToken('QUOTED_STRING', $value, $start_pos);
    }

    private function readDoubleQuotedIdentifier()
    {
        $start_pos = $this->position;
        $this->position++; // Skip opening quote
        $value = '';

        while ($this->position < strlen($this->sql_text)) {
            $char = $this->sql_text[$this->position];
            if ($char === '"') {
                // Check for escaped double quote ""
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
                // Check for escaped quote ('' in SQL)
                if ($this->position + 1 < strlen($this->sql_text) &&
                    $this->sql_text[$this->position + 1] === $quote_char) {
                    $value .= $quote_char;
                    $this->position += 2;
                } else {
                    $this->position++;
                    break;
                }
            } elseif ($char === '\\' && $this->position + 1 < strlen($this->sql_text)) {
                // Handle backslash escapes
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

    private function readIdentifierOrKeyword()
    {
        $start_pos = $this->position;
        $value = '';

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
