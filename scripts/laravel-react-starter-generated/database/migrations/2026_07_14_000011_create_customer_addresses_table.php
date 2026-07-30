<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            CREATE TABLE IF NOT EXISTS `customer_addresses` (
                `ca_i` BIGINT NOT NULL AUTO_INCREMENT,
                `ca_no` BIGINT NOT NULL,
                `cust_no` BIGINT NOT NULL,
                `addr_no` BIGINT NOT NULL,
                `ca_addr_type` ENUM NOT NULL,
                PRIMARY KEY (`ca_i`),
                UNIQUE KEY `ug_ca_cust_no_add_no` (`cust_no`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    public function down(): void
    {
        DB::statement("DROP TABLE IF EXISTS `customer_addresses`");
    }
};
