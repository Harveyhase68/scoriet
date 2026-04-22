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
        Schema::create('template_file_field_assignments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('template_file_id')->index('tffa_template_file_id_index');
            $table->unsignedBigInteger('schema_field_id')->index('tffa_schema_field_id_index');
            $table->enum('visibility_state', ['visible', 'grayed', 'inactive', 'invisible', 'not_available'])->default('visible');
            $table->integer('sort_order')->nullable();
            $table->unsignedBigInteger('created_by')->nullable()->index('template_file_field_assignments_created_by_foreign');
            $table->timestamps();

            $table->unique(['template_file_id', 'schema_field_id'], 'tffa_file_field_unique');
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
