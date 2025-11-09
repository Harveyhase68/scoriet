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
        Schema::table('project_template_variable_values', function (Blueprint $table) {
            $table->foreign(['project_id'])->references(['id'])->on('projects')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['template_id'])->references(['id'])->on('templates')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_template_variable_values', function (Blueprint $table) {
            $table->dropForeign('project_template_variable_values_project_id_foreign');
            $table->dropForeign('project_template_variable_values_template_id_foreign');
        });
    }
};
