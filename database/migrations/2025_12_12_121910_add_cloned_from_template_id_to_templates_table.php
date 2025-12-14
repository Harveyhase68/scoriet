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
        Schema::table('templates', function (Blueprint $table) {
            // Track which store template this was cloned from (for plagiarism detection and visibility lock)
            $table->unsignedBigInteger('cloned_from_template_id')->nullable()->after('original_template_id');
            $table->foreign('cloned_from_template_id')->references('id')->on('templates')->onDelete('set null');

            // Flag to lock visibility to private (cloned from store templates)
            $table->boolean('visibility_locked')->default(false)->after('visibility');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            $table->dropForeign(['cloned_from_template_id']);
            $table->dropColumn('cloned_from_template_id');
            $table->dropColumn('visibility_locked');
        });
    }
};
