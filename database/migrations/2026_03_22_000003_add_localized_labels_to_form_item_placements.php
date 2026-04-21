<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add localized labels to form_item_placements.
     *
     * caption_labels: JSON object {"de": "Vorname", "en": "First Name"} for field captions
     * button_labels: JSON object {"de": "Speichern", "en": "Save"} for button labels
     *
     * These override caption_override/button_label when a specific language is selected.
     * The existing caption_override/button_label remain as default fallback.
     */
    public function up(): void
    {
        Schema::table('form_item_placements', function (Blueprint $table) {
            $table->json('caption_labels')->nullable()->after('caption_override');
            $table->json('button_labels')->nullable()->after('button_label');
        });
    }

    public function down(): void
    {
        Schema::table('form_item_placements', function (Blueprint $table) {
            $table->dropColumn(['caption_labels', 'button_labels']);
        });
    }
};
