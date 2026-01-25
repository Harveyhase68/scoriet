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
        Schema::create('performance_metrics', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->string('operation', 100)->index();
            $table->string('operation_detail', 255)->nullable();
            $table->unsignedInteger('duration_ms');
            $table->unsignedInteger('memory_peak_mb')->nullable();
            $table->unsignedInteger('tables_count')->nullable();
            $table->unsignedInteger('fields_count')->nullable();
            $table->boolean('from_cache')->default(false);
            $table->string('subscription_type', 50)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->index();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->index(['operation', 'created_at']);
            $table->index(['created_at', 'operation']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('performance_metrics');
    }
};
