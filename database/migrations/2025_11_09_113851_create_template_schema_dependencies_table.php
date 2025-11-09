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
        Schema::create('template_schema_dependencies', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('template_id');
            $table->unsignedBigInteger('schema_id')->index('template_schema_dependencies_schema_id_foreign');
            $table->boolean('is_required')->default(true);
            $table->string('alias')->nullable();
            $table->timestamps();

            $table->unique(['template_id', 'schema_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('template_schema_dependencies');
    }
};
