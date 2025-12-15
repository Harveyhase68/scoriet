<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Neue Felder:
     * - container_gap: Abstand zwischen Controls in Pixel (Standard: 8px)
     * - container_columns: Anzahl Spalten (1, 2 oder 3)
     * - button_background_color: Hintergrundfarbe des Buttons (Hex)
     * - button_text_color: Schriftfarbe des Buttons (Hex)
     */
    public function up(): void
    {
        Schema::table('form_elements', function (Blueprint $table) {
            // Container-spezifische Felder
            $table->integer('container_gap')->default(8)->after('max_fields')
                ->comment('Abstand zwischen Controls in Pixel');
            $table->tinyInteger('container_columns')->default(1)->after('container_gap')
                ->comment('Anzahl Spalten (1-3)');

            // Button-spezifische Farben
            $table->string('button_background_color', 7)->nullable()->after('button_action')
                ->comment('Button Hintergrundfarbe (Hex)');
            $table->string('button_text_color', 7)->nullable()->after('button_background_color')
                ->comment('Button Schriftfarbe (Hex)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('form_elements', function (Blueprint $table) {
            $table->dropColumn([
                'container_gap',
                'container_columns',
                'button_background_color',
                'button_text_color'
            ]);
        });
    }
};
