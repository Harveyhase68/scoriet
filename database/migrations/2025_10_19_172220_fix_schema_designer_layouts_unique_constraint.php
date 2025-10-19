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
        // Drop table_name column if it exists
        if (Schema::hasColumn('schema_designer_layouts', 'table_name')) {
            Schema::table('schema_designer_layouts', function (Blueprint $table) {
                $table->dropColumn('table_name');
            });
        }

        // Check if the correct unique constraint exists, if not create it
        $indexes = \DB::select("SHOW INDEX FROM schema_designer_layouts WHERE Key_name = 'schema_designer_layouts_schema_id_version_number_unique'");

        if (empty($indexes)) {
            Schema::table('schema_designer_layouts', function (Blueprint $table) {
                $table->unique(['schema_id', 'version_number']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // We don't want to add table_name back
        Schema::table('schema_designer_layouts', function (Blueprint $table) {
            $table->dropUnique(['schema_id', 'version_number']);
        });
    }
};
