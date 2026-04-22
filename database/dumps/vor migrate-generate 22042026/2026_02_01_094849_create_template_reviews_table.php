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
            $table->bigIncrements('id');
            $table->unsignedBigInteger('template_id');
            $table->unsignedBigInteger('reviewer_user_id')->index('template_reviews_reviewer_user_id_foreign');
            $table->tinyInteger('vote')->comment('+1 for approve, -1 for reject');
            $table->text('comment')->nullable();
            $table->timestamps();

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
