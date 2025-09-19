<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Template;
use App\Models\Project;
use App\Models\ProjectTemplateUsage;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class TemplateController extends Controller
{
    /**
     * Get available templates for a project (system + accessible)
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $projectId = $request->get('project_id');

        $templates = Template::accessibleByUser($user->id, $projectId)
            ->with(['creator', 'project'])
            ->orderBy('is_system_template', 'desc') // System templates first
            ->orderBy('full_name')
            ->get();

        // Add usage information if project context is provided
        if ($projectId) {
            $project = Project::find($projectId);
            if (!$project || !$project->userCanAccess($user)) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $templates->map(function ($template) use ($project) {
                $usage = $project->getTemplateUsage($template);
                $template->current_usage = $usage;
                $template->is_used_by_project = $usage !== null;
                $template->can_edit = $template->canBeEditedBy($project->owner);
                $template->can_clone = $template->canBeClonedBy($project->owner);
                $template->can_use = $template->canBeUsedBy($project->owner);
                return $template;
            });
        }

        return response()->json([
            'templates' => $templates,
            'system_templates' => $templates->where('is_system_template', true)->values(),
            'project_templates' => $templates->where('is_system_template', false)->values(),
        ]);
    }

    /**
     * Link a template to a project (USE button)
     */
    public function linkToProject(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'template_id' => 'required|exists:templates,id',
            'project_id' => 'required|exists:projects,id',
            'alias' => 'nullable|string|max:255',
            'config' => 'nullable|array',
        ]);

        $template = Template::findOrFail($validated['template_id']);
        $project = Project::findOrFail($validated['project_id']);

        // Check permissions
        if (!$project->userCanAccess($user)) {
            return response()->json(['message' => 'Unauthorized to access this project'], 403);
        }

        if (!$template->canBeUsedBy($user)) {
            return response()->json(['message' => 'Cannot use this template'], 403);
        }

        // Check if already using this template
        if ($project->isUsingTemplate($template)) {
            return response()->json(['message' => 'Template is already used by this project'], 400);
        }

        // Link the template
        $usage = $project->linkTemplate($template, $validated['alias'] ?? null, $validated['config'] ?? null);

        return response()->json([
            'message' => 'Template linked successfully',
            'usage' => $usage->load('template'),
        ]);
    }

    /**
     * Clone a template for a project (CLONE button)
     */
    public function cloneToProject(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'template_id' => 'required|exists:templates,id',
            'project_id' => 'required|exists:projects,id',
            'new_name' => [
                'nullable',
                'string',
                'max:255',
                function ($attribute, $value, $fail) {
                    if ($value && !\App\Models\Template::validateTemplateName($value)) {
                        $fail('Template name must be lowercase letters, numbers, and max one underscore.');
                    }
                },
            ],
            'visibility' => 'in:public,private',
        ]);

        $template = Template::findOrFail($validated['template_id']);
        $project = Project::findOrFail($validated['project_id']);

        // Check permissions
        if (!$project->userCanAccess($user)) {
            return response()->json(['message' => 'Unauthorized to access this project'], 403);
        }

        if (!$template->canBeClonedBy($user)) {
            return response()->json(['message' => 'Cannot clone this template'], 403);
        }

        // Clone the template
        $result = $project->cloneTemplate(
            $template,
            $validated['new_name'] ?? null,
            $validated['visibility'] ?? 'public'
        );

        return response()->json([
            'message' => 'Template cloned successfully',
            'template' => $result['template'],
            'usage' => $result['usage'],
        ]);
    }

    /**
     * Get project template usages
     */
    public function projectUsages(Project $project): JsonResponse
    {
        $user = Auth::user();

        if (!$project->userCanAccess($user)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $usages = $project->usedTemplates()->get();

        return response()->json([
            'usages' => $usages,
            'linked_count' => $usages->where('usage_type', 'linked')->count(),
            'cloned_count' => $usages->where('usage_type', 'cloned')->count(),
        ]);
    }

    /**
     * Remove template usage from project
     */
    public function removeUsage(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'usage_id' => 'required|exists:project_template_usage,id',
        ]);

        $usage = ProjectTemplateUsage::findOrFail($validated['usage_id']);

        if (!$usage->project->userCanAccess($user)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $usage->update(['is_active' => false]);

        return response()->json(['message' => 'Template usage removed successfully']);
    }
}
