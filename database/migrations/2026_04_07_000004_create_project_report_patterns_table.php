<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_report_patterns', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('project_id');
            $table->unsignedBigInteger('report_pattern_id');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            // No FK constraints — we want to actively block deletes (controllers)
            // instead of silently nulling out user choices via ON DELETE SET NULL.
            $table->index(['project_id', 'is_active']);
            $table->index('report_pattern_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_report_patterns');
    }
};
