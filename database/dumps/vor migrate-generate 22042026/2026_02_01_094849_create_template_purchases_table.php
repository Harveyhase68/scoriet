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
            $table->bigIncrements('id');
            $table->unsignedBigInteger('buyer_user_id');
            $table->unsignedBigInteger('seller_user_id')->index();
            $table->unsignedBigInteger('template_id')->index();
            $table->enum('payment_type', ['credits', 'euros']);
            $table->integer('price_credits')->nullable();
            $table->decimal('price_euros')->nullable();
            $table->boolean('is_paid_out')->default(false)->index();
            $table->unsignedBigInteger('payout_id')->nullable()->index('template_purchases_payout_id_foreign');
            $table->timestamp('paid_out_at')->nullable();
            $table->decimal('seller_earnings', 10)->nullable();
            $table->decimal('platform_fee', 10)->nullable();
            $table->integer('seller_credits')->nullable();
            $table->decimal('seller_euros')->nullable();
            $table->integer('platform_credits')->nullable();
            $table->decimal('platform_euros')->nullable();
            $table->unsignedBigInteger('credit_transaction_id')->nullable()->index('template_purchases_credit_transaction_id_foreign');
            $table->string('stripe_payment_id')->nullable();
            $table->string('paypal_payment_id')->nullable();
            $table->timestamps();

            $table->unique(['buyer_user_id', 'template_id']);
            $table->index(['seller_user_id', 'is_paid_out']);
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
