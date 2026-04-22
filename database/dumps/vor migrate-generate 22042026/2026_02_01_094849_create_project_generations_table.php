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
            $table->bigIncrements('id');
            $table->unsignedBigInteger('project_id');
            $table->unsignedBigInteger('schema_version_id')->nullable()->index('project_generations_schema_version_id_foreign');
            $table->unsignedBigInteger('user_id')->nullable()->index('project_generations_user_id_foreign');
            $table->unsignedInteger('generation_number')->default(1);
            $table->string('filename');
            $table->string('file_path', 500);
            $table->string('archive_type', 20)->default('zip');
            $table->unsignedBigInteger('file_size')->default(0);
            $table->json('languages')->nullable();
            $table->json('tables')->nullable();
            $table->unsignedInteger('tables_count')->default(0);
            $table->unsignedInteger('files_count')->default(0);
            $table->unsignedBigInteger('template_id')->nullable()->index('project_generations_template_id_foreign');
            $table->string('template_name')->nullable();
            $table->enum('status', ['completed', 'failed', 'partial'])->default('completed');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['project_id', 'created_at']);
            $table->index(['project_id', 'generation_number']);
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
