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
        Schema::create('report_layout_elements', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('report_pattern_form_id')->index('report_layout_elements_report_pattern_form_id_foreign');
            $table->unsignedBigInteger('container_element_id')->nullable()->index('report_layout_elements_container_element_id_foreign');
            $table->enum('element_type', ['field', 'static_text', 'heading', 'line_horizontal', 'line_vertical', 'box', 'page_number', 'page_date', 'page_total', 'image_placeholder']);
            $table->unsignedBigInteger('schema_table_id')->nullable()->index('report_layout_elements_schema_table_id_foreign');
            $table->unsignedBigInteger('schema_field_id')->nullable()->index('report_layout_elements_schema_field_id_foreign');
            $table->decimal('x_position')->default(0);
            $table->decimal('y_position')->default(0);
            $table->decimal('width')->default(0);
            $table->decimal('height')->default(0);
            $table->text('content')->nullable()->comment('For static_text, heading');
            $table->string('font_family', 100)->default('Arial');
            $table->decimal('font_size', 5)->default(10)->comment('In points (pt)');
            $table->string('font_weight', 20)->default('normal');
            $table->string('font_style', 20)->default('normal');
            $table->string('text_decoration', 50)->default('none');
            $table->string('text_align', 20)->default('left');
            $table->string('text_color', 9)->default('#000000');
            $table->decimal('border_width', 5)->nullable();
            $table->string('border_color', 9)->nullable();
            $table->string('background_color', 9)->nullable()->comment('NULL = transparent');
            $table->string('caption_override')->nullable();
            $table->json('caption_labels')->nullable()->comment('Multi-language: {"de": "...", "en": "..."}');
            $table->string('label_position', 10)->nullable()->default('top');
            $table->decimal('label_width', 5)->nullable();
            $table->string('control_type', 20)->nullable();
            $table->json('header_style')->nullable()->comment('Per-column header font overrides: {font_family, font_size, font_weight, text_color}');
            $table->integer('sort_order')->default(0);
            $table->boolean('is_visible')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_layout_elements');
    }
};
