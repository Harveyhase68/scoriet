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
        Schema::create('schema_translations', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('item_name')->index();
            $table->string('code', 5)->index();
            $table->text('translated_text');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->unsignedBigInteger('created_by')->nullable()->index('schema_translations_created_by_foreign');
            $table->timestamps();

            $table->unique(['item_name', 'code'], 'unique_item_language');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schema_translations');
    }
};
