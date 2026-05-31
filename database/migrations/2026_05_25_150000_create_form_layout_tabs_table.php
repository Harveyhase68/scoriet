<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * form_layout_tabs — per-(FormWindow × SchemaTable) tab instances.
 *
 * Background:
 *   The form template (form_window) declares a `tab_container` element with
 *   max_fields and container_columns. The actual TABS within that container
 *   are not part of the template — they are generated at the LAYOUT level
 *   (per FormSet × SchemaTable) by auto-place when the field count exceeds
 *   max_fields, or added manually by the user.
 *
 *   form_elements would be the wrong place for these tabs: that table is
 *   per-form_window (one template, many tables) and we need tabs to scope
 *   to a specific table inside a specific window.
 *
 *   The same template tab_container can yield 3 tabs for table "users"
 *   (22 fields ÷ 8 per tab) and 1 tab for table "settings" (5 fields).
 *
 * tab_container_element_id points at the form_elements row that owns this
 * tab group. parent_tab_container_id on form_elements (the older self-FK)
 * is now obsolete for the Layout flow and is kept only for backward compat
 * with any in-flight migrations.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('form_layout_tabs', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('form_window_id');
            $table->unsignedBigInteger('schema_table_id');
            $table->unsignedBigInteger('tab_container_element_id');
            $table->integer('sort_order')->default(0);
            $table->string('tab_label', 100)->nullable()->comment('Fallback label when no per-language entry');
            $table->json('tab_labels')->nullable()->comment('Per-language labels: { "de": "Stammdaten", "en": "Master data" }');
            $table->timestamps();

            $table->foreign('form_window_id', 'flt_window_fk')
                ->references('id')->on('form_windows')
                ->onDelete('cascade');
            $table->foreign('schema_table_id', 'flt_table_fk')
                ->references('id')->on('schema_tables')
                ->onDelete('cascade');
            $table->foreign('tab_container_element_id', 'flt_container_fk')
                ->references('id')->on('form_elements')
                ->onDelete('cascade');

            $table->index(['form_window_id', 'schema_table_id'], 'flt_window_table_idx');
            $table->unique(
                ['form_window_id', 'schema_table_id', 'tab_container_element_id', 'sort_order'],
                'flt_window_table_container_sort_unique'
            );
        });

        // Re-target the existing tab_panel_id FK on form_item_placements.
        // Old design pointed at form_elements (where tab_panel rows lived).
        // New design points at form_layout_tabs. Any existing tab_panel_id
        // values are stale references to form_elements, so wipe them first
        // — we just removed tab_panel as a droppable element type, so no
        // legitimate data should be lost.
        if (Schema::hasColumn('form_item_placements', 'tab_panel_id')) {
            DB::table('form_item_placements')
                ->whereNotNull('tab_panel_id')
                ->update(['tab_panel_id' => null]);

            Schema::table('form_item_placements', function (Blueprint $table) {
                $table->dropForeign('form_item_placements_tab_panel_id_foreign');
            });
            Schema::table('form_item_placements', function (Blueprint $table) {
                $table->foreign('tab_panel_id', 'form_item_placements_tab_panel_id_foreign')
                    ->references('id')->on('form_layout_tabs')
                    ->onDelete('set null');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('form_item_placements', 'tab_panel_id')) {
            Schema::table('form_item_placements', function (Blueprint $table) {
                $table->dropForeign('form_item_placements_tab_panel_id_foreign');
            });
            // Restore the original FK to form_elements so a rollback is clean.
            Schema::table('form_item_placements', function (Blueprint $table) {
                $table->foreign('tab_panel_id', 'form_item_placements_tab_panel_id_foreign')
                    ->references('id')->on('form_elements')
                    ->onDelete('set null');
            });
        }

        Schema::dropIfExists('form_layout_tabs');
    }
};
