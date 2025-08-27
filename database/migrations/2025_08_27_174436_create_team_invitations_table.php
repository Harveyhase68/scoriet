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
        Schema::create('team_invitations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->onDelete('cascade');
            $table->foreignId('invited_by')->constrained('users')->onDelete('cascade');
            $table->string('invited_user_id'); // GitHub-style user ID (e.g., "Harveyhase68")
            $table->string('invited_email')->nullable(); // Optional email for notification
            $table->enum('role', ['admin', 'member'])->default('member'); // owner can't be invited
            $table->enum('status', ['pending', 'accepted', 'declined', 'expired'])->default('pending');
            $table->text('message')->nullable(); // Optional invitation message
            $table->string('token')->unique(); // Invitation token for security
            $table->timestamp('expires_at');
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();
            
            $table->index(['invited_user_id', 'status']);
            $table->index(['token']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('team_invitations');
    }
};
