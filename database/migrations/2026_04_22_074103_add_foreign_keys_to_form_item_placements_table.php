<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('form_item_placements', function (Blueprint $table) {
            $table->foreign(['container_element_id'])->references(['id'])->on('form_elements')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['form_element_id'])->references(['id'])->on('form_elements')->onUpdate('no action')->onDelete('set null');
            $table->foreign(['form_window_id'])->references(['id'])->on('form_windows')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['lookup_table_id'])->references(['id'])->on('schema_tables')->onUpdate('no action')->onDelete('set null');
            $table->foreign(['parent_placement_id'])->references(['id'])->on('form_item_placements')->onUpdate('no action')->onDelete('set null');
            $table->foreign(['schema_field_id'])->references(['id'])->on('schema_fields')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['schema_table_id'])->references(['id'])->on('schema_tables')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['tab_panel_id'])->references(['id'])->on('form_elements')->onUpdate('no action')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('form_item_placements', function (Blueprint $table) {
            $table->dropForeign('form_item_placements_container_element_id_foreign');
            $table->dropForeign('form_item_placements_form_element_id_foreign');
            $table->dropForeign('form_item_placements_form_window_id_foreign');
            $table->dropForeign('form_item_placements_lookup_table_id_foreign');
            $table->dropForeign('form_item_placements_parent_placement_id_foreign');
            $table->dropForeign('form_item_placements_schema_field_id_foreign');
            $table->dropForeign('form_item_placements_schema_table_id_foreign');
            $table->dropForeign('form_item_placements_tab_panel_id_foreign');
        });
    }
};
