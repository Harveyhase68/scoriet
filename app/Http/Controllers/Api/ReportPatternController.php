<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReportPattern;
use App\Models\ReportPatternForm;
use App\Models\ReportPatternElement;
use App\Models\Project;
use App\Models\ProjectReportPattern;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ReportPatternController extends Controller
{
    /**
     * Mirror of ReportPattern::scopeAccessibleBy as a boolean. Used by the
     * read-only endpoints (forms / usage / images) to gate access without
     * re-querying.
     */
    private function canReadPattern(ReportPattern $pattern, $user): bool
    {
        if (in_array($pattern->visibility, ['public', 'system'], true)) {
            return true;
        }
        return $user && (int) $pattern->creator_user_id === (int) $user->id;
    }

    // ========== ACCESS CONTROL ==========

    /**
     * Zugangs-Status pruefen (gleiche Paywall wie Form Designer)
     * GET /api/report-patterns/access
     */
    public function checkAccess(): JsonResponse
    {
        $user = Auth::user();
        $status = Subscription::getFormDesignerAccessStatus($user->id);
        $status['user_credits'] = $user->credits ?? 0;

        return response()->json($status);
    }

    // ========== REPORT PATTERN CRUD ==========

    /**
     * Alle Report Patterns abrufen
     * GET /api/report-patterns
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $query = ReportPattern::accessibleBy($user->id)->active();

        if ($request->has('visibility')) {
            $query->where('visibility', $request->visibility);
        }

        if ($request->boolean('own_only')) {
            $query->where('creator_user_id', $user->id);
        }

        $patterns = $query->with('creator:id,name')
            ->withCount('forms')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $patterns,
        ]);
    }

    /**
     * Report Pattern Details
     * GET /api/report-patterns/{id}
     */
    public function show(int $id): JsonResponse
    {
        $pattern = ReportPattern::with(['forms.elements', 'creator:id,name'])
            ->find($id);

        if (!$pattern) {
            return response()->json(['success' => false, 'error' => 'Report Pattern not found'], 404);
        }

        $user = Auth::user();
        if ($pattern->visibility === 'private' && (int)($pattern->creator_user_id) !== (int)($user->id)) {
            return response()->json(['success' => false, 'error' => 'Unauthorized'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $pattern,
        ]);
    }

    /**
     * Neues Report Pattern erstellen
     * POST /api/report-patterns
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (!Subscription::hasFormDesignerAccess($user->id)) {
            return response()->json(['success' => false, 'error' => 'Feature not unlocked'], 403);
        }

        $validated = $request->validate([
            // Per-creator uniqueness, same contract as templates and FormSets.
            'name' => [
                'required', 'string', 'max:100',
                \Illuminate\Validation\Rule::unique('report_patterns', 'name')
                    ->where(fn ($q) => $q->where('creator_user_id', $user->id)),
            ],
            'description' => 'nullable|string',
            'visibility' => 'in:private,team,public',
        ]);

        $pattern = ReportPattern::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'creator_user_id' => $user->id,
            'visibility' => $validated['visibility'] ?? 'private',
        ]);

        // Forms werden automatisch via boot() erstellt

        return response()->json([
            'success' => true,
            'message' => 'Report Pattern created',
            'data' => $pattern->load('forms.elements'),
        ], 201);
    }

    /**
     * Report Pattern aktualisieren
     * PUT /api/report-patterns/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = Auth::user();
        $pattern = ReportPattern::find($id);

        if (!$pattern) {
            return response()->json(['success' => false, 'error' => 'Report Pattern not found'], 404);
        }

        if ((int)($pattern->creator_user_id) !== (int)($user->id)) {
            return response()->json(['success' => false, 'error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => [
                'string', 'max:100',
                \Illuminate\Validation\Rule::unique('report_patterns', 'name')
                    ->ignore($pattern->id)
                    ->where(fn ($q) => $q->where('creator_user_id', $user->id)),
            ],
            'description' => 'nullable|string',
            'visibility' => 'in:private,team,public',
            'is_active' => 'boolean',
        ]);

        $pattern->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Report Pattern updated',
            'data' => $pattern->fresh()->load('forms.elements'),
        ]);
    }

    /**
     * Report Pattern loeschen
     * DELETE /api/report-patterns/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $user = Auth::user();
        $pattern = ReportPattern::find($id);

        if (!$pattern) {
            return response()->json(['success' => false, 'error' => 'Report Pattern not found'], 404);
        }

        if ((int)($pattern->creator_user_id) !== (int)($user->id)) {
            return response()->json(['success' => false, 'error' => 'Unauthorized'], 403);
        }

        // In-use protection: refuse deletion if referenced by any schema_table OR
        // by an ACTIVE project default. Only active project links count —
        // deactivateForProject() unlinks by setting is_active=false (keeps the
        // row), so a leftover inactive row means the user already removed the
        // dependency and must NOT block deletion. Mirrors usage().
        // Same shape as usage() so the frontend can render the rich "in use by"
        // dialog (table + project names) straight from the 409 body.
        $tables = \App\Models\SchemaTable::where('report_pattern_id', $id)
            ->get(['id', 'table_name', 'schema_id'])
            ->map(fn($t) => [
                'id' => $t->id,
                'table_name' => $t->table_name,
                'schema_id' => $t->schema_id,
            ])->values();

        $projects = ProjectReportPattern::where('report_pattern_id', $id)
            ->where('is_active', true)
            ->with('project:id,name')
            ->get()
            ->map(fn($link) => [
                'id' => $link->project_id,
                'name' => $link->project?->name,
            ])->values();

        if ($tables->isNotEmpty() || $projects->isNotEmpty()) {
            return response()->json([
                'success' => false,
                'error' => 'Report Pattern is in use and cannot be deleted.',
                'tables' => $tables,
                'projects' => $projects,
            ], 409);
        }

        $pattern->delete();

        return response()->json([
            'success' => true,
            'message' => 'Report Pattern deleted',
        ]);
    }

    /**
     * Report Pattern klonen
     * POST /api/report-patterns/{id}/clone
     */
    public function clone(Request $request, int $id): JsonResponse
    {
        $user = Auth::user();
        $pattern = ReportPattern::with('forms.elements.layoutElements')->find($id);

        if (!$pattern) {
            return response()->json(['success' => false, 'error' => 'Report Pattern not found'], 404);
        }

        if ($pattern->visibility === 'private' && (int)($pattern->creator_user_id) !== (int)($user->id)) {
            return response()->json(['success' => false, 'error' => 'Unauthorized'], 403);
        }

        // Let the model derive a unique "_copy" / "_copy_<n>" name when the
        // caller didn't provide one, so we don't end up with the old
        // " (Kopie)" suffix that mixed spaces and parentheses.
        $newName = $request->input('name');
        $clone = $pattern->cloneForUser($user->id, $newName);

        return response()->json([
            'success' => true,
            'message' => 'Report Pattern cloned',
            'data' => $clone->load('forms.elements'),
        ], 201);
    }

    // ========== REPORT PATTERN FORMS ==========

    /**
     * Forms eines Report Patterns abrufen
     * GET /api/report-patterns/{id}/forms
     */
    public function forms(int $id): JsonResponse
    {
        $pattern = ReportPattern::with('forms.elements')->find($id);

        if (!$pattern) {
            return response()->json(['success' => false, 'error' => 'Report Pattern not found'], 404);
        }

        // BOLA guard: forms + their elements describe the full report layout
        // — readable only by the pattern's creator. Public patterns are an
        // explicit allow (community/store templates).
        if (!$this->canReadPattern($pattern, Auth::user())) {
            return response()->json(['success' => false, 'error' => 'You do not have permission to view this report pattern.'], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $pattern->forms,
        ]);
    }

    /**
     * Report Pattern Form aktualisieren (Papierformat, Raender, etc.)
     * PUT /api/report-pattern-forms/{id}
     */
    public function updateForm(Request $request, int $id): JsonResponse
    {
        $user = Auth::user();
        $form = ReportPatternForm::with('pattern')->find($id);

        if (!$form) {
            return response()->json(['success' => false, 'error' => 'Report Pattern Form not found'], 404);
        }

        if ((int)($form->pattern->creator_user_id) !== (int)($user->id)) {
            return response()->json(['success' => false, 'error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'paper_size' => 'string|max:20',
            'paper_orientation' => 'string|in:portrait,landscape',
            'paper_unit' => 'string|in:mm,inch',
            'paper_width' => 'nullable|numeric|min:10|max:1000',
            'paper_height' => 'nullable|numeric|min:10|max:2000',
            'margin_top' => 'nullable|numeric|min:0|max:100',
            'margin_right' => 'nullable|numeric|min:0|max:100',
            'margin_bottom' => 'nullable|numeric|min:0|max:100',
            'margin_left' => 'nullable|numeric|min:0|max:100',
            'row_height' => 'nullable|numeric|min:1|max:100',
            'max_columns' => 'nullable|integer|min:1|max:50',
            'header_height' => 'nullable|numeric|min:0|max:200',
            'footer_height' => 'nullable|numeric|min:0|max:200',
            'list_style_config' => 'nullable|array',
        ]);

        // list_style_config is auto-encoded by Eloquent array cast — no manual json_encode needed
        $form->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Report Pattern Form updated',
            'data' => $form->fresh()->load('elements'),
        ]);
    }

    // ========== REPORT PATTERN ELEMENTS ==========

    /**
     * Elemente einer Form abrufen
     * GET /api/report-pattern-forms/{id}/elements
     */
    public function elements(int $id): JsonResponse
    {
        $form = ReportPatternForm::with('elements')->find($id);

        if (!$form) {
            return response()->json(['success' => false, 'error' => 'Report Pattern Form not found'], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $form->elements,
        ]);
    }

    /**
     * Elemente einer Form speichern (Bulk)
     * PUT /api/report-pattern-forms/{id}/elements
     */
    public function saveElements(Request $request, int $id): JsonResponse
    {
        $user = Auth::user();
        $form = ReportPatternForm::with('pattern')->find($id);

        if (!$form) {
            return response()->json(['success' => false, 'error' => 'Report Pattern Form not found'], 404);
        }

        if ((int)($form->pattern->creator_user_id) !== (int)($user->id)) {
            return response()->json(['success' => false, 'error' => 'Unauthorized'], 403);
        }

        $elements = $request->input('elements', []);

        DB::transaction(function () use ($form, $elements) {
            $existingIds = collect($elements)->pluck('id')->filter()->toArray();

            // Nicht mehr vorhandene Elemente loeschen
            $form->elements()->whereNotIn('id', $existingIds)->delete();

            foreach ($elements as $index => $elementData) {
                $data = [
                    'report_pattern_form_id' => $form->id,
                    'element_type' => $elementData['element_type'] ?? $elementData['type'] ?? 'container',
                    'x_position' => $elementData['x_position'] ?? $elementData['x'] ?? 0,
                    'y_position' => $elementData['y_position'] ?? $elementData['y'] ?? 0,
                    'width' => $elementData['width'] ?? 180,
                    'height' => $elementData['height'] ?? 50,
                    'container_columns' => $elementData['container_columns'] ?? $elementData['columns'] ?? 1,
                    'container_gap' => $elementData['container_gap'] ?? $elementData['gap'] ?? 2.00,
                    'max_fields' => $elementData['max_fields'] ?? null,
                    'field_height' => $elementData['field_height'] ?? null,
                    'content' => $elementData['content'] ?? null,
                    'content_labels' => $elementData['content_labels'] ?? null,
                    'font_family' => $elementData['font_family'] ?? null,
                    'font_size' => $elementData['font_size'] ?? null,
                    'font_weight' => $elementData['font_weight'] ?? null,
                    'font_style' => $elementData['font_style'] ?? null,
                    'text_decoration' => $elementData['text_decoration'] ?? null,
                    'text_align' => $elementData['text_align'] ?? null,
                    'text_color' => $elementData['text_color'] ?? null,
                    'border_width' => $elementData['border_width'] ?? null,
                    'border_color' => $elementData['border_color'] ?? null,
                    'background_color' => $elementData['background_color'] ?? null,
                    'label' => $elementData['label'] ?? null,
                    'linked_element_id' => $elementData['linked_element_id'] ?? null,
                    'sort_order' => $elementData['sort_order'] ?? $index,
                    'is_visible' => $elementData['is_visible'] ?? $elementData['visible'] ?? true,
                ];

                if (!empty($elementData['id'])) {
                    ReportPatternElement::where('id', $elementData['id'])->update($data);
                } else {
                    ReportPatternElement::create($data);
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Elements saved',
            'data' => $form->fresh()->elements,
        ]);
    }

    /**
     * Einzelnes Element hinzufuegen
     * POST /api/report-pattern-forms/{id}/elements
     */
    public function addElement(Request $request, int $id): JsonResponse
    {
        $user = Auth::user();
        $form = ReportPatternForm::with('pattern')->find($id);

        if (!$form) {
            return response()->json(['success' => false, 'error' => 'Report Pattern Form not found'], 404);
        }

        if ((int)($form->pattern->creator_user_id) !== (int)($user->id)) {
            return response()->json(['success' => false, 'error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'element_type' => 'required|string|in:container,header_section,detail_section,footer_section,table_header,static_text,heading,line_horizontal,line_vertical,box,page_number,page_date,page_total,image_placeholder',
            'x_position' => 'numeric',
            'y_position' => 'numeric',
            'width' => 'numeric',
            'height' => 'numeric',
            'label' => 'nullable|string|max:255',
            'container_columns' => 'nullable|integer|min:1|max:10',
            'container_gap' => 'nullable|numeric|min:0',
            'max_fields' => 'nullable|integer|min:1',
            'field_height' => 'nullable|numeric|min:0',
            'content' => 'nullable|string|max:1000',
            'content_labels' => 'nullable|array',
            'font_family' => 'nullable|string|max:100',
            'font_size' => 'nullable|numeric|min:1|max:200',
            'font_weight' => 'nullable|string|in:normal,bold',
            'font_style' => 'nullable|string|in:normal,italic',
            'text_decoration' => 'nullable|string|in:none,underline,line-through',
            'text_align' => 'nullable|string|in:left,center,right',
            'text_color' => 'nullable|string|max:20',
            'border_width' => 'nullable|numeric|min:0',
            'border_color' => 'nullable|string|max:20',
            'background_color' => 'nullable|string|max:20',
        ]);

        $maxOrder = $form->elements()->max('sort_order') ?? 0;

        $element = $form->elements()->create(array_merge($validated, [
            'sort_order' => $maxOrder + 1,
        ]));

        // Auto-create table_header when detail_section is added
        $autoCreatedHeader = null;
        if ($validated['element_type'] === 'detail_section') {
            $headerHeight = 15; // Default 15mm header height
            $autoCreatedHeader = $form->elements()->create([
                'element_type' => 'table_header',
                'x_position' => $element->x_position,
                'y_position' => max(0, (float) $element->y_position - $headerHeight),
                'width' => $element->width,
                'height' => $headerHeight,
                'linked_element_id' => $element->id,
                'label' => 'Table Header',
                'container_columns' => 1,
                'container_gap' => 2.00,
                'sort_order' => $maxOrder + 2,
                'is_visible' => true,
            ]);
        }

        $responseData = $autoCreatedHeader
            ? [$element, $autoCreatedHeader]
            : $element;

        return response()->json([
            'success' => true,
            'message' => 'Element added',
            'data' => $responseData,
        ], 201);
    }

    /**
     * Element loeschen
     * DELETE /api/report-pattern-elements/{id}
     */
    public function deleteElement(int $id): JsonResponse
    {
        $user = Auth::user();
        $element = ReportPatternElement::with('form.pattern')->find($id);

        if (!$element) {
            return response()->json(['success' => false, 'error' => 'Element not found'], 404);
        }

        if ((int)($element->form->pattern->creator_user_id) !== (int)($user->id)) {
            return response()->json(['success' => false, 'error' => 'Unauthorized'], 403);
        }

        // Cascade: deleting detail_section also deletes its linked table_header
        if ($element->element_type === 'detail_section') {
            ReportPatternElement::where('linked_element_id', $element->id)->delete();
        }

        $element->delete();

        return response()->json([
            'success' => true,
            'message' => 'Element deleted',
        ]);
    }

    /**
     * Pre-flight usage check for a Report Pattern — same idea as the FormSet
     * usage endpoint: returns referencing schema_tables and projects so the
     * frontend can warn before opening a delete confirmation.
     * GET /api/report-patterns/{id}/usage
     */
    public function usage(int $id): JsonResponse
    {
        $pattern = ReportPattern::find($id);
        if (!$pattern) {
            return response()->json(['success' => false, 'error' => 'Report Pattern not found'], 404);
        }

        // BOLA guard: usage info reveals which tables and projects reference
        // a pattern — that's metadata about other users' projects if the
        // pattern is shared/public. Restrict to creator + public/system.
        if (!$this->canReadPattern($pattern, Auth::user())) {
            return response()->json(['success' => false, 'error' => 'You do not have permission to view this report pattern.'], 403);
        }

        $tables = \App\Models\SchemaTable::where('report_pattern_id', $id)
            ->get(['id', 'table_name', 'schema_id'])
            ->map(fn($t) => [
                'id' => $t->id,
                'table_name' => $t->table_name,
                'schema_id' => $t->schema_id,
            ])->values();

        $projects = ProjectReportPattern::where('report_pattern_id', $id)
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

    // ========== PROJECT DEFAULT ==========

    /**
     * Set the project's active (default) ReportPattern.
     * POST /api/projects/{projectId}/active-report-pattern
     */
    public function activateForProject(Request $request, int $projectId): JsonResponse
    {
        // BOLA guard: require edit permission on the target project. Without
        // this, any authenticated user could activate any report pattern on
        // any project by passing its projectId.
        $project = Project::find($projectId);
        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }
        if (!$project->userCanEditProject(Auth::user())) {
            return response()->json(['success' => false, 'message' => 'You do not have permission to edit this project.'], 403);
        }

        $validated = $request->validate([
            'report_pattern_id' => 'required|integer|exists:report_patterns,id',
        ]);
        $link = ProjectReportPattern::activateForProject($projectId, $validated['report_pattern_id']);
        return response()->json([
            'success' => true,
            'message' => 'Report Pattern activated for project',
            'data' => $link->load('reportPattern'),
        ]);
    }

    /**
     * Get the project's currently active (default) ReportPattern, or null.
     * GET /api/projects/{projectId}/active-report-pattern
     */
    public function getProjectReportPattern(int $projectId): JsonResponse
    {
        // BOLA guard: leaks which pattern a foreign project uses. Require
        // visibility on the project itself — public projects are still
        // readable by everyone, same as the rest of the project read-API.
        $project = Project::find($projectId);
        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }
        if (!$project->isVisibleTo(Auth::user())) {
            return response()->json(['success' => false, 'message' => 'You do not have permission to view this project.'], 403);
        }

        $pattern = ProjectReportPattern::getActiveForProject($projectId);
        return response()->json([
            'success' => true,
            'data' => $pattern,
        ]);
    }

    /**
     * Clear the project's active ReportPattern (= "no default").
     * DELETE /api/projects/{projectId}/active-report-pattern
     */
    public function deactivateForProject(int $projectId): JsonResponse
    {
        // BOLA guard — same reason as activateForProject above.
        $project = Project::find($projectId);
        if (!$project) {
            return response()->json(['success' => false, 'message' => 'Project not found'], 404);
        }
        if (!$project->userCanEditProject(Auth::user())) {
            return response()->json(['success' => false, 'message' => 'You do not have permission to edit this project.'], 403);
        }

        ProjectReportPattern::deactivateForProject($projectId);
        return response()->json([
            'success' => true,
            'message' => 'Project default Report Pattern cleared',
        ]);
    }

    /**
     * Project IDs this Report Pattern is ACTIVELY linked to. Mirrors
     * FormDesignerController::getLinkedProjects — only is_active=true rows count
     * (a deactivated link is a soft-unlink, not "in use").
     * GET /api/report-patterns/{id}/linked-projects
     */
    public function getLinkedProjects(int $id): JsonResponse
    {
        $pattern = ReportPattern::find($id);
        if (!$pattern) {
            return response()->json(['success' => false, 'error' => 'Report Pattern not found'], 404);
        }

        $linkedProjectIds = ProjectReportPattern::where('report_pattern_id', $id)
            ->where('is_active', true)
            ->pluck('project_id')
            ->toArray();

        return response()->json([
            'success' => true,
            'data' => $linkedProjectIds,
        ]);
    }

    // ========== EXPORT / IMPORT (portable JSON blueprint) ==========

    /**
     * Export a Report Pattern as a portable JSON blueprint: the pattern plus
     * its forms and each form's elements. Per-table layout placements
     * (ReportLayoutElement) are intentionally NOT included — they are project/
     * table-specific, not part of the reusable template. The frontend saves the
     * returned envelope as a .json file.
     *
     * GET /api/report-patterns/{id}/export
     */
    public function exportPattern(int $id): JsonResponse
    {
        $user = Auth::user();
        $pattern = ReportPattern::with('forms.elements')->find($id);
        if (!$pattern) {
            return response()->json(['success' => false, 'error' => 'Report Pattern not found'], 404);
        }
        if ($pattern->creator_user_id !== $user->id && $pattern->visibility !== 'public' && !$user->isAdmin()) {
            return response()->json(['success' => false, 'error' => 'Unauthorized'], 403);
        }

        $formFields    = array_diff((new ReportPatternForm)->getFillable(), ['report_pattern_id']);
        $elementFields = (new ReportPatternElement)->getFillable(); // keep linked_element_id (orig id) for re-wiring on import

        $data = [
            'name'        => $pattern->name,
            'description' => $pattern->description,
            'forms' => $pattern->forms->map(function (ReportPatternForm $f) use ($formFields, $elementFields) {
                $form = \Illuminate\Support\Arr::only($f->toArray(), $formFields);
                $form['elements'] = $f->elements->map(function (ReportPatternElement $e) use ($elementFields) {
                    $el = \Illuminate\Support\Arr::only($e->toArray(), $elementFields);
                    $el['_ref'] = $e->id; // original id — used to re-wire linked_element_id on import
                    return $el;
                })->values();
                $layoutData = $this->buildFormLayouts($f);
                $form['layouts'] = $layoutData['tables'];                   // per-table field placements
                $form['static_placements'] = $layoutData['form'];           // form-level (no table)
                return $form;
            })->values(),
        ];

        return response()->json([
            'scoriet_type' => 'report_pattern',
            'version'      => 1,
            'exported_at'  => now()->toIso8601String(),
            'data'         => $data,
        ]);
    }

    /**
     * Build the NAME-based per-table layouts for one report form, plus any
     * form-level (no-table) layout elements. Returns ['tables' => groups,
     * 'form' => flat]. FK ids → names (schema/table/field); the design element
     * reference (container_element_id) is kept as the original id and re-wired
     * via the element id map on import. report_layout_elements have no self-FK.
     */
    private function buildFormLayouts(ReportPatternForm $form): array
    {
        $els = \App\Models\ReportLayoutElement::where('report_pattern_form_id', $form->id)
            ->orderBy('sort_order')->get();
        if ($els->isEmpty()) {
            return ['tables' => [], 'form' => []];
        }

        $tables = \App\Models\SchemaTable::with('floatingSchema:id,name')
            ->whereIn('id', $els->pluck('schema_table_id')->filter()->unique()->all())->get()->keyBy('id');
        $fields = \App\Models\SchemaField::whereIn('id', $els->pluck('schema_field_id')->filter()->unique()->all())
            ->get()->keyBy('id');

        $elFields = array_diff(
            (new \App\Models\ReportLayoutElement)->getFillable(),
            ['report_pattern_form_id', 'schema_table_id', 'schema_field_id', 'container_element_id']
        );

        $serialize = function (\App\Models\ReportLayoutElement $el) use ($elFields, $fields): array {
            $row = \Illuminate\Support\Arr::only($el->toArray(), $elFields);
            $row['schema_field_name']     = $el->schema_field_id ? ($fields[$el->schema_field_id]->field_name ?? null) : null;
            $row['container_element_ref'] = $el->container_element_id; // original element id → remapped on apply
            return $row;
        };

        $groups = [];
        $formLevel = [];
        foreach ($els as $el) {
            if ($el->schema_table_id) {
                $tbl = $tables[$el->schema_table_id] ?? null;
                $schemaName = $tbl?->floatingSchema?->name;
                $tableName  = $tbl?->table_name;
                if (!$schemaName || !$tableName) {
                    continue;
                }
                $key = $schemaName . "\0" . $tableName;
                if (!isset($groups[$key])) {
                    $groups[$key] = ['schema_name' => $schemaName, 'table_name' => $tableName, 'placements' => []];
                }
                $groups[$key]['placements'][] = $serialize($el);
            } else {
                $formLevel[] = $serialize($el);
            }
        }
        return ['tables' => array_values($groups), 'form' => $formLevel];
    }

    /**
     * Import a Report Pattern from a JSON blueprint (see exportPattern). ALWAYS
     * creates a new private pattern owned by the current user — never overwrites
     * — and appends a numbered suffix on a name clash. Element self-references
     * (linked_element_id) are re-wired to the freshly created ids in a second
     * pass.
     *
     * POST /api/report-patterns/import   (body: the exported envelope)
     */
    public function importPattern(Request $request): JsonResponse
    {
        $user = Auth::user();
        $validated = $request->validate([
            'scoriet_type' => 'required|string',
            'data'         => 'required|array',
            'data.name'    => 'nullable|string|max:100',
        ]);
        if ($validated['scoriet_type'] !== 'report_pattern') {
            return response()->json(['success' => false, 'error' => 'This file is not a Report Pattern export.'], 422);
        }
        // Read the FULL data array from the request — $validated['data'] would
        // only contain the explicitly-ruled sub-keys (data.name), dropping forms.
        $d = $request->input('data', []);
        $applyLayouts = (bool) $request->input('apply_layouts', false);

        $formFields    = array_diff((new ReportPatternForm)->getFillable(), ['report_pattern_id']);
        $elementFields = array_diff((new ReportPatternElement)->getFillable(), ['report_pattern_form_id', 'linked_element_id']);

        $result = DB::transaction(function () use ($user, $d, $formFields, $elementFields, $applyLayouts) {
            $pat = ReportPattern::create([
                'name'            => ReportPattern::suggestCopyName($d['name'] ?? 'Imported Report Pattern', $user->id),
                'description'     => $d['description'] ?? null,
                'creator_user_id' => $user->id,
                'visibility'      => 'private',
                'is_active'       => true,
            ]);

            // ReportPattern::created auto-seeds default forms (+ elements) — drop
            // them before importing the blueprint's own forms.
            $defaultFormIds = $pat->forms()->pluck('id')->all();
            if (!empty($defaultFormIds)) {
                ReportPatternElement::whereIn('report_pattern_form_id', $defaultFormIds)->delete();
                ReportPatternForm::whereIn('id', $defaultFormIds)->delete();
            }

            $idMap = [];          // original element _ref => new element id
            $pendingLinks = [];   // new element id => original linked _ref
            $formTypeToId = [];   // form_type => new form id (for layout apply)

            foreach (($d['forms'] ?? []) as $f) {
                $form = ReportPatternForm::create(array_merge(
                    \Illuminate\Support\Arr::only($f, $formFields),
                    ['report_pattern_id' => $pat->id]
                ));
                if (!empty($f['form_type'])) {
                    $formTypeToId[$f['form_type']] = $form->id;
                }
                foreach (($f['elements'] ?? []) as $e) {
                    $element = ReportPatternElement::create(array_merge(
                        \Illuminate\Support\Arr::only($e, $elementFields),
                        ['report_pattern_form_id' => $form->id]
                    ));
                    if (isset($e['_ref'])) {
                        $idMap[$e['_ref']] = $element->id;
                    }
                    if (!empty($e['linked_element_id'])) {
                        $pendingLinks[$element->id] = $e['linked_element_id'];
                    }
                }
            }

            // Second pass: re-wire element links to the new ids.
            foreach ($pendingLinks as $newElId => $oldLinkRef) {
                if (isset($idMap[$oldLinkRef])) {
                    ReportPatternElement::where('id', $newElId)->update(['linked_element_id' => $idMap[$oldLinkRef]]);
                }
            }

            $layoutStats = $applyLayouts
                ? $this->applyImportedReportLayouts($d['forms'] ?? [], $formTypeToId, $idMap, $user->id)
                : null;

            return ['pat' => $pat, 'layoutStats' => $layoutStats];
        });

        return response()->json([
            'success'      => true,
            'message'      => 'Report Pattern imported',
            'data'         => $result['pat']->load('forms.elements'),
            'layout_stats' => $result['layoutStats'],
        ], 201);
    }

    /**
     * Apply imported per-table (and form-level) report layouts, best-effort &
     * name-matched. Form-level (no-table) elements apply unconditionally;
     * per-table elements apply only where the schema+table match by NAME for the
     * importing user. Element references re-wire via the element id map.
     */
    private function applyImportedReportLayouts(array $forms, array $formTypeToId, array $idMap, int $userId): array
    {
        $elFillable = (new \App\Models\ReportLayoutElement)->getFillable();
        $applied = 0;
        $matched = [];
        $skipped = [];

        foreach ($forms as $f) {
            $formType  = $f['form_type'] ?? null;
            $newFormId = $formType ? ($formTypeToId[$formType] ?? null) : null;
            if (!$newFormId) {
                continue;
            }

            // Form-level (no-table) layout elements — applied unconditionally.
            \App\Models\ReportLayoutElement::where('report_pattern_form_id', $newFormId)
                ->whereNull('schema_table_id')->delete();
            foreach (($f['static_placements'] ?? []) as $row) {
                $createData = \Illuminate\Support\Arr::only($row, $elFillable);
                $createData['report_pattern_form_id'] = $newFormId;
                $createData['schema_table_id']        = null;
                $createData['schema_field_id']        = null;
                $createData['container_element_id']   = isset($row['container_element_ref']) ? ($idMap[$row['container_element_ref']] ?? null) : null;
                \App\Models\ReportLayoutElement::create($createData);
                $applied++;
            }

            // Per-table layouts — matched by NAME against the user's own schemas.
            foreach (($f['layouts'] ?? []) as $layout) {
                $schemaName = $layout['schema_name'] ?? null;
                $tableName  = $layout['table_name'] ?? null;
                if (!$schemaName || !$tableName) {
                    continue;
                }
                $label = $schemaName . ' / ' . $tableName;

                $table = \App\Models\SchemaTable::where('table_name', $tableName)
                    ->whereHas('floatingSchema', function ($q) use ($schemaName, $userId) {
                        $q->where('name', $schemaName)->where('owner_id', $userId);
                    })->first();

                if (!$table) {
                    $skipped[$label] = true;
                    continue;
                }
                $matched[$label] = true;

                $fieldMap = \App\Models\SchemaField::where('table_id', $table->id)->pluck('id', 'field_name');

                \App\Models\ReportLayoutElement::where('report_pattern_form_id', $newFormId)
                    ->where('schema_table_id', $table->id)->delete();

                foreach (($layout['placements'] ?? []) as $row) {
                    $createData = \Illuminate\Support\Arr::only($row, $elFillable);
                    $createData['report_pattern_form_id'] = $newFormId;
                    $createData['schema_table_id']        = $table->id;

                    if (!empty($row['schema_field_name'])) {
                        $fid = $fieldMap[$row['schema_field_name']] ?? null;
                        if (!$fid) {
                            continue; // field missing in target table -> skip
                        }
                        $createData['schema_field_id'] = $fid;
                    } else {
                        $createData['schema_field_id'] = null;
                    }

                    $createData['container_element_id'] = isset($row['container_element_ref']) ? ($idMap[$row['container_element_ref']] ?? null) : null;
                    \App\Models\ReportLayoutElement::create($createData);
                    $applied++;
                }
            }
        }

        return [
            'applied'        => $applied,
            'tables_matched' => array_keys($matched),
            'tables_skipped' => array_keys($skipped),
        ];
    }

    /**
     * Read-only pre-flight for the import "also bring the layouts?" prompt —
     * reports the report layouts whose schema+table match (by NAME) for the
     * importing user. Makes NO changes.
     *
     * POST /api/report-patterns/import/preview-layouts
     */
    public function previewImportLayouts(Request $request): JsonResponse
    {
        $user = Auth::user();
        $d = $request->input('data', []);

        $matched = [];
        $unmatched = [];
        $seen = [];
        foreach (($d['forms'] ?? []) as $f) {
            foreach (($f['layouts'] ?? []) as $layout) {
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

                $entry = ['schema_name' => $schemaName, 'table_name' => $tableName, 'placements' => count($layout['placements'] ?? [])];
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
