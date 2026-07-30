<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FormWindow extends Model
{
    use HasFactory;

    protected $fillable = [
        'form_set_id',
        'name',
        'display_name',
        'window_type',
        'min_width',
        'min_height',
        'default_width',
        'default_height',
        'background_color',
        'window_color',
        'text_color',
        'is_active',
        'sort_order',
        // Paper/print configuration (report types)
        'paper_size',
        'paper_orientation',
        'paper_unit',
        'margin_top',
        'margin_right',
        'margin_bottom',
        'margin_left',
    ];

    protected $casts = [
        // See note on Project::$casts re: BIGINT-as-string from MariaDB/PDO.
        'form_set_id' => 'integer',
        'min_width' => 'integer',
        'min_height' => 'integer',
        'default_width' => 'integer',
        'default_height' => 'integer',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
        'margin_top' => 'decimal:2',
        'margin_right' => 'decimal:2',
        'margin_bottom' => 'decimal:2',
        'margin_left' => 'decimal:2',
    ];

    // ========== RELATIONSHIPS ==========

    /**
     * FormSet
     */
    public function formSet(): BelongsTo
    {
        return $this->belongsTo(FormSet::class);
    }

    /**
     * Elemente
     */
    public function elements(): HasMany
    {
        return $this->hasMany(FormElement::class)->orderBy('sort_order');
    }

    /**
     * Field placements (database fields placed into containers)
     */
    public function itemPlacements(): HasMany
    {
        return $this->hasMany(FormItemPlacement::class)->orderBy('sort_order');
    }

    public function fieldPlacements(): HasMany
    {
        return $this->hasMany(FormItemPlacement::class)->where('item_type', 'field')->orderBy('sort_order');
    }

    public function buttonPlacements(): HasMany
    {
        return $this->hasMany(FormItemPlacement::class)->where('item_type', 'button')->orderBy('sort_order');
    }

    public function menuPlacements(): HasMany
    {
        return $this->hasMany(FormItemPlacement::class)->where('item_type', 'menu_item')->orderBy('sort_order');
    }

    // ========== ACCESSORS ==========

    /**
     * Effektive Hintergrundfarbe (Fenster oder Set-Default)
     */
    public function getEffectiveBackgroundColorAttribute(): string
    {
        return $this->background_color ?? $this->formSet?->default_background_color ?? '#1f2937';
    }

    /**
     * Effektive Fensterfarbe
     */
    public function getEffectiveWindowColorAttribute(): string
    {
        return $this->window_color ?? $this->formSet?->default_window_color ?? '#374151';
    }

    /**
     * Effektive Textfarbe
     */
    public function getEffectiveTextColorAttribute(): string
    {
        return $this->text_color ?? $this->formSet?->default_text_color ?? '#f3f4f6';
    }

    // ========== SCOPES ==========

    /**
     * Nur aktive Fenster
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Nach Fenstertyp filtern
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('window_type', $type);
    }

    // ========== METHODS ==========

    /**
     * Alle Elemente als Array für GTree
     * Inkludiert direkten Zugriff auf Elemente nach Typ (z.B. button_nav_first, container)
     */
    public function toGTreeArray(): array
    {
        $elements = $this->elements->map(fn($el) => $el->toGTreeArray())->toArray();

        // Basis-Daten
        $result = [
            'id' => $this->id,
            'name' => $this->name,
            'display_name' => $this->display_name,
            'type' => $this->window_type,
            'min_width' => $this->min_width,
            'min_height' => $this->min_height,
            'default_width' => $this->default_width,
            'default_height' => $this->default_height,
            'background_color' => $this->effective_background_color,
            'window_color' => $this->effective_window_color,
            'text_color' => $this->effective_text_color,
            'elements' => $elements,
            'nmaxelements' => count($elements),
        ];

        // 🎯 Direkter Zugriff auf Elemente nach Typ (ohne {for} Loop)
        // z.B. {form.button_nav_first.x}, {form.container.width}
        foreach ($elements as $element) {
            $type = $element['type'];
            // Erstes Element des Typs als Direktzugriff speichern
            if (!isset($result[$type])) {
                $result[$type] = $element;
            }
        }

        return $result;
    }

    /**
     * Extended toGTreeArray with placements for a specific schema table
     * Used during code generation to include field/button layouts
     */
    public function toGTreeArrayWithPlacements(?int $schemaTableId = null, ?string $language = null): array
    {
        $result = $this->toGTreeArray();

        // Load placements for this window (optionally filtered by table)
        $query = $this->itemPlacements()->visible()->orderBy('sort_order');
        if ($schemaTableId) {
            $query->where(function ($q) use ($schemaTableId) {
                $q->where('schema_table_id', $schemaTableId)
                  ->orWhereNull('schema_table_id'); // Include buttons/menus without table
            });
        }
        $placements = $query->with(['schemaField', 'lookupTable', 'schemaTable'])->get();

        // Separate by type
        $fields = $placements->where('item_type', 'field')->values();
        $buttons = $placements->where('item_type', 'button')->values();
        $menuItems = $placements->where('item_type', 'menu_item')->values();

        $result['layoutsingles'] = $fields->map(fn($p) => $p->toGTreeArray($language))->toArray();
        $result['nmaxlayoutsingles'] = $fields->count();
        $result['layoutsinglecount'] = $fields->count();

        $result['layoutbuttons'] = $buttons->map(fn($p) => $p->toGTreeArray($language))->toArray();
        $result['nmaxlayoutbuttons'] = $buttons->count();

        $result['layoutmenus'] = $menuItems->map(fn($p) => $p->toGTreeArray($language))->toArray();
        $result['nmaxlayoutmenus'] = $menuItems->count();

        return $result;
    }
}
