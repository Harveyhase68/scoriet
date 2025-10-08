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
        Schema::create('schema_designer_layouts', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('schema_id');
            $table->integer('version_number');
            $table->json('layout_data');
            $table->timestamps();

            $table->unique(['schema_id', 'version_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schema_designer_layouts');
    }
};
