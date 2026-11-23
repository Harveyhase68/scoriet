<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * `icon_mode` (added in 2026_08_06_110000) was a `smallInteger`
     * (max 32767), but WinDev's real `ImageMode`/`imagemode` value is a
     * bitfield combining several `imgXxx` flags - e.g. 2097161 for a real
     * imported IMG_LOGO control - which routinely exceeds 16 bits. The
     * column is documented as "stored for traceability only, not
     * interpreted yet", so there's no reason to constrain its range at
     * all; widening to a plain `integer` (±2.1 billion) comfortably covers
     * any realistic WLangage bitfield value. Found via a real WinDev import
     * failing with "SQLSTATE[22003]: Numeric value out of range" on this
     * column.
     *
     * Raw SQL instead of Schema::table()->change() - that requires
     * doctrine/dbal, which isn't installed in this project and isn't worth
     * pulling in as a dependency for a single column-width change.
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE ui_window_controls MODIFY icon_mode INT NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE ui_window_controls MODIFY icon_mode SMALLINT NULL');
    }
};
