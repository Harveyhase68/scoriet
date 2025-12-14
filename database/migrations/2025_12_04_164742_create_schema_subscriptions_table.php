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
        Schema::create('schema_subscriptions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('schema_id')->index();
            $table->unsignedBigInteger('user_id')->index()->comment('Owner of the subscription');
            $table->boolean('is_free_tier')->default(false)->comment('Is this the free 1 database?');
            $table->timestamp('expires_at')->nullable()->comment('When subscription expires (null = unlimited for patron monthly)');
            $table->boolean('is_active')->default(true)->index();
            $table->boolean('is_soft_locked')->default(false)->comment('READ-ONLY after expiration');
            $table->timestamps();

            // Foreign keys
            $table->foreign('schema_id')->references('id')->on('schemas')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schema_subscriptions');
    }
};
