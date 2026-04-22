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
        Schema::table('report_pattern_elements', function (Blueprint $table) {
            $table->foreign(['linked_element_id'])->references(['id'])->on('report_pattern_elements')->onUpdate('no action')->onDelete('set null');
            $table->foreign(['report_pattern_form_id'])->references(['id'])->on('report_pattern_forms')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('report_pattern_elements', function (Blueprint $table) {
            $table->dropForeign('report_pattern_elements_linked_element_id_foreign');
            $table->dropForeign('report_pattern_elements_report_pattern_form_id_foreign');
        });
    }
};
