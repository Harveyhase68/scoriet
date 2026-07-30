<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            CREATE TABLE IF NOT EXISTS `customer_contacts` (
                `cc_id` BIGINT NOT NULL AUTO_INCREMENT,
                `cc_no` BIGINT NOT NULL,
                `cust_no` BIGINT NOT NULL,
                `cont_no` BIGINT NOT NULL,
                `cc_cont_is_primary` TINYINT NULL,
                PRIMARY KEY (`cc_id`),
                UNIQUE KEY `ux_cc_no` (`cc_no`),
                UNIQUE KEY `ug_cc_cust_no_cont_no` (`cust_no`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    public function down(): void
    {
        DB::statement("DROP TABLE IF EXISTS `customer_contacts`");
    }
};
