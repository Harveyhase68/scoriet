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
            $table->id();
            $table->string('global_google_translate_key', 500)->nullable()->comment('Global Google Translate API key for Business users');
            $table->decimal('price_premium', 10, 2)->default(9.99)->comment('Monthly price for Premium plan');
            $table->decimal('price_business', 10, 2)->default(29.99)->comment('Monthly price for Business plan');
            $table->decimal('price_patron', 10, 2)->default(99.99)->comment('Minimum monthly price for Patron plan');
            $table->timestamps();
        });

        // Insert default settings record
        DB::table('settings')->insert([
            'global_google_translate_key' => null,
            'price_premium' => 9.99,
            'price_business' => 29.99,
            'price_patron' => 99.99,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
