<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Change enum to string to support all element types
        Schema::table('report_pattern_elements', function (Blueprint $table) {
            $table->string('element_type', 50)->change();
        });

        // Add new columns for report controls
        Schema::table('report_pattern_elements', function (Blueprint $table) {
            $table->decimal('field_height', 8, 2)->nullable()->after('max_fields')->comment('Default field height in paper_unit for auto-place');
            $table->text('content')->nullable()->after('field_height')->comment('Text content or placeholder like {:tablename:}');
            $table->string('font_family', 100)->nullable()->after('content');
            $table->decimal('font_size', 5, 1)->nullable()->after('font_family');
            $table->string('font_weight', 20)->nullable()->after('font_size');
            $table->decimal('border_width', 5, 1)->nullable()->after('font_weight');
            $table->string('border_color', 20)->nullable()->after('border_width');
            $table->string('background_color', 20)->nullable()->after('border_color');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('report_pattern_elements', function (Blueprint $table) {
            $table->dropColumn([
                'field_height',
                'content',
                'font_family',
                'font_size',
                'font_weight',
                'border_width',
                'border_color',
                'background_color',
            ]);
        });

        // Revert back to enum
        Schema::table('report_pattern_elements', function (Blueprint $table) {
            $table->enum('element_type', ['container', 'header_section', 'detail_section', 'footer_section'])->change();
        });
    }
};
