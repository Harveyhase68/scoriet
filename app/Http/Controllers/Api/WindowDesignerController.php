<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\UiProcedure;
use App\Models\UiProjectConstant;
use App\Models\UiProjectEvent;
use App\Models\UiProjectGlobal;
use App\Models\UiProjectStruct;
use App\Models\UiWindow;
use App\Models\UiWindowCategory;
use App\Models\UiWindowControl;
use App\Models\UiWindowElement;
use App\Models\UiWindowEvent;
use App\Models\UiWindowMenu;
use App\Services\SmlEventImporter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * CRUD + designer endpoints for "Windows" - freely designed, project-scoped
 * screens independent of FormSets/table generation (see UiWindow model).
 *
 * Access is gated by the same credit/paywall system as the Form/Report
 * designers (GET/POST /form-designer/access|unlock in FormDesignerController)
 * - no separate access check is duplicated here, the frontend menu already
 * gates opening 'window-management'/'window-designer' through that shared
 * endpoint before any of these routes are ever called.
 */
class WindowDesignerController extends Controller
{
    /**
     * Resolve a project the current user is allowed to access, or null.
     */
    private function authorizedProject(int $projectId): ?Project
    {
        $user = Auth::user();
        $project = Project::find($projectId);

        if (! $project || ! $project->userCanAccess($user)) {
            return null;
        }

        return $project;
    }

    /**
     * Resolve a window the current user is allowed to access, or null.
     */
    private function authorizedWindow(int $windowId): ?UiWindow
    {
        $user = Auth::user();
        $window = UiWindow::with('project')->find($windowId);

        if (! $window || ! $window->project || ! $window->project->userCanAccess($user)) {
            return null;
        }

        return $window;
    }

    // ========== CATEGORIES ==========

    /**
     * GET /api/projects/{projectId}/window-categories
     */
    public function categories(int $projectId): JsonResponse
    {
        $project = $this->authorizedProject($projectId);
        if (! $project) {
            return response()->json(['success' => false, 'error' => 'Project not found or unauthorized'], 404);
        }

        $categories = UiWindowCategory::where('project_id', $projectId)
            ->orderBy('sort_order')
            ->get();

        return response()->json(['success' => true, 'data' => $categories]);
    }

