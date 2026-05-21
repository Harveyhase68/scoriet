<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add device_id column to oauth_access_tokens.
 *
 * Used for CLI/Service tokens so that revoking a Trusted Device in the
 * web UI can also revoke all tokens that were bound to that device. Web
 * OAuth-password-grant tokens may also carry device_id (set in the 2FA
 * flow) but that's not currently a hard requirement.
 *
 * Nullable so existing tokens remain valid and tokens issued by flows
 * that don't know a device_id (e.g. early Web OAuth) keep working.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('oauth_access_tokens', function (Blueprint $table) {
            $table->string('device_id', 255)->nullable()->after('name');
            $table->index('device_id', 'oauth_access_tokens_device_id_index');
        });
    }

    public function down(): void
    {
        Schema::table('oauth_access_tokens', function (Blueprint $table) {
            $table->dropIndex('oauth_access_tokens_device_id_index');
            $table->dropColumn('device_id');
        });
    }
};
