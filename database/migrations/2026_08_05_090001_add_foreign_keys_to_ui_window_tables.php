<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * `set null` is used deliberately for every category/parent relationship so
     * deleting an organizational node (category, container) never silently
     * destroys a user's window design - orphaned rows just become "uncategorized"
     * / "root-level" instead of being cascade-deleted.
     */
    public function up(): void
    {
        Schema::table('ui_window_categories', function (Blueprint $table) {
            $table->foreign(['project_id'])->references(['id'])->on('projects')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['parent_id'])->references(['id'])->on('ui_window_categories')->onUpdate('no action')->onDelete('set null');
        });

        Schema::table('ui_windows', function (Blueprint $table) {
            $table->foreign(['project_id'])->references(['id'])->on('projects')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['category_id'])->references(['id'])->on('ui_window_categories')->onUpdate('no action')->onDelete('set null');
            $table->foreign(['schema_table_id'])->references(['id'])->on('schema_tables')->onUpdate('no action')->onDelete('set null');
        });

        Schema::table('ui_window_elements', function (Blueprint $table) {
            $table->foreign(['window_id'])->references(['id'])->on('ui_windows')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['parent_element_id'])->references(['id'])->on('ui_window_elements')->onUpdate('no action')->onDelete('set null');
        });

        Schema::table('ui_window_controls', function (Blueprint $table) {
            $table->foreign(['window_id'])->references(['id'])->on('ui_windows')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['container_element_id'])->references(['id'])->on('ui_window_elements')->onUpdate('no action')->onDelete('set null');
            $table->foreign(['schema_field_id'])->references(['id'])->on('schema_fields')->onUpdate('no action')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ui_window_controls', function (Blueprint $table) {
            $table->dropForeign('ui_window_controls_window_id_foreign');
            $table->dropForeign('ui_window_controls_container_element_id_foreign');
            $table->dropForeign('ui_window_controls_schema_field_id_foreign');
        });

        Schema::table('ui_window_elements', function (Blueprint $table) {
            $table->dropForeign('ui_window_elements_window_id_foreign');
            $table->dropForeign('ui_window_elements_parent_element_id_foreign');
        });

        Schema::table('ui_windows', function (Blueprint $table) {
            $table->dropForeign('ui_windows_project_id_foreign');
            $table->dropForeign('ui_windows_category_id_foreign');
            $table->dropForeign('ui_windows_schema_table_id_foreign');
        });

        Schema::table('ui_window_categories', function (Blueprint $table) {
            $table->dropForeign('ui_window_categories_project_id_foreign');
            $table->dropForeign('ui_window_categories_parent_id_foreign');
        });
    }
};
