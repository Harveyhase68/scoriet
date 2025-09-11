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
        // Add version tracking to floating schemas (if not exists)
        Schema::table('schemas', function (Blueprint $table) {
            if (!Schema::hasColumn('schemas', 'current_version')) {
                $table->integer('current_version')->default(1)->after('is_template_schema');
            }
            if (!Schema::hasColumn('schemas', 'last_version')) {
                $table->integer('last_version')->default(0)->after('current_version');
            }
        });

        // Create new floating_schema_versions table for tracking individual versions
        Schema::create('floating_schema_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schema_id')->constrained()->onDelete('cascade');
            $table->integer('version_number');
            $table->text('description')->nullable();
            $table->timestamp('imported_at');
            $table->timestamps();
            
            $table->unique(['schema_id', 'version_number']);
            $table->index(['schema_id', 'version_number']);
        });

        // Update schema_tables to reference schema_versions instead of old schema_versions
        Schema::table('schema_tables', function (Blueprint $table) {
            // Add new foreign key to schema_versions
            if (!Schema::hasColumn('schema_tables', 'floating_schema_version_id')) {
                $table->foreignId('floating_schema_version_id')->nullable()->after('schema_id')->constrained('floating_schema_versions')->onDelete('cascade');
                $table->index('floating_schema_version_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schema_tables', function (Blueprint $table) {
            if (Schema::hasColumn('schema_tables', 'floating_schema_version_id')) {
                $table->dropForeign(['floating_schema_version_id']);
                $table->dropIndex(['floating_schema_version_id']);
                $table->dropColumn('floating_schema_version_id');
            }
        });
        
        Schema::dropIfExists('floating_schema_versions');
        
        Schema::table('schemas', function (Blueprint $table) {
            $table->dropColumn(['current_version', 'last_version']);
        });
    }
};
