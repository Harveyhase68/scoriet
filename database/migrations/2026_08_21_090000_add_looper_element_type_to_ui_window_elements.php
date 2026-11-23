<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Raw SQL (not Schema::table()->change()) - doctrine/dbal isn't
        // installed, same reason 2026_08_18_120000_widen_icon_mode used raw
        // SQL for its own column-type change.
        DB::statement("ALTER TABLE ui_window_elements MODIFY element_type ENUM('container', 'group_box', 'tab_container', 'tab_panel', 'looper', 'looper_row') NOT NULL");

        Schema::table('ui_window_elements', function (Blueprint $table) {
            // Only meaningful for element_type = 'looper' - the height of
            // each repeated row. Width isn't a separate setting: a looper is
            // a single column, so every row is exactly as wide as the
            // looper's own element `width`.
            $table->integer('looper_row_height')->nullable()->after('tab_font_strikeout');
        });
    }

    public function down(): void
    {
        Schema::table('ui_window_elements', function (Blueprint $table) {
            $table->dropColumn('looper_row_height');
        });

        DB::statement("ALTER TABLE ui_window_elements MODIFY element_type ENUM('container', 'group_box', 'tab_container', 'tab_panel') NOT NULL");
    }
};
