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
  `user_description` longtext COLLATE utf8mb4_unicode_ci COMMENT 'Description',
  `user_birthday` date DEFAULT NULL COMMENT 'Birthday',
  `user_created_at` datetime DEFAULT NULL COMMENT 'Created at',
  `user_last_edited` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Last edited',
  `user_wakeup` time DEFAULT NULL COMMENT 'Wakeup time',
  `ug_no` bigint DEFAULT NULL COMMENT 'User group',
  `user_is_male` tinyint(1) DEFAULT NULL,
  `user_image` longblob,
  `user_type` enum('Privatkunde','Firmenkunde','Behörde','NGO') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_settings` json DEFAULT NULL,
  `user_complaints` set('too laud','too fast','too expensive','too much') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `user_no_unique` (`user_no`),
  KEY `user_first_name_index` (`user_first_name`),
  KEY `ug_no_users_index` (`ug_no`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Benutzertabelle';

CREATE TABLE IF NOT EXISTS `user_groups` (
  `ug_id` bigint NOT NULL AUTO_INCREMENT,
  `ug_no` bigint DEFAULT NULL,
  `ug_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ug_display` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS (trim(concat(_utf8mb4'UG-',lpad(ifnull(`ug_no`,_utf8mb4''),5,_utf8mb4'0'),_utf8mb4' - ',ifnull(`ug_name`,_utf8mb4'')))) STORED,
  PRIMARY KEY (`ug_id`),
  UNIQUE KEY `ug_no_unique` (`ug_no`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `user`
  ADD CONSTRAINT `fk_user_groups` FOREIGN KEY (`ug_no`) REFERENCES `user_groups` (`ug_no`) ON DELETE RESTRICT ON UPDATE RESTRICT;
SQL;

$parser = new MySQLParser();
$tables = $parser->parseSQL($sql);

foreach ($tables as $table) {
    echo "═══════════════════════════════════════════════════════════════════════\n";
    echo "TABLE: " . $table['table_name'] . "\n";
    echo "  Fields: " . count($table['fields']) . "\n";
    echo "═══════════════════════════════════════════════════════════════════════\n";

    foreach ($table['fields'] as $field) {
        echo sprintf("  • %-22s | %-25s", $field['name'], $field['type']);
        $bits = [];
        if (!empty($field['auto_increment'])) $bits[] = 'AI';
        if (empty($field['nullable'])) $bits[] = 'NOT NULL';
        if (!empty($field['is_generated'])) $bits[] = 'GENERATED(' . $field['generation_storage'] . ')';
        if ($bits) echo ' [' . implode(', ', $bits) . ']';
        echo "\n";
        if ($field['default'] !== null) echo "      DEFAULT  : " . $field['default'] . "\n";
        if (!empty($field['comment'])) echo "      COMMENT  : '" . $field['comment'] . "'\n";
        if (!empty($field['length'])) echo "      LENGTH   : " . $field['length'] . "\n";
        if ($field['precision'] !== null) echo "      PRECISION: " . $field['precision'] . "\n";
        if ($field['scale'] !== null) echo "      SCALE    : " . $field['scale'] . "\n";
        if (!empty($field['enum_values'])) echo "      VALUES   : [" . implode(', ', array_map(fn($v) => "'$v'", $field['enum_values'])) . "]\n";
        if (!empty($field['is_generated'])) echo "      EXPR     : " . $field['generation_expression'] . "\n";
    }

    if (!empty($table['constraints'])) {
        echo "  Constraints:\n";
        foreach ($table['constraints'] as $c) {
            $cols = implode(',', $c['columns'] ?? []);
            echo "    - {$c['type']} ({$cols})";
            if (!empty($c['references'])) {
                $refCols = implode(',', $c['references']['columns'] ?? []);
                echo " → {$c['references']['table']}({$refCols})";
                if (!empty($c['references']['on_delete'])) echo " ON DELETE {$c['references']['on_delete']}";
                if (!empty($c['references']['on_update'])) echo " ON UPDATE {$c['references']['on_update']}";
            }
            echo "\n";
        }
    }
    echo "\n";
}
