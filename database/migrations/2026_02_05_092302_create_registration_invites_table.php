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
        Schema::create('registration_invites', function (Blueprint $table) {
            $table->id();
            $table->string('email')->index();
            $table->string('token', 64)->unique();
            $table->string('name')->nullable(); // Optional name of invitee
            $table->text('note')->nullable(); // Optional note/reason for invite
            $table->foreignId('invited_by')->constrained('users')->onDelete('cascade');
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('used_at')->nullable();
            $table->foreignId('used_by_user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('expires_at');
            $table->timestamps();

            // Index for quick lookups
            $table->index(['token', 'expires_at']);
            $table->index(['email', 'used_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('registration_invites');
    }
};
