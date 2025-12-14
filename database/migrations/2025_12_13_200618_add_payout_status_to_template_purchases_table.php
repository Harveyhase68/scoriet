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
            // Track if this purchase has been paid out to the seller
            $table->boolean('is_paid_out')->default(false)->after('price_euros');
            $table->foreignId('payout_id')->nullable()->after('is_paid_out')->constrained()->onDelete('set null');
            $table->timestamp('paid_out_at')->nullable()->after('payout_id');

            // Calculate seller earnings at purchase time (in case rates change later)
            $table->decimal('seller_earnings', 10, 2)->nullable()->after('paid_out_at'); // 80% of sale
            $table->decimal('platform_fee', 10, 2)->nullable()->after('seller_earnings'); // 20% of sale

            $table->index('is_paid_out');
            $table->index(['seller_user_id', 'is_paid_out']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('template_purchases', function (Blueprint $table) {
            $table->dropForeign(['payout_id']);
            $table->dropIndex(['is_paid_out']);
            $table->dropIndex(['seller_user_id', 'is_paid_out']);
            $table->dropColumn([
                'is_paid_out',
                'payout_id',
                'paid_out_at',
                'seller_earnings',
                'platform_fee',
            ]);
        });
    }
};
