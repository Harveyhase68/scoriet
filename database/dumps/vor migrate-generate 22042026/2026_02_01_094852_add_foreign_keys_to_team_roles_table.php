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
        Schema::table('team_roles', function (Blueprint $table) {
            $table->foreign(['team_id'])->references(['id'])->on('teams')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('team_roles', function (Blueprint $table) {
            $table->dropForeign('team_roles_team_id_foreign');
        });
    }
};
