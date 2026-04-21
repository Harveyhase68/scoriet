<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Link table_header to its sibling detail_section
        Schema::table('report_pattern_elements', function (Blueprint $table) {
            $table->unsignedBigInteger('linked_element_id')->nullable()->after('is_visible')
                ->comment('Links table_header to its detail_section sibling');
            $table->foreign('linked_element_id')->references('id')->on('report_pattern_elements')->onDelete('set null');
        });

        // Per-column header styling for report_list columns
        Schema::table('report_layout_elements', function (Blueprint $table) {
            $table->json('header_style')->nullable()->after('caption_labels')
                ->comment('Per-column header font overrides: {font_family, font_size, font_weight, text_color}');
        });
    }

    public function down(): void
    {
        Schema::table('report_pattern_elements', function (Blueprint $table) {
            $table->dropForeign(['linked_element_id']);
            $table->dropColumn('linked_element_id');
        });

        Schema::table('report_layout_elements', function (Blueprint $table) {
            $table->dropColumn('header_style');
        });
    }
};
