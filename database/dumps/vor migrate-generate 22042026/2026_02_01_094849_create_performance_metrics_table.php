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
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id')->nullable()->index('idx_user_id');
            $table->string('operation', 100)->index('idx_operation');
            $table->string('operation_detail')->nullable();
            $table->unsignedInteger('duration_ms');
            $table->unsignedInteger('memory_peak_mb')->nullable();
            $table->unsignedInteger('tables_count')->nullable();
            $table->unsignedInteger('fields_count')->nullable();
            $table->boolean('from_cache')->default(false);
            $table->string('subscription_type', 50)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->nullable()->index('idx_created_at');

            $table->index(['created_at', 'operation'], 'idx_created_operation');
            $table->index(['operation', 'created_at'], 'idx_operation_created');
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
