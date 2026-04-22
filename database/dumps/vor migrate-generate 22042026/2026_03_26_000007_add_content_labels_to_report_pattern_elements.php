<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('report_pattern_elements', function (Blueprint $table) {
            $table->json('content_labels')->nullable()->after('content')->comment('Localized content per language {"de": "...", "en": "..."}');
        });
    }

    public function down(): void
    {
        Schema::table('report_pattern_elements', function (Blueprint $table) {
            $table->dropColumn('content_labels');
        });
    }
};
