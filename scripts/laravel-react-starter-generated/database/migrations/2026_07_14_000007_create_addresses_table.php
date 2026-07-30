<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            CREATE TABLE IF NOT EXISTS `addresses` (
                `addr_id` BIGINT NOT NULL AUTO_INCREMENT,
                `addr_no` BIGINT NOT NULL,
                `addr_street` VARCHAR NULL,
                `addr_house_number` VARCHAR NULL,
                `pc_postal_code` VARCHAR NULL,
                `pc_city` VARCHAR NULL,
                `pc_state` VARCHAR NULL,
                `count_iso2` VARCHAR NULL,
                `addr_latitude` DECIMAL NULL,
                `addr_longitude` DECIMAL NULL,
                `addr_type` ENUM NULL,
                `addr_is_primary` TINYINT NULL,
                `addr_valid_from` DATE NULL,
                `addr_valid_to` DATE NULL,
                `addr_full_text` TEXT NOT NULL,
                PRIMARY KEY (`addr_id`),
                UNIQUE KEY `ux_addr_no` (`addr_no`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    public function down(): void
    {
        DB::statement("DROP TABLE IF EXISTS `addresses`");
    }
};
