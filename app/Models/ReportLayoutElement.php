<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportLayoutElement extends Model
{
    use HasFactory;

    protected $fillable = [
        'report_pattern_form_id',
        'container_element_id',
        'element_type',
        'schema_table_id',
        'schema_field_id',
        'x_position',
        'y_position',
        'width',
        'height',
        'content',
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
        'caption_override',
        'caption_labels',
        'label_position',
        'label_width',
        'control_type',
        'header_style',
        'sort_order',
        'is_visible',
    ];

    protected $casts = [
        'x_position' => 'decimal:2',
        'y_position' => 'decimal:2',
        'width' => 'decimal:2',
        'height' => 'decimal:2',
        'font_size' => 'decimal:2',
        'border_width' => 'decimal:2',
        'caption_labels' => 'array',
        'header_style' => 'array',
        'sort_order' => 'integer',
        'is_visible' => 'boolean',
    ];

    public const ELEMENT_TYPES = [
        'field', 'static_text', 'heading',
        'line_horizontal', 'line_vertical', 'box',
        'page_number', 'page_date', 'page_total',
        'image_placeholder',
    ];

    /**
     * Concrete default values that fill the cascade's last resort. Read-time
     * resolution: every styling key in the GTree gets a concrete value, so
     * template authors never have to do `|| 'default'` themselves and the
     * generator output is fully predictable.
     *
     * If a future requirement needs different defaults per project / report
     * pattern, this can become a config or DB-driven lookup. For now we keep
     * it as a single source of truth on the model.
     */
    public const STYLE_DEFAULTS = [
        'font_family'      => 'Arial',
        'font_size'        => 10.00,
        'font_weight'      => 'normal',
        'font_style'       => 'normal',
        'text_decoration'  => 'none',
        'text_align'       => 'left',
        'text_color'       => '#000000',
        'background_color' => '#ffffff',
        'border_width'     => 0.0,
        'border_color'     => '#000000',
        'border_style'     => 'solid', // virtual key — no DB column yet
    ];

    /**
     * Apply STYLE_DEFAULTS to fill in any null/missing key in $style. Used by
     * both toGTreeArray() and inheritContainerStyle() so the final GTree row
     * always has concrete values for every styling field.
     */
    public static function applyStyleDefaults(array $style): array
    {
        foreach (self::STYLE_DEFAULTS as $key => $default) {
            if (!array_key_exists($key, $style) || $style[$key] === null || $style[$key] === '') {
                $style[$key] = $default;
            }
        }
        return $style;
    }

    public const TEXT_TYPES = ['field', 'static_text', 'heading', 'page_number', 'page_date', 'page_total'];

    public const SHAPE_TYPES = ['line_horizontal', 'line_vertical', 'box'];

    // ========== RELATIONSHIPS ==========

    public function form(): BelongsTo
    {
        return $this->belongsTo(ReportPatternForm::class, 'report_pattern_form_id');
    }

    public function containerElement(): BelongsTo
    {
        return $this->belongsTo(ReportPatternElement::class, 'container_element_id');
    }

    public function schemaTable(): BelongsTo
    {
        return $this->belongsTo(SchemaTable::class);
    }

    public function schemaField(): BelongsTo
    {
        return $this->belongsTo(SchemaField::class);
    }

    // ========== SCOPES ==========

    public function scopeVisible($query)
    {
        return $query->where('is_visible', true);
    }

    public function scopeFields($query)
    {
        return $query->where('element_type', 'field');
    }

    public function scopeInContainer($query, int $containerId)
    {
        return $query->where('container_element_id', $containerId);
    }

    public function scopeForForm($query, int $formId)
    {
        return $query->where('report_pattern_form_id', $formId);
    }

    public function scopeForFormAndTable($query, int $formId, int $tableId)
    {
        return $query->where('report_pattern_form_id', $formId)->where('schema_table_id', $tableId);
    }

    // ========== ACCESSORS ==========

    public function getIsFieldAttribute(): bool
    {
        return $this->element_type === 'field';
    }

    public function getIsTextTypeAttribute(): bool
    {
        return in_array($this->element_type, self::TEXT_TYPES);
    }

    public function getIsShapeTypeAttribute(): bool
    {
        return in_array($this->element_type, self::SHAPE_TYPES);
    }

    public function getEffectiveCaptionAttribute(): string
    {
        if ($this->caption_override) {
            return $this->caption_override;
        }

        $fieldName = $this->schemaField?->field_name ?? 'Field';
        return str_replace('_', ' ', ucwords(str_replace('_', ' ', $fieldName)));
    }

    // ========== GTREE SERIALIZATION ==========

    /**
     * Emit a flat associative array suitable for the code-generator's GTree.
     * Mirrors FormItemPlacement::toGTreeArray() in spirit so templates see a
     * consistent shape between layoutsingle and layoutreportsingle.
     *
     * @param string|null $language Language code for sprach-aware caption fallback.
     */
    public function toGTreeArray(?string $language = null): array
    {
        // Sprach-aware label resolution. For fields the fallback chain is:
        //   caption_labels[$lang] → caption_override → schemaField.caption → field_name
        $label = null;
        if ($language && is_array($this->caption_labels) && !empty($this->caption_labels[$language])) {
            $label = $this->caption_labels[$language];
        } elseif ($this->caption_override) {
            $label = $this->caption_override;
        } else {
            $label = $this->effective_caption;
        }

        // Cascade fallback: when a style value is null on the layout row, fall
        // back to the same field on the parent ReportPatternElement (the
        // container in the Vorlage). This lets the user set "default look" on
        // the container in the report-pattern designer and have all auto-placed
        // fields inherit it without manually copying every value.
        $container = $this->containerElement; // may be null if no container
        $cascade = function (string $key) use ($container) {
            $own = $this->{$key};
            if ($own !== null && $own !== '') return $own;
            return $container ? $container->{$key} : null;
        };

        // ── Common keys (every element type carries these) ──
        // Style values go through applyStyleDefaults() at the end so the GTree
        // row always has a concrete value for every styling key — no nulls,
        // no template-side `|| 'default'`.
        $result = self::applyStyleDefaults([
            'id'               => $this->id,
            'type'             => $this->element_type,
            'x'                => (float) $this->x_position,
            'y'                => (float) $this->y_position,
            'width'            => (float) $this->width,
            'height'           => (float) $this->height,
            'visible'          => (bool) $this->is_visible,
            'z_order'          => (int) $this->sort_order,
            'container_id'     => $this->container_element_id,
            'label'            => $label,
            'font_family'      => $cascade('font_family'),
            'font_size'        => (function () use ($cascade) {
                $v = $cascade('font_size');
                return $v !== null ? (float) $v : null;
            })(),
            'font_weight'      => $cascade('font_weight'),
            'font_style'       => $cascade('font_style'),
            'text_decoration'  => $cascade('text_decoration'),
            'text_align'       => $cascade('text_align'),
            'text_color'       => $cascade('text_color'),
            'background_color' => $cascade('background_color'),
            'border_width'     => (function () use ($cascade) {
                $v = $cascade('border_width');
                return $v !== null ? (float) $v : null;
            })(),
            'border_color'     => $cascade('border_color'),
        ]);

        // ── Type-specific keys ──
        if ($this->element_type === 'field') {
            $result['control_type']    = $this->control_type ?? 'field';
            $result['label_position']  = $this->label_position ?? 'left';
            $result['label_width']     = $this->label_width !== null ? (float) $this->label_width : null;
            $result['schema_table_id'] = $this->schema_table_id;
            $result['schema_field_id'] = $this->schema_field_id;
            $result['field_name']      = $this->schemaField?->field_name;
            $result['field_type']      = $this->schemaField?->field_type;
            $result['caption']         = $label; // alias used by some templates
            $result['header_style']    = is_array($this->header_style) ? $this->header_style : null;
        } elseif (in_array($this->element_type, ['static_text', 'heading'], true)) {
            // Sprach-aware content fallback
            if ($language && is_array($this->caption_labels) && !empty($this->caption_labels[$language])) {
                $result['content'] = $this->caption_labels[$language];
            } else {
                $result['content'] = $this->content;
            }
        } elseif (in_array($this->element_type, ['page_number', 'page_date', 'page_total'], true)) {
            $result['content'] = $this->content; // format string, e.g. "Page {n}"
        } elseif ($this->element_type === 'image_placeholder') {
            $result['content'] = $this->content; // path / placeholder
        }
        // line_horizontal / line_vertical / box: only need the common geometry+colour keys.

        return $result;
    }

    // ========== AUTO-PLACEMENT (shared with ReportLayoutController::autoPlace) ==========

    /**
     * Pure auto-placement algorithm — produces an array of placement assoc-arrays
     * in the same shape as toGTreeArray(), without touching the database. Both
     * the API endpoint (which then persists them via create()) and the code
     * generator (transient fallback when no saved layout exists) call this.
     *
     * @return array<int, array<string, mixed>>
     */
    public static function computeAutoPlacements(
        \App\Models\ReportPatternForm $form,
        \App\Models\SchemaTable $schemaTable,
        ?string $language = null
    ): array {
        // The form must have its elements + the table its fields loaded.
        $form->loadMissing('elements');
        $schemaTable->loadMissing('fields');

        // Container und Sektionen finden (detail_section bevorzugen für report_list)
        $containers = $form->elements
            ->whereIn('element_type', ['container', 'detail_section'])
            ->values();
        if ($containers->isEmpty()) {
            $containers = $form->elements->values();
        }
        if ($containers->isEmpty()) {
            return [];
        }

        // Filter fields: skip auto_increment + timestamps
        $fieldsToPlace = $schemaTable->fields->filter(function ($field) {
            if ($field->is_auto_increment) return false;
            if (in_array($field->field_name, ['created_at', 'updated_at', 'deleted_at'], true)) return false;
            return true;
        })->values();

        if ($fieldsToPlace->isEmpty()) {
            return [];
        }

        $placements = [];

        if ($form->form_type === 'report_list') {
            // ===== LIST MODE: Felder werden zu Tabellen-Spalten =====
            $firstContainer = $containers->first();
            // Prefer table_header für X/width (definiert wo die Spalten beginnen)
            $tableHeader = $form->elements->where('element_type', 'table_header')->first();
            $refElement  = $tableHeader ?: $firstContainer;
            $containerX  = $refElement ? (float) $refElement->x_position : 0;
            $containerY  = $refElement ? (float) $refElement->y_position : 0;
            $containerW  = $refElement ? (float) $refElement->width : 180;
            $columnWidth = round($containerW / $fieldsToPlace->count(), 2);
            $rowHeight   = (float) ($form->row_height ?? 5);
            $xOffset     = $containerX;

            // Inherit style from the reference container/header in the Vorlage
            // (background_color, border_color, fonts, etc.) AND from the form's
            // list_style_config JSON as a second-level fallback. The user can
            // set colors on the table_header element OR via the "List Style"
            // tab in the designer — both end up here.
            $containerStyle = self::inheritContainerStyle($refElement, $form);

            foreach ($fieldsToPlace as $index => $field) {
                $caption = self::resolveFieldCaption($field, $schemaTable, $language);
                $captionLabels = self::resolveFieldCaptionLabels($field, $schemaTable);
                $placements[] = array_merge([
                    'id'               => null, // transient
                    'type'             => 'field',
                    'x'                => round($xOffset, 2),
                    'y'                => round($containerY, 2),
                    'width'            => $columnWidth,
                    'height'           => $rowHeight,
                    'visible'          => true,
                    'z_order'          => $index,
                    'container_id'     => $firstContainer ? $firstContainer->id : null,
                    'label'            => $caption,
                ], $containerStyle, [
                    // Field-specific
                    'control_type'     => 'field',
                    'label_position'   => null,
                    'label_width'      => null,
                    'schema_table_id'  => $schemaTable->id,
                    'schema_field_id'  => $field->id,
                    'field_name'       => $field->field_name,
                    'field_type'       => $field->field_type,
                    'caption'          => $caption,
                    'caption_labels'   => $captionLabels,
                    'header_style'     => null,
                ]);
                $xOffset += $columnWidth;
            }

            return $placements;
        }

        // ===== SINGLE MODE: Free-form placement in containers =====
        $containerIdx     = 0;
        $fieldCount       = 0;
        $currentContainer = $containers[$containerIdx];
        $containerX       = (float) $currentContainer->x_position;
        $containerY       = (float) $currentContainer->y_position;
        $columns          = $currentContainer->container_columns ?? 1;
        $maxFields        = $currentContainer->max_fields;
        $containerWidth   = (float) $currentContainer->width;
        $gap              = (float) ($currentContainer->container_gap ?? 2.00);
        $fieldWidth       = $columns > 1
            ? round(($containerWidth - ($columns - 1) * $gap) / $columns, 2)
            : $containerWidth;
        $fieldHeight      = (float) ($currentContainer->field_height ?? 6.00);

        foreach ($fieldsToPlace as $index => $field) {
            // Container-Wechsel bei max_fields
            if ($maxFields && $fieldCount >= $maxFields) {
                $containerIdx++;
                if ($containerIdx >= $containers->count()) break;
                $currentContainer = $containers[$containerIdx];
                $containerX       = (float) $currentContainer->x_position;
                $containerY       = (float) $currentContainer->y_position;
                $columns          = $currentContainer->container_columns ?? 1;
                $maxFields        = $currentContainer->max_fields;
                $containerWidth   = (float) $currentContainer->width;
                $gap              = (float) ($currentContainer->container_gap ?? 2.00);
                $fieldWidth       = $columns > 1
                    ? round(($containerWidth - ($columns - 1) * $gap) / $columns, 2)
                    : $containerWidth;
                $fieldHeight      = (float) ($currentContainer->field_height ?? 6.00);
                $fieldCount       = 0;
            }

            $col = $fieldCount % $columns;
            $row = intval($fieldCount / $columns);
            $x   = round($containerX + $col * ($fieldWidth + $gap), 2);
            $y   = round($containerY + $row * ($fieldHeight + $gap), 2);

            // Auto-detect control type from field schema
            $controlType = 'field';
            $ft = strtolower($field->field_type ?? '');
            if ($ft === 'tinyint' || str_contains($ft, 'bool')) {
                $controlType = 'checkbox';
            } elseif ($field->link_table) {
                $controlType = 'combobox';
            }

            $caption = self::resolveFieldCaption($field, $schemaTable, $language);
            $captionLabels = self::resolveFieldCaptionLabels($field, $schemaTable);
            // Inherit style from the current container in the Vorlage AND from
            // the form's list_style_config JSON as a second-level fallback.
            $containerStyle = self::inheritContainerStyle($currentContainer, $form);
            $placements[] = array_merge([
                'id'               => null,
                'type'             => 'field',
                'x'                => $x,
                'y'                => $y,
                'width'            => $fieldWidth,
                'height'           => max($fieldHeight, 6.00),
                'visible'          => true,
                'z_order'          => $index,
                'container_id'     => $currentContainer->id,
                'label'            => $caption,
            ], $containerStyle, [
                // Field-specific
                'control_type'     => $controlType,
                'label_position'   => 'left',
                'label_width'      => 25.00,
                'schema_table_id'  => $schemaTable->id,
                'schema_field_id'  => $field->id,
                'field_name'       => $field->field_name,
                'field_type'       => $field->field_type,
                'caption'          => $caption,
                'caption_labels'   => $captionLabels,
                'header_style'     => null,
            ]);

            $fieldCount++;
        }

        return $placements;
    }

    /**
     * Build the style hash inherited from a ReportPatternElement (container).
     * Used by computeAutoPlacements() so auto-placed fields adopt the same
     * "default look" the user set on the container in the report-pattern
     * designer.
     *
     * Cascade chain (most specific → most general):
     *   1. The container element's own per-element columns (`background_color` etc.)
     *   2. The form's `list_style_config` JSON, mapped per container type:
     *        - table_header   → header_bg_color / header_text_color / outer_border_*
     *        - detail_section → row_even_bg_color (closest to a "default row look")
     *        - other          → outer_border_*
     *   3. Hard-coded fallback (Arial 10pt, black text, no bg)
     *
     * The saved-layout path uses the per-row $cascade closure in toGTreeArray()
     * which falls back to the container element only — to also benefit from
     * list_style_config the saved layout could be enhanced later, but for now
     * the auto-place pipeline (which is the dominant case for fresh tables)
     * gets the full cascade.
     *
     * @param mixed $container ReportPatternElement|null
     * @param mixed $form      ReportPatternForm|null (for list_style_config)
     * @return array<string, mixed>
     */
    private static function inheritContainerStyle($container, $form = null): array
    {
        // Pull list_style_config (the form-level JSON Style-Quelle) and pick
        // the right keys based on the container type.
        $ls = ($form && is_array($form->list_style_config ?? null)) ? $form->list_style_config : [];
        $type = $container->element_type ?? null;

        // Type-specific list_style_config fallbacks
        $lsBackground = null;
        $lsText       = null;
        $lsBorderColor = null;
        $lsBorderWidth = null;
        if ($type === 'table_header') {
            $lsBackground  = $ls['header_bg_color'] ?? null;
            $lsText        = $ls['header_text_color'] ?? null;
            $lsBorderColor = $ls['header_border_bottom_color'] ?? $ls['outer_border_color'] ?? null;
            $lsBorderWidth = isset($ls['header_border_bottom_width']) ? (float) $ls['header_border_bottom_width']
                : (isset($ls['outer_border_width']) ? (float) $ls['outer_border_width'] : null);
        } elseif ($type === 'detail_section') {
            // Even-row colour is the closest thing to "the look of a single
            // detail row", so we use it as the default field background.
            $lsBackground  = $ls['row_even_bg_color'] ?? null;
            $lsText        = null; // no per-row text colour in list_style_config
            $lsBorderColor = $ls['row_border_bottom_color'] ?? $ls['detail_border_bottom_color'] ?? $ls['outer_border_color'] ?? null;
            $lsBorderWidth = isset($ls['row_border_bottom_width']) ? (float) $ls['row_border_bottom_width']
                : (isset($ls['outer_border_width']) ? (float) $ls['outer_border_width'] : null);
        } else {
            $lsBorderColor = $ls['outer_border_color'] ?? null;
            $lsBorderWidth = isset($ls['outer_border_width']) ? (float) $ls['outer_border_width'] : null;
        }

        if (!$container) {
            return self::applyStyleDefaults([
                'font_family'      => null,
                'font_size'        => null,
                'font_weight'      => null,
                'font_style'       => null,
                'text_decoration'  => null,
                'text_align'       => null,
                'text_color'       => $lsText,
                'background_color' => $lsBackground,
                'border_width'     => $lsBorderWidth,
                'border_color'     => $lsBorderColor,
            ]);
        }
        return self::applyStyleDefaults([
            'font_family'      => $container->font_family,
            'font_size'        => $container->font_size !== null ? (float) $container->font_size : null,
            'font_weight'      => $container->font_weight,
            'font_style'       => $container->font_style,
            'text_decoration'  => $container->text_decoration,
            'text_align'       => $container->text_align,
            'text_color'       => $container->text_color ?? $lsText,
            'background_color' => $container->background_color ?? $lsBackground,
            'border_width'     => $container->border_width !== null ? (float) $container->border_width : $lsBorderWidth,
            'border_color'     => $container->border_color ?? $lsBorderColor,
        ]);
    }

    /**
     * Resolve a single caption for a SchemaField in the given language.
     *
     * Lookup order:
     *   1. schema_translations row for "{tableName}.{fieldName}" in $language
     *   2. Humanized field_name (id → Id, first_name → First Name)
     *
     * Called by computeAutoPlacements() to produce the visible label shown in
     * the designer canvas. The SchemaTable must be passed so the item_name
     * key can be built (SchemaField has no back-reference to its table name
     * when loaded transiently).
     */
    private static function resolveFieldCaption(
        \App\Models\SchemaField $field,
        ?\App\Models\SchemaTable $schemaTable,
        ?string $language
    ): string {
        if ($language && $schemaTable && !empty($schemaTable->table_name) && !empty($field->field_name)) {
            $itemName = $schemaTable->table_name . '.' . $field->field_name;
            $translated = \App\Models\SchemaTranslation::getTranslation($itemName, $language);
            if (!empty($translated)) {
                return $translated;
            }
        }
        return str_replace('_', ' ', ucwords(str_replace('_', ' ', $field->field_name ?? 'Field')));
    }

    /**
     * Resolve the full per-language caption map for a SchemaField.
     * Returns an associative array keyed by language code so the placement
     * can persist a multi-language snapshot in ReportLayoutElement.caption_labels.
     *
     * Only active translations are included. Empty array when no
     * translations are set — caller should fall back to live lookups.
     */
    private static function resolveFieldCaptionLabels(
        \App\Models\SchemaField $field,
        ?\App\Models\SchemaTable $schemaTable
    ): array {
        if (!$schemaTable || empty($schemaTable->table_name) || empty($field->field_name)) {
            return [];
        }
        $itemName = $schemaTable->table_name . '.' . $field->field_name;
        $translations = \App\Models\SchemaTranslation::getAllTranslationsForItem($itemName);

        $labels = [];
        foreach ($translations as $code => $row) {
            if (!empty($row->translated_text)) {
                $labels[$code] = $row->translated_text;
            }
        }
        return $labels;
    }
}
