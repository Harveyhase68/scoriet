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
        // Drop the empty floating_schemas table - we use the existing schemas table instead
        Schema::dropIfExists('floating_schemas');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate the floating_schemas table (though it's not needed)
        Schema::create('floating_schemas', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
        });
    }
};
