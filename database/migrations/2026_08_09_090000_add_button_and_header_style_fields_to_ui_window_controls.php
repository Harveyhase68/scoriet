<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ui_window_controls', function (Blueprint $table) {
            // Button-specific: whether the caption text shows at all
            // (WinDev's display_caption), and which side of the caption
            // the icon sits on (horizontal_image_pos/vertical_image_pos) -
            // independent of caption_position_horizontal/vertical, which
            // already covers the caption's OWN alignment (reused from the
            // static_text/heading feature, since it's the same concept).
            $table->boolean('caption_visible')->default(true)->after('caption_position_vertical');
            $table->string('icon_position_horizontal', 10)->nullable()->after('caption_visible');
            $table->string('icon_position_vertical', 10)->nullable()->after('icon_position_horizontal');

            // Table control: control_background_color/control_text_color
            // already cover the grid body - these two are specifically for
            // the column header row, which visually is its own zone.
            $table->string('header_background_color', 7)->nullable()->after('control_text_color');
            $table->string('header_text_color', 7)->nullable()->after('header_background_color');
        });
    }

    public function down(): void
    {
        Schema::table('ui_window_controls', function (Blueprint $table) {
            $table->dropColumn(['caption_visible', 'icon_position_horizontal', 'icon_position_vertical', 'header_background_color', 'header_text_color']);
        });
    }
};
