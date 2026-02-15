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
            $table->bigIncrements('id');
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->unsignedBigInteger('creator_user_id');
            $table->enum('visibility', ['system', 'private', 'team', 'public'])->default('private');
            $table->unsignedBigInteger('cloned_from_id')->nullable()->index('form_sets_cloned_from_id_foreign');
            $table->string('default_background_color', 7)->default('#1f2937');
            $table->string('default_window_color', 7)->default('#374151');
            $table->string('default_text_color', 7)->default('#f3f4f6');
            $table->string('default_button_color', 7)->default('#3b82f6');
            $table->string('default_button_text_color', 7)->nullable()->default('#ffffff')->comment('Standard Button-Schriftfarbe');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

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
