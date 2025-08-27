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
        // Templates main table
        Schema::create('templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('category', ['Web', 'Mobile', 'API', 'Desktop', 'Database']);
            $table->string('language', 50);
            $table->boolean('is_active')->default(true);
            $table->json('tags')->nullable(); // Store tags as JSON array
            $table->integer('file_count')->default(0);
            $table->timestamps();

            $table->index(['category', 'is_active']);
            $table->index('language');
        });

        // Template files
        Schema::create('template_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained()->onDelete('cascade');
            $table->string('file_name');
            $table->string('file_path');
            $table->text('file_content');
            $table->string('file_type', 50)->default('template'); // template, config, etc.
            $table->integer('file_order')->default(0);
            $table->timestamps();

            $table->index(['template_id', 'file_type']);
        });

        // Project template assignments
        Schema::create('project_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schema_version_id')->constrained()->onDelete('cascade');
            $table->foreignId('template_id')->constrained()->onDelete('cascade');
            $table->boolean('is_enabled')->default(true);
            $table->json('template_config')->nullable(); // Custom configuration per project
            $table->timestamps();

            $table->unique(['schema_version_id', 'template_id'], 'project_template_unique');
            $table->index('is_enabled');
        });

        // Table-specific template assignments (for later individual control)
        Schema::create('table_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schema_table_id')->constrained()->onDelete('cascade');
            $table->foreignId('template_id')->constrained()->onDelete('cascade');
            $table->boolean('is_enabled')->default(true);
            $table->json('template_config')->nullable(); // Custom configuration per table
            $table->timestamps();

            $table->unique(['schema_table_id', 'template_id'], 'table_template_unique');
            $table->index('is_enabled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('table_templates');
        Schema::dropIfExists('project_templates');
        Schema::dropIfExists('template_files');
        Schema::dropIfExists('templates');
    }
};
