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
        Schema::create('template_variables', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('template_id');
            $table->string('variable_name');
            $table->text('description')->nullable();
            $table->text('default_value')->nullable();
            $table->boolean('is_required')->default(false);
            $table->timestamps();

            $table->index(['template_id', 'variable_name']);
            $table->unique(['template_id', 'variable_name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('template_variables');
    }
};
