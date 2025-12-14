<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This creates a unified subscriptions table to replace:
     * - project_subscriptions
     * - schema_subscriptions
     * - team_subscriptions
     * - template_subscriptions
     * - cli_subscriptions
     */
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();

            // User who owns the subscription
            $table->unsignedBigInteger('user_id')->index();

            // Type of subscription (what entity is being subscribed to)
            $table->enum('subscription_type', [
                'project',
                'schema',
                'team',
                'template',
                'cli',
                'service',
                'bundle',
            ])->index();

            // Reference to the subscribed entity (polymorphic-like approach)
            // Nullable because CLI subscriptions don't have an entity
            $table->unsignedBigInteger('entity_id')->nullable()->index();

            // Subscription status
            $table->boolean('is_free_tier')->default(false)->comment('Is this the free tier allocation?');
            $table->boolean('is_active')->default(true)->index();
            $table->boolean('is_soft_locked')->default(false)->comment('READ-ONLY after expiration');

            // Expiration
            $table->timestamp('expires_at')->nullable()->comment('Null = unlimited (patron monthly)');

            $table->timestamps();

            // Foreign key to users
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            // Composite indexes for common queries
            $table->index(['user_id', 'subscription_type', 'is_active']);
            $table->index(['subscription_type', 'entity_id']);
            $table->index(['user_id', 'is_active', 'expires_at']);

            // Unique constraint: one active subscription per user per entity
            $table->unique(['user_id', 'subscription_type', 'entity_id'], 'unique_user_subscription');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
