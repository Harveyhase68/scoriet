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
        Schema::create('project_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('role', ['member', 'admin', 'owner'])->default('member');
            $table->timestamp('joined_at')->useCurrent();
            $table->foreignId('invited_by')->nullable()->constrained('users');
            $table->text('notes')->nullable(); // Optional notes about the membership
            $table->timestamps();
            
            // Ensure unique user-project combinations
            $table->unique(['project_id', 'user_id']);
            
            // Indexes for better performance
            $table->index(['project_id', 'role']);
            $table->index(['user_id', 'joined_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_members');
    }
};
