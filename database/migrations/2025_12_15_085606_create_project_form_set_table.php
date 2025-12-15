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
        Schema::create('project_form_set', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->unsignedBigInteger('form_set_id');

            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Foreign Keys
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
            $table->foreign('form_set_id')->references('id')->on('form_sets')->onDelete('cascade');

            // Ein Projekt kann mehrere FormSets haben, aber nur eines aktiv
            $table->unique(['project_id', 'form_set_id']);
            $table->index(['project_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_form_set');
    }
};
