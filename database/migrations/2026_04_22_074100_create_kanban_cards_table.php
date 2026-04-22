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
        Schema::create('kanban_cards', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('column_id');
            $table->unsignedBigInteger('created_by')->index('kanban_cards_created_by_foreign');
            $table->unsignedBigInteger('assigned_to')->nullable()->index();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('color', 7)->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium')->index();
            $table->date('due_date')->nullable()->index();
            $table->unsignedInteger('estimated_hours')->nullable();
            $table->unsignedInteger('actual_hours')->nullable();
            $table->timestamps();
            $table->timestamp('completed_at')->nullable();

            $table->index(['column_id', 'position']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kanban_cards');
    }
};
