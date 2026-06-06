<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Delete support for Code Adjustments.
 *
 * A code_adjustment_insertion is, until now, always an INSERT (add content at
 * an anchor). This adds an `operation` discriminator so the same row can also
 * be a DELETE:
 *   operation = 'insert' → anchor_text = where to anchor, insertion_content = what to add (unchanged)
 *   operation = 'delete' → anchor_text = the exact block to FIND and REMOVE; insertion_content unused
 *
 * Reusing the insertions table keeps a single anchor + confidence apply path.
 * Existing rows default to 'insert' so nothing changes for them.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('code_adjustment_insertions', function (Blueprint $table) {
            $table->enum('operation', ['insert', 'delete'])->default('insert')->after('code_adjustment_id');
        });
    }

    public function down(): void
    {
        Schema::table('code_adjustment_insertions', function (Blueprint $table) {
            $table->dropColumn('operation');
        });
    }
};
