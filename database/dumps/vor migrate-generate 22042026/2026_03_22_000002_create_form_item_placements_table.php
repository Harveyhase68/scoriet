<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Unified table for all form item placements:
     * - field: database field placements (input, combobox, date, etc.)
     * - button: button placements (save, cancel, nav, custom, etc.)
     * - Future: menu_item, print_field, table_column, etc.
     */
    public function up(): void
    {
        Schema::create('form_item_placements', function (Blueprint $table) {
            $table->bigIncrements('id');

            // ── Core references ──
            $table->unsignedBigInteger('form_window_id');
            $table->string('item_type', 30);  // 'field', 'button', 'menu_item', 'print_field', etc.

            // ── Container/layout ──
            $table->unsignedBigInteger('container_element_id')->nullable(); // Container this item lives in
            $table->unsignedBigInteger('tab_panel_id')->nullable();        // Tab panel if inside tabs

            // ── Position & size ──
            $table->integer('x_position')->default(0);
            $table->integer('y_position')->default(0);
            $table->integer('width')->default(200);
            $table->integer('height')->default(40);
            $table->integer('sort_order')->default(0);
            $table->boolean('is_visible')->default(true);

            // ── Field-specific (item_type = 'field') ──
            $table->unsignedBigInteger('schema_table_id')->nullable();
            $table->unsignedBigInteger('schema_field_id')->nullable();
            $table->string('caption_override', 255)->nullable();
            $table->string('control_type', 50)->nullable();   // text, integer, float, currency, combobox, date, time, datetime, checkbox, textarea, file, password, hidden, readonly

            // ── Combobox/lookup (item_type = 'field', control_type = 'combobox') ──
            $table->unsignedBigInteger('lookup_table_id')->nullable();      // Referenced/target table
            $table->string('lookup_value_field', 100)->nullable();          // Value field (usually PK)
            $table->string('lookup_display_field', 100)->nullable();        // Display field (shown to user)
            $table->string('lookup_sort_field', 100)->nullable();           // Sort field
            $table->string('lookup_sort_direction', 4)->nullable();         // 'ASC' or 'DESC'

            // ── Button-specific (item_type = 'button') ──
            $table->unsignedBigInteger('form_element_id')->nullable();      // Link to FormElement (NULL = custom button)
            $table->string('button_type', 50)->nullable();                  // button_save, button_cancel, button_custom, etc.
            $table->string('button_label', 255)->nullable();
            $table->string('button_icon', 100)->nullable();
            $table->string('button_action', 100)->nullable();
            $table->string('button_background_color', 20)->nullable();
            $table->string('button_text_color', 20)->nullable();

            $table->timestamps();

            // ── Indexes ──
            $table->index(['form_window_id', 'item_type'], 'fip_window_type_index');
            $table->index(['form_window_id', 'schema_table_id'], 'fip_window_table_index');
            $table->index('container_element_id', 'fip_container_index');

            // A field can only be placed once per window+table
            $table->unique(
                ['form_window_id', 'schema_table_id', 'schema_field_id'],
                'fip_window_table_field_unique'
            );

            // ── Foreign keys ──
            $table->foreign('form_window_id')->references('id')->on('form_windows')->onDelete('cascade');
            $table->foreign('container_element_id')->references('id')->on('form_elements')->onDelete('cascade');
            $table->foreign('tab_panel_id')->references('id')->on('form_elements')->onDelete('set null');
            $table->foreign('schema_table_id')->references('id')->on('schema_tables')->onDelete('cascade');
            $table->foreign('schema_field_id')->references('id')->on('schema_fields')->onDelete('cascade');
            $table->foreign('lookup_table_id')->references('id')->on('schema_tables')->onDelete('set null');
            $table->foreign('form_element_id')->references('id')->on('form_elements')->onDelete('set null');
        });

        // ── Migrate existing data ──

        // Migrate form_field_placements → form_item_placements
        if (Schema::hasTable('form_field_placements')) {
            DB::statement("
                INSERT INTO form_item_placements
                    (form_window_id, item_type, container_element_id, tab_panel_id,
                     x_position, y_position, width, height, sort_order, is_visible,
                     schema_table_id, schema_field_id, caption_override, control_type,
                     created_at, updated_at)
                SELECT
                    form_window_id, 'field', container_element_id, tab_panel_id,
                    x_position, y_position, width, height, sort_order, is_visible,
                    schema_table_id, schema_field_id, caption_override, control_type_override,
                    created_at, updated_at
                FROM form_field_placements
            ");
        }

        // Migrate form_button_placements → form_item_placements
        if (Schema::hasTable('form_button_placements')) {
            DB::statement("
                INSERT INTO form_item_placements
                    (form_window_id, item_type,
                     x_position, y_position, width, height, sort_order, is_visible,
                     form_element_id, button_type, button_label, button_icon,
                     button_action, button_background_color, button_text_color,
                     created_at, updated_at)
                SELECT
                    form_window_id, 'button',
                    x_position, y_position, width, height, sort_order, is_visible,
                    form_element_id, button_type, button_label, button_icon,
                    button_action, button_background_color, button_text_color,
                    created_at, updated_at
                FROM form_button_placements
            ");
        }

        // Drop old tables
        Schema::dropIfExists('form_button_placements');
        Schema::dropIfExists('form_field_placements');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate old tables
        Schema::create('form_field_placements', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('form_window_id');
            $table->unsignedBigInteger('schema_table_id');
            $table->unsignedBigInteger('schema_field_id');
            $table->unsignedBigInteger('container_element_id');
            $table->unsignedBigInteger('tab_panel_id')->nullable();
            $table->integer('x_position')->default(0);
            $table->integer('y_position')->default(0);
            $table->integer('width')->default(200);
            $table->integer('height')->default(40);
            $table->string('caption_override', 255)->nullable();
            $table->string('control_type_override', 50)->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_visible')->default(true);
            $table->timestamps();
            $table->unique(['form_window_id', 'schema_table_id', 'schema_field_id'], 'ffp_window_table_field_unique');
            $table->foreign('form_window_id')->references('id')->on('form_windows')->onDelete('cascade');
            $table->foreign('schema_table_id')->references('id')->on('schema_tables')->onDelete('cascade');
            $table->foreign('schema_field_id')->references('id')->on('schema_fields')->onDelete('cascade');
            $table->foreign('container_element_id')->references('id')->on('form_elements')->onDelete('cascade');
            $table->foreign('tab_panel_id')->references('id')->on('form_elements')->onDelete('set null');
        });

        Schema::create('form_button_placements', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('form_window_id');
            $table->unsignedBigInteger('form_element_id')->nullable();
            $table->string('button_type', 50);
            $table->string('button_label')->nullable();
            $table->string('button_icon', 100)->nullable();
            $table->string('button_action', 100)->nullable();
            $table->string('button_background_color', 20)->nullable();
            $table->string('button_text_color', 20)->nullable();
            $table->integer('x_position')->default(0);
            $table->integer('y_position')->default(0);
            $table->integer('width')->default(120);
            $table->integer('height')->default(36);
            $table->integer('sort_order')->default(0);
            $table->boolean('is_visible')->default(true);
            $table->timestamps();
            $table->foreign('form_window_id')->references('id')->on('form_windows')->onDelete('cascade');
            $table->foreign('form_element_id')->references('id')->on('form_elements')->onDelete('set null');
        });

        // Migrate data back
        DB::statement("INSERT INTO form_field_placements (form_window_id, schema_table_id, schema_field_id, container_element_id, tab_panel_id, x_position, y_position, width, height, caption_override, control_type_override, sort_order, is_visible, created_at, updated_at) SELECT form_window_id, schema_table_id, schema_field_id, container_element_id, tab_panel_id, x_position, y_position, width, height, caption_override, control_type, sort_order, is_visible, created_at, updated_at FROM form_item_placements WHERE item_type = 'field'");
        DB::statement("INSERT INTO form_button_placements (form_window_id, form_element_id, button_type, button_label, button_icon, button_action, button_background_color, button_text_color, x_position, y_position, width, height, sort_order, is_visible, created_at, updated_at) SELECT form_window_id, form_element_id, button_type, button_label, button_icon, button_action, button_background_color, button_text_color, x_position, y_position, width, height, sort_order, is_visible, created_at, updated_at FROM form_item_placements WHERE item_type = 'button'");

        Schema::dropIfExists('form_item_placements');
    }
};
