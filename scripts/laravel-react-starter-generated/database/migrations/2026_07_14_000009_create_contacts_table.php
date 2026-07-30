<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            CREATE TABLE IF NOT EXISTS `contacts` (
                `cont_id` BIGINT NOT NULL AUTO_INCREMENT,
                `cont_no` BIGINT NOT NULL,
                `cont_first_name` VARCHAR NULL,
                `cont_last_name` VARCHAR NULL,
                `cont_title` VARCHAR NULL,
                `cont_role` VARCHAR NULL,
                `cont_email` VARCHAR NULL,
                `cont_phone` VARCHAR NULL,
                `cont_mobile` VARCHAR NULL,
                `cont_preferred_channel` ENUM NULL,
                `cont_notes` TEXT NULL,
                `cont_created_at` TIMESTAMP NULL,
                `addr_no` BIGINT NULL,
                PRIMARY KEY (`cont_id`),
                UNIQUE KEY `ux_cont_no` (`cont_no`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    public function down(): void
    {
        DB::statement("DROP TABLE IF EXISTS `contacts`");
    }
};
