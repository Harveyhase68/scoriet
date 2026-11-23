<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ui_window_controls', function (Blueprint $table) {
            // Caption alignment for controls that render their own text directly
            // (static_text, heading, ...) - complements label_position, which is
            // for the label of field-style controls (text, dropdown, ...).
            $table->string('caption_position_horizontal', 10)->nullable()->after('label_width');
            $table->string('caption_position_vertical', 10)->nullable()->after('caption_position_horizontal');

            $table->string('font_family', 100)->nullable()->after('style_config');
            $table->decimal('font_size', 5, 2)->nullable()->after('font_family');
            $table->boolean('font_bold')->default(false)->after('font_size');
            $table->boolean('font_italic')->default(false)->after('font_bold');
            $table->boolean('font_underline')->default(false)->after('font_italic');
            $table->boolean('font_strikeout')->default(false)->after('font_underline');
        });
    }

    public function down(): void
    {
        Schema::table('ui_window_controls', function (Blueprint $table) {
            $table->dropColumn([
                'caption_position_horizontal',
                'caption_position_vertical',
                'font_family',
                'font_size',
                'font_bold',
                'font_italic',
                'font_underline',
                'font_strikeout',
            ]);
        });
    }
};
