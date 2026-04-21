<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FormItemPlacement extends Model
{
    use HasFactory;

    protected $fillable = [
        // Core
        'form_window_id',
        'item_type',             // 'field', 'button', 'menu_item', 'print_field', etc.
        'container_element_id',
        'tab_panel_id',

        // Position & size
        'x_position',
        'y_position',
        'width',
        'height',
        'anchor_right',
        'anchor_bottom',
        'anchor_width',
        'anchor_height',
        'sort_order',
        'tab_order',
        'is_visible',

        // Field-specific
        'schema_table_id',
        'schema_field_id',
        'caption_override',
        'caption_labels',        // JSON: {"de": "Vorname", "en": "First Name"}
        'label_position',        // 'top', 'left', 'right' (right only for checkboxes)
        'label_width',           // Width in pixels when label_position is 'left'
        'control_type',          // text, integer, float, currency, combobox, date, time, datetime, checkbox, textarea, file, password, hidden, readonly

        // Combobox/lookup
        'lookup_table_id',
        'lookup_value_field',
        'lookup_display_field',
        'lookup_sort_field',
        'lookup_sort_direction',

        // Button-specific
        'form_element_id',
        'button_type',
        'button_label',
        'button_labels',         // JSON: {"de": "Speichern", "en": "Save"}
        'button_icon',
        'button_action',
        'button_background_color',
        'button_text_color',
        'style_config',

        // Menu-item-specific
        'parent_placement_id',   // Self-reference for hierarchy (sub-menus)
        'menu_icon',             // PrimeReact icon class (pi-home, pi-cog, etc.)
        'menu_action',           // Navigation target (panel-id)
        'menu_role_required',    // 'system', 'admin', null = all users
        'menu_depth',            // Nesting level (0 = root, 1 = child, 2 = grandchild)
    ];

    protected $casts = [
        'form_window_id' => 'integer',
        'container_element_id' => 'integer',
        'tab_panel_id' => 'integer',
        'x_position' => 'integer',
        'y_position' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
        'anchor_right' => 'decimal:2',
        'anchor_bottom' => 'decimal:2',
        'anchor_width' => 'decimal:2',
        'anchor_height' => 'decimal:2',
        'sort_order' => 'integer',
        'tab_order' => 'integer',
        'is_visible' => 'boolean',
        'schema_table_id' => 'integer',
        'schema_field_id' => 'integer',
        'lookup_table_id' => 'integer',
        'form_element_id' => 'integer',
        'label_width' => 'integer',
        'caption_labels' => 'array',
        'button_labels' => 'array',
        'style_config' => 'array',
        'parent_placement_id' => 'integer',
        'menu_depth' => 'integer',
    ];

    // ── Relationships ──

    public function formWindow(): BelongsTo
    {
        return $this->belongsTo(FormWindow::class);
    }

    public function schemaTable(): BelongsTo
    {
        return $this->belongsTo(SchemaTable::class);
    }

    public function schemaField(): BelongsTo
    {
        return $this->belongsTo(SchemaField::class);
    }

    public function lookupTable(): BelongsTo
    {
        return $this->belongsTo(SchemaTable::class, 'lookup_table_id');
    }

    public function containerElement(): BelongsTo
    {
        return $this->belongsTo(FormElement::class, 'container_element_id');
    }

    public function tabPanel(): BelongsTo
    {
        return $this->belongsTo(FormElement::class, 'tab_panel_id');
    }

    public function formElement(): BelongsTo
    {
        return $this->belongsTo(FormElement::class);
    }

    // Menu hierarchy
    public function parentItem(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_placement_id');
    }

    public function childItems()
    {
        return $this->hasMany(self::class, 'parent_placement_id')->orderBy('sort_order');
    }

    // ── Scopes ──

    public function scopeFields($query)
    {
        return $query->where('item_type', 'field');
    }

    public function scopeButtons($query)
    {
        return $query->where('item_type', 'button');
    }

    public function scopeMenuItems($query)
    {
        return $query->where('item_type', 'menu_item');
    }

    public function scopeRootMenuItems($query)
    {
        return $query->where('item_type', 'menu_item')->whereNull('parent_placement_id');
    }

    public function scopeForWindowAndTable($query, int $windowId, int $tableId)
    {
        return $query->where('form_window_id', $windowId)->where('schema_table_id', $tableId);
    }

    public function scopeForWindow($query, int $windowId)
    {
        return $query->where('form_window_id', $windowId);
    }

    public function scopeInContainer($query, int $containerId)
    {
        return $query->where('container_element_id', $containerId);
    }

    public function scopeVisible($query)
    {
        return $query->where('is_visible', true);
    }

    // ── Accessors ──

    public function getIsFieldAttribute(): bool
    {
        return $this->item_type === 'field';
    }

    public function getIsButtonAttribute(): bool
    {
        return $this->item_type === 'button';
    }

    public function getIsMenuItemAttribute(): bool
    {
        return $this->item_type === 'menu_item';
    }

    public function getEffectiveCaptionAttribute(): string
    {
        if ($this->caption_override) {
            return $this->caption_override;
        }

        $fieldName = $this->schemaField?->field_name ?? 'Field';
        return str_replace('_', ' ', ucwords(str_replace('_', ' ', $fieldName)));
    }

    /**
     * Convert placement to GTree array for template engine
     */
    public function toGTreeArray(?string $language = null): array
    {
        // Resolve label per type: buttons use button_label (lang-aware), fields use
        // their caption (lang-aware), menus use caption_override or fallback.
        $label = null;
        if ($this->item_type === 'button') {
            $label = $this->button_label;
            if ($language && !empty($this->button_labels[$language])) {
                $label = $this->button_labels[$language];
            }
        } else {
            $label = $this->effective_caption;
            if ($language && !empty($this->caption_labels[$language])) {
                $label = $this->caption_labels[$language];
            }
        }

        // ── Common keys (every row carries these so templates can rely on them) ──
        $result = [
            'id'           => $this->id,
            'type'         => $this->item_type,
            'x'            => $this->x_position,
            'y'            => $this->y_position,
            'width'        => $this->width,
            'height'       => $this->height,
            'visible'      => $this->is_visible,
            'z_order'      => $this->sort_order,           // renamed from sort_order
            'tab_order'    => $this->tab_order ?? 0,
            'anchor_right' => $this->anchor_right,
            'anchor_bottom'=> $this->anchor_bottom,
            'anchor_width' => $this->anchor_width,
            'anchor_height'=> $this->anchor_height,
            'label'        => $label,
            'container_id' => $this->container_element_id,
        ];

        // ── Type-specific keys ──
        if ($this->item_type === 'field') {
            $result['control_type']   = $this->control_type ?? 'text';
            $result['label_position'] = $this->label_position ?? 'top';
            $result['label_width']    = $this->label_width ?? 100;
            $result['field_name']     = $this->schemaField?->field_name;
            $result['field_type']     = $this->schemaField?->field_type;
            $result['lookup_table']   = $this->lookupTable?->table_name ?? $this->schemaField?->link_table;
            $result['lookup_display'] = $this->lookup_display_field ?? $this->schemaField?->link_display_field;
            $result['lookup_value']   = $this->lookup_value_field ?? $this->schemaField?->link_field;
            $result['lookup_sort']    = $this->lookup_sort_field ?? $this->schemaField?->link_order_field;
        } elseif ($this->item_type === 'button') {
            $result['control_type']     = 'button';
            $result['button_type']      = $this->button_type;
            $result['icon']             = $this->button_icon;
            $result['action']           = $this->button_action;
            $result['background_color'] = $this->button_background_color;
            $result['text_color']       = $this->button_text_color;
        } elseif ($this->item_type === 'menu_item') {
            $result['control_type'] = 'menu_item';
            $result['icon']         = $this->menu_icon;
            $result['action']       = $this->menu_action;
            $result['menu_role']    = $this->menu_role_required;
            $result['menu_depth']   = $this->menu_depth;
        }

        return $result;
    }
}
