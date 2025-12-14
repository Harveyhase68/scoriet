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
        Schema::create('template_purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('buyer_user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('seller_user_id')->constrained('users');
            $table->foreignId('template_id')->constrained();

            // Payment information - depends on price_type
            $table->enum('payment_type', ['credits', 'euros']);
            $table->integer('price_credits')->nullable(); // Credits price (when credits)
            $table->decimal('price_euros', 8, 2)->nullable(); // EUR price (when euros)

            // Revenue distribution (80% seller / 20% platform)
            $table->integer('seller_credits')->nullable(); // 80% credits to seller
            $table->decimal('seller_euros', 8, 2)->nullable(); // 80% EUR to seller
            $table->integer('platform_credits')->nullable(); // 20% credits platform
            $table->decimal('platform_euros', 8, 2)->nullable(); // 20% EUR platform

            // References
            $table->foreignId('credit_transaction_id')->nullable()->constrained('credit_transactions');
            $table->string('stripe_payment_id')->nullable(); // For EUR payment via Stripe
            $table->string('paypal_payment_id')->nullable(); // For EUR payment via PayPal

            $table->timestamps();

            $table->unique(['buyer_user_id', 'template_id']); // Can only buy once
            $table->index('seller_user_id');
            $table->index('template_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('template_purchases');
    }
};
