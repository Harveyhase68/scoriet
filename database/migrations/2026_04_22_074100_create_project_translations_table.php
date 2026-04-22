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
        Schema::create('project_translations', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('project_id');
            $table->string('language_code', 10);
            $table->string('caption')->nullable();
            $table->text('description')->nullable();
            $table->string('decimal_separator', 1)->nullable();
            $table->string('thousands_separator', 1)->nullable();
            $table->string('date_format', 20)->nullable();
            $table->string('time_format', 20)->nullable();
            $table->string('currency_symbol', 5)->nullable();
            $table->string('timezone', 50)->nullable();
            $table->timestamps();

            $table->unique(['project_id', 'language_code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_translations');
    }
};
