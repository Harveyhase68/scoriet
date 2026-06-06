<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create the oauth_clients table in Passport's MODERN (>=12) shape.
 *
 * This mirrors vendor/laravel/passport/database/migrations/2016_06_01_000004
 * one-to-one so that a fresh install matches Passport's native schema:
 *
 *   - polymorphic owner (owner_type / owner_id) instead of a fixed user_id FK
 *   - redirect_uris (JSON text) instead of a single redirect string
 *   - grant_types  (JSON text) instead of personal_access_client / password_client booleans
 *
 * Long-lived databases created against the older legacy shape are migrated
 * forward, non-destructively, by 2026_06_04_120000_convert_oauth_clients_to_modern_schema.
 * That conversion preserves every existing client id, secret and issued token.
 */
return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('oauth_clients')) {
            // Table already exists (legacy or modern). Creation is a no-op here;
            // the dedicated conversion migration reconciles its shape.
            return;
        }

        Schema::create('oauth_clients', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->nullableMorphs('owner');
            $table->string('name');
            $table->string('secret')->nullable();
            $table->string('provider')->nullable();
            $table->text('redirect_uris');
            $table->text('grant_types');
            $table->boolean('revoked');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('oauth_clients');
    }
};
