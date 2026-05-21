<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReportPattern;
use App\Models\ReportPatternForm;
use App\Models\ReportPatternElement;
use App\Models\ProjectReportPattern;
use App\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ReportPatternController extends Controller
{
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
            'name' => 'required|string|max:100',
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
            'name' => 'string|max:100',
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
        // by any project as the project default.
        $inUseByTables = \App\Models\SchemaTable::where('report_pattern_id', $id)
            ->get(['id', 'table_name', 'schema_id']);
        $inUseByProjects = ProjectReportPattern::where('report_pattern_id', $id)->count();

        if ($inUseByTables->isNotEmpty() || $inUseByProjects > 0) {
            return response()->json([
                'success' => false,
                'error' => 'Report Pattern is in use and cannot be deleted.',
                'in_use_by_tables' => $inUseByTables->map(fn($t) => [
                    'table_id' => $t->id,
                    'table_name' => $t->table_name,
                ])->values(),
                'in_use_by_projects' => $inUseByProjects,
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
        ProjectReportPattern::deactivateForProject($projectId);
        return response()->json([
            'success' => true,
            'message' => 'Project default Report Pattern cleared',
        ]);
    }
}
