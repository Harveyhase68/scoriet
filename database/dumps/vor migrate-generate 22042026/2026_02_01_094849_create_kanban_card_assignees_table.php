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
        Schema::create('kanban_card_assignees', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('card_id')->index();
            $table->unsignedBigInteger('user_id')->index();
            $table->unsignedBigInteger('assigned_by')->nullable()->index('kanban_card_assignees_assigned_by_foreign');
            $table->timestamp('assigned_at')->useCurrent();
            $table->timestamps();

            $table->unique(['card_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kanban_card_assignees');
    }
};
