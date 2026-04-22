<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add label configuration fields to form_item_placements.
     *
     * label_position: 'top' (label above field) or 'left' (label beside field) or 'right' (for checkboxes)
     * label_width: width in pixels when label_position is 'left' (default ~100px)
     */
    public function up(): void
    {
        Schema::table('form_item_placements', function (Blueprint $table) {
            $table->string('label_position', 10)->nullable()->default('top')->after('caption_labels');
            $table->integer('label_width')->nullable()->default(100)->after('label_position');
        });
    }

    public function down(): void
    {
        Schema::table('form_item_placements', function (Blueprint $table) {
            $table->dropColumn(['label_position', 'label_width']);
        });
    }
};
