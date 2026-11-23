<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * A control's icon comes from exactly one of two mutually exclusive
     * sources: a PrimeReact icon class (`icon_class`, e.g. "pi-print") or a
     * custom uploaded image stored as a base64 data URI (`icon_data`) — the
     * latter is how WinDev button icons arrive on import (the source JSON
     * embeds each icon as a hex-encoded PNG blob, converted to a data URI
     * at import time). `icon_data` is LONGTEXT since a base64 PNG can run
     * well past a normal VARCHAR/TEXT limit.
     */
    public function up(): void
    {
        Schema::table('ui_window_controls', function (Blueprint $table) {
            $table->string('icon_class', 50)->nullable()->after('control_background_color');
            $table->longText('icon_data')->nullable()->after('icon_class');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ui_window_controls', function (Blueprint $table) {
            $table->dropColumn(['icon_class', 'icon_data']);
        });
    }
};
