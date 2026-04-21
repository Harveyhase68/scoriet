<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FormElement extends Model
{
    use HasFactory;

    protected $fillable = [
        'form_window_id',
        'element_type',
        'x_position',
        'y_position',
        'width',
        'height',
        'anchor_right',
        'anchor_bottom',
        'anchor_width',
        'anchor_height',
        'container_orientation',
        'max_fields',
        'container_gap',
        'container_columns',
        'default_control_height',
        'button_label',
        'button_icon',
        'button_action',
        'button_background_color',
        'button_text_color',
        'tab_label',
        'parent_tab_container_id',
        'custom_style',
        'sort_order',
        'tab_order',
        'is_visible',
    ];

    protected $casts = [
        'x_position' => 'integer',
        'y_position' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
        'anchor_right' => 'decimal:2',
        'anchor_bottom' => 'decimal:2',
        'anchor_width' => 'decimal:2',
        'anchor_height' => 'decimal:2',
        'max_fields' => 'integer',
        'container_gap' => 'integer',
        'container_columns' => 'integer',
        'custom_style' => 'array',
        'sort_order' => 'integer',
        'tab_order' => 'integer',
        'is_visible' => 'boolean',
    ];

    /**
     * Element-Typen Kategorien
     */
    public const ELEMENT_CATEGORIES = [
        'containers' => ['container', 'tab_container', 'tab_panel', 'menu_container'],
        'navigation' => ['button_nav_first', 'button_nav_prev', 'button_nav_next', 'button_nav_last'],
        'actions' => ['button_save', 'button_cancel', 'button_close', 'button_new', 'button_delete', 'button_custom'],
        'layout' => ['separator', 'spacer'],
    ];

    /**
     * Standard-Icons für Element-Typen
     */
    public const DEFAULT_ICONS = [
        'button_nav_first' => 'pi-angle-double-left',
        'button_nav_prev' => 'pi-angle-left',
        'button_nav_next' => 'pi-angle-right',
        'button_nav_last' => 'pi-angle-double-right',
        'button_save' => 'pi-save',
        'button_cancel' => 'pi-times',
        'button_close' => 'pi-times',
        'button_new' => 'pi-plus',
        'button_delete' => 'pi-trash',
    ];

    // ========== RELATIONSHIPS ==========

    /**
     * Fenster
     */
    public function formWindow(): BelongsTo
    {
        return $this->belongsTo(FormWindow::class);
    }

    /**
     * Übergeordneter Tab-Container (für tab_panel)
     */
    public function parentTabContainer(): BelongsTo
    {
        return $this->belongsTo(FormElement::class, 'parent_tab_container_id');
    }

    /**
     * Kind-Tab-Panels (für tab_container)
     */
    public function tabPanels(): HasMany
    {
        return $this->hasMany(FormElement::class, 'parent_tab_container_id')
            ->where('element_type', 'tab_panel')
            ->orderBy('sort_order');
    }

    // ========== SCOPES ==========

    /**
     * Nur sichtbare Elemente
     */
    public function scopeVisible($query)
    {
        return $query->where('is_visible', true);
    }

    /**
     * Nach Element-Typ filtern
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('element_type', $type);
    }

    /**
     * Container-Elemente
     */
    public function scopeContainers($query)
    {
        return $query->whereIn('element_type', self::ELEMENT_CATEGORIES['containers']);
    }

    /**
     * Button-Elemente
     */
    public function scopeButtons($query)
    {
        return $query->whereIn('element_type', array_merge(
            self::ELEMENT_CATEGORIES['navigation'],
            self::ELEMENT_CATEGORIES['actions']
        ));
    }

    // ========== ACCESSORS ==========

    /**
     * Ist ein Container?
     */
    public function getIsContainerAttribute(): bool
    {
        return in_array($this->element_type, self::ELEMENT_CATEGORIES['containers']);
    }

    /**
     * Ist ein Button?
     */
    public function getIsButtonAttribute(): bool
    {
        return in_array($this->element_type, array_merge(
            self::ELEMENT_CATEGORIES['navigation'],
            self::ELEMENT_CATEGORIES['actions']
        ));
    }

    /**
     * Effektives Icon (custom oder default)
     */
    public function getEffectiveIconAttribute(): ?string
    {
        return $this->button_icon ?? (self::DEFAULT_ICONS[$this->element_type] ?? null);
    }

    // ========== METHODS ==========

    /**
     * Element als Array für GTree
     * Gibt nur relevante Eigenschaften je nach Element-Typ zurück
     */
    public function toGTreeArray(): array
    {
        // Basis-Eigenschaften für alle Elemente
        $result = [
            'id' => $this->id,
            'type' => $this->element_type,
            'x' => $this->x_position,
            'y' => $this->y_position,
            'width' => $this->width,
            'height' => $this->height,
            'style' => $this->custom_style,
            'visible' => $this->is_visible,
            'is_container' => $this->is_container,
            'is_button' => $this->is_button,
            'tab_order' => $this->tab_order ?? 0,
        ];

        // Container-spezifische Eigenschaften (nur für container, menu_container, tab_container)
        if ($this->is_container) {
            $result['orientation'] = $this->container_orientation ?? 'vertical';
            $result['max_fields'] = $this->max_fields;
            $result['gap'] = $this->container_gap ?? 8;
            $result['columns'] = $this->container_columns ?? 1;
        }

        // Button-spezifische Eigenschaften (nur für Buttons)
        if ($this->is_button) {
            $result['label'] = $this->button_label;
            $result['icon'] = $this->effective_icon;
            $result['action'] = $this->button_action;
            $result['background_color'] = $this->button_background_color;
            $result['text_color'] = $this->button_text_color;
        }

        // Tab-Panel spezifisch
        if ($this->element_type === 'tab_panel') {
            $result['label'] = $this->tab_label;
        }

        return $result;
    }
}
