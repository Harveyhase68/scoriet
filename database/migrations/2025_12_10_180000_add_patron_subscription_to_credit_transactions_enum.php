<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Skip ENUM modifications on SQLite (not supported)
        if (DB::connection()->getDriverName() === 'sqlite') {
            return;
        }

        // Add 'patron_subscription' to the enum type for credit_transactions
        DB::statement("ALTER TABLE credit_transactions MODIFY COLUMN type ENUM(
            'purchase',
            'generation',
            'project_renewal',
            'db_renewal',
            'teams_unlock',
            'templates_unlock',
            'cli_unlock',
            'ticket',
            'initial_credits',
            'admin_adjustment',
            'patron_subscription'
        )");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Skip ENUM modifications on SQLite (not supported)
        if (DB::connection()->getDriverName() === 'sqlite') {
            return;
        }

        // Remove 'patron_subscription' from the enum type
        DB::statement("ALTER TABLE credit_transactions MODIFY COLUMN type ENUM(
            'purchase',
            'generation',
            'project_renewal',
            'db_renewal',
            'teams_unlock',
            'templates_unlock',
            'cli_unlock',
            'ticket',
            'initial_credits',
            'admin_adjustment'
        )");
    }
};
