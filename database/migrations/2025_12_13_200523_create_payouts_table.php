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
        Schema::create('payouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // Period this payout covers
            $table->date('period_start');
            $table->date('period_end');

            // Amounts
            $table->decimal('gross_amount', 10, 2); // Total sales amount (e.g., 100€)
            $table->decimal('platform_fee', 10, 2); // 20% platform fee (e.g., 20€)
            $table->decimal('vat_amount', 10, 2)->default(0); // VAT deducted if applicable
            $table->decimal('net_amount', 10, 2); // Amount paid to seller (e.g., 80€ or 66.67€)

            // Seller type at time of payout (for audit trail)
            $table->enum('seller_type', ['at_business', 'eu_vat', 'eu_private', 'non_eu_business', 'non_eu_private']);

            // Payout method and details (snapshot at time of payout)
            $table->enum('payout_method', ['bank_transfer', 'paypal']);
            $table->string('payout_destination')->nullable(); // PayPal email or IBAN

            // Status
            $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'cancelled'])->default('pending');

            // Payment transaction details
            $table->string('transaction_id')->nullable(); // PayPal transaction ID or bank reference
            $table->text('transaction_details')->nullable(); // JSON with full transaction response
            $table->text('failure_reason')->nullable();

            // Timestamps
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            // Indexes
            $table->index(['user_id', 'status']);
            $table->index(['period_start', 'period_end']);
            $table->index('status');
        });

        // Payout items - individual sales included in a payout
        Schema::create('payout_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payout_id')->constrained()->onDelete('cascade');
            $table->foreignId('template_purchase_id')->constrained()->onDelete('cascade');

            // Amounts for this specific sale
            $table->decimal('sale_amount', 10, 2); // Original sale price
            $table->decimal('seller_share', 10, 2); // 80% to seller
            $table->decimal('platform_share', 10, 2); // 20% to platform
            $table->decimal('vat_deducted', 10, 2)->default(0); // VAT deducted if applicable

            $table->timestamps();

            $table->index('payout_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payout_items');
        Schema::dropIfExists('payouts');
    }
};
