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
        Schema::create('registration_invites', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('email')->index();
            $table->string('token', 64)->unique();
            $table->string('name')->nullable();
            $table->text('note')->nullable();
            $table->unsignedBigInteger('invited_by')->index('registration_invites_invited_by_foreign');
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('used_at')->nullable();
            $table->unsignedBigInteger('used_by_user_id')->nullable()->index('registration_invites_used_by_user_id_foreign');
            $table->timestamp('expires_at');
            $table->timestamps();

            $table->index(['email', 'used_at']);
            $table->index(['token', 'expires_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('registration_invites');
    }
};
