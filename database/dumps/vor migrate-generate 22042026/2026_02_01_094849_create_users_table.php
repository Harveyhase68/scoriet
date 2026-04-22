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
        Schema::create('users', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name');
            $table->string('email')->unique();
            $table->string('theme', 20)->default('dark');
            $table->timestamp('email_verified_at')->nullable();
            $table->boolean('is_inner_core')->default(false);
            $table->boolean('is_seller')->default(false);
            $table->string('company_name')->nullable();
            $table->text('company_address')->nullable();
            $table->string('company_country', 2)->nullable();
            $table->string('vat_id', 50)->nullable();
            $table->string('business_registration')->nullable();
            $table->string('tax_id', 50)->nullable();
            $table->enum('seller_type', ['at_business', 'eu_vat', 'eu_private', 'non_eu_business', 'non_eu_private'])->nullable();
            $table->enum('payout_method', ['bank_transfer', 'paypal'])->nullable();
            $table->string('paypal_payout_email')->nullable();
            $table->string('bank_iban', 34)->nullable();
            $table->string('bank_bic', 11)->nullable();
            $table->string('bank_account_holder')->nullable();
            $table->boolean('seller_verified')->default(false);
            $table->timestamp('seller_verified_at')->nullable();
            $table->decimal('pending_earnings', 10)->default(0);
            $table->decimal('total_earnings', 10)->default(0);
            $table->string('password');
            $table->string('two_factor_secret')->nullable();
            $table->boolean('two_factor_enabled')->default(false);
            $table->timestamp('two_factor_confirmed_at')->nullable();
            $table->text('two_factor_recovery_codes')->nullable();
            $table->text('two_factor_trusted_devices')->nullable();
            $table->timestamp('two_factor_last_verified_at')->nullable();
            $table->string('username')->nullable()->unique();
            $table->enum('user_type', ['free', 'patron', 'system'])->default('free');
            $table->boolean('is_active')->default(true);
            $table->string('language', 5)->default('en');
            $table->string('kanban_initials', 3)->nullable();
            $table->string('kanban_color', 7)->nullable();
            $table->integer('credits')->default(50);
            $table->timestamp('last_monthly_credits_at')->nullable();
            $table->string('stripe_customer_id')->nullable();
            $table->string('stripe_subscription_id')->nullable();
            $table->string('paypal_subscription_id')->nullable();
            $table->enum('patron_type', ['annual', 'monthly'])->nullable();
            $table->unsignedBigInteger('pending_project_invitation_id')->nullable()->index('users_pending_project_invitation_id_foreign');
            $table->rememberToken();
            $table->boolean('email_system_notifications')->default(true);
            $table->boolean('email_user_notifications')->default(true);
            $table->timestamp('last_login_at')->nullable();
            $table->timestamp('inactivity_warning_1_sent_at')->nullable();
            $table->timestamp('inactivity_warning_2_sent_at')->nullable();
            $table->timestamp('inactivity_warning_final_sent_at')->nullable();
            $table->timestamps();

            $table->index(['last_login_at', 'user_type', 'is_active'], 'users_inactivity_check_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
