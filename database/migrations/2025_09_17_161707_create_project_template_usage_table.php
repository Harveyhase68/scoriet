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
        Schema::create('project_template_usage', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->foreignId('template_id')->constrained('templates')->onDelete('cascade');
            $table->enum('usage_type', ['linked', 'cloned']); // linked = use, cloned = clone
            $table->string('alias')->nullable(); // Optional custom name for the template in this project
            $table->json('config')->nullable(); // Template-specific configuration
            $table->boolean('is_active')->default(true);
            $table->timestamp('used_at')->useCurrent();
            $table->timestamps();

            // Ensure unique template usage per project
            $table->unique(['project_id', 'template_id'], 'project_template_unique');

            // Indexes for performance
            $table->index(['project_id', 'usage_type']);
            $table->index(['template_id', 'usage_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_template_usage');
    }
};
