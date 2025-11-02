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
        Schema::create('project_template_usage', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('project_id');
            $table->unsignedBigInteger('template_id');
            $table->enum('usage_type', ['linked', 'cloned']);
            $table->string('alias')->nullable();
            $table->json('config')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('used_at')->useCurrent();
            $table->timestamps();

            $table->unique(['project_id', 'template_id'], 'project_template_unique');
            $table->index(['project_id', 'usage_type']);
            $table->index(['template_id', 'usage_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_template_usage');
    }
};
