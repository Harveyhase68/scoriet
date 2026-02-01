<?php

namespace App\Http\Middleware;

use App\Models\Project;
use App\Models\Team;
use App\Models\TeamMember;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckTeamPermission
{
    /**
     * Handle an incoming request.
     *
     * Check if the user has the required permission for the team/project.
     *
     * Usage in routes:
     *   ->middleware('team.permission:schema.view')
     *   ->middleware('team.permission:template.edit,template.create')  // OR - any permission
     *   ->middleware('team.permission:template.edit&template.create')  // AND - all permissions
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$permissions  Permission(s) to check
     */
    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Try to get team context from various sources
        $team = $this->resolveTeam($request);

        if (!$team) {
            // No team context - allow access (might be a non-team route)
            return $next($request);
        }

        // Owner always has all permissions
        if ($team->project_owner_id === $user->id) {
            return $next($request);
        }

        // Get team member
        $member = TeamMember::where('team_id', $team->id)
            ->where('user_id', $user->id)
            ->first();

        if (!$member) {
            return response()->json(['message' => 'Access denied - not a team member'], 403);
        }

        // If no permissions specified, just check membership
        if (empty($permissions)) {
            return $next($request);
        }

        // Check permissions
        foreach ($permissions as $permissionString) {
            // Check if it's an AND condition (contains &)
            if (str_contains($permissionString, '&')) {
                $andPermissions = explode('&', $permissionString);
                if ($member->hasAllPermissions($andPermissions)) {
                    return $next($request);
                }
            } else {
                // Single permission or OR condition (multiple parameters)
                if ($member->hasPermission($permissionString)) {
                    return $next($request);
                }
            }
        }

        return response()->json([
            'message' => 'Access denied - insufficient permissions',
            'required_permissions' => $permissions,
        ], 403);
    }

    /**
     * Try to resolve the team from the request
     */
    private function resolveTeam(Request $request): ?Team
    {
        // 1. Direct team_id parameter
        $teamId = $request->route('team') ?? $request->route('teamId') ?? $request->input('team_id');
        if ($teamId) {
            return Team::find($teamId);
        }

        // 2. Through project
        $projectId = $request->route('project') ?? $request->route('projectId') ?? $request->input('project_id');
        if ($projectId) {
            $project = Project::find($projectId);
            if ($project && $project->team_id) {
                return Team::find($project->team_id);
            }
            // Project without team - check if user is project owner
            if ($project && $project->user_id === Auth::id()) {
                return null; // Owner of personal project, allow access
            }
        }

        // 3. Through schema
        $schemaId = $request->route('schema') ?? $request->route('schemaId') ?? $request->input('schema_id');
        if ($schemaId) {
            $schema = \App\Models\SchemaTable::find($schemaId);
            if ($schema && $schema->project) {
                if ($schema->project->team_id) {
                    return Team::find($schema->project->team_id);
                }
                // Personal project
                if ($schema->project->user_id === Auth::id()) {
                    return null;
                }
            }
        }

        // 4. Through template
        $templateId = $request->route('template') ?? $request->route('templateId') ?? $request->input('template_id');
        if ($templateId) {
            $template = \App\Models\Template::find($templateId);
            if ($template && $template->project) {
                if ($template->project->team_id) {
                    return Team::find($template->project->team_id);
                }
                // Personal project
                if ($template->project->user_id === Auth::id()) {
                    return null;
                }
            }
        }

        return null;
    }
}
