<?php

namespace App\Services;

class PostgreSQLTokenizer
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
            // PostgreSQL DDL keywords
            'CREATE', 'TABLE', 'ALTER', 'ADD', 'CONSTRAINT', 'FOREIGN', 'KEY',
            'REFERENCES', 'PRIMARY', 'IF', 'NOT', 'EXISTS', 'NULL', 'DEFAULT',
            'UNIQUE', 'INDEX', 'DROP', 'CASCADE', 'RESTRICT', 'ON', 'DELETE',
            'UPDATE', 'SET', 'NO', 'ACTION', 'CHECK', 'EXCLUDE', 'USING',

            // PostgreSQL-specific keywords
            'SERIAL', 'BIGSERIAL', 'SMALLSERIAL', 'SEQUENCE', 'GENERATED',
            'ALWAYS', 'BY', 'AS', 'IDENTITY', 'INCREMENT', 'MINVALUE', 'MAXVALUE',
            'START', 'CACHE', 'CYCLE', 'OWNED', 'NONE', 'STORED', 'VIRTUAL',

            // PostgreSQL schema keywords
            'SCHEMA', 'OWNER', 'TO', 'TABLESPACE', 'INHERITS', 'PARTITION',
            'OF', 'FOR', 'VALUES', 'FROM', 'WITH', 'WITHOUT', 'OIDS', 'FILLFACTOR',

            // PostgreSQL data types
            'INTEGER', 'INT', 'INT2', 'INT4', 'INT8', 'SMALLINT', 'BIGINT',
            'REAL', 'FLOAT', 'FLOAT4', 'FLOAT8', 'DOUBLE', 'PRECISION',
            'NUMERIC', 'DECIMAL', 'MONEY',
            'VARCHAR', 'CHAR', 'CHARACTER', 'VARYING', 'TEXT', 'BPCHAR',
            'BYTEA', 'BIT', 'VARBIT',
            'BOOLEAN', 'BOOL',
            'DATE', 'TIME', 'TIMESTAMP', 'TIMESTAMPTZ', 'TIMETZ', 'INTERVAL',
            'ZONE', 'CURRENT_TIMESTAMP', 'CURRENT_DATE', 'CURRENT_TIME', 'NOW',
            'UUID', 'JSON', 'JSONB', 'XML', 'HSTORE',
            'POINT', 'LINE', 'LSEG', 'BOX', 'PATH', 'POLYGON', 'CIRCLE',
            'CIDR', 'INET', 'MACADDR', 'MACADDR8',
            'TSVECTOR', 'TSQUERY',
            'ARRAY', 'RANGE', 'INT4RANGE', 'INT8RANGE', 'NUMRANGE', 'TSRANGE',
            'TSTZRANGE', 'DATERANGE',

            // PostgreSQL index types and sort order
            'BTREE', 'HASH', 'GIST', 'SPGIST', 'GIN', 'BRIN', 'CONCURRENTLY',
            'ASC', 'DESC',

            // PostgreSQL constraints
            'DEFERRABLE', 'INITIALLY', 'DEFERRED', 'IMMEDIATE', 'MATCH',
            'FULL', 'PARTIAL', 'SIMPLE',

            // PostgreSQL comments
            'COMMENT', 'IS',

            // PostgreSQL sequences and triggers (to skip)
            'FUNCTION', 'PROCEDURE', 'TRIGGER', 'VIEW', 'MATERIALIZED',
            'EXTENSION', 'TYPE', 'DOMAIN', 'AGGREGATE', 'OPERATOR',
            'RULE', 'POLICY', 'PUBLICATION', 'SUBSCRIPTION',

            // Other common keywords
            'TEMPORARY', 'TEMP', 'UNLOGGED', 'LIKE', 'INCLUDING', 'EXCLUDING',
            'DEFAULTS', 'CONSTRAINTS', 'INDEXES', 'STORAGE', 'COMMENTS', 'ALL',
            'STATISTICS', 'COLLATE', 'COLLATION',
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
                case '[':
                    // PostgreSQL array notation - skip []
                    $this->tokens[] = new SQLToken('LBRACKET', '[', $this->position);
                    $this->position++;
                    break;
                case ']':
                    $this->tokens[] = new SQLToken('RBRACKET', ']', $this->position);
                    $this->position++;
                    break;
                case '.':
                    // Dot for schema.table notation
                    $this->tokens[] = new SQLToken('DOT', '.', $this->position);
                    $this->position++;
                    break;
                case ':':
                    // PostgreSQL type cast ::
                    if ($this->position + 1 < strlen($this->sql_text) &&
                        $this->sql_text[$this->position + 1] === ':') {
                        $this->tokens[] = new SQLToken('TYPECAST', '::', $this->position);
                        $this->position += 2;
                    } else {
                        $this->position++;
                    }
                    break;
                case '"':
                    // PostgreSQL uses double quotes for identifiers
                    $this->readDoubleQuotedIdentifier();
                    break;
                case "'":
                    $this->readQuotedString("'");
                    break;
                case '$':
                    // PostgreSQL dollar-quoted strings ($$...$$)
                    $this->readDollarQuotedString();
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

    private function readDollarQuotedString()
    {
        $start_pos = $this->position;

        // Read the dollar tag (e.g., $$ or $tag$)
        $tag = '$';
        $this->position++;

        while ($this->position < strlen($this->sql_text) &&
               $this->sql_text[$this->position] !== '$') {
            $tag .= $this->sql_text[$this->position];
            $this->position++;
        }
        $tag .= '$';
        $this->position++; // Skip closing $

        // Now find the closing tag
        $value = '';
        $tagLength = strlen($tag);

        while ($this->position < strlen($this->sql_text)) {
            // Check if we've found the closing tag
            if (substr($this->sql_text, $this->position, $tagLength) === $tag) {
                $this->position += $tagLength;
                break;
            }
            $value .= $this->sql_text[$this->position];
            $this->position++;
        }

        // For schema parsing, we typically skip dollar-quoted content (function bodies, etc.)
        // Just mark it as a quoted string
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

        // KEYWORDS get uppercase-normalized for case-insensitive matching.
        // IDENTIFIERS (table/column names) keep their original case.
        //
        // PostgreSQL technically folds unquoted identifiers to lowercase per
        // SQL standard, but for an *import* we keep the source case — the user
        // probably wrote `count_id` because they want `count_id`, not because
        // they expect PG's identifier-folding to silently rewrite it.
        // Quoted identifiers (`"COUNT_ID"`) take a different tokenizer path
        // and were already case-preserving — this fix just makes the unquoted
        // path consistent with that.
        $upper_value = strtoupper($value);
        if (in_array($upper_value, $this->keywords)) {
            $this->tokens[] = new SQLToken('KEYWORD', $upper_value, $start_pos);
        } else {
            $this->tokens[] = new SQLToken('IDENTIFIER', $value, $start_pos);
        }
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
