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
        Schema::table('schema_versions', function (Blueprint $table) {
            // Drop the old foreign key constraint
            $table->dropForeign(['floating_schema_id']);
            $table->dropIndex(['floating_schema_id', 'version_number']);
            
            // Rename the column
            $table->renameColumn('floating_schema_id', 'schema_id');
        });

        // Add the new foreign key and index after renaming
        Schema::table('schema_versions', function (Blueprint $table) {
            $table->foreign('schema_id')->references('id')->on('schemas')->onDelete('cascade');
            $table->index(['schema_id', 'version_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schema_versions', function (Blueprint $table) {
            // Drop the new foreign key constraint
            $table->dropForeign(['schema_id']);
            $table->dropIndex(['schema_id', 'version_number']);
            
            // Rename back
            $table->renameColumn('schema_id', 'floating_schema_id');
        });

        // Add back the old foreign key and index
        Schema::table('schema_versions', function (Blueprint $table) {
            $table->foreign('floating_schema_id')->references('id')->on('schemas')->onDelete('cascade');
            $table->index(['floating_schema_id', 'version_number']);
        });
    }
};
