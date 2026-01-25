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
        // Add 'kanban_board' to the subscription_type enum
        DB::statement("ALTER TABLE subscriptions MODIFY COLUMN subscription_type ENUM('project', 'schema', 'team', 'template', 'cli', 'service', 'bundle', 'form_designer', 'git_integration', 'code_adjustments', 'database_designer', 'schema_migration', 'message_attachments', 'kanban_board') NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove 'kanban_board' from the subscription_type enum
        DB::statement("ALTER TABLE subscriptions MODIFY COLUMN subscription_type ENUM('project', 'schema', 'team', 'template', 'cli', 'service', 'bundle', 'form_designer', 'git_integration', 'code_adjustments', 'database_designer', 'schema_migration', 'message_attachments') NULL");
    }
};
