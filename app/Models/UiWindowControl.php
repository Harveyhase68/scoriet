<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A single widget placed on a Window canvas (text, checkbox, dropdown,
 * button, ...). Generalization of the legacy FormItemPlacement, but not
 * bound to a schema table - `schema_field_id` is an optional generator
 * property (roadmap Step 2), not required for the control to exist.
 */
class UiWindowControl extends Model
{
    use HasFactory;

    protected $fillable = [
        'window_id',
        'container_element_id',
        'control_type',
        'source_name',
        'schema_field_id',
        'x_position',
        'y_position',
        'width',
        'height',
        'anchor_right',
        'anchor_bottom',
        'anchor_width',
        'anchor_height',
        'caption_override',
        'caption_labels',
        'shortcut_enabled',
        'shortcut',
        'comment_override',
        'comment_labels',
        'hint_override',
        'hint_labels',
        'label_position',
        'label_width',
        'caption_position_horizontal',
        'caption_position_vertical',
        'static_text_border_style',
        'caption_visible',
        'icon_position_horizontal',
        'icon_position_vertical',
        'options',
        'is_required',
        'control_state',
        'data_binding',
        'browsed_file',
        'table_columns',
        'default_value',
        'min_value',
        'max_value',
        'step_value',
        'control_background_color',
        'control_text_color',
        'header_background_color',
        'header_text_color',
        'row_background_color_even',
        'row_height',
        'icon_class',
        'icon_data',
        'icon_state_count',
        'icon_mode',
        'background_image',
        'background_image_states',
        'style_config',
        'font_family',
        'font_size',
        'font_bold',
        'font_italic',
        'font_underline',
        'font_strikeout',
        'sort_order',
        'tab_order',
        'is_visible',
    ];

    protected $casts = [
        'window_id' => 'integer',
        'container_element_id' => 'integer',
        'schema_field_id' => 'integer',
        'x_position' => 'integer',
        'y_position' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
        // Plain float, not decimal:2 - Laravel's decimal cast always
        // serializes to a formatted STRING (e.g. "16.00") to protect
        // money-grade values from float rounding, which none of these
        // need. A string silently breaks anything that uses the value as a
        // raw CSS number (React only auto-appends "px" to real JS numbers -
        // a unitless string like "16.00" is invalid CSS and gets ignored,
        // which is exactly what made font_size look inconsistent until a
        // field was touched and PrimeReact's InputNumber handed back a real
        // number).
        'anchor_right' => 'float',
        'anchor_bottom' => 'float',
        'anchor_width' => 'float',
        'anchor_height' => 'float',
        'caption_labels' => 'array',
        'shortcut_enabled' => 'boolean',
        'comment_labels' => 'array',
        'hint_labels' => 'array',
        'label_width' => 'integer',
        'row_height' => 'integer',
        'caption_visible' => 'boolean',
        'font_size' => 'float',
        'font_bold' => 'boolean',
        'font_italic' => 'boolean',
        'font_underline' => 'boolean',
        'font_strikeout' => 'boolean',
        'options' => 'array',
        'is_required' => 'boolean',
        'table_columns' => 'array',
        'min_value' => 'float',
        'max_value' => 'float',
        'step_value' => 'float',
        'icon_state_count' => 'integer',
        'background_image_states' => 'integer',
        'icon_mode' => 'integer',
        'style_config' => 'array',
        'sort_order' => 'integer',
        'tab_order' => 'integer',
        'is_visible' => 'boolean',
    ];

    public function window(): BelongsTo
    {
        return $this->belongsTo(UiWindow::class, 'window_id');
    }

    public function containerElement(): BelongsTo
    {
        return $this->belongsTo(UiWindowElement::class, 'container_element_id');
    }

    public function schemaField(): BelongsTo
    {
        return $this->belongsTo(SchemaField::class);
    }

    public function scopeForWindow($query, int $windowId)
    {
        return $query->where('window_id', $windowId);
    }

    public function scopeInContainer($query, ?int $containerId)
    {
        return $query->where('container_element_id', $containerId);
    }

    public function scopeVisible($query)
    {
        return $query->where('is_visible', true);
    }

    public function getEffectiveCaptionAttribute(): string
    {
        if ($this->caption_override) {
            return $this->caption_override;
        }

        // static_text with a genuinely empty caption stays blank rather than
        // falling back to the type name ("Static Text") - same exception as
        // WindowDesignerPanel.tsx's effectiveCaption() on the frontend, kept
        // in sync here since generated Flutter output reads THIS accessor
        // (via toGTreeArray()), not the frontend's TS resolver.
        if ($this->control_type === 'static_text') {
            return '';
        }

        return str_replace('_', ' ', ucwords(str_replace('_', ' ', $this->control_type)));
    }

