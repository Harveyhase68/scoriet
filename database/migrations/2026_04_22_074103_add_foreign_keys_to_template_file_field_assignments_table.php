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
        Schema::table('template_file_field_assignments', function (Blueprint $table) {
            $table->foreign(['created_by'])->references(['id'])->on('users')->onUpdate('no action')->onDelete('set null');
            $table->foreign(['schema_field_id'])->references(['id'])->on('schema_fields')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['template_file_id'])->references(['id'])->on('template_files')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('template_file_field_assignments', function (Blueprint $table) {
            $table->dropForeign('template_file_field_assignments_created_by_foreign');
            $table->dropForeign('template_file_field_assignments_schema_field_id_foreign');
            $table->dropForeign('template_file_field_assignments_template_file_id_foreign');
        });
    }
};
