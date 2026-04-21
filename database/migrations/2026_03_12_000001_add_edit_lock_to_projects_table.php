<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->unsignedBigInteger('locked_by_user_id')->nullable()->after('owner_id');
            $table->timestamp('locked_at')->nullable()->after('locked_by_user_id');

            $table->foreign('locked_by_user_id')
                  ->references('id')
                  ->on('users')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropForeign(['locked_by_user_id']);
            $table->dropColumn(['locked_by_user_id', 'locked_at']);
        });
    }
};
