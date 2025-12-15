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
        Schema::create('form_sets', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->unsignedBigInteger('creator_user_id');

            // Sichtbarkeit
            $table->enum('visibility', ['system', 'private', 'public'])->default('private');

            // Cloning
            $table->unsignedBigInteger('cloned_from_id')->nullable();

            // Styling Defaults
            $table->string('default_background_color', 7)->default('#1f2937');
            $table->string('default_window_color', 7)->default('#374151');
            $table->string('default_text_color', 7)->default('#f3f4f6');
            $table->string('default_button_color', 7)->default('#3b82f6');

            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Foreign Keys
            $table->foreign('creator_user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('cloned_from_id')->references('id')->on('form_sets')->onDelete('set null');

            // Indexes
            $table->index(['creator_user_id', 'visibility']);
            $table->index(['visibility', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('form_sets');
    }
};
