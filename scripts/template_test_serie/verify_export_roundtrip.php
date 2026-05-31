<?php

require __DIR__ . '/../../vendor/autoload.php';
$app = require __DIR__ . '/../../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Services\MySQLParser;
use App\Models\SchemaTable;
use App\Models\SchemaField;

// Round-trip simulation: parse SQL → simulate storage → simulate export.
// We don't touch the real DB — we build the same struct the controller
// would build and walk the export generator on it.

$sql = <<<'SQL'
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` bigint NOT NULL AUTO_INCREMENT COMMENT 'User ID',
  `user_no` bigint DEFAULT NULL,
  `user_is_male` tinyint(1) DEFAULT NULL,
  `user_type` enum('Privatkunde','Firmenkunde','Behörde','NGO') DEFAULT NULL,
  `user_complaints` set('too laud','too fast','too expensive','too much') DEFAULT NULL,
  `user_balance` decimal(10,2) DEFAULT NULL,
  `user_last_edited` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Last edited',
  `user_display` varchar(120) GENERATED ALWAYS AS (concat(_utf8mb4'U-',`user_no`)) STORED,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB COMMENT='Benutzertabelle';
SQL;

echo "════════════════════════════════════════════════════════════════════════\n";
echo "STEP 1: Parse SQL\n";
echo "════════════════════════════════════════════════════════════════════════\n";
$parser = new MySQLParser();
$parsedTables = $parser->parseSQL($sql);
$parsed = $parsedTables[0];
echo "Parsed " . count($parsed['fields']) . " fields, table comment: " . var_export($parsed['comment'] ?? null, true) . "\n";
foreach ($parsed['fields'] as $f) {
    $bits = [];
    if (!empty($f['is_generated'])) $bits[] = 'GENERATED(' . $f['generation_storage'] . ')';
    if (!empty($f['comment'])) $bits[] = "comment='{$f['comment']}'";
    if ($f['default'] !== null) $bits[] = "default={$f['default']}";
    echo "  • {$f['name']} | {$f['type']} " . ($bits ? '[' . implode(', ', $bits) . ']' : '') . "\n";
}

echo "\n════════════════════════════════════════════════════════════════════════\n";
echo "STEP 2: Generate MySQL export from the parsed struct (without DB roundtrip)\n";
echo "════════════════════════════════════════════════════════════════════════\n";

// Build a fake field-like object that matches what the export expects
$mockFields = array_map(function($f) {
    return (object)[
        'field_name' => $f['name'],
        // Mock the lowerTypeName() trait — lowercase only the type name, keep payload as-is
        'field_type' => (function($t) {
            $p = strpos($t, '(');
            return $p === false ? strtolower($t) : strtolower(substr($t, 0, $p)) . substr($t, $p);
        })($f['type']),
        'is_unsigned' => $f['unsigned'],
        'is_nullable' => $f['nullable'],
        'is_auto_increment' => $f['auto_increment'],
        'default_value' => $f['default'],
        'comment' => $f['comment'],
        'is_generated' => $f['is_generated'],
        'generation_expression' => $f['generation_expression'],
        'generation_storage' => $f['generation_storage'],
    ];
}, $parsed['fields']);

// Reproduce the field generation block from generateMySQLScript()
// Same upperTypeName() helper the real exporter uses
$upperTypeName = function(string $fieldType): string {
    $openParen = strpos($fieldType, '(');
    if ($openParen === false) return strtoupper($fieldType);
    return strtoupper(substr($fieldType, 0, $openParen)) . substr($fieldType, $openParen);
};

$fieldLines = [];
foreach ($mockFields as $field) {
    $fieldDef = '  `' . $field->field_name . '` ' . $upperTypeName($field->field_type);
    if ($field->is_unsigned) $fieldDef .= ' UNSIGNED';

    if ($field->is_generated && !empty($field->generation_expression)) {
        $storage = strtoupper($field->generation_storage ?? 'virtual');
        $fieldDef .= ' GENERATED ALWAYS AS ' . $field->generation_expression . ' ' . $storage;
        if (!$field->is_nullable) $fieldDef .= ' NOT NULL';
    } else {
        if (!$field->is_nullable) $fieldDef .= ' NOT NULL';
        if ($field->is_auto_increment) $fieldDef .= ' AUTO_INCREMENT';
        if ($field->default_value !== null) {
            $upperValue = strtoupper($field->default_value);
            if (in_array($upperValue, ['CURRENT_TIMESTAMP', 'NOW()'])) {
                $fieldDef .= ' DEFAULT ' . $upperValue;
            } elseif ($upperValue === 'NULL') {
                $fieldDef .= ' DEFAULT NULL';
            } elseif (is_numeric($field->default_value)) {
                $fieldDef .= ' DEFAULT ' . $field->default_value;
            } else {
                $fieldDef .= " DEFAULT '" . addslashes($field->default_value) . "'";
            }
        }
    }

    if ($field->comment) {
        $fieldDef .= " COMMENT '" . addslashes($field->comment) . "'";
    }
    $fieldLines[] = $fieldDef;
}

$tableCommentClause = !empty($parsed['comment']) ? " COMMENT='" . addslashes($parsed['comment']) . "'" : '';
$exportedSQL = "CREATE TABLE `{$parsed['table_name']}` (\n" . implode(",\n", $fieldLines) . ",\n  PRIMARY KEY (`user_id`)\n) ENGINE=InnoDB{$tableCommentClause};\n";
echo $exportedSQL;

echo "\n════════════════════════════════════════════════════════════════════════\n";
echo "STEP 3: Re-parse the exported SQL\n";
echo "════════════════════════════════════════════════════════════════════════\n";

$reparsedTables = $parser->parseSQL($exportedSQL);
$reparsed = $reparsedTables[0];

echo "Re-parsed " . count($reparsed['fields']) . " fields\n";
$ok = true;
foreach ($reparsed['fields'] as $i => $f) {
    $orig = $parsed['fields'][$i];
    $match = $orig['name'] === $f['name']
          && strcasecmp($orig['type'], $f['type']) === 0  // type is case-insensitive (varchar = VARCHAR), but payload preserves case
          && substr($orig['type'], strpos($orig['type'], '(') ?: PHP_INT_MAX) === substr($f['type'], strpos($f['type'], '(') ?: PHP_INT_MAX)
          && $orig['is_generated'] === $f['is_generated']
          && trim((string)($orig['generation_expression'] ?? '')) === trim((string)($f['generation_expression'] ?? ''))
          && $orig['generation_storage'] === $f['generation_storage']
          && $orig['comment'] === $f['comment']
          && $orig['default'] === $f['default'];

    echo ($match ? '  ✓' : '  ✗') . " {$f['name']}\n";
    if (!$match) {
        $ok = false;
        echo "     ORIG: " . json_encode([
            'gen' => $orig['is_generated'],
            'expr' => $orig['generation_expression'],
            'stor' => $orig['generation_storage'],
            'def' => $orig['default'],
            'cmt' => $orig['comment'],
        ]) . "\n";
        echo "     ROUND: " . json_encode([
            'gen' => $f['is_generated'],
            'expr' => $f['generation_expression'],
            'stor' => $f['generation_storage'],
            'def' => $f['default'],
            'cmt' => $f['comment'],
        ]) . "\n";
    }
}

echo "\n" . ($ok ? "✅ ROUND-TRIP OK — Import/Export bleibt strukturell identisch.\n" : "❌ ROUND-TRIP FAILED — siehe Diffs oben.\n");
