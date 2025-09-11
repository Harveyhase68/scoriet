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
        // Check if schema_versions table needs extending (may already be done by previous migration)
        if (!Schema::hasColumn('schema_versions', 'floating_schema_id')) {
            Schema::table('schema_versions', function (Blueprint $table) {
                // Add floating schema support
                $table->unsignedBigInteger('floating_schema_id')->nullable()->after('id');
                $table->integer('version_number')->nullable()->after('version_name');
                $table->datetime('imported_at')->nullable()->after('description');
                
                // Add index for floating schema relations
                $table->index(['floating_schema_id', 'version_number']);
                $table->foreign('floating_schema_id')->references('id')->on('schemas')->onDelete('cascade');
            });
        }

        // Migrate data from floating_schema_versions to schema_versions
        if (Schema::hasTable('floating_schema_versions')) {
            DB::table('floating_schema_versions')->orderBy('id')->chunk(100, function ($versions) {
                foreach ($versions as $version) {
                    // Create new schema_version entry
                    $newVersionId = DB::table('schema_versions')->insertGetId([
                        'floating_schema_id' => $version->schema_id,
                        'version_name' => "v{$version->version_number}",
                        'version_number' => $version->version_number,
                        'description' => $version->description,
                        'imported_at' => $version->imported_at,
                        'created_at' => $version->created_at ?? now(),
                        'updated_at' => $version->updated_at ?? now(),
                    ]);

                    // Update schema_tables to point to new schema_version
                    DB::table('schema_tables')
                        ->where('floating_schema_version_id', $version->id)
                        ->update([
                            'schema_version_id' => $newVersionId,
                            'floating_schema_version_id' => null
                        ]);
                }
            });
        }

        // Update schema_tables to remove floating_schema_version_id column
        Schema::table('schema_tables', function (Blueprint $table) {
            if (Schema::hasColumn('schema_tables', 'floating_schema_version_id')) {
                $table->dropForeign(['floating_schema_version_id']);
                $table->dropColumn('floating_schema_version_id');
            }
        });

        // Drop the floating_schema_versions table
        Schema::dropIfExists('floating_schema_versions');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate floating_schema_versions table
        Schema::create('floating_schema_versions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('schema_id');
            $table->integer('version_number');
            $table->string('description')->nullable();
            $table->timestamp('imported_at');
            $table->timestamps();

            $table->foreign('schema_id')->references('id')->on('schemas')->onDelete('cascade');
            $table->unique(['schema_id', 'version_number']);
        });

        // Add back floating_schema_version_id to schema_tables
        Schema::table('schema_tables', function (Blueprint $table) {
            $table->unsignedBigInteger('floating_schema_version_id')->nullable()->after('schema_id');
            $table->foreign('floating_schema_version_id')->references('id')->on('floating_schema_versions')->onDelete('cascade');
        });

        // Migrate data back from schema_versions
        DB::table('schema_versions')
            ->whereNotNull('floating_schema_id')
            ->orderBy('id')
            ->chunk(100, function ($versions) {
                foreach ($versions as $version) {
                    // Create floating_schema_version entry
                    $floatingVersionId = DB::table('floating_schema_versions')->insertGetId([
                        'schema_id' => $version->floating_schema_id,
                        'version_number' => $version->version_number,
                        'description' => $version->description,
                        'imported_at' => $version->imported_at,
                        'created_at' => $version->created_at,
                        'updated_at' => $version->updated_at,
                    ]);

                    // Update schema_tables
                    DB::table('schema_tables')
                        ->where('schema_version_id', $version->id)
                        ->update(['floating_schema_version_id' => $floatingVersionId]);
                }
            });

        // Remove floating schema columns from schema_versions
        Schema::table('schema_versions', function (Blueprint $table) {
            $table->dropForeign(['floating_schema_id']);
            $table->dropIndex(['floating_schema_id', 'version_number']);
            $table->dropColumn(['floating_schema_id', 'version_number', 'imported_at']);
        });
    }
};
