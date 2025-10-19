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
        Schema::create('templates', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name');
            $table->string('full_name', 500)->nullable()->index();
            $table->text('description')->nullable();
            $table->enum('category', ['Web', 'Mobile', 'API', 'Desktop', 'Database', 'E-Commerce', 'CMS', 'Dashboard', 'Fullstack'])->default('Web');
            $table->string('language', 50)->index();
            $table->boolean('is_active')->default(true);
            $table->json('tags')->nullable();
            $table->integer('file_count')->default(0);
            $table->unsignedBigInteger('creator_user_id')->nullable();
            $table->unsignedBigInteger('project_id')->nullable();
            $table->enum('visibility', ['private', 'public'])->default('private');
            $table->boolean('is_system_template')->default(false);
            $table->unsignedBigInteger('original_template_id')->nullable()->index('templates_original_template_id_foreign');
            $table->timestamps();

            $table->index(['category', 'is_active']);
            $table->index(['creator_user_id', 'visibility']);
            $table->index(['is_system_template', 'visibility']);
            $table->index(['project_id', 'visibility']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('templates');
    }
};
