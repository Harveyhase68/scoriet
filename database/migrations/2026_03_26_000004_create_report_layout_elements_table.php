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
            $table->unsignedBigInteger('report_pattern_form_id');
            $table->unsignedBigInteger('container_element_id')->nullable();
            $table->enum('element_type', [
                'field', 'static_text', 'heading',
                'line_horizontal', 'line_vertical', 'box',
                'page_number', 'page_date', 'page_total',
                'image_placeholder'
            ]);
            $table->unsignedBigInteger('schema_table_id')->nullable();
            $table->unsignedBigInteger('schema_field_id')->nullable();
            $table->decimal('x_position', 8, 2)->default(0);
            $table->decimal('y_position', 8, 2)->default(0);
            $table->decimal('width', 8, 2)->default(0);
            $table->decimal('height', 8, 2)->default(0);
            $table->text('content')->nullable()->comment('For static_text, heading');

            // Font styling - direct columns for explicit schema
            $table->string('font_family', 100)->default('Arial');
            $table->decimal('font_size', 5, 2)->default(10.00)->comment('In points (pt)');
            $table->string('font_weight', 20)->default('normal');
            $table->string('font_style', 20)->default('normal');
            $table->string('text_decoration', 50)->default('none');
            $table->string('text_align', 20)->default('left');
            $table->string('text_color', 9)->default('#000000');

            // Line/box styling - nullable = transparent
            $table->decimal('border_width', 5, 2)->nullable();
            $table->string('border_color', 9)->nullable();
            $table->string('background_color', 9)->nullable()->comment('NULL = transparent');

            $table->string('caption_override', 255)->nullable();
            $table->json('caption_labels')->nullable()->comment('Multi-language: {"de": "...", "en": "..."}');
            $table->integer('sort_order')->default(0);
            $table->boolean('is_visible')->default(true);
            $table->timestamps();

            $table->foreign('report_pattern_form_id')->references('id')->on('report_pattern_forms')->onDelete('cascade');
            $table->foreign('container_element_id')->references('id')->on('report_pattern_elements')->onDelete('set null');
            $table->foreign('schema_table_id')->references('id')->on('schema_tables')->onDelete('set null');
            $table->foreign('schema_field_id')->references('id')->on('schema_fields')->onDelete('set null');
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
