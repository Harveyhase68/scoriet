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
        Schema::create('form_item_placements', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('form_window_id');
            $table->string('item_type', 30);
            $table->unsignedBigInteger('container_element_id')->nullable()->index('fip_container_index');
            $table->unsignedBigInteger('tab_panel_id')->nullable()->index('form_item_placements_tab_panel_id_foreign');
            $table->integer('x_position')->default(0);
            $table->integer('y_position')->default(0);
            $table->integer('width')->default(200);
            $table->integer('height')->default(40);
            $table->decimal('anchor_right', 5)->nullable()->comment('% right anchor');
            $table->decimal('anchor_bottom', 5)->nullable()->comment('% bottom anchor');
            $table->decimal('anchor_width', 5)->nullable()->comment('% width stretch');
            $table->decimal('anchor_height', 5)->nullable()->comment('% height stretch');
            $table->integer('sort_order')->default(0);
            $table->integer('tab_order')->default(0);
            $table->boolean('is_visible')->default(true);
            $table->unsignedBigInteger('schema_table_id')->nullable()->index('form_item_placements_schema_table_id_foreign');
            $table->unsignedBigInteger('schema_field_id')->nullable()->index('form_item_placements_schema_field_id_foreign');
            $table->string('caption_override')->nullable();
            $table->json('caption_labels')->nullable();
            $table->string('label_position', 10)->nullable()->default('top');
            $table->integer('label_width')->nullable()->default(100);
            $table->string('control_type', 50)->nullable();
            $table->unsignedBigInteger('lookup_table_id')->nullable()->index('form_item_placements_lookup_table_id_foreign');
            $table->string('lookup_value_field', 100)->nullable();
            $table->string('lookup_display_field', 100)->nullable();
            $table->string('lookup_sort_field', 100)->nullable();
            $table->string('lookup_sort_direction', 4)->nullable();
            $table->unsignedBigInteger('form_element_id')->nullable()->index('form_item_placements_form_element_id_foreign');
            $table->string('button_type', 50)->nullable();
            $table->string('button_label')->nullable();
            $table->json('button_labels')->nullable();
            $table->string('button_icon', 100)->nullable();
            $table->string('button_action', 100)->nullable();
            $table->string('button_background_color', 20)->nullable();
            $table->string('button_text_color', 20)->nullable();
            $table->json('style_config')->nullable();
            $table->unsignedBigInteger('parent_placement_id')->nullable()->index('form_item_placements_parent_placement_id_foreign');
            $table->string('menu_icon', 100)->nullable();
            $table->string('menu_action', 100)->nullable();
            $table->string('menu_role_required', 50)->nullable();
            $table->tinyInteger('menu_depth')->default(0);
            $table->timestamps();

            $table->unique(['form_window_id', 'schema_table_id', 'schema_field_id'], 'fip_window_table_field_unique');
            $table->index(['form_window_id', 'schema_table_id'], 'fip_window_table_index');
            $table->index(['form_window_id', 'item_type'], 'fip_window_type_index');
            $table->index(['form_window_id', 'tab_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('form_item_placements');
    }
};
