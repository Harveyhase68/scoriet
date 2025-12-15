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
        Schema::create('user_form_designer_access', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');

            $table->enum('access_type', ['credits', 'patron']);
            $table->integer('credits_paid')->default(0);  // 50 Credits für Freischaltung
            $table->string('patron_level', 50)->nullable();  // 'monthly' = kostenlos

            $table->timestamp('granted_at')->nullable();
            $table->timestamp('expires_at')->nullable();  // NULL = permanent

            $table->timestamps();

            // Foreign Keys
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');

            // Ein User = ein Eintrag
            $table->unique('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_form_designer_access');
    }
};
