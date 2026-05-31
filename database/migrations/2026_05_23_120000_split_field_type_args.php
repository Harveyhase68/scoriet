<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Splits the parenthesised payload of field_type into structured columns
 * so templates and gtree get clean values instead of having to re-parse
 * "enum('a','b','c')" strings out of a varchar(100):
 *
 *   field_type='enum'      + field_enum_values=["a","b","c"]
 *   field_type='set'       + field_enum_values=["x","y"]
 *   field_type='decimal'   + field_precision=10  + field_scale=2
 *   field_type='varchar'   + field_length=50         (unchanged)
 *   field_type='tinyint'   + field_length=1          (unchanged)
 *
 * Why: varchar(100) for enum payload silently truncated large sets, and
 * a template like {:if item.type eq "ENUM":} could never match because
 * item.type was the full literal "ENUM('Privatkunde','NGO',...)".
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schema_fields', function (Blueprint $table) {
            $table->unsignedInteger('field_precision')->nullable()->after('field_type');
            $table->unsignedInteger('field_scale')->nullable()->after('field_precision');
            $table->json('field_enum_values')->nullable()->after('field_scale');
        });

        // Walk existing rows and split parenthesised payloads into the new columns.
        // Done in PHP rather than SQL because parsing 'a','b','c' correctly
        // (handling escaped quotes) is awkward to express in pure SQL.
        DB::table('schema_fields')->orderBy('id')->chunkById(500, function ($fields) {
            foreach ($fields as $field) {
                $type = (string) $field->field_type;
                $openParen = strpos($type, '(');
                if ($openParen === false) {
                    continue;
                }
                $closeParen = strrpos($type, ')');
                if ($closeParen === false || $closeParen <= $openParen) {
                    continue;
                }

                $baseName = strtolower(substr($type, 0, $openParen));
                $inner = substr($type, $openParen + 1, $closeParen - $openParen - 1);

                if ($baseName === 'enum' || $baseName === 'set') {
                    $values = self::parseQuotedCsv($inner);
                    DB::table('schema_fields')->where('id', $field->id)->update([
                        'field_type' => $baseName,
                        'field_enum_values' => json_encode($values, JSON_UNESCAPED_UNICODE),
                    ]);
                } elseif ($baseName === 'decimal' || $baseName === 'numeric') {
                    [$precision, $scale] = self::parseDecimalArgs($inner);
                    DB::table('schema_fields')->where('id', $field->id)->update([
                        'field_type' => $baseName,
                        'field_precision' => $precision,
                        'field_scale' => $scale,
                    ]);
                }
                // varchar(N), tinyint(N) etc. already use field_length — leave field_type alone
                // (the length-suffix stays in field_type for now; a separate pass would be
                // needed to also strip it, but it's harmless because Parser/Storage
                // will produce the bare base type going forward).
            }
        });
    }

    public function down(): void
    {
        Schema::table('schema_fields', function (Blueprint $table) {
            $table->dropColumn(['field_precision', 'field_scale', 'field_enum_values']);
        });
    }

    /**
     * Parse a MySQL ENUM/SET inner payload like "'a','b','c'" into ["a","b","c"].
     * Handles single-quote-escape ('' → ').
     */
    private static function parseQuotedCsv(string $inner): array
    {
        $values = [];
        $len = strlen($inner);
        $i = 0;
        while ($i < $len) {
            // Skip whitespace and commas between values
            while ($i < $len && ($inner[$i] === ' ' || $inner[$i] === ',' || $inner[$i] === "\t")) {
                $i++;
            }
            if ($i >= $len) break;

            if ($inner[$i] !== "'") {
                // Unquoted value (shouldn't happen in proper SQL, but be permissive)
                $start = $i;
                while ($i < $len && $inner[$i] !== ',') {
                    $i++;
                }
                $values[] = trim(substr($inner, $start, $i - $start));
                continue;
            }

            // Quoted value: read until matching '. '' inside escapes to '.
            $i++; // skip opening quote
            $buf = '';
            while ($i < $len) {
                if ($inner[$i] === "'") {
                    if ($i + 1 < $len && $inner[$i + 1] === "'") {
                        $buf .= "'";
                        $i += 2;
                        continue;
                    }
                    $i++; // closing quote
                    break;
                }
                $buf .= $inner[$i];
                $i++;
            }
            $values[] = $buf;
        }
        return $values;
    }

    /**
     * Parse "10,2" → [10, 2]. Tolerates whitespace.
     */
    private static function parseDecimalArgs(string $inner): array
    {
        $parts = array_map('trim', explode(',', $inner));
        $precision = isset($parts[0]) && is_numeric($parts[0]) ? (int) $parts[0] : null;
        $scale = isset($parts[1]) && is_numeric($parts[1]) ? (int) $parts[1] : null;
        return [$precision, $scale];
    }
};
