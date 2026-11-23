<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Stores SML ("Scoriet Meta Language") code-behind, one row per
     * (target, event_name) pair. `control_id`/`element_id` are mutually
     * exclusive and both null for a window-level event - `window_id` is
     * always set so every row has a real, direct relation to its window
     * regardless of what it's actually attached to.
     *
     * Unlike category/container relationships elsewhere in this schema,
     * all three FKs cascade: code attached to a control/element/window that
     * no longer exists is meaningless, never an orphan worth preserving.
     */
    public function up(): void
    {
        Schema::create('ui_window_events', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('window_id');
            $table->unsignedBigInteger('control_id')->nullable();
            $table->unsignedBigInteger('element_id')->nullable();
            $table->string('event_name', 50);
            $table->longText('code')->nullable();
            $table->timestamps();

            $table->index(['window_id', 'control_id', 'element_id']);
        });

        Schema::table('ui_window_events', function (Blueprint $table) {
            $table->foreign(['window_id'])->references(['id'])->on('ui_windows')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['control_id'])->references(['id'])->on('ui_window_controls')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['element_id'])->references(['id'])->on('ui_window_elements')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ui_window_events');
    }
};
