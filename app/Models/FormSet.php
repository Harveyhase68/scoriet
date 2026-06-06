<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FormSet extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'creator_user_id',
        'visibility',
        'cloned_from_id',
        'default_background_color',
        'default_window_color',
        'default_text_color',
        'default_button_color',
        'default_button_text_color',
        'is_active',
    ];

    protected $casts = [
        // See note on Project::$casts re: BIGINT-as-string from MariaDB/PDO.
        'creator_user_id' => 'integer',
        'cloned_from_id' => 'integer',
        'is_active' => 'boolean',
    ];

    /**
     * Standard-Layouts für Fenster-Typen
     */
    // Window header is 32px, usable area = height - 32
    // All y positions are relative to the area BELOW the header
    // Bottom padding: 10px, so max element bottom = height - 32 - 10 = 558 for 600px window
    public const DEFAULT_LAYOUTS = [
        'main_menu' => [
            'min_width' => 800,
            'min_height' => 600,
            'elements' => [
                ['element_type' => 'menu_container', 'x_position' => 20, 'y_position' => 10, 'width' => 200, 'height' => 508, 'container_orientation' => 'vertical'],
            ],
        ],
        'create_edit' => [
            'min_width' => 800,
            'min_height' => 600,
            'elements' => [
                ['element_type' => 'container', 'x_position' => 20, 'y_position' => 10, 'width' => 760, 'height' => 400],
                ['element_type' => 'button_nav_first', 'x_position' => 20, 'y_position' => 420, 'width' => 40, 'height' => 40, 'button_icon' => 'pi-angle-double-left'],
                ['element_type' => 'button_nav_prev', 'x_position' => 70, 'y_position' => 420, 'width' => 40, 'height' => 40, 'button_icon' => 'pi-angle-left'],
                ['element_type' => 'button_nav_next', 'x_position' => 120, 'y_position' => 420, 'width' => 40, 'height' => 40, 'button_icon' => 'pi-angle-right'],
                ['element_type' => 'button_nav_last', 'x_position' => 170, 'y_position' => 420, 'width' => 40, 'height' => 40, 'button_icon' => 'pi-angle-double-right'],
                ['element_type' => 'button_save', 'x_position' => 610, 'y_position' => 420, 'width' => 100, 'height' => 40, 'button_label' => 'Speichern', 'button_icon' => 'pi-save'],
                ['element_type' => 'button_cancel', 'x_position' => 720, 'y_position' => 420, 'width' => 100, 'height' => 40, 'button_label' => 'Abbrechen', 'button_icon' => 'pi-times'],
            ],
        ],
        'data_table' => [
            'min_width' => 800,
            'min_height' => 600,
            'elements' => [
                ['element_type' => 'container', 'x_position' => 20, 'y_position' => 10, 'width' => 760, 'height' => 448],
                ['element_type' => 'button_new', 'x_position' => 20, 'y_position' => 468, 'width' => 100, 'height' => 40, 'button_label' => 'Neu', 'button_icon' => 'pi-plus'],
                ['element_type' => 'button_delete', 'x_position' => 130, 'y_position' => 468, 'width' => 100, 'height' => 40, 'button_label' => 'Löschen', 'button_icon' => 'pi-trash'],
                ['element_type' => 'button_close', 'x_position' => 720, 'y_position' => 468, 'width' => 100, 'height' => 40, 'button_label' => 'Schließen', 'button_icon' => 'pi-times'],
            ],
        ],
        // Report types (report_single / report_list) were removed — reports
        // are now handled by ReportPattern, not FormWindow.
    ];

    // ========== RELATIONSHIPS ==========

    /**
     * Creator (User)
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_user_id');
    }

    /**
     * Geklontes Original
     */
    public function clonedFrom(): BelongsTo
    {
        return $this->belongsTo(FormSet::class, 'cloned_from_id');
    }

    /**
     * Fenster-Vorlagen
     */
    public function windows(): HasMany
    {
        return $this->hasMany(FormWindow::class)->orderBy('sort_order');
    }

    /**
     * Projekt-Verknüpfungen
     */
    public function projectFormSets(): HasMany
    {
        return $this->hasMany(ProjectFormSet::class);
    }

    // ========== SCOPES ==========

    /**
     * Nur aktive FormSets
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Öffentliche FormSets
     */
    public function scopePublic($query)
    {
        return $query->where('visibility', 'public');
    }

    /**
     * FormSets eines Users
     */
    public function scopeForUser($query, int $userId)
    {
        return $query->where('creator_user_id', $userId);
    }

    /**
     * Zugängliche FormSets für einen User
     */
    public function scopeAccessibleBy($query, int $userId)
    {
        return $query->where(function ($q) use ($userId) {
            $q->where('creator_user_id', $userId)
              ->orWhere('visibility', 'public');
        });
    }

    // ========== METHODS ==========

    /**
     * Bei Erstellung automatisch die 3 Standard-Fenster-Vorlagen erstellen.
     * (Reports werden separat über ReportPattern verwaltet, nicht über FormWindow.)
     */
    public static function boot()
    {
        parent::boot();

        static::created(function (FormSet $formSet) {
            $formSet->createDefaultWindows();
        });
    }

    /**
     * Erstellt die 3 Standard-Fenster mit Default-Layouts.
     * Reports (report_single / report_list) leben nicht hier, sondern in
     * report_patterns / report_pattern_forms.
     */
    public function createDefaultWindows(): void
    {
        $windowTypes = ['main_menu', 'create_edit', 'data_table'];
        $displayNames = [
            'main_menu' => 'Main Menu',
            'create_edit' => 'Create/Edit Form',
            'data_table' => 'Data Table',
        ];

        foreach ($windowTypes as $index => $type) {
            $layout = self::DEFAULT_LAYOUTS[$type];

            $windowData = [
                'name' => $type,
                'display_name' => $displayNames[$type],
                'window_type' => $type,
                'min_width' => $layout['min_width'],
                'min_height' => $layout['min_height'],
                'default_width' => $layout['min_width'],
                'default_height' => $layout['min_height'],
                'sort_order' => $index,
            ];

            $window = $this->windows()->create($windowData);

            // Standard-Elemente erstellen
            foreach ($layout['elements'] as $elementIndex => $element) {
                $window->elements()->create(array_merge($element, [
                    'sort_order' => $elementIndex,
                ]));
            }
        }
    }

    /**
     * FormSet als Array für GTree
     * Inkludiert direkten Zugriff auf Fenster nach Typ (z.B. formset.create_edit, formset.main_menu)
     */
    public function toGTreeArray(): array
    {
        $windows = $this->windows->map(fn($w) => $w->toGTreeArray())->toArray();

        $result = [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'visibility' => $this->visibility,
            'default_background_color' => $this->default_background_color,
            'default_window_color' => $this->default_window_color,
            'default_text_color' => $this->default_text_color,
            'default_button_color' => $this->default_button_color,
            'default_button_text_color' => $this->default_button_text_color,
            'windows' => $windows,
            'nmaxwindows' => count($windows),
        ];

        // 🎯 Direkter Zugriff auf Fenster nach Typ (ohne Index)
        // z.B. {formset.create_edit.button_save.label}, {formset.main_menu.min_width}
        foreach ($windows as $window) {
            $type = $window['type'];
            if (!isset($result[$type])) {
                $result[$type] = $window;
            }
        }

        return $result;
    }

    /**
     * FormSet klonen
     */
    public function cloneForUser(int $userId, ?string $newName = null): FormSet
    {
        return \Illuminate\Support\Facades\DB::transaction(function () use ($userId, $newName) {
            $clone = $this->replicate();
            $clone->name = $newName ?? static::suggestCopyName($this->name, $userId);
            $clone->creator_user_id = $userId;
            $clone->cloned_from_id = $this->id;
            $clone->visibility = 'private';
            $clone->save();

            // The FormSet::created hook (boot) auto-seeds the default windows
            // (main_menu / create_edit / data_table). We must drop those BEFORE
            // copying the source's windows — otherwise the source's own
            // main_menu collides with the seeded one on the unique
            // (form_set_id, window_type) key (the 500 this clone used to throw).
            // Delete child elements first (FK), then the seeded windows.
            $seededWindowIds = $clone->windows()->pluck('id')->all();
            if (!empty($seededWindowIds)) {
                FormElement::whereIn('form_window_id', $seededWindowIds)->delete();
                FormWindow::whereIn('id', $seededWindowIds)->delete();
            }

            // Copy windows + elements, recording old→new element ids so we can
            // rewire element self-references afterwards. replicate() copies
            // parent_tab_container_id verbatim, i.e. it still points at the
            // ORIGINAL form set's elements until we remap it below.
            $elementIdMap = [];
            $windowIdMap = [];
            foreach ($this->windows as $window) {
                $windowClone = $window->replicate();
                $windowClone->form_set_id = $clone->id;
                $windowClone->save();
                $windowIdMap[$window->id] = $windowClone->id;

                foreach ($window->elements as $element) {
                    $elementClone = $element->replicate();
                    $elementClone->form_window_id = $windowClone->id;
                    $elementClone->save();
                    $elementIdMap[$element->id] = $elementClone->id;
                }
            }

            // Second pass: re-point each cloned tab panel's parent_tab_container_id
            // at the CLONED container (the copied value is still the original id).
            foreach ($elementIdMap as $newId) {
                $newElement = FormElement::find($newId);
                if ($newElement
                    && $newElement->parent_tab_container_id
                    && isset($elementIdMap[$newElement->parent_tab_container_id])) {
                    $newElement->parent_tab_container_id = $elementIdMap[$newElement->parent_tab_container_id];
                    $newElement->save();
                }
            }

            // Copy the per-table layout placements (field / button / menu rows
            // shown in the Form Layout Editor). They live on form_item_placements
            // keyed by form_window_id (+ schema_table_id). Within the SAME DB the
            // schema_* FKs stay valid, so we only remap window + element refs;
            // the placement self-FK (parent_placement_id — menu hierarchy) is
            // remapped in a second pass. Without this the clone kept the blueprint
            // but the Layout Editor was empty.
            $oldWindowIds = array_keys($windowIdMap);
            if (!empty($oldWindowIds)) {
                $placementIdMap = [];
                $placements = FormItemPlacement::whereIn('form_window_id', $oldWindowIds)->get();
                foreach ($placements as $placement) {
                    $pClone = $placement->replicate();
                    $pClone->form_window_id = $windowIdMap[$placement->form_window_id] ?? $placement->form_window_id;
                    if ($placement->container_element_id && isset($elementIdMap[$placement->container_element_id])) {
                        $pClone->container_element_id = $elementIdMap[$placement->container_element_id];
                    }
                    if ($placement->tab_panel_id && isset($elementIdMap[$placement->tab_panel_id])) {
                        $pClone->tab_panel_id = $elementIdMap[$placement->tab_panel_id];
                    }
                    if ($placement->form_element_id && isset($elementIdMap[$placement->form_element_id])) {
                        $pClone->form_element_id = $elementIdMap[$placement->form_element_id];
                    }
                    // parent_placement_id stays the OLD id here; remapped below.
                    $pClone->save();
                    $placementIdMap[$placement->id] = $pClone->id;
                }

                // Second pass: rewire the placement hierarchy (sub-menu → parent).
                foreach ($placementIdMap as $newPid) {
                    $p = FormItemPlacement::find($newPid);
                    if ($p
                        && $p->parent_placement_id
                        && isset($placementIdMap[$p->parent_placement_id])) {
                        $p->parent_placement_id = $placementIdMap[$p->parent_placement_id];
                        $p->save();
                    }
                }
            }

            return $clone->load('windows.elements');
        });
    }

    /**
     * Build a unique copy-name suggestion (scoped per creator). Delegates to
     * the shared CopyNameSuggester so re-cloning "x_copy" yields "x_copy_1"
     * instead of "x_copy_copy".
     */
    public static function suggestCopyName(string $base, int $userId): string
    {
        return \App\Support\CopyNameSuggester::suggest(
            $base,
            fn (string $candidate) => static::where('creator_user_id', $userId)
                ->where('name', $candidate)
                ->exists(),
            100 // name column is varchar(100)
        );
    }
}
