<?php

namespace App\Http\Controllers\Traits;

use App\Models\FloatingSchema;
use App\Models\Project;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\Template;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

/**
 * Trait for checking team permissions in controllers
 *
 * Use this trait in controllers that need to check team permissions
 * for project-related resources.
 */
trait ChecksTeamPermissions
{
    /**
     * Get the team context for a project
     */
    protected function getTeamForProject(Project $project): ?Team
    {
        if ($project->team_id) {
            return Team::find($project->team_id);
        }
        return null;
    }

    /**
     * Get the team context for a schema
     */
    protected function getTeamForSchema(FloatingSchema $schema): ?Team
    {
        // Check if schema is linked to any project with a team
        $project = $schema->projects()->whereNotNull('team_id')->first();
        if ($project) {
            return Team::find($project->team_id);
        }
        return null;
    }

    /**
     * Get the team context for a template
     */
    protected function getTeamForTemplate(Template $template): ?Team
    {
        if ($template->project && $template->project->team_id) {
            return Team::find($template->project->team_id);
        }
        return null;
    }

    /**
     * Check if the current user has permission for a project
     *
     * @param Project $project
     * @param string $permission Permission name (e.g., 'schema.edit', 'template.view')
     * @return bool
     */
    protected function hasProjectPermission(Project $project, string $permission): bool
    {
        $user = Auth::user();

        // Project owner always has permission
        if ($project->user_id === $user->id) {
            return true;
        }

        // Get team context
        $team = $this->getTeamForProject($project);
        if (!$team) {
            // No team = personal project, only owner has access
            return false;
        }

        // Team owner always has permission
        if ($team->project_owner_id === $user->id) {
            return true;
        }

        // Check team member permissions
        $member = TeamMember::where('team_id', $team->id)
            ->where('user_id', $user->id)
            ->first();

        if (!$member) {
            return false;
        }

        return $member->hasPermission($permission);
    }

    /**
     * Check if user can access a project (view)
     */
    protected function canAccessProject(Project $project): bool
    {
        return $this->hasProjectPermission($project, 'project.view');
    }

    /**
     * Check if user can edit a project
     */
    protected function canEditProject(Project $project): bool
    {
        return $this->hasProjectPermission($project, 'project.edit');
    }

    /**
     * Check if user can delete a project
     */
    protected function canDeleteProject(Project $project): bool
    {
        return $this->hasProjectPermission($project, 'project.delete');
    }

    /**
     * Check if user can view schemas in a project
     */
    protected function canViewSchema(Project $project): bool
    {
        return $this->hasProjectPermission($project, 'schema.view');
    }

    /**
     * Check if user can edit schemas in a project
     */
    protected function canEditSchema(Project $project): bool
    {
        return $this->hasProjectPermission($project, 'schema.edit');
    }

    /**
     * Check if user can view templates in a project
     */
    protected function canViewTemplate(Project $project): bool
    {
        return $this->hasProjectPermission($project, 'template.view');
    }

    /**
     * Check if user can edit templates in a project
     */
    protected function canEditTemplate(Project $project): bool
    {
        return $this->hasProjectPermission($project, 'template.edit');
    }

    /**
     * Check if user can generate code in a project
     */
    protected function canGenerateCode(Project $project): bool
    {
        return $this->hasProjectPermission($project, 'generation.run');
    }

    /**
     * Check if user can deploy code from a project
     */
    protected function canDeployCode(Project $project): bool
    {
        return $this->hasProjectPermission($project, 'generation.deploy');
    }

    /**
     * Check if user can manage forms in a project
     */
    protected function canManageForms(Project $project): bool
    {
        return $this->hasProjectPermission($project, 'forms.manage');
    }

    /**
     * Check if user can use kanban in a project
     */
    protected function canUseKanban(Project $project): bool
    {
        return $this->hasProjectPermission($project, 'kanban.use');
    }

    /**
     * Check if user can send messages in a project
     */
    protected function canSendMessages(Project $project): bool
    {
        return $this->hasProjectPermission($project, 'messaging.send');
    }

    /**
     * Return a 403 forbidden response
     */
    protected function forbiddenResponse(string $message = 'Access denied - insufficient permissions'): JsonResponse
    {
        return response()->json(['message' => $message], 403);
    }

    /**
     * Check permission and return forbidden response if not allowed
     *
     * Usage:
     *   if ($response = $this->checkPermission($project, 'schema.edit')) {
     *       return $response;
     *   }
     *
     * @return JsonResponse|null Returns JsonResponse if forbidden, null if allowed
     */
    protected function checkPermission(Project $project, string $permission): ?JsonResponse
    {
        if (!$this->hasProjectPermission($project, $permission)) {
            return $this->forbiddenResponse();
        }
        return null;
    }

    /**
     * Check if user is a member of any team that has access to the project
     */
    protected function isTeamMember(Project $project): bool
    {
        $user = Auth::user();

        // Project owner always has access
        if ($project->user_id === $user->id) {
            return true;
        }

        // Check team membership
        $team = $this->getTeamForProject($project);
        if ($team) {
            if ($team->project_owner_id === $user->id) {
                return true;
            }
            return TeamMember::where('team_id', $team->id)
                ->where('user_id', $user->id)
                ->exists();
        }

        return false;
    }
}
