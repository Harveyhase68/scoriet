<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('form_field_placements', function (Blueprint $table) {
            $table->bigIncrements('id');

            // References
            $table->unsignedBigInteger('form_window_id');
            $table->unsignedBigInteger('schema_table_id');
            $table->unsignedBigInteger('schema_field_id');
            $table->unsignedBigInteger('container_element_id');
            $table->unsignedBigInteger('tab_panel_id')->nullable();

            // Position & size within container
            $table->integer('x_position')->default(0);
            $table->integer('y_position')->default(0);
            $table->integer('width')->default(200);
            $table->integer('height')->default(40);

            // User overrides
            $table->string('caption_override', 255)->nullable();
            $table->string('control_type_override', 50)->nullable();

            // Ordering & visibility
            $table->integer('sort_order')->default(0);
            $table->boolean('is_visible')->default(true);

            $table->timestamps();

            // A field can only be placed once per window+table combination
            $table->unique(['form_window_id', 'schema_table_id', 'schema_field_id'], 'ffp_window_table_field_unique');

            // Fast lookup: all placements for a window+table
            $table->index(['form_window_id', 'schema_table_id'], 'ffp_window_table_index');

            // Fast lookup: fields within a container
            $table->index('container_element_id', 'ffp_container_index');

            // Foreign keys
            $table->foreign('form_window_id')->references('id')->on('form_windows')->onDelete('cascade');
            $table->foreign('schema_table_id')->references('id')->on('schema_tables')->onDelete('cascade');
            $table->foreign('schema_field_id')->references('id')->on('schema_fields')->onDelete('cascade');
            $table->foreign('container_element_id')->references('id')->on('form_elements')->onDelete('cascade');
            $table->foreign('tab_panel_id')->references('id')->on('form_elements')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('form_field_placements');
    }
};
