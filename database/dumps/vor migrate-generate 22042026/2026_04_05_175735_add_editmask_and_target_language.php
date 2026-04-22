<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add editmask column to schema_fields (if not exists)
        if (!Schema::hasColumn('schema_fields', 'editmask')) {
            Schema::table('schema_fields', function (Blueprint $table) {
                $table->text('editmask')->nullable()->after('comment');
            });
        }

        // Add target_language to projects
        if (!Schema::hasColumn('projects', 'target_language')) {
            Schema::table('projects', function (Blueprint $table) {
                $table->string('target_language', 30)->nullable()->default('html')->after('default_language');
            });
        }
    }

    public function down(): void
    {
        Schema::table('schema_fields', function (Blueprint $table) {
            if (Schema::hasColumn('schema_fields', 'editmask')) {
                $table->dropColumn('editmask');
            }
        });

        Schema::table('projects', function (Blueprint $table) {
            if (Schema::hasColumn('projects', 'target_language')) {
                $table->dropColumn('target_language');
            }
        });
    }
};
