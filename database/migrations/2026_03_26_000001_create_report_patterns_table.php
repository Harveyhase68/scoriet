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
        Schema::create('report_patterns', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->unsignedBigInteger('creator_user_id');
            $table->enum('visibility', ['system', 'private', 'team', 'public'])->default('private');
            $table->unsignedBigInteger('cloned_from_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('creator_user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('cloned_from_id')->references('id')->on('report_patterns')->onDelete('set null');

            $table->index(['creator_user_id', 'visibility']);
            $table->index(['visibility', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_patterns');
    }
};
