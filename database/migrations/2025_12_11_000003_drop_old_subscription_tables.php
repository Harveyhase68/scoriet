<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Drops the old individual subscription tables after data migration
     */
    public function up(): void
    {
        Schema::dropIfExists('project_subscriptions');
        Schema::dropIfExists('schema_subscriptions');
        Schema::dropIfExists('team_subscriptions');
        Schema::dropIfExists('template_subscriptions');
        Schema::dropIfExists('cli_subscriptions');
    }

    /**
     * Reverse the migrations.
     *
     * Recreates the old tables (without data - use backup if needed)
     */
    public function down(): void
    {
        // Recreate project_subscriptions
        Schema::create('project_subscriptions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('project_id')->nullable()->index();
            $table->unsignedBigInteger('user_id')->index();
            $table->boolean('is_free_tier')->default(false);
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->boolean('is_soft_locked')->default(false);
            $table->timestamps();
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('set null');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // Recreate schema_subscriptions
        Schema::create('schema_subscriptions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('schema_id')->nullable()->index();
            $table->unsignedBigInteger('user_id')->index();
            $table->boolean('is_free_tier')->default(false);
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->boolean('is_soft_locked')->default(false);
            $table->timestamps();
            $table->foreign('schema_id')->references('id')->on('schemas')->onDelete('set null');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // Recreate team_subscriptions
        Schema::create('team_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('team_id')->nullable();
            $table->unsignedBigInteger('user_id');
            $table->boolean('is_free_tier')->default(false);
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_soft_locked')->default(false);
            $table->timestamps();
            $table->foreign('team_id')->references('id')->on('teams')->onDelete('set null');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['user_id', 'is_active', 'expires_at']);
        });

        // Recreate template_subscriptions
        Schema::create('template_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('template_id')->nullable();
            $table->unsignedBigInteger('user_id');
            $table->boolean('is_free_tier')->default(false);
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->foreign('template_id')->references('id')->on('templates')->onDelete('set null');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['user_id', 'is_active', 'expires_at']);
        });

        // Recreate cli_subscriptions
        Schema::create('cli_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->enum('type', ['cli', 'service', 'bundle'])->default('bundle');
            $table->boolean('is_active')->default(true);
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['user_id', 'type']);
        });
    }
};
