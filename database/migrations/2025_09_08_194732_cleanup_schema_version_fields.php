<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Update schemas table: remove current_version and reset last_version to 0
        Schema::table('schemas', function (Blueprint $table) {
            // Remove the redundant current_version field
            $table->dropColumn('current_version');
        });

        // Reset all last_version values to 0 (new schemas start at 0, first import becomes version 1)
        DB::table('schemas')->update(['last_version' => 0]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Add current_version field back
        Schema::table('schemas', function (Blueprint $table) {
            $table->integer('current_version')->default(1)->after('is_template_schema');
        });

        // Restore current_version values to match last_version
        DB::table('schemas')->update(['current_version' => DB::raw('last_version')]);
    }
};
