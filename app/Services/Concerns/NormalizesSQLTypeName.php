<?php

namespace App\Services\Concerns;

/**
 * Shared helper for case-folding SQL type strings without corrupting their
 * parenthesised payload. MySQL is case-insensitive for type names
 * (VARCHAR == varchar) but case-sensitive for ENUM/SET literal values
 * ('Privatkunde' != 'PRIVATKUNDE' != 'privatkunde') and for backtick-quoted
 * identifiers inside GENERATED expressions.
 *
 * Used by both the storage service (writes) and the export controller (reads)
 * so the normalization is identical on both sides.
 */
trait NormalizesSQLTypeName
{
    /**
     * Lowercase only the type name (before the first '(' if any), leave the
     * payload untouched.
     *
     *   "ENUM('Privatkunde','NGO')" → "enum('Privatkunde','NGO')"
     *   "DECIMAL(10,2)"             → "decimal(10,2)"
     *   "VARCHAR"                   → "varchar"
     */
    protected function lowerTypeName(string $fieldType): string
    {
        $openParen = strpos($fieldType, '(');
        if ($openParen === false) {
            return strtolower($fieldType);
        }
        return strtolower(substr($fieldType, 0, $openParen)) . substr($fieldType, $openParen);
    }

    /**
     * Same as lowerTypeName() but uppercases the type name. Used by the SQL
     * export so output looks like `ENUM('Privatkunde','NGO')` even when stored
     * as `enum(...)`.
     */
    protected function upperTypeName(string $fieldType): string
    {
        $openParen = strpos($fieldType, '(');
        if ($openParen === false) {
            return strtoupper($fieldType);
        }
        return strtoupper(substr($fieldType, 0, $openParen)) . substr($fieldType, $openParen);
    }

    /**
     * Split a column-write payload into the structured field_type / field_length /
     * field_precision / field_scale / field_enum_values columns.
     *
     * Accepts two input shapes:
     *
     *   A) Already structured (preferred — current frontend):
     *        data_type='enum', field_enum_values=['a','b','c']
     *        data_type='decimal', field_precision=10, field_scale=2
     *        data_type='varchar', field_length=50
     *
     *   B) Legacy with the payload baked into data_type:
     *        data_type="enum('a','b','c')"
     *        data_type="decimal(10,2)"
     *        data_type="varchar(50)"
     *      The payload is parsed and distributed into the structured columns.
     *
     * Returns an associative array with five keys, ready for SchemaField::create/update.
     */
    protected function splitFieldType(array $columnData): array
    {
        $dataType = (string) ($columnData['data_type'] ?? '');
        $openParen = strpos($dataType, '(');

        // Shape A — bare base type, structured args sit alongside
        if ($openParen === false) {
            $baseName = strtolower(trim($dataType));
            return [
                'field_type' => $baseName,
                'field_length' => $columnData['field_length'] ?? null,
                'field_precision' => $columnData['field_precision'] ?? null,
                'field_scale' => $columnData['field_scale'] ?? null,
                'field_enum_values' => $this->encodeEnumValues($columnData['field_enum_values'] ?? null),
            ];
        }

        // Shape B — payload inside data_type; parse and distribute
        $closeParen = strrpos($dataType, ')');
        $baseName = strtolower(substr($dataType, 0, $openParen));
        $inner = $closeParen !== false && $closeParen > $openParen
            ? substr($dataType, $openParen + 1, $closeParen - $openParen - 1)
            : '';

        if ($baseName === 'enum' || $baseName === 'set') {
            return [
                'field_type' => $baseName,
                'field_length' => null,
                'field_precision' => null,
                'field_scale' => null,
                // Return as PHP array, not JSON-encoded string. The SchemaField
                // model has `'field_enum_values' => 'array'` in its $casts, so
                // Eloquent json_encodes on write and decodes on read. Returning
                // a pre-encoded string here would cause double-encoding when
                // the Eloquent path (create/update) saves the row — the field
                // would end up as a single string in the DB instead of an array.
                'field_enum_values' => $this->parseEnumPayload($inner),
            ];
        }

        if (in_array($baseName, ['decimal', 'numeric', 'float', 'double'], true)) {
            $parts = array_map('trim', explode(',', $inner));
            return [
                'field_type' => $baseName,
                'field_length' => null,
                'field_precision' => isset($parts[0]) && is_numeric($parts[0]) ? (int) $parts[0] : null,
                'field_scale' => isset($parts[1]) && is_numeric($parts[1]) ? (int) $parts[1] : null,
                'field_enum_values' => null,
            ];
        }

        // varchar(50), tinyint(1) — single integer length
        $trimmedInner = trim($inner);
        return [
            'field_type' => $baseName,
            'field_length' => is_numeric($trimmedInner) ? (int) $trimmedInner : ($columnData['field_length'] ?? null),
            'field_precision' => null,
            'field_scale' => null,
            'field_enum_values' => null,
        ];
    }

    /**
     * Normalise an enum_values input to a PHP array or null.
     *
     * Returns an ARRAY (not JSON-string) — see the rationale in splitFieldType():
     * the SchemaField model casts `field_enum_values` as `'array'`, so Eloquent
     * encodes on write. A pre-encoded string would double-encode on save.
     *
     * Accepts:
     *  - already-decoded array  → returned as-is
     *  - JSON-encoded string    → decoded back to array (covers clients that
     *                              stringify before sending)
     *  - null or empty string   → returned as null
     */
    private function encodeEnumValues($values): ?array
    {
        if ($values === null || $values === '') {
            return null;
        }
        if (is_array($values)) {
            return $values;
        }
        if (is_string($values)) {
            $decoded = json_decode($values, true);
            return is_array($decoded) ? $decoded : null;
        }
        return null;
    }

    /**
     * Parse an ENUM/SET payload "'a','b','c'" into ["a","b","c"].
     * Single-quote escape: '' → '.
     */
    private function parseEnumPayload(string $inner): array
    {
        $values = [];
        $len = strlen($inner);
        $i = 0;
        while ($i < $len) {
            while ($i < $len && ($inner[$i] === ' ' || $inner[$i] === ',' || $inner[$i] === "\t")) {
                $i++;
            }
            if ($i >= $len) break;

            if ($inner[$i] !== "'") {
                $start = $i;
                while ($i < $len && $inner[$i] !== ',') {
                    $i++;
                }
                $values[] = trim(substr($inner, $start, $i - $start));
                continue;
            }

            $i++; // skip opening quote
            $buf = '';
            while ($i < $len) {
                if ($inner[$i] === "'") {
                    if ($i + 1 < $len && $inner[$i + 1] === "'") {
                        $buf .= "'";
                        $i += 2;
                        continue;
                    }
                    $i++;
                    break;
                }
                $buf .= $inner[$i];
                $i++;
            }
            $values[] = $buf;
        }
        return $values;
    }
}
