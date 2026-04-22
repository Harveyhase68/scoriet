<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Button placements on form layouts.
     * Stores position/size of buttons from FormElements + custom buttons.
     */
    public function up(): void
    {
        Schema::create('form_button_placements', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('form_window_id');
            $table->unsignedBigInteger('form_element_id')->nullable(); // NULL = custom/free button
            $table->string('button_type', 50); // button_save, button_cancel, button_custom, etc.
            $table->string('button_label')->nullable();
            $table->string('button_icon', 100)->nullable();
            $table->string('button_action', 100)->nullable();
            $table->string('button_background_color', 20)->nullable();
            $table->string('button_text_color', 20)->nullable();
            $table->integer('x_position')->default(0);
            $table->integer('y_position')->default(0);
            $table->integer('width')->default(120);
            $table->integer('height')->default(36);
            $table->integer('sort_order')->default(0);
            $table->boolean('is_visible')->default(true);
            $table->timestamps();

            $table->foreign('form_window_id')->references('id')->on('form_windows')->onDelete('cascade');
            $table->foreign('form_element_id')->references('id')->on('form_elements')->onDelete('set null');
            $table->index(['form_window_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('form_button_placements');
    }
};
