<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            CREATE TABLE IF NOT EXISTS `users` (
                `id` BIGINT NOT NULL AUTO_INCREMENT,
                `name` VARCHAR NOT NULL,
                `email` VARCHAR NOT NULL,
                `avatar_path` VARCHAR NULL,
                `language` VARCHAR NOT NULL,
                `email_verified_at` TIMESTAMP NULL,
                `password` VARCHAR NOT NULL,
                `remember_token` VARCHAR NULL,
                `created_at` TIMESTAMP NULL,
                `updated_at` TIMESTAMP NULL,
                `two_factor_secret` VARCHAR NULL,
                `two_factor_enabled` TINYINT NOT NULL,
                `two_factor_confirmed_at` TIMESTAMP NULL,
                `two_factor_recovery_codes` TEXT NULL,
                `two_factor_trusted_devices` TEXT NULL,
                `two_factor_last_verified_at` TIMESTAMP NULL,
                PRIMARY KEY (`id`),
                UNIQUE KEY `users_email_unique` (`email`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    }

    public function down(): void
    {
        DB::statement("DROP TABLE IF EXISTS `users`");
    }
};
