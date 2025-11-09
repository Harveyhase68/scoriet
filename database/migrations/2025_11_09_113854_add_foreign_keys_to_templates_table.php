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
        Schema::table('templates', function (Blueprint $table) {
            $table->foreign(['creator_user_id'])->references(['id'])->on('users')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['original_template_id'])->references(['id'])->on('templates')->onUpdate('no action')->onDelete('set null');
            $table->foreign(['project_id'])->references(['id'])->on('projects')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            $table->dropForeign('templates_creator_user_id_foreign');
            $table->dropForeign('templates_original_template_id_foreign');
            $table->dropForeign('templates_project_id_foreign');
        });
    }
};
