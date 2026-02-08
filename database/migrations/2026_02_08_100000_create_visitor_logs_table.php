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
        Schema::create('visitor_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('ip_address', 45)->comment('IPv4 or IPv6');
            $table->string('session_id', 100)->nullable();
            $table->string('page_url', 500)->nullable();
            $table->string('referrer', 500)->nullable();
            $table->text('user_agent')->nullable();
            $table->boolean('is_authenticated')->default(false);
            $table->date('visited_date')->comment('Date only for fast daily aggregation');
            $table->timestamps();

            // Indexes for fast aggregation queries
            $table->index('visited_date');
            $table->index(['visited_date', 'is_authenticated']);
            $table->index(['ip_address', 'visited_date']);
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('visitor_logs');
    }
};
