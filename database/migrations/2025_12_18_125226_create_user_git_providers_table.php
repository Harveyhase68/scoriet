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
        Schema::create('user_git_providers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('provider', ['github', 'gitlab', 'bitbucket'])->default('github');
            $table->string('provider_user_id')->nullable(); // User ID on the provider
            $table->string('username')->nullable(); // Username on the provider
            $table->string('email')->nullable(); // Email on the provider
            $table->string('avatar_url')->nullable();
            $table->text('access_token'); // Encrypted
            $table->text('refresh_token')->nullable(); // Encrypted
            $table->timestamp('token_expires_at')->nullable();
            $table->string('scopes')->nullable(); // Comma-separated scopes
            $table->timestamp('connected_at')->nullable();
            $table->timestamps();

            // One provider connection per user per provider type
            $table->unique(['user_id', 'provider']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_git_providers');
    }
};
