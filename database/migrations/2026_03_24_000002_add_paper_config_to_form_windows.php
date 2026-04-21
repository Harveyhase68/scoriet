<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add paper/print configuration to form_windows.
     * Used by report_single and report_list window types.
     *
     * paper_size: A4, A3, A5, Letter, Legal, Custom
     * paper_orientation: portrait, landscape
     * paper_unit: cm, inch, mm
     * margin_top/right/bottom/left: margins in the selected unit
     */
    public function up(): void
    {
        Schema::table('form_windows', function (Blueprint $table) {
            $table->string('paper_size', 20)->nullable()->after('text_color');          // A4, A3, A5, Letter, Legal, Custom
            $table->string('paper_orientation', 15)->nullable()->after('paper_size');    // portrait, landscape
            $table->string('paper_unit', 5)->nullable()->after('paper_orientation');     // cm, inch, mm
            $table->decimal('margin_top', 6, 2)->nullable()->after('paper_unit');        // e.g. 1.50 cm
            $table->decimal('margin_right', 6, 2)->nullable()->after('margin_top');
            $table->decimal('margin_bottom', 6, 2)->nullable()->after('margin_right');
            $table->decimal('margin_left', 6, 2)->nullable()->after('margin_bottom');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('form_windows', function (Blueprint $table) {
            $table->dropColumn([
                'paper_size',
                'paper_orientation',
                'paper_unit',
                'margin_top',
                'margin_right',
                'margin_bottom',
                'margin_left',
            ]);
        });
    }
};
