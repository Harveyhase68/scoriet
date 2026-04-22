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
        Schema::create('code_adjustment_insertions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('code_adjustment_id')->index();
            $table->enum('insertion_type', ['beginning', 'end', 'middle']);
            $table->text('anchor_text');
            $table->mediumText('insertion_content');
            $table->smallInteger('line_offset')->default(0);
            $table->integer('insertion_order')->default(0);
            $table->string('description', 500)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('code_adjustment_insertions');
    }
};
