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
        Schema::create('schema_constraint_columns', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('constraint_id');
            $table->unsignedBigInteger('field_id')->index('schema_constraint_columns_field_id_foreign');
            $table->integer('column_order')->default(0);
            $table->timestamps();

            $table->unique(['constraint_id', 'field_id'], 'constraint_field_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schema_constraint_columns');
    }
};
