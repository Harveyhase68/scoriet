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
        Schema::table('template_reviews', function (Blueprint $table) {
            $table->foreign(['reviewer_user_id'])->references(['id'])->on('users')->onUpdate('no action')->onDelete('cascade');
            $table->foreign(['template_id'])->references(['id'])->on('templates')->onUpdate('no action')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('template_reviews', function (Blueprint $table) {
            $table->dropForeign('template_reviews_reviewer_user_id_foreign');
            $table->dropForeign('template_reviews_template_id_foreign');
        });
    }
};
