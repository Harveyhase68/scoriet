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
        Schema::create('report_pattern_field_assignments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('report_pattern_id')->index('rpfa_report_pattern_id_index');
            $table->unsignedBigInteger('schema_field_id')->index('rpfa_schema_field_id_index');
            $table->enum('visibility_state', ['visible', 'grayed', 'inactive', 'invisible', 'not_available'])->default('visible');
            $table->integer('sort_order')->nullable();
            $table->unsignedBigInteger('created_by')->nullable()->index('report_pattern_field_assignments_created_by_foreign');
            $table->timestamps();

            $table->unique(['report_pattern_id', 'schema_field_id'], 'rpfa_pattern_field_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_pattern_field_assignments');
    }
};
