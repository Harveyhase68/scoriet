<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FormSet;
use App\Models\FormWindow;
use App\Models\FormElement;
use App\Models\FormTableLayout;
use App\Models\Project;
use App\Models\ProjectFormSet;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class FormDesignerController extends Controller
{
    /**
     * Mirror of FormSet::scopeAccessibleBy as a boolean. Used by the
     * read-only endpoints (windows / elements) so a user can't enumerate
     * other users' form designs.
     */
    private function canReadFormSet(FormSet $formSet, $user): bool
    {
        if ($formSet->visibility === 'public') {
            return true;
        }
        return $user && (int) $formSet->creator_user_id === (int) $user->id;
    }

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
            // Per-creator uniqueness: a single user can't have two FormSets
            // with the same name. Mirrors the contract templates use.
            'name' => [
                'required', 'string', 'max:100',
                \Illuminate\Validation\Rule::unique('form_sets', 'name')
                    ->where(fn ($q) => $q->where('creator_user_id', $user->id)),
            ],
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
            'name' => [
                'string', 'max:100',
                \Illuminate\Validation\Rule::unique('form_sets', 'name')
                    ->ignore($formSet->id)
                    ->where(fn ($q) => $q->where('creator_user_id', $user->id)),
            ],
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
        //
        // Only ACTIVE project links count as "in use": deactivateForProject()
        // unlinks by setting is_active=false (it keeps the row, never deletes
        // it), so a leftover inactive row means the user already removed the
        // dependency and must NOT block deletion. This mirrors getLinkedProjects
        // / linkedProjectIds, which also filter on is_active.
        // Same shape as usage() so the frontend can render the rich "in use by"
        // dialog (table + project names) straight from the 409 body.
        $tables = \App\Models\SchemaTable::where('form_set_id', $id)
            ->get(['id', 'table_name', 'schema_id'])
            ->map(fn($t) => [
                'id' => $t->id,
                'table_name' => $t->table_name,
                'schema_id' => $t->schema_id,
            ])->values();

        $projects = \App\Models\ProjectFormSet::where('form_set_id', $id)
            ->where('is_active', true)
            ->with('project:id,name')
            ->get()
            ->map(fn($l) => [
                'id' => $l->project_id,
                'name' => $l->project?->name,
            ])->values();

        if ($tables->isNotEmpty() || $projects->isNotEmpty()) {
            return response()->json([
                'success' => false,
                'error' => __('formdesignercontrollerphp_in_use'),
                'tables' => $tables,
                'projects' => $projects,
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

        // BOLA guard: windows + elements describe the full UI layout of a
        // form set. Restrict to creator + public.
        if (!$this->canReadFormSet($formSet, Auth::user())) {
            return response()->json(['success' => false, 'error' => 'You do not have permission to view this form set.'], 403);
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
        $window = FormWindow::with(['elements', 'formSet'])->find($id);

        if (!$window) {
            return response()->json(['success' => false, 'error' => __('formdesignercontrollerphp349')], 404);
        }

        // BOLA guard: window elements describe the full UI tree of a form
        // window — restrict via the parent FormSet's visibility rule.
        if (!$window->formSet || !$this->canReadFormSet($window->formSet, Auth::user())) {
            return response()->json(['success' => false, 'error' => 'You do not have permission to view this form window.'], 403);
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
        // BOLA guard: without this, any authenticated user could flip ANY
        // project's active FormSet by passing its projectId. We require
        // edit-settings permission on the project before touching its
        // FormSet pivot.
        $project = Project::find($projectId);
        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }
        if (!$project->userCanEditProject(Auth::user())) {
            return response()->json(['success' => false, 'message' => 'You do not have permission to edit this project.'], 403);
        }

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
        // BOLA guard: leaks which FormSet a foreign project uses. Require
        // visibility on the project itself — public projects stay readable.
        $project = Project::find($projectId);
        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }
        if (!$project->isVisibleTo(Auth::user())) {
            return response()->json(['success' => false, 'message' => 'You do not have permission to view this project.'], 403);
        }

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
        // BOLA guard — same reason as activateForProject above. Without it,
        // any authenticated user could clear another project's FormSet pivot.
        $project = Project::find($projectId);
        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }
        if (!$project->userCanEditProject(Auth::user())) {
            return response()->json(['success' => false, 'message' => 'You do not have permission to edit this project.'], 403);
        }

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

    // ========== PER-TABLE LAYOUT DIMENSION OVERRIDES ==========
    //
    // The FormWindow carries the TEMPLATE width/height (default_width /
    // default_height). Those apply across all tables that use the same window
    // template. The Layout Designer (per-table) needs to override the size
    // independently per (window × schema_table) pair — e.g. give the `users`
    // form 1200px height because of its 16 fields, without changing the
    // template that `user_groups` also uses.
    //
    // Stored in `form_table_layouts` table, keyed by (form_window_id, schema_table_id).

    /**
     * GET /api/form-windows/{windowId}/table-layouts/{tableId}
     * Returns the per-table dimension override, or 200 with nulls if none exists.
     */
    public function getTableLayout(int $windowId, int $tableId): JsonResponse
    {
        $row = FormTableLayout::where('form_window_id', $windowId)
            ->where('schema_table_id', $tableId)
            ->first();

        return response()->json([
            'form_window_id'  => $windowId,
            'schema_table_id' => $tableId,
            'width'           => $row->width  ?? null,
            'height'          => $row->height ?? null,
        ]);
    }

    /**
     * PUT /api/form-windows/{windowId}/table-layouts/{tableId}
     * Upserts the per-table override. Passing null for width/height clears that axis.
     */
    public function saveTableLayout(Request $request, int $windowId, int $tableId): JsonResponse
    {
        $user = Auth::user();
        $window = FormWindow::with('formSet')->find($windowId);
        if (!$window) {
            return response()->json(['success' => false, 'error' => 'Window not found'], 404);
        }
        // Same permission model as updateWindow(): only the FormSet creator may edit.
        // Per-table overrides are still "designer state" so we keep the gate.
        if ($window->formSet->creator_user_id !== $user->id) {
            return response()->json(['success' => false, 'error' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'width'  => 'nullable|integer|min:100|max:8000',
            'height' => 'nullable|integer|min:100|max:8000',
        ]);

        $row = FormTableLayout::updateOrCreate(
            ['form_window_id' => $windowId, 'schema_table_id' => $tableId],
            ['width' => $validated['width'] ?? null, 'height' => $validated['height'] ?? null],
        );

        return response()->json([
            'success'         => true,
            'form_window_id'  => $row->form_window_id,
            'schema_table_id' => $row->schema_table_id,
            'width'           => $row->width,
            'height'          => $row->height,
        ]);
    }

    // ========== EXPORT / IMPORT (portable JSON blueprint) ==========

    /**
     * Export a Form Set as a portable JSON blueprint: the FormSet, its windows,
     * each window's elements, AND the per-table field layouts. The layouts are
     * stored NAME-based (schema name + table name + field name) so they survive
     * a move to another Scoriet instance with the same schema — IDs are never
     * exported. On import they are matched by name (different schema → ignored).
     * The frontend saves the returned envelope as a .json file.
     *
     * GET /api/form-sets/{id}/export
     */
    public function exportFormSet(int $id): JsonResponse
    {
        $user = Auth::user();
        $formSet = FormSet::with('windows.elements')->find($id);
        if (!$formSet) {
            return response()->json(['success' => false, 'error' => 'Form Set not found'], 404);
        }
        // Export is allowed for the owner, for public sets, or for admins.
        if ($formSet->creator_user_id !== $user->id && $formSet->visibility !== 'public' && !$user->isAdmin()) {
            return response()->json(['success' => false, 'error' => 'Unauthorized'], 403);
        }

        $windowFields  = array_diff((new FormWindow)->getFillable(), ['form_set_id']);
        $elementFields = (new FormElement)->getFillable(); // keep parent_tab_container_id (orig id) for re-wiring on import

        $data = [
            'name'                      => $formSet->name,
            'description'               => $formSet->description,
            'default_background_color'  => $formSet->default_background_color,
            'default_window_color'      => $formSet->default_window_color,
            'default_text_color'        => $formSet->default_text_color,
            'default_button_color'      => $formSet->default_button_color,
            'default_button_text_color' => $formSet->default_button_text_color,
            'windows' => $formSet->windows->map(function (FormWindow $w) use ($windowFields, $elementFields) {
                $win = \Illuminate\Support\Arr::only($w->toArray(), $windowFields);
                $win['elements'] = $w->elements->map(function (FormElement $e) use ($elementFields) {
                    $el = \Illuminate\Support\Arr::only($e->toArray(), $elementFields);
                    $el['_ref'] = $e->id; // original id — used to re-wire parent_tab_container_id on import
                    return $el;
                })->values();
                $layoutData = $this->buildWindowLayouts($w);
                $win['layouts'] = $layoutData['tables'];
                $win['window_placements'] = $layoutData['window'];
                return $win;
            })->values(),
        ];

        return response()->json([
            'scoriet_type' => 'form_set',
            'version'      => 1,
            'exported_at'  => now()->toIso8601String(),
            'data'         => $data,
        ]);
    }

    /**
     * Build the NAME-based layouts for one window. Returns TWO collections:
     *   - 'tables': per-table field layouts, grouped by schema+table NAME (the
     *     placements bound to a schema table — fields, per-table menu items).
     *   - 'window': window-level placements that are NOT tied to a table —
     *     menu GROUPS, SEPARATORS and buttons. These carry the menu hierarchy
     *     (a per-table menu item's parent is usually a window-level group), so
     *     they must travel too, otherwise the hierarchy collapses on import.
     * FK ids are replaced with names (schema/table/field/lookup-table); template
     * element references (container/form_element/tab) and the placement
     * self-reference (parent_placement_id) are kept as original ids and re-wired
     * via the id maps when the layout is applied on import.
     */
    private function buildWindowLayouts(FormWindow $window): array
    {
        $placements = \App\Models\FormItemPlacement::where('form_window_id', $window->id)
            ->orderBy('sort_order')
            ->get();
        if ($placements->isEmpty()) {
            return ['tables' => [], 'window' => []];
        }

        $tableIds = $placements->pluck('schema_table_id')
            ->merge($placements->pluck('lookup_table_id'))
            ->filter()->unique()->all();
        $tables = \App\Models\SchemaTable::with('floatingSchema:id,name')
            ->whereIn('id', $tableIds)->get()->keyBy('id');
        $fields = \App\Models\SchemaField::whereIn('id', $placements->pluck('schema_field_id')->filter()->unique()->all())
            ->get()->keyBy('id');

        $placementFields = array_diff(
            (new \App\Models\FormItemPlacement)->getFillable(),
            ['form_window_id', 'schema_table_id', 'schema_field_id', 'lookup_table_id',
             'container_element_id', 'form_element_id', 'tab_panel_id', 'parent_placement_id']
        );

        // Serialise one placement into a portable, name-based row.
        $serialize = function (\App\Models\FormItemPlacement $p) use ($placementFields, $tables, $fields): array {
            $row = \Illuminate\Support\Arr::only($p->toArray(), $placementFields);
            $row['_pref']                 = $p->id; // original placement id → re-wire parent_placement_id on apply
            $row['schema_field_name']     = $p->schema_field_id ? ($fields[$p->schema_field_id]->field_name ?? null) : null;
            $row['lookup_table_name']     = $p->lookup_table_id ? ($tables[$p->lookup_table_id]->table_name ?? null) : null;
            $row['container_element_ref'] = $p->container_element_id; // original element id → remapped on apply
            $row['form_element_ref']      = $p->form_element_id;
            $row['tab_panel_ref']         = $p->tab_panel_id;
            $row['parent_placement_ref']  = $p->parent_placement_id; // original placement id → remapped on apply
            return $row;
        };

        $groups = [];
        $windowLevel = [];
        foreach ($placements as $p) {
            if ($p->schema_table_id) {
                $tbl = $tables[$p->schema_table_id] ?? null;
                $schemaName = $tbl?->floatingSchema?->name;
                $tableName  = $tbl?->table_name;
                if (!$schemaName || !$tableName) {
                    continue; // can't make this portable without both names
                }
                $key = $schemaName . "\0" . $tableName;
                if (!isset($groups[$key])) {
                    $groups[$key] = ['schema_name' => $schemaName, 'table_name' => $tableName, 'placements' => []];
                }
                $groups[$key]['placements'][] = $serialize($p);
            } else {
                // Window-level (menu group / separator / button) — no table.
                $windowLevel[] = $serialize($p);
            }
        }
        return ['tables' => array_values($groups), 'window' => $windowLevel];
    }

    /**
     * Import a Form Set from a JSON blueprint (see exportFormSet). ALWAYS
     * creates a new private Form Set owned by the current user — never
     * overwrites — and appends a numbered suffix on a name clash. Element
     * self-references (parent_tab_container_id, for tab containers) are
     * re-wired to the freshly created ids in a second pass.
     *
     * When `apply_layouts` is true, the per-table field layouts in the envelope
     * are also imported, best-effort: each layout's schema+table is matched by
     * NAME against the importing user's schemas; unmatched tables are skipped
     * (different schema), and within a matched table any placement whose field
     * can't be resolved by name is skipped. Element references are re-wired via
     * the element id map built above (same transaction).
     *
     * POST /api/form-sets/import   (body: the exported envelope)
     */
    public function importFormSet(Request $request): JsonResponse
    {
        $user = Auth::user();
        $validated = $request->validate([
            'scoriet_type' => 'required|string',
            'data'         => 'required|array',
            'data.name'    => 'nullable|string|max:100',
        ]);
        if ($validated['scoriet_type'] !== 'form_set') {
            return response()->json(['success' => false, 'error' => 'This file is not a Form Set export.'], 422);
        }
        // Read the FULL data array from the request — $validated['data'] would
        // only contain the explicitly-ruled sub-keys (data.name), dropping
        // windows/colors.
        $d = $request->input('data', []);
        $applyLayouts = (bool) $request->input('apply_layouts', false);

        $windowFields  = array_diff((new FormWindow)->getFillable(), ['form_set_id']);
        $elementFields = array_diff((new FormElement)->getFillable(), ['form_window_id', 'parent_tab_container_id']);

        $result = DB::transaction(function () use ($user, $d, $windowFields, $elementFields, $applyLayouts) {
            $setData = [
                'name'            => FormSet::suggestCopyName($d['name'] ?? 'Imported Form Set', $user->id),
                'description'     => $d['description'] ?? null,
                'creator_user_id' => $user->id,
                'visibility'      => 'private',
                'is_active'       => true,
            ];
            // Only carry over colours that are actually set; null/missing lets
            // the NOT NULL columns fall back to their DB defaults.
            foreach ([
                'default_background_color', 'default_window_color', 'default_text_color',
                'default_button_color', 'default_button_text_color',
            ] as $colorField) {
                if (!empty($d[$colorField])) {
                    $setData[$colorField] = $d[$colorField];
                }
            }
            $set = FormSet::create($setData);

            // FormSet::created auto-seeds 3 default windows — drop them (and any
            // of their elements) before importing the blueprint's own windows.
            $defaultWindowIds = $set->windows()->pluck('id')->all();
            if (!empty($defaultWindowIds)) {
                FormElement::whereIn('form_window_id', $defaultWindowIds)->delete();
                FormWindow::whereIn('id', $defaultWindowIds)->delete();
            }

            $idMap = [];            // original element _ref => new element id
            $pendingParents = [];   // new element id => original parent _ref
            $windowTypeToId = [];   // window_type => new window id (for layout apply)

            foreach (($d['windows'] ?? []) as $w) {
                $window = FormWindow::create(array_merge(
                    \Illuminate\Support\Arr::only($w, $windowFields),
                    ['form_set_id' => $set->id]
                ));
                if (!empty($w['window_type'])) {
                    $windowTypeToId[$w['window_type']] = $window->id;
                }
                foreach (($w['elements'] ?? []) as $e) {
                    $element = FormElement::create(array_merge(
                        \Illuminate\Support\Arr::only($e, $elementFields),
                        ['form_window_id' => $window->id]
                    ));
                    if (isset($e['_ref'])) {
                        $idMap[$e['_ref']] = $element->id;
                    }
                    if (!empty($e['parent_tab_container_id'])) {
                        $pendingParents[$element->id] = $e['parent_tab_container_id'];
                    }
                }
            }

            // Second pass: re-wire tab-container parents to the new ids.
            foreach ($pendingParents as $newElId => $oldParentRef) {
                if (isset($idMap[$oldParentRef])) {
                    FormElement::where('id', $newElId)->update(['parent_tab_container_id' => $idMap[$oldParentRef]]);
                }
            }

            // Optionally apply the per-table field layouts (name-matched).
            $layoutStats = $applyLayouts
                ? $this->applyImportedLayouts($d['windows'] ?? [], $windowTypeToId, $idMap, $user->id)
                : null;

            return ['set' => $set, 'layoutStats' => $layoutStats];
        });

        return response()->json([
            'success'      => true,
            'message'      => 'Form Set imported',
            'data'         => $result['set']->load('windows.elements'),
            'layout_stats' => $result['layoutStats'],
        ], 201);
    }

    /**
     * Apply imported per-table field layouts, best-effort & name-matched.
     * Returns stats: applied count + which "schema / table" labels matched vs
     * were skipped (no matching schema/table for the importing user).
     */
    private function applyImportedLayouts(array $windows, array $windowTypeToId, array $idMap, int $userId): array
    {
        $placementFillable = (new \App\Models\FormItemPlacement)->getFillable();
        $applied = 0;
        $matched = [];
        $skipped = [];
        $placementIdMap = []; // original placement _pref => new placement id
        $pendingParents = []; // new placement id => original parent_placement_ref

        foreach ($windows as $w) {
            $windowType  = $w['window_type'] ?? null;
            $newWindowId = $windowType ? ($windowTypeToId[$windowType] ?? null) : null;
            if (!$newWindowId) {
                continue;
            }

            // Window-level placements (menu GROUPS, separators, buttons) — not
            // tied to a table, so they're applied unconditionally and provide the
            // parent targets the per-table menu items hang off of.
            \App\Models\FormItemPlacement::where('form_window_id', $newWindowId)
                ->whereNull('schema_table_id')->delete(); // idempotent
            foreach (($w['window_placements'] ?? []) as $row) {
                $createData = \Illuminate\Support\Arr::only($row, $placementFillable);
                $createData['form_window_id']  = $newWindowId;
                $createData['schema_table_id'] = null;
                $createData['schema_field_id'] = null;
                $createData['lookup_table_id'] = null;
                if (!empty($row['lookup_table_name'])) {
                    $lt = \App\Models\SchemaTable::where('table_name', $row['lookup_table_name'])
                        ->whereHas('floatingSchema', fn ($q) => $q->where('owner_id', $userId))->first();
                    $createData['lookup_table_id'] = $lt?->id;
                }
                $createData['container_element_id'] = isset($row['container_element_ref']) ? ($idMap[$row['container_element_ref']] ?? null) : null;
                $createData['form_element_id']      = isset($row['form_element_ref']) ? ($idMap[$row['form_element_ref']] ?? null) : null;
                $createData['tab_panel_id']         = isset($row['tab_panel_ref']) ? ($idMap[$row['tab_panel_ref']] ?? null) : null;
                $createData['parent_placement_id']  = null; // 2nd pass

                $placement = \App\Models\FormItemPlacement::create($createData);
                if (isset($row['_pref'])) {
                    $placementIdMap[$row['_pref']] = $placement->id;
                }
                if (!empty($row['parent_placement_ref'])) {
                    $pendingParents[$placement->id] = $row['parent_placement_ref'];
                }
                $applied++;
            }

            foreach (($w['layouts'] ?? []) as $layout) {
                $schemaName = $layout['schema_name'] ?? null;
                $tableName  = $layout['table_name'] ?? null;
                if (!$schemaName || !$tableName) {
                    continue;
                }
                $label = $schemaName . ' / ' . $tableName;

                // Match by NAME against the importing user's own schemas.
                $table = \App\Models\SchemaTable::where('table_name', $tableName)
                    ->whereHas('floatingSchema', function ($q) use ($schemaName, $userId) {
                        $q->where('name', $schemaName)->where('owner_id', $userId);
                    })->first();

                if (!$table) {
                    $skipped[$label] = true;
                    continue;
                }
                $matched[$label] = true;

                $fieldMap = \App\Models\SchemaField::where('table_id', $table->id)
                    ->pluck('id', 'field_name');

                // Idempotent: clear existing placements for this (window, table).
                \App\Models\FormItemPlacement::where('form_window_id', $newWindowId)
                    ->where('schema_table_id', $table->id)->delete();

                foreach (($layout['placements'] ?? []) as $row) {
                    $createData = \Illuminate\Support\Arr::only($row, $placementFillable);
                    $createData['form_window_id']  = $newWindowId;
                    $createData['schema_table_id'] = $table->id;

                    if (!empty($row['schema_field_name'])) {
                        $fid = $fieldMap[$row['schema_field_name']] ?? null;
                        if (!$fid) {
                            continue; // field missing in target table -> skip this placement
                        }
                        $createData['schema_field_id'] = $fid;
                    } else {
                        $createData['schema_field_id'] = null;
                    }

                    $createData['lookup_table_id'] = null;
                    if (!empty($row['lookup_table_name'])) {
                        $lt = \App\Models\SchemaTable::where('table_name', $row['lookup_table_name'])
                            ->whereHas('floatingSchema', fn ($q) => $q->where('owner_id', $userId))->first();
                        $createData['lookup_table_id'] = $lt?->id;
                    }

                    // Re-wire template element references via the element id map.
                    $createData['container_element_id'] = isset($row['container_element_ref']) ? ($idMap[$row['container_element_ref']] ?? null) : null;
                    $createData['form_element_id']      = isset($row['form_element_ref']) ? ($idMap[$row['form_element_ref']] ?? null) : null;
                    $createData['tab_panel_id']         = isset($row['tab_panel_ref']) ? ($idMap[$row['tab_panel_ref']] ?? null) : null;
                    // Placement self-reference (menu hierarchy) is re-wired in a
                    // second pass once every placement has a new id.
                    $createData['parent_placement_id']  = null;

                    $placement = \App\Models\FormItemPlacement::create($createData);
                    if (isset($row['_pref'])) {
                        $placementIdMap[$row['_pref']] = $placement->id;
                    }
                    if (!empty($row['parent_placement_ref'])) {
                        $pendingParents[$placement->id] = $row['parent_placement_ref'];
                    }
                    $applied++;
                }
            }
        }

        // Second pass: re-wire menu-item parents to the new placement ids
        // (unresolvable parents — e.g. a window-level container not part of the
        // exported per-table layouts — stay null, i.e. the item becomes top-level).
        foreach ($pendingParents as $newId => $oldParentRef) {
            if (isset($placementIdMap[$oldParentRef])) {
                \App\Models\FormItemPlacement::where('id', $newId)
                    ->update(['parent_placement_id' => $placementIdMap[$oldParentRef]]);
            }
        }

        return [
            'applied'        => $applied,
            'tables_matched' => array_keys($matched),
            'tables_skipped' => array_keys($skipped),
        ];
    }

    /**
     * Read-only pre-flight for the import "also bring the layouts?" prompt.
     * Reports which of the envelope's per-table layouts have a matching
     * schema+table (by NAME) for the importing user — so the frontend can
     * propose applying them. Makes NO changes.
     *
     * POST /api/form-sets/import/preview-layouts   (body: the exported envelope)
     */
    public function previewImportLayouts(Request $request): JsonResponse
    {
        $user = Auth::user();
        $d = $request->input('data', []);

        $matched = [];
        $unmatched = [];
        $seen = [];
        foreach (($d['windows'] ?? []) as $w) {
            foreach (($w['layouts'] ?? []) as $layout) {
                $schemaName = $layout['schema_name'] ?? null;
                $tableName  = $layout['table_name'] ?? null;
                if (!$schemaName || !$tableName) {
                    continue;
                }
                $label = $schemaName . ' / ' . $tableName;
                if (isset($seen[$label])) {
                    continue;
                }
                $seen[$label] = true;

                $exists = \App\Models\SchemaTable::where('table_name', $tableName)
                    ->whereHas('floatingSchema', fn ($q) => $q->where('name', $schemaName)->where('owner_id', $user->id))
                    ->exists();

                $entry = [
                    'schema_name' => $schemaName,
                    'table_name'  => $tableName,
                    'placements'  => count($layout['placements'] ?? []),
                ];
                if ($exists) {
                    $matched[] = $entry;
                } else {
                    $unmatched[] = $entry;
                }
            }
        }

        return response()->json([
            'success'     => true,
            'has_layouts' => !empty($matched) || !empty($unmatched),
            'matched'     => $matched,
            'unmatched'   => $unmatched,
        ]);
    }
}
