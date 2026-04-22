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
        Schema::table('project_generations', function (Blueprint $table) {
            $table->foreign(['project_id'])->references(['id'])->on('projects')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['schema_version_id'])->references(['id'])->on('schema_versions')->onUpdate('no action')->onDelete('set null');
            $table->foreign(['template_id'])->references(['id'])->on('templates')->onUpdate('no action')->onDelete('set null');
            $table->foreign(['user_id'])->references(['id'])->on('users')->onUpdate('no action')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_generations', function (Blueprint $table) {
            $table->dropForeign('project_generations_project_id_foreign');
            $table->dropForeign('project_generations_schema_version_id_foreign');
            $table->dropForeign('project_generations_template_id_foreign');
            $table->dropForeign('project_generations_user_id_foreign');
        });
    }
};
