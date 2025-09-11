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
            $table->id();
            $table->unsignedBigInteger('schema_id');
            $table->integer('version_number');
            $table->string('table_name');
            $table->decimal('x_position', 8, 2);
            $table->decimal('y_position', 8, 2);
            $table->decimal('width', 8, 2)->nullable();
            $table->decimal('height', 8, 2)->nullable();
            $table->timestamps();

            // Foreign key constraint - references schemas table (which contains FloatingSchema data)
            $table->foreign('schema_id')->references('id')->on('schemas')->onDelete('cascade');
            
            // Unique constraint to prevent duplicates (with shorter name)
            $table->unique(['schema_id', 'version_number', 'table_name'], 'layout_unique');
            
            // Indexes for performance
            $table->index(['schema_id', 'version_number']);
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
