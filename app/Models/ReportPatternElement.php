<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ReportPatternElement extends Model
{
    use HasFactory;

    protected $fillable = [
        'report_pattern_form_id',
        'element_type',
        'x_position',
        'y_position',
        'width',
        'height',
        'container_columns',
        'container_gap',
        'max_fields',
        'field_height',
        'content',
        'content_labels',
        'font_family',
        'font_size',
        'font_weight',
        'font_style',
        'text_decoration',
        'text_align',
        'text_color',
        'border_width',
        'border_color',
        'background_color',
        'label',
        'sort_order',
        'is_visible',
        'linked_element_id',
    ];

    protected $casts = [
        'x_position' => 'decimal:2',
        'y_position' => 'decimal:2',
        'width' => 'decimal:2',
        'height' => 'decimal:2',
        'container_columns' => 'integer',
        'container_gap' => 'decimal:2',
        'max_fields' => 'integer',
        'field_height' => 'decimal:2',
        'content_labels' => 'array',
        'font_size' => 'decimal:1',
        'border_width' => 'decimal:1',
        'sort_order' => 'integer',
        'is_visible' => 'boolean',
        'linked_element_id' => 'integer',
    ];

    public const ELEMENT_TYPES = [
        'container', 'header_section', 'detail_section', 'footer_section', 'table_header',
        'static_text', 'heading', 'line_horizontal', 'line_vertical', 'box',
        'page_number', 'page_date', 'page_total', 'image_placeholder',
    ];

    public const SECTION_TYPES = ['header_section', 'detail_section', 'footer_section', 'table_header'];

    // ========== RELATIONSHIPS ==========

    public function form(): BelongsTo
    {
        return $this->belongsTo(ReportPatternForm::class, 'report_pattern_form_id');
    }

    public function layoutElements(): HasMany
    {
        return $this->hasMany(ReportLayoutElement::class, 'container_element_id')->orderBy('sort_order');
    }

    /**
     * The detail_section this table_header is linked to
     */
    public function linkedElement(): BelongsTo
    {
        return $this->belongsTo(self::class, 'linked_element_id');
    }

    /**
     * The table_header linked to this detail_section
     */
    public function tableHeader(): HasOne
    {
        return $this->hasOne(self::class, 'linked_element_id');
    }

    // ========== SCOPES ==========

    public function scopeVisible($query)
    {
        return $query->where('is_visible', true);
    }

    public function scopeContainers($query)
    {
        return $query->where('element_type', 'container');
    }

    public function scopeSections($query)
    {
        return $query->whereIn('element_type', self::SECTION_TYPES);
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('element_type', $type);
    }

    // ========== ACCESSORS ==========

    public function getIsSectionAttribute(): bool
    {
        return in_array($this->element_type, self::SECTION_TYPES);
    }

    // ========== METHODS ==========

    public function toGTreeArray(): array
    {
        // Apply STYLE_DEFAULTS so the GTree row always has concrete styling
        // values for every key — template authors never need fallback chains.
        return \App\Models\ReportLayoutElement::applyStyleDefaults([
            'id' => $this->id,
            'type' => $this->element_type,
            'x' => (float) $this->x_position,
            'y' => (float) $this->y_position,
            'width' => (float) $this->width,
            'height' => (float) $this->height,
            'columns' => $this->container_columns,
            'gap' => (float) $this->container_gap,
            'max_fields' => $this->max_fields,
            'field_height' => $this->field_height !== null ? (float) $this->field_height : null,
            'label' => $this->label,
            'visible' => $this->is_visible,
            'is_section' => $this->is_section,
            'content' => $this->content,
            'linked_element_id' => $this->linked_element_id,
            // Style fields — fall through to STYLE_DEFAULTS if null
            'font_family' => $this->font_family,
            'font_size' => $this->font_size !== null ? (float) $this->font_size : null,
            'font_weight' => $this->font_weight,
            'font_style' => $this->font_style,
            'text_decoration' => $this->text_decoration,
            'text_align' => $this->text_align,
            'text_color' => $this->text_color,
            'background_color' => $this->background_color,
            'border_width' => $this->border_width !== null ? (float) $this->border_width : null,
            'border_color' => $this->border_color,
        ]);
    }
}
