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
            $table->string('compatibility_tag', 500)->nullable()->index();
            $table->integer('generation_order')->default(0);
            $table->unsignedInteger('version')->default(1);
            $table->text('description')->nullable();
            $table->string('category', 100)->nullable()->default('Web');
            $table->string('language', 50)->index();
            $table->boolean('is_active')->default(true);
            $table->json('tags')->nullable();
            $table->integer('file_count')->default(0);
            $table->unsignedBigInteger('creator_user_id')->nullable();
            $table->unsignedBigInteger('project_id')->nullable();
            $table->enum('visibility', ['private', 'public', 'store'])->nullable()->default('private');
            $table->boolean('visibility_locked')->default(false);
            $table->enum('price_type', ['credits', 'euros'])->nullable();
            $table->integer('price_credits')->nullable();
            $table->decimal('price_euros')->nullable();
            $table->boolean('is_store_approved')->default(false);
            $table->boolean('fingerprints_generated')->default(false);
            $table->timestamp('fingerprints_generated_at')->nullable();
            $table->unsignedBigInteger('sales_count')->default(0);
            $table->decimal('total_revenue', 12)->default(0);
            $table->enum('review_status', ['draft', 'pending_review', 'approved', 'rejected'])->default('draft');
            $table->integer('review_score')->default(0);
            $table->boolean('is_system_template')->default(false);
            $table->unsignedBigInteger('original_template_id')->nullable()->index('templates_original_template_id_foreign');
            $table->unsignedBigInteger('cloned_from_template_id')->nullable()->index('templates_cloned_from_template_id_foreign');
            $table->boolean('is_from_store')->default(false);
            $table->boolean('resale_allowed')->default(false);
            $table->enum('template_type', ['original', 'cloned', 'linked'])->default('original')->index()->comment('Template type: original/cloned/linked');
            $table->json('history')->nullable()->comment('Template fork and contribution history');
            $table->json('community_rating')->nullable()->comment('Community reviews and ratings');
            $table->timestamps();
            $table->json('protected_files')->nullable()->comment('Array of filenames that should not be overwritten on update');
            $table->json('install_script')->nullable()->comment('Step-by-step install instructions');
            $table->json('update_script')->nullable()->comment('Step-by-step update instructions');

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
