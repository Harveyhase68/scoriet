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
        Schema::create('template_fingerprints', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('template_id')->index();
            $table->unsignedBigInteger('template_file_id')->index('template_fingerprints_template_file_id_foreign');
            $table->string('file_hash', 64)->index();
            $table->longText('normalized_content')->nullable();
            $table->unsignedInteger('content_length');
            $table->json('token_signature')->nullable();
            $table->string('file_type', 50)->nullable();
            $table->boolean('is_significant')->default(true);
            $table->timestamps();

            $table->index(['file_hash', 'template_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('template_fingerprints');
    }
};
