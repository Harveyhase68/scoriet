<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            CREATE TABLE IF NOT EXISTS `languages` (
                `id` BIGINT NOT NULL AUTO_INCREMENT,
                `code` VARCHAR NOT NULL,
                `name` VARCHAR NOT NULL,
                `native_name` VARCHAR NOT NULL,
                `flag` VARCHAR NULL,
                `is_active` TINYINT NOT NULL,
                `is_default` TINYINT NOT NULL,
                `sort_order` INT NOT NULL,
                `created_at` TIMESTAMP NULL,
                `updated_at` TIMESTAMP NULL,
                PRIMARY KEY (`id`),
                UNIQUE KEY `languages_code_unique` (`code`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    public function down(): void
    {
        DB::statement("DROP TABLE IF EXISTS `languages`");
    }
};
