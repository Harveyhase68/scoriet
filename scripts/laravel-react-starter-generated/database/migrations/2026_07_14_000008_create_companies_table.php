<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            CREATE TABLE IF NOT EXISTS `companies` (
                `comp_id` BIGINT NOT NULL AUTO_INCREMENT,
                `comp_no` BIGINT NOT NULL,
                `comp_name` VARCHAR NOT NULL,
                `comp_registration_number` VARCHAR NULL,
                `comp_vat_number` VARCHAR NULL,
                `comp_website` VARCHAR NULL,
                `comp_phone` VARCHAR NULL,
                `comp_fax` VARCHAR NULL,
                `comp_industry` VARCHAR NULL,
                `comp_size` ENUM NULL,
                `comp_notes` TEXT NULL,
                `comp_created_at` TIMESTAMP NULL,
                `comp_updated_at` TIMESTAMP NULL,
                PRIMARY KEY (`comp_id`),
                UNIQUE KEY `ux_comp_no` (`comp_no`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    public function down(): void
    {
        DB::statement("DROP TABLE IF EXISTS `companies`");
    }
};
