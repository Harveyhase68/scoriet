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
        Schema::create('code_adjustments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->string('name', 255);
            $table->text('description')->nullable();

            // File matching pattern (e.g., "table_%1.php", "%1_controller_%2.php")
            $table->string('file_pattern', 500);

            // Match confidence threshold (0.0 to 1.0, default 0.8)
            $table->decimal('min_confidence', 3, 2)->default(0.80);

            // Status for soft-disable
            $table->boolean('is_active')->default(true);

            // Ordering for multiple adjustments on same file
            $table->integer('execution_order')->default(0);

            // Metadata for tracking
            $table->unsignedBigInteger('created_by_user_id');
            $table->timestamps();

            // Foreign keys
            $table->foreign('project_id')
                  ->references('id')->on('projects')
                  ->onDelete('cascade');
            $table->foreign('created_by_user_id')
                  ->references('id')->on('users')
                  ->onDelete('cascade');

            // Indexes
            $table->index(['project_id', 'is_active']);
            $table->index(['project_id', 'file_pattern']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('code_adjustments');
    }
};
