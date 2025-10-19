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
        // Get all indexes from the table
        $indexes = \DB::select("SHOW INDEX FROM schema_designer_layouts");

        foreach ($indexes as $index) {
            $keyName = $index->Key_name;

            // Skip PRIMARY key
            if ($keyName === 'PRIMARY') {
                continue;
            }

            // Drop any index/constraint that contains table_name in its name or structure
            if (stripos($keyName, 'table_name') !== false) {
                try {
                    \DB::statement("ALTER TABLE schema_designer_layouts DROP INDEX `{$keyName}`");
                    echo "Dropped index: {$keyName}\n";
                } catch (\Exception $e) {
                    echo "Could not drop index {$keyName}: " . $e->getMessage() . "\n";
                }
            }
        }

        // Remove table_name column if it exists
        if (Schema::hasColumn('schema_designer_layouts', 'table_name')) {
            Schema::table('schema_designer_layouts', function (Blueprint $table) {
                $table->dropColumn('table_name');
            });
            echo "Dropped column: table_name\n";
        }

        // Ensure correct unique constraint exists
        $hasCorrectConstraint = false;
        $indexes = \DB::select("SHOW INDEX FROM schema_designer_layouts WHERE Key_name = 'schema_designer_layouts_schema_id_version_number_unique'");

        if (!empty($indexes)) {
            $hasCorrectConstraint = true;
        }

        if (!$hasCorrectConstraint) {
            Schema::table('schema_designer_layouts', function (Blueprint $table) {
                $table->unique(['schema_id', 'version_number']);
            });
            echo "Created unique constraint: schema_id + version_number\n";
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Don't reverse this - we don't want table_name back
    }
};
