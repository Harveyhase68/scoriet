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
        Schema::create('kanban_labels', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('board_id')->index();
            $table->string('name', 50);
            $table->string('color', 7)->default('#6b7280');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kanban_labels');
    }
};
