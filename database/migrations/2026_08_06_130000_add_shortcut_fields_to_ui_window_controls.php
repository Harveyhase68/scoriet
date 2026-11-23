<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * WinDev encodes a button's keyboard accelerator inline in its caption
     * ("&Hilfe" = Alt+H, "&&" = a literal ampersand, not a shortcut). We
     * store it as its own explicit property instead of leaving markup in
     * the caption text — `shortcut_enabled` + `shortcut` (e.g. "ALT+H").
     */
    public function up(): void
    {
        Schema::table('ui_window_controls', function (Blueprint $table) {
            $table->boolean('shortcut_enabled')->default(false)->after('caption_labels');
            $table->string('shortcut', 20)->nullable()->after('shortcut_enabled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ui_window_controls', function (Blueprint $table) {
            $table->dropColumn(['shortcut_enabled', 'shortcut']);
        });
    }
};
