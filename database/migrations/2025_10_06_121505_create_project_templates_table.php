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
        Schema::create('project_templates', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('schema_version_id');
            $table->unsignedBigInteger('template_id')->index('project_templates_template_id_foreign');
            $table->boolean('is_enabled')->default(true)->index();
            $table->json('template_config')->nullable();
            $table->timestamps();

            $table->unique(['schema_version_id', 'template_id'], 'project_template_unique_legacy');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_templates');
    }
};
