<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * WinDev button/image icons can be a single bitmap covering every
     * visual state (`icon_state_count` = 1) or several state bitmaps
     * concatenated side by side in one image - typically 5: Idle, Pressed,
     * Grayed out, Selected, Hovered (WLangage `ImageState` property).
     * `icon_state_count` lets the designer preview slice out just the
     * first (Idle) frame via a CSS background-position trick instead of
     * rendering the whole strip squeezed into the icon slot.
     * `icon_mode` is the raw WLangage `ImageMode` value, stored for
     * traceability only - not interpreted yet.
     */
    public function up(): void
    {
        Schema::table('ui_window_controls', function (Blueprint $table) {
            $table->tinyInteger('icon_state_count')->nullable()->default(1)->after('icon_data');
            $table->smallInteger('icon_mode')->nullable()->after('icon_state_count');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ui_window_controls', function (Blueprint $table) {
            $table->dropColumn(['icon_state_count', 'icon_mode']);
        });
    }
};
