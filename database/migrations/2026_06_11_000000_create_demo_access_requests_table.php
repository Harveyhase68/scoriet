<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Stores email-gated demo-access requests (the "leads"). Lives in the MAIN
 * (persistent) database — never in the demo DB, which is dropped & restored
 * daily by `php artisan demo:reset`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('demo_access_requests', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('email')->index();
            $table->string('token', 64)->unique();
            $table->timestamp('expires_at');            // aligned to next 05:00 UTC reset
            $table->timestamp('sent_at')->nullable();   // funnel: email dispatched
            $table->timestamp('redeemed_at')->nullable(); // funnel: first click/redeem
            $table->string('redeemed_ip', 45)->nullable();
            $table->string('request_ip', 45)->nullable();
            $table->boolean('consent')->default(false);   // GDPR opt-in
            $table->string('consent_text_version', 20)->nullable();
            $table->string('user_agent', 512)->nullable();
            $table->timestamps();

            $table->index(['token', 'expires_at']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('demo_access_requests');
    }
};
