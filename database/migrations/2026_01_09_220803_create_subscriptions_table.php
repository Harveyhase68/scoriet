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
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id')->index();
            $table->enum('subscription_type', ['project', 'schema', 'team', 'template', 'cli', 'service', 'bundle', 'form_designer', 'git_integration', 'code_adjustments', 'database_designer', 'schema_migration', 'message_attachments'])->nullable()->index();
            $table->unsignedBigInteger('entity_id')->nullable()->index();
            $table->boolean('is_free_tier')->default(false)->comment('Is this the free tier allocation?');
            $table->boolean('is_active')->default(true)->index();
            $table->boolean('is_soft_locked')->default(false)->comment('READ-ONLY after expiration');
            $table->timestamp('expires_at')->nullable()->comment('Null = unlimited (patron monthly)');
            $table->timestamp('expiry_warning_sent_at')->nullable();
            $table->timestamp('expiry_final_sent_at')->nullable();
            $table->timestamp('expired_notification_sent_at')->nullable();
            $table->integer('early_renewal_bonus_days')->default(0);
            $table->timestamps();

            $table->index(['subscription_type', 'entity_id']);
            $table->index(['user_id', 'is_active', 'expires_at']);
            $table->index(['user_id', 'subscription_type', 'is_active']);
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
