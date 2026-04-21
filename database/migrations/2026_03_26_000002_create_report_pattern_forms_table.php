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
            $table->decimal('paper_width', 8, 2)->nullable()->comment('Only for Custom paper size');
            $table->decimal('paper_height', 8, 2)->nullable()->comment('Only for Custom paper size');
            $table->decimal('margin_top', 8, 2)->default(15.00);
            $table->decimal('margin_right', 8, 2)->default(15.00);
            $table->decimal('margin_bottom', 8, 2)->default(15.00);
            $table->decimal('margin_left', 8, 2)->default(15.00);
            $table->decimal('row_height', 8, 2)->nullable()->comment('Only for report_list');
            $table->integer('max_columns')->nullable()->comment('Only for report_list');
            $table->decimal('header_height', 8, 2)->nullable();
            $table->decimal('footer_height', 8, 2)->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->foreign('report_pattern_id')->references('id')->on('report_patterns')->onDelete('cascade');
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
