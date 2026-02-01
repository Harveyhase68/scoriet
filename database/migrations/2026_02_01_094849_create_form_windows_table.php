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
        Schema::create('form_windows', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('form_set_id');
            $table->string('name', 100);
            $table->string('display_name')->nullable();
            $table->enum('window_type', ['main_menu', 'create_edit', 'data_table', 'report_single', 'report_list']);
            $table->integer('min_width')->default(800);
            $table->integer('min_height')->default(600);
            $table->integer('default_width')->default(1024);
            $table->integer('default_height')->default(768);
            $table->string('background_color', 7)->nullable();
            $table->string('window_color', 7)->nullable();
            $table->string('text_color', 7)->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['form_set_id', 'window_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('form_windows');
    }
};
