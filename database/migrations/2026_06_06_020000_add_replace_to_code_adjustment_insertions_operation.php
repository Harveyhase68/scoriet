<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Add 'replace' to the code_adjustment_insertions.operation enum.
 *
 * 'replace' is the unified, context-anchored operation: anchor_text holds the
 * ORIGINAL block (before, incl. surrounding context so it is unique) and
 * insertion_content holds the NEW block (after). Apply = find the before-block
 * exactly once, swap it for the after-block. Insert/delete remain as manual
 * shortcuts; the reverse-engineering analyzer now emits 'replace'.
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE code_adjustment_insertions MODIFY operation ENUM('insert','delete','replace') NOT NULL DEFAULT 'insert'");
    }

    public function down(): void
    {
        // Collapse any 'replace' rows back to 'insert' before narrowing the enum
        // so the column change can't fail on out-of-range values.
        DB::statement("UPDATE code_adjustment_insertions SET operation = 'insert' WHERE operation = 'replace'");
        DB::statement("ALTER TABLE code_adjustment_insertions MODIFY operation ENUM('insert','delete') NOT NULL DEFAULT 'insert'");
    }
};
