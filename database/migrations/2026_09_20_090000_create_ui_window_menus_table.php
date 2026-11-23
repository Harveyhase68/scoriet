<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A window's own menu bar, imported from WinDev's recursive `menus`
     * export (unbounded depth, confirmed for real up to ~12 levels) or
     * hand-built in the Menu Bar Designer. `parent_menu_id` is a
     * self-referencing adjacency list, the same convention this schema
     * already uses for `ui_window_elements.parent_element_id` and
     * `ui_window_categories.parent_id`.
     *
     * `parent_menu_id` uses `set null` like every other parent/container FK
     * here - deleting a menu item's whole subtree is instead done
     * explicitly at the app layer (WindowDesignerController::deleteMenu()),
     * the same way deleteElement() explicitly removes a tab_container's
     * tab_panel children rather than relying on the FK. A submenu has no
     * meaning without its parent, so "orphan to root" would be wrong here.
     */
    public function up(): void
    {
        Schema::create('ui_window_menus', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('window_id');
            $table->unsignedBigInteger('parent_menu_id')->nullable();
            $table->string('source_name', 150)->nullable();
            $table->string('caption', 255)->nullable();
            $table->json('caption_labels')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['window_id', 'parent_menu_id']);
        });

        Schema::table('ui_window_menus', function (Blueprint $table) {
            $table->foreign(['window_id'])->references(['id'])->on('ui_windows')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['parent_menu_id'])->references(['id'])->on('ui_window_menus')->onUpdate('no action')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ui_window_menus');
    }
};
