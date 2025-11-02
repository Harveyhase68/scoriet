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
        Schema::create('project_teams', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('project_id');
            $table->unsignedBigInteger('team_id');
            $table->timestamp('assigned_at')->useCurrent();
            $table->unsignedBigInteger('assigned_by');
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
            $table->foreign('team_id')->references('id')->on('teams')->onDelete('cascade');
            $table->foreign('assigned_by')->references('id')->on('users')->onDelete('restrict');
            
            // Unique constraint to prevent duplicate assignments
            $table->unique(['project_id', 'team_id'], 'project_teams_unique_assignment');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_teams');
    }
};
