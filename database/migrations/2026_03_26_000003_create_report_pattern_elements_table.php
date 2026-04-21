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
            $table->unsignedBigInteger('report_pattern_form_id');
            $table->enum('element_type', ['container', 'header_section', 'detail_section', 'footer_section']);
            $table->decimal('x_position', 8, 2)->default(0);
            $table->decimal('y_position', 8, 2)->default(0);
            $table->decimal('width', 8, 2)->default(0);
            $table->decimal('height', 8, 2)->default(0);
            $table->integer('container_columns')->default(1);
            $table->decimal('container_gap', 8, 2)->default(2.00)->comment('Gap in paper_unit between fields');
            $table->integer('max_fields')->nullable();
            $table->string('label', 255)->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_visible')->default(true);
            $table->timestamps();

            $table->foreign('report_pattern_form_id')->references('id')->on('report_pattern_forms')->onDelete('cascade');
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
