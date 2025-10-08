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
        Schema::table('teams', function (Blueprint $table) {
            $table->dropColumn('project_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            $table->unsignedBigInteger('project_id')->nullable();
            $table->index('project_id', 'teams_project_id_foreign');
            $table->index(['project_owner_id', 'project_id'], 'teams_project_owner_id_project_id_index');
        });
    }
};
