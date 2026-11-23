<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ui_window_controls', function (Blueprint $table) {
            // Table control: WinDev's line_height - the pixel height of
            // each data row in the grid.
            $table->integer('row_height')->nullable()->after('row_background_color_even');
        });
    }

    public function down(): void
    {
        Schema::table('ui_window_controls', function (Blueprint $table) {
            $table->dropColumn('row_height');
        });
    }
};
