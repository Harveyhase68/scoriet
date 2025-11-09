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
        Schema::create('schema_constraints', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('table_id')->index('schema_constraints_table_id_foreign');
            $table->string('constraint_name')->nullable()->index();
            $table->enum('constraint_type', ['PRIMARY KEY', 'UNIQUE', 'KEY', 'FOREIGN KEY', 'INDEX'])->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schema_constraints');
    }
};
