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
        Schema::create('project_template_variable_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->foreignId('template_id')->constrained('templates')->onDelete('cascade');
            $table->string('variable_name'); // e.g. "copyright"
            $table->string('language', 10); // e.g. "de", "en", "fr"
            $table->text('value')->nullable(); // The actual value (e.g. "© 2025 Alexander Predl, Österreich")
            $table->timestamps();

            // Index for faster lookups (custom short name to avoid 64-char limit)
            $table->index(['project_id', 'template_id', 'language'], 'idx_proj_tmpl_lang');

            // Unique constraint: one value per project+template+variable+language
            $table->unique(['project_id', 'template_id', 'variable_name', 'language'], 'uniq_proj_tmpl_var_lang');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_template_variable_values');
    }
};
