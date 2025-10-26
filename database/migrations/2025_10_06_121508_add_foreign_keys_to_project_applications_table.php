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
        Schema::table('project_applications', function (Blueprint $table) {
            $table->foreign(['project_id'])->references(['id'])->on('projects')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['reviewed_by'])->references(['id'])->on('users')->onUpdate('no action')->onDelete('set null');
            $table->foreign(['user_id'])->references(['id'])->on('users')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_applications', function (Blueprint $table) {
            $table->dropForeign('project_applications_project_id_foreign');
            $table->dropForeign('project_applications_reviewed_by_foreign');
            $table->dropForeign('project_applications_user_id_foreign');
        });
    }
};
