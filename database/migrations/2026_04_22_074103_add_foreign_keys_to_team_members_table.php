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
        Schema::table('team_members', function (Blueprint $table) {
            $table->foreign(['team_id'])->references(['id'])->on('teams')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['team_role_id'])->references(['id'])->on('team_roles')->onUpdate('no action')->onDelete('set null');
            $table->foreign(['user_id'])->references(['id'])->on('users')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('team_members', function (Blueprint $table) {
            $table->dropForeign('team_members_team_id_foreign');
            $table->dropForeign('team_members_team_role_id_foreign');
            $table->dropForeign('team_members_user_id_foreign');
        });
    }
};
