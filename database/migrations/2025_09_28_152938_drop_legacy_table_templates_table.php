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
        // Drop the legacy table_templates table
        // This table was created for backward compatibility but is no longer used
        // The modern template system uses project_template_usage and template_schema_dependencies instead
        Schema::dropIfExists('table_templates');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate the table_templates table structure (for rollback purposes)
        Schema::create('table_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('schema_table_id')->constrained()->onDelete('cascade');
            $table->foreignId('template_id')->constrained()->onDelete('cascade');
            $table->boolean('is_enabled')->default(true);
            $table->json('template_config')->nullable();
            $table->timestamps();

            $table->unique(['schema_table_id', 'template_id'], 'table_template_unique');
            $table->index('is_enabled');
        });
    }
};
