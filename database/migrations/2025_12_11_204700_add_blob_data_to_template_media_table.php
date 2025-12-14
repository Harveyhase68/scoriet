<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Store images as binary blob in database for reliability and portability.
     */
    public function up(): void
    {
        Schema::table('template_media', function (Blueprint $table) {
            // LONGBLOB can store up to 4GB - perfect for images
            $table->longText('file_data')->nullable()->after('file_path');
            $table->string('mime_type', 100)->nullable()->after('file_data');
            $table->unsignedInteger('file_size')->nullable()->after('mime_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('template_media', function (Blueprint $table) {
            $table->dropColumn(['file_data', 'mime_type', 'file_size']);
        });
    }
};
