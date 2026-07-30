<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            CREATE TABLE IF NOT EXISTS `customers` (
                `cust_id` BIGINT NOT NULL AUTO_INCREMENT,
                `cust_no` BIGINT NOT NULL,
                `cust_first_name` VARCHAR NULL,
                `cust_last_name` VARCHAR NULL,
                `cust_full_name` VARCHAR NULL,
                `comp_no` BIGINT NULL,
                `cust_email` VARCHAR NULL,
                `cust_phone` VARCHAR NULL,
                `cust_mobile` VARCHAR NULL,
                `cust_website` VARCHAR NULL,
                `cust_vat_number` VARCHAR NULL,
                `cust_tax_id` VARCHAR NULL,
                `cust_legal_form` VARCHAR NULL,
                `cust_status` ENUM NULL,
                `cust_segment` VARCHAR NULL,
                `cust_source` VARCHAR NULL,
                `cust_language` CHAR NULL,
                `cust_currency` CHAR NULL,
                `cust_credit_limit` DECIMAL NULL,
                `cust_balance` DECIMAL NULL,
                `cust_payment_terms` VARCHAR NULL,
                `cust_marketing_opt_in` TINYINT NULL,
                `cust_marketing_channel` VARCHAR NULL,
                `cust_preferred_contact_time` VARCHAR NULL,
                `cust_notes` TEXT NULL,
                `cust_created_at` TIMESTAMP NULL,
                `cust_updated_at` TIMESTAMP NULL,
                PRIMARY KEY (`cust_id`),
                UNIQUE KEY `ux_cust_no` (`cust_no`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    public function down(): void
    {
        DB::statement("DROP TABLE IF EXISTS `customers`");
    }
};
