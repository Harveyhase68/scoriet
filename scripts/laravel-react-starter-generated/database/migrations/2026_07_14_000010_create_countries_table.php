<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            CREATE TABLE IF NOT EXISTS `countries` (
                `count_id` INT NOT NULL AUTO_INCREMENT,
                `count_iso2` CHAR NOT NULL,
                `count_iso3` CHAR NULL,
                `count_name` VARCHAR NOT NULL,
                `count_official_name` VARCHAR NULL,
                `count_currency_code` CHAR NULL,
                `count_currency_name` VARCHAR NULL,
                `count_phone_code` VARCHAR NULL,
                `count_region` VARCHAR NULL,
                `count_subregion` VARCHAR NULL,
                `count_eu_member` TINYINT NULL,
                `count_default_vat` DECIMAL NULL,
                `count_timezones` VARCHAR NULL,
                `count_address_format` TEXT NULL,
                `count_display` TEXT NOT NULL,
                PRIMARY KEY (`count_id`),
                UNIQUE KEY `ux_count_iso2` (`count_iso2`),
                UNIQUE KEY `ux_count_iso3` (`count_iso3`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    public function down(): void
    {
        DB::statement("DROP TABLE IF EXISTS `countries`");
    }
};
