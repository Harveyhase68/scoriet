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
        Schema::create('project_attachments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->unsignedBigInteger('uploaded_by');
            $table->string('filename');              // UUID-basierter Dateiname
            $table->string('original_filename');     // Originaler Dateiname
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('size');      // Bytes
            $table->string('path', 500);             // Speicherpfad
            $table->text('description')->nullable(); // Beschreibung
            $table->string('category', 50)->default('other'); // Kategorie
            $table->boolean('is_pinned')->default(false);     // Wichtige Anhänge
            $table->unsignedInteger('download_count')->default(0);
            $table->timestamps();

            // Foreign keys
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
            $table->foreign('uploaded_by')->references('id')->on('users')->onDelete('cascade');

            // Indexes
            $table->index('project_id');
            $table->index('uploaded_by');
            $table->index(['project_id', 'category']);
            $table->index(['project_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_attachments');
    }
};
