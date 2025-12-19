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
            // Git provider connection reference
            $table->foreignId('git_provider_id')
                ->nullable()
                ->after('owner_id')
                ->constrained('user_git_providers')
                ->nullOnDelete();

            // Repository information
            $table->string('git_repository')->nullable()->after('git_provider_id'); // e.g., "username/repo-name"
            $table->string('git_default_branch')->nullable()->after('git_repository'); // Branch for pushing code
            $table->string('git_main_branch')->nullable()->after('git_default_branch'); // Target branch for PRs (usually main/master)
            $table->string('git_target_directory')->nullable()->after('git_main_branch'); // Subdirectory in repo for generated code

            // Workflow configuration
            $table->enum('git_workflow', ['push_only', 'push_and_pr', 'push_pr_merge'])
                ->default('push_only')
                ->after('git_target_directory');

            // PR settings
            $table->string('git_pr_title_template')->nullable()->after('git_workflow');
            $table->text('git_pr_description_template')->nullable()->after('git_pr_title_template');
            $table->boolean('git_auto_delete_branch')->default(true)->after('git_pr_description_template');

            // Index for faster lookups
            $table->index(['git_provider_id', 'git_repository']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropIndex(['git_provider_id', 'git_repository']);
            $table->dropConstrainedForeignId('git_provider_id');
            $table->dropColumn([
                'git_repository',
                'git_default_branch',
                'git_main_branch',
                'git_target_directory',
                'git_workflow',
                'git_pr_title_template',
                'git_pr_description_template',
                'git_auto_delete_branch',
            ]);
        });
    }
};
