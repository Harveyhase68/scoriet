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
        Schema::create('project_invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->foreignId('invited_by')->constrained('users');
            $table->foreignId('invited_user_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->string('invited_email');
            $table->enum('role', ['member', 'admin'])->default('member');
            $table->enum('status', ['pending', 'accepted', 'declined', 'expired'])->default('pending');
            $table->text('message')->nullable();
            $table->string('token', 64)->unique();
            $table->timestamp('expires_at');
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();
            
            // Indexes for better performance
            $table->index(['project_id', 'status']);
            $table->index(['invited_email', 'status']);
            $table->index(['token', 'expires_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_invitations');
    }
};
