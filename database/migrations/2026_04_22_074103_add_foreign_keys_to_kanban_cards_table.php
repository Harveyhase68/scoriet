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
        Schema::table('kanban_cards', function (Blueprint $table) {
            $table->foreign(['assigned_to'])->references(['id'])->on('users')->onUpdate('no action')->onDelete('set null');
            $table->foreign(['column_id'])->references(['id'])->on('kanban_columns')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['created_by'])->references(['id'])->on('users')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kanban_cards', function (Blueprint $table) {
            $table->dropForeign('kanban_cards_assigned_to_foreign');
            $table->dropForeign('kanban_cards_column_id_foreign');
            $table->dropForeign('kanban_cards_created_by_foreign');
        });
    }
};
