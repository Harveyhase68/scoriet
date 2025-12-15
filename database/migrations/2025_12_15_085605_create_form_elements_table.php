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
        Schema::create('form_elements', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('form_window_id');

            // Element-Typ
            $table->enum('element_type', [
                'container',           // Daten-Container (für Felder/Tabelle)
                'tab_container',       // Tab-Container
                'tab_panel',           // Einzelnes Tab-Panel
                'menu_container',      // Menü-Container
                'button_nav_first',    // Navigation: Erster
                'button_nav_prev',     // Navigation: Vorheriger
                'button_nav_next',     // Navigation: Nächster
                'button_nav_last',     // Navigation: Letzter
                'button_save',         // Übernehmen/Speichern
                'button_cancel',       // Abbrechen
                'button_close',        // Schließen
                'button_new',          // Neu
                'button_delete',       // Löschen
                'button_custom',       // Benutzerdefinierter Button
                'separator',           // Trennlinie
                'spacer'               // Abstandshalter
            ]);

            // Position & Größe
            $table->integer('x_position')->default(0);
            $table->integer('y_position')->default(0);
            $table->integer('width')->default(100);
            $table->integer('height')->default(40);

            // Container-spezifisch
            $table->enum('container_orientation', ['vertical', 'horizontal'])->nullable();
            $table->integer('max_fields')->nullable();

            // Button-spezifisch
            $table->string('button_label', 100)->nullable();
            $table->string('button_icon', 50)->nullable();
            $table->string('button_action', 100)->nullable();

            // Tab-spezifisch
            $table->string('tab_label', 100)->nullable();
            $table->unsignedBigInteger('parent_tab_container_id')->nullable();

            // Styling
            $table->json('custom_style')->nullable();

            $table->integer('sort_order')->default(0);
            $table->boolean('is_visible')->default(true);
            $table->timestamps();

            // Foreign Keys
            $table->foreign('form_window_id')->references('id')->on('form_windows')->onDelete('cascade');
            $table->foreign('parent_tab_container_id')->references('id')->on('form_elements')->onDelete('cascade');

            // Indexes
            $table->index(['form_window_id', 'element_type']);
            $table->index(['form_window_id', 'sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('form_elements');
    }
};
