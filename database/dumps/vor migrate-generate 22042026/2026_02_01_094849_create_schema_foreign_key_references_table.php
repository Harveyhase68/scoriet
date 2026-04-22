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
        Schema::create('schema_foreign_key_references', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('constraint_id')->unique('fk_ref_constraint_unique');
            $table->unsignedBigInteger('referenced_table_id')->index('schema_foreign_key_references_referenced_table_id_foreign');
            $table->string('on_delete', 50)->nullable()->default('NO ACTION');
            $table->string('on_update', 50)->nullable()->default('NO ACTION');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schema_foreign_key_references');
    }
};
