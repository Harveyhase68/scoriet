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
        Schema::table('report_images', function (Blueprint $table) {
            $table->foreign(['report_pattern_id'])->references(['id'])->on('report_patterns')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('report_images', function (Blueprint $table) {
            $table->dropForeign('report_images_report_pattern_id_foreign');
        });
    }
};
