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
        Schema::table('code_adjustments', function (Blueprint $table) {
            $table->foreign(['created_by_user_id'])->references(['id'])->on('users')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['project_id'])->references(['id'])->on('projects')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('code_adjustments', function (Blueprint $table) {
            $table->dropForeign('code_adjustments_created_by_user_id_foreign');
            $table->dropForeign('code_adjustments_project_id_foreign');
        });
    }
};
