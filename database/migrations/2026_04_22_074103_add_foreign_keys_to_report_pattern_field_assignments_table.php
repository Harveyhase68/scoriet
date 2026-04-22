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
        Schema::table('report_pattern_field_assignments', function (Blueprint $table) {
            $table->foreign(['created_by'])->references(['id'])->on('users')->onUpdate('no action')->onDelete('set null');
            $table->foreign(['report_pattern_id'])->references(['id'])->on('report_patterns')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['schema_field_id'])->references(['id'])->on('schema_fields')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('report_pattern_field_assignments', function (Blueprint $table) {
            $table->dropForeign('report_pattern_field_assignments_created_by_foreign');
            $table->dropForeign('report_pattern_field_assignments_report_pattern_id_foreign');
            $table->dropForeign('report_pattern_field_assignments_schema_field_id_foreign');
        });
    }
};
