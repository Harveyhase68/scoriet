<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * `ui_procedures` holds both SML procedure scopes in one table, exactly
     * like ui_window_events already does for control_id/element_id:
     * `project_id` set (window_id null) = a global procedure, callable from
     * anywhere; `window_id` set (project_id null) = a local procedure, only
     * callable from within that one window. Exactly one of the two is set -
     * enforced in the controller, not the schema, the same way
     * ui_window_events leaves control_id/element_id exclusivity to the app.
     *
     * `ui_project_globals` is a project's global variable declarations
     * (WinDev's `.wdp` "globals" block) - a flat typed list, not code, so it
     * gets its own simple table rather than living inside ui_procedures.
     */
    public function up(): void
    {
        Schema::create('ui_procedures', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id')->nullable();
            $table->unsignedBigInteger('window_id')->nullable();
            $table->string('name', 150);
            $table->string('params', 500)->nullable();
            $table->string('return_type', 50)->nullable()->default('void');
            $table->boolean('is_private')->default(false);
            $table->longText('code')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->index(['project_id']);
            $table->index(['window_id']);
        });

        Schema::create('ui_project_globals', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->string('name', 150);
            $table->string('type', 150);
            $table->string('default_value', 500)->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['project_id', 'name']);
        });

        Schema::table('ui_procedures', function (Blueprint $table) {
            $table->foreign(['project_id'])->references(['id'])->on('projects')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['window_id'])->references(['id'])->on('ui_windows')->onUpdate('no action')->onDelete('cascade');
        });

        Schema::table('ui_project_globals', function (Blueprint $table) {
            $table->foreign(['project_id'])->references(['id'])->on('projects')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ui_project_globals');
        Schema::dropIfExists('ui_procedures');
    }
};
