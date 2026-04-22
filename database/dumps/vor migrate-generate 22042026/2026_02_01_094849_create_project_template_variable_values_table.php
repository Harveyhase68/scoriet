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
        Schema::create('project_template_variable_values', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('project_id');
            $table->unsignedBigInteger('template_id')->index('project_template_variable_values_template_id_foreign');
            $table->string('variable_name');
            $table->string('language', 10);
            $table->text('value')->nullable();
            $table->timestamps();

            $table->index(['project_id', 'template_id', 'language'], 'idx_proj_tmpl_lang');
            $table->unique(['project_id', 'template_id', 'variable_name', 'language'], 'uniq_proj_tmpl_var_lang');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_template_variable_values');
    }
};
