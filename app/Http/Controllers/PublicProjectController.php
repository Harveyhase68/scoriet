<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PublicProjectController extends Controller
{
    /**
     * Show a public project overview page
     * No authentication required
     */
    public function show(string $username, string $projectname)
    {
        // Find user by username
        $user = User::where('username', $username)->first();

        if (!$user) {
            abort(404, 'User not found');
        }

        // Find project by name and owner
        $project = Project::where('owner_id', $user->id)
            ->where('name', $projectname)
            ->where('is_public', true)
            ->where('is_active', true)
            ->first();

        if (!$project) {
            abort(404, 'Project not found or is not public');
        }

        // Load related data (without sensitive information)
        $project->load(['owner:id,name,username']);

        // Get project statistics
        $stats = [
            'teams_count' => $project->teams()->count(),
            'templates_count' => $project->templates()->count(),
            'schemas_count' => $project->floatingSchemas()->count(),
        ];

        // Get team names (public info)
        $teams = $project->teams()
            ->select('teams.id', 'teams.name', 'teams.description')
            ->get();

        // Get template names (public info, only public/system templates)
        $templates = $project->templates()
            ->where(function ($query) {
                $query->where('templates.visibility', 'public')
                    ->orWhere('templates.is_system_template', true);
            })
            ->select('templates.id', 'templates.name', 'templates.description', 'templates.is_system_template')
            ->get();

        // Get schema names (public info, only public schemas)
        $schemas = $project->floatingSchemas()
            ->where('schemas.visibility', 'public')
            ->select('schemas.id', 'schemas.name', 'schemas.description')
            ->get();

        // Get attachments (public listing without download - only metadata)
        $attachments = $project->attachments()
            ->select('id', 'original_filename', 'mime_type', 'category', 'size', 'is_pinned')
            ->get()
            ->map(function ($attachment) {
                return [
                    'id' => $attachment->id,
                    'original_filename' => $attachment->original_filename,
                    'mime_type' => $attachment->mime_type,
                    'category_label' => $attachment->getCategoryLabel(),
                    'formatted_size' => $attachment->getFormattedSize(),
                    'is_pinned' => $attachment->is_pinned,
                ];
            });

        // Prepare public project data (exclude sensitive fields)
        $publicProjectData = [
            'id' => $project->id,
            'name' => $project->name,
            'description' => $project->description,
            'owner' => [
                'name' => $project->owner->name,
                'username' => $project->owner->username,
            ],
            'created_at' => $project->created_at,
            'updated_at' => $project->updated_at,
            // Public settings
            'default_language' => $project->default_language,
            'enabled_languages' => $project->enabled_languages,
            // Localization settings (public)
            'decimal_separator' => $project->decimal_separator,
            'thousands_separator' => $project->thousands_separator,
            'date_format' => $project->date_format,
            'time_format' => $project->time_format,
            'currency_symbol' => $project->currency_symbol,
            'timezone' => $project->timezone,
            // Project URL (if set and public)
            'project_url' => $project->project_url,
            // Statistics
            'stats' => $stats,
            // Related entities
            'teams' => $teams,
            'templates' => $templates,
            'schemas' => $schemas,
            'attachments' => $attachments,
        ];

        return Inertia::render('PublicProjectPage', [
            'project' => $publicProjectData,
            'username' => $username,
            'projectname' => $projectname,
        ]);
    }

    /**
     * API endpoint to get public project data (JSON)
     */
    public function getData(string $username, string $projectname)
    {
        // Find user by username
        $user = User::where('username', $username)->first();

        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        // Find project by name and owner
        $project = Project::where('owner_id', $user->id)
            ->where('name', $projectname)
            ->where('is_public', true)
            ->where('is_active', true)
            ->first();

        if (!$project) {
            return response()->json(['error' => 'Project not found or is not public'], 404);
        }

        // Return basic public data
        return response()->json([
            'name' => $project->name,
            'description' => $project->description,
            'owner' => [
                'name' => $project->owner->name,
                'username' => $project->owner->username,
            ],
            'created_at' => $project->created_at,
        ]);
    }
}
