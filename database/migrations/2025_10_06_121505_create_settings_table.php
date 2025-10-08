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
            $table->decimal('price_premium', 10)->default(9.99)->comment('Monthly price for Premium plan');
            $table->decimal('price_business', 10)->default(29.99)->comment('Monthly price for Business plan');
            $table->decimal('price_patron', 10)->default(99.99)->comment('Minimum monthly price for Patron plan');
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
