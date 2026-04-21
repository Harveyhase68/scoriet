<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReportLayoutElement;
use App\Models\ReportPatternElement;
use App\Models\ReportPatternForm;
use App\Models\SchemaTable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ReportLayoutController extends Controller
{
    /**
     * Authorize access to a report pattern form
     */
    private function authorizeForm(int $formId): ?ReportPatternForm
    {
        $user = Auth::user();
        $form = ReportPatternForm::with('pattern')->find($formId);

        if (!$form) return null;
        if ((int)($form->pattern->creator_user_id) !== (int)($user->id) && !$user->isAdmin()) return null;

        return $form;
    }

    /**
     * Get all layout elements for a form
     * GET /api/report-layout/{formId}/elements?table_id={tableId}
     */
    public function index(int $formId, Request $request): JsonResponse
    {
        $form = $this->authorizeForm($formId);
        if (!$form) {
            return response()->json(['success' => false, 'error' => 'Form not found or unauthorized'], 404);
        }

        $query = ReportLayoutElement::forForm($formId)
            ->with(['schemaField', 'containerElement'])
            ->orderBy('sort_order');

        $tableId = $request->query('table_id');
        if ($tableId) {
            // Felder fuer eine bestimmte Tabelle + report controls (ohne schema_table_id)
            $query->where(function ($q) use ($tableId) {
                $q->where('schema_table_id', $tableId)
                  ->orWhereNull('schema_table_id');
            });
        }

        return response()->json([
            'success' => true,
            'data' => $query->get(),
        ]);
    }

    /**
     * Bulk save layout elements
     * PUT /api/report-layout/{formId}/elements
     */
    public function savePlacements(Request $request, int $formId): JsonResponse
    {
        $form = $this->authorizeForm($formId);
        if (!$form) {
            return response()->json(['success' => false, 'error' => 'Form not found or unauthorized'], 404);
        }

        $tableId = $request->input('table_id');
        $elements = $request->input('elements', []);

        DB::transaction(function () use ($form, $tableId, $elements) {
            $existingIds = collect($elements)->pluck('id')->filter()->toArray();

            // Bestehende Elemente loeschen, die nicht mehr im Request sind
            $deleteQuery = ReportLayoutElement::forForm($form->id);
            if ($tableId) {
                $deleteQuery->where(function ($q) use ($tableId) {
                    $q->where('schema_table_id', $tableId)
                      ->orWhereNull('schema_table_id');
                });
            }
            $deleteQuery->whereNotIn('id', $existingIds)->delete();

            // Get valid container IDs for this form to prevent FK violations
            $validContainerIds = \App\Models\ReportPatternElement::where('report_pattern_form_id', $form->id)
                ->pluck('id')
                ->toArray();

            foreach ($elements as $index => $data) {
                // Validate container_element_id exists — set to null if orphaned
                $containerId = $data['container_element_id'] ?? null;
                if ($containerId && !in_array((int) $containerId, $validContainerIds)) {
                    $containerId = null;
                }

                $attributes = [
                    'report_pattern_form_id' => $form->id,
                    'container_element_id' => $containerId,
                    'element_type' => $data['element_type'] ?? 'field',
                    'schema_table_id' => !empty($data['schema_table_id']) ? $data['schema_table_id'] : (!empty($tableId) ? $tableId : null),
                    'schema_field_id' => !empty($data['schema_field_id']) ? $data['schema_field_id'] : null,
                    'x_position' => $data['x_position'] ?? 0,
                    'y_position' => $data['y_position'] ?? 0,
                    'width' => $data['width'] ?? 40,
                    'height' => $data['height'] ?? 5,
                    'content' => $data['content'] ?? null,
                    'font_family' => $data['font_family'] ?? 'Arial',
                    'font_size' => $data['font_size'] ?? 10.00,
                    'font_weight' => $data['font_weight'] ?? 'normal',
                    'font_style' => $data['font_style'] ?? 'normal',
                    'text_decoration' => $data['text_decoration'] ?? 'none',
                    'text_align' => $data['text_align'] ?? 'left',
                    'text_color' => $data['text_color'] ?? '#000000',
                    'border_width' => $data['border_width'] ?? null,
                    'border_color' => $data['border_color'] ?? null,
                    'background_color' => $data['background_color'] ?? null,
                    'caption_override' => $data['caption_override'] ?? null,
                    'caption_labels' => $data['caption_labels'] ?? null,
                    'label_position' => $data['label_position'] ?? 'top',
                    'label_width' => $data['label_width'] ?? null,
                    'control_type' => $data['control_type'] ?? null,
                    'header_style' => $data['header_style'] ?? null,
                    'sort_order' => $data['sort_order'] ?? $index,
                    'is_visible' => $data['is_visible'] ?? true,
                ];

                if (!empty($data['id'])) {
                    $element = ReportLayoutElement::find($data['id']);
                    if ($element) {
                        $element->update($attributes);
                    }
                } else {
                    ReportLayoutElement::create($attributes);
                }
            }
        });

        // For report_list: recalculate x_position from cumulative column widths
        if ($form->form_type === 'report_list') {
            $fieldElements = ReportLayoutElement::forForm($form->id)
                ->where('element_type', 'field')
                ->orderBy('sort_order')
                ->get();

            $xOffset = 0;
            foreach ($fieldElements as $el) {
                if ((float) $el->x_position !== round($xOffset, 2)) {
                    $el->update(['x_position' => round($xOffset, 2)]);
                }
                $xOffset += (float) $el->width;
            }
        }

        $updated = ReportLayoutElement::forForm($form->id)
            ->with(['schemaField', 'containerElement'])
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Layout elements saved',
            'data' => $updated,
        ]);
    }

    /**
     * Auto-place fields from a schema table into containers
     * POST /api/report-layout/{formId}/auto-place
     */
    public function autoPlace(Request $request, int $formId): JsonResponse
    {
        $form = ReportPatternForm::with(['pattern', 'elements'])->find($formId);
        $user = Auth::user();

        if (!$form) {
            return response()->json(['success' => false, 'error' => 'Form not found'], 404);
        }

        if ((int)($form->pattern->creator_user_id) !== (int)($user->id) && !$user->isAdmin()) {
            return response()->json(['success' => false, 'error' => 'Unauthorized'], 403);
        }

        $tableId = $request->input('table_id');
        if (!$tableId) {
            return response()->json(['success' => false, 'error' => 'table_id is required'], 400);
        }

        // Language is used by computeAutoPlacements() to pick the primary
        // caption from schema_translations. The full per-language map is
        // always built and persisted on the element so the user can switch
        // languages in the designer without re-running auto-place.
        $language = $request->input('language');

        $table = SchemaTable::with('fields')->find($tableId);
        if (!$table) {
            return response()->json(['success' => false, 'error' => 'Table not found'], 404);
        }

        // Delete ALL existing field placements first (not just for this table) to prevent
        // ghost columns lingering from previous auto-place runs.
        ReportLayoutElement::where('report_pattern_form_id', $form->id)
            ->where('element_type', 'field')
            ->delete();

        // Compute the placement layout via the shared pure helper. This is the
        // single source of truth — both this endpoint (which then persists) and
        // the code generator's transient fallback use the same algorithm.
        $computed = ReportLayoutElement::computeAutoPlacements($form, $table, $language);

        if (empty($computed)) {
            return response()->json([
                'success' => true,
                'message' => '0 fields auto-placed',
                'data' => [],
            ]);
        }

        // Persist the computed array. Map the GTree-shape back to fillable columns.
        //
        // caption_labels is persisted as a snapshot of schema_translations at
        // auto-place time. The frontend reads caption_labels[selectedLanguage]
        // to show the right text; toGTreeArray() uses it during code generation.
        // caption_override is intentionally NOT set here — it is reserved for
        // user-edited overrides made in the designer.
        $placements = [];
        foreach ($computed as $row) {
            $placements[] = ReportLayoutElement::create([
                'report_pattern_form_id' => $form->id,
                'container_element_id'   => $row['container_id'],
                'element_type'           => $row['type'],
                'schema_table_id'        => $row['schema_table_id'] ?? $tableId,
                'schema_field_id'        => $row['schema_field_id'] ?? null,
                'x_position'             => $row['x'],
                'y_position'             => $row['y'],
                'width'                  => $row['width'],
                'height'                 => $row['height'],
                'font_family'            => $row['font_family'],
                'font_size'              => $row['font_size'],
                'text_color'             => $row['text_color'],
                'label_position'         => $row['label_position'] ?? null,
                'label_width'            => $row['label_width'] ?? null,
                'control_type'           => $row['control_type'] === 'field' ? null : $row['control_type'],
                'caption_labels'         => !empty($row['caption_labels']) ? $row['caption_labels'] : null,
                'sort_order'             => $row['z_order'],
                'is_visible'             => $row['visible'],
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => count($placements) . ' fields auto-placed',
            'data' => ReportLayoutElement::forForm($form->id)
                ->with(['schemaField', 'containerElement'])
                ->orderBy('sort_order')
                ->get(),
        ]);
    }

    /**
     * Delete a single layout element
     * DELETE /api/report-layout/elements/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $user = Auth::user();
        $element = ReportLayoutElement::with('form.pattern')->find($id);

        if (!$element) {
            return response()->json(['success' => false, 'error' => 'Layout element not found'], 404);
        }

        if ((int)($element->form->pattern->creator_user_id) !== (int)($user->id) && !$user->isAdmin()) {
            return response()->json(['success' => false, 'error' => 'Unauthorized'], 403);
        }

        $element->delete();

        return response()->json([
            'success' => true,
            'message' => 'Layout element deleted',
        ]);
    }

    /**
     * Copy non-section pattern elements as editable layout elements.
     * POST /api/report-layout/{formId}/copy-pattern-controls
     */
    public function copyPatternControls(int $formId): JsonResponse
    {
        $form = $this->authorizeForm($formId);
        if (!$form) {
            return response()->json(['success' => false, 'error' => 'Form not found or unauthorized'], 404);
        }

        $sectionTypes = ['container', 'header_section', 'detail_section', 'footer_section', 'table_header'];

        // Get all non-section pattern elements
        $patternControls = ReportPatternElement::where('report_pattern_form_id', $form->id)
            ->whereNotIn('element_type', $sectionTypes)
            ->orderBy('sort_order')
            ->get();

        if ($patternControls->isEmpty()) {
            return response()->json([
                'success' => true,
                'message' => 'No pattern controls to copy',
                'copied' => 0,
            ]);
        }

        // Find which pattern controls already have layout copies (matched by container_element_id)
        $existingCopyIds = ReportLayoutElement::where('report_pattern_form_id', $form->id)
            ->whereNotNull('container_element_id')
            ->pluck('container_element_id')
            ->toArray();

        $copied = 0;
        $maxSort = ReportLayoutElement::where('report_pattern_form_id', $form->id)->max('sort_order') ?? 0;

        foreach ($patternControls as $pel) {
            if (in_array($pel->id, $existingCopyIds)) {
                continue; // Already has a layout copy
            }

            // Map pattern element_type to layout element_type
            $layoutType = $pel->element_type;
            if (!in_array($layoutType, ReportLayoutElement::ELEMENT_TYPES)) {
                $layoutType = 'static_text'; // Fallback
            }

            $maxSort++;
            ReportLayoutElement::create([
                'report_pattern_form_id' => $form->id,
                'container_element_id' => $pel->id,
                'element_type' => $layoutType,
                'x_position' => $pel->x_position,
                'y_position' => $pel->y_position,
                'width' => $pel->width,
                'height' => $pel->height,
                'content' => $pel->content,
                'font_family' => $pel->font_family ?? 'Arial',
                'font_size' => $pel->font_size ?? 10,
                'font_weight' => $pel->font_weight ?? 'normal',
                'font_style' => $pel->font_style ?? 'normal',
                'text_decoration' => $pel->text_decoration ?? 'none',
                'text_align' => $pel->text_align ?? 'left',
                'text_color' => $pel->text_color ?? '#000000',
                'border_width' => $pel->border_width,
                'border_color' => $pel->border_color,
                'background_color' => $pel->background_color,
                'caption_override' => $pel->label,
                'caption_labels' => $pel->content_labels ?? null,
                'sort_order' => $maxSort,
                'is_visible' => true,
            ]);
            $copied++;
        }

        return response()->json([
            'success' => true,
            'message' => $copied . ' pattern controls copied',
            'copied' => $copied,
        ]);
    }
}
