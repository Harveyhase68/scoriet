<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Enlarge translated_text from VARCHAR(500) to TEXT to support
     * multi-line combobox content translations.
     */
    public function up(): void
    {
        Schema::table('schema_translations', function (Blueprint $table) {
            $table->text('translated_text')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schema_translations', function (Blueprint $table) {
            $table->string('translated_text', 500)->change();
        });
    }
};
