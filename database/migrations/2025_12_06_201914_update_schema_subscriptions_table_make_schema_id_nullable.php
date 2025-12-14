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
        Schema::table('schema_subscriptions', function (Blueprint $table) {
            // Drop the foreign key constraint
            $table->dropForeign(['schema_id']);

            // Make schema_id nullable
            $table->unsignedBigInteger('schema_id')->nullable()->change();

            // Add foreign key with SET NULL on delete
            $table->foreign('schema_id')->references('id')->on('schemas')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schema_subscriptions', function (Blueprint $table) {
            // Drop the foreign key constraint
            $table->dropForeign(['schema_id']);

            // Make schema_id NOT nullable again
            $table->unsignedBigInteger('schema_id')->nullable(false)->change();

            // Add foreign key with CASCADE on delete (original behavior)
            $table->foreign('schema_id')->references('id')->on('schemas')->onDelete('cascade');
        });
    }
};
