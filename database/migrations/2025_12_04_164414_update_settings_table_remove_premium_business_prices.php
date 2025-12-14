<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, backup old values if they exist
        $settings = DB::table('settings')->first();

        // Add new pricing columns
        Schema::table('settings', function (Blueprint $table) {
            $table->decimal('price_patron_annual', 10, 2)->default(34.90)->after('price_patron');
            $table->decimal('price_patron_monthly', 10, 2)->default(49.90)->after('price_patron_annual');
            $table->decimal('price_credits_500', 10, 2)->default(9.90)->after('price_patron_monthly');
            $table->decimal('price_credits_1000', 10, 2)->default(17.90)->after('price_credits_500');
            $table->decimal('price_credits_2500', 10, 2)->default(29.90)->after('price_credits_1000');
        });

        // Drop old pricing columns
        Schema::table('settings', function (Blueprint $table) {
            $table->dropColumn(['price_premium', 'price_business', 'price_patron']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Add back old pricing columns
        Schema::table('settings', function (Blueprint $table) {
            $table->decimal('price_premium', 10, 2)->default(9.99)->after('global_google_translate_key');
            $table->decimal('price_business', 10, 2)->default(29.99)->after('price_premium');
            $table->decimal('price_patron', 10, 2)->default(99.99)->after('price_business');
        });

        // Drop new pricing columns
        Schema::table('settings', function (Blueprint $table) {
            $table->dropColumn([
                'price_patron_annual',
                'price_patron_monthly',
                'price_credits_500',
                'price_credits_1000',
                'price_credits_2500'
            ]);
        });
    }
};
