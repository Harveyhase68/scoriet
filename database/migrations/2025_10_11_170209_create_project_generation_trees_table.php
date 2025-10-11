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
        Schema::create('project_generation_trees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->json('tree_data'); // The complete file tree structure
            $table->boolean('is_stale')->default(false); // Needs regeneration?
            $table->timestamp('generated_at')->nullable(); // When was it last generated
            $table->timestamps();

            // Indexes for performance
            $table->index('project_id');
            $table->index(['project_id', 'is_stale']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_generation_trees');
    }
};
