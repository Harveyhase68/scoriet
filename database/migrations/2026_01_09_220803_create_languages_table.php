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
        Schema::create('languages', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('code', 5)->unique();
            $table->string('name', 100);
            $table->string('native_name', 100);
            $table->string('flag', 10)->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false)->index();
            $table->integer('sort_order')->default(0);
            $table->text('description')->nullable();
            $table->unsignedBigInteger('created_by')->nullable()->index('languages_created_by_foreign');
            $table->timestamps();

            $table->index(['is_active', 'sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('languages');
    }
};
