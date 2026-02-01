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
        Schema::table('template_purchases', function (Blueprint $table) {
            $table->foreign(['buyer_user_id'])->references(['id'])->on('users')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['credit_transaction_id'])->references(['id'])->on('credit_transactions')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['payout_id'])->references(['id'])->on('payouts')->onUpdate('no action')->onDelete('set null');
            $table->foreign(['seller_user_id'])->references(['id'])->on('users')->onUpdate('no action')->onDelete('no action');
            $table->foreign(['template_id'])->references(['id'])->on('templates')->onUpdate('no action')->onDelete('no action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('template_purchases', function (Blueprint $table) {
            $table->dropForeign('template_purchases_buyer_user_id_foreign');
            $table->dropForeign('template_purchases_credit_transaction_id_foreign');
            $table->dropForeign('template_purchases_payout_id_foreign');
            $table->dropForeign('template_purchases_seller_user_id_foreign');
            $table->dropForeign('template_purchases_template_id_foreign');
        });
    }
};
