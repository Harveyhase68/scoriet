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
        Schema::create('settings', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('global_google_translate_key', 500)->nullable()->comment('Global Google Translate API key for Business users');
            $table->decimal('price_patron_annual', 10)->default(34.9);
            $table->decimal('price_patron_monthly', 10)->default(49.9);
            $table->decimal('price_credits_500', 10)->default(9.9);
            $table->decimal('price_credits_1000', 10)->default(17.9);
            $table->decimal('price_credits_2500', 10)->default(29.9);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
