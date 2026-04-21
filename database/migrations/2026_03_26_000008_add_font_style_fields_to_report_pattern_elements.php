<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('report_pattern_elements', function (Blueprint $table) {
            $table->string('font_style', 20)->nullable()->after('font_weight');
            $table->string('text_decoration', 30)->nullable()->after('font_style');
            $table->string('text_align', 20)->nullable()->after('text_decoration');
            $table->string('text_color', 20)->nullable()->after('text_align');
        });
    }

    public function down(): void
    {
        Schema::table('report_pattern_elements', function (Blueprint $table) {
            $table->dropColumn(['font_style', 'text_decoration', 'text_align', 'text_color']);
        });
    }
};
