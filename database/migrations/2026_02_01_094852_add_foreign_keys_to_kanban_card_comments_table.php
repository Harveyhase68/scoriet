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
        Schema::table('kanban_card_comments', function (Blueprint $table) {
            $table->foreign(['card_id'])->references(['id'])->on('kanban_cards')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['user_id'])->references(['id'])->on('users')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kanban_card_comments', function (Blueprint $table) {
            $table->dropForeign('kanban_card_comments_card_id_foreign');
            $table->dropForeign('kanban_card_comments_user_id_foreign');
        });
    }
};
