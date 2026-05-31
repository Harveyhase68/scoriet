<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-schema MySQL character set and collation.
 *
 * Why per-schema and not per-column or per-table:
 *   - Hardcoding utf8mb4_unicode_ci breaks Legacy MySQL 5.x (no _unicode_ci in
 *     some installs) and is wrong on modern MySQL 9.x where users want
 *     utf8mb4_0900_ai_ci for proper emoji/accent handling.
 *   - Per-column would be over-engineered: 99% of real schemas use one set
 *     consistently across every column. Mixed-collation columns are a rare
 *     edge case we'll handle if it ever comes up.
 *
 * The SQL parser reads these from `CREATE DATABASE ... CHARACTER SET = ...
 * COLLATE = ...` (preferred — unambiguous) or, as a fallback, from the
 * `DEFAULT CHARSET=... COLLATE=...` trailer of the FIRST `CREATE TABLE` in
 * the dump. The export then re-emits the same values per table.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schemas', function (Blueprint $table) {
            $table->string('default_charset', 32)->default('utf8mb4')->after('description');
            $table->string('default_collation', 64)->default('utf8mb4_unicode_ci')->after('default_charset');
        });
    }

    public function down(): void
    {
        Schema::table('schemas', function (Blueprint $table) {
            $table->dropColumn(['default_charset', 'default_collation']);
        });
    }
};
