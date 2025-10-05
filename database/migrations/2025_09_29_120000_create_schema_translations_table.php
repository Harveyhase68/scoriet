<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schema_translations', function (Blueprint $table) {
            $table->id();
            $table->string('item_name', 255); // e.g., 'branches' or 'branches.branch_no'
            $table->string('code', 5); // Language code from languages table
            $table->string('translated_text', 500); // The translated text
            $table->text('description')->nullable(); // Optional description/notes
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            // Composite unique key: item_name + code (one translation per language)
            $table->unique(['item_name', 'code'], 'unique_item_language');

            // Indexes for performance
            $table->index('item_name');
            $table->index('code');
            $table->index('is_active');

            // Foreign key to languages table
            $table->foreign('code')->references('code')->on('languages')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schema_translations');
    }
};