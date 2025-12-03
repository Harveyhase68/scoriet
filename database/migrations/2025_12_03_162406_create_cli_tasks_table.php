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
        Schema::create('cli_tasks', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('task_type', 50)->index();
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->integer('priority')->default(0);
            $table->unsignedBigInteger('user_id')->index();
            $table->unsignedBigInteger('project_id')->nullable()->index();
            $table->json('payload')->nullable();
            $table->json('result')->nullable();
            $table->text('logs')->nullable()->comment('Live execution logs');
            $table->text('error_message')->nullable();
            $table->integer('retry_count')->default(0);
            $table->integer('max_retries')->default(3);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'priority', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cli_tasks');
    }
};
