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
                ['element_type' => 'spacer', 'x_position' => 220, 'y_position' => 420, 'width' => 380, 'height' => 40],
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
                ['element_type' => 'spacer', 'x_position' => 240, 'y_position' => 468, 'width' => 480, 'height' => 40],
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
        $clone = $this->replicate();
        $clone->name = $newName ?? $this->name . ' (Kopie)';
        $clone->creator_user_id = $userId;
        $clone->cloned_from_id = $this->id;
        $clone->visibility = 'private';
        $clone->save();

        // Fenster klonen (ohne automatische Erstellung durch boot)
        foreach ($this->windows as $window) {
            $windowClone = $window->replicate();
            $windowClone->form_set_id = $clone->id;
            $windowClone->save();

            // Elemente klonen
            foreach ($window->elements as $element) {
                $elementClone = $element->replicate();
                $elementClone->form_window_id = $windowClone->id;
                $elementClone->save();
            }
        }

        return $clone;
    }
}
