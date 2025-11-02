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
        Schema::table('templates', function (Blueprint $table) {
            // Review status: draft, pending_review, approved, rejected
            $table->enum('review_status', ['draft', 'pending_review', 'approved', 'rejected'])
                  ->default('draft')
                  ->after('visibility');

            // Review score: sum of all votes (+1 or -1)
            $table->integer('review_score')->default(0)->after('review_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('templates', function (Blueprint $table) {
            $table->dropColumn(['review_status', 'review_score']);
        });
    }
};
