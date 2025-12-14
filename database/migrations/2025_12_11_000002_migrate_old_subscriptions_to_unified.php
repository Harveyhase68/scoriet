<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Migrates data from old subscription tables to the unified subscriptions table
     */
    public function up(): void
    {
        // Migrate project_subscriptions
        if (Schema::hasTable('project_subscriptions')) {
            DB::table('project_subscriptions')->orderBy('id')->chunk(100, function ($subscriptions) {
                foreach ($subscriptions as $sub) {
                    DB::table('subscriptions')->insertOrIgnore([
                        'user_id' => $sub->user_id,
                        'subscription_type' => 'project',
                        'entity_id' => $sub->project_id,
                        'is_free_tier' => $sub->is_free_tier,
                        'is_active' => $sub->is_active,
                        'is_soft_locked' => $sub->is_soft_locked ?? false,
                        'expires_at' => $sub->expires_at,
                        'created_at' => $sub->created_at,
                        'updated_at' => $sub->updated_at,
                    ]);
                }
            });
        }

        // Migrate schema_subscriptions
        if (Schema::hasTable('schema_subscriptions')) {
            DB::table('schema_subscriptions')->orderBy('id')->chunk(100, function ($subscriptions) {
                foreach ($subscriptions as $sub) {
                    DB::table('subscriptions')->insertOrIgnore([
                        'user_id' => $sub->user_id,
                        'subscription_type' => 'schema',
                        'entity_id' => $sub->schema_id,
                        'is_free_tier' => $sub->is_free_tier,
                        'is_active' => $sub->is_active,
                        'is_soft_locked' => $sub->is_soft_locked ?? false,
                        'expires_at' => $sub->expires_at,
                        'created_at' => $sub->created_at,
                        'updated_at' => $sub->updated_at,
                    ]);
                }
            });
        }

        // Migrate team_subscriptions
        if (Schema::hasTable('team_subscriptions')) {
            DB::table('team_subscriptions')->orderBy('id')->chunk(100, function ($subscriptions) {
                foreach ($subscriptions as $sub) {
                    DB::table('subscriptions')->insertOrIgnore([
                        'user_id' => $sub->user_id,
                        'subscription_type' => 'team',
                        'entity_id' => $sub->team_id,
                        'is_free_tier' => $sub->is_free_tier,
                        'is_active' => $sub->is_active,
                        'is_soft_locked' => $sub->is_soft_locked ?? false,
                        'expires_at' => $sub->expires_at,
                        'created_at' => $sub->created_at,
                        'updated_at' => $sub->updated_at,
                    ]);
                }
            });
        }

        // Migrate template_subscriptions
        if (Schema::hasTable('template_subscriptions')) {
            DB::table('template_subscriptions')->orderBy('id')->chunk(100, function ($subscriptions) {
                foreach ($subscriptions as $sub) {
                    DB::table('subscriptions')->insertOrIgnore([
                        'user_id' => $sub->user_id,
                        'subscription_type' => 'template',
                        'entity_id' => $sub->template_id,
                        'is_free_tier' => $sub->is_free_tier ?? false,
                        'is_active' => $sub->is_active,
                        'is_soft_locked' => false,
                        'expires_at' => $sub->expires_at,
                        'created_at' => $sub->created_at,
                        'updated_at' => $sub->updated_at,
                    ]);
                }
            });
        }

        // Migrate cli_subscriptions
        if (Schema::hasTable('cli_subscriptions')) {
            DB::table('cli_subscriptions')->orderBy('id')->chunk(100, function ($subscriptions) {
                foreach ($subscriptions as $sub) {
                    DB::table('subscriptions')->insertOrIgnore([
                        'user_id' => $sub->user_id,
                        'subscription_type' => $sub->type, // cli, service, or bundle
                        'entity_id' => null,
                        'is_free_tier' => false,
                        'is_active' => $sub->is_active,
                        'is_soft_locked' => false,
                        'expires_at' => $sub->expires_at,
                        'created_at' => $sub->created_at,
                        'updated_at' => $sub->updated_at,
                    ]);
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Clear all migrated data from the unified table
        DB::table('subscriptions')->truncate();
    }
};
