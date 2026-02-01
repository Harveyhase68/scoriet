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
        Schema::table('payout_items', function (Blueprint $table) {
            $table->foreign(['payout_id'])->references(['id'])->on('payouts')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['template_purchase_id'])->references(['id'])->on('template_purchases')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payout_items', function (Blueprint $table) {
            $table->dropForeign('payout_items_payout_id_foreign');
            $table->dropForeign('payout_items_template_purchase_id_foreign');
        });
    }
};