    /**
     * POST /api/window-categories
     */
    public function storeCategory(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'project_id' => 'required|integer',
            'parent_id' => 'nullable|integer|exists:ui_window_categories,id',
            'name' => 'required|string|max:150',
        ]);

        $project = $this->authorizedProject($validated['project_id']);
        if (! $project) {
            return response()->json(['success' => false, 'error' => 'Project not found or unauthorized'], 404);
        }

        $maxOrder = UiWindowCategory::where('project_id', $project->id)
            ->where('parent_id', $validated['parent_id'] ?? null)
            ->max('sort_order') ?? 0;

        $category = UiWindowCategory::create([
            'project_id' => $project->id,
            'parent_id' => $validated['parent_id'] ?? null,
            'name' => $validated['name'],
            'sort_order' => $maxOrder + 1,
        ]);

        return response()->json(['success' => true, 'data' => $category], 201);
    }

    /**
     * PUT /api/window-categories/{id}
     * Also used to move a category via drag & drop (parent_id + sort_order).
     */
    public function updateCategory(Request $request, int $id): JsonResponse
    {
        $category = UiWindowCategory::with('project')->find($id);
        if (! $category || ! $category->project || ! $category->project->userCanAccess(Auth::user())) {
            return response()->json(['success' => false, 'error' => 'Category not found or unauthorized'], 404);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:150',
            'parent_id' => 'nullable|integer|exists:ui_window_categories,id',
            'sort_order' => 'sometimes|integer',
        ]);

        if (array_key_exists('parent_id', $validated) && (int) $validated['parent_id'] === (int) $id) {
            return response()->json(['success' => false, 'error' => 'A category cannot be its own parent'], 422);
        }

        $category->update($validated);

        return response()->json(['success' => true, 'data' => $category]);
    }

    /**
     * DELETE /api/window-categories/{id}
     * Never destructive: child categories/windows fall back to root via `set null` FKs.
     */
    public function destroyCategory(int $id): JsonResponse
    {
        $category = UiWindowCategory::with('project')->find($id);
        if (! $category || ! $category->project || ! $category->project->userCanAccess(Auth::user())) {
            return response()->json(['success' => false, 'error' => 'Category not found or unauthorized'], 404);
        }

        $category->delete();

        return response()->json(['success' => true]);
    }

    // ========== WINDOWS ==========

    /**
     * GET /api/projects/{projectId}/windows
     */
    public function windows(int $projectId): JsonResponse
    {
        $project = $this->authorizedProject($projectId);
        if (! $project) {
            return response()->json(['success' => false, 'error' => 'Project not found or unauthorized'], 404);
        }

        $windows = UiWindow::where('project_id', $projectId)
            ->orderBy('sort_order')
            ->get();

        return response()->json(['success' => true, 'data' => $windows]);
    }

    /**
     * POST /api/windows
     */
    public function storeWindow(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'project_id' => 'required|integer',
            'category_id' => 'nullable|integer|exists:ui_window_categories,id',
            'name' => 'required|string|max:100|regex:/^[a-z0-9_]+$/',
            'display_name' => 'nullable|string|max:150',
        ]);

        $project = $this->authorizedProject($validated['project_id']);
        if (! $project) {
            return response()->json(['success' => false, 'error' => 'Project not found or unauthorized'], 404);
        }

        if (UiWindow::where('project_id', $project->id)->where('name', $validated['name'])->exists()) {
            return response()->json(['success' => false, 'error' => 'A window with this name already exists in this project'], 422);
        }

        $maxOrder = UiWindow::where('project_id', $project->id)
            ->where('category_id', $validated['category_id'] ?? null)
            ->max('sort_order') ?? 0;

        $window = UiWindow::create([
            'project_id' => $project->id,
            'category_id' => $validated['category_id'] ?? null,
            'name' => $validated['name'],
            'display_name' => $validated['display_name'] ?? null,
            'sort_order' => $maxOrder + 1,
        ]);

        return response()->json(['success' => true, 'data' => $window], 201);
    }

    /**
     * GET /api/windows/{id}
     */
    public function showWindow(int $id): JsonResponse
    {
        $window = $this->authorizedWindow($id);
        if (! $window) {
            return response()->json(['success' => false, 'error' => 'Window not found or unauthorized'], 404);
        }

        return response()->json(['success' => true, 'data' => $window]);
    }

    /**
     * PUT /api/windows/{id}
     * Also used to move a window via drag & drop (category_id + sort_order).
     */
    public function updateWindow(Request $request, int $id): JsonResponse
    {
        $window = $this->authorizedWindow($id);
        if (! $window) {
            return response()->json(['success' => false, 'error' => 'Window not found or unauthorized'], 404);
        }

        $validated = $request->validate([
            'category_id' => 'nullable|integer|exists:ui_window_categories,id',
            'name' => 'sometimes|string|max:100|regex:/^[a-z0-9_]+$/',
            'display_name' => 'nullable|string|max:150',
            'display_name_labels' => 'nullable|array',
            'display_name_labels.*' => 'nullable|string|max:150',
            'description' => 'nullable|string',
            'schema_table_id' => 'nullable|integer|exists:schema_tables,id',
            // min:1 (not a larger floor like 100) - a real WinDev window can
            // legitimately be smaller than that (e.g. win_ip, a ~90px-tall
            // single-field popup); the only thing worth rejecting here is a
            // degenerate zero/negative size, which the frontend's own
            // InputNumber already can't produce in the first place (its
            // onChange coerces a typed 0 back to the 1024/768 default before
            // it's ever sent).
            'canvas_width' => 'sometimes|integer|min:1',
            'canvas_height' => 'sometimes|integer|min:1',
            'background_color' => 'nullable|string|max:7',
            'window_color' => 'nullable|string|max:7',
            'text_color' => 'nullable|string|max:7',
            'background_image' => 'nullable|string',
            'has_status_bar' => 'sometimes|boolean',
            'is_active' => 'sometimes|boolean',
            'sort_order' => 'sometimes|integer',
        ]);

        if (isset($validated['name']) && $validated['name'] !== $window->name) {
            $exists = UiWindow::where('project_id', $window->project_id)
                ->where('name', $validated['name'])
                ->where('id', '!=', $window->id)
                ->exists();
            if ($exists) {
                return response()->json(['success' => false, 'error' => 'A window with this name already exists in this project'], 422);
            }
        }

        $window->update($validated);

        return response()->json(['success' => true, 'data' => $window]);
    }

    /**
     * PUT /api/windows/{id}/set-first-window - marks this window as the
     * ONE the generated app launches directly into (see
     * window_modules.dart's startupWindowId), clearing the flag on every
     * OTHER window in the same project first so at most one is ever true.
     * A dedicated endpoint rather than folding this into updateWindow()'s
     * generic `is_first_window` validation - the "clear every sibling
     * first" side effect only makes sense for an explicit, deliberate
     * "make THIS one the startup window" action, never as an incidental
     * side effect of an unrelated field update.
     */
    public function setFirstWindow(int $id): JsonResponse
    {
        $window = $this->authorizedWindow($id);
        if (! $window) {
            return response()->json(['success' => false, 'error' => 'Window not found or unauthorized'], 404);
        }

        \DB::transaction(function () use ($window) {
            UiWindow::where('project_id', $window->project_id)
                ->where('id', '!=', $window->id)
                ->where('is_first_window', true)
                ->update(['is_first_window' => false]);
            $window->update(['is_first_window' => true]);
        });

        return response()->json(['success' => true, 'data' => $window->fresh()]);
    }

    /**
     * DELETE /api/windows/{id}
     */
    public function destroyWindow(int $id): JsonResponse
    {
        $window = $this->authorizedWindow($id);
        if (! $window) {
            return response()->json(['success' => false, 'error' => 'Window not found or unauthorized'], 404);
        }

        $window->delete();

        return response()->json(['success' => true]);
    }

    // ========== ELEMENTS (layout containers) ==========

    /**
     * GET /api/windows/{id}/elements
     */
    public function elements(int $id): JsonResponse
    {
        $window = $this->authorizedWindow($id);
        if (! $window) {
            return response()->json(['success' => false, 'error' => 'Window not found or unauthorized'], 404);
        }

        return response()->json(['success' => true, 'data' => $window->elements]);
    }

    /**
     * PUT /api/windows/{id}/elements (bulk save)
     */
    public function saveElements(Request $request, int $id): JsonResponse
    {
        $window = $this->authorizedWindow($id);
        if (! $window) {
            return response()->json(['success' => false, 'error' => 'Window not found or unauthorized'], 404);
        }

        $elements = $request->input('elements', []);

        DB::transaction(function () use ($window, $elements) {
            $existingIds = collect($elements)->pluck('id')->filter()->toArray();
            $window->elements()->whereNotIn('id', $existingIds)->delete();

            if (empty($elements)) {
                return;
            }

            // A single bulk INSERT ... ON DUPLICATE KEY UPDATE instead of one
            // Eloquent create()/update() call per row - a window with, say,
            // 60 controls/elements previously meant 60+ individual round
            // trips inside this one transaction, which is the actual root
            // cause of the Window Designer's "why does Save take so long"
            // complaint (2026-09-05 bug list, item i). `id => null` for a
            // brand new row is safe in a bulk upsert: MySQL auto-generates a
            // fresh AUTO_INCREMENT value for an explicit NULL exactly like a
            // plain INSERT would, and NULL never matches an existing row so
            // ON DUPLICATE KEY UPDATE simply never fires for it. This never
            // needs to reference a SIBLING row's own freshly-generated id
            // within the same batch (which a single multi-row INSERT
            // genuinely cannot express) because a brand new tab_panel/
            // looper_row - the only element types ever created WITH a
            // parent_element_id pointing at another brand new element - are
            // always persisted individually via storeElement() first (see
            // its own doc comment) specifically so they already have a real
            // parent id by the time this bulk save ever runs.
            $now = now();
            $rows = [];
            foreach ($elements as $index => $data) {
                $rows[] = [
                    'id' => $data['id'] ?? null,
                    'window_id' => $window->id,
                    'element_type' => $data['element_type'],
                    'source_name' => $data['source_name'] ?? null,
                    'parent_element_id' => $data['parent_element_id'] ?? null,
                    'x_position' => $data['x_position'] ?? 0,
                    'y_position' => $data['y_position'] ?? 0,
                    'width' => $data['width'] ?? 100,
                    'height' => $data['height'] ?? 40,
                    'anchor_right' => $data['anchor_right'] ?? null,
                    'anchor_bottom' => $data['anchor_bottom'] ?? null,
                    'anchor_width' => $data['anchor_width'] ?? null,
                    'anchor_height' => $data['anchor_height'] ?? null,
                    'container_orientation' => $data['container_orientation'] ?? null,
                    'container_columns' => $data['container_columns'] ?? 1,
                    'container_gap' => $data['container_gap'] ?? 8,
                    'tab_label' => $data['tab_label'] ?? null,
                    'tab_labels' => isset($data['tab_labels']) ? json_encode($data['tab_labels']) : null,
                    'custom_style' => isset($data['custom_style']) ? json_encode($data['custom_style']) : null,
                    'background_color' => $data['background_color'] ?? null,
                    'tab_active_background_color' => $data['tab_active_background_color'] ?? null,
                    'tab_inactive_background_color' => $data['tab_inactive_background_color'] ?? null,
                    'tab_active_text_color' => $data['tab_active_text_color'] ?? null,
                    'tab_inactive_text_color' => $data['tab_inactive_text_color'] ?? null,
                    'tab_font_family' => $data['tab_font_family'] ?? null,
                    'tab_font_size' => $data['tab_font_size'] ?? null,
                    'tab_font_bold' => $data['tab_font_bold'] ?? false,
                    'tab_font_italic' => $data['tab_font_italic'] ?? false,
                    'tab_font_underline' => $data['tab_font_underline'] ?? false,
                    'tab_font_strikeout' => $data['tab_font_strikeout'] ?? false,
                    'looper_row_height' => $data['looper_row_height'] ?? null,
                    'tab_strip_height' => $data['tab_strip_height'] ?? null,
                    'sort_order' => $index,
                    'is_visible' => $data['is_visible'] ?? true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            UiWindowElement::upsert($rows, ['id'], [
                'element_type', 'source_name', 'parent_element_id', 'x_position', 'y_position', 'width', 'height',
                'anchor_right', 'anchor_bottom', 'anchor_width', 'anchor_height', 'container_orientation',
                'container_columns', 'container_gap', 'tab_label', 'tab_labels', 'custom_style', 'background_color',
                'tab_active_background_color', 'tab_inactive_background_color', 'tab_active_text_color',
                'tab_inactive_text_color', 'tab_font_family', 'tab_font_size', 'tab_font_bold', 'tab_font_italic',
                'tab_font_underline', 'tab_font_strikeout', 'looper_row_height', 'tab_strip_height', 'sort_order',
                'is_visible', 'updated_at',
            ]);
        });

        return response()->json(['success' => true, 'data' => $window->fresh()->elements]);
    }

    /**
     * POST /api/windows/{id}/elements (single create — used by the canvas's
     * drag-from-palette drop handler, and by the tab-container's own
     * "Add Tab" button, both of which need the new row's id back
     * immediately rather than waiting for the next bulk save).
     */
    public function storeElement(Request $request, int $id): JsonResponse
    {
        $window = $this->authorizedWindow($id);
        if (! $window) {
            return response()->json(['success' => false, 'error' => 'Window not found or unauthorized'], 404);
        }

        $data = $request->all();
        $parentElementId = $data['parent_element_id'] ?? null;
        $maxOrder = UiWindowElement::where('window_id', $window->id)
            ->where('parent_element_id', $parentElementId)
            ->max('sort_order') ?? -1;

        $element = UiWindowElement::create([
            'window_id' => $window->id,
            'element_type' => $data['element_type'],
            'source_name' => $data['source_name'] ?? null,
            'parent_element_id' => $parentElementId,
            'x_position' => $data['x_position'] ?? 0,
            'y_position' => $data['y_position'] ?? 0,
            'width' => $data['width'] ?? 100,
            'height' => $data['height'] ?? 40,
            'tab_label' => $data['tab_label'] ?? null,
            'looper_row_height' => $data['looper_row_height'] ?? null,
            'sort_order' => $data['sort_order'] ?? ($maxOrder + 1),
        ]);

        // Eloquent's create() only returns the attributes actually passed
        // in - any column left to its database default (is_visible, the
        // anchor_*/container_* columns, ...) is simply absent from this
        // in-memory instance until it's re-read. The frontend then treats
        // that missing is_visible as falsy and renders the brand-new
        // element at reduced opacity, which "fixes itself" the moment the
        // window is reloaded and the row comes back from a real SELECT.
        return response()->json(['success' => true, 'data' => $element->fresh()], 201);
    }

    /**
     * DELETE /api/window-elements/{id}
     */
    public function deleteElement(int $id): JsonResponse
    {
        $element = UiWindowElement::with('window.project')->find($id);
        if (! $element || ! $element->window || ! $element->window->project->userCanAccess(Auth::user())) {
            return response()->json(['success' => false, 'error' => 'Element not found or unauthorized'], 404);
        }

        // A tab_panel only exists as an implementation detail of its
        // tab_container - the FK's ON DELETE SET NULL (the right behavior
        // for every other parent/child relationship here, so a deleted
        // container never silently destroys what's inside it) would
        // otherwise leave its pages behind as orphaned parent_element_id
        // = null rows, which then wrongly show up as valid "parent
        // container" options with no real container to point at. Anything
        // actually placed ON one of those pages still survives via the
        // normal SET NULL cascade one level down and re-homes to the
        // window root.
        if ($element->element_type === 'tab_container') {
            UiWindowElement::where('parent_element_id', $element->id)
                ->where('element_type', 'tab_panel')
                ->delete();
        }

        // Same reasoning as tab_panel above - a looper_row only exists as
        // an implementation detail of its looper and must never survive as
        // an orphan.
        if ($element->element_type === 'looper') {
            UiWindowElement::where('parent_element_id', $element->id)
                ->where('element_type', 'looper_row')
                ->delete();
        }

        $element->delete();

        return response()->json(['success' => true]);
    }

    // ========== MENUS (window menu bar) ==========

    /**
     * Resolve a menu item the current user is allowed to access, or null.
     * Mirrors deleteElement()'s own inline lookup - there's no window id in
     * a menu item's own URL, only its id.
     */
    private function authorizedMenu(int $id): ?UiWindowMenu
    {
        $menu = UiWindowMenu::with('window.project')->find($id);
        if (! $menu || ! $menu->window || ! $menu->window->project->userCanAccess(Auth::user())) {
            return null;
        }

        return $menu;
    }

    /**
     * GET /api/windows/{id}/menus
     *
     * Returns the flat list for the whole window - the frontend builds the
     * tree client-side from parent_menu_id, same as it already does for
     * elements.
     */
    public function menus(int $id): JsonResponse
    {
        $window = $this->authorizedWindow($id);
        if (! $window) {
            return response()->json(['success' => false, 'error' => 'Window not found or unauthorized'], 404);
        }

        return response()->json(['success' => true, 'data' => $window->menus]);
    }

    /**
     * POST /api/windows/{id}/menus (single create - every structural change
     * to the menu tree persists immediately, never in a bulk batch. A bulk
     * upsert would hit the same self-referencing-batch constraint
     * saveElements() documents (a brand new child can't reference a
     * sibling's not-yet-generated id within one multi-row INSERT), so - like
     * a brand new tab_panel/looper_row - a new menu item is always created
     * one at a time against an already-existing parent.)
     */
    public function createMenu(Request $request, int $id): JsonResponse
    {
        $window = $this->authorizedWindow($id);
        if (! $window) {
            return response()->json(['success' => false, 'error' => 'Window not found or unauthorized'], 404);
        }

        $validated = $request->validate([
            'parent_menu_id' => 'nullable|integer|exists:ui_window_menus,id',
            'source_name' => 'nullable|string|max:150',
            'caption' => 'nullable|string|max:255',
            'caption_labels' => 'nullable|array',
        ]);

        $parentMenuId = $validated['parent_menu_id'] ?? null;
        if ($parentMenuId !== null) {
            $parent = UiWindowMenu::find($parentMenuId);
            if (! $parent || $parent->window_id !== $window->id) {
                return response()->json(['success' => false, 'error' => 'Parent menu item does not belong to this window'], 422);
            }
        }

        $maxOrder = UiWindowMenu::where('window_id', $window->id)
            ->where('parent_menu_id', $parentMenuId)
            ->max('sort_order') ?? -1;

        $menu = UiWindowMenu::create([
            'window_id' => $window->id,
            'parent_menu_id' => $parentMenuId,
            'source_name' => $validated['source_name'] ?? null,
            'caption' => $validated['caption'] ?? null,
            'caption_labels' => $validated['caption_labels'] ?? null,
            'sort_order' => $maxOrder + 1,
        ]);

        return response()->json(['success' => true, 'data' => $menu], 201);
    }

    /**
     * PUT /api/window-menus/{id}
     * Also used to move a menu item via drag & drop (parent_menu_id +
     * sort_order), same pattern as updateCategory().
     */
    public function updateMenu(Request $request, int $id): JsonResponse
    {
        $menu = $this->authorizedMenu($id);
        if (! $menu) {
            return response()->json(['success' => false, 'error' => 'Menu item not found or unauthorized'], 404);
        }

        $validated = $request->validate([
            'source_name' => 'sometimes|nullable|string|max:150',
            'caption' => 'sometimes|nullable|string|max:255',
            'caption_labels' => 'sometimes|nullable|array',
            'parent_menu_id' => 'sometimes|nullable|integer|exists:ui_window_menus,id',
            'sort_order' => 'sometimes|integer',
        ]);

        if (array_key_exists('parent_menu_id', $validated)) {
            if ((int) $validated['parent_menu_id'] === (int) $id) {
                return response()->json(['success' => false, 'error' => 'A menu item cannot be its own parent'], 422);
            }
            if ($validated['parent_menu_id'] !== null) {
                $parent = UiWindowMenu::find($validated['parent_menu_id']);
                if (! $parent || $parent->window_id !== $menu->window_id) {
                    return response()->json(['success' => false, 'error' => 'Parent menu item does not belong to this window'], 422);
                }
            }
        }

        $menu->update($validated);
        // authorizedMenu() eager-loads window.project for the access check -
        // drop it before serializing, or the response leaks the whole
        // project row (FTP/DB credentials, API keys) to the client.
        $menu->unsetRelation('window');

        return response()->json(['success' => true, 'data' => $menu]);
    }

    /**
     * DELETE /api/window-menus/{id}
     *
     * Deletes the item and its whole subtree - a submenu has no meaning
     * without its parent (unlike a real control placed on a tab_panel,
     * which re-homes to the window root via SET NULL), so this explicitly
     * recurses instead of relying on the FK, the same reasoning
     * deleteElement() already applies to tab_panel/looper_row.
     */
    public function deleteMenu(int $id): JsonResponse
    {
        $menu = $this->authorizedMenu($id);
        if (! $menu) {
            return response()->json(['success' => false, 'error' => 'Menu item not found or unauthorized'], 404);
        }

        $allIds = [$menu->id];
        $level = [$menu->id];
        while (! empty($level)) {
            $level = UiWindowMenu::whereIn('parent_menu_id', $level)->pluck('id')->all();
            $allIds = array_merge($allIds, $level);
        }

        UiWindowMenu::whereIn('id', $allIds)->delete();

        return response()->json(['success' => true]);
    }

    // ========== CONTROLS (widgets) ==========

    /**
     * GET /api/windows/{id}/controls
     */
    public function controls(int $id): JsonResponse
    {
        $window = $this->authorizedWindow($id);
        if (! $window) {
            return response()->json(['success' => false, 'error' => 'Window not found or unauthorized'], 404);
        }

        $controls = $window->controls()->with('schemaField')->get();

        return response()->json(['success' => true, 'data' => $controls]);
    }

    /**
     * PUT /api/windows/{id}/controls (bulk save)
     */
    public function saveControls(Request $request, int $id): JsonResponse
    {
        $window = $this->authorizedWindow($id);
        if (! $window) {
            return response()->json(['success' => false, 'error' => 'Window not found or unauthorized'], 404);
        }

        $controls = $request->input('controls', []);

        DB::transaction(function () use ($window, $controls) {
            $existingIds = collect($controls)->pluck('id')->filter()->toArray();
            $window->controls()->whereNotIn('id', $existingIds)->delete();

            if (empty($controls)) {
                return;
            }

            // Single bulk upsert instead of one Eloquent create()/update()
            // call per control - see saveElements()'s identical doc comment
            // for why this is safe (no control ever needs to reference a
            // SIBLING control's own not-yet-generated id within the same
            // batch) and why it's the actual fix for the slow-Save
            // complaint (2026-09-05 bug list, item i).
            $now = now();
            $rows = [];
            foreach ($controls as $index => $data) {
                $rows[] = [
                    'id' => $data['id'] ?? null,
                    'window_id' => $window->id,
                    'container_element_id' => $data['container_element_id'] ?? null,
                    'control_type' => $data['control_type'],
                    'source_name' => $data['source_name'] ?? null,
                    'schema_field_id' => $data['schema_field_id'] ?? null,
                    'x_position' => $data['x_position'] ?? 0,
                    'y_position' => $data['y_position'] ?? 0,
                    'width' => $data['width'] ?? 200,
                    'height' => $data['height'] ?? 40,
                    'anchor_right' => $data['anchor_right'] ?? null,
                    'anchor_bottom' => $data['anchor_bottom'] ?? null,
                    'anchor_width' => $data['anchor_width'] ?? null,
                    'anchor_height' => $data['anchor_height'] ?? null,
                    'caption_override' => $data['caption_override'] ?? null,
                    'caption_labels' => isset($data['caption_labels']) ? json_encode($data['caption_labels']) : null,
                    'shortcut_enabled' => $data['shortcut_enabled'] ?? false,
                    'shortcut' => $data['shortcut'] ?? null,
                    'comment_override' => $data['comment_override'] ?? null,
                    'comment_labels' => isset($data['comment_labels']) ? json_encode($data['comment_labels']) : null,
                    'hint_override' => $data['hint_override'] ?? null,
                    'hint_labels' => isset($data['hint_labels']) ? json_encode($data['hint_labels']) : null,
                    'label_position' => $data['label_position'] ?? 'top',
                    'label_width' => $data['label_width'] ?? 100,
                    'caption_position_horizontal' => $data['caption_position_horizontal'] ?? null,
                    'caption_position_vertical' => $data['caption_position_vertical'] ?? null,
                    'static_text_border_style' => $data['static_text_border_style'] ?? null,
                    'caption_visible' => $data['caption_visible'] ?? true,
                    'icon_position_horizontal' => $data['icon_position_horizontal'] ?? null,
                    'icon_position_vertical' => $data['icon_position_vertical'] ?? null,
                    'options' => isset($data['options']) ? json_encode($data['options']) : null,
                    'is_required' => $data['is_required'] ?? false,
                    'control_state' => $data['control_state'] ?? 'active',
                    'data_binding' => $data['data_binding'] ?? null,
                    'browsed_file' => $data['browsed_file'] ?? null,
                    'table_columns' => isset($data['table_columns']) ? json_encode($data['table_columns']) : null,
                    'default_value' => $data['default_value'] ?? null,
                    'min_value' => $data['min_value'] ?? null,
                    'max_value' => $data['max_value'] ?? null,
                    'step_value' => $data['step_value'] ?? null,
                    'control_background_color' => $data['control_background_color'] ?? null,
                    'control_text_color' => $data['control_text_color'] ?? null,
                    'header_background_color' => $data['header_background_color'] ?? null,
                    'header_text_color' => $data['header_text_color'] ?? null,
                    'row_background_color_even' => $data['row_background_color_even'] ?? null,
                    'row_height' => $data['row_height'] ?? null,
                    'icon_class' => $data['icon_class'] ?? null,
                    'icon_data' => $data['icon_data'] ?? null,
                    'icon_state_count' => $data['icon_state_count'] ?? 1,
                    'icon_mode' => $data['icon_mode'] ?? null,
                    'background_image' => $data['background_image'] ?? null,
                    'background_image_states' => $data['background_image_states'] ?? 1,
                    'style_config' => isset($data['style_config']) ? json_encode($data['style_config']) : null,
                    'font_family' => $data['font_family'] ?? null,
                    'font_size' => $data['font_size'] ?? null,
                    'font_bold' => $data['font_bold'] ?? false,
                    'font_italic' => $data['font_italic'] ?? false,
                    'font_underline' => $data['font_underline'] ?? false,
                    'font_strikeout' => $data['font_strikeout'] ?? false,
                    'sort_order' => $data['sort_order'] ?? $index,
                    'tab_order' => isset($data['tab_order']) ? max(-1, min(999999, (int) $data['tab_order'])) : 0,
                    'is_visible' => $data['is_visible'] ?? true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            UiWindowControl::upsert($rows, ['id'], [
                'container_element_id', 'control_type', 'source_name', 'schema_field_id', 'x_position', 'y_position',
                'width', 'height', 'anchor_right', 'anchor_bottom', 'anchor_width', 'anchor_height',
                'caption_override', 'caption_labels', 'shortcut_enabled', 'shortcut', 'comment_override',
                'comment_labels', 'hint_override', 'hint_labels', 'label_position', 'label_width',
                'caption_position_horizontal', 'caption_position_vertical', 'static_text_border_style', 'caption_visible',
                'icon_position_horizontal', 'icon_position_vertical', 'options', 'is_required', 'control_state',
                'data_binding', 'browsed_file', 'table_columns', 'default_value', 'min_value', 'max_value',
                'step_value', 'control_background_color', 'control_text_color', 'header_background_color',
                'header_text_color', 'row_background_color_even', 'row_height', 'icon_class', 'icon_data',
                'icon_state_count', 'icon_mode', 'background_image', 'background_image_states', 'style_config',
                'font_family', 'font_size', 'font_bold', 'font_italic', 'font_underline', 'font_strikeout',
                'sort_order', 'tab_order', 'is_visible', 'updated_at',
            ]);
        });

        $updated = $window->controls()->with('schemaField')->get();

        return response()->json(['success' => true, 'data' => $updated]);
    }

    /**
     * DELETE /api/window-controls/{id}
     */
    public function deleteControl(int $id): JsonResponse
    {
        $control = UiWindowControl::with('window.project')->find($id);
        if (! $control || ! $control->window || ! $control->window->project->userCanAccess(Auth::user())) {
            return response()->json(['success' => false, 'error' => 'Control not found or unauthorized'], 404);
        }

        $control->delete();

        return response()->json(['success' => true]);
    }

    // ========== CODE-BEHIND (SML events) ==========

    /**
     * Resolve an event's window through whichever target it's attached to,
     * verifying the requesting user can access that window's project.
     * Returns null on any mismatch (wrong window, control from a different
     * window, unauthorized project, ...) so callers can 404 uniformly.
     */
    private function authorizedEventTarget(int $windowId, ?int $controlId, ?int $elementId, ?int $menuId = null): ?UiWindow
    {
        $window = $this->authorizedWindow($windowId);
        if (! $window) {
            return null;
        }

        if ($controlId !== null) {
            $exists = UiWindowControl::where('id', $controlId)->where('window_id', $windowId)->exists();
            if (! $exists) {
                return null;
            }
        }

        if ($elementId !== null) {
            $exists = UiWindowElement::where('id', $elementId)->where('window_id', $windowId)->exists();
            if (! $exists) {
                return null;
            }
        }

        if ($menuId !== null) {
            $exists = UiWindowMenu::where('id', $menuId)->where('window_id', $windowId)->exists();
            if (! $exists) {
                return null;
            }
        }

        return $window;
    }

    /**
     * GET /api/windows/{id}/events?control_id=&element_id=&menu_id=
     * None of the three query params -> the window's own events
     * (declarations, init, ...).
     */
    public function events(int $id, Request $request): JsonResponse
    {
        $controlId = $request->query('control_id') !== null ? (int) $request->query('control_id') : null;
        $elementId = $request->query('element_id') !== null ? (int) $request->query('element_id') : null;
        $menuId = $request->query('menu_id') !== null ? (int) $request->query('menu_id') : null;

        $window = $this->authorizedEventTarget($id, $controlId, $elementId, $menuId);
        if (! $window) {
            return response()->json(['success' => false, 'error' => 'Window not found or unauthorized'], 404);
        }

        $events = UiWindowEvent::where('window_id', $id)
            ->where('control_id', $controlId)
            ->where('element_id', $elementId)
            ->where('menu_id', $menuId)
            ->get(['id', 'event_name', 'code']);

        return response()->json(['success' => true, 'data' => $events]);
    }

    /**
     * PUT /api/windows/{id}/events
     * Body: { control_id?, element_id?, menu_id?, event_name, code }
     * Upserts on the (window, control, element, menu, event_name) tuple -
     * the event either gets created (first time the user adds/edits this
     * handler) or its code is overwritten in place.
     */
    public function saveEvent(int $id, Request $request): JsonResponse
    {
        $data = $request->validate([
            'control_id' => 'nullable|integer',
            'element_id' => 'nullable|integer',
            'menu_id' => 'nullable|integer',
            'event_name' => 'required|string|max:50',
            'code' => 'nullable|string',
        ]);

        $controlId = $data['control_id'] ?? null;
        $elementId = $data['element_id'] ?? null;
        $menuId = $data['menu_id'] ?? null;

        $window = $this->authorizedEventTarget($id, $controlId, $elementId, $menuId);
        if (! $window) {
            return response()->json(['success' => false, 'error' => 'Window not found or unauthorized'], 404);
        }

        $event = UiWindowEvent::updateOrCreate(
            [
                'window_id' => $id,
                'control_id' => $controlId,
                'element_id' => $elementId,
                'menu_id' => $menuId,
                'event_name' => $data['event_name'],
            ],
            ['code' => $data['code'] ?? '']
        );

        return response()->json(['success' => true, 'data' => $event]);
    }

    /**
     * DELETE /api/window-events/{id}
     * Removes a non-default event a user added via "add event" once they
     * decide they don't need it after all.
     */
    public function deleteEvent(int $id): JsonResponse
    {
        $event = UiWindowEvent::with('window.project')->find($id);
        if (! $event || ! $event->window || ! $event->window->project->userCanAccess(Auth::user())) {
            return response()->json(['success' => false, 'error' => 'Event not found or unauthorized'], 404);
        }

        $event->delete();

        return response()->json(['success' => true]);
    }

    // ========== PROCEDURES (global + local SML procedures) ==========

    /**
     * GET /api/procedures?project_id=X  (global procedures)
     * GET /api/procedures?window_id=Y   (local procedures)
     * Exactly one of the two query params is expected.
     */
    public function procedures(Request $request): JsonResponse
    {
        $projectId = $request->query('project_id') !== null ? (int) $request->query('project_id') : null;
        $windowId = $request->query('window_id') !== null ? (int) $request->query('window_id') : null;

        if ($projectId !== null) {
            $project = $this->authorizedProject($projectId);
            if (! $project) {
                return response()->json(['success' => false, 'error' => 'Project not found or unauthorized'], 404);
            }
            $procedures = UiProcedure::where('project_id', $projectId)->whereNull('window_id')->orderBy('sort_order')->orderBy('name')->get();
        } elseif ($windowId !== null) {
            $window = $this->authorizedWindow($windowId);
            if (! $window) {
                return response()->json(['success' => false, 'error' => 'Window not found or unauthorized'], 404);
            }
            $procedures = UiProcedure::where('window_id', $windowId)->whereNull('project_id')->orderBy('sort_order')->orderBy('name')->get();
        } else {
            return response()->json(['success' => false, 'error' => 'project_id or window_id is required'], 422);
        }

        return response()->json(['success' => true, 'data' => $procedures]);
    }

    /**
     * POST /api/procedures
     * Body: { project_id? , window_id?, name, params?, return_type?, is_private?, code? }
     */
    public function storeProcedure(Request $request): JsonResponse
    {
        $data = $request->validate([
            'project_id' => 'nullable|integer',
            'window_id' => 'nullable|integer',
            'name' => 'required|string|max:150',
            'params' => 'nullable|string|max:500',
            'return_type' => 'nullable|string|max:50',
            'is_private' => 'boolean',
            'code' => 'nullable|string',
        ]);

        $projectId = $data['project_id'] ?? null;
        $windowId = $data['window_id'] ?? null;

        if (($projectId === null) === ($windowId === null)) {
            return response()->json(['success' => false, 'error' => 'Exactly one of project_id or window_id is required'], 422);
        }

        if ($projectId !== null) {
            if (! $this->authorizedProject($projectId)) {
                return response()->json(['success' => false, 'error' => 'Project not found or unauthorized'], 404);
            }
        } else {
            if (! $this->authorizedWindow($windowId)) {
                return response()->json(['success' => false, 'error' => 'Window not found or unauthorized'], 404);
            }
        }

        $procedure = UiProcedure::create([
            'project_id' => $projectId,
            'window_id' => $windowId,
            'name' => $data['name'],
            'params' => $data['params'] ?? null,
            'return_type' => $data['return_type'] ?? 'void',
            'is_private' => $data['is_private'] ?? false,
            'code' => $data['code'] ?? '',
            'sort_order' => UiProcedure::where('project_id', $projectId)->where('window_id', $windowId)->max('sort_order') + 1,
        ]);

        return response()->json(['success' => true, 'data' => $procedure]);
    }

    /**
     * PUT /api/procedures/{id}
     */
    public function updateProcedure(Request $request, int $id): JsonResponse
    {
        $procedure = UiProcedure::find($id);
        if (! $procedure || ! $this->authorizedProcedure($procedure)) {
            return response()->json(['success' => false, 'error' => 'Procedure not found or unauthorized'], 404);
        }

        $data = $request->validate([
            'name' => 'sometimes|string|max:150',
            'params' => 'nullable|string|max:500',
            'return_type' => 'nullable|string|max:50',
            'is_private' => 'boolean',
            'code' => 'nullable|string',
            'sort_order' => 'nullable|integer',
        ]);

        $procedure->update($data);

        return response()->json(['success' => true, 'data' => $procedure]);
    }

    /**
     * DELETE /api/procedures/{id}
     */
    public function deleteProcedure(int $id): JsonResponse
    {
        $procedure = UiProcedure::find($id);
        if (! $procedure || ! $this->authorizedProcedure($procedure)) {
            return response()->json(['success' => false, 'error' => 'Procedure not found or unauthorized'], 404);
        }

        $procedure->delete();

        return response()->json(['success' => true]);
    }

    private function authorizedProcedure(UiProcedure $procedure): bool
    {
        if ($procedure->project_id !== null) {
            return $this->authorizedProject($procedure->project_id) !== null;
        }
        if ($procedure->window_id !== null) {
            return $this->authorizedWindow($procedure->window_id) !== null;
        }

        return false;
    }

    // ========== PROJECT GLOBAL VARIABLES ==========

    /**
     * GET /api/project-globals?project_id=X
     */
    public function projectGlobals(Request $request): JsonResponse
    {
        $projectId = (int) $request->query('project_id');
        $project = $this->authorizedProject($projectId);
        if (! $project) {
            return response()->json(['success' => false, 'error' => 'Project not found or unauthorized'], 404);
        }

        $globals = UiProjectGlobal::where('project_id', $projectId)->orderBy('sort_order')->orderBy('name')->get();

        return response()->json(['success' => true, 'data' => $globals]);
    }

    /**
     * POST /api/project-globals
     * Body: { project_id, name, type, default_value? }
     */
    public function storeProjectGlobal(Request $request): JsonResponse
    {
        $data = $request->validate([
            'project_id' => 'required|integer',
            'name' => 'required|string|max:150',
            'type' => 'required|string|max:150',
            'default_value' => 'nullable|string|max:500',
        ]);

        if (! $this->authorizedProject($data['project_id'])) {
            return response()->json(['success' => false, 'error' => 'Project not found or unauthorized'], 404);
        }

        $global = UiProjectGlobal::updateOrCreate(
            ['project_id' => $data['project_id'], 'name' => $data['name']],
            [
                'type' => $data['type'],
                'default_value' => $data['default_value'] ?? null,
                'sort_order' => UiProjectGlobal::where('project_id', $data['project_id'])->max('sort_order') + 1,
            ]
        );

        return response()->json(['success' => true, 'data' => $global]);
    }

    /**
     * PUT /api/project-globals/{id}
     */
    public function updateProjectGlobal(Request $request, int $id): JsonResponse
    {
        $global = UiProjectGlobal::find($id);
        if (! $global || ! $this->authorizedProject($global->project_id)) {
            return response()->json(['success' => false, 'error' => 'Global variable not found or unauthorized'], 404);
        }

        $data = $request->validate([
            'name' => 'sometimes|string|max:150',
            'type' => 'sometimes|string|max:150',
            'default_value' => 'nullable|string|max:500',
            'sort_order' => 'nullable|integer',
        ]);

        $global->update($data);

        return response()->json(['success' => true, 'data' => $global]);
    }

    /**
     * DELETE /api/project-globals/{id}
     */
    public function deleteProjectGlobal(int $id): JsonResponse
    {
        $global = UiProjectGlobal::find($id);
        if (! $global || ! $this->authorizedProject($global->project_id)) {
            return response()->json(['success' => false, 'error' => 'Global variable not found or unauthorized'], 404);
        }

        $global->delete();

        return response()->json(['success' => true]);
    }

    // ========== PROJECT EVENTS (`on project <event>`) ==========

    /**
     * GET /api/project-events?project_id=X
     */
    public function projectEvents(Request $request): JsonResponse
    {
        $projectId = (int) $request->query('project_id');
        if (! $this->authorizedProject($projectId)) {
            return response()->json(['success' => false, 'error' => 'Project not found or unauthorized'], 404);
        }

        $events = UiProjectEvent::where('project_id', $projectId)->get(['id', 'event_name', 'code']);

        return response()->json(['success' => true, 'data' => $events]);
    }

    /**
     * PUT /api/project-events
     * Body: { project_id, event_name, code }
     */
    public function saveProjectEvent(Request $request): JsonResponse
    {
        $data = $request->validate([
            'project_id' => 'required|integer',
            'event_name' => 'required|string|max:50',
            'code' => 'nullable|string',
        ]);

        if (! $this->authorizedProject($data['project_id'])) {
            return response()->json(['success' => false, 'error' => 'Project not found or unauthorized'], 404);
        }

        $event = UiProjectEvent::updateOrCreate(
            ['project_id' => $data['project_id'], 'event_name' => $data['event_name']],
            ['code' => $data['code'] ?? '']
        );

        return response()->json(['success' => true, 'data' => $event]);
    }

    /**
     * DELETE /api/project-events/{id}
     */
    public function deleteProjectEvent(int $id): JsonResponse
    {
        $event = UiProjectEvent::find($id);
        if (! $event || ! $this->authorizedProject($event->project_id)) {
            return response()->json(['success' => false, 'error' => 'Event not found or unauthorized'], 404);
        }

        $event->delete();

        return response()->json(['success' => true]);
    }

    // ========== PROJECT STRUCTS ==========

    /**
     * GET /api/project-structs?project_id=X
     */
    public function projectStructs(Request $request): JsonResponse
    {
        $projectId = (int) $request->query('project_id');
        if (! $this->authorizedProject($projectId)) {
            return response()->json(['success' => false, 'error' => 'Project not found or unauthorized'], 404);
        }

        $structs = UiProjectStruct::where('project_id', $projectId)->orderBy('sort_order')->orderBy('name')->get();

        return response()->json(['success' => true, 'data' => $structs]);
    }

    /**
     * POST /api/project-structs
     * Body: { project_id, name, fields?: [{name, type, default}] }
     */
    public function storeProjectStruct(Request $request): JsonResponse
    {
        $data = $request->validate([
            'project_id' => 'required|integer',
            'name' => 'required|string|max:150',
            'fields' => 'nullable|array',
        ]);

        if (! $this->authorizedProject($data['project_id'])) {
            return response()->json(['success' => false, 'error' => 'Project not found or unauthorized'], 404);
        }

        $struct = UiProjectStruct::updateOrCreate(
            ['project_id' => $data['project_id'], 'name' => $data['name']],
            [
                'fields' => $data['fields'] ?? [],
                'sort_order' => UiProjectStruct::where('project_id', $data['project_id'])->max('sort_order') + 1,
            ]
        );

        return response()->json(['success' => true, 'data' => $struct]);
    }

    /**
     * PUT /api/project-structs/{id}
     */
    public function updateProjectStruct(Request $request, int $id): JsonResponse
    {
        $struct = UiProjectStruct::find($id);
        if (! $struct || ! $this->authorizedProject($struct->project_id)) {
            return response()->json(['success' => false, 'error' => 'Struct not found or unauthorized'], 404);
        }

        $data = $request->validate([
            'name' => 'sometimes|string|max:150',
            'fields' => 'nullable|array',
            'sort_order' => 'nullable|integer',
        ]);

        $struct->update($data);

        return response()->json(['success' => true, 'data' => $struct]);
    }

    /**
     * DELETE /api/project-structs/{id}
     */
    public function deleteProjectStruct(int $id): JsonResponse
    {
        $struct = UiProjectStruct::find($id);
        if (! $struct || ! $this->authorizedProject($struct->project_id)) {
            return response()->json(['success' => false, 'error' => 'Struct not found or unauthorized'], 404);
        }

        $struct->delete();

        return response()->json(['success' => true]);
    }

    // ========== PROJECT CONSTANTS ==========

    /**
     * GET /api/project-constants?project_id=X
     */
    public function projectConstants(Request $request): JsonResponse
    {
        $projectId = (int) $request->query('project_id');
        if (! $this->authorizedProject($projectId)) {
            return response()->json(['success' => false, 'error' => 'Project not found or unauthorized'], 404);
        }

        $constants = UiProjectConstant::where('project_id', $projectId)->orderBy('sort_order')->orderBy('name')->get();

        return response()->json(['success' => true, 'data' => $constants]);
    }

    /**
     * POST /api/project-constants
     * Body: { project_id, name, value? }
     */
    public function storeProjectConstant(Request $request): JsonResponse
    {
        $data = $request->validate([
            'project_id' => 'required|integer',
            'name' => 'required|string|max:150',
            'value' => 'nullable|string|max:500',
        ]);

        if (! $this->authorizedProject($data['project_id'])) {
            return response()->json(['success' => false, 'error' => 'Project not found or unauthorized'], 404);
        }

        $constant = UiProjectConstant::updateOrCreate(
            ['project_id' => $data['project_id'], 'name' => $data['name']],
            [
                'value' => $data['value'] ?? null,
                'sort_order' => UiProjectConstant::where('project_id', $data['project_id'])->max('sort_order') + 1,
            ]
        );

        return response()->json(['success' => true, 'data' => $constant]);
    }

    /**
     * PUT /api/project-constants/{id}
     */
    public function updateProjectConstant(Request $request, int $id): JsonResponse
    {
        $constant = UiProjectConstant::find($id);
        if (! $constant || ! $this->authorizedProject($constant->project_id)) {
            return response()->json(['success' => false, 'error' => 'Constant not found or unauthorized'], 404);
        }

        $data = $request->validate([
            'name' => 'sometimes|string|max:150',
            'value' => 'nullable|string|max:500',
            'sort_order' => 'nullable|integer',
        ]);

        $constant->update($data);

        return response()->json(['success' => true, 'data' => $constant]);
    }

    /**
     * DELETE /api/project-constants/{id}
     */
    public function deleteProjectConstant(int $id): JsonResponse
    {
        $constant = UiProjectConstant::find($id);
        if (! $constant || ! $this->authorizedProject($constant->project_id)) {
            return response()->json(['success' => false, 'error' => 'Constant not found or unauthorized'], 404);
        }

        $constant->delete();

        return response()->json(['success' => true]);
    }

    /**
     * POST /api/projects/{projectId}/windows/import-sml
     * Body: multipart, field "sml_zip" - a ZIP of .sml files (one per
     * WinDev unit, as produced by the external WinDev-to-SML converter).
     *
     * Project-scoped (not per-window) since a real export bundles every
     * window's code in one archive - but only `unit window` entries are
     * ever imported here; `unit procedures`/`unit class`/`unit report`
     * files have no window to attach to under the current schema and are
     * reported back as skipped rather than silently ignored.
     *
     * Matching is by `source_name` (exact) - both windows and their
     * controls/elements already carry the WinDev-import name that a
     * corresponding .sml unit/control declaration uses verbatim, so no
     * fuzzy matching is needed or attempted.
     */
    public function importSml(Request $request, int $projectId): JsonResponse
    {
        $project = $this->authorizedProject($projectId);
        if (! $project) {
            return response()->json(['success' => false, 'error' => 'Project not found or unauthorized'], 404);
        }

        $request->validate([
            'sml_zip' => 'required|file',
        ]);

        $zip = new \ZipArchive;
        if ($zip->open($request->file('sml_zip')->getRealPath()) !== true) {
            return response()->json(['success' => false, 'error' => 'Could not open ZIP archive'], 422);
        }

        $windowsBySourceName = UiWindow::where('project_id', $projectId)
            ->whereNotNull('source_name')
            ->get()
            ->keyBy('source_name');

        $importer = new SmlEventImporter;
        $filesProcessed = 0;
        $windowsMatched = 0;
        $eventsImported = 0;
        $proceduresImported = 0;
        $globalsImported = 0;
        $structsImported = 0;
        $constantsImported = 0;
        $warnings = [];

        for ($i = 0; $i < $zip->numFiles; $i++) {
            $entryName = $zip->getNameIndex($i);
            if (strtolower(pathinfo($entryName, PATHINFO_EXTENSION)) !== 'sml') {
                continue;
            }

            $content = $zip->getFromIndex($i);
            if ($content === false) {
                $warnings[] = basename($entryName).': could not read from archive';

                continue;
            }

            $filesProcessed++;
            $units = $importer->parse($content);

            foreach ($units as $unit) {
                // Structs/constants are type-level declarations, not window
                // behaviour - imported unconditionally regardless of unit
                // kind or whether a matching window exists (WIN_EXPORT, for
                // instance, has real structs/constants but isn't itself a
                // window in this project's Window Designer).
                foreach ($unit->structs as $struct) {
                    UiProjectStruct::updateOrCreate(
                        ['project_id' => $projectId, 'name' => $struct['name']],
                        ['fields' => $struct['fields']]
                    );
                    $structsImported++;
                }
                foreach ($unit->constants as $const) {
                    UiProjectConstant::updateOrCreate(
                        ['project_id' => $projectId, 'name' => $const['name']],
                        ['value' => $const['value']]
                    );
                    $constantsImported++;
                }

                if ($unit->kind === 'procedures') {
                    // A `unit procedures` file (COL_GlobalProcedures.wdg) is
                    // entirely global procedures, callable from any window.
                    foreach ($unit->procedures as $proc) {
                        if (trim($proc['code']) === '') {
                            continue;
                        }
                        UiProcedure::updateOrCreate(
                            ['project_id' => $projectId, 'window_id' => null, 'name' => $proc['name']],
                            [
                                'params' => $proc['params'],
                                'return_type' => $proc['return_type'] ?? 'void',
                                'is_private' => $proc['is_private'],
                                'code' => $proc['code'],
                            ]
                        );
                        $proceduresImported++;
                    }

                    continue;
                }

                if ($unit->kind === 'project') {
                    // The `.wdp` project file's own globals block - always
                    // applies to this project regardless of its own name.
                    foreach ($unit->globalVariables as $var) {
                        UiProjectGlobal::updateOrCreate(
                            ['project_id' => $projectId, 'name' => $var['name']],
                            ['type' => $var['type'], 'default_value' => $var['default']]
                        );
                        $globalsImported++;
                    }
                    foreach ($unit->projectEvents as $eventName => $code) {
                        if (trim($code) === '') {
                            continue;
                        }
                        UiProjectEvent::updateOrCreate(
                            ['project_id' => $projectId, 'event_name' => $eventName],
                            ['code' => $code]
                        );
                        $eventsImported++;
                    }

                    continue;
                }

                if ($unit->kind !== 'window') {
                    $warnings[] = basename($entryName).": '{$unit->kind}' unit \"{$unit->name}\" - only its structs/constants (if any) were imported; events and procedures are not supported for this unit kind";

                    continue;
                }

                /** @var UiWindow|null $window */
                $window = $windowsBySourceName->get($unit->name);
                if (! $window) {
                    $warnings[] = basename($entryName).": no window with source name \"{$unit->name}\" found in this project - skipped";

                    continue;
                }

                $windowsMatched++;

                foreach ($unit->procedures as $proc) {
                    if (trim($proc['code']) === '') {
                        continue;
                    }
                    UiProcedure::updateOrCreate(
                        ['project_id' => null, 'window_id' => $window->id, 'name' => $proc['name']],
                        [
                            'params' => $proc['params'],
                            'return_type' => $proc['return_type'] ?? 'void',
                            'is_private' => $proc['is_private'],
                            'code' => $proc['code'],
                        ]
                    );
                    $proceduresImported++;
                }

                // "Global" in the Code Editor's default event list IS the
                // declarations event - a unit-level `globals { }` block is
                // just the variable-declaration half of that same concept,
                // so it's merged in as a prefix rather than dropped or
                // given a schema slot of its own.
                if ($unit->globalsBody) {
                    $existing = $unit->windowEvents['declarations'] ?? null;
                    $unit->windowEvents['declarations'] = $existing
                        ? ($unit->globalsBody."\n\n".$existing)
                        : $unit->globalsBody;
                }

                foreach ($unit->windowEvents as $eventName => $code) {
                    if (trim($code) === '') {
                        continue; // nothing to bring in - never blanks an existing edit
                    }
                    UiWindowEvent::updateOrCreate(
                        ['window_id' => $window->id, 'control_id' => null, 'element_id' => null, 'menu_id' => null, 'event_name' => $eventName],
                        ['code' => $code]
                    );
                    $eventsImported++;
                }

                // A menu item's own code-behind (WIN_Menu.sml's
                // `on control "Exit" select { ... }`) is exported with
                // exactly the same "on control NAME event" syntax a real
                // control's event uses - WinDev addresses both the same
                // way. So a name that doesn't resolve to a real control is
                // tried against the window's own menu items by source_name
                // before it's given up on as unresolved.
                $controlsBySourceName = $window->controls()->whereNotNull('source_name')->get()->keyBy('source_name');
                $menusBySourceName = $window->menus()->whereNotNull('source_name')->get()->keyBy('source_name');
                foreach ($unit->controlEvents as $controlName => $events) {
                    $control = $controlsBySourceName->get($controlName);
                    $menu = $control ? null : $menusBySourceName->get($controlName);
                    if (! $control && ! $menu) {
                        $warnings[] = "{$unit->name}: control \"{$controlName}\" not found - ".count($events).' event(s) not imported';

                        continue;
                    }
                    foreach ($events as $eventName => $code) {
                        if (trim($code) === '') {
                            continue;
                        }
                        UiWindowEvent::updateOrCreate(
                            [
                                'window_id' => $window->id,
                                'control_id' => $control?->id,
                                'element_id' => null,
                                'menu_id' => $menu?->id,
                                'event_name' => $eventName,
                            ],
                            ['code' => $code]
                        );
                        $eventsImported++;
                    }
                }

                $elementsBySourceName = $window->elements()->whereNotNull('source_name')->get()->keyBy('source_name');
                foreach ($unit->blockEvents as $blockName => $events) {
                    $element = $elementsBySourceName->get($blockName);
                    if (! $element) {
                        $warnings[] = "{$unit->name}: element \"{$blockName}\" not found - ".count($events).' event(s) not imported';

                        continue;
                    }
                    foreach ($events as $eventName => $code) {
                        if (trim($code) === '') {
                            continue;
                        }
                        UiWindowEvent::updateOrCreate(
                            ['window_id' => $window->id, 'control_id' => null, 'element_id' => $element->id, 'menu_id' => null, 'event_name' => $eventName],
                            ['code' => $code]
                        );
                        $eventsImported++;
                    }
                }
            }
        }

        $zip->close();

        return response()->json([
            'success' => true,
            'data' => [
                'files_processed' => $filesProcessed,
                'windows_matched' => $windowsMatched,
                'events_imported' => $eventsImported,
                'procedures_imported' => $proceduresImported,
                'globals_imported' => $globalsImported,
                'structs_imported' => $structsImported,
                'constants_imported' => $constantsImported,
                'warnings' => $warnings,
            ],
        ]);
    }

    // ========== WINDEV IMPORT ==========

    /**
     * Best-effort mapping from WinDev/WLangage numeric control "type" codes
     * (as emitted by the customer's export script, see scripts/output.json)
     * to our universal control palette. Unmapped codes fall back to
     * 'static_text' and are reported back to the caller as a warning instead
     * of silently dropping the control or failing the whole import.
     */
    private const WINDEV_TYPE_MAP = [
        3 => ['kind' => 'control', 'type' => 'static_text'],
        4 => ['kind' => 'control', 'type' => 'button'],
        5 => ['kind' => 'control', 'type' => 'checkbox'],
        6 => ['kind' => 'control', 'type' => 'radio_button'],
        7 => ['kind' => 'control', 'type' => 'dropdown'],
        9 => ['kind' => 'control', 'type' => 'table'],
        10 => ['kind' => 'control', 'type' => 'progress_bar'],
        11 => ['kind' => 'control', 'type' => 'number'],
        16 => ['kind' => 'element', 'type' => 'tab_container'],
        30 => ['kind' => 'element', 'type' => 'looper'],
        20 => ['kind' => 'control', 'type' => 'static_text'],
        10001 => ['kind' => 'control', 'type' => 'dropdown'],
        10002 => ['kind' => 'control', 'type' => 'dropdown'],
        20001 => ['kind' => 'control', 'type' => 'text'],
        20002 => ['kind' => 'control', 'type' => 'date'],
        20003 => ['kind' => 'control', 'type' => 'time'],
        20004 => ['kind' => 'control', 'type' => 'number'],
        20005 => ['kind' => 'control', 'type' => 'decimal'],
        30001 => ['kind' => 'control', 'type' => 'image'],
    ];

    /**
     * WLangage's documented HorizontalAlignment / VerticalAlignment
     * constants (WinDev help): haLeft=0, haCenter=1, haRight=2,
     * haJustified=3, haNotDefined=-1 / vaTop=0, vaMiddle=1, vaBottom=2.
     * Only Left/Center/Right and Top/Middle/Bottom are representable in our
     * own schema - haJustified and haNotDefined (-1) are intentionally left
     * unmapped (null), which keeps the designer's own default alignment
     * instead of guessing.
     */
    private const WINDEV_ALIGN_H_MAP = [0 => 'left', 1 => 'center', 2 => 'right'];

    private const WINDEV_ALIGN_V_MAP = [0 => 'top', 1 => 'middle', 2 => 'bottom'];

    /**
     * WLangage's ..State constant (confirmed against the WinDev help by the
     * user - not every code in between is used, e.g. 2/3 are other states
     * WLangage defines that this export doesn't emit).
     */
    private const WINDEV_STATE_MAP = [0 => 'active', 1 => 'display_only', 4 => 'grayed'];

    /**
     * Height reserved for the tab-strip header drawn at the top of a
     * tab_container's canvas box (WindowDesignerPanel.tsx renders the actual
     * strip - keep both in sync). A synthesized tab_panel is inset by this
     * many pixels from its container's top edge so the strip never overlaps
     * the tab's own content. 34 (not a rounder 32) matches WinDev's real
     * tab header height as measured by the exporter, which already
     * subtracts it from every control's y before export - our inset has to
     * agree exactly or imported content drifts vertically by the
     * difference.
     */
    private const TAB_HEADER_HEIGHT = 34;

    /**
     * POST /api/projects/{projectId}/windows/import-windev
     *
     * Bulk-imports windows from a WinDev/WLangage JSON export (see
     * scripts/output.json for the source shape). Imported windows always
     * land at the category root (category_id = null - "root" is
     * represented by NULL rather than a dedicated category row, so no
     * special-casing is needed here) and the user sorts them into
     * categories afterwards.
     *
     * `decisions` is an optional map of {sourceWindowName: 'create'|'skip'|'overwrite'}
     * — built by the frontend after it detects name conflicts against the
     * already-loaded window list and lets the user resolve each one. Any
     * window not present in `decisions` falls back to the safe default:
     * create if new, skip if it already exists (never a silent overwrite).
     * "overwrite" updates the existing window's own properties and replaces
     * its elements/controls wholesale, but preserves its id and
     * category_id — re-importing must not undo where the user has already
     * filed it in their category tree.
     */
    public function importWindev(Request $request, int $projectId): JsonResponse
    {
        $project = $this->authorizedProject($projectId);
        if (! $project) {
            return response()->json(['success' => false, 'error' => 'Project not found or unauthorized'], 404);
        }

        $validated = $request->validate([
            'windows' => 'required|array',
            'decisions' => 'sometimes|array',
        ]);
        $decisions = $validated['decisions'] ?? [];

        $stats = [
            'windows_imported' => 0,
            'windows_overwritten' => 0,
            'windows_skipped' => [],
            'elements_imported' => 0,
            'controls_imported' => 0,
            'menus_imported' => 0,
            'unmapped_types' => [],
            'unresolved_parents' => [],
        ];

        // Seed every enabled language with the same imported text (not just
        // the project's default language) so switching the language
        // dropdown in the designer shows a starting point instead of a
        // blank field for every language but one.
        $enabledLanguages = $project->enabled_languages ?: [$project->default_language ?: 'de'];

        DB::transaction(function () use ($project, $validated, $decisions, $enabledLanguages, &$stats) {
            foreach ($validated['windows'] as $sourceWindow) {
                $rawName = $sourceWindow['name'] ?? null;
                if (! is_string($rawName) || $rawName === '') {
                    continue;
                }

                $name = $this->sanitizeImportName($rawName);
                $existing = UiWindow::where('project_id', $project->id)->where('name', $name)->first();
                $action = $decisions[$rawName] ?? ($existing ? 'skip' : 'create');

                if ($action === 'skip') {
                    if ($existing) {
                        $stats['windows_skipped'][] = $rawName;
                    }

                    continue;
                }

                // A container's sub-controls can arrive either as separate
                // entries in the window's own top-level "controls" array
                // (tagged with parent_control - how tab_container pages'
                // content is exported) OR nested directly inside the
                // container's own JSON object under its own "controls" key
                // (how a looper's row template controls are exported) -
                // flatten the latter into the former up front so pass 1/2
                // below only ever have to deal with one flat list, whatever
                // shape the exporter chose to nest things in.
                $sourceWindow['controls'] = $this->flattenSourceControls($sourceWindow['controls'] ?? []);

                $windowCaption = is_string($sourceWindow['caption'] ?? null) ? $sourceWindow['caption'] : $rawName;
                $windowCaptionLabels = $this->mergeImportedLabels($sourceWindow['caption_labels'] ?? null, $windowCaption, $enabledLanguages, 150);
                $canvasWidth = max(100, (int) ($sourceWindow['width'] ?? 1024));
                $canvasHeight = max(100, (int) ($sourceWindow['height'] ?? 768));
                $windowBackgroundColor = $this->normalizeHexColor($sourceWindow['background_color'] ?? null);
                $windowBackgroundImage = is_string($sourceWindow['background_image'] ?? null)
                    ? $this->hexImageToDataUri($sourceWindow['background_image'])
                    : null;
                // WinDev's Window.StatusBar property - a plain 0/1 flag in
                // the export (see scripts/output.json), same convention as
                // every other boolean-ish numeric field this importer reads.
                $windowHasStatusBar = (bool) ($sourceWindow['status_bar'] ?? false);

                if ($action === 'overwrite' && $existing) {
                    $window = $existing;
                    $window->update([
                        'source_name' => mb_substr($rawName, 0, 150),
                        'display_name' => mb_substr($windowCaption, 0, 150),
                        'display_name_labels' => $windowCaptionLabels,
                        'canvas_width' => $canvasWidth,
                        'canvas_height' => $canvasHeight,
                        'background_color' => $windowBackgroundColor,
                        'background_image' => $windowBackgroundImage,
                        'has_status_bar' => $windowHasStatusBar,
                    ]);
                    UiWindowControl::where('window_id', $window->id)->delete();
                    UiWindowElement::where('window_id', $window->id)->delete();
                    UiWindowMenu::where('window_id', $window->id)->delete();
                    $stats['windows_overwritten']++;
                } else {
                    if ($existing) {
                        // 'create' requested but the window already exists (stale
                        // client-side conflict detection) — never silently
                        // duplicate, fall back to skip.
                        $stats['windows_skipped'][] = $rawName;

                        continue;
                    }
                    $window = UiWindow::create([
                        'project_id' => $project->id,
                        'category_id' => null,
                        'name' => $name,
                        'source_name' => mb_substr($rawName, 0, 150),
                        'display_name' => mb_substr($windowCaption, 0, 150),
                        'display_name_labels' => $windowCaptionLabels,
                        'canvas_width' => $canvasWidth,
                        'background_color' => $windowBackgroundColor,
                        'background_image' => $windowBackgroundImage,
                        'canvas_height' => $canvasHeight,
                        'has_status_bar' => $windowHasStatusBar,
                    ]);
                    $stats['windows_imported']++;
                }

                // A window's own menu bar - a recursive tree, independent of
                // any control/element, so it doesn't need to participate in
                // the controls pass 1/2 ordering below at all.
                if (! empty($sourceWindow['menus']) && is_array($sourceWindow['menus'])) {
                    $this->importWindowMenus($window, $sourceWindow['menus'], null, $enabledLanguages, $stats);
                }

                $elementSortOrder = 0;
                $controlSortOrder = 0;
                // WinDev's export only marks tab_stop=1 on controls that
                // actually participate in tab order (static texts etc. carry
                // no tab_stop field at all) - the sequence is derived from
                // array order among just those, matching the -1=excluded /
                // 1..N=active convention used everywhere else (TabOrderModal).
                $tabOrderCounter = 0;

                // Pass 1: create every container-style element (currently
                // just tab_container) before any control, so pass 2 can
                // resolve a control's "parent_control" (a source *name*) to
                // a real element id no matter which order WinDev emitted
                // them in. A tab_container's pages are declared upfront on
                // its own "tabs" sub-array ([{tab: 1, caption: "..."}, ...])
                // - every one of them is created here, with its real
                // caption, so a tab with zero controls placed on it still
                // exists after import instead of silently never being
                // created (the old behavior, back when pages were only
                // synthesized lazily as controls happened to reference
                // them in pass 2).
                $elementsBySourceName = [];
                $tabPanelsByKey = [];
                $looperRowsBySourceName = [];
                foreach (($sourceWindow['controls'] ?? []) as $sourceControl) {
                    $sourceType = (int) ($sourceControl['type'] ?? 0);
                    $mapping = self::WINDEV_TYPE_MAP[$sourceType] ?? null;
                    if (! $mapping || $mapping['kind'] !== 'element') {
                        continue;
                    }

                    $sourceControlName = is_string($sourceControl['name'] ?? null) ? $sourceControl['name'] : null;
                    $controlCaption = is_string($sourceControl['caption'] ?? null) ? $sourceControl['caption'] : '';
                    $width = max(1, (int) ($sourceControl['width'] ?? 100));
                    $height = max(1, (int) ($sourceControl['height'] ?? 30));

                    $element = UiWindowElement::create([
                        'window_id' => $window->id,
                        'element_type' => $mapping['type'],
                        'source_name' => $sourceControlName ? mb_substr($sourceControlName, 0, 150) : null,
                        'x_position' => (int) ($sourceControl['x'] ?? 0),
                        'y_position' => (int) ($sourceControl['y'] ?? 0),
                        'width' => $width,
                        'height' => $height,
                        'tab_label' => $controlCaption !== '' ? mb_substr($controlCaption, 0, 100) : null,
                        'sort_order' => $elementSortOrder++,
                    ]);
                    $stats['elements_imported']++;

                    if ($sourceControlName === null) {
                        continue;
                    }
                    $elementInfo = [
                        'id' => $element->id,
                        'type' => $mapping['type'],
                        'width' => $width,
                        'height' => $height,
                        // Needed by createImportedTabPanel()/createImportedLooperRow()
                        // below to synthesize the CHILD page/row's own
                        // source_name (see their own doc comments) - the
                        // container's own name is already guaranteed
                        // non-null here (checked just above).
                        'source_name' => mb_substr($sourceControlName, 0, 150),
                    ];
                    $elementsBySourceName[$sourceControlName] = $elementInfo;

                    if ($mapping['type'] === 'tab_container') {
                        foreach (($sourceControl['tabs'] ?? []) as $tabInfo) {
                            if (! isset($tabInfo['tab'])) {
                                continue;
                            }
                            $tabIndex = (int) $tabInfo['tab'];
                            // "&&" is WinDev's own escape for a literal "&"
                            // - tabs have no keyboard accelerator concept
                            // (unlike buttons), so there's no shortcut to
                            // extract here, just unescape for display.
                            $tabCaption = is_string($tabInfo['caption'] ?? null) ? str_replace('&&', '&', $tabInfo['caption']) : null;
                            $tabCaptionLabels = $this->mergeImportedLabels($tabInfo['caption_labels'] ?? null, $tabCaption ?? '', $enabledLanguages, 100);
                            $tabPanel = $this->createImportedTabPanel($window, $elementInfo, $tabIndex, $tabCaption, $tabCaptionLabels);
                            $stats['elements_imported']++;
                            $tabPanelsByKey[$sourceControlName.'#'.$tabIndex] = $tabPanel->id;
                        }
                    } elseif ($mapping['type'] === 'looper') {
                        // A looper has exactly one row template, always -
                        // unlike tab_container's pages, there's no source
                        // array of them to iterate, WinDev doesn't export
                        // one because there's only ever one.
                        $looperRow = $this->createImportedLooperRow($window, $elementInfo);
                        $stats['elements_imported']++;
                        $looperRowsBySourceName[$sourceControlName] = $looperRow->id;
                    }
                }

                // Pass 2: create every actual control, resolving its
                // container from parent_control ("_Form_" or empty = the
                // window itself) and, for tab containers, `tab` (a 1-based
                // page index) against the pages already created in pass 1.
                foreach (($sourceWindow['controls'] ?? []) as $sourceControl) {
                    $sourceType = (int) ($sourceControl['type'] ?? 0);
                    $mapping = self::WINDEV_TYPE_MAP[$sourceType] ?? null;
                    if ($mapping && $mapping['kind'] === 'element') {
                        continue; // handled in pass 1
                    }

                    $sourceControlName = is_string($sourceControl['name'] ?? null) ? $sourceControl['name'] : null;
                    if (! $mapping) {
                        $mapping = ['kind' => 'control', 'type' => 'static_text'];
                        $stats['unmapped_types'][] = [
                            'window' => $rawName,
                            'control' => $sourceControlName ?? '?',
                            'type' => $sourceType,
                        ];
                    }

                    $controlCaption = is_string($sourceControl['caption'] ?? null) ? $sourceControl['caption'] : '';
                    $controlCaptionLabels = $this->mergeImportedLabels($sourceControl['caption_labels'] ?? null, $controlCaption, $enabledLanguages, 255);
                    $x = (int) ($sourceControl['x'] ?? 0);
                    $y = (int) ($sourceControl['y'] ?? 0);
                    $width = max(1, (int) ($sourceControl['width'] ?? 100));
                    $height = max(1, (int) ($sourceControl['height'] ?? 30));

                    $containerElementId = null;
                    $parentControlName = is_string($sourceControl['parent_control'] ?? null) ? $sourceControl['parent_control'] : null;
                    if ($parentControlName !== null && $parentControlName !== '') {
                        $parentElement = $elementsBySourceName[$parentControlName] ?? null;
                        if ($parentElement) {
                            if ($parentElement['type'] === 'tab_container' && isset($sourceControl['tab'])) {
                                $tabIndex = (int) $sourceControl['tab'];
                                $tabKey = $parentControlName.'#'.$tabIndex;
                                if (! isset($tabPanelsByKey[$tabKey])) {
                                    // Defensive fallback: a control
                                    // references a tab index its
                                    // container's own "tabs" array (pass 1)
                                    // didn't declare - a stale/partial
                                    // export, most likely - create it
                                    // anyway rather than losing the
                                    // control's placement.
                                    $tabPanel = $this->createImportedTabPanel($window, $parentElement, $tabIndex, null);
                                    $stats['elements_imported']++;
                                    $tabPanelsByKey[$tabKey] = $tabPanel->id;
                                }
                                $containerElementId = $tabPanelsByKey[$tabKey];
                            } elseif ($parentElement['type'] === 'looper') {
                                $containerElementId = $looperRowsBySourceName[$parentControlName] ?? $parentElement['id'];
                            } else {
                                $containerElementId = $parentElement['id'];
                            }
                        } elseif ($parentControlName !== '_Form_') {
                            // "_Form_" is WinDev's generic name for "the
                            // root window" and doubles as a sentinel for
                            // "no real container" in most exports - but
                            // some exports also legitimately name an
                            // actual tab_container "_Form_" (the whole
                            // window being one big tab control), which the
                            // lookup above already resolves correctly when
                            // such an element exists. Only report
                            // something as truly unresolved when the name
                            // isn't that sentinel and still matched nothing.
                            $stats['unresolved_parents'][] = [
                                'window' => $rawName,
                                'control' => $sourceControlName ?? '?',
                                'parent_control' => $parentControlName,
                            ];
                        }
                    }

                    // A plain "Edit" (20001) with a tall bounding box is
                    // almost always a multi-line memo field in the source,
                    // not a single-line input - WinDev doesn't emit a
                    // distinct type code for that in this export, so it's
                    // inferred from height instead.
                    $controlType = $mapping['type'];
                    if ($controlType === 'text' && $height >= 60) {
                        $controlType = 'textarea';
                    }

                    // WinDev's "Bouton radio" (type 6) can be either a
                    // single toggle or, when it carries its own
                    // radio_options list, a whole mutually-exclusive group
                    // bundled into one control - unlike our schema's
                    // separate radio_button vs radio_group types. Promote
                    // it to a real radio_group so the options aren't
                    // silently dropped; a plain radio_button with no
                    // radio_options keeps working exactly as before.
                    $controlOptions = null;
                    if ($controlType === 'radio_button' && ! empty($sourceControl['radio_options']) && is_array($sourceControl['radio_options'])) {
                        $controlType = 'radio_group';
                        $controlOptions = $this->buildImportedOptionList($sourceControl['radio_options'], $enabledLanguages);
                    }

                    // Same idea for WinDev's "Case à cocher" (type 5) - but
                    // unlike radio_options, checkbox_options is present on
                    // EVERY checkbox the exporter produces, including plain
                    // single ones: a lone entry is that single checkbox's own
                    // item label (WinDev has no separate "caption" concept
                    // per checkbox - the top-level caption field, when
                    // present, is instead an optional heading show above the
                    // whole control, see the display_caption/display_pos
                    // block below). Only 2+ entries make this a real
                    // multi-select group; either way, the entries themselves
                    // are captured into $controlOptions so the frontend can
                    // render each checkbox's true label instead of the
                    // often-empty top-level caption.
                    if ($controlType === 'checkbox' && ! empty($sourceControl['checkbox_options']) && is_array($sourceControl['checkbox_options'])) {
                        $checkboxOptions = $this->buildImportedOptionList($sourceControl['checkbox_options'], $enabledLanguages);
                        if (count($checkboxOptions) > 0) {
                            $controlOptions = $checkboxOptions;
                            if (count($checkboxOptions) >= 2) {
                                $controlType = 'checkbox_group';
                            }
                        }
                    }

                    $sourceImage = is_string($sourceControl['image'] ?? null) ? $sourceControl['image'] : null;
                    // WLangage ImageState: 1 = a single bitmap covering every
                    // visual state, >1 = that many state-bitmaps concatenated
                    // side by side (5 = Idle/Pressed/Grayed/Selected/Hovered).
                    // Only meaningful when there actually is an image.
                    $iconStateCount = $sourceImage && isset($sourceControl['imagestate']) ? max(1, (int) $sourceControl['imagestate']) : 1;
                    $iconMode = $sourceImage && isset($sourceControl['imagemode']) ? (int) $sourceControl['imagemode'] : null;

                    // A button's whole-surface background image - distinct
                    // from 'image' above (that one is the button's own
                    // icon/glyph, positioned via icon_position_horizontal/
                    // vertical). Same hex-encoded-bitmap shape/decode path
                    // and same ImageState concept as icon_data/imagestate
                    // above, just under their own "background_image"/
                    // "background_image_states" field names - confirmed
                    // against a real export. The export's "animation step"
                    // dimension (up to 6 per state) is deliberately not
                    // read at all - by agreement, the export always
                    // collapses to exactly 1 step, so background_image_states
                    // alone (1-5) fully describes the strip's frame count.
                    $sourceBackgroundImage = is_string($sourceControl['background_image'] ?? null) ? $sourceControl['background_image'] : null;
                    $backgroundImageStates = $sourceBackgroundImage && isset($sourceControl['background_image_states'])
                        ? max(1, (int) $sourceControl['background_image_states'])
                        : 1;

                    // The export already carries the keyboard accelerator as
                    // its own fields (shortcut_enabled/shortcut) rather than
                    // encoding it into the caption ("&Hilfe") the way older
                    // exports did — just pass it through as-is, no parsing.
                    $shortcutEnabled = ! empty($sourceControl['shortcut_enabled']);
                    $shortcut = is_string($sourceControl['shortcut'] ?? null) ? mb_substr($sourceControl['shortcut'], 0, 20) : null;

                    // WinDev anchors are exported on a 0-1000 scale (1000 =
                    // fully anchored/100%); our own AnchorSection UI and
                    // decimal(5,2) columns work in 0-100 percent, so convert
                    // on the way in. Absent = not anchored on that edge.
                    $anchorRight = isset($sourceControl['anchor_right']) ? round(((float) $sourceControl['anchor_right']) / 10, 2) : null;
                    $anchorBottom = isset($sourceControl['anchor_bottom']) ? round(((float) $sourceControl['anchor_bottom']) / 10, 2) : null;
                    $anchorWidth = isset($sourceControl['anchor_width']) ? round(((float) $sourceControl['anchor_width']) / 10, 2) : null;
                    $anchorHeight = isset($sourceControl['anchor_height']) ? round(((float) $sourceControl['anchor_height']) / 10, 2) : null;

                    // Two different sources for the same concept: static
                    // text/headings give a numeric horizontal_alignment /
                    // vertical_alignment (WLangage constants, see
                    // WINDEV_ALIGN_H_MAP/V_MAP); buttons instead give
                    // already-stringified horizontal_display_pos /
                    // vertical_display_pos ("left"/"center"/"right" resp.
                    // "top"/"center"/"bottom") - normalized the same way
                    // either source lands in caption_position_horizontal/
                    // vertical, so the rest of the app never needs to care
                    // which control type it came from.
                    $captionAlignH = isset($sourceControl['horizontal_display_pos'])
                        ? $this->normalizeAlignString($sourceControl['horizontal_display_pos'], false)
                        : (isset($sourceControl['horizontal_alignment']) ? (self::WINDEV_ALIGN_H_MAP[(int) $sourceControl['horizontal_alignment']] ?? null) : null);
                    $captionAlignV = isset($sourceControl['vertical_display_pos'])
                        ? $this->normalizeAlignString($sourceControl['vertical_display_pos'], true)
                        : (isset($sourceControl['vertical_alignment']) ? (self::WINDEV_ALIGN_V_MAP[(int) $sourceControl['vertical_alignment']] ?? null) : null);

                    // Button-only: whether the caption text shows at all,
                    // and which side of it the icon sits on. Note the key
                    // name is "caption_display" here (button export) - not
                    // to be confused with "display_caption" (checkbox
                    // export, handled separately below), a different field
                    // from a different WinDev control-property source.
                    $captionVisible = isset($sourceControl['caption_display']) ? (bool) $sourceControl['caption_display'] : true;
                    $iconPositionH = isset($sourceControl['horizontal_image_pos']) ? $this->normalizeAlignString($sourceControl['horizontal_image_pos'], false) : null;
                    $iconPositionV = isset($sourceControl['vertical_image_pos']) ? $this->normalizeAlignString($sourceControl['vertical_image_pos'], true) : null;

                    $fontFamily = is_string($sourceControl['font_name'] ?? null) ? mb_substr($sourceControl['font_name'], 0, 100) : null;
                    $fontSize = isset($sourceControl['font_size']) ? round((float) $sourceControl['font_size'], 2) : null;
                    $controlBackgroundColor = $this->normalizeHexColor($sourceControl['background_color'] ?? null);
                    $controlTextColor = $this->normalizeHexColor($sourceControl['font_color'] ?? null);
                    // Table-only: background_color is the odd-row band,
                    // background_color_even the even-row band.
                    $rowBackgroundColorEven = $this->normalizeHexColor($sourceControl['background_color_even'] ?? null);
                    $rowHeight = isset($sourceControl['line_height']) ? max(1, (int) $sourceControl['line_height']) : null;

                    $isVisible = isset($sourceControl['visible']) ? (bool) $sourceControl['visible'] : true;
                    $controlState = isset($sourceControl['state']) ? (self::WINDEV_STATE_MAP[(int) $sourceControl['state']] ?? 'active') : 'active';
                    $dataBinding = (is_string($sourceControl['data_binding'] ?? null) && $sourceControl['data_binding'] !== '')
                        ? mb_substr($sourceControl['data_binding'], 0, 255) : null;
                    $browsedFile = (is_string($sourceControl['browsed_file'] ?? null) && $sourceControl['browsed_file'] !== '')
                        ? mb_substr($sourceControl['browsed_file'], 0, 150) : null;
                    // A Table control's columns aren't their own control
                    // objects - WinDev nests them in the same "tabs" array
                    // key a tab_container uses for its pages, just with a
                    // completely different shape (column definitions, not
                    // pages), so this is deliberately not routed through
                    // the tab_container/tab_panel machinery above.
                    $tableColumns = $controlType === 'table' ? $this->buildImportedTableColumns($sourceControl, $enabledLanguages) : null;

                    // The distance from the field's left edge to its input -
                    // i.e. our label_width - for a control whose label sits
                    // beside it (label_position 'left', the WinDev default).
                    $labelWidth = isset($sourceControl['caption_width']) ? max(20, (int) $sourceControl['caption_width']) : null;

                    // caption_position is already a plain string ('top',
                    // 'left', ...) straight from the exporter - passes
                    // through as-is when it's one of our own known values,
                    // whitelisted rather than trusted blindly since it
                    // ultimately becomes an enum column value. Falls back
                    // to the old heuristic (a control with a label width
                    // has its label to the left, the WinDev default) for
                    // exports from before this field existed.
                    $labelPosition = in_array($sourceControl['caption_position'] ?? null, ['top', 'left', 'right', 'none'], true)
                        ? $sourceControl['caption_position']
                        : ($labelWidth !== null ? 'left' : 'top');

                    // Checkboxes can't carry caption_position at all (the
                    // exporter has no way to read it back out of WinDev) -
                    // instead there's display_caption (whether the caption
                    // shows at all) and, when it does, display_pos (a single
                    // combined value like "topleft" - the only one seen so
                    // far). display_caption:0 means genuinely no caption
                    // anywhere, not just "no separate external label" (a
                    // plain checkbox's WindowControlNode branch now hides its
                    // inline caption span for label_position 'none' too, see
                    // frontend). display_pos is split into our own
                    // label_position (the vertical half) and
                    // caption_position_horizontal (the horizontal half) -
                    // there's no combined enum for "top-and-left" in this
                    // schema, and the two concepts already exist separately.
                    // Older exports without display_caption fall back to the
                    // same safe default as before: a plain (non-grouped)
                    // checkbox's caption is always inline next to the toggle,
                    // never a separate external label.
                    if ($controlType === 'checkbox' || $controlType === 'checkbox_group') {
                        if (isset($sourceControl['display_caption'])) {
                            if (! $sourceControl['display_caption']) {
                                $labelPosition = 'none';
                            } else {
                                // label_position only has 'top'/'left'/'right'/'none'
                                // (no 'bottom') - "topleft" (the only value seen so
                                // far) maps to 'top' as the vertical half wins,
                                // matching "caption sits above the checkbox".
                                $displayPos = is_string($sourceControl['display_pos'] ?? null) ? strtolower($sourceControl['display_pos']) : '';
                                $labelPosition = str_contains($displayPos, 'top') ? 'top'
                                    : (str_contains($displayPos, 'right') ? 'right'
                                    : (str_contains($displayPos, 'left') ? 'left' : 'top'));
                                if (str_contains($displayPos, 'left')) {
                                    $captionAlignH = 'left';
                                } elseif (str_contains($displayPos, 'right')) {
                                    $captionAlignH = 'right';
                                } elseif (str_contains($displayPos, 'center')) {
                                    $captionAlignH = 'center';
                                }
                            }
                        } elseif ($controlType === 'checkbox') {
                            $labelPosition = 'none';
                        }
                    }

                    $tabOrder = -1;
                    if (! empty($sourceControl['tab_stop'])) {
                        $tabOrderCounter++;
                        $tabOrder = $tabOrderCounter;
                    }

                    UiWindowControl::create([
                        'window_id' => $window->id,
                        'container_element_id' => $containerElementId,
                        'control_type' => $controlType,
                        'source_name' => $sourceControlName ? mb_substr($sourceControlName, 0, 150) : null,
                        'x_position' => $x,
                        'y_position' => $y,
                        'width' => $width,
                        'height' => $height,
                        'anchor_right' => $anchorRight,
                        'anchor_bottom' => $anchorBottom,
                        'anchor_width' => $anchorWidth,
                        'anchor_height' => $anchorHeight,
                        'caption_override' => $controlCaption !== '' ? mb_substr($controlCaption, 0, 255) : null,
                        'caption_labels' => $controlCaptionLabels,
                        'caption_position_horizontal' => $captionAlignH,
                        'caption_position_vertical' => $captionAlignV,
                        'caption_visible' => $captionVisible,
                        'icon_position_horizontal' => $iconPositionH,
                        'icon_position_vertical' => $iconPositionV,
                        'label_position' => $labelPosition,
                        'label_width' => $labelWidth ?? 100,
                        'options' => $controlOptions,
                        'shortcut_enabled' => $shortcutEnabled,
                        'shortcut' => $shortcut,
                        'icon_data' => $sourceImage ? $this->hexImageToDataUri($sourceImage) : null,
                        'icon_state_count' => $iconStateCount,
                        'icon_mode' => $iconMode,
                        'background_image' => $sourceBackgroundImage ? $this->hexImageToDataUri($sourceBackgroundImage) : null,
                        'background_image_states' => $backgroundImageStates,
                        'control_background_color' => $controlBackgroundColor,
                        'control_text_color' => $controlTextColor,
                        'row_background_color_even' => $rowBackgroundColorEven,
                        'row_height' => $rowHeight,
                        'font_family' => $fontFamily,
                        'font_size' => $fontSize,
                        'font_bold' => ! empty($sourceControl['font_bold']),
                        'font_italic' => ! empty($sourceControl['font_italic']),
                        'font_underline' => ! empty($sourceControl['font_underlined']),
                        'font_strikeout' => ! empty($sourceControl['font_strike_out']),
                        'is_visible' => $isVisible,
                        'control_state' => $controlState,
                        'data_binding' => $dataBinding,
                        'browsed_file' => $browsedFile,
                        'table_columns' => $tableColumns,
                        // WinDev's own zorder (paint/stacking order) when the
                        // export provides it - falls back to plain
                        // encounter-order for older exports that don't, same
                        // as before. sort_order already doubles as this
                        // control's stacking position on canvas (see
                        // WindowControlNode's zIndex), so there's no need for
                        // a separate column.
                        'sort_order' => isset($sourceControl['zorder']) ? (int) $sourceControl['zorder'] : $controlSortOrder++,
                        'tab_order' => $tabOrder,
                    ]);
                    $stats['controls_imported']++;
                }

                // A looper's row template starts life sized to fill the
                // WHOLE looper (pass 1, before any control is known) -
                // WinDev's own export carries no explicit row-height field,
                // so now that every control is actually placed, size the
                // row (and the looper's own looper_row_height, the single
                // source of truth the frontend/template both read) to just
                // fit its tallest child instead of leaving it as tall as
                // the entire looper. A too-tall row would visually show as
                // ALL white/editable on the canvas instead of one real row
                // on top of the repeated-rows preview below it.
                foreach ($looperRowsBySourceName as $rowId) {
                    $row = UiWindowElement::find($rowId);
                    if (! $row) {
                        continue;
                    }
                    $maxBottom = UiWindowControl::where('container_element_id', $rowId)
                        ->get(['y_position', 'height'])
                        ->reduce(fn ($carry, $c) => max($carry, $c->y_position + $c->height), 0);
                    $rowHeight = max(20, $maxBottom + 8);
                    $row->update(['height' => $rowHeight]);
                    if ($row->parent_element_id) {
                        UiWindowElement::where('id', $row->parent_element_id)->update(['looper_row_height' => $rowHeight]);
                    }
                }
            }
        });

        return response()->json(['success' => true, 'data' => $stats]);
    }

    /**
     * Creates one tab_panel page for a tab_container, inset by
     * TAB_HEADER_HEIGHT from the container's top edge so the frontend's
     * tab-strip header never overlaps the page's own content - children
     * then keep their native WinDev (x, y) completely unchanged, no
     * further offset math needed. $containerInfo is the
     * ['id','width','height','source_name'] shape produced for
     * tab_container entries in $elementsBySourceName.
     *
     * `source_name` is synthesized as "{container}.TAB{n}" - WinDev has no
     * name of its own for one specific PAGE of a tab control (only the
     * container itself is a named control), but the rest of this app
     * requires every control/element to have one (confirmed real: the
     * Window Designer's own "Save" button refuses to save otherwise - see
     * WindowDesignerPanel.tsx's handleSave) - matches EXACTLY the
     * convention the Designer's own hand-built "Add Tab" button already
     * uses (see addTab() there), so an imported tab page and a hand-added
     * one are indistinguishable. Found 2026-09-15: this was previously
     * left null for every single imported tab page, silently breaking
     * Save for any imported window with a tab control.
     */
    private function createImportedTabPanel(UiWindow $window, array $containerInfo, int $tabIndex, ?string $caption, ?array $captionLabels = null): UiWindowElement
    {
        return UiWindowElement::create([
            'window_id' => $window->id,
            'element_type' => 'tab_panel',
            'parent_element_id' => $containerInfo['id'],
            'source_name' => mb_substr($containerInfo['source_name'].'.TAB'.$tabIndex, 0, 150),
            'x_position' => 0,
            'y_position' => self::TAB_HEADER_HEIGHT,
            'width' => $containerInfo['width'],
            'height' => max(20, $containerInfo['height'] - self::TAB_HEADER_HEIGHT),
            'tab_label' => $caption !== null && $caption !== '' ? mb_substr($caption, 0, 100) : ('Tab '.$tabIndex),
            'tab_labels' => $captionLabels,
            'sort_order' => $tabIndex,
        ]);
    }

    /**
     * Recursively flattens any control's nested own "controls" array (e.g.
     * a looper's row template) into a single flat list alongside its
     * top-level siblings - pass 1/pass 2 below only ever walk ONE flat
     * array and resolve every control's container purely via
     * parent_control, regardless of whether the exporter nested it or
     * declared it at the top level. A nested child's own parent_control is
     * trusted as-is when the exporter already set it (the user's real
     * export does, redundantly, matching the tab convention); only filled
     * in from the immediate parent's name when genuinely absent, so a
     * nested child never silently ends up unparented.
     */
    private function flattenSourceControls(array $controls): array
    {
        $flat = [];
        foreach ($controls as $control) {
            $nested = $control['controls'] ?? null;
            unset($control['controls']);
            $flat[] = $control;
            if (is_array($nested)) {
                foreach ($this->flattenSourceControls($nested) as $child) {
                    if (empty($child['parent_control']) && is_string($control['name'] ?? null)) {
                        $child['parent_control'] = $control['name'];
                    }
                    $flat[] = $child;
                }
            }
        }

        return $flat;
    }

    /**
     * A looper's one-and-only row template. Unlike a tab_panel, there's no
     * header strip to inset for, so the row exactly fills the looper's own
     * box - real controls (imported separately in pass 2) attach to this
     * row's id, never to the looper directly. $containerInfo is the
     * ['id','width','height','source_name'] shape produced for looper
     * entries in $elementsBySourceName.
     *
     * `source_name` is synthesized as "{looper}.ROW" - same reasoning and
     * the same bug/fix as createImportedTabPanel()'s own doc comment
     * (matches the Designer's own hand-built "drop a Looper" flow, which
     * names its row template exactly this way).
     */
    private function createImportedLooperRow(UiWindow $window, array $containerInfo): UiWindowElement
    {
        return UiWindowElement::create([
            'window_id' => $window->id,
            'element_type' => 'looper_row',
            'parent_element_id' => $containerInfo['id'],
            'source_name' => mb_substr($containerInfo['source_name'].'.ROW', 0, 150),
            'x_position' => 0,
            'y_position' => 0,
            'width' => $containerInfo['width'],
            'height' => $containerInfo['height'],
            'sort_order' => 0,
        ]);
    }

    /**
     * A Table control's columns, straight from its "tabs" array (see
     * importWindev's comment on that name collision with tab_container
     * pages). Reuses the same type/alignment/color mappings as a normal
     * control, since a column is really just a miniature one, but is
     * stored as plain JSON rather than real UiWindowControl rows - a
     * column isn't independently selectable/movable on the canvas the way
     * every other control here is, so a relational child table would add
     * real CRUD/FK plumbing for no corresponding benefit.
     */
    private function buildImportedTableColumns(array $sourceControl, array $enabledLanguages = []): array
    {
        $columns = [];
        foreach (($sourceControl['columns'] ?? []) as $col) {
            if (! is_string($col['name'] ?? null) || $col['name'] === '') {
                continue;
            }
            $colType = (int) ($col['type'] ?? 0);
            $mapping = self::WINDEV_TYPE_MAP[$colType] ?? null;
            $colCaption = is_string($col['caption'] ?? null) && $col['caption'] !== '' ? $col['caption'] : $col['name'];

            $columns[] = [
                'name' => mb_substr($col['name'], 0, 150),
                'caption' => $colCaption,
                'caption_labels' => $this->mergeImportedLabels($col['caption_labels'] ?? null, $colCaption, $enabledLanguages, 150),
                'control_type' => ($mapping && $mapping['kind'] === 'control') ? $mapping['type'] : 'text',
                'width' => max(1, (int) ($col['width'] ?? 100)),
                'align_h' => isset($col['horizontal_alignment']) ? (self::WINDEV_ALIGN_H_MAP[(int) $col['horizontal_alignment']] ?? null) : null,
                'align_v' => isset($col['vertical_alignment']) ? (self::WINDEV_ALIGN_V_MAP[(int) $col['vertical_alignment']] ?? null) : null,
                'font_family' => is_string($col['font_name'] ?? null) ? mb_substr($col['font_name'], 0, 100) : null,
                'font_size' => isset($col['font_size']) ? round((float) $col['font_size'], 2) : null,
                'font_bold' => ! empty($col['font_bold']),
                'font_italic' => ! empty($col['font_italic']),
                'font_underline' => ! empty($col['font_underlined']),
                'font_strikeout' => ! empty($col['font_strike_out']),
                'font_color' => $this->normalizeHexColor($col['font_color'] ?? null),
                'control_state' => isset($col['state']) ? (self::WINDEV_STATE_MAP[(int) $col['state']] ?? 'active') : 'active',
                'data_binding' => (is_string($col['data_binding'] ?? null) && $col['data_binding'] !== '') ? $col['data_binding'] : null,
                'browsed_file' => (is_string($col['browsed_file'] ?? null) && $col['browsed_file'] !== '') ? $col['browsed_file'] : null,
            ];
        }

        return $columns;
    }

    /**
     * Builds a `{lang_code: text}` map for one imported per-language field
     * (a window's display_name, a control's caption, a tab's label, a table
     * column's caption - see UiWindow/UiWindowControl/UiWindowElement's own
     * `*_labels` columns) from an OPTIONAL `<field>_labels` object in the
     * WinDev export, merged with the existing "seed every enabled language
     * with the plain imported text" fallback this importer already did for
     * controls before per-language export support existed (2026-09-07).
     *
     * Every currently-enabled project language gets a value - the source's
     * own translation when the export provided one, otherwise
     * $fallbackValue (never left blank, so the language dropdown always
     * shows a starting point) - and any EXTRA language the export included
     * beyond the project's current enabled list is kept too rather than
     * silently discarded (the project may simply not have that language
     * enabled YET; the real translation the export bothered to include
     * shouldn't be lost over that).
     */
    /**
     * Builds a radio_group/checkbox_group `options` list (the frontend's
     * `{value, labels}[]` shape - see WindowControlRow.options) from either
     * WinDev export shape for `radio_options`/`checkbox_options`:
     *  - the ORIGINAL, flat list of plain caption strings (`["Option 1",
     *    "Option 2"]`) - `value` is derived from array position (1-based),
     *    `labels` blanket-filled with that same string for every enabled
     *    language, exactly as this importer always did;
     *  - the NEWER, per-language-aware shape (2026-09-15) - each entry is
     *    an object `{"index": 1, "caption": "...", "caption_labels": {...}}`
     *    - `value` comes from the entry's own `index` (falling back to
     *    array position if it's ever missing), `labels` from
     *    mergeImportedLabels() the same way every other caption field in
     *    this importer already works.
     * Both shapes can't appear mixed within the same list in practice (one
     * export always uses one shape consistently), but nothing here assumes
     * that - each entry is inspected independently.
     */
    private function buildImportedOptionList(array $rawOptions, array $enabledLanguages): array
    {
        $options = [];
        foreach (array_values($rawOptions) as $i => $option) {
            if (is_string($option)) {
                if ($option === '') {
                    continue;
                }
                $options[] = ['value' => (string) ($i + 1), 'labels' => array_fill_keys($enabledLanguages, $option)];

                continue;
            }
            if (is_array($option)) {
                $caption = is_string($option['caption'] ?? null) ? $option['caption'] : '';
                $labels = $this->mergeImportedLabels($option['caption_labels'] ?? null, $caption, $enabledLanguages, 255);
                if ($caption === '' && $labels === null) {
                    continue;
                }
                $value = isset($option['index']) ? (string) $option['index'] : (string) ($i + 1);
                $options[] = ['value' => $value, 'labels' => $labels ?? array_fill_keys($enabledLanguages, $caption)];
            }
        }

        return $options;
    }

    private function mergeImportedLabels(?array $sourceLabels, string $fallbackValue, array $enabledLanguages, int $maxLength = 255): ?array
    {
        if ($fallbackValue === '' && ! is_array($sourceLabels)) {
            return null;
        }

        $labels = [];
        foreach ($enabledLanguages as $lang) {
            $translated = is_array($sourceLabels) ? ($sourceLabels[$lang] ?? null) : null;
            $labels[$lang] = mb_substr((is_string($translated) && $translated !== '') ? $translated : $fallbackValue, 0, $maxLength);
        }
        if (is_array($sourceLabels)) {
            foreach ($sourceLabels as $lang => $text) {
                if (is_string($lang) && ! isset($labels[$lang]) && is_string($text) && $text !== '') {
                    $labels[$lang] = mb_substr($text, 0, $maxLength);
                }
            }
        }

        return $labels !== [] ? $labels : null;
    }

    /**
     * Recursively imports a window's `menus` tree (WinDev export, confirmed
     * for real up to ~12 levels deep). Independent of the controls/elements
     * import passes - a menu item never references a control or vice versa.
     * `caption` may carry WinDev's own "&" mnemonic-underline prefix -
     * passed through as-is, never parsed.
     */
    private function importWindowMenus(UiWindow $window, array $menuNodes, ?int $parentMenuId, array $enabledLanguages, array &$stats): void
    {
        foreach ($menuNodes as $index => $node) {
            if (! is_array($node)) {
                continue;
            }

            $name = is_string($node['name'] ?? null) ? $node['name'] : null;
            $caption = is_string($node['caption'] ?? null) ? $node['caption'] : ($name ?? '');
            $captionLabels = $this->mergeImportedLabels($node['caption_labels'] ?? null, $caption, $enabledLanguages, 255);

            $menu = UiWindowMenu::create([
                'window_id' => $window->id,
                'parent_menu_id' => $parentMenuId,
                'source_name' => $name !== null ? mb_substr($name, 0, 150) : null,
                'caption' => mb_substr($caption, 0, 255),
                'caption_labels' => $captionLabels,
                'sort_order' => $index,
            ]);
            $stats['menus_imported']++;

            if (! empty($node['menus']) && is_array($node['menus'])) {
                $this->importWindowMenus($window, $node['menus'], $menu->id, $enabledLanguages, $stats);
            }
        }
    }

    /**
     * WinDev names are free-form ("BTN_Schließen", "Combo_VonArtikelnummer");
     * our window `name` must stay a machine-safe identifier since it becomes
     * part of generated file paths later - mirrors the frontend's
     * sanitizeWindowName() exactly (drop, don't substitute, anything
     * outside [a-z0-9_]).
     */
    private function sanitizeImportName(string $raw): string
    {
        $lower = mb_strtolower($raw);
        $out = '';
        $length = mb_strlen($lower);
        for ($i = 0; $i < $length; $i++) {
            $ch = mb_substr($lower, $i, 1);
            if (($ch >= 'a' && $ch <= 'z') || ($ch >= '0' && $ch <= '9') || $ch === '_') {
                $out .= $ch;
            }
        }

        return $out !== '' ? $out : 'window';
    }

    /**
     * WinDev's native "Couleur" values are decimal integers - but WLangage
     * historically stores them in Windows COLORREF order (0x00BBGGRR, blue
     * and red swapped relative to normal RGB), so a naive decimal-to-hex
     * conversion risks silently swapping red and blue channels project-wide.
     * Rather than guess at that (this codebase has been burned by exactly
     * this kind of unverified WinDev-constant assumption before - see the
     * horizontal/vertical alignment codes), colors are only accepted here
     * as an already-unambiguous "#RRGGBB" (or bare "RRGGBB") hex string,
     * matching every color column in this schema. Anything else (in
     * particular, a raw decimal int) is rejected rather than
     * misinterpreted.
     */
    private function normalizeHexColor(mixed $raw): ?string
    {
        if (! is_string($raw)) {
            return null;
        }
        $hex = ltrim(trim($raw), '#');
        if (strlen($hex) !== 6 || ! ctype_xdigit($hex)) {
            return null;
        }

        return '#'.strtoupper($hex);
    }

    /**
     * Normalizes an already-stringified WinDev alignment value ("left",
     * "center", "top", ...) into our own enum. Unlike
     * horizontal_alignment/vertical_alignment (numeric WLangage constants,
     * see WINDEV_ALIGN_H_MAP/V_MAP), these come as plain strings - but
     * WinDev's own vertical value is "center" where our schema (matching
     * caption_position_vertical's existing 'top'|'middle'|'bottom') says
     * "middle", so that one substitution is made here.
     */
    private function normalizeAlignString(mixed $raw, bool $vertical): ?string
    {
        if (! is_string($raw)) {
            return null;
        }
        $value = strtolower(trim($raw));
        if ($vertical) {
            if ($value === 'center') {
                $value = 'middle';
            }

            return in_array($value, ['top', 'middle', 'bottom'], true) ? $value : null;
        }

        return in_array($value, ['left', 'center', 'right'], true) ? $value : null;
    }

    /**
     * WinDev embeds button/image icons as a hex-encoded binary blob
     * ("0x89504E470D0A1A0A..." - the leading bytes are the PNG file
     * signature), not base64. Converts it to a `data:` URI so the frontend
     * can use it directly as an <img> src / CSS background-image without
     * any further decoding. Returns null (rather than embedding garbage)
     * if the hex is malformed or the decoded bytes don't match a known
     * image signature.
     */
    private function hexImageToDataUri(string $hex): ?string
    {
        $hex = trim($hex);
        if (stripos($hex, '0x') === 0) {
            $hex = substr($hex, 2);
        }
        if ($hex === '' || strlen($hex) % 2 !== 0 || ! ctype_xdigit($hex)) {
            return null;
        }

        $binary = @hex2bin($hex);
        if ($binary === false || $binary === '') {
            return null;
        }

        if (str_starts_with($binary, "\x89PNG")) {
            $mime = 'image/png';
        } elseif (str_starts_with($binary, "\xFF\xD8\xFF")) {
            $mime = 'image/jpeg';
        } elseif (str_starts_with($binary, 'GIF8')) {
            $mime = 'image/gif';
        } else {
            return null;
        }

        return 'data:'.$mime.';base64,'.base64_encode($binary);
    }
}
