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
        Schema::create('template_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('template_id')->nullable(); // Nullable so subscription persists if template is deleted
            $table->unsignedBigInteger('user_id');
            $table->boolean('is_free_tier')->default(false);
            $table->timestamp('expires_at')->nullable(); // Null = unlimited (patron)
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Foreign keys
            $table->foreign('template_id')->references('id')->on('templates')->onDelete('set null');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            // Index for quick lookups
            $table->index(['user_id', 'is_active', 'expires_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('template_subscriptions');
    }
};
