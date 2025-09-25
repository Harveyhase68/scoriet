<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            // Add new project_id column
            $table->unsignedBigInteger('project_id')->nullable()->after('project_owner_id');

            // Add foreign key constraint
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('set null');
        });

        // Migrate existing data from project_name to project_id
        $teams = DB::table('teams')->get();
        foreach ($teams as $team) {
            if (!empty($team->project_name)) {
                // Map project names to IDs
                $projectId = null;
                switch ($team->project_name) {
                    case 'CRUD Project':
                        $projectId = DB::table('projects')->where('name', 'phpcrud')->value('id');
                        break;
                    case 'rustdemo_copy':
                        $projectId = DB::table('projects')->where('name', 'rustdemo_copy')->value('id');
                        break;
                    default:
                        // Try to find exact match
                        $projectId = DB::table('projects')->where('name', $team->project_name)->value('id');
                        break;
                }

                if ($projectId) {
                    DB::table('teams')->where('id', $team->id)->update(['project_id' => $projectId]);
                }
            }
        }

        // Remove old project_name column
        Schema::table('teams', function (Blueprint $table) {
            $table->dropColumn('project_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            // Add back project_name column
            $table->string('project_name')->nullable()->after('project_owner_id');
        });

        // Migrate data back from project_id to project_name
        $teams = DB::table('teams')->get();
        foreach ($teams as $team) {
            if (!empty($team->project_id)) {
                $projectName = DB::table('projects')->where('id', $team->project_id)->value('name');
                if ($projectName) {
                    // Map back specific cases
                    if ($projectName === 'phpcrud') {
                        $projectName = 'CRUD Project';
                    }
                    DB::table('teams')->where('id', $team->id)->update(['project_name' => $projectName]);
                }
            }
        }

        Schema::table('teams', function (Blueprint $table) {
            // Drop foreign key and project_id column
            $table->dropForeign(['project_id']);
            $table->dropColumn('project_id');
        });
    }
};
