<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * language_override: Optional language code (e.g., 'de', 'en') that overrides
     * the project's default language for this specific template file.
     * When null, the project's default/selected language is used.
     */
    public function up(): void
    {
        Schema::table('template_files', function (Blueprint $table) {
            $table->string('language_override', 10)->nullable()->after('inject_tag');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('template_files', function (Blueprint $table) {
            $table->dropColumn('language_override');
        });
    }
};
