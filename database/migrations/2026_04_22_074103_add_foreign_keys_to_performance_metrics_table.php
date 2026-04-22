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
        Schema::table('performance_metrics', function (Blueprint $table) {
            $table->foreign(['user_id'], 'performance_metrics_ibfk_1')->references(['id'])->on('users')->onUpdate('no action')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('performance_metrics', function (Blueprint $table) {
            $table->dropForeign('performance_metrics_ibfk_1');
        });
    }
};
