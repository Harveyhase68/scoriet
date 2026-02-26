<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProjectTemplateVariableValue;
use App\Models\Project;
use App\Models\Template;
use App\Models\TemplateVariable;
use App\Services\TemplateCacheService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * Project Template Variable Values Controller
 *
 * Manages values for template variables per project
 * (Project-User functionality)
 */
class ProjectTemplateVariableValueController extends Controller
{
    /**
     * Get all variable values for a project + template combination
     */
    public function index(int $projectId, int $templateId): JsonResponse
    {
        $project = Project::findOrFail($projectId);

        // Check permission
        if (!$project->userCanAccess(auth()->user())) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $template = Template::findOrFail($templateId);

        // Get all defined variables for this template
        $definedVariables = $template->variables()->get();

        // Get all filled values for this project+template
        $values = ProjectTemplateVariableValue::where('project_id', $projectId)
            ->where('template_id', $templateId)
            ->get()
            ->groupBy('variable_name');

        // Build response with all variables and their values per language
        $result = $definedVariables->map(function($variable) use ($values) {
            return [
                'variable_name' => $variable->variable_name,
                'description' => $variable->description,
                'default_value' => $variable->default_value,
                'is_required' => $variable->is_required,
                'values' => $values->get($variable->variable_name, collect())->keyBy('language'),
            ];
        });

        return response()->json([
            'project_id' => $projectId,
            'template_id' => $templateId,
            'variables' => $result,
        ]);
    }

    /**
     * Set/Update a variable value for a specific language
     */
    public function store(Request $request, int $projectId, int $templateId): JsonResponse
    {
        $project = Project::findOrFail($projectId);

        // Check permission
        if (!$project->userCanAccess(auth()->user())) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $template = Template::findOrFail($templateId);

        $validated = $request->validate([
            'variable_name' => 'required|string|max:255',
            'language' => 'required|string|max:10',
            'value' => 'nullable|string',
        ]);

        // Check if variable is defined in template
        $variableExists = TemplateVariable::where('template_id', $templateId)
            ->where('variable_name', $validated['variable_name'])
            ->exists();

        if (!$variableExists) {
            return response()->json([
                'error' => 'Variable not defined in template'
            ], 422);
        }

        // Upsert (update or create)
        $value = ProjectTemplateVariableValue::updateOrCreate(
            [
                'project_id' => $projectId,
                'template_id' => $templateId,
                'variable_name' => $validated['variable_name'],
                'language' => $validated['language'],
            ],
            [
                'value' => $validated['value'],
            ]
        );

        return response()->json($value);
    }

    /**
     * Bulk update multiple variable values
     */
    public function bulkUpdate(Request $request, int $projectId, int $templateId): JsonResponse
    {
        $project = Project::findOrFail($projectId);

        // Check permission
        if (!$project->userCanAccess(auth()->user())) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $template = Template::findOrFail($templateId);

        $validated = $request->validate([
            'values' => 'required|array',
            'values.*.variable_name' => 'required|string|max:255',
            'values.*.language' => 'required|string|max:10',
            'values.*.value' => 'nullable|string',
        ]);

        // 🗑️ DELETE all existing values for this project+template first
        // This ensures that if a user deletes/clears a value, it's removed from DB
        $deletedCount = ProjectTemplateVariableValue::where('project_id', $projectId)
            ->where('template_id', $templateId)
            ->delete();

        $updated = [];

        // 💾 INSERT only the new values (frontend only sends non-empty values)
        foreach ($validated['values'] as $item) {
            // Check if variable is defined in template
            $variableExists = TemplateVariable::where('template_id', $templateId)
                ->where('variable_name', $item['variable_name'])
                ->exists();

            if (!$variableExists) {
                continue; // Skip undefined variables
            }

            // Only save if value is not empty (extra safety check)
            if (!empty(trim($item['value']))) {
                $value = ProjectTemplateVariableValue::create([
                    'project_id' => $projectId,
                    'template_id' => $templateId,
                    'variable_name' => $item['variable_name'],
                    'language' => $item['language'],
                    'value' => trim($item['value']),
                ]);

                $updated[] = $value;
            }
        }

        // Invalidate GTree + compiled template cache (variable values are embedded in GTree)
        try {
            $cacheService = app(TemplateCacheService::class);
            $cacheService->invalidateGtreeForProject($projectId);
            $cacheService->invalidateCompiledForProject($projectId);
        } catch (\Exception $e) {
            \Log::error("Failed to invalidate cache after variable update for project {$projectId}: " . $e->getMessage());
        }

        return response()->json([
            'message' => 'Variables updated successfully',
            'deleted_count' => $deletedCount,
            'updated_count' => count($updated),
            'values' => $updated,
        ]);
    }

    /**
     * Delete a variable value
     */
    public function destroy(int $projectId, int $templateId, int $id): JsonResponse
    {
        $project = Project::findOrFail($projectId);

        // Check permission
        if (!$project->userCanAccess(auth()->user())) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $value = ProjectTemplateVariableValue::where('project_id', $projectId)
            ->where('template_id', $templateId)
            ->findOrFail($id);

        $value->delete();

        return response()->json(['message' => 'Variable value deleted successfully']);
    }
}
