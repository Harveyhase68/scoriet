<?php

namespace App\Services;

class MySQLParser
{
    /** @var SQLParser|null Retained so callers can fetch schema-wide defaults after parsing. */
    private $parser;

    public function parseSQL($sql_text)
    {
        try {
            $tokenizer = new SQLTokenizer($sql_text);
            $tokens = $tokenizer->tokenize();

            $this->parser = new SQLParser($tokens, $sql_text);
            return $this->parser->parse();
        } catch (\Exception $e) {
            throw new \Exception('Fehler beim Parsen: '.$e->getMessage());
        }
    }

    /**
     * Schema-level CHARSET/COLLATION discovered during the last parseSQL() run.
     * Returns ['charset' => string|null, 'collation' => string|null].
     */
    public function getSchemaDefaults(): array
    {
        return $this->parser ? $this->parser->getSchemaDefaults() : ['charset' => null, 'collation' => null];
    }
}
