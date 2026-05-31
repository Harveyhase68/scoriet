<?php

require __DIR__ . '/../../vendor/autoload.php';
$app = require __DIR__ . '/../../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Services\MySQLParser;

// Test the new structured pipeline end-to-end:
// SQL → Parser → mock "field" object (as if read from DB) → renderFieldTypeForMySQL → SQL
// then re-parse and compare.

$sql = <<<'SQL'
CREATE TABLE `users` (
  `user_id` bigint NOT NULL AUTO_INCREMENT COMMENT 'User ID',
  `user_no` bigint DEFAULT NULL,
  `user_is_male` tinyint(1) DEFAULT NULL,
  `user_type` enum('Privatkunde','Firmenkunde','Behörde','NGO') DEFAULT NULL,
  `user_complaints` set('too laud','too fast','too expensive','too much') DEFAULT NULL,
  `user_balance` decimal(10,2) DEFAULT NULL,
  `user_last_edited` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Last edited',
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB COMMENT='Benutzertabelle';
SQL;

$parser = new MySQLParser();
[$parsed] = $parser->parseSQL($sql);

// Build mock SchemaField objects matching what the DB would now contain
$mockFields = array_map(function ($f) {
    return (object)[
        'field_name' => $f['name'],
        'field_type' => strtolower($f['type']),  // base name only now
        'field_length' => $f['length'],
        'field_precision' => $f['precision'],
        'field_scale' => $f['scale'],
        'field_enum_values' => $f['enum_values'],
        'is_unsigned' => $f['unsigned'],
        'is_nullable' => $f['nullable'],
        'is_auto_increment' => $f['auto_increment'],
        'default_value' => $f['default'] === 'NULL' ? null : $f['default'],
        'comment' => $f['comment'],
        'is_generated' => $f['is_generated'],
        'generation_expression' => $f['generation_expression'],
        'generation_storage' => $f['generation_storage'],
    ];
}, $parsed['fields']);

// Call the real renderFieldTypeForMySQL via reflection
$controller = new App\Http\Controllers\SchemaExportController();
$r = new ReflectionClass($controller);
$render = $r->getMethod('renderFieldTypeForMySQL');
$render->setAccessible(true);

echo "═══════════════════════════════════════════════════════════════════════\n";
echo "Re-rendered MySQL type strings from structured columns:\n";
echo "═══════════════════════════════════════════════════════════════════════\n";
foreach ($mockFields as $field) {
    $rendered = $render->invoke($controller, $field);
    printf("  %-22s → %s\n", $field->field_name, $rendered);
}

echo "\nTable comment: '" . $parsed['comment'] . "'\n";

// Now build a complete CREATE TABLE and re-parse it
$fieldLines = [];
foreach ($mockFields as $field) {
    $line = '  `' . $field->field_name . '` ' . $render->invoke($controller, $field);
    if (!$field->is_nullable) $line .= ' NOT NULL';
    if ($field->is_auto_increment) $line .= ' AUTO_INCREMENT';
    if ($field->default_value !== null) {
        $line .= ' DEFAULT ' . (in_array(strtoupper($field->default_value), ['CURRENT_TIMESTAMP', 'NOW()']) ? strtoupper($field->default_value) : "'" . addslashes($field->default_value) . "'");
    } elseif ($field->is_nullable && !$field->is_auto_increment) {
        // Mirror the real exporter — explicit DEFAULT NULL for nullable, non-AI cols
        $line .= ' DEFAULT NULL';
    }
    if ($field->comment) $line .= " COMMENT '" . addslashes($field->comment) . "'";
    $fieldLines[] = $line;
}
$exportSQL = "CREATE TABLE `{$parsed['table_name']}` (\n" . implode(",\n", $fieldLines) . ",\n  PRIMARY KEY (`user_id`)\n) ENGINE=InnoDB COMMENT='" . addslashes($parsed['comment']) . "';\n";

echo "\nExported SQL:\n$exportSQL\n";

[$reparsed] = $parser->parseSQL($exportSQL);

echo "Round-trip check:\n";
$ok = true;
foreach ($reparsed['fields'] as $i => $f) {
    $orig = $parsed['fields'][$i];
    $match = $orig['name'] === $f['name']
          && strcasecmp($orig['type'], $f['type']) === 0
          && $orig['length'] === $f['length']
          && $orig['precision'] === $f['precision']
          && $orig['scale'] === $f['scale']
          && $orig['enum_values'] === $f['enum_values']
          && $orig['comment'] === $f['comment'];
    echo ($match ? '  ✓' : '  ✗') . " {$f['name']}\n";
    if (!$match) $ok = false;
}
$tableCommentOk = $parsed['comment'] === $reparsed['comment'];
echo ($tableCommentOk ? '  ✓' : '  ✗') . " (table comment: '{$reparsed['comment']}')\n";

echo "\n" . (($ok && $tableCommentOk) ? "✅ STRUCTURED ROUND-TRIP OK\n" : "❌ FAILED\n");
