<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * "Windows" are freely designed, project-scoped screens (independent of
     * FormSets/table generation) organized in a category tree. Foreign keys
     * are added in a separate follow-up migration (project convention).
     */
    public function up(): void
    {
        Schema::create('ui_window_categories', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('project_id');
            $table->unsignedBigInteger('parent_id')->nullable()->index('ui_window_categories_parent_id_foreign');
            $table->string('name', 150);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['project_id', 'parent_id']);
        });

        Schema::create('ui_windows', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('project_id');
            $table->unsignedBigInteger('category_id')->nullable()->index('ui_windows_category_id_foreign');
            $table->string('name', 100)->comment('Sanitized machine name, unique per project');
            $table->string('display_name', 150)->nullable();
            $table->text('description')->nullable();
            $table->unsignedBigInteger('schema_table_id')->nullable()->index('ui_windows_schema_table_id_foreign')
                ->comment('Optional link to a schema table (generator property, not yet used for generation)');
            $table->integer('canvas_width')->default(1024);
            $table->integer('canvas_height')->default(768);
            $table->string('background_color', 7)->nullable();
            $table->string('window_color', 7)->nullable();
            $table->string('text_color', 7)->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['project_id', 'name'], 'ui_windows_project_name_unique');
        });

        Schema::create('ui_window_elements', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('window_id');
            $table->enum('element_type', ['container', 'group_box', 'tab_container', 'tab_panel']);
            $table->unsignedBigInteger('parent_element_id')->nullable()->index('ui_window_elements_parent_element_id_foreign');
            $table->integer('x_position')->default(0);
            $table->integer('y_position')->default(0);
            $table->integer('width')->default(100);
            $table->integer('height')->default(40);
            $table->decimal('anchor_right', 5)->nullable()->comment('% right anchor');
            $table->decimal('anchor_bottom', 5)->nullable()->comment('% bottom anchor');
            $table->decimal('anchor_width', 5)->nullable()->comment('% width stretch');
            $table->decimal('anchor_height', 5)->nullable()->comment('% height stretch');
            $table->enum('container_orientation', ['vertical', 'horizontal'])->nullable();
            $table->tinyInteger('container_columns')->nullable()->default(1);
            $table->integer('container_gap')->nullable()->default(8);
            $table->string('tab_label', 100)->nullable();
            $table->json('tab_labels')->nullable()->comment('Per-language tab label, e.g. {"de":"...","en":"..."}');
            $table->json('custom_style')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_visible')->default(true);
            $table->timestamps();

            $table->index(['window_id', 'element_type']);
            $table->index(['window_id', 'sort_order']);
        });

        Schema::create('ui_window_controls', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('window_id');
            $table->unsignedBigInteger('container_element_id')->nullable()->index('ui_window_controls_container_element_id_foreign')
                ->comment('Null = placed directly on the window canvas');
            $table->string('control_type', 50)->comment('text, textarea, password, checkbox, dropdown, slider, ... (universal palette)');
            $table->unsignedBigInteger('schema_field_id')->nullable()->index('ui_window_controls_schema_field_id_foreign')
                ->comment('Optional link to a schema field (generator property, not yet used for generation)');
            $table->integer('x_position')->default(0);
            $table->integer('y_position')->default(0);
            $table->integer('width')->default(200);
            $table->integer('height')->default(40);
            $table->decimal('anchor_right', 5)->nullable();
            $table->decimal('anchor_bottom', 5)->nullable();
            $table->decimal('anchor_width', 5)->nullable();
            $table->decimal('anchor_height', 5)->nullable();
            $table->string('caption_override')->nullable();
            $table->json('caption_labels')->nullable();
            $table->string('comment_override')->nullable()->comment('Help text shown under the control');
            $table->json('comment_labels')->nullable();
            $table->string('hint_override')->nullable()->comment('Input placeholder / hint text');
            $table->json('hint_labels')->nullable();
            $table->string('label_position', 10)->nullable()->default('top');
            $table->integer('label_width')->nullable()->default(100);
            $table->json('options')->nullable()->comment('Static option list for dropdown/radio_group/multiselect/checkbox_group: [{value, labels:{lang:text}}]');
            $table->boolean('is_required')->default(false);
            $table->string('default_value')->nullable();
            $table->decimal('min_value', 12, 2)->nullable();
            $table->decimal('max_value', 12, 2)->nullable();
            $table->decimal('step_value', 12, 2)->nullable();
            $table->string('control_background_color', 7)->nullable();
            $table->string('control_text_color', 7)->nullable();
            $table->json('style_config')->nullable();
            $table->integer('sort_order')->default(0);
            $table->integer('tab_order')->default(0);
            $table->boolean('is_visible')->default(true);
            $table->timestamps();

            $table->index(['window_id', 'control_type']);
            $table->index(['window_id', 'sort_order']);
            $table->index(['window_id', 'tab_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ui_window_controls');
        Schema::dropIfExists('ui_window_elements');
        Schema::dropIfExists('ui_windows');
        Schema::dropIfExists('ui_window_categories');
    }
};
