<?php

namespace App\Services;

use Exception;

class SQLParser
{
    private $tokens;

    private $position;

    private $tables;

    private $table_map;

    private $sql_text;

    /**
     * Schema-wide MySQL defaults discovered while parsing. Filled from the
     * first match of either `CREATE DATABASE ... CHARACTER SET=... COLLATE=...`
     * (preferred — unambiguous) or the trailer of the first `CREATE TABLE`.
     * `null` means "not specified in dump"; the storage layer applies its
     * own fallbacks (typically utf8mb4 / utf8mb4_unicode_ci).
     */
    private $schemaDefaults = [
        'charset' => null,
        'collation' => null,
    ];

    public function __construct($tokens, $sql_text = null)
    {
        $this->tokens = $tokens;
        $this->sql_text = $sql_text;
        $this->position = 0;
        $this->tables = [];
        $this->table_map = [];
    }

    /**
     * Schema-level CHARSET/COLLATION discovered during parsing.
     * Keys: 'charset', 'collation'. Either or both may be null.
     */
    public function getSchemaDefaults(): array
    {
        return $this->schemaDefaults;
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
            } elseif ($this->currentTokenMatches('KEYWORD', 'DELIMITER')) {
                // Skip DELIMITER statements - we don't need them for schema
                $this->position++;
                // Skip the delimiter value (e.g., $$, //, etc.)
                if ($this->currentToken()) {
                    $this->position++;
                }
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

        // Check what comes after CREATE
        $nextToken = $this->currentToken();

        // CREATE DATABASE [IF NOT EXISTS] `name` [DEFAULT] CHARACTER SET ... COLLATE ...
        // We don't model databases as entities, but we DO want to capture the
        // schema-wide defaults from the dump because they're the most reliable
        // source (more so than guessing from the first CREATE TABLE).
        // MySQL accepts CREATE DATABASE and CREATE SCHEMA interchangeably.
        if ($nextToken && $nextToken->type === 'IDENTIFIER'
            && in_array(strtoupper($nextToken->value), ['DATABASE', 'SCHEMA'], true)) {
            $this->parseCreateDatabaseStatement();
            return;
        }

        // We only care about CREATE TABLE - skip everything else
        if (!$nextToken || !$this->currentTokenMatches('KEYWORD', 'TABLE')) {
            // Skip this statement (PROCEDURE, TRIGGER, VIEW, FUNCTION, etc.)
            $this->skipToSemicolonOrEnd();
            return;
        }

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

        // Walk the trailing table options (ENGINE, CHARSET, COMMENT='...', AUTO_INCREMENT=...)
        // to pull out the COMMENT — everything else is metadata the schema editor doesn't
        // need to round-trip. The walk stops at the statement terminator.
        $table_comment = $this->parseTableOptions();

        $table = [
            'table_name' => $table_name,
            'fields' => $fields,
            'constraints' => $constraints,
            'comment' => $table_comment,
        ];

        // Check if table already exists - merge instead of duplicate
        if (isset($this->table_map[$table_name])) {
            // Preserve comment from this CREATE TABLE if the existing record didn't have one
            if (!empty($table['comment']) && empty($this->table_map[$table_name]['comment'])) {
                $this->table_map[$table_name]['comment'] = $table['comment'];
            }
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
            } elseif ($this->currentTokenMatches('KEYWORD', 'CONSTRAINT')) {
                $constraints[] = $this->parseInlineConstraint();
            } elseif ($this->currentTokenMatches('KEYWORD', 'FOREIGN')) {
                $constraints[] = $this->parseInlineForeignKey();
            } elseif ($this->currentTokenMatches('KEYWORD', 'SPATIAL') ||
                      $this->currentTokenMatches('KEYWORD', 'FULLTEXT')) {
                $constraints[] = $this->parseSpatialOrFulltextIndex();
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

        // Handle data type with size/value list. We split the payload into
        // structured fields up-front so storage doesn't have to keep stuffing
        // a complex literal into a single varchar(100) field_type column:
        //
        //   VARCHAR(255)        → field_length = 255         (data_type stays "VARCHAR")
        //   TINYINT(1)          → field_length = 1           (data_type stays "TINYINT")
        //   DECIMAL(10,2)       → precision=10, scale=2      (data_type stays "DECIMAL")
        //   ENUM('a','b','c')   → enum_values=['a','b','c']  (data_type stays "ENUM")
        //   SET('x','y')        → enum_values=['x','y']      (data_type stays "SET")
        //
        // Quoted strings keep their value verbatim — case matters for ENUM/SET.
        $field_length = null;
        $field_precision = null;
        $field_scale = null;
        $enum_values = null;

        if ($this->currentTokenMatches('LPAREN')) {
            $this->consumeToken('LPAREN');
            // Collect each comma-separated argument with its token type
            $args = [];
            while (! $this->currentTokenMatches('RPAREN')) {
                $token = $this->consumeToken();
                $args[] = ['type' => $token->type, 'value' => $token->value];
                if ($this->currentTokenMatches('COMMA')) {
                    $this->consumeToken('COMMA');
                }
            }
            $this->consumeToken('RPAREN');

            $baseTypeUpper = strtoupper($data_type);
            if ($baseTypeUpper === 'ENUM' || $baseTypeUpper === 'SET') {
                $enum_values = array_map(fn($a) => $a['value'], $args);
            } elseif (in_array($baseTypeUpper, ['DECIMAL', 'NUMERIC', 'FLOAT', 'DOUBLE'], true)) {
                if (isset($args[0]) && is_numeric($args[0]['value'])) {
                    $field_precision = (int) $args[0]['value'];
                }
                if (isset($args[1]) && is_numeric($args[1]['value'])) {
                    $field_scale = (int) $args[1]['value'];
                }
            } else {
                // VARCHAR/CHAR/TINYINT/... — single integer length
                if (isset($args[0]) && is_numeric($args[0]['value'])) {
                    $field_length = (int) $args[0]['value'];
                }
            }
        }

        // Parse field attributes
        $unsigned = false;
        $auto_increment = false;
        $nullable = true;
        $default_value = null;
        $comment = null;
        $is_generated = false;
        $generation_expression = null;
        $generation_storage = null;

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
                        $default_value = $this->parseDefaultValue();
                        break;
                    case 'COMMENT':
                        $this->consumeToken('KEYWORD', 'COMMENT');
                        $comment_token = $this->consumeToken();
                        if ($comment_token->type === 'QUOTED_STRING') {
                            $comment = $comment_token->value;
                        }
                        break;
                    case 'GENERATED':
                        $is_generated = true;
                        $this->consumeToken('KEYWORD', 'GENERATED');
                        // Optional 'ALWAYS' and 'AS' before the expression
                        if ($this->currentTokenMatches('KEYWORD', 'ALWAYS')) {
                            $this->consumeToken();
                        }
                        if ($this->currentTokenMatches('KEYWORD', 'AS')) {
                            $this->consumeToken();
                        }
                        // Expression in parentheses — extract verbatim from sql_text
                        $generation_expression = $this->collectParenthesizedExpression();
                        // Optional storage modifier: STORED (default in MySQL = VIRTUAL)
                        if ($this->currentTokenMatches('KEYWORD', 'STORED')) {
                            $generation_storage = 'stored';
                            $this->consumeToken();
                        } elseif ($this->currentTokenMatches('KEYWORD', 'VIRTUAL')) {
                            $generation_storage = 'virtual';
                            $this->consumeToken();
                        } else {
                            $generation_storage = 'virtual';
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
            'length' => $field_length,
            'precision' => $field_precision,
            'scale' => $field_scale,
            'enum_values' => $enum_values,
            'unsigned' => $unsigned,
            'nullable' => $nullable,
            'default' => $default_value,
            'auto_increment' => $auto_increment,
            'comment' => $comment,
            'is_generated' => $is_generated,
            'generation_expression' => $generation_expression,
            'generation_storage' => $generation_storage,
        ];
    }

    /**
     * Parse a DEFAULT clause value. Accepts string literals, numbers, NULL,
     * function calls (CURRENT_TIMESTAMP, NOW(), UUID(), ...) and identifiers.
     * Function-call argument lists are consumed via depth-tracked extraction
     * so that DEFAULT CURRENT_TIMESTAMP(6) or DEFAULT (UNIX_TIMESTAMP()) works.
     */
    private function parseDefaultValue()
    {
        // Some MySQL dialects wrap the default in parentheses: DEFAULT (expr)
        if ($this->currentTokenMatches('LPAREN')) {
            return $this->collectParenthesizedExpression();
        }

        $token = $this->consumeToken();
        $value = $token->value;

        // For functions like CURRENT_TIMESTAMP(6) or UUID() consume the args
        if ($this->currentTokenMatches('LPAREN')) {
            $value .= $this->collectParenthesizedExpression();
        }

        if ($token->type === 'QUOTED_STRING') {
            return $value;
        }
        if ($token->type === 'NUMBER') {
            return $value;
        }
        if ($token->type === 'KEYWORD') {
            // CURRENT_TIMESTAMP, NULL, TRUE, FALSE, etc.
            return $value;
        }
        if ($token->type === 'IDENTIFIER') {
            return $value;
        }

        return null;
    }

    /**
     * Collect a parenthesized expression verbatim from the source SQL text.
     * Tracks paren depth so nested parens (e.g. CONCAT(LPAD(...))) are not
     * mistaken for a column boundary. Returns the text INCLUDING the outer
     * parens, e.g. "(trim(concat(...)))".
     *
     * Requires that the current token is an LPAREN. Returns empty string
     * if no source text is available (e.g. parser used without sql_text).
     */
    private function collectParenthesizedExpression(): string
    {
        if (! $this->currentTokenMatches('LPAREN')) {
            return '';
        }

        $startToken = $this->currentToken();
        $startPos = $startToken->position;
        $depth = 0;

        while ($this->currentToken()) {
            $token = $this->currentToken();
            $this->consumeToken();

            if ($token->type === 'LPAREN') {
                $depth++;
            } elseif ($token->type === 'RPAREN') {
                $depth--;
                if ($depth === 0) {
                    if ($this->sql_text !== null) {
                        // Slice INCLUDING the closing paren
                        $endPos = $token->position + 1;
                        return substr($this->sql_text, $startPos, $endPos - $startPos);
                    }
                    return '';
                }
            }
        }

        // Unbalanced — return what we have rather than crash
        return '';
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

            // Skip ASC/DESC after column name (MySQL 8.0+, Navicat exports)
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

        // Optional USING BTREE/HASH (Navicat exports)
        if ($this->currentTokenMatches('KEYWORD', 'USING')) {
            $this->consumeToken('KEYWORD', 'USING');
            $this->consumeToken(); // BTREE or HASH
        }

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

            // Skip ASC/DESC after column name (MySQL 8.0+, Navicat exports)
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

            // Skip ASC/DESC after column name (MySQL 8.0+, Navicat exports)
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

    /**
     * Parse inline CONSTRAINT definitions (Navicat exports)
     * e.g.: CONSTRAINT `fk_name` FOREIGN KEY (`col`) REFERENCES `table` (`col`) ON DELETE RESTRICT
     * e.g.: CONSTRAINT `pk_name` PRIMARY KEY (`id`)
     * e.g.: CONSTRAINT `uq_name` UNIQUE (`email`)
     */
    private function parseInlineConstraint()
    {
        $this->consumeToken('KEYWORD', 'CONSTRAINT');

        // Constraint name
        $constraint_name_token = $this->consumeToken();
        $constraint_name = $constraint_name_token->value;

        // Determine constraint type
        if ($this->currentTokenMatches('KEYWORD', 'PRIMARY')) {
            $result = $this->parsePrimaryKey();
            $result['name'] = $constraint_name;
            return $result;
        } elseif ($this->currentTokenMatches('KEYWORD', 'UNIQUE')) {
            $result = $this->parseUniqueConstraint();
            $result['name'] = $constraint_name;
            return $result;
        } elseif ($this->currentTokenMatches('KEYWORD', 'FOREIGN')) {
            return $this->parseInlineForeignKey($constraint_name);
        }

        // Unknown constraint type - skip to next comma or closing paren
        while ($this->currentToken() &&
               !$this->currentTokenMatches('COMMA') &&
               !$this->currentTokenMatches('RPAREN')) {
            $this->consumeToken();
        }

        return [
            'type' => 'KEY',
            'name' => $constraint_name,
            'columns' => [],
        ];
    }

    /**
     * Parse inline FOREIGN KEY constraint
     * e.g.: FOREIGN KEY (`col`) REFERENCES `table` (`col`) ON DELETE RESTRICT ON UPDATE RESTRICT
     */
    private function parseInlineForeignKey($constraint_name = null)
    {
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

        // Parse ON DELETE and ON UPDATE actions
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

        return [
            'type' => 'FOREIGN KEY',
            'name' => $constraint_name ?? ('fk_' . implode('_', $source_cols)),
            'columns' => $source_cols,
            'references' => [
                'table' => $ref_table,
                'columns' => $ref_cols,
            ],
            'on_delete' => $on_delete,
            'on_update' => $on_update,
        ];
    }

    /**
     * Parse SPATIAL INDEX or FULLTEXT INDEX
     * e.g.: SPATIAL INDEX `idx_geo`(`location`)
     * e.g.: FULLTEXT INDEX `idx_ft`(`content`)
     */
    private function parseSpatialOrFulltextIndex()
    {
        $index_type = $this->consumeToken('KEYWORD')->value; // SPATIAL or FULLTEXT

        // Optional KEY or INDEX keyword
        if ($this->currentTokenMatches('KEYWORD', 'KEY') ||
            $this->currentTokenMatches('KEYWORD', 'INDEX')) {
            $this->consumeToken();
        }

        // Index name (optional)
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

    private function parseAlterStatement()
    {
        $this->consumeToken('KEYWORD', 'ALTER');

        // Check what comes after ALTER
        $nextToken = $this->currentToken();

        // We only care about ALTER TABLE - skip everything else
        if (!$nextToken || !$this->currentTokenMatches('KEYWORD', 'TABLE')) {
            // Skip this statement (PROCEDURE, TRIGGER, VIEW, FUNCTION, etc.)
            $this->skipToSemicolonOrEnd();
            return;
        }

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

        // Check if this is ADD CONSTRAINT (Foreign Key) - the only ALTER we care about
        if (!$this->currentTokenMatches('KEYWORD', 'ADD')) {
            // Skip this ALTER TABLE (MODIFY, DROP, CHANGE, etc.)
            $this->skipToSemicolonOrEnd();
            return;
        }

        // Loop to handle multiple ADD CONSTRAINT in one ALTER TABLE statement
        // e.g., ALTER TABLE `t` ADD CONSTRAINT `fk1` ..., ADD CONSTRAINT `fk2` ...;
        while ($this->currentTokenMatches('KEYWORD', 'ADD')) {
            $this->consumeToken('KEYWORD', 'ADD');

            // Check if it's ADD CONSTRAINT - if not, skip to next comma or end
            if (!$this->currentTokenMatches('KEYWORD', 'CONSTRAINT')) {
                // Skip this ADD clause (ADD INDEX, ADD FULLTEXT KEY, etc.)
                $this->skipToCommaOrSemicolon();
                // If there's a comma, continue to next ADD
                if ($this->currentTokenMatches('COMMA')) {
                    $this->consumeToken('COMMA');
                    continue;
                }
                break;
            }

            $this->consumeToken('KEYWORD', 'CONSTRAINT');

            // Constraint name
            $constraint_name_token = $this->consumeToken();
            $constraint_name = $constraint_name_token->value;

            // Check if it's a FOREIGN KEY constraint
            if (!$this->currentTokenMatches('KEYWORD', 'FOREIGN')) {
                // Skip non-FK constraints (PRIMARY KEY, UNIQUE, CHECK, etc.)
                $this->skipToCommaOrSemicolon();
                if ($this->currentTokenMatches('COMMA')) {
                    $this->consumeToken('COMMA');
                    continue;
                }
                break;
            }

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

            // Check for ON DELETE/UPDATE
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

            // Check for comma (more ADD clauses follow) or semicolon (end)
            if ($this->currentTokenMatches('COMMA')) {
                $this->consumeToken('COMMA');
                // Continue loop to parse next ADD CONSTRAINT
            } else {
                // End of ALTER TABLE statement
                break;
            }
        }

        // Skip any remaining tokens until semicolon
        $this->skipToSemicolonOrEnd();
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

        // Check what comes after DROP
        $nextToken = $this->currentToken();

        // We only care about DROP TABLE - skip everything else
        if (!$nextToken || !$this->currentTokenMatches('KEYWORD', 'TABLE')) {
            // Skip this statement (PROCEDURE, TRIGGER, VIEW, FUNCTION, etc.)
            $this->skipToSemicolonOrEnd();
            return;
        }

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

    /**
     * Walk the trailing CREATE TABLE options up to the statement terminator.
     *
     * Extracts:
     *   - COMMENT='...' or COMMENT 'x'             → table-level comment
     *   - DEFAULT CHARSET=utf8mb4                  → schema_defaults['charset']  (first table wins)
     *   - COLLATE=utf8mb4_unicode_ci               → schema_defaults['collation'] (first table wins)
     *
     * Everything else (ENGINE, AUTO_INCREMENT, ROW_FORMAT, ...) is skipped.
     * The CHARSET/COLLATE values only update schemaDefaults if not yet set,
     * so a preceding `CREATE DATABASE` (which is the authoritative source)
     * takes precedence over subsequent `CREATE TABLE` trailers.
     */
    private function parseTableOptions(): ?string
    {
        $comment = null;

        while ($this->position < count($this->tokens) &&
               ! $this->currentTokenMatches('SEMICOLON')) {

            $token = $this->currentToken();

            if ($token->type === 'KEYWORD' && $token->value === 'COMMENT') {
                $this->consumeToken();
                if ($this->currentTokenMatches('EQUALS')) {
                    $this->consumeToken();
                }
                $valueToken = $this->currentToken();
                if ($valueToken && $valueToken->type === 'QUOTED_STRING') {
                    $comment = $valueToken->value;
                    $this->consumeToken();
                }
                continue;
            }

            // DEFAULT CHARSET=utf8mb4   (DEFAULT is optional)
            // CHARSET=utf8mb4
            // CHARACTER SET = utf8mb4
            if ($token->type === 'KEYWORD' && in_array($token->value, ['CHARSET', 'CHARACTER'], true)) {
                $this->consumeToken();
                if ($this->currentTokenMatches('KEYWORD', 'SET')) {
                    $this->consumeToken();
                }
                if ($this->currentTokenMatches('EQUALS')) {
                    $this->consumeToken();
                }
                $valueToken = $this->currentToken();
                if ($valueToken && in_array($valueToken->type, ['IDENTIFIER', 'KEYWORD', 'QUOTED_STRING'], true)) {
                    if ($this->schemaDefaults['charset'] === null) {
                        $this->schemaDefaults['charset'] = strtolower($valueToken->value);
                    }
                    $this->consumeToken();
                }
                continue;
            }

            if ($token->type === 'KEYWORD' && $token->value === 'COLLATE') {
                $this->consumeToken();
                if ($this->currentTokenMatches('EQUALS')) {
                    $this->consumeToken();
                }
                $valueToken = $this->currentToken();
                if ($valueToken && in_array($valueToken->type, ['IDENTIFIER', 'KEYWORD', 'QUOTED_STRING'], true)) {
                    if ($this->schemaDefaults['collation'] === null) {
                        $this->schemaDefaults['collation'] = strtolower($valueToken->value);
                    }
                    $this->consumeToken();
                }
                continue;
            }

            // DEFAULT is just a modifier — consume and keep going
            if ($token->type === 'KEYWORD' && $token->value === 'DEFAULT') {
                $this->consumeToken();
                continue;
            }

            $this->position++;
        }

        if ($this->currentTokenMatches('SEMICOLON')) {
            $this->consumeToken('SEMICOLON');
        }

        return $comment;
    }

    /**
     * Parse `CREATE DATABASE [IF NOT EXISTS] name [DEFAULT] CHARACTER SET = ...
     * [DEFAULT] COLLATE = ...;`
     *
     * Updates schemaDefaults unconditionally because CREATE DATABASE is the
     * authoritative source for schema-wide encoding (more reliable than
     * inferring from the first CREATE TABLE which may have a per-table
     * override). The database name itself is discarded — we don't model it.
     */
    private function parseCreateDatabaseStatement(): void
    {
        // Consume "DATABASE" (tokenized as IDENTIFIER since it's not in the keyword list)
        $this->consumeToken();

        if ($this->currentTokenMatches('KEYWORD', 'IF')) {
            $this->consumeToken();
            if ($this->currentTokenMatches('KEYWORD', 'NOT')) $this->consumeToken();
            if ($this->currentTokenMatches('KEYWORD', 'EXISTS')) $this->consumeToken();
        }

        // Database name — could be identifier or backtick-quoted string
        if ($this->currentToken()) {
            $this->consumeToken();
        }

        while ($this->position < count($this->tokens) &&
               ! $this->currentTokenMatches('SEMICOLON')) {
            $token = $this->currentToken();

            if ($token->type === 'KEYWORD' && in_array($token->value, ['CHARSET', 'CHARACTER'], true)) {
                $this->consumeToken();
                if ($this->currentTokenMatches('KEYWORD', 'SET')) $this->consumeToken();
                if ($this->currentTokenMatches('EQUALS')) $this->consumeToken();
                $valueToken = $this->currentToken();
                if ($valueToken && in_array($valueToken->type, ['IDENTIFIER', 'KEYWORD', 'QUOTED_STRING'], true)) {
                    // CREATE DATABASE wins over any subsequent CREATE TABLE trailer
                    $this->schemaDefaults['charset'] = strtolower($valueToken->value);
                    $this->consumeToken();
                }
                continue;
            }

            if ($token->type === 'KEYWORD' && $token->value === 'COLLATE') {
                $this->consumeToken();
                if ($this->currentTokenMatches('EQUALS')) $this->consumeToken();
                $valueToken = $this->currentToken();
                if ($valueToken && in_array($valueToken->type, ['IDENTIFIER', 'KEYWORD', 'QUOTED_STRING'], true)) {
                    $this->schemaDefaults['collation'] = strtolower($valueToken->value);
                    $this->consumeToken();
                }
                continue;
            }

            if ($token->type === 'KEYWORD' && $token->value === 'DEFAULT') {
                $this->consumeToken();
                continue;
            }

            $this->position++;
        }

        if ($this->currentTokenMatches('SEMICOLON')) {
            $this->consumeToken('SEMICOLON');
        }
    }

    /**
     * Skip tokens until we hit a comma or semicolon (for multi-clause ALTER TABLE)
     * Handles nested parentheses correctly
     */
    private function skipToCommaOrSemicolon()
    {
        $depth = 0;
        while ($this->position < count($this->tokens)) {
            if ($this->currentTokenMatches('LPAREN')) {
                $depth++;
                $this->position++;
            } elseif ($this->currentTokenMatches('RPAREN')) {
                $depth--;
                $this->position++;
            } elseif ($depth === 0 && ($this->currentTokenMatches('COMMA') || $this->currentTokenMatches('SEMICOLON'))) {
                // Found comma or semicolon at top level - stop here
                break;
            } else {
                $this->position++;
            }
        }
    }
}
