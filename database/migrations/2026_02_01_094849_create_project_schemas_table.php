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
        Schema::create('project_schemas', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('project_id');
            $table->unsignedBigInteger('schema_id')->index('project_schemas_schema_id_foreign');
            $table->enum('association_type', ['linked', 'cloned', 'imported'])->default('linked')->index();
            $table->string('alias')->nullable();
            $table->timestamps();

            $table->unique(['project_id', 'schema_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_schemas');
    }
};
