<?php

namespace App\Services;

use App\Services\SQLTokenizer;
use App\Services\SQLParser;

class MySQLParser {
    public function parseSQL($sql_text) {
        try {
            $tokenizer = new SQLTokenizer($sql_text);
            $tokens = $tokenizer->tokenize();
            
            $parser = new SQLParser($tokens);
            $tables = $parser->parse();
            
            return $tables;
        } catch (\Exception $e) {
            throw new \Exception("Fehler beim Parsen: " . $e->getMessage());
        }
    }
}