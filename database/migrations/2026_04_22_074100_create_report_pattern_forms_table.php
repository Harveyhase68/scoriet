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
        Schema::create('report_pattern_forms', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('report_pattern_id');
            $table->enum('form_type', ['report_single', 'report_list']);
            $table->string('paper_size', 20)->default('A4');
            $table->string('paper_orientation', 15)->default('portrait');
            $table->string('paper_unit', 5)->default('mm');
            $table->decimal('paper_width')->nullable()->comment('Only for Custom paper size');
            $table->decimal('paper_height')->nullable()->comment('Only for Custom paper size');
            $table->decimal('margin_top')->default(15);
            $table->decimal('margin_right')->default(15);
            $table->decimal('margin_bottom')->default(15);
            $table->decimal('margin_left')->default(15);
            $table->decimal('row_height')->nullable()->comment('Only for report_list');
            $table->integer('max_columns')->nullable()->comment('Only for report_list');
            $table->decimal('header_height')->nullable();
            $table->decimal('footer_height')->nullable();
            $table->json('list_style_config')->nullable()->comment('Table styling for report_list: header colors, alternating rows, borders');
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['report_pattern_id', 'form_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_pattern_forms');
    }
};
