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
        Schema::create('tickets', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id')->index();
            $table->enum('type', ['bug_report', 'support', 'consulting'])->index();
            $table->string('title');
            $table->text('description');
            $table->enum('priority', ['low', 'normal', 'high', 'urgent'])->default('normal')->index();
            $table->enum('status', ['open', 'in_progress', 'waiting_response', 'resolved', 'closed'])->default('open')->index();
            $table->integer('credits_cost')->default(0)->comment('Credits spent on this ticket (0 for bug reports)');
            $table->unsignedBigInteger('assigned_to')->nullable()->index('tickets_assigned_to_foreign')->comment('System admin assigned to');
            $table->timestamp('resolved_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
