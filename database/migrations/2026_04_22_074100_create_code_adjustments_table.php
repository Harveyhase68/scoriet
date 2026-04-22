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
        Schema::create('code_adjustments', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('project_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('file_pattern', 500);
            $table->decimal('min_confidence', 3)->default(0.8);
            $table->boolean('is_active')->default(true);
            $table->integer('execution_order')->default(0);
            $table->unsignedBigInteger('created_by_user_id')->index('code_adjustments_created_by_user_id_foreign');
            $table->timestamps();

            $table->index(['project_id', 'file_pattern']);
            $table->index(['project_id', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('code_adjustments');
    }
};
