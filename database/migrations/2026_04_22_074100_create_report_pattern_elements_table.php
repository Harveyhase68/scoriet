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
        Schema::create('report_pattern_elements', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('report_pattern_form_id')->index('report_pattern_elements_report_pattern_form_id_foreign');
            $table->string('element_type', 50);
            $table->decimal('x_position')->default(0);
            $table->decimal('y_position')->default(0);
            $table->decimal('width')->default(0);
            $table->decimal('height')->default(0);
            $table->integer('container_columns')->default(1);
            $table->decimal('container_gap')->default(2)->comment('Gap in paper_unit between fields');
            $table->integer('max_fields')->nullable();
            $table->decimal('field_height')->nullable()->comment('Default field height in paper_unit for auto-place');
            $table->text('content')->nullable()->comment('Text content or placeholder like {:tablename:}');
            $table->json('content_labels')->nullable()->comment('Localized content per language {"de": "...", "en": "..."}');
            $table->string('font_family', 100)->nullable();
            $table->decimal('font_size', 5, 1)->nullable();
            $table->string('font_weight', 20)->nullable();
            $table->string('font_style', 20)->nullable();
            $table->string('text_decoration', 30)->nullable();
            $table->string('text_align', 20)->nullable();
            $table->string('text_color', 20)->nullable();
            $table->decimal('border_width', 5, 1)->nullable();
            $table->string('border_color', 20)->nullable();
            $table->string('background_color', 20)->nullable();
            $table->string('label')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_visible')->default(true);
            $table->unsignedBigInteger('linked_element_id')->nullable()->index('report_pattern_elements_linked_element_id_foreign')->comment('Links table_header to its detail_section sibling');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_pattern_elements');
    }
};
