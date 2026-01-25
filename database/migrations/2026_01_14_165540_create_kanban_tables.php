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
        // Kanban Boards - One per project
        Schema::create('kanban_boards', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->string('name', 100)->default('Project Board');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('project_id')
                ->references('id')
                ->on('projects')
                ->onDelete('cascade');

            $table->unique('project_id'); // One board per project
            $table->index('is_active');
        });

        // Kanban Columns (Swimlanes)
        Schema::create('kanban_columns', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('board_id');
            $table->string('name', 100);
            $table->string('color', 7)->default('#3b82f6'); // Hex color
            $table->unsignedInteger('position')->default(0);
            $table->unsignedInteger('wip_limit')->nullable(); // Work in Progress limit
            $table->boolean('is_done_column')->default(false); // Mark as "done" column
            $table->timestamps();

            $table->foreign('board_id')
                ->references('id')
                ->on('kanban_boards')
                ->onDelete('cascade');

            $table->index(['board_id', 'position']);
        });

        // Kanban Cards (Tasks)
        Schema::create('kanban_cards', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('column_id');
            $table->unsignedBigInteger('created_by');
            $table->unsignedBigInteger('assigned_to')->nullable();
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->string('color', 7)->nullable(); // Card color/label
            $table->unsignedInteger('position')->default(0);
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->date('due_date')->nullable();
            $table->unsignedInteger('estimated_hours')->nullable();
            $table->unsignedInteger('actual_hours')->nullable();
            $table->timestamps();
            $table->timestamp('completed_at')->nullable();

            $table->foreign('column_id')
                ->references('id')
                ->on('kanban_columns')
                ->onDelete('cascade');

            $table->foreign('created_by')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            $table->foreign('assigned_to')
                ->references('id')
                ->on('users')
                ->onDelete('set null');

            $table->index(['column_id', 'position']);
            $table->index('assigned_to');
            $table->index('due_date');
            $table->index('priority');
        });

        // Kanban Card Labels (Tags)
        Schema::create('kanban_labels', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('board_id');
            $table->string('name', 50);
            $table->string('color', 7)->default('#6b7280');
            $table->timestamps();

            $table->foreign('board_id')
                ->references('id')
                ->on('kanban_boards')
                ->onDelete('cascade');

            $table->index('board_id');
        });

        // Pivot table for card-label relationship
        Schema::create('kanban_card_label', function (Blueprint $table) {
            $table->unsignedBigInteger('card_id');
            $table->unsignedBigInteger('label_id');

            $table->foreign('card_id')
                ->references('id')
                ->on('kanban_cards')
                ->onDelete('cascade');

            $table->foreign('label_id')
                ->references('id')
                ->on('kanban_labels')
                ->onDelete('cascade');

            $table->primary(['card_id', 'label_id']);
        });

        // Card Comments
        Schema::create('kanban_card_comments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('card_id');
            $table->unsignedBigInteger('user_id');
            $table->text('content');
            $table->timestamps();

            $table->foreign('card_id')
                ->references('id')
                ->on('kanban_cards')
                ->onDelete('cascade');

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            $table->index(['card_id', 'created_at']);
        });

        // Card Activity Log
        Schema::create('kanban_card_activities', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('card_id');
            $table->unsignedBigInteger('user_id');
            $table->string('action', 50); // created, moved, updated, assigned, completed, etc.
            $table->json('old_value')->nullable();
            $table->json('new_value')->nullable();
            $table->timestamps();

            $table->foreign('card_id')
                ->references('id')
                ->on('kanban_cards')
                ->onDelete('cascade');

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            $table->index(['card_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kanban_card_activities');
        Schema::dropIfExists('kanban_card_comments');
        Schema::dropIfExists('kanban_card_label');
        Schema::dropIfExists('kanban_labels');
        Schema::dropIfExists('kanban_cards');
        Schema::dropIfExists('kanban_columns');
        Schema::dropIfExists('kanban_boards');
    }
};
