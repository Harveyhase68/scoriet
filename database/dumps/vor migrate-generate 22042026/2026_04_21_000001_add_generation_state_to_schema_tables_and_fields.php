<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds two orthogonal state columns to schema_tables and schema_fields:
     *
     *   display_state     — visual hint (passed to gtree as metadata, never
     *                       filters generation). Used by forms/reports as the
     *                       global default when no per-template override exists.
     *
     *   generation_mode   — controls which parts of code generation apply:
     *                         full            — default, iterate + generate per-file
     *                         code_only       — in nmaxtables/nmaxitems, no per-file
     *                         template_only   — per-file generated, skipped in loops
     *                         reference_only  — only in gtree for FK-resolution
     *                         excluded        — completely removed from gtree
     */
    public function up(): void
    {
        Schema::table('schema_tables', function (Blueprint $table) {
            $table->enum('display_state', [
                'enabled',
                'disabled',
                'grayed',
                'invisible',
                'excluded',
            ])->default('enabled')->after('report_pattern_id');

            $table->enum('generation_mode', [
                'full',
                'code_only',
                'template_only',
                'reference_only',
                'excluded',
            ])->default('full')->after('display_state');
        });

        Schema::table('schema_fields', function (Blueprint $table) {
            $table->enum('display_state', [
                'enabled',
                'disabled',
                'grayed',
                'invisible',
                'excluded',
            ])->default('enabled')->after('editmask');

            $table->enum('generation_mode', [
                'full',
                'code_only',
                'template_only',
                'reference_only',
                'excluded',
            ])->default('full')->after('display_state');
        });
    }

    public function down(): void
    {
        Schema::table('schema_tables', function (Blueprint $table) {
            $table->dropColumn(['display_state', 'generation_mode']);
        });

        Schema::table('schema_fields', function (Blueprint $table) {
            $table->dropColumn(['display_state', 'generation_mode']);
        });
    }
};
