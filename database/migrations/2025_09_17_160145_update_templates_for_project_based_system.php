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
        Schema::table('templates', function (Blueprint $table) {
            // Add new fields for project-based template system
            $table->string('full_name', 500)->nullable()->after('name'); // projectname/templatename
            $table->foreignId('project_id')->nullable()->after('owner_id')->constrained('projects')->onDelete('cascade');
            $table->boolean('is_system_template')->default(false)->after('visibility');
            $table->foreignId('original_template_id')->nullable()->after('is_system_template')->constrained('templates')->onDelete('set null');

            // Add indexes for performance
            $table->index(['project_id', 'visibility']);
            $table->index(['is_system_template', 'visibility']);
            $table->index('full_name');
        });

        // Update existing templates to be system templates
        // All existing templates become system templates with scoriet/ prefix
        DB::table('templates')->update([
            'full_name' => DB::raw("CONCAT('scoriet/', name)"),
            'is_system_template' => true,
            'project_id' => null,
            'visibility' => 'public'
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            // Drop indexes first
            $table->dropIndex(['project_id', 'visibility']);
            $table->dropIndex(['is_system_template', 'visibility']);
            $table->dropIndex(['full_name']);

            // Drop foreign key constraints
            $table->dropForeign(['project_id']);
            $table->dropForeign(['original_template_id']);

            // Drop columns
            $table->dropColumn(['full_name', 'project_id', 'is_system_template', 'original_template_id']);
        });
    }
};
