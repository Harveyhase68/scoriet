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
        Schema::create('credit_transactions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id')->index();
            $table->integer('amount')->comment('Positive = purchased/added, Negative = spent');
            $table->enum('type', [
                'purchase',           // Credit purchase from store
                'generation',         // Code generation
                'project_renewal',    // Additional project subscription
                'db_renewal',         // Additional database subscription
                'teams_unlock',       // Teams feature unlock
                'cli_unlock',         // CLI+Service unlock
                'ticket',             // Support ticket
                'initial_credits',    // Initial 50 credits for new users
                'admin_adjustment'    // Manual admin adjustment
            ])->index();
            $table->string('description', 500)->nullable();
            $table->string('reference_type', 100)->nullable()->comment('Model type: Project, Schema, Ticket, etc.');
            $table->unsignedBigInteger('reference_id')->nullable()->comment('ID of related model');
            $table->decimal('price_paid', 10, 2)->nullable()->comment('Euro amount paid (for purchases)');
            $table->timestamps();

            // Foreign key
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('credit_transactions');
    }
};
