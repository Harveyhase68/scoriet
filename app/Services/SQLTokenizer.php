<?php

namespace App\Services;

class SQLTokenizer
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
            'CREATE', 'TABLE', 'ALTER', 'ADD', 'CONSTRAINT', 'FOREIGN', 'KEY',
            'REFERENCES', 'PRIMARY', 'IF', 'NOT', 'EXISTS', 'NULL', 'DEFAULT',
            'AUTO_INCREMENT', 'UNSIGNED', 'ENGINE', 'UNIQUE', 'INDEX', 'DROP',
            // MySQL table options
            'INNODB', 'MYISAM', 'MEMORY', 'CHARSET', 'COLLATE', 'ROW_FORMAT',
            'COMPRESSED', 'DYNAMIC', 'FIXED', 'REDUNDANT', 'COMPACT',
            // Common MySQL keywords
            'COMMENT', 'ON', 'UPDATE', 'DELETE', 'CASCADE', 'RESTRICT', 'SET', 'NO', 'ACTION', 
            'CURRENT_TIMESTAMP', 'TIMESTAMP', 'DATETIME', 'DATE', 'TIME',
            // Character sets and collations (common ones)
            'UTF8', 'UTF8MB4', 'LATIN1', 'ASCII',
            // Additional MySQL collations commonly found in phpMyAdmin exports
            'UTF8MB4_0900_AI_CI', 'UTF8_GENERAL_CI', 'UTF8_UNICODE_CI',
            'LATIN1_SWEDISH_CI', 'UTF8MB4_UNICODE_CI', 'UTF8MB4_GENERAL_CI',
            // Storage engines and options
            'ARCHIVE', 'BLACKHOLE', 'CSV', 'FEDERATED', 'HEAP', 'MERGE',
            // Additional table options
            'PACK_KEYS', 'DELAY_KEY_WRITE', 'CHECKSUM', 'MIN_ROWS', 'MAX_ROWS',
            'AVG_ROW_LENGTH', 'CONNECTION', 'PASSWORD', 'UNION', 'INSERT_METHOD',
            'DATA', 'DIRECTORY', 'STATS_PERSISTENT', 'STATS_AUTO_RECALC', 'STATS_SAMPLE_PAGES',
            // Additional MySQL export keywords
            'BINARY', 'ZEROFILL', 'ENUM', 'TEXT', 'BLOB', 'MEDIUMTEXT', 'LONGTEXT',
            'TINYTEXT', 'MEDIUMBLOB', 'LONGBLOB', 'TINYBLOB', 'JSON', 'GEOMETRY',
            'POINT', 'LINESTRING', 'POLYGON', 'MULTIPOINT', 'MULTILINESTRING', 'MULTIPOLYGON',
            'GEOMETRYCOLLECTION', 'BIT', 'YEAR', 'SPATIAL', 'FULLTEXT',
            // Additional MySQL data types
            'BIGINT', 'TINYINT', 'SMALLINT', 'MEDIUMINT', 'FLOAT', 'DOUBLE', 'REAL',
            'DECIMAL', 'NUMERIC', 'CHAR', 'VARCHAR', 'VARBINARY', 'LONGBLOB',
            // Index algorithm specifiers
            'USING', 'BTREE', 'HASH',
            // Index column sort order (MySQL 8.0+)
            'ASC', 'DESC',
            // Navicat export specifics
            'CHARACTER', 'INT',
            // Inline constraint keyword
            'CONSTRAINT',
            // MySQL generated columns (GENERATED ALWAYS AS (...) STORED|VIRTUAL)
            'GENERATED', 'ALWAYS', 'AS', 'STORED', 'VIRTUAL', 'INVISIBLE',
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
        // Skip until end of line
        while ($this->position < strlen($this->sql_text) && 
               $this->sql_text[$this->position] !== "\n") {
            $this->position++;
        }
        if ($this->position < strlen($this->sql_text)) {
            $this->position++; // Skip the newline
        }
    }
    
    private function skipBlockComment()
    {
        $this->position += 2; // Skip /*
        
        while ($this->position + 1 < strlen($this->sql_text)) {
            if ($this->sql_text[$this->position] === '*' && 
                $this->sql_text[$this->position + 1] === '/') {
                $this->position += 2; // Skip */
                break;
            }
            $this->position++;
        }
    }

    private function readQuotedString($quote_char)
    {
        $start_pos = $this->position;
        $this->position++; // Skip opening quote
        $value = '';

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

        while ($this->position < strlen($this->sql_text) &&
               (ctype_digit($this->sql_text[$this->position]) ||
                $this->sql_text[$this->position] === '.')) {
            $value .= $this->sql_text[$this->position];
            $this->position++;
        }

        $this->tokens[] = new SQLToken('NUMBER', $value, $start_pos);
    }
}
