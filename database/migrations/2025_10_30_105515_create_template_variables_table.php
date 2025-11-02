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
        Schema::create('template_variables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained('templates')->onDelete('cascade');
            $table->string('variable_name'); // e.g. "copyright", "company_name"
            $table->text('description')->nullable(); // User-friendly description
            $table->text('default_value')->nullable(); // Optional default value
            $table->boolean('is_required')->default(false); // Is this variable required?
            $table->timestamps();

            // Index for faster lookups
            $table->index(['template_id', 'variable_name']);

            // Unique constraint: one variable name per template
            $table->unique(['template_id', 'variable_name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('template_variables');
    }
};
