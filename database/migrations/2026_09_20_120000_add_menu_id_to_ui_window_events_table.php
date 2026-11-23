<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A menu item's own code-behind (e.g. WIN_Menu.sml's
     * `on control "Exit" select { call win.close() }`) - WinDev's SML export
     * addresses a menu item exactly like a control's event, by name, so it
     * needs the same slot here `control_id`/`element_id` already have.
     * `control_id`/`element_id`/`menu_id` are mutually exclusive - see
     * UiWindowEvent's own doc comment.
     */
    public function up(): void
    {
        Schema::table('ui_window_events', function (Blueprint $table) {
            $table->unsignedBigInteger('menu_id')->nullable()->after('element_id');
            $table->index(['window_id', 'menu_id']);
        });

        Schema::table('ui_window_events', function (Blueprint $table) {
            $table->foreign(['menu_id'])->references(['id'])->on('ui_window_menus')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ui_window_events', function (Blueprint $table) {
            $table->dropForeign('ui_window_events_menu_id_foreign');
            $table->dropIndex('ui_window_events_window_id_menu_id_index');
            $table->dropColumn('menu_id');
        });
    }
};
