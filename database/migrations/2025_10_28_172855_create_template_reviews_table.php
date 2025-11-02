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
        Schema::create('template_reviews', function (Blueprint $table) {
            $table->id();

            // Foreign keys
            $table->unsignedBigInteger('template_id');
            $table->unsignedBigInteger('reviewer_user_id');

            // Vote: +1 (approve) or -1 (reject)
            $table->tinyInteger('vote')->comment('+1 for approve, -1 for reject');

            // Optional comment explaining the vote
            $table->text('comment')->nullable();

            $table->timestamps();

            // Foreign key constraints
            $table->foreign('template_id')
                  ->references('id')
                  ->on('templates')
                  ->onDelete('cascade');

            $table->foreign('reviewer_user_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('cascade');

            // Unique constraint: each user can only review a template once
            $table->unique(['template_id', 'reviewer_user_id'], 'unique_template_reviewer');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('template_reviews');
    }
};
