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
        Schema::create('payout_items', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('payout_id')->index();
            $table->unsignedBigInteger('template_purchase_id')->index('payout_items_template_purchase_id_foreign');
            $table->decimal('sale_amount', 10);
            $table->decimal('seller_share', 10);
            $table->decimal('platform_share', 10);
            $table->decimal('vat_deducted', 10)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payout_items');
    }
};
