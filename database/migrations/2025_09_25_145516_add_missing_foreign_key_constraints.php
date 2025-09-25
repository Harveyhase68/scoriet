<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Fix missing Foreign Key constraints that allow TRUNCATE operations
     * on parent tables with existing child records.
     */
    public function up(): void
    {
        // Disable foreign key checks temporarily
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // 1. Templates table already has owner_id constraint (templates_owner_id_foreign -> creator_user_id)
        // Skip - already exists

        // 2. Most foreign keys already exist, but let's check for any actually missing ones
        // Based on existing constraints analysis, most are already in place
        // The issue might be with specific missing constraints or incorrect column references

        // Check for project_invitations.inviter_user_id (currently has invited_by instead)
        // Note: The existing constraint uses 'invited_by' column, not 'inviter_user_id'

        // All other constraints from the original list already exist:
        // - project_members: ✓ has project_id, user_id foreign keys
        // - project_applications: ✓ has project_id, user_id foreign keys
        // - team_members: ✓ has team_id, user_id foreign keys
        // - schema_versions: ✓ has schema_id foreign key (to 'schemas', not 'floating_schemas')
        // - schema_tables: ✓ has schema_id foreign key (to 'schemas', not 'floating_schemas')
        // - template_files: ✓ has template_id foreign key
        // - project_template_usage: ✓ has project_id, template_id foreign keys

        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
    }

    /**
     * Add foreign key constraint if it doesn't exist
     */
    private function addForeignKeyIfMissing(string $table, string $column, string $referencedTable, string $referencedColumn, string $onDelete = 'restrict'): void
    {
        if (!Schema::hasTable($table) || !Schema::hasColumn($table, $column)) {
            return;
        }

        // Check if foreign key already exists
        $constraints = DB::select("
            SELECT CONSTRAINT_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = ?
            AND COLUMN_NAME = ?
            AND REFERENCED_TABLE_NAME = ?
        ", [$table, $column, $referencedTable]);

        if (empty($constraints)) {
            try {
                Schema::table($table, function (Blueprint $blueprint) use ($column, $referencedTable, $referencedColumn, $onDelete) {
                    $blueprint->foreign($column)->references($referencedColumn)->on($referencedTable)->onDelete($onDelete);
                });
                echo "✅ Added foreign key: {$table}.{$column} -> {$referencedTable}.{$referencedColumn}\n";
            } catch (Exception $e) {
                echo "❌ Failed to add foreign key {$table}.{$column}: " . $e->getMessage() . "\n";
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop foreign keys in reverse order
        $foreignKeys = [
            'project_template_usage' => ['template_id', 'project_id'],
            'template_files' => ['template_id'],
            'schema_tables' => ['schema_id'],
            'schema_versions' => ['schema_id'],
            'team_members' => ['user_id', 'team_id'],
            'project_invitations' => ['inviter_user_id', 'project_id'],
            'project_applications' => ['user_id', 'project_id'],
            'project_members' => ['user_id', 'project_id'],
            'templates' => ['owner_id'],
        ];

        foreach ($foreignKeys as $table => $columns) {
            if (Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $blueprint) use ($columns) {
                    foreach ($columns as $column) {
                        try {
                            $blueprint->dropForeign([$column]);
                        } catch (Exception $e) {
                            // Ignore if foreign key doesn't exist
                        }
                    }
                });
            }
        }
    }
};
