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
        Schema::table('form_sets', function (Blueprint $table) {
            $table->foreign(['cloned_from_id'])->references(['id'])->on('form_sets')->onUpdate('no action')->onDelete('set null');
            $table->foreign(['creator_user_id'])->references(['id'])->on('users')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('form_sets', function (Blueprint $table) {
            $table->dropForeign('form_sets_cloned_from_id_foreign');
            $table->dropForeign('form_sets_creator_user_id_foreign');
        });
    }
};
