<?php

require __DIR__ . '/../../vendor/autoload.php';
$app = require __DIR__ . '/../../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Services\MySQLParser;

$sql = <<<'SQL'
CREATE TABLE IF NOT EXISTS `user` (
  `user_id` bigint NOT NULL AUTO_INCREMENT COMMENT 'User ID',
  `user_no` bigint DEFAULT NULL,
  `user_first_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'First Name',
  `user_last_edited` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Last edited',
  `user_is_male` tinyint(1) DEFAULT NULL,
  `user_image` longblob,
  `user_type` enum('Privatkunde','Firmenkunde','Behörde','NGO') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_settings` json DEFAULT NULL,
  `user_complaints` set('too laud','too fast','too expensive','too much') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_balance` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Benutzertabelle';
SQL;

$parser = new MySQLParser();
$tables = $parser->parseSQL($sql);
$t = $tables[0];

echo "═══════════════════════════════════════════════════════════════════════\n";
echo "Table: {$t['table_name']}\n";
echo "Comment: " . var_export($t['comment'] ?? null, true) . "\n";
echo "═══════════════════════════════════════════════════════════════════════\n";

foreach ($t['fields'] as $f) {
    printf("  • %-22s | %s\n", $f['name'], $f['type']);
    if ($f['default'] !== null) echo "      DEFAULT  : {$f['default']}\n";
    if (!empty($f['comment'])) echo "      COMMENT  : '{$f['comment']}'\n";
}

echo "\nFOCUS — Type-strings preserved:\n";
foreach ($t['fields'] as $f) {
    if (in_array(strtolower(explode('(', $f['type'])[0]), ['enum','set','decimal','tinyint'])) {
        printf("  %s → %s\n", $f['name'], $f['type']);
    }
}
