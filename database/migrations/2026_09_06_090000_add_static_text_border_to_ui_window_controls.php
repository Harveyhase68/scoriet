<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ui_window_controls', function (Blueprint $table) {
            // static_text-only (Window Designer canvas preview for now -
            // 2026-09-06 follow-up, item c/d - the generated Flutter output
            // doesn't read this yet, same "designer first, template later"
            // scoping the rest of this table already follows). null/'none'
            // is "no border" (current behavior unchanged). 'single'/'double'
            // draw all four sides, 'top'/'bottom' draw exactly one edge -
            // matches the 5 options the user asked for.
            $table->string('static_text_border_style')->nullable()->after('caption_position_vertical');
        });

        // caption_position_vertical was `string(10)` (2026_08_06_140000) -
        // just long enough for 'top'/'middle'/'bottom'. The new "Inline"
        // option (item d - the caption breaks the static_text's own top/
        // bottom border line instead of sitting inside it) needs two new
        // values, 'inline_top' (10 chars, fits) and 'inline_bottom' (13
        // chars, does NOT) - widening avoids picking an artificially
        // abbreviated value just to dodge the old limit. Raw SQL instead of
        // Schema::table()->change() - see 2026_08_18_120000's identical
        // comment on why (no doctrine/dbal in this project).
        DB::statement('ALTER TABLE ui_window_controls MODIFY caption_position_vertical VARCHAR(20) NULL');
    }

    public function down(): void
    {
        Schema::table('ui_window_controls', function (Blueprint $table) {
            $table->dropColumn('static_text_border_style');
        });
        DB::statement('ALTER TABLE ui_window_controls MODIFY caption_position_vertical VARCHAR(10) NULL');
    }
};
