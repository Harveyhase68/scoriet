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
        Schema::table('project_form_set', function (Blueprint $table) {
            $table->foreign(['form_set_id'])->references(['id'])->on('form_sets')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['project_id'])->references(['id'])->on('projects')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_form_set', function (Blueprint $table) {
            $table->dropForeign('project_form_set_form_set_id_foreign');
            $table->dropForeign('project_form_set_project_id_foreign');
        });
    }
};
