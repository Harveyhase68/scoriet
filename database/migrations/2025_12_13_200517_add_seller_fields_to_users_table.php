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
        Schema::table('users', function (Blueprint $table) {
            // Seller business information
            $table->boolean('is_seller')->default(false)->after('is_inner_core');
            $table->string('company_name')->nullable()->after('is_seller');
            $table->text('company_address')->nullable()->after('company_name');
            $table->string('company_country', 2)->nullable()->after('company_address'); // ISO 3166-1 alpha-2
            $table->string('vat_id', 50)->nullable()->after('company_country'); // EU VAT ID (UID)
            $table->string('business_registration')->nullable()->after('vat_id'); // Non-EU business proof
            $table->string('tax_id', 50)->nullable()->after('business_registration'); // Tax ID for non-EU

            // Seller type for VAT calculation
            // 'at_business' = Austrian business
            // 'eu_vat' = EU with VAT ID (reverse charge)
            // 'eu_private' = EU without VAT ID (private/small business)
            // 'non_eu_business' = Non-EU with business proof
            // 'non_eu_private' = Non-EU without proof
            $table->enum('seller_type', ['at_business', 'eu_vat', 'eu_private', 'non_eu_business', 'non_eu_private'])->nullable()->after('tax_id');

            // Payout method
            $table->enum('payout_method', ['bank_transfer', 'paypal'])->nullable()->after('seller_type');

            // PayPal details
            $table->string('paypal_payout_email')->nullable()->after('payout_method');

            // Bank transfer details
            $table->string('bank_iban', 34)->nullable()->after('paypal_payout_email');
            $table->string('bank_bic', 11)->nullable()->after('bank_iban');
            $table->string('bank_account_holder')->nullable()->after('bank_bic');

            // Seller verification status
            $table->boolean('seller_verified')->default(false)->after('bank_account_holder');
            $table->timestamp('seller_verified_at')->nullable()->after('seller_verified');

            // Pending earnings (cached for performance, updated on each sale)
            $table->decimal('pending_earnings', 10, 2)->default(0)->after('seller_verified_at');
            $table->decimal('total_earnings', 10, 2)->default(0)->after('pending_earnings');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'is_seller',
                'company_name',
                'company_address',
                'company_country',
                'vat_id',
                'business_registration',
                'tax_id',
                'seller_type',
                'payout_method',
                'paypal_payout_email',
                'bank_iban',
                'bank_bic',
                'bank_account_holder',
                'seller_verified',
                'seller_verified_at',
                'pending_earnings',
                'total_earnings',
            ]);
        });
    }
};
