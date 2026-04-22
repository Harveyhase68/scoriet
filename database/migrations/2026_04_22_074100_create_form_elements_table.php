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
        Schema::create('form_elements', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('form_window_id');
            $table->enum('element_type', ['container', 'tab_container', 'tab_panel', 'menu_container', 'button_nav_first', 'button_nav_prev', 'button_nav_next', 'button_nav_last', 'button_save', 'button_cancel', 'button_close', 'button_new', 'button_delete', 'button_custom', 'separator', 'spacer']);
            $table->integer('x_position')->default(0);
            $table->integer('y_position')->default(0);
            $table->integer('width')->default(100);
            $table->integer('height')->default(40);
            $table->decimal('anchor_right', 5)->nullable()->comment('% right anchor (0=follow right, null=none)');
            $table->decimal('anchor_bottom', 5)->nullable()->comment('% bottom anchor (0=follow bottom, null=none)');
            $table->decimal('anchor_width', 5)->nullable()->comment('% width stretch (100=grow with window)');
            $table->decimal('anchor_height', 5)->nullable()->comment('% height stretch (100=grow with window)');
            $table->enum('container_orientation', ['vertical', 'horizontal'])->nullable();
            $table->integer('max_fields')->nullable();
            $table->integer('container_gap')->nullable()->default(8)->comment('Abstand zwischen Controls in Pixel');
            $table->integer('default_control_height')->nullable()->default(56);
            $table->tinyInteger('container_columns')->nullable()->default(1)->comment('Anzahl Spalten (1-3)');
            $table->string('button_label', 100)->nullable();
            $table->string('button_icon', 50)->nullable();
            $table->string('button_action', 100)->nullable();
            $table->string('button_background_color', 7)->nullable()->comment('Button Hintergrundfarbe (Hex)');
            $table->string('button_text_color', 7)->nullable()->comment('Button Schriftfarbe (Hex)');
            $table->string('tab_label', 100)->nullable();
            $table->unsignedBigInteger('parent_tab_container_id')->nullable()->index('form_elements_parent_tab_container_id_foreign');
            $table->json('custom_style')->nullable();
            $table->integer('sort_order')->default(0);
            $table->smallInteger('tab_order')->default(0);
            $table->boolean('is_visible')->default(true);
            $table->timestamps();

            $table->index(['form_window_id', 'element_type']);
            $table->index(['form_window_id', 'sort_order']);
            $table->index(['form_window_id', 'tab_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('form_elements');
    }
};
