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
        Schema::table('registration_invites', function (Blueprint $table) {
            $table->foreign(['invited_by'])->references(['id'])->on('users')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['used_by_user_id'])->references(['id'])->on('users')->onUpdate('no action')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('registration_invites', function (Blueprint $table) {
            $table->dropForeign('registration_invites_invited_by_foreign');
            $table->dropForeign('registration_invites_used_by_user_id_foreign');
        });
    }
};
