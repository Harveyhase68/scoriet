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
        // Add all existing project owners to project_members table if they're not already there
        $projects = \App\Models\Project::whereDoesntHave('members', function($query) {
            $query->whereColumn('user_id', 'projects.owner_id');
        })->get();

        foreach ($projects as $project) {
            \App\Models\ProjectMember::create([
                'project_id' => $project->id,
                'user_id' => $project->owner_id,
                'role' => 'owner',
                'joined_at' => $project->created_at,
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove owner entries that were added in up()
        \App\Models\ProjectMember::whereHas('project', function($query) {
            $query->whereColumn('project_members.user_id', 'projects.owner_id');
        })->where('role', 'owner')->delete();
    }
};
