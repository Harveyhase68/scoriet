<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * One-time data fix: the WinDev import's horizontal_alignment/vertical_alignment
 * mapping initially assumed a 1-indexed Left/Center/Right ordering
 * (raw 1/2/3 -> left/center/right). The real WLangage constants (per WinDev
 * help) are haLeft=0/haCenter=1/haRight=2/haJustified=3/haNotDefined=-1 and
 * vaTop=0/vaMiddle=1/vaBottom=2 - every control imported before the fix has
 * its stored caption_position_horizontal/vertical one step off. The old
 * mapping was bijective, so the correct value can be recovered
 * deterministically from what's already stored (old 'left' can only have
 * come from raw=1, which is really haCenter, etc.) - no re-import needed.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Process from the highest old raw value down, so a row already
        // rewritten in an earlier step is never picked up again by a later
        // step's WHERE clause.
        DB::table('ui_window_controls')->where('caption_position_horizontal', 'right')->update(['caption_position_horizontal' => null]); // old raw=3 -> haJustified, not representable
        DB::table('ui_window_controls')->where('caption_position_horizontal', 'center')->update(['caption_position_horizontal' => 'right']); // old raw=2 -> haRight
        DB::table('ui_window_controls')->where('caption_position_horizontal', 'left')->update(['caption_position_horizontal' => 'center']); // old raw=1 -> haCenter

        DB::table('ui_window_controls')->where('caption_position_vertical', 'bottom')->update(['caption_position_vertical' => null]); // old raw=3 -> not a valid vertical constant
        DB::table('ui_window_controls')->where('caption_position_vertical', 'middle')->update(['caption_position_vertical' => 'bottom']); // old raw=2 -> vaBottom
        DB::table('ui_window_controls')->where('caption_position_vertical', 'top')->update(['caption_position_vertical' => 'middle']); // old raw=1 -> vaMiddle
    }

    public function down(): void
    {
        // Best-effort inverse. Rows nulled in up() (old raw=3) can't be
        // distinguished from rows that were already null before up() ran.
        DB::table('ui_window_controls')->where('caption_position_horizontal', 'right')->update(['caption_position_horizontal' => 'center']);
        DB::table('ui_window_controls')->where('caption_position_horizontal', 'center')->update(['caption_position_horizontal' => 'left']);

        DB::table('ui_window_controls')->where('caption_position_vertical', 'bottom')->update(['caption_position_vertical' => 'middle']);
        DB::table('ui_window_controls')->where('caption_position_vertical', 'middle')->update(['caption_position_vertical' => 'top']);
    }
};
