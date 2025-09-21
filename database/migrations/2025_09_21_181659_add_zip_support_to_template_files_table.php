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
        Schema::table('template_files', function (Blueprint $table) {
            $table->enum('content_type', ['text', 'zip'])->default('text')->after('file_type');
            $table->string('zip_filename')->nullable()->after('content_type'); // Original filename of ZIP
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('template_files', function (Blueprint $table) {
            $table->dropColumn(['content_type', 'zip_filename']);
        });
    }
};
