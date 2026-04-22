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
        Schema::create('schemas', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->unsignedBigInteger('owner_id');
            $table->enum('visibility', ['private', 'public', 'deleted'])->default('private');
            $table->boolean('is_system_schema')->default(false)->index('schemas_is_template_schema_index');
            $table->integer('last_version')->default(0);
            $table->timestamps();

            $table->unique(['owner_id', 'name'], 'owner_schema_name_unique');
            $table->index(['owner_id', 'visibility']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schemas');
    }
};
