<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('generation_logs', function (Blueprint $table) {
            $table->bigIncrements('id');

            // Context
            $table->unsignedBigInteger('project_id')->nullable()->index();
            $table->unsignedBigInteger('template_id')->nullable()->index();
            $table->json('schema_ids')->nullable();           // Array of selected FloatingSchema IDs

            // What made up the hash
            $table->unsignedInteger('template_version');
            $table->unsignedInteger('files_version_sum');     // Sum of all template_file.version
            $table->unsignedInteger('schema_version');        // Max version_number of selected schemas
            $table->unsignedBigInteger('hash_timestamp');     // Unix ms timestamp used in hash payload

            // The hash
            $table->char('hash_full', 64)->index();           // Full SHA256
            $table->char('hash_short', 8)->index();           // First 8 chars

            // Exact filename as downloaded by the user
            $table->string('filename', 500);

            $table->timestamps();

            // Soft FK references (no CASCADE — preserve log even if template/project deleted)
            $table->foreign('project_id')->references('id')->on('projects')->nullOnDelete();
            $table->foreign('template_id')->references('id')->on('templates')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('generation_logs');
    }
};
