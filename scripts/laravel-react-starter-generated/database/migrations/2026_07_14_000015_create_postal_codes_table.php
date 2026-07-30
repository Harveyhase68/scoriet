<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            CREATE TABLE IF NOT EXISTS `postal_codes` (
                `pc_id` BIGINT NOT NULL AUTO_INCREMENT,
                `count_iso2` VARCHAR NOT NULL,
                `pc_postal_code` VARCHAR NOT NULL,
                `pc_city` VARCHAR NOT NULL,
                `pc_state` VARCHAR NULL,
                `pc_subdivision` VARCHAR NULL,
                `pc_latitude` DECIMAL NULL,
                `pc_longitude` DECIMAL NULL,
                `pc_timezone` VARCHAR NULL,
                `pc_population` INT NULL,
                `pc_delivery_zone` VARCHAR NULL,
                `pc_postal_format` VARCHAR NULL,
                `pc_is_active` TINYINT NULL,
                `pc_valid_from` DATE NULL,
                `pc_valid_to` DATE NULL,
                `pc_notes` TEXT NULL,
                `pc_created_at` TIMESTAMP NULL,
                `pc_updated_at` TIMESTAMP NULL,
                PRIMARY KEY (`pc_id`),
                UNIQUE KEY `ux_pc_postal_city` (`pc_postal_code`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    public function down(): void
    {
        DB::statement("DROP TABLE IF EXISTS `postal_codes`");
    }
};
