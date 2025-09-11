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
        // Add schema_id foreign key to schema_tables (replacing schema_version_id)
        Schema::table('schema_tables', function (Blueprint $table) {
            // Only add the column if it doesn't exist
            if (!Schema::hasColumn('schema_tables', 'schema_id')) {
                $table->foreignId('schema_id')->nullable()->after('id')->constrained()->onDelete('cascade');
                $table->index('schema_id');
            }
        });

        // We'll keep both schema_version_id and schema_id for now during transition
        // Data migration will be handled in a separate step
        
        // Update unique constraints to include schema_id - skip for now due to foreign key constraint issue
        // Schema::table('schema_tables', function (Blueprint $table) {
        //     // Drop old unique constraint
        //     $table->dropUnique(['schema_version_id', 'table_name']);
        //     
        //     // Add new unique constraint (will be enabled after data migration)
        //     $table->unique(['schema_id', 'table_name'], 'schema_table_name_unique');
        // });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schema_tables', function (Blueprint $table) {
            // Restore original unique constraint
            $table->unique(['schema_version_id', 'table_name']);
            
            // Drop new column and index
            $table->dropForeign(['schema_id']);
            $table->dropIndex(['schema_id']);
            $table->dropColumn('schema_id');
        });
    }
};