    /**
     * Convert control to GTree array for the template engine (roadmap Step 3).
     */
    public function toGTreeArray(?string $language = null): array
    {
        $caption = $this->effective_caption;
        if ($language && ! empty($this->caption_labels[$language])) {
            $caption = $this->caption_labels[$language];
        }

        $comment = $this->comment_override;
        if ($language && ! empty($this->comment_labels[$language])) {
            $comment = $this->comment_labels[$language];
        }

        $hint = $this->hint_override;
        if ($language && ! empty($this->hint_labels[$language])) {
            $hint = $this->hint_labels[$language];
        }

        // Each option's 'caption' resolves the same way the control's own
        // caption does above (labels[language] -> value as a last resort,
        // since an option with no label yet at least needs SOME visible
        // text) - {:for nmaxoptions:} reads this resolved field, never the
        // raw per-language 'labels' map directly.
        $resolvedOptions = array_map(function ($option) use ($language) {
            $optionCaption = $option['value'] ?? '';
            if ($language && ! empty($option['labels'][$language])) {
                $optionCaption = $option['labels'][$language];
            } elseif (! empty($option['labels']) && count($option['labels']) > 0) {
                $optionCaption = reset($option['labels']);
            }

            return [
                'value' => $option['value'] ?? '',
                'caption' => $optionCaption,
                'labels' => $option['labels'] ?? [],
            ];
        }, $this->options ?? []);

        return [
            'id' => $this->id,
            // The control's own WinDev unit name (e.g. "BTN_Save") - SML code
            // (win.open/ui.get/ui.set/event handlers) always addresses controls
            // by this name, never Scoriet's own numeric id. Needed for the
            // Flutter SML template's per-control SmlControlBinding registry key
            // and Dart field naming (see %1_page.dart).
            'source_name' => $this->source_name,
            'control_type' => $this->control_type,
            'x' => $this->x_position,
            'y' => $this->y_position,
            'width' => $this->width,
            'height' => $this->height,
            'visible' => $this->is_visible,
            'sort_order' => $this->sort_order,
            'tab_order' => $this->tab_order,
            'anchor_right' => $this->anchor_right,
            'anchor_bottom' => $this->anchor_bottom,
            'anchor_width' => $this->anchor_width,
            'anchor_height' => $this->anchor_height,
            'caption' => $caption,
            'caption_labels' => $this->caption_labels ?? [],
            'shortcut_enabled' => $this->shortcut_enabled,
            'shortcut' => $this->shortcut,
            'comment' => $comment,
            'comment_labels' => $this->comment_labels ?? [],
            'hint' => $hint,
            'hint_labels' => $this->hint_labels ?? [],
            'label_position' => $this->label_position ?? 'top',
            'label_width' => $this->label_width ?? 100,
            'caption_position_horizontal' => $this->caption_position_horizontal,
            'caption_position_vertical' => $this->caption_position_vertical,
            'caption_visible' => $this->caption_visible,
            'icon_position_horizontal' => $this->icon_position_horizontal,
            'icon_position_vertical' => $this->icon_position_vertical,
            'control_background_color' => $this->control_background_color,
            'control_text_color' => $this->control_text_color,
            'header_background_color' => $this->header_background_color,
            'header_text_color' => $this->header_text_color,
            'row_background_color_even' => $this->row_background_color_even,
            'row_height' => $this->row_height,
            'font_family' => $this->font_family,
            'font_size' => $this->font_size,
            'font_bold' => $this->font_bold,
            'font_italic' => $this->font_italic,
            'font_underline' => $this->font_underline,
            'font_strikeout' => $this->font_strikeout,
            'options' => $resolvedOptions,
            // Count alongside the array, matching every other X/nmaxX pair
            // in this gtree (fields/nmaxfields, tables/nmaxtables, ...) - so
            // {:for nmaxoptions:} can walk radio_group/checkbox_group
            // options the same way {:for nmaxfields:} walks table fields.
            'nmaxoptions' => count($resolvedOptions),
            'is_required' => $this->is_required,
            'control_state' => $this->control_state,
            'data_binding' => $this->data_binding,
            'browsed_file' => $this->browsed_file,
            'table_columns' => $this->table_columns ?? [],
            // 'columns' is the same data under the name a Table control's
            // own sub-loop will use ({:for nmaxcolumns:}) - table_columns
            // stays too, for anything already reading it directly.
            'columns' => $this->table_columns ?? [],
            'nmaxcolumns' => count($this->table_columns ?? []),
            'default_value' => $this->default_value,
            'min_value' => $this->min_value,
            'max_value' => $this->max_value,
            'step_value' => $this->step_value,
            'field_name' => $this->schemaField?->field_name,
            'field_type' => $this->schemaField?->field_type,
            'icon_class' => $this->icon_class,
            'icon_data' => $this->icon_data,
            'icon_state_count' => $this->icon_state_count ?? 1,
            // Only meaningful for 'button' so far - takes priority over
            // control_background_color when set (see buildRudimentaryControl).
            'background_image' => $this->background_image,
            'background_image_states' => $this->background_image_states ?? 1,
            'container_id' => $this->container_element_id,
        ];
    }
}
