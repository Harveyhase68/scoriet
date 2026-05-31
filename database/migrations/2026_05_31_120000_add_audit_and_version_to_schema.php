<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schema_tables', function (Blueprint $table) {
            $table->unsignedInteger('version')->default(1)->after('generation_mode');
            $table->string('created_by_username', 190)->default('system')->after('version');
            $table->string('updated_by_username', 190)->default('system')->after('created_by_username');
        });

        Schema::table('schema_fields', function (Blueprint $table) {
            $table->unsignedInteger('version')->default(1)->after('generation_mode');
            $table->string('created_by_username', 190)->default('system')->after('version');
            $table->string('updated_by_username', 190)->default('system')->after('created_by_username');
        });

        // Backfill — existing rows get version=1 and 'system' as both audit users
        // so the JSON codec always has values to write into SQL COMMENTs.
        DB::table('schema_tables')->update([
            'version' => 1,
            'created_by_username' => 'system',
            'updated_by_username' => 'system',
        ]);

        DB::table('schema_fields')->update([
            'version' => 1,
            'created_by_username' => 'system',
            'updated_by_username' => 'system',
        ]);
    }

    public function down(): void
    {
        Schema::table('schema_tables', function (Blueprint $table) {
            $table->dropColumn(['version', 'created_by_username', 'updated_by_username']);
        });

        Schema::table('schema_fields', function (Blueprint $table) {
            $table->dropColumn(['version', 'created_by_username', 'updated_by_username']);
        });
    }
};
