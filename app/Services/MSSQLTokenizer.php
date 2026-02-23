<?php

namespace App\Services;

class MSSQLTokenizer
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
            'UPDATE', 'SET', 'NO', 'ACTION', 'CHECK', 'WITH',

            // T-SQL specific keywords
            'IDENTITY', 'CLUSTERED', 'NONCLUSTERED', 'GO', 'EXEC', 'EXECUTE',
            'PRINT', 'USE', 'TEXTIMAGE_ON', 'PAD_INDEX', 'FILLFACTOR',
            'IGNORE_DUP_KEY', 'ALLOW_ROW_LOCKS', 'ALLOW_PAGE_LOCKS',
            'OPTIMIZE_FOR_SEQUENTIAL_KEY', 'ROWGUIDCOL', 'SPARSE',
            'ANSI_NULLS', 'QUOTED_IDENTIFIER', 'ANSI_PADDING',
            'NOCHECK', 'REPLICATION', 'PERSISTED',

            // Schema keywords
            'SCHEMA', 'AUTHORIZATION',

            // Constraint keywords
            'ASC', 'DESC', 'OFF',

            // Data types
            'INT', 'INTEGER', 'BIGINT', 'SMALLINT', 'TINYINT',
            'FLOAT', 'REAL', 'DOUBLE', 'PRECISION',
            'NUMERIC', 'DECIMAL', 'MONEY', 'SMALLMONEY',
            'VARCHAR', 'CHAR', 'CHARACTER', 'VARYING', 'TEXT',
            'NVARCHAR', 'NCHAR', 'NTEXT',
            'BINARY', 'VARBINARY', 'IMAGE',
            'BIT', 'UNIQUEIDENTIFIER', 'SQL_VARIANT', 'SYSNAME',
            'XML', 'HIERARCHYID', 'GEOGRAPHY', 'GEOMETRY',
            'DATE', 'TIME', 'DATETIME', 'DATETIME2', 'DATETIMEOFFSET',
            'SMALLDATETIME', 'TIMESTAMP',
            'CURRENT_TIMESTAMP', 'GETDATE', 'GETUTCDATE', 'NEWID', 'NEWSEQUENTIALID',
            'JSON',

            // Table options
            'FILEGROUP',

            // Additional keywords commonly found in SSMS exports
            'AS', 'FOR', 'BEGIN', 'END', 'OBJECT_ID', 'IS',
            'TYPE', 'COLLATE',
            'GENERATED', 'ALWAYS', 'ROW', 'START', 'PERIOD', 'SYSTEM_TIME',
            'SYSTEM_VERSIONING', 'HISTORY_TABLE', 'MAX', 'MASKED',

            // Non-table DDL (to skip)
            'VIEW', 'PROCEDURE', 'FUNCTION', 'TRIGGER', 'SEQUENCE',
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
                    // Square bracket quoted identifier
                    $this->readSquareBracketIdentifier();
                    break;
                case '"':
                    // Double-quoted identifier
                    $this->readDoubleQuotedIdentifier();
                    break;
                case "'":
                    $this->readQuotedString("'");
                    break;
                case 'N':
                case 'n':
                    // Check for N'unicode string' prefix
                    if ($this->position + 1 < strlen($this->sql_text) &&
                        $this->sql_text[$this->position + 1] === "'") {
                        $this->position++; // Skip the N
                        $this->readQuotedString("'");
                    } else {
                        $this->readIdentifierOrKeyword();
                    }
                    break;
                case '@':
                    // Skip @@ system variables and @variables
                    $this->skipVariable();
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

        // Check if this is a known keyword — emit as KEYWORD
        $upper_value = strtoupper($value);
        if (in_array($upper_value, $this->keywords)) {
            $this->tokens[] = new SQLToken('KEYWORD', $upper_value, $start_pos);
        } else {
            $this->tokens[] = new SQLToken('QUOTED_STRING', $value, $start_pos);
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

    private function skipVariable()
    {
        // Skip @variable or @@system_variable
        while ($this->position < strlen($this->sql_text) &&
               (ctype_alnum($this->sql_text[$this->position]) ||
                $this->sql_text[$this->position] === '@' ||
                $this->sql_text[$this->position] === '_')) {
            $this->position++;
        }
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

        // Handle GO as a batch separator → emit as SEMICOLON
        if ($upper_value === 'GO') {
            $this->tokens[] = new SQLToken('SEMICOLON', 'GO', $start_pos);
            return;
        }

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
