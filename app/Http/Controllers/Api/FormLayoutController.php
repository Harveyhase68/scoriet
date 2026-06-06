<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FormItemPlacement;
use App\Models\FormLayoutTab;
use App\Models\FormWindow;
use App\Models\FormElement;
use App\Models\SchemaTable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class FormLayoutController extends Controller
{
    /**
     * Vertical offset reserved at the top of a tab_container before the first
     * field starts. The visible tab strip itself is 32 px (see designer &
     * preview CSS); the extra 10 px is intentional breathing room so the
     * first row of controls doesn't kiss the strip's underside.
     */
    private const TAB_HEADER_HEIGHT = 42;
    /**
     * Authorize access to a form window
     */
    private function authorizeWindow(int $windowId): ?FormWindow
    {
        $user = Auth::user();
        $window = FormWindow::with('formSet')->find($windowId);

        if (!$window) return null;
        if ($window->formSet->creator_user_id !== $user->id && !$user->isAdmin()) return null;

        return $window;
    }

    /**
     * Get all field placements for a window+table combination
     * GET /api/form-layout/{windowId}/placements?table_id={tableId}
     */
    public function index(int $windowId, Request $request): JsonResponse
    {
        $window = $this->authorizeWindow($windowId);
        if (!$window) {
            return response()->json(['success' => false, 'error' => 'Window not found or unauthorized'], 404);
        }

        $tableId = $request->query('table_id');
        if (!$tableId) {
            return response()->json(['success' => false, 'error' => 'table_id is required'], 400);
        }

        $placements = FormItemPlacement::fields()
            ->forWindowAndTable($windowId, $tableId)
            ->with(['schemaField', 'containerElement'])
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $placements,
        ]);
    }

    /**
     * Bulk save field placements for a window+table combination
     * PUT /api/form-layout/{windowId}/placements
     */
    public function savePlacements(Request $request, int $windowId): JsonResponse
    {
        $window = $this->authorizeWindow($windowId);
        if (!$window) {
            return response()->json(['success' => false, 'error' => 'Window not found or unauthorized'], 404);
        }

        $tableId = $request->input('table_id');
        $placements = $request->input('placements', []);

        // table_id can be 0/null for report controls (static_text, lines, etc.)
        // Only require for non-report window types
        if (!$tableId && !collect($placements)->contains(fn($p) => in_array($p['control_type'] ?? '', ['static_text', 'heading', 'line_horizontal', 'line_vertical', 'box', 'page_number', 'page_date', 'page_total', 'image_placeholder']))) {
            return response()->json(['success' => false, 'error' => 'table_id is required'], 400);
        }

        DB::transaction(function () use ($window, $tableId, $placements) {
            $existingIds = collect($placements)->pluck('id')->filter()->toArray();

            // Delete placements for this window+table (or all field placements if no table)
            if ($tableId) {
                FormItemPlacement::fields()
                    ->forWindowAndTable($window->id, $tableId)
                    ->whereNotIn('id', $existingIds)
                    ->delete();
            } else {
                FormItemPlacement::fields()
                    ->forWindow($window->id)
                    ->whereNotIn('id', $existingIds)
                    ->delete();
            }

            foreach ($placements as $index => $data) {
                $attributes = [
                    'form_window_id' => $window->id,
                    'item_type' => 'field',
                    'schema_table_id' => !empty($data['schema_table_id']) ? $data['schema_table_id'] : (!empty($tableId) ? $tableId : null),
                    'schema_field_id' => !empty($data['schema_field_id']) ? $data['schema_field_id'] : null,
                    'container_element_id' => $data['container_element_id'],
                    'tab_panel_id' => $data['tab_panel_id'] ?? null,
                    'x_position' => $data['x_position'] ?? 0,
                    'y_position' => $data['y_position'] ?? 0,
                    'width' => $data['width'] ?? 200,
                    'height' => $data['height'] ?? 40,
                    'anchor_right' => $data['anchor_right'] ?? null,
                    'anchor_bottom' => $data['anchor_bottom'] ?? null,
                    'anchor_width' => $data['anchor_width'] ?? null,
                    'anchor_height' => $data['anchor_height'] ?? null,
                    'caption_override' => $data['caption_override'] ?? null,
                    'caption_labels' => $data['caption_labels'] ?? null,
                    'label_position' => $data['label_position'] ?? 'top',
                    'label_width' => $data['label_width'] ?? 100,
                    'control_type' => $data['control_type'] ?? $data['control_type_override'] ?? null,
                    'lookup_table_id' => $data['lookup_table_id'] ?? null,
                    'lookup_value_field' => $data['lookup_value_field'] ?? null,
                    'lookup_display_field' => $data['lookup_display_field'] ?? null,
                    'lookup_sort_field' => $data['lookup_sort_field'] ?? null,
                    'lookup_sort_direction' => $data['lookup_sort_direction'] ?? null,
                    'button_background_color' => $data['button_background_color'] ?? null,
                    'button_text_color' => $data['button_text_color'] ?? null,
                    'button_icon' => $data['button_icon'] ?? null,
                    'style_config' => $data['style_config'] ?? null,
                    'sort_order' => $data['sort_order'] ?? $index,
                    'tab_order' => isset($data['tab_order']) ? max(-1, min(999999, (int)$data['tab_order'])) : 0,
                    'is_visible' => $data['is_visible'] ?? true,
                ];

                if (!empty($data['id'])) {
                    $placement = FormItemPlacement::find($data['id']);
                    if ($placement) {
                        $placement->update($attributes);
                    }
                } else {
                    FormItemPlacement::create($attributes);
                }
            }
        });

        $updatedPlacements = FormItemPlacement::fields()
            ->forWindowAndTable($window->id, $tableId)
            ->with(['schemaField', 'containerElement'])
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Placements saved',
            'data' => $updatedPlacements,
        ]);
    }

    /**
     * Auto-place all fields from a table into the first container
     * POST /api/form-layout/{windowId}/auto-place
     */
    public function autoPlace(Request $request, int $windowId): JsonResponse
    {
        $window = FormWindow::with(['formSet', 'elements'])->find($windowId);
        $user = Auth::user();

        if (!$window) {
            return response()->json(['success' => false, 'error' => 'Window not found'], 404);
        }

        if ($window->formSet->creator_user_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['success' => false, 'error' => 'Unauthorized'], 403);
        }

        $tableId = $request->input('table_id');
        if (!$tableId) {
            return response()->json(['success' => false, 'error' => 'table_id is required'], 400);
        }

        $table = SchemaTable::with('fields')->find($tableId);
        if (!$table) {
            return response()->json(['success' => false, 'error' => 'Table not found'], 404);
        }

        // Only true layout containers are candidates. tab_panel rows belong to
        // form_layout_tabs in the new design; the elements list never carries
        // them anymore. Plain `container` and `tab_container` are the two
        // legitimate placement targets at the template level.
        $containers = $window->elements
            ->whereIn('element_type', ['container', 'tab_container'])
            ->values();

        if ($containers->isEmpty()) {
            return response()->json(['success' => false, 'error' => 'No containers found in this window'], 400);
        }

        // Wipe the previous layout for this window+table — both field
        // placements AND any auto-generated tabs. We always rebuild from
        // scratch so the field count → tab count relationship stays tight.
        FormItemPlacement::fields()->forWindowAndTable($window->id, $tableId)->delete();
        FormLayoutTab::where('form_window_id', $window->id)
            ->where('schema_table_id', $tableId)
            ->delete();

        // Pre-resolve geometry for the first container and (if applicable)
        // create the first tab record for a tab_container. The state machine
        // below advances either a tab counter (tab_container) or a container
        // counter (plain container) when max_fields is exceeded.
        $placements = [];
        $containerIdx = 0;
        $fieldCount = 0;
        $currentContainer = $containers[$containerIdx];
        $currentTab = $this->ensureFirstTab($currentContainer, $window->id, $tableId);
        [$columns, $maxFields, $fieldWidth, $fieldHeight, $gap, $yOffset] = $this->resolveContainerGeometry($currentContainer);

        foreach ($table->fields as $index => $field) {
            if ($field->is_auto_increment) continue;
            if (in_array($field->field_name, ['created_at', 'updated_at', 'deleted_at'])) continue;

            if ($maxFields && $fieldCount >= $maxFields) {
                // tab_container: stay on the same container, spawn a fresh tab.
                // plain container: hop to the next container in the template.
                if ($currentContainer->element_type === 'tab_container') {
                    $nextSort = ($currentTab?->sort_order ?? -1) + 1;
                    $currentTab = FormLayoutTab::create([
                        'form_window_id' => $window->id,
                        'schema_table_id' => $tableId,
                        'tab_container_element_id' => $currentContainer->id,
                        'sort_order' => $nextSort,
                        'tab_label' => 'Tab ' . ($nextSort + 1),
                    ]);
                    $fieldCount = 0;
                } else {
                    $containerIdx++;
                    if ($containerIdx >= $containers->count()) break;
                    $currentContainer = $containers[$containerIdx];
                    $currentTab = $this->ensureFirstTab($currentContainer, $window->id, $tableId);
                    [$columns, $maxFields, $fieldWidth, $fieldHeight, $gap, $yOffset] = $this->resolveContainerGeometry($currentContainer);
                    $fieldCount = 0;
                }
            }

            $col = $fieldCount % $columns;
            $row = intval($fieldCount / $columns);
            $x = $col * ($fieldWidth + $gap);
            $y = $yOffset + $row * ($fieldHeight + $gap);

            $placements[] = FormItemPlacement::create([
                'form_window_id' => $window->id,
                'item_type' => 'field',
                'schema_table_id' => $tableId,
                'schema_field_id' => $field->id,
                'container_element_id' => $currentContainer->id,
                'tab_panel_id' => $currentTab?->id,
                'x_position' => $x,
                'y_position' => $y,
                'width' => $fieldWidth,
                'height' => $fieldHeight,
                'sort_order' => $index,
                'is_visible' => true,
            ]);

            $fieldCount++;
        }

        return response()->json([
            'success' => true,
            'message' => count($placements) . ' fields auto-placed',
            'data' => FormItemPlacement::fields()
                ->forWindowAndTable($window->id, $tableId)
                ->with(['schemaField', 'containerElement'])
                ->orderBy('sort_order')
                ->get(),
            'tabs' => FormLayoutTab::where('form_window_id', $window->id)
                ->where('schema_table_id', $tableId)
                ->orderBy('sort_order')
                ->get(),
        ]);
    }

    /**
     * If the given container is a tab_container, ensure a first tab record
     * exists for (window × table × this container) and return it. For plain
     * containers (no tabs), returns null.
     */
    private function ensureFirstTab(FormElement $container, int $windowId, int $tableId): ?FormLayoutTab
    {
        if ($container->element_type !== 'tab_container') {
            return null;
        }
        return FormLayoutTab::create([
            'form_window_id' => $windowId,
            'schema_table_id' => $tableId,
            'tab_container_element_id' => $container->id,
            'sort_order' => 0,
            'tab_label' => 'Tab 1',
        ]);
    }

    /**
     * Resolve the per-container layout numbers used by auto-place:
     * [columns, maxFields, fieldWidth, fieldHeight, gap, yOffset].
     *
     * yOffset is non-zero for tab_container so fields don't render on top
     * of the tab strip.
     *
     * @return array{0:int,1:?int,2:int,3:int,4:int,5:int}
     */
    private function resolveContainerGeometry(FormElement $container): array
    {
        $columns = $container->container_columns ?? 1;
        $maxFields = $container->max_fields;
        $gap = $container->container_gap ?? 8;
        $fieldHeight = $container->default_control_height ?? 40;
        $usableWidth = max(0, $container->width - 20);
        $fieldWidth = $columns > 1 ? intval($usableWidth / $columns) : $usableWidth;
        $yOffset = $container->element_type === 'tab_container' ? self::TAB_HEADER_HEIGHT : 0;

        return [$columns, $maxFields, $fieldWidth, $fieldHeight, $gap, $yOffset];
    }

    /**
     * Delete a single placement
     * DELETE /api/form-layout/placements/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $user = Auth::user();
        $placement = FormItemPlacement::with('formWindow.formSet')->find($id);

        if (!$placement) {
            return response()->json(['success' => false, 'error' => 'Placement not found'], 404);
        }

        if ($placement->formWindow->formSet->creator_user_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['success' => false, 'error' => 'Unauthorized'], 403);
        }

        $placement->delete();

        return response()->json([
            'success' => true,
            'message' => 'Placement deleted',
        ]);
    }

    // ========== BUTTON PLACEMENTS ==========

    /**
     * Get all button placements for a window
     * GET /api/form-layout/{windowId}/buttons
     */
    public function getButtonPlacements(int $windowId): JsonResponse
    {
        $window = $this->authorizeWindow($windowId);
        if (!$window) {
            return response()->json(['success' => false, 'error' => 'Window not found or unauthorized'], 404);
        }

        $buttons = FormItemPlacement::buttons()
            ->forWindow($windowId)
            ->orderBy('sort_order')
            ->get();

        // First time this window is opened: no button placements yet → seed them
        // from the template (with geometry, action AND per-language labels) so the
        // layout editor shows the buttons immediately and in the correct language.
        // NON-DESTRUCTIVE: only runs when nothing exists, so a subsequent Load
        // never overwrites positions/labels the user has changed. To force a full
        // re-sync from the template, the user uses Auto-Place.
        if ($buttons->isEmpty()) {
            $this->seedButtonPlacementsFromTemplate($window);
            $buttons = FormItemPlacement::buttons()
                ->forWindow($windowId)
                ->orderBy('sort_order')
                ->get();
        }

        return response()->json([
            'success' => true,
            'data' => $buttons,
        ]);
    }

    /**
     * Bulk save button placements for a window
     * PUT /api/form-layout/{windowId}/buttons
     */
    public function saveButtonPlacements(Request $request, int $windowId): JsonResponse
    {
        $window = $this->authorizeWindow($windowId);
        if (!$window) {
            return response()->json(['success' => false, 'error' => 'Window not found or unauthorized'], 404);
        }

        $buttons = $request->input('buttons', []);

        DB::transaction(function () use ($window, $buttons) {
            $existingIds = collect($buttons)->pluck('id')->filter()->toArray();

            FormItemPlacement::buttons()
                ->forWindow($window->id)
                ->whereNotIn('id', $existingIds)
                ->delete();

            foreach ($buttons as $index => $data) {
                $attributes = [
                    'form_window_id' => $window->id,
                    'item_type' => 'button',
                    'form_element_id' => $data['form_element_id'] ?? null,
                    'button_type' => $data['button_type'],
                    'button_label' => $data['button_label'] ?? null,
                    'button_labels' => $data['button_labels'] ?? null,
                    'button_icon' => $data['button_icon'] ?? null,
                    'button_action' => $data['button_action'] ?? null,
                    'button_background_color' => $data['button_background_color'] ?? null,
                    'button_text_color' => $data['button_text_color'] ?? null,
                    'x_position' => $data['x_position'] ?? 0,
                    'y_position' => $data['y_position'] ?? 0,
                    'width' => $data['width'] ?? 120,
                    'height' => $data['height'] ?? 36,
                    'anchor_right' => $data['anchor_right'] ?? null,
                    'anchor_bottom' => $data['anchor_bottom'] ?? null,
                    'anchor_width' => $data['anchor_width'] ?? null,
                    'anchor_height' => $data['anchor_height'] ?? null,
                    'sort_order' => $data['sort_order'] ?? $index,
                    'tab_order' => isset($data['tab_order']) ? max(-1, min(999999, (int)$data['tab_order'])) : 0,
                    'is_visible' => $data['is_visible'] ?? true,
                ];

                if (!empty($data['id'])) {
                    $btn = FormItemPlacement::find($data['id']);
                    if ($btn) {
                        $btn->update($attributes);
                    }
                } else {
                    FormItemPlacement::create($attributes);
                }
            }
        });

        $updatedButtons = FormItemPlacement::buttons()
            ->forWindow($window->id)
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Button placements saved',
            'data' => $updatedButtons,
        ]);
    }

    /**
     * Auto-place buttons from FormWindow elements
     * POST /api/form-layout/{windowId}/auto-place-buttons
     */
    public function autoPlaceButtons(int $windowId): JsonResponse
    {
        $user = Auth::user();
        $window = FormWindow::with(['formSet', 'elements'])->find($windowId);

        if (!$window) {
            return response()->json(['success' => false, 'error' => 'Window not found'], 404);
        }

        if ($window->formSet->creator_user_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['success' => false, 'error' => 'Unauthorized'], 403);
        }

        // Hard re-sync: drop the existing button placements and recreate them
        // from the template's button elements. Auto-Place is the explicit "pull
        // everything from the template again" action, so it re-reads geometry,
        // anchors, action, colors AND per-language labels — picking up template
        // translations the user added after the buttons were first placed.
        FormItemPlacement::buttons()->forWindow($window->id)->delete();
        $count = $this->seedButtonPlacementsFromTemplate($window);

        return response()->json([
            'success' => true,
            'message' => $count . ' buttons placed',
            'data' => FormItemPlacement::buttons()
                ->forWindow($window->id)
                ->orderBy('sort_order')
                ->get(),
        ]);
    }

    /**
     * Create button placements for a window from its template button elements.
     *
     * Single source of truth used by BOTH auto-place (hard re-sync) and the
     * first-time load (create-if-missing). Each placement is seeded with the
     * element's geometry, anchors, action, icon, colors AND its per-language
     * labels (FormElement.custom_style['button_labels']) — so the layout editor
     * and the generator render the correct language without a separate sync.
     * The caller is responsible for clearing any rows that should be replaced.
     *
     * @return int number of button placements created
     */
    private function seedButtonPlacementsFromTemplate(FormWindow $window): int
    {
        $window->loadMissing('elements');

        $buttonElements = $window->elements->filter(function ($el) {
            return in_array($el->element_type, [
                'button_nav_first', 'button_nav_prev', 'button_nav_next', 'button_nav_last',
                'button_save', 'button_cancel', 'button_close', 'button_new', 'button_delete', 'button_custom',
            ]);
        })->values();

        foreach ($buttonElements as $index => $el) {
            FormItemPlacement::create([
                'form_window_id' => $window->id,
                'item_type' => 'button',
                'form_element_id' => $el->id,
                'button_type' => $el->element_type,
                'button_label' => $el->button_label,
                // Per-language labels live on the element's custom_style.
                // data_get is null-safe (custom_style may be null/absent).
                'button_labels' => data_get($el->custom_style, 'button_labels'),
                'button_icon' => $el->effective_icon,
                'button_action' => $el->button_action,
                'button_background_color' => $el->button_background_color,
                'button_text_color' => $el->button_text_color,
                'x_position' => $el->x_position,
                'y_position' => $el->y_position,
                'width' => $el->width ?: 120,
                'height' => $el->height ?: 36,
                'anchor_right' => $el->anchor_right,
                'anchor_bottom' => $el->anchor_bottom,
                'anchor_width' => $el->anchor_width,
                'anchor_height' => $el->anchor_height,
                'sort_order' => $index,
                'tab_order' => $el->tab_order ?? 0,
                'is_visible' => $el->is_visible,
            ]);
        }

        return $buttonElements->count();
    }

    // ========== MENU ITEM PLACEMENTS ==========

    /**
     * Get all menu item placements for a window
     * GET /api/form-layout/{windowId}/menu-items
     */
    public function getMenuPlacements(int $windowId): JsonResponse
    {
        $window = $this->authorizeWindow($windowId);
        if (!$window) {
            return response()->json(['success' => false, 'error' => 'Window not found or unauthorized'], 404);
        }

        $menuItems = FormItemPlacement::menuItems()
            ->forWindow($windowId)
            ->with(['schemaTable', 'childItems'])
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $menuItems,
        ]);
    }

    /**
     * Bulk save menu item placements for a window
     * PUT /api/form-layout/{windowId}/menu-items
     */
    public function saveMenuPlacements(Request $request, int $windowId): JsonResponse
    {
        $window = $this->authorizeWindow($windowId);
        if (!$window) {
            return response()->json(['success' => false, 'error' => 'Window not found or unauthorized'], 404);
        }

        $menuItems = $request->input('menu_items', []);

        DB::transaction(function () use ($window, $menuItems) {
            $existingIds = collect($menuItems)->pluck('id')->filter()->toArray();

            // Delete menu items not in the submitted list
            FormItemPlacement::menuItems()
                ->forWindow($window->id)
                ->whereNotIn('id', $existingIds)
                ->delete();

            // First pass: create/update all items (without parent_placement_id to avoid FK issues)
            $idMap = []; // temp_id → real_id
            foreach ($menuItems as $index => $data) {
                $attributes = [
                    'form_window_id' => $window->id,
                    'item_type' => 'menu_item',
                    'container_element_id' => $data['container_element_id'] ?? null,
                    'schema_table_id' => $data['schema_table_id'] ?? null,
                    'caption_override' => $data['caption_override'] ?? null,
                    'caption_labels' => $data['caption_labels'] ?? null,
                    'menu_icon' => $data['menu_icon'] ?? null,
                    'menu_action' => $data['menu_action'] ?? null,
                    'menu_role_required' => $data['menu_role_required'] ?? null,
                    'menu_depth' => $data['menu_depth'] ?? 0,
                    'x_position' => $data['x_position'] ?? 0,
                    'y_position' => $data['y_position'] ?? 0,
                    'width' => $data['width'] ?? 200,
                    'height' => $data['height'] ?? 32,
                    'anchor_right' => $data['anchor_right'] ?? null,
                    'anchor_bottom' => $data['anchor_bottom'] ?? null,
                    'anchor_width' => $data['anchor_width'] ?? null,
                    'anchor_height' => $data['anchor_height'] ?? null,
                    'sort_order' => $data['sort_order'] ?? $index,
                    'tab_order' => isset($data['tab_order']) ? max(-1, min(999999, (int)$data['tab_order'])) : 0,
                    'is_visible' => $data['is_visible'] ?? true,
                    'parent_placement_id' => null, // Set in second pass
                ];

                if (!empty($data['id'])) {
                    $item = FormItemPlacement::find($data['id']);
                    if ($item) {
                        $item->update($attributes);
                        $idMap[$data['id']] = $item->id;
                    }
                } else {
                    $item = FormItemPlacement::create($attributes);
                    // Map temp_id (frontend-generated) to real DB id
                    $tempId = $data['temp_id'] ?? $data['id'] ?? null;
                    if ($tempId) {
                        $idMap[$tempId] = $item->id;
                    }
                    $idMap['new_' . $index] = $item->id;
                }
            }

            // Second pass: set parent_placement_id references
            foreach ($menuItems as $index => $data) {
                $parentRef = $data['parent_placement_id'] ?? null;
                if ($parentRef === null) continue;

                // Resolve parent ID (could be real ID or temp_id)
                $realParentId = $idMap[$parentRef] ?? $parentRef;

                $itemId = $data['id'] ?? null;
                $realItemId = $itemId ? ($idMap[$itemId] ?? $itemId) : ($idMap['new_' . $index] ?? null);

                if ($realItemId && $realParentId) {
                    FormItemPlacement::where('id', $realItemId)->update([
                        'parent_placement_id' => $realParentId,
                    ]);
                }
            }
        });

        $updatedItems = FormItemPlacement::menuItems()
            ->forWindow($window->id)
            ->with(['schemaTable', 'childItems'])
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Menu items saved',
            'data' => $updatedItems,
        ]);
    }

    /**
     * Auto-place all tables from a schema as flat menu items
     * POST /api/form-layout/{windowId}/auto-place-menu
     */
    public function autoPlaceMenu(Request $request, int $windowId): JsonResponse
    {
        $user = Auth::user();
        $window = FormWindow::with(['formSet', 'elements'])->find($windowId);

        if (!$window) {
            return response()->json(['success' => false, 'error' => 'Window not found'], 404);
        }

        if ($window->formSet->creator_user_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['success' => false, 'error' => 'Unauthorized'], 403);
        }

        $schemaId = $request->input('schema_id');
        if (!$schemaId) {
            return response()->json(['success' => false, 'error' => 'schema_id is required'], 400);
        }

        // Find the menu_container element
        $menuContainer = $window->elements->firstWhere('element_type', 'menu_container');
        if (!$menuContainer) {
            return response()->json(['success' => false, 'error' => 'No menu_container found in this window'], 400);
        }

        // Get all tables from the schema
        $tables = SchemaTable::where('schema_id', $schemaId)
            ->orderBy('sort_order')
            ->orderBy('table_name')
            ->get();

        if ($tables->isEmpty()) {
            return response()->json(['success' => false, 'error' => 'No tables found in schema'], 400);
        }

        // Delete existing menu placements
        FormItemPlacement::menuItems()->forWindow($window->id)->delete();

        $containerWidth = $menuContainer->width ?: 200;
        $menuItemHeight = 32;
        $gap = 2;
        $placements = [];

        foreach ($tables as $index => $table) {
            $placements[] = FormItemPlacement::create([
                'form_window_id' => $window->id,
                'item_type' => 'menu_item',
                'container_element_id' => $menuContainer->id,
                'schema_table_id' => $table->id,
                'caption_override' => null, // Uses table caption/name
                'menu_icon' => 'pi-table',
                'menu_depth' => 0,
                'x_position' => 0,
                'y_position' => $index * ($menuItemHeight + $gap),
                'width' => $containerWidth,
                'height' => $menuItemHeight,
                'sort_order' => $index,
                'is_visible' => true,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => count($placements) . ' menu items placed',
            'data' => FormItemPlacement::menuItems()
                ->forWindow($window->id)
                ->with(['schemaTable', 'childItems'])
                ->orderBy('sort_order')
                ->get(),
        ]);
    }

    // ========== FORM LAYOUT TABS ==========

    /**
     * List tabs for a (window × table) combination.
     * GET /api/form-windows/{windowId}/tables/{tableId}/tabs
     */
    public function listTabs(int $windowId, int $tableId): JsonResponse
    {
        $window = $this->authorizeWindow($windowId);
        if (!$window) {
            return response()->json(['success' => false, 'error' => 'Window not found or unauthorized'], 404);
        }

        $tabs = FormLayoutTab::where('form_window_id', $windowId)
            ->where('schema_table_id', $tableId)
            ->orderBy('tab_container_element_id')
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $tabs,
        ]);
    }

    /**
     * Add a tab to a tab_container at the Layout level. The new tab is
     * appended (sort_order = current max + 1) so it lands at the right
     * end of the strip.
     * POST /api/form-windows/{windowId}/tables/{tableId}/tabs
     */
    public function addTab(Request $request, int $windowId, int $tableId): JsonResponse
    {
        $window = $this->authorizeWindow($windowId);
        if (!$window) {
            return response()->json(['success' => false, 'error' => 'Window not found or unauthorized'], 404);
        }

        $data = $request->validate([
            'tab_container_element_id' => 'required|integer|exists:form_elements,id',
            'tab_label' => 'nullable|string|max:100',
            'tab_labels' => 'nullable|array',
        ]);

        // Sanity: the supplied element must belong to this window and be a
        // tab_container. Otherwise a user could attach a tab record to a
        // foreign window's element.
        $container = FormElement::where('id', $data['tab_container_element_id'])
            ->where('form_window_id', $windowId)
            ->where('element_type', 'tab_container')
            ->first();
        if (!$container) {
            return response()->json(['success' => false, 'error' => 'tab_container not found in this window'], 400);
        }

        // sort_order is 0-based. When there are no tabs yet, max() returns
        // null and we start at 0; otherwise we append after the current max.
        $currentMax = FormLayoutTab::where('form_window_id', $windowId)
            ->where('schema_table_id', $tableId)
            ->where('tab_container_element_id', $container->id)
            ->max('sort_order');
        $nextSort = $currentMax === null ? 0 : ((int) $currentMax + 1);

        $tab = FormLayoutTab::create([
            'form_window_id' => $windowId,
            'schema_table_id' => $tableId,
            'tab_container_element_id' => $container->id,
            'sort_order' => $nextSort,
            'tab_label' => $data['tab_label'] ?? ('Tab ' . ($nextSort + 1)),
            'tab_labels' => $data['tab_labels'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'data' => $tab,
        ]);
    }

    /**
     * Update a tab's label (single string + per-language map) and/or its
     * sort_order. Field assignments are not touched here.
     * PATCH /api/form-layout-tabs/{id}
     */
    public function updateTab(Request $request, int $id): JsonResponse
    {
        $user = Auth::user();
        $tab = FormLayoutTab::with('formWindow.formSet')->find($id);
        if (!$tab) {
            return response()->json(['success' => false, 'error' => 'Tab not found'], 404);
        }
        if ($tab->formWindow->formSet->creator_user_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['success' => false, 'error' => 'Unauthorized'], 403);
        }

        $data = $request->validate([
            'tab_label' => 'nullable|string|max:100',
            'tab_labels' => 'nullable|array',
            'sort_order' => 'nullable|integer|min:0',
        ]);

        $tab->update(array_filter($data, fn($v) => $v !== null));

        return response()->json([
            'success' => true,
            'data' => $tab->fresh(),
        ]);
    }

    /**
     * Delete a tab. Field placements that referenced it get their
     * tab_panel_id set to NULL via the foreign-key onDelete=set null —
     * the fields aren't deleted, they just become "no tab" until the user
     * moves them or re-runs auto-place.
     * DELETE /api/form-layout-tabs/{id}
     */
    public function deleteTab(int $id): JsonResponse
    {
        $user = Auth::user();
        $tab = FormLayoutTab::with('formWindow.formSet')->find($id);
        if (!$tab) {
            return response()->json(['success' => false, 'error' => 'Tab not found'], 404);
        }
        if ($tab->formWindow->formSet->creator_user_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['success' => false, 'error' => 'Unauthorized'], 403);
        }

        $tab->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tab deleted',
        ]);
    }
}
