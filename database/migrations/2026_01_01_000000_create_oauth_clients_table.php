<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if old oauth_clients table exists with wrong schema
        if (Schema::hasTable('oauth_clients') && Schema::hasColumn('oauth_clients', 'redirect_uris')) {
            // Old schema detected - drop and recreate
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
            Schema::dropIfExists('oauth_refresh_tokens');
            Schema::dropIfExists('oauth_access_tokens');
            Schema::dropIfExists('oauth_auth_codes');
            Schema::dropIfExists('oauth_personal_access_clients');
            Schema::dropIfExists('oauth_clients');
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }

        // Create table with correct schema
        if (!Schema::hasTable('oauth_clients')) {
            Schema::create('oauth_clients', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->unsignedBigInteger('user_id')->nullable()->index();
                $table->string('name');
                $table->string('secret')->nullable();
                $table->string('provider')->nullable();
                $table->text('redirect');
                $table->boolean('personal_access_client');
                $table->boolean('password_client');
                $table->boolean('revoked');
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('oauth_clients');
    }
};
