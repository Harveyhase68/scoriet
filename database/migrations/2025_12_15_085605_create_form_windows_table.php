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
            $table->id();
            $table->unsignedBigInteger('form_set_id');

            // Identifikation
            $table->string('name', 100);
            $table->string('display_name', 255)->nullable();

            // Fenstertyp (5 Haupt-Typen, 1x pro Set)
            $table->enum('window_type', [
                'main_menu',      // Hauptmenü-Vorlage
                'create_edit',    // Formular-Vorlage
                'data_table',     // Datentabelle-Vorlage
                'report_single',  // Einzelreport-Vorlage
                'report_list'     // Listenreport-Vorlage
            ]);

            // Fenstergröße
            $table->integer('min_width')->default(800);
            $table->integer('min_height')->default(600);
            $table->integer('default_width')->default(1024);
            $table->integer('default_height')->default(768);

            // Styling (überschreibt Set-Defaults wenn gesetzt)
            $table->string('background_color', 7)->nullable();
            $table->string('window_color', 7)->nullable();
            $table->string('text_color', 7)->nullable();

            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            // Foreign Keys
            $table->foreign('form_set_id')->references('id')->on('form_sets')->onDelete('cascade');

            // Nur 1 Vorlage pro Typ pro Set!
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
