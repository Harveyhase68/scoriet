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
        Schema::table('projects', function (Blueprint $table) {
            // Database connection settings
            $table->string('database_name')->nullable()->after('settings');
            $table->string('database_type')->default('MySQL')->after('database_name');
            $table->string('database_server')->default('127.0.0.1')->after('database_type');
            $table->string('database_port')->default('3306')->after('database_server');
            $table->string('database_username')->nullable()->after('database_port');
            $table->string('database_password')->nullable()->after('database_username');

            // Project paths and URLs
            $table->string('project_directory')->nullable()->after('database_password');
            $table->string('project_url')->nullable()->after('project_directory');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn([
                'database_name',
                'database_type',
                'database_server',
                'database_port',
                'database_username',
                'database_password',
                'project_directory',
                'project_url'
            ]);
        });
    }
};
