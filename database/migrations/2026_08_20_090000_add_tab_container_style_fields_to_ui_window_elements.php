<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ui_window_elements', function (Blueprint $table) {
            // Only meaningful for element_type = 'tab_container' - the content
            // area behind whichever tab page is currently showing. Individual
            // tab_panel rows deliberately don't get their own background (kept
            // out of scope - all pages of one container share this single color).
            $table->string('background_color', 7)->nullable()->after('custom_style');

            // The tab STRIP itself needs active/inactive colors kept separate
            // (matching TabStripWithNav's own active/inactive rendering) rather
            // than a single background_color/text_color pair like a control has.
            $table->string('tab_active_background_color', 7)->nullable()->after('background_color');
            $table->string('tab_inactive_background_color', 7)->nullable()->after('tab_active_background_color');
            $table->string('tab_active_text_color', 7)->nullable()->after('tab_inactive_background_color');
            $table->string('tab_inactive_text_color', 7)->nullable()->after('tab_active_text_color');

            // Mirrors ui_window_controls' font_* set exactly (see
            // 2026_08_06_140000_add_alignment_and_font_fields_to_ui_window_controls.php)
            // for the tab strip's own label text - one shared font for every
            // tab, active or inactive, same as WinDev's own tab strip styling.
            $table->string('tab_font_family', 100)->nullable()->after('tab_inactive_text_color');
            $table->decimal('tab_font_size', 5, 2)->nullable()->after('tab_font_family');
            $table->boolean('tab_font_bold')->default(false)->after('tab_font_size');
            $table->boolean('tab_font_italic')->default(false)->after('tab_font_bold');
            $table->boolean('tab_font_underline')->default(false)->after('tab_font_italic');
            $table->boolean('tab_font_strikeout')->default(false)->after('tab_font_underline');
        });
    }

    public function down(): void
    {
        Schema::table('ui_window_elements', function (Blueprint $table) {
            $table->dropColumn([
                'background_color',
                'tab_active_background_color',
                'tab_inactive_background_color',
                'tab_active_text_color',
                'tab_inactive_text_color',
                'tab_font_family',
                'tab_font_size',
                'tab_font_bold',
                'tab_font_italic',
                'tab_font_underline',
                'tab_font_strikeout',
            ]);
        });
    }
};
