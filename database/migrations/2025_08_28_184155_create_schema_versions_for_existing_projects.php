<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Project;
use App\Models\SchemaVersion;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Create SchemaVersions for existing Projects
        $projects = Project::all();
        
        foreach ($projects as $project) {
            // Check if SchemaVersion with this project ID already exists
            $existingSchema = SchemaVersion::find($project->id);
            
            if (!$existingSchema) {
                // Create SchemaVersion with project ID
                SchemaVersion::create([
                    'id' => $project->id,
                    'version_name' => $project->name,
                    'description' => 'Default schema version for project: ' . $project->name,
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove SchemaVersions that match Project IDs
        $projectIds = Project::pluck('id')->toArray();
        SchemaVersion::whereIn('id', $projectIds)->delete();
    }
};
