<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('code_adjustment_insertions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('code_adjustment_id');

            // Insertion type: 'beginning', 'end', 'middle'
            $table->enum('insertion_type', ['beginning', 'end', 'middle']);

            // The anchor text to find (normalized, without CRLF variations)
            // For 'beginning': text that should come AFTER the insertion
            // For 'end': text that should come BEFORE the insertion
            // For 'middle': text pattern to find (insertion goes after this)
            $table->text('anchor_text');

            // The actual code to insert (can contain {projectname}, {tablename}, etc.)
            $table->mediumText('insertion_content');

            // Line offset: insert N lines before/after the anchor
            // Positive = after anchor, Negative = before anchor
            $table->smallInteger('line_offset')->default(0);

            // Ordering within same adjustment
            $table->integer('insertion_order')->default(0);

            // Description for this specific insertion
            $table->string('description', 500)->nullable();

            $table->timestamps();

            // Foreign key
            $table->foreign('code_adjustment_id')
                  ->references('id')->on('code_adjustments')
                  ->onDelete('cascade');

            // Index
            $table->index('code_adjustment_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('code_adjustment_insertions');
    }
};
