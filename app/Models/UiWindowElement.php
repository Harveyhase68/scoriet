<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A layout container placed on a Window canvas (container / group_box /
 * tab_container / tab_panel / looper / looper_row). Purely structural -
 * actual widgets are UiWindowControl rows attached via
 * `container_element_id`. Unlike the legacy FormElement, buttons are not a
 * separate element type here; they are one control type among many in the
 * universal control palette.
 *
 * `looper` mirrors WinDev's "Looper" control - a single-column, vertically
 * scrolling repeater. It always owns exactly one `looper_row` child (the
 * one-and-only row template the user designs; real controls attach to
 * THAT, never to the looper directly - same relationship tab_container has
 * to tab_panel, just capped at one child instead of N). `looper_row_height`
 * lives on the looper itself, not the row - there is nothing else on a
 * looper_row worth configuring independently.
 */
class UiWindowElement extends Model
{
    use HasFactory;

    protected $fillable = [
        'window_id',
        'element_type',
        'source_name',
        'parent_element_id',
        'x_position',
        'y_position',
        'width',
        'height',
        'anchor_right',
        'anchor_bottom',
        'anchor_width',
        'anchor_height',
        'container_orientation',
        'container_columns',
        'container_gap',
        'tab_label',
        'tab_labels',
        'custom_style',
        'background_color',
        'tab_active_background_color',
        'tab_inactive_background_color',
        'tab_active_text_color',
        'tab_inactive_text_color',
        'tab_font_family',
        'tab_font_size',
        'tab_font_bold',
        'tab_font_italic',
        'tab_font_underline',
        'tab_font_strikeout',
        'looper_row_height',
        'tab_strip_height',
        'sort_order',
        'is_visible',
    ];

    protected $casts = [
        'window_id' => 'integer',
        'parent_element_id' => 'integer',
        'x_position' => 'integer',
        'y_position' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
        // Plain float, not decimal:2 - see UiWindowControl's identical
        // comment: decimal:2 serializes to a string, which silently breaks
        // any consumer treating it as a raw JS number (e.g. a CSS pixel
        // value).
        'anchor_right' => 'float',
        'anchor_bottom' => 'float',
        'anchor_width' => 'float',
        'anchor_height' => 'float',
        'container_columns' => 'integer',
        'container_gap' => 'integer',
        'tab_labels' => 'array',
        'custom_style' => 'array',
        'tab_font_size' => 'float',
        'tab_font_bold' => 'boolean',
        'tab_font_italic' => 'boolean',
        'tab_font_underline' => 'boolean',
        'tab_font_strikeout' => 'boolean',
        'looper_row_height' => 'integer',
        'tab_strip_height' => 'integer',
        'sort_order' => 'integer',
        'is_visible' => 'boolean',
    ];

    public function window(): BelongsTo
    {
        return $this->belongsTo(UiWindow::class, 'window_id');
    }

    public function parentElement(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_element_id');
    }

    public function childElements(): HasMany
    {
        return $this->hasMany(self::class, 'parent_element_id')->orderBy('sort_order');
    }

    public function controls(): HasMany
    {
        return $this->hasMany(UiWindowControl::class, 'container_element_id')->orderBy('sort_order');
    }

    public function scopeContainers($query)
    {
        return $query->whereIn('element_type', ['container', 'group_box', 'tab_container', 'looper']);
    }

    public function getTabLabelFor(?string $language): ?string
    {
        if ($language && !empty($this->tab_labels[$language])) {
            return $this->tab_labels[$language];
        }

        return $this->tab_label;
    }

    /**
     * Base GTree representation (roadmap Step 3) - basic scalar fields only.
     * `controls`/`nmaxcontrols`, `elements`/`nmaxelements` and, for
     * tab_container, `tabs`/`nmaxtabs` are attached on top by the caller
     * (UltimateTemplateController::buildUltimateWindowsData()), which is the
     * one that actually has the whole window's elements/controls loaded and
     * can walk the parent/child tree without N+1 queries per node.
     */
    public function toGTreeArray(?string $language = null): array
    {
        return [
            'id' => $this->id,
            // Same rationale as UiWindowControl::toGTreeArray()'s 'source_name' -
            // SML addresses tabs/containers by their own WinDev unit name, not
            // Scoriet's numeric id.
            'source_name' => $this->source_name,
            'element_type' => $this->element_type,
            'x' => $this->x_position,
            'y' => $this->y_position,
            'width' => $this->width,
            'height' => $this->height,
            'anchor_right' => $this->anchor_right,
            'anchor_bottom' => $this->anchor_bottom,
            'anchor_width' => $this->anchor_width,
            'anchor_height' => $this->anchor_height,
            'container_orientation' => $this->container_orientation,
            'container_columns' => $this->container_columns ?? 1,
            'container_gap' => $this->container_gap ?? 8,
            'caption' => $this->getTabLabelFor($language) ?? '',
            'visible' => $this->is_visible,
            'sort_order' => $this->sort_order,
            'background_color' => $this->background_color,
            'tab_active_background_color' => $this->tab_active_background_color,
            'tab_inactive_background_color' => $this->tab_inactive_background_color,
            'tab_active_text_color' => $this->tab_active_text_color,
            'tab_inactive_text_color' => $this->tab_inactive_text_color,
            'tab_font_family' => $this->tab_font_family,
            // 0 (not left null) - the template uses this bare, in a numeric
            // context ({:element.tab_font_size:} > 0 ? ...), not wrapped in
            // dartstring() - a null value there resolves to an empty
            // string, not the literal text "null", producing invalid Dart
            // ("fontSize:  > 0 ? .toDouble() : null"). 0 keeps the same
            // "not configured" meaning the > 0 check already treats it as.
            'tab_font_size' => $this->tab_font_size ?? 0,
            'tab_font_bold' => $this->tab_font_bold,
            'tab_font_italic' => $this->tab_font_italic,
            'tab_font_underline' => $this->tab_font_underline,
            'tab_font_strikeout' => $this->tab_font_strikeout,
            'looper_row_height' => $this->looper_row_height ?? 80,
            // 28 (not the widget's previous hardcoded 46) - WinDev's export
            // has no matching field for this, so every imported
            // tab_container starts here until set explicitly.
            'tab_strip_height' => $this->tab_strip_height ?? 28,
        ];
    }
}
