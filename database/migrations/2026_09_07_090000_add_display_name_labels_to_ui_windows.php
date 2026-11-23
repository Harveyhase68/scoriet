<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ui_windows', function (Blueprint $table) {
            // Per-language translations of the window's own `display_name`
            // (its title-bar caption) - same shape/convention as
            // UiWindowControl's `caption_labels`/`comment_labels`/
            // `hint_labels` (a plain {lang_code: text} map, `display_name`
            // itself stays the untranslated fallback). Previously the
            // window's OWN caption had no per-language support at all,
            // unlike every control/tab caption - confirmed a real gap when
            // exporting a window and importing its languages (2026-09-07).
            $table->json('display_name_labels')->nullable()->after('display_name');
        });
    }

    public function down(): void
    {
        Schema::table('ui_windows', function (Blueprint $table) {
            $table->dropColumn('display_name_labels');
        });
    }
};
