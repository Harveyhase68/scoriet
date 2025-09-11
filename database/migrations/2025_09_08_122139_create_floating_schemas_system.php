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
        // Main schemas table - floating schemas with owners
        if (!Schema::hasTable('schemas')) {
            Schema::create('schemas', function (Blueprint $table) {
                $table->id();
                $table->string('name', 100); 
                $table->text('description')->nullable();
                $table->foreignId('owner_id')->constrained('users')->onDelete('cascade');
                $table->enum('visibility', ['private', 'public'])->default('private');
                $table->boolean('is_template_schema')->default(false);
                $table->timestamps();

                $table->index(['owner_id', 'visibility']);
                $table->index('is_template_schema');
                $table->unique(['owner_id', 'name'], 'owner_schema_name_unique');
            });
        }

        // Extend existing templates table with floating schema features
        Schema::table('templates', function (Blueprint $table) {
            $table->foreignId('owner_id')->nullable()->after('id')->constrained('users')->onDelete('cascade');
            $table->enum('visibility', ['private', 'public'])->default('private')->after('description');
            $table->json('template_files')->nullable()->after('visibility'); // Store template file structure
            
            $table->index(['owner_id', 'visibility']);
            // Don't add unique constraint until we have data migration
        });

        // Template schema dependencies - which schemas a template needs
        Schema::create('template_schema_dependencies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained()->onDelete('cascade');
            $table->foreignId('schema_id')->constrained()->onDelete('cascade');
            $table->boolean('is_required')->default(true);
            $table->string('alias')->nullable(); // Optional alias for the schema in template context
            $table->timestamps();

            $table->unique(['template_id', 'schema_id']);
        });

        // Project schema associations - which schemas a project uses
        Schema::create('project_schemas', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id'); // We'll add foreign key constraint later when projects table exists
            $table->foreignId('schema_id')->constrained()->onDelete('cascade');
            $table->enum('association_type', ['linked', 'cloned', 'imported'])->default('linked');
            $table->string('alias')->nullable(); // Optional alias for the schema in project context
            $table->timestamps();

            $table->unique(['project_id', 'schema_id']);
            $table->index('association_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_schemas');
        Schema::dropIfExists('template_schema_dependencies');
        
        // Remove added columns from existing templates table
        Schema::table('templates', function (Blueprint $table) {
            $table->dropIndex(['owner_id', 'visibility']);
            $table->dropForeign(['owner_id']);
            $table->dropColumn(['owner_id', 'visibility', 'template_files']);
        });
        
        Schema::dropIfExists('schemas');
    }
};
