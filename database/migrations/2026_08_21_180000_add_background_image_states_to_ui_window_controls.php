<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ui_window_controls', function (Blueprint $table) {
            // Same WLangage ImageState concept icon_state_count already
            // covers for a button's own icon (1 = single bitmap, >1 = that
            // many state-bitmaps - Idle/Pressed/Grayed/Selected/Hovered -
            // concatenated side by side), applied to background_image
            // instead. WinDev's real export additionally multiplies each
            // state by up to 6 "animation step" frames - deliberately NOT
            // modeled here (the export is expected to always send exactly
            // 1 step; neither Flutter nor the Window Designer canvas has
            // an animation concept to map it to).
            $table->integer('background_image_states')->nullable()->after('background_image');
        });
    }

    public function down(): void
    {
        Schema::table('ui_window_controls', function (Blueprint $table) {
            $table->dropColumn('background_image_states');
        });
    }
};
