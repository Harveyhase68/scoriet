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
        Schema::table('kanban_card_label', function (Blueprint $table) {
            $table->foreign(['card_id'])->references(['id'])->on('kanban_cards')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['label_id'])->references(['id'])->on('kanban_labels')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kanban_card_label', function (Blueprint $table) {
            $table->dropForeign('kanban_card_label_card_id_foreign');
            $table->dropForeign('kanban_card_label_label_id_foreign');
        });
    }
};
