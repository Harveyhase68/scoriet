<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-table layout-override table for the Form Layout Designer.
 *
 * The FormWindow (template, in FormDesignerPanel) carries default_width /
 * default_height that apply to EVERY table laid out into that window. When
 * a user opens the per-table Layout Designer and wants e.g. a taller window
 * just for `users` (because it has 16 fields), changing the template would
 * propagate to every other table — clearly wrong.
 *
 * This table holds the (form_window_id × schema_table_id) override pair.
 * The Layout Designer reads from here on load and writes here on save. The
 * template is left untouched.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('form_table_layouts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('form_window_id');
            $table->unsignedBigInteger('schema_table_id');
            // Both width/height nullable: a row can have only one override,
            // and missing column → "use template default for this axis".
            $table->integer('width')->nullable()->comment('Override for form_windows.default_width');
            $table->integer('height')->nullable()->comment('Override for form_windows.default_height');
            $table->timestamps();

            $table->unique(['form_window_id', 'schema_table_id'], 'ftl_window_table_unique');
            $table->index('schema_table_id', 'ftl_schema_table_index');

            $table->foreign('form_window_id', 'ftl_window_fk')
                ->references('id')->on('form_windows')
                ->onDelete('cascade');
            $table->foreign('schema_table_id', 'ftl_schema_table_fk')
                ->references('id')->on('schema_tables')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('form_table_layouts');
    }
};
