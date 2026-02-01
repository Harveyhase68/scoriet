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
        Schema::table('project_kanban_roles', function (Blueprint $table) {
            $table->foreign(['assigned_by'])->references(['id'])->on('users')->onUpdate('no action')->onDelete('set null');
            $table->foreign(['project_id'])->references(['id'])->on('projects')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['user_id'])->references(['id'])->on('users')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_kanban_roles', function (Blueprint $table) {
            $table->dropForeign('project_kanban_roles_assigned_by_foreign');
            $table->dropForeign('project_kanban_roles_project_id_foreign');
            $table->dropForeign('project_kanban_roles_user_id_foreign');
        });
    }
};
