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
        // Remove the legacy template_files JSON column
        // The modern system uses the template_files table with proper relations
        Schema::table('templates', function (Blueprint $table) {
            $table->dropColumn('template_files');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate the template_files JSON column for rollback
        Schema::table('templates', function (Blueprint $table) {
            $table->json('template_files')->nullable()->after('original_template_id');
        });
    }
};
