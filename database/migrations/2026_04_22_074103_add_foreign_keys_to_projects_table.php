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
        Schema::table('projects', function (Blueprint $table) {
            $table->foreign(['git_provider_id'])->references(['id'])->on('user_git_providers')->onUpdate('no action')->onDelete('set null');
            $table->foreign(['locked_by_user_id'])->references(['id'])->on('users')->onUpdate('no action')->onDelete('set null');
            $table->foreign(['owner_id'])->references(['id'])->on('users')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropForeign('projects_git_provider_id_foreign');
            $table->dropForeign('projects_locked_by_user_id_foreign');
            $table->dropForeign('projects_owner_id_foreign');
        });
    }
};
