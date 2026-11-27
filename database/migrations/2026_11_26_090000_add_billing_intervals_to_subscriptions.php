<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Both subscription plans are now sold monthly AND yearly.
     *
     * Until now the plan and its billing interval were the same thing
     * (Team & Studio = yearly only, Pro Unlimited = monthly only), and the
     * price columns were named after the interval. They are renamed after the
     * plan they belong to, and the two missing interval prices are added:
     *
     *   price_patron_annual   -> price_team_studio_yearly     (34.90)
     *   (new)                    price_team_studio_monthly    (4.90)
     *   price_patron_monthly  -> price_pro_unlimited_monthly  (49.90)
     *   (new)                    price_pro_unlimited_yearly   (478.80)
     *
     * users.patron_type keeps its meaning (the plan tier: 'annual' = Team &
     * Studio, 'monthly' = Pro Unlimited, see App\Support\PricingCatalog), the
     * billing interval is stored separately in users.billing_interval.
     */
    public function up(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->renameColumn('price_patron_annual', 'price_team_studio_yearly');
            $table->renameColumn('price_patron_monthly', 'price_pro_unlimited_monthly');
        });

        Schema::table('settings', function (Blueprint $table) {
            $table->decimal('price_team_studio_monthly', 10)->default(4.9)->after('price_team_studio_yearly');
            $table->decimal('price_pro_unlimited_yearly', 10)->default(478.8)->after('price_pro_unlimited_monthly');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->enum('billing_interval', ['month', 'year'])->nullable()->after('patron_type');
        });

        // Existing subscribers were billed in the only interval their plan had.
        DB::table('users')->where('user_type', 'patron')->where('patron_type', 'annual')->update(['billing_interval' => 'year']);
        DB::table('users')->where('user_type', 'patron')->where('patron_type', 'monthly')->update(['billing_interval' => 'month']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('billing_interval');
        });

        Schema::table('settings', function (Blueprint $table) {
            $table->dropColumn(['price_team_studio_monthly', 'price_pro_unlimited_yearly']);
        });

        Schema::table('settings', function (Blueprint $table) {
            $table->renameColumn('price_team_studio_yearly', 'price_patron_annual');
            $table->renameColumn('price_pro_unlimited_monthly', 'price_patron_monthly');
        });
    }
};
