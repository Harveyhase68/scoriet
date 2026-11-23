<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Three small project-scoped tables rounding out the "project
     * declarations" picture alongside the already-existing
     * ui_project_globals:
     *
     * - ui_project_events: `on project <event> { }` code (e.g. the
     *   project's startup/init code) - mirrors ui_window_events' shape but
     *   scoped only to the project itself, no control/element equivalent
     *   exists at project level.
     * - ui_project_structs: `struct "Name" { var field: type }` type
     *   definitions - fields stored as JSON since a struct's field list has
     *   no independent existence of its own (never selected/moved on a
     *   canvas the way a real DB row elsewhere in this schema is).
     * - ui_project_constants: `constants { const NAME = value }` - SML
     *   constants carry no type, unlike variables.
     */
    public function up(): void
    {
        Schema::create('ui_project_events', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->string('event_name', 50);
            $table->longText('code')->nullable();
            $table->timestamps();

            $table->unique(['project_id', 'event_name']);
        });

        Schema::create('ui_project_structs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->string('name', 150);
            $table->json('fields')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['project_id', 'name']);
        });

        Schema::create('ui_project_constants', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->string('name', 150);
            $table->string('value', 500)->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['project_id', 'name']);
        });

        Schema::table('ui_project_events', function (Blueprint $table) {
            $table->foreign(['project_id'])->references(['id'])->on('projects')->onUpdate('no action')->onDelete('cascade');
        });

        Schema::table('ui_project_structs', function (Blueprint $table) {
            $table->foreign(['project_id'])->references(['id'])->on('projects')->onUpdate('no action')->onDelete('cascade');
        });

        Schema::table('ui_project_constants', function (Blueprint $table) {
            $table->foreign(['project_id'])->references(['id'])->on('projects')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ui_project_constants');
        Schema::dropIfExists('ui_project_structs');
        Schema::dropIfExists('ui_project_events');
    }
};
