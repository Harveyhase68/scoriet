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
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id');
            $table->date('period_start');
            $table->date('period_end');
            $table->decimal('gross_amount', 10);
            $table->decimal('platform_fee', 10);
            $table->decimal('vat_amount', 10)->default(0);
            $table->decimal('net_amount', 10);
            $table->enum('seller_type', ['at_business', 'eu_vat', 'eu_private', 'non_eu_business', 'non_eu_private']);
            $table->enum('payout_method', ['bank_transfer', 'paypal']);
            $table->string('payout_destination')->nullable();
            $table->enum('status', ['pending', 'processing', 'completed', 'failed', 'cancelled'])->default('pending')->index();
            $table->string('transaction_id')->nullable();
            $table->text('transaction_details')->nullable();
            $table->text('failure_reason')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['period_start', 'period_end']);
            $table->index(['user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payouts');
    }
};
