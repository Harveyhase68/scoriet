<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ui_windows', function (Blueprint $table) {
            // Same base64 data-URI convention as ui_window_controls.icon_data.
            $table->longText('background_image')->nullable()->after('text_color');
        });
    }

    public function down(): void
    {
        Schema::table('ui_windows', function (Blueprint $table) {
            $table->dropColumn('background_image');
        });
    }
};
