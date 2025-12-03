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
        Schema::create('users', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->boolean('is_inner_core')->default(false);
            $table->string('password');
            $table->string('username')->nullable()->unique();
            $table->enum('user_type', ['free', 'premium', 'admin', 'system'])->default('free');
            $table->string('language', 5)->default('en');
            $table->timestamp('premium_expires_at')->nullable();
            $table->unsignedBigInteger('pending_project_invitation_id')->nullable()->index('users_pending_project_invitation_id_foreign');
            $table->rememberToken();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
