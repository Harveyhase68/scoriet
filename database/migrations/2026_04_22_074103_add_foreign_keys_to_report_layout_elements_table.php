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
        Schema::table('report_layout_elements', function (Blueprint $table) {
            $table->foreign(['container_element_id'])->references(['id'])->on('report_pattern_elements')->onUpdate('no action')->onDelete('set null');
            $table->foreign(['report_pattern_form_id'])->references(['id'])->on('report_pattern_forms')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['schema_field_id'])->references(['id'])->on('schema_fields')->onUpdate('no action')->onDelete('set null');
            $table->foreign(['schema_table_id'])->references(['id'])->on('schema_tables')->onUpdate('no action')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('report_layout_elements', function (Blueprint $table) {
            $table->dropForeign('report_layout_elements_container_element_id_foreign');
            $table->dropForeign('report_layout_elements_report_pattern_form_id_foreign');
            $table->dropForeign('report_layout_elements_schema_field_id_foreign');
            $table->dropForeign('report_layout_elements_schema_table_id_foreign');
        });
    }
};
