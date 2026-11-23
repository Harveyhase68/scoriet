<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ui_window_elements', function (Blueprint $table) {
            // Only meaningful for element_type = 'tab_container' - how tall
            // the TabStripWithNav strip itself renders in the Flutter
            // template. Not exported by WinDev (no matching field), so this
            // is purely a Flutter-side visual knob - null falls back to 28
            // (see UiWindowElement::toGTreeArray()), not the widget's
            // previous hardcoded 46.
            $table->integer('tab_strip_height')->nullable()->after('looper_row_height');
        });

        Schema::table('ui_window_controls', function (Blueprint $table) {
            // longtext to match icon_data's own column type - same
            // base64 data: URI shape, same libmysqlclient MAX_BUFFER_SIZE
            // concern (see config/database.php's 1005 => 64*1024*1024,
            // already in place for icon_data/template file content).
            // Only meaningful for 'button' so far; takes priority over
            // control_background_color when set (see buildRudimentaryControl).
            $table->longText('background_image')->nullable()->after('icon_mode');
        });
    }

    public function down(): void
    {
        Schema::table('ui_window_elements', function (Blueprint $table) {
            $table->dropColumn('tab_strip_height');
        });

        Schema::table('ui_window_controls', function (Blueprint $table) {
            $table->dropColumn('background_image');
        });
    }
};
