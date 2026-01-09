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
            $table->enum('type', ['purchase', 'generation', 'project_renewal', 'db_renewal', 'teams_unlock', 'templates_unlock', 'cli_unlock', 'cli_extend', 'bundle_refund', 'ticket', 'initial_credits', 'admin_adjustment', 'patron_subscription', 'template_purchase', 'template_sale'])->nullable()->index();
            $table->string('description', 500)->nullable();
            $table->string('reference_type', 100)->nullable()->comment('Model type: Project, Schema, Ticket, etc.');
            $table->string('reference_id')->nullable();
            $table->decimal('price_paid', 10)->nullable()->comment('Euro amount paid (for purchases)');
            $table->timestamps();
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
