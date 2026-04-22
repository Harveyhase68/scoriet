<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Per-template-file field assignments: visibility state and sort order
     * for each schema field per template file.
     */
    public function up(): void
    {
        Schema::create('template_file_field_assignments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('template_file_id');
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

            // One assignment per file per field
            $table->unique(
                ['template_file_id', 'schema_field_id'],
                'tffa_file_field_unique'
            );

            // Foreign keys
            $table->foreign('template_file_id')
                ->references('id')
                ->on('template_files')
                ->onDelete('cascade');

            $table->foreign('schema_field_id')
                ->references('id')
                ->on('schema_fields')
                ->onDelete('cascade');

            $table->foreign('created_by')
                ->references('id')
                ->on('users')
                ->onDelete('set null');

            // Indexes for common queries
            $table->index('template_file_id', 'tffa_template_file_id_index');
            $table->index('schema_field_id', 'tffa_schema_field_id_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('template_file_field_assignments');
    }
};
