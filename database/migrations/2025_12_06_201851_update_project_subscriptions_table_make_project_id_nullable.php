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
        Schema::table('project_subscriptions', function (Blueprint $table) {
            // Drop the foreign key constraint
            $table->dropForeign(['project_id']);

            // Make project_id nullable
            $table->unsignedBigInteger('project_id')->nullable()->change();

            // Add foreign key with SET NULL on delete
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_subscriptions', function (Blueprint $table) {
            // Drop the foreign key constraint
            $table->dropForeign(['project_id']);

            // Make project_id NOT nullable again
            $table->unsignedBigInteger('project_id')->nullable(false)->change();

            // Add foreign key with CASCADE on delete (original behavior)
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
        });
    }
};
