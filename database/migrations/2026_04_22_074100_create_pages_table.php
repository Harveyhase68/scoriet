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
        Schema::create('pages', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('slug');
            $table->string('locale', 2)->default('en');
            $table->string('title');
            $table->longText('content');
            $table->boolean('is_active')->default(true);
            $table->boolean('popup_on_landingpage')->nullable()->default(false);
            $table->boolean('popup_on_app')->nullable()->default(false);
            $table->integer('popup_priority')->nullable()->default(99);
            $table->integer('popup_version')->nullable()->default(1);
            $table->timestamps();

            $table->unique(['slug', 'locale']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pages');
    }
};
