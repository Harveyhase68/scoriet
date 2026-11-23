<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ui_windows', function (Blueprint $table) {
            // WinDev's Window.StatusBar property (0/1 in the WinDev JSON
            // export - see scripts/output.json) - whether this window shows
            // a status bar. Distinct from a dialog: WLanguage's `Message()`
            // writes text INTO this bar (replacing whatever was there), it
            // never pops up its own window the way `Info()` does.
            $table->boolean('has_status_bar')->default(false)->after('background_image');
        });
    }

    public function down(): void
    {
        Schema::table('ui_windows', function (Blueprint $table) {
            $table->dropColumn('has_status_bar');
        });
    }
};
