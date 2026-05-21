<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FormSet;
use App\Models\FormWindow;
use App\Models\FormElement;
use App\Models\ProjectFormSet;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class FormDesignerController extends Controller
{
    // ========== ACCESS CONTROL ==========

    /**
     * Zugangs-Status prüfen
     * GET /api/form-designer/access
     */
    public function checkAccess(): JsonResponse
    {
        $user = Auth::user();
        $status = Subscription::getFormDesignerAccessStatus($user->id);
        $status['user_credits'] = $user->credits ?? 0;

        return response()->json($status);
    }

    /**
     * Feature mit Credits freischalten
     * POST /api/form-designer/unlock
     */
    public function unlockFeature(): JsonResponse
    {
        $user = Auth::user();

        // Prüfen ob bereits freigeschaltet
        if (Subscription::hasFormDesignerAccess($user->id)) {
            return response()->json([
                'success' => true,
                'message' => __('formdesignercontrollerphp45'),
            ]);
        }

        // Prüfen ob genug Credits
        $cost = Subscription::FORM_DESIGNER_UNLOCK_COST;
        if (($user->credits ?? 0) < $cost) {
            return response()->json([
                'success' => false,
                'error' => __('formdesignercontrollerphp54'),
                'required' => $cost,
                'available' => $user->credits ?? 0,
            ], 400);
        }

        // Freischalten
        $subscription = Subscription::unlockFormDesignerWithCredits($user->id);
        if (!$subscription) {
            return response()->json([
                'success' => false,
                'error' => __('formdesignercontrollerphp65'),
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => __('formdesignercontrollerphp71'),
            'credits_spent' => $cost,
            'credits_remaining' => $user->fresh()->credits ?? 0,
        ]);
    }

    // ========== FORMSET CRUD ==========

    /**
     * Alle FormSets abrufen
     * GET /api/form-sets
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $query = FormSet::accessibleBy($user->id)->active();

        // Filter nach Sichtbarkeit
        if ($request->has('visibility')) {
            $query->where('visibility', $request->visibility);
        }

        // Nur eigene
        if ($request->boolean('own_only')) {
            $query->where('creator_user_id', $user->id);
        }

        $formSets = $query->with('creator:id,name')
            ->withCount('windows')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $formSets,
        ]);
    }

    /**
     * FormSet Details abrufen
     * GET /api/form-sets/{id}
     */
    public function show(int $id): JsonResponse
    {
        $formSet = FormSet::with(['windows.elements', 'creator:id,name'])
            ->find($id);

        if (!$formSet) {
            return response()->json([
                'success' => false,
                'error' => __('formdesignercontrollerphp121'),
            ], 404);
        }

        // Zugriffsprüfung
        $user = Auth::user();
        if ($formSet->visibility === 'private' && $formSet->creator_user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'error' => __('formdesignercontrollerphp130'),
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $formSet,
        ]);
    }

    /**
     * Neues FormSet erstellen
     * POST /api/form-sets
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();

        // Zugriffsprüfung
        if (!Subscription::hasFormDesignerAccess($user->id)) {
            return response()->json([
                'success' => false,
                'error' => __('formdesignercontrollerphp152'),
            ], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'visibility' => 'in:private,team,public',
            'default_background_color' => 'nullable|string|max:7',
            'default_window_color' => 'nullable|string|max:7',
            'default_text_color' => 'nullable|string|max:7',
            'default_button_color' => 'nullable|string|max:7',
            'default_button_text_color' => 'nullable|string|max:7',
        ]);

        $formSet = FormSet::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'creator_user_id' => $user->id,
            'visibility' => $validated['visibility'] ?? 'private',
            'default_background_color' => $validated['default_background_color'] ?? '#1f2937',
            'default_window_color' => $validated['default_window_color'] ?? '#374151',
            'default_text_color' => $validated['default_text_color'] ?? '#f3f4f6',
            'default_button_color' => $validated['default_button_color'] ?? '#3b82f6',
            'default_button_text_color' => $validated['default_button_text_color'] ?? '#ffffff',
        ]);

        // Windows werden automatisch via boot() erstellt

        return response()->json([
            'success' => true,
            'message' => __('formdesignercontrollerphp183'),
            'data' => $formSet->load('windows.elements'),
        ], 201);
    }

    /**
     * FormSet aktualisieren
     * PUT /api/form-sets/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = Auth::user();
        $formSet = FormSet::find($id);

        if (!$formSet) {
            return response()->json(['success' => false, 'error' => __('formdesignercontrollerphp198')], 404);
        }

        // Nur Ersteller kann bearbeiten
        if ($formSet->creator_user_id !== $user->id) {
            return response()->json(['success' => false, 'error' => __('formdesignercontrollerphp203')], 403);
        }

        $validated = $request->validate([
            'name' => 'string|max:100',
            'description' => 'nullable|string',
            'visibility' => 'in:private,team,public',
            'default_background_color' => 'nullable|string|max:7',
            'default_window_color' => 'nullable|string|max:7',
            'default_text_color' => 'nullable|string|max:7',
            'default_button_color' => 'nullable|string|max:7',
            'default_button_text_color' => 'nullable|string|max:7',
            'is_active' => 'boolean',
        ]);

        $formSet->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'FormSet aktualisiert',
            'data' => $formSet->fresh()->load('windows.elements'),
        ]);
    }

    /**
     * FormSet löschen
     * DELETE /api/form-sets/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $user = Auth::user();
        $formSet = FormSet::find($id);

        if (!$formSet) {
            return response()->json(['success' => false, 'error' => __('formdesignercontrollerphp237')], 404);
        }

        if ($formSet->creator_user_id !== $user->id) {
            return response()->json(['success' => false, 'error' => __('formdesignercontrollerphp241')], 403);
        }

        // ── In-use protection ──────────────────────────────────────────
        // Refuse deletion if any schema_table or project still references this
        // FormSet — silently nulling user choices via ON DELETE SET NULL would
        // be lossy and unexpected.
        $inUseByTables = \App\Models\SchemaTable::where('form_set_id', $id)
            ->get(['id', 'table_name', 'schema_id']);
        $inUseByProjects = \App\Models\ProjectFormSet::where('form_set_id', $id)->count();

        if ($inUseByTables->isNotEmpty() || $inUseByProjects > 0) {
            return response()->json([
                'success' => false,
                'error' => __('formdesignercontrollerphp_in_use'),
                'in_use_by_tables' => $inUseByTables->map(fn($t) => [
                    'table_id' => $t->id,
                    'table_name' => $t->table_name,
                ])->values(),
                'in_use_by_projects' => $inUseByProjects,
            ], 409);
        }

        $formSet->delete();

        return response()->json([
            'success' => true,
            'message' => __('formdesignercontrollerphp248'),
        ]);
    }

    /**
     * FormSet klonen
     * POST /api/form-sets/{id}/clone
     */
    public function clone(Request $request, int $id): JsonResponse
    {
        $user = Auth::user();
        $formSet = FormSet::with('windows.elements')->find($id);

        if (!$formSet) {
            return response()->json(['success' => false, 'error' => __('formdesignercontrollerphp262')], 404);
        }

        // Zugriffsprüfung
        if ($formSet->visibility === 'private' && $formSet->creator_user_id !== $user->id) {
            return response()->json(['success' => false, 'error' => __('formdesignercontrollerphp267')], 403);
        }

        // Let the model derive a unique "_copy" / "_copy_<n>" name when the
        // caller didn't provide one; keeps suffixes consistent across all
        // clone flows (Report Pattern, Form Set, Team Role, Code Adjustment).
        $newName = $request->input('name');
        $clone = $formSet->cloneForUser($user->id, $newName);

        return response()->json([
            'success' => true,
            'message' => __('formdesignercontrollerphp275'),
            'data' => $clone->load('windows.elements'),
        ], 201);
    }

    // ========== WINDOWS ==========

    /**
     * Fenster eines FormSets abrufen
     * GET /api/form-sets/{id}/windows
     */
    public function windows(int $id): JsonResponse
    {
        $formSet = FormSet::with('windows.elements')->find($id);

        if (!$formSet) {
            return response()->json(['success' => false, 'error' => __('formdesignercontrollerphp291')], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $formSet->windows,
        ]);
    }

    /**
     * Fenster aktualisieren
     * PUT /api/form-windows/{id}
     */
    public function updateWindow(Request $request, int $id): JsonResponse
    {
        $user = Auth::user();
        $window = FormWindow::with('formSet')->find($id);

        if (!$window) {
            return response()->json(['success' => false, 'error' => __('formdesignercontrollerphp310')], 404);
        }

        // Berechtigungsprüfung
        if ($window->formSet->creator_user_id !== $user->id) {
            return response()->json(['success' => false, 'error' => __('formdesignercontrollerphp315')], 403);
        }

        $validated = $request->validate([
            'display_name' => 'nullable|string|max:255',
            'min_width' => 'integer|min:100',
            'min_height' => 'integer|min:100',
            'default_width' => 'integer|min:100',
            'default_height' => 'integer|min:100',
            'background_color' => 'nullable|string|max:7',
            'window_color' => 'nullable|string|max:7',
            'text_color' => 'nullable|string|max:7',
            // Paper/print configuration (report types)
            'paper_size' => 'nullable|string|max:20',
            'paper_orientation' => 'nullable|string|in:portrait,landscape',
            'paper_unit' => 'nullable|string|in:cm,mm,inch',
            'margin_top' => 'nullable|numeric|min:0|max:30',
            'margin_right' => 'nullable|numeric|min:0|max:30',
            'margin_bottom' => 'nullable|numeric|min:0|max:30',
            'margin_left' => 'nullable|numeric|min:0|max:30',
        ]);

        $window->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Fenster aktualisiert',
            'data' => $window->fresh()->load('elements'),
        ]);
    }

    // ========== ELEMENTS ==========

    /**
     * Elemente eines Fensters abrufen
     * GET /api/form-windows/{id}/elements
     */
    public function elements(int $id): JsonResponse
    {
        $window = FormWindow::with('elements')->find($id);

        if (!$window) {
            return response()->json(['success' => false, 'error' => __('formdesignercontrollerphp349')], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $window->elements,
        ]);
    }

    /**
     * Elemente eines Fensters speichern (Bulk)
     * PUT /api/form-windows/{id}/elements
     */
    public function saveElements(Request $request, int $id): JsonResponse
    {
        $user = Auth::user();
        $window = FormWindow::with('formSet')->find($id);

        if (!$window) {
            return response()->json(['success' => false, 'error' => __('formdesignercontrollerphp368')], 404);
        }

        if ($window->formSet->creator_user_id !== $user->id) {
            return response()->json(['success' => false, 'error' => __('formdesignercontrollerphp372')], 403);
        }

        $elements = $request->input('elements', []);

        DB::transaction(function () use ($window, $elements) {
            // IDs der übergebenen Elemente sammeln
            $existingIds = collect($elements)->pluck('id')->filter()->toArray();

            // Nicht mehr vorhandene Elemente löschen
            $window->elements()->whereNotIn('id', $existingIds)->delete();

            // Elemente aktualisieren oder erstellen
            foreach ($elements as $index => $elementData) {
                $data = [
                    'form_window_id' => $window->id,
                    'element_type' => $elementData['element_type'] ?? $elementData['type'],
                    'x_position' => $elementData['x_position'] ?? $elementData['x'] ?? 0,
                    'y_position' => $elementData['y_position'] ?? $elementData['y'] ?? 0,
                    'width' => $elementData['width'] ?? 100,
                    'height' => $elementData['height'] ?? 40,
                    // Anchor
                    'anchor_right' => $elementData['anchor_right'] ?? null,
                    'anchor_bottom' => $elementData['anchor_bottom'] ?? null,
                    'anchor_width' => $elementData['anchor_width'] ?? null,
                    'anchor_height' => $elementData['anchor_height'] ?? null,
                    // Container-spezifisch
                    'container_orientation' => $elementData['container_orientation'] ?? $elementData['orientation'] ?? null,
                    'max_fields' => $elementData['max_fields'] ?? null,
                    'container_gap' => $elementData['container_gap'] ?? 8,
                    'container_columns' => $elementData['container_columns'] ?? 1,
                    'default_control_height' => $elementData['default_control_height'] ?? 56,
                    // Button-spezifisch
                    'button_label' => $elementData['button_label'] ?? $elementData['label'] ?? null,
                    'button_icon' => $elementData['button_icon'] ?? $elementData['icon'] ?? null,
                    'button_action' => $elementData['button_action'] ?? $elementData['action'] ?? null,
                    'button_background_color' => $elementData['button_background_color'] ?? null,
                    'button_text_color' => $elementData['button_text_color'] ?? null,
                    // Tab-spezifisch
                    'tab_label' => $elementData['tab_label'] ?? null,
                    'parent_tab_container_id' => $elementData['parent_tab_container_id'] ?? null,
                    'custom_style' => $elementData['custom_style'] ?? $elementData['style'] ?? null,
                    'sort_order' => $index,
                    'tab_order' => isset($elementData['tab_order']) ? max(-1, min(9999, (int)$elementData['tab_order'])) : 0,
                    'is_visible' => $elementData['is_visible'] ?? $elementData['visible'] ?? true,
                ];

                if (!empty($elementData['id'])) {
                    // Bestehendes Element aktualisieren
                    FormElement::where('id', $elementData['id'])->update($data);
                } else {
                    // Neues Element erstellen
                    FormElement::create($data);
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => __('formdesignercontrollerphp424'),
            'data' => $window->fresh()->elements,
        ]);
    }

    /**
     * Einzelnes Element hinzufügen
     * POST /api/form-windows/{id}/elements
     */
    public function addElement(Request $request, int $id): JsonResponse
    {
        $user = Auth::user();
        $window = FormWindow::with('formSet')->find($id);

        if (!$window) {
            return response()->json(['success' => false, 'error' => __('formdesignercontrollerphp439')], 404);
        }

        if ($window->formSet->creator_user_id !== $user->id) {
            return response()->json(['success' => false, 'error' => __('formdesignercontrollerphp443')], 403);
        }

        $validated = $request->validate([
            'element_type' => 'required|string',
            'x_position' => 'integer',
            'y_position' => 'integer',
            'width' => 'integer',
            'height' => 'integer',
            'button_label' => 'nullable|string|max:100',
            'button_icon' => 'nullable|string|max:50',
        ]);

        $maxOrder = $window->elements()->max('sort_order') ?? 0;

        $element = $window->elements()->create(array_merge($validated, [
            'sort_order' => $maxOrder + 1,
        ]));

        return response()->json([
            'success' => true,
            'message' => __('formdesignercontrollerphp464'),
            'data' => $element,
        ], 201);
    }

    /**
     * Element löschen
     * DELETE /api/form-elements/{id}
     */
    public function deleteElement(int $id): JsonResponse
    {
        $user = Auth::user();
        $element = FormElement::with('formWindow.formSet')->find($id);

        if (!$element) {
            return response()->json(['success' => false, 'error' => __('formdesignercontrollerphp479')], 404);
        }

        if ($element->formWindow->formSet->creator_user_id !== $user->id) {
            return response()->json(['success' => false, 'error' => __('formdesignercontrollerphp483')], 403);
        }

        $element->delete();

        return response()->json([
            'success' => true,
            'message' => __('formdesignercontrollerphp490'),
        ]);
    }

    // ========== PROJECT INTEGRATION ==========

    /**
     * FormSet für Projekt aktivieren
     * POST /api/projects/{projectId}/form-set
     */
    public function activateForProject(Request $request, int $projectId): JsonResponse
    {
        $validated = $request->validate([
            'form_set_id' => 'required|exists:form_sets,id',
        ]);

        $link = ProjectFormSet::activateForProject($projectId, $validated['form_set_id']);

        return response()->json([
            'success' => true,
            'message' => 'FormSet aktiviert',
            'data' => $link->load('formSet'),
        ]);
    }

    /**
     * Aktives FormSet für Projekt abrufen
     * GET /api/projects/{projectId}/form-set
     */
    public function getProjectFormSet(int $projectId): JsonResponse
    {
        $formSet = ProjectFormSet::getActiveForProject($projectId);

        return response()->json([
            'success' => true,
            'data' => $formSet,
        ]);
    }

    /**
     * Clear the project's active FormSet (= "no default").
     * DELETE /api/projects/{projectId}/active-form-set
     */
    public function deactivateForProject(int $projectId): JsonResponse
    {
        ProjectFormSet::forProject($projectId)->update(['is_active' => false]);
        return response()->json([
            'success' => true,
            'message' => 'Project default FormSet cleared',
        ]);
    }

    /**
     * Pre-flight usage check for a FormSet — returns the schema_tables and
     * projects that reference it. The frontend uses this BEFORE opening the
     * "type DELETE to confirm" dialog so it can warn the user up front.
     * GET /api/form-sets/{id}/usage
     */
    public function usage(int $id): JsonResponse
    {
        $formSet = FormSet::find($id);
        if (!$formSet) {
            return response()->json(['success' => false, 'error' => 'FormSet not found'], 404);
        }

        $tables = \App\Models\SchemaTable::where('form_set_id', $id)
            ->get(['id', 'table_name', 'schema_id'])
            ->map(fn($t) => [
                'id' => $t->id,
                'table_name' => $t->table_name,
                'schema_id' => $t->schema_id,
            ])->values();

        $projects = ProjectFormSet::where('form_set_id', $id)
            ->where('is_active', true)
            ->with('project:id,name')
            ->get()
            ->map(fn($link) => [
                'id' => $link->project_id,
                'name' => $link->project?->name,
            ])->values();

        return response()->json([
            'success' => true,
            'data' => [
                'tables' => $tables,
                'projects' => $projects,
                'in_use' => $tables->isNotEmpty() || $projects->isNotEmpty(),
            ],
        ]);
    }

    /**
     * Verknüpfte Projekte für ein FormSet abrufen
     * GET /api/form-sets/{id}/linked-projects
     */
    public function getLinkedProjects(int $id): JsonResponse
    {
        $formSet = FormSet::find($id);

        if (!$formSet) {
            return response()->json(['success' => false, 'error' => __('formdesignercontrollerphp538')], 404);
        }

        // Alle Projekt-IDs finden, bei denen dieses FormSet aktiv verknüpft ist
        $linkedProjectIds = ProjectFormSet::where('form_set_id', $id)
            ->where('is_active', true)
            ->pluck('project_id')
            ->toArray();

        return response()->json([
            'success' => true,
            'data' => $linkedProjectIds,
        ]);
    }
}
