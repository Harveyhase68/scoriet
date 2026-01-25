<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TemplateVariable;
use App\Models\Template;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * Template Variables Controller
 *
 * Manages custom variables that templates need
 * (Template-Developer functionality)
 */
class TemplateVariableController extends Controller
{
    /**
     * Get all variables for a template
     */
    public function index(int $templateId): JsonResponse
    {
        $template = Template::findOrFail($templateId);
        $user = auth()->user();

        // Check permission using canBeViewedBy which includes:
        // - System templates (always viewable)
        // - Template creator
        // - Project members (if template belongs to a project)
        // - Projects linked via project_template_usage
        // - Public templates
        if (!$template->canBeViewedBy($user)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $variables = $template->variables()->orderBy('variable_name')->get();

        return response()->json([
            'template_id' => $templateId,
            'variables' => $variables,
        ]);
    }

    /**
     * Create a new template variable
     */
    public function store(Request $request, int $templateId): JsonResponse
    {
        $template = Template::findOrFail($templateId);

        // Check permission
        if (!$template->canBeEditedBy(auth()->user())) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'variable_name' => 'required|string|max:255|regex:/^[a-z_][a-z0-9_]*$/i',
            'description' => 'nullable|string',
            'default_value' => 'nullable|string',
            'is_required' => 'boolean',
        ]);

        // Check if variable already exists for this template
        $exists = TemplateVariable::where('template_id', $templateId)
            ->where('variable_name', $validated['variable_name'])
            ->exists();

        if ($exists) {
            return response()->json([
                'error' => 'Variable already exists for this template'
            ], 422);
        }

        $variable = TemplateVariable::create([
            'template_id' => $templateId,
            ...$validated
        ]);

        return response()->json($variable, 201);
    }

    /**
     * Update a template variable
     */
    public function update(Request $request, int $templateId, int $id): JsonResponse
    {
        $template = Template::findOrFail($templateId);

        // Check permission
        if (!$template->canBeEditedBy(auth()->user())) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $variable = TemplateVariable::where('template_id', $templateId)
            ->findOrFail($id);

        $validated = $request->validate([
            'variable_name' => 'string|max:255|regex:/^[a-z_][a-z0-9_]*$/i',
            'description' => 'nullable|string',
            'default_value' => 'nullable|string',
            'is_required' => 'boolean',
        ]);

        // Check for duplicate variable_name (if changing)
        if (isset($validated['variable_name']) && $validated['variable_name'] !== $variable->variable_name) {
            $exists = TemplateVariable::where('template_id', $templateId)
                ->where('variable_name', $validated['variable_name'])
                ->where('id', '!=', $id)
                ->exists();

            if ($exists) {
                return response()->json([
                    'error' => 'Variable name already exists for this template'
                ], 422);
            }
        }

        $variable->update($validated);

        return response()->json($variable);
    }

    /**
     * Delete a template variable
     */
    public function destroy(int $templateId, int $id): JsonResponse
    {
        $template = Template::findOrFail($templateId);

        // Check permission
        if (!$template->canBeEditedBy(auth()->user())) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $variable = TemplateVariable::where('template_id', $templateId)
            ->findOrFail($id);

        $variable->delete();

        return response()->json(['message' => 'Variable deleted successfully']);
    }
}
