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
        // Add 'template_purchase' and 'template_sale' to the enum type for credit_transactions
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
            'patron_subscription',
            'template_purchase',
            'template_sale'
        )");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove 'template_purchase' and 'template_sale' from the enum type
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
};
