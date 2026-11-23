<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Preserves the original identifier from an imported source (e.g. a
     * WinDev window/control name like "BTN_Save") so a future code import
     * (roadmap Step 6) can correlate WLangage code back to the control it
     * references, even though the control itself is renamed/recaptioned
     * afterwards in the designer.
     */
    public function up(): void
    {
        Schema::table('ui_windows', function (Blueprint $table) {
            $table->string('source_name', 150)->nullable()->after('name');
        });

        Schema::table('ui_window_elements', function (Blueprint $table) {
            $table->string('source_name', 150)->nullable()->after('element_type');
        });

        Schema::table('ui_window_controls', function (Blueprint $table) {
            $table->string('source_name', 150)->nullable()->after('control_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ui_windows', function (Blueprint $table) {
            $table->dropColumn('source_name');
        });

        Schema::table('ui_window_elements', function (Blueprint $table) {
            $table->dropColumn('source_name');
        });

        Schema::table('ui_window_controls', function (Blueprint $table) {
            $table->dropColumn('source_name');
        });
    }
};
