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
        Schema::table('project_schemas', function (Blueprint $table) {
            // Add foreign key constraint to project_id now that we know projects table exists
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
        });

        // Also add the unique constraint to schema_tables that we couldn't add before
        Schema::table('schema_tables', function (Blueprint $table) {
            // Only add if the column exists and has data migrated
            if (Schema::hasColumn('schema_tables', 'schema_id')) {
                $table->unique(['schema_id', 'table_name'], 'schema_table_name_unique');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_schemas', function (Blueprint $table) {
            $table->dropForeign(['project_id']);
        });

        Schema::table('schema_tables', function (Blueprint $table) {
            $table->dropUnique('schema_table_name_unique');
        });
    }
};
