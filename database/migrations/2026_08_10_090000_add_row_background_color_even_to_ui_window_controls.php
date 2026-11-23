<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ui_window_controls', function (Blueprint $table) {
            // Table control: control_background_color already covers the
            // odd-row background (WinDev's own "background_color" on the
            // table itself); this is specifically the even-row band.
            $table->string('row_background_color_even', 7)->nullable()->after('header_text_color');
        });
    }

    public function down(): void
    {
        Schema::table('ui_window_controls', function (Blueprint $table) {
            $table->dropColumn('row_background_color_even');
        });
    }
};
