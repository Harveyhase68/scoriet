<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Per-report-pattern field assignments.
     *
     * Mirrors template_file_field_assignments but keyed on report_pattern_id
     * instead of template_file_id. Each (pattern, field) pair stores a
     * visibility_state (same enum as forms) and an optional sort_order.
     *
     * Intended UX: a matrix panel (rows = fields of a schema table,
     * columns = report patterns linked to the project) where the user
     * controls how each field behaves per report pattern — independent
     * of canvas-level placements in ReportLayoutElement.
     */
    public function up(): void
    {
        Schema::create('report_pattern_field_assignments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('report_pattern_id');
            $table->unsignedBigInteger('schema_field_id');
            $table->enum('visibility_state', [
                'visible',
                'grayed',
                'inactive',
                'invisible',
                'not_available',
            ])->default('visible');
            $table->integer('sort_order')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            // One assignment per pattern per field
            $table->unique(
                ['report_pattern_id', 'schema_field_id'],
                'rpfa_pattern_field_unique'
            );

            $table->foreign('report_pattern_id')
                ->references('id')
                ->on('report_patterns')
                ->onDelete('cascade');

            $table->foreign('schema_field_id')
                ->references('id')
                ->on('schema_fields')
                ->onDelete('cascade');

            $table->foreign('created_by')
                ->references('id')
                ->on('users')
                ->onDelete('set null');

            $table->index('report_pattern_id', 'rpfa_report_pattern_id_index');
            $table->index('schema_field_id', 'rpfa_schema_field_id_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_pattern_field_assignments');
    }
};
