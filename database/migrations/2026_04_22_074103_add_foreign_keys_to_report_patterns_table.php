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
        Schema::table('report_patterns', function (Blueprint $table) {
            $table->foreign(['cloned_from_id'])->references(['id'])->on('report_patterns')->onUpdate('no action')->onDelete('set null');
            $table->foreign(['creator_user_id'])->references(['id'])->on('users')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('report_patterns', function (Blueprint $table) {
            $table->dropForeign('report_patterns_cloned_from_id_foreign');
            $table->dropForeign('report_patterns_creator_user_id_foreign');
        });
    }
};
