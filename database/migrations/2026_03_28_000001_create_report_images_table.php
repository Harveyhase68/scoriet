<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_images', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('report_pattern_id');
            $table->string('name', 255)->comment('Display name, e.g. "Company Logo"');
            $table->string('language', 10)->nullable()->comment('NULL = all languages, "de"/"en" = language-specific');
            $table->string('mime_type', 100)->comment('image/png, image/jpeg, image/svg+xml etc.');
            $table->string('filename', 255)->comment('Original filename');
            $table->unsignedInteger('file_size')->default(0);
            $table->unsignedInteger('width')->nullable()->comment('Image width in pixels');
            $table->unsignedInteger('height')->nullable()->comment('Image height in pixels');
            $table->binary('image_data')->comment('Binary image data');
            $table->timestamps();

            $table->foreign('report_pattern_id')->references('id')->on('report_patterns')->onDelete('cascade');
            $table->index(['report_pattern_id', 'language']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_images');
    }
};
