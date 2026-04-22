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
        Schema::create('projects', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name')->index();
            $table->text('description')->nullable();
            $table->unsignedBigInteger('owner_id');
            $table->unsignedBigInteger('locked_by_user_id')->nullable()->index('projects_locked_by_user_id_foreign');
            $table->timestamp('locked_at')->nullable();
            $table->unsignedBigInteger('git_provider_id')->nullable();
            $table->string('git_repository')->nullable();
            $table->string('git_default_branch')->nullable();
            $table->string('git_main_branch')->nullable();
            $table->string('git_target_directory')->nullable();
            $table->enum('git_workflow', ['push_only', 'push_and_pr', 'push_pr_merge'])->default('push_only');
            $table->string('git_pr_title_template')->nullable();
            $table->text('git_pr_description_template')->nullable();
            $table->boolean('git_auto_delete_branch')->default(true);
            $table->string('deployment_type', 10)->nullable();
            $table->string('ftp_host')->nullable();
            $table->integer('ftp_port')->nullable()->default(21);
            $table->string('ftp_username')->nullable();
            $table->text('ftp_password')->nullable();
            $table->string('ftp_directory')->nullable();
            $table->boolean('ftp_passive')->default(true);
            $table->boolean('ftp_ssl')->default(false);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_public')->default(true);
            $table->string('join_code', 20)->nullable()->unique();
            $table->boolean('allow_join_requests')->default(false);
            $table->json('settings')->nullable();
            $table->string('database_name')->nullable();
            $table->string('database_type')->default('MySQL');
            $table->string('database_server')->default('127.0.0.1');
            $table->string('database_port')->default('3306');
            $table->string('database_username')->nullable();
            $table->string('database_password')->nullable();
            $table->unsignedSmallInteger('diagram_max_tables_per_row')->default(20);
            $table->unsignedSmallInteger('diagram_table_width')->default(280);
            $table->unsignedSmallInteger('diagram_table_height')->default(450);
            $table->unsignedSmallInteger('diagram_horizontal_spacing')->default(600);
            $table->unsignedSmallInteger('diagram_vertical_spacing')->default(700);
            $table->boolean('form_designer_snap_to_grid')->default(true);
            $table->integer('form_designer_grid_size')->default(20);
            $table->boolean('report_designer_snap_to_grid')->default(true);
            $table->string('report_designer_grid_unit', 10)->default('mm');
            $table->decimal('report_designer_grid_size')->default(5);
            $table->string('project_directory')->nullable();
            $table->string('project_url')->nullable();
            $table->string('start_page')->nullable()->default('index.php');
            $table->string('default_language', 10)->nullable()->default('en');
            $table->string('target_language', 30)->nullable()->default('html');
            $table->enum('archive_format', ['zip', 'tar.gz', 'tar.xz'])->default('zip')->comment('Archive format for code generation (zip, tar.gz, tar.xz)');
            $table->unsignedTinyInteger('filename_short_length')->nullable()->default(2);
            $table->json('enabled_languages')->nullable();
            $table->string('google_translate_api_key', 500)->nullable();
            $table->timestamps();
            $table->json('protected_files')->nullable()->comment('Project-specific protected files (in addition to template protected files)');
            $table->json('install_script')->nullable()->comment('Project-specific install instructions (overrides template)');
            $table->json('update_script')->nullable()->comment('Project-specific update instructions (overrides template)');

            $table->index(['git_provider_id', 'git_repository']);
            $table->index(['owner_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
