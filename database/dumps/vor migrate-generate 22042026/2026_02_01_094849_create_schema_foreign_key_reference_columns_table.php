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
        Schema::create('schema_foreign_key_reference_columns', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('reference_id');
            $table->unsignedBigInteger('referenced_field_id')->index('schema_foreign_key_reference_columns_referenced_field_id_foreign');
            $table->integer('column_order')->default(0);
            $table->timestamps();

            $table->unique(['reference_id', 'referenced_field_id'], 'fk_ref_col_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schema_foreign_key_reference_columns');
    }
};
