<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Anchor fields for form elements (containers, buttons, etc.)
        Schema::table('form_elements', function (Blueprint $table) {
            $table->decimal('anchor_right', 5, 2)->nullable()->after('height')->comment('% right anchor (0=follow right, null=none)');
            $table->decimal('anchor_bottom', 5, 2)->nullable()->after('anchor_right')->comment('% bottom anchor (0=follow bottom, null=none)');
            $table->decimal('anchor_width', 5, 2)->nullable()->after('anchor_bottom')->comment('% width stretch (100=grow with window)');
            $table->decimal('anchor_height', 5, 2)->nullable()->after('anchor_width')->comment('% height stretch (100=grow with window)');
        });

        // Anchor fields for form item placements (fields, buttons, menu items)
        Schema::table('form_item_placements', function (Blueprint $table) {
            $table->decimal('anchor_right', 5, 2)->nullable()->after('height')->comment('% right anchor');
            $table->decimal('anchor_bottom', 5, 2)->nullable()->after('anchor_right')->comment('% bottom anchor');
            $table->decimal('anchor_width', 5, 2)->nullable()->after('anchor_bottom')->comment('% width stretch');
            $table->decimal('anchor_height', 5, 2)->nullable()->after('anchor_width')->comment('% height stretch');
        });
    }

    public function down(): void
    {
        Schema::table('form_elements', function (Blueprint $table) {
            $table->dropColumn(['anchor_right', 'anchor_bottom', 'anchor_width', 'anchor_height']);
        });
        Schema::table('form_item_placements', function (Blueprint $table) {
            $table->dropColumn(['anchor_right', 'anchor_bottom', 'anchor_width', 'anchor_height']);
        });
    }
};
