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
        Schema::create('project_generations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->foreignId('schema_version_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            // Generation numbering (per project)
            $table->unsignedInteger('generation_number')->default(1);

            // File info
            $table->string('filename', 255);
            $table->string('file_path', 500);
            $table->string('archive_type', 20)->default('zip'); // zip, tar.gz, tar.xz
            $table->unsignedBigInteger('file_size')->default(0); // bytes

            // Generation metadata
            $table->json('languages')->nullable(); // ['de', 'en', 'fr']
            $table->json('tables')->nullable(); // ['users', 'products', ...]
            $table->unsignedInteger('tables_count')->default(0);
            $table->unsignedInteger('files_count')->default(0);

            // Template info
            $table->foreignId('template_id')->nullable()->constrained()->nullOnDelete();
            $table->string('template_name', 255)->nullable();

            // Status
            $table->enum('status', ['completed', 'failed', 'partial'])->default('completed');
            $table->text('notes')->nullable();

            $table->timestamps();

            // Indexes
            $table->index(['project_id', 'generation_number']);
            $table->index(['project_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_generations');
    }
};
