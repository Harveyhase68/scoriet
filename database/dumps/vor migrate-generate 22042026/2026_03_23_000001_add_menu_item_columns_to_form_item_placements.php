<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add columns for menu_item support in form_item_placements.
     * Enables hierarchical menu structure with role-based visibility.
     */
    public function up(): void
    {
        Schema::table('form_item_placements', function (Blueprint $table) {
            // Hierarchy: parent menu item (for sub-menus / sub-sub-menus)
            $table->unsignedBigInteger('parent_placement_id')->nullable()->after('button_text_color');

            // Menu-specific fields
            $table->string('menu_icon', 100)->nullable()->after('parent_placement_id');       // PrimeReact icon class (pi-home, pi-cog, etc.)
            $table->string('menu_action', 100)->nullable()->after('menu_icon');               // Navigation target (panel-id)
            $table->string('menu_role_required', 50)->nullable()->after('menu_action');        // 'system', 'admin', null = all users
            $table->tinyInteger('menu_depth')->default(0)->after('menu_role_required');        // Nesting level (0 = root, 1 = child, 2 = grandchild)

            // Self-referencing FK for hierarchy
            $table->foreign('parent_placement_id')
                ->references('id')
                ->on('form_item_placements')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('form_item_placements', function (Blueprint $table) {
            $table->dropForeign(['parent_placement_id']);
            $table->dropColumn(['parent_placement_id', 'menu_icon', 'menu_action', 'menu_role_required', 'menu_depth']);
        });
    }
};
