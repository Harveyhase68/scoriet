<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ReportPatternForm extends Model
{
    use HasFactory;

    protected $fillable = [
        'report_pattern_id',
        'form_type',
        'paper_size',
        'paper_orientation',
        'paper_unit',
        'paper_width',
        'paper_height',
        'margin_top',
        'margin_right',
        'margin_bottom',
        'margin_left',
        'row_height',
        'max_columns',
        'header_height',
        'footer_height',
        'list_style_config',
        'sort_order',
    ];

    protected $casts = [
        'paper_width' => 'decimal:2',
        'paper_height' => 'decimal:2',
        'margin_top' => 'decimal:2',
        'margin_right' => 'decimal:2',
        'margin_bottom' => 'decimal:2',
        'margin_left' => 'decimal:2',
        'row_height' => 'decimal:2',
        'max_columns' => 'integer',
        'header_height' => 'decimal:2',
        'footer_height' => 'decimal:2',
        'list_style_config' => 'array',
        'sort_order' => 'integer',
    ];

    /**
     * Standard-Papierformate in mm
     */
    public const PAPER_SIZES = [
        'A4' => ['width' => 210.00, 'height' => 297.00],
        'A3' => ['width' => 297.00, 'height' => 420.00],
        'A5' => ['width' => 148.00, 'height' => 210.00],
        'Letter' => ['width' => 215.90, 'height' => 279.40],
        'Legal' => ['width' => 215.90, 'height' => 355.60],
    ];

    // ========== RELATIONSHIPS ==========

    public function pattern(): BelongsTo
    {
        return $this->belongsTo(ReportPattern::class, 'report_pattern_id');
    }

    public function elements(): HasMany
    {
        return $this->hasMany(ReportPatternElement::class)->orderBy('sort_order');
    }

    public function layoutElements(): HasMany
    {
        return $this->hasMany(ReportLayoutElement::class)->orderBy('sort_order');
    }

    // ========== ACCESSORS ==========

    /**
     * Effektive Papierbreite in mm (beruecksichtigt Orientation)
     */
    public function getEffectivePaperWidthAttribute(): float
    {
        if ($this->paper_size === 'Custom') {
            $w = (float) ($this->paper_width ?? 210.00);
            $h = (float) ($this->paper_height ?? 297.00);
        } else {
            $size = self::PAPER_SIZES[$this->paper_size] ?? self::PAPER_SIZES['A4'];
            $w = $size['width'];
            $h = $size['height'];
        }

        // Bei inch-Einheit sind die gespeicherten Werte in inch -> in mm konvertieren
        if ($this->paper_unit === 'inch' && $this->paper_size === 'Custom') {
            $w = $w * 25.4;
            $h = $h * 25.4;
        }

        return $this->paper_orientation === 'landscape' ? $h : $w;
    }

    /**
     * Effektive Papierhoehe in mm (beruecksichtigt Orientation)
     */
    public function getEffectivePaperHeightAttribute(): float
    {
        if ($this->paper_size === 'Custom') {
            $w = (float) ($this->paper_width ?? 210.00);
            $h = (float) ($this->paper_height ?? 297.00);
        } else {
            $size = self::PAPER_SIZES[$this->paper_size] ?? self::PAPER_SIZES['A4'];
            $w = $size['width'];
            $h = $size['height'];
        }

        if ($this->paper_unit === 'inch' && $this->paper_size === 'Custom') {
            $w = $w * 25.4;
            $h = $h * 25.4;
        }

        return $this->paper_orientation === 'landscape' ? $w : $h;
    }

    /**
     * Druckbarer Bereich Breite in paper_unit
     */
    public function getPrintableWidthAttribute(): float
    {
        if ($this->paper_size === 'Custom') {
            $w = (float) ($this->paper_width ?? 210.00);
        } else {
            $size = self::PAPER_SIZES[$this->paper_size] ?? self::PAPER_SIZES['A4'];
            $w = $this->paper_orientation === 'landscape' ? $size['height'] : $size['width'];
            // Standard-Groessen sind in mm, bei inch konvertieren
            if ($this->paper_unit === 'inch') {
                $w = $w / 25.4;
            }
        }

        return $w - (float) $this->margin_left - (float) $this->margin_right;
    }

    /**
     * Druckbarer Bereich Hoehe in paper_unit
     */
    public function getPrintableHeightAttribute(): float
    {
        if ($this->paper_size === 'Custom') {
            $h = (float) ($this->paper_height ?? 297.00);
        } else {
            $size = self::PAPER_SIZES[$this->paper_size] ?? self::PAPER_SIZES['A4'];
            $h = $this->paper_orientation === 'landscape' ? $size['width'] : $size['height'];
            if ($this->paper_unit === 'inch') {
                $h = $h / 25.4;
            }
        }

        return $h - (float) $this->margin_top - (float) $this->margin_bottom;
    }

    // ========== METHODS ==========

    public function toGTreeArray(): array
    {
        $ls = is_array($this->list_style_config) ? $this->list_style_config : [];

        // Outer + column separators are form-level globals — they don't belong
        // to any specific element. Resolve them with cascade outer → defaults.
        $outerColor = $ls['outer_border_color'] ?? '#000000';
        $outerWidth = isset($ls['outer_border_width']) ? (float) $ls['outer_border_width'] : 0.0;
        $outerStyle = $ls['outer_border_style'] ?? 'solid';

        // Build the per-type overlays. Each side cascades:
        //   list_style_config[side]  →  outer_border_*  →  STYLE_DEFAULT
        $headerOverlay = self::buildHeaderOverlay($ls, $outerColor, $outerWidth, $outerStyle);
        $detailOverlay = self::buildDetailOverlay($ls, $outerColor, $outerWidth, $outerStyle);

        // Map elements and merge the right overlay onto each by type. Both
        // `header_section` and `table_header` are considered "header"; only
        // `detail_section` gets the detail overlay.
        $elements = $this->elements->map(function ($el) use ($headerOverlay, $detailOverlay) {
            $arr = $el->toGTreeArray();
            $type = $arr['type'] ?? '';
            if ($type === 'table_header' || $type === 'header_section') {
                $arr = array_merge($arr, $headerOverlay);
            } elseif ($type === 'detail_section') {
                $arr = array_merge($arr, $detailOverlay);
            }
            return $arr;
        })->toArray();

        return [
            'id' => $this->id,
            'type' => $this->form_type,
            'paper_size' => $this->paper_size,
            'paper_orientation' => $this->paper_orientation,
            'paper_unit' => $this->paper_unit,
            'paper_width' => $this->effective_paper_width,
            'paper_height' => $this->effective_paper_height,
            'margin_top' => (float) $this->margin_top,
            'margin_right' => (float) $this->margin_right,
            'margin_bottom' => (float) $this->margin_bottom,
            'margin_left' => (float) $this->margin_left,
            'printable_width' => $this->printable_width,
            'printable_height' => $this->printable_height,
            'row_height' => $this->row_height ? (float) $this->row_height : null,
            'max_columns' => $this->max_columns,
            'header_height' => $this->header_height ? (float) $this->header_height : null,
            'footer_height' => $this->footer_height ? (float) $this->footer_height : null,
            'elements' => $elements,
            'nmaxelements' => count($elements),

            // Form-level globals (apply to the whole table view)
            'outer_border_color'     => $outerColor,
            'outer_border_width'     => $outerWidth,
            'outer_border_style'     => $outerStyle,
            'column_separator_color' => $ls['column_separator_color'] ?? '#cccccc',
            'column_separator_width' => isset($ls['column_separator_width']) ? (float) $ls['column_separator_width'] : 0.0,
            'column_separator_style' => $ls['column_separator_style'] ?? 'solid',

            // Raw list_style_config still exposed for {:code:} blocks that
            // want to read the original JSON. Per-element overlays above are
            // the recommended access path.
            'list_style' => $ls,
        ];
    }

    /**
     * Build the header overlay from list_style_config. Each border side
     * cascades through: side-specific value → outer_border_* → hard default.
     * The result is merged onto the table_header / header_section element.
     */
    private static function buildHeaderOverlay(array $ls, string $outerColor, float $outerWidth, string $outerStyle): array
    {
        return [
            'header_bg_color'   => $ls['header_bg_color']   ?? '#ffffff',
            'header_text_color' => $ls['header_text_color'] ?? '#000000',
            // top
            'header_border_top_color' => $ls['header_border_top_color'] ?? $outerColor,
            'header_border_top_width' => isset($ls['header_border_top_width']) ? (float) $ls['header_border_top_width'] : $outerWidth,
            'header_border_top_style' => $ls['header_border_top_style'] ?? $outerStyle,
            // left
            'header_border_left_color' => $ls['header_border_left_color'] ?? $outerColor,
            'header_border_left_width' => isset($ls['header_border_left_width']) ? (float) $ls['header_border_left_width'] : $outerWidth,
            'header_border_left_style' => $ls['header_border_left_style'] ?? $outerStyle,
            // right
            'header_border_right_color' => $ls['header_border_right_color'] ?? $outerColor,
            'header_border_right_width' => isset($ls['header_border_right_width']) ? (float) $ls['header_border_right_width'] : $outerWidth,
            'header_border_right_style' => $ls['header_border_right_style'] ?? $outerStyle,
            // bottom
            'header_border_bottom_color' => $ls['header_border_bottom_color'] ?? $outerColor,
            'header_border_bottom_width' => isset($ls['header_border_bottom_width']) ? (float) $ls['header_border_bottom_width'] : $outerWidth,
            'header_border_bottom_style' => $ls['header_border_bottom_style'] ?? $outerStyle,
        ];
    }

    /**
     * Build the detail overlay from list_style_config. Same cascade rules as
     * the header overlay. Merged onto the detail_section element.
     */
    private static function buildDetailOverlay(array $ls, string $outerColor, float $outerWidth, string $outerStyle): array
    {
        return [
            // Row backgrounds (zebra striping)
            'row_odd_bg_color'  => $ls['row_odd_bg_color']  ?? '#ffffff',
            'row_even_bg_color' => $ls['row_even_bg_color'] ?? '#ffffff',
            // Row separator (between data rows)
            'row_border_bottom_color' => $ls['row_border_bottom_color'] ?? $outerColor,
            'row_border_bottom_width' => isset($ls['row_border_bottom_width']) ? (float) $ls['row_border_bottom_width'] : $outerWidth,
            'row_border_bottom_style' => $ls['row_border_bottom_style'] ?? $outerStyle,
            // Detail-section borders (around the whole detail block)
            'detail_border_left_color' => $ls['detail_border_left_color'] ?? $outerColor,
            'detail_border_left_width' => isset($ls['detail_border_left_width']) ? (float) $ls['detail_border_left_width'] : $outerWidth,
            'detail_border_left_style' => $ls['detail_border_left_style'] ?? $outerStyle,
            'detail_border_right_color' => $ls['detail_border_right_color'] ?? $outerColor,
            'detail_border_right_width' => isset($ls['detail_border_right_width']) ? (float) $ls['detail_border_right_width'] : $outerWidth,
            'detail_border_right_style' => $ls['detail_border_right_style'] ?? $outerStyle,
            'detail_border_bottom_color' => $ls['detail_border_bottom_color'] ?? $outerColor,
            'detail_border_bottom_width' => isset($ls['detail_border_bottom_width']) ? (float) $ls['detail_border_bottom_width'] : $outerWidth,
            'detail_border_bottom_style' => $ls['detail_border_bottom_style'] ?? $outerStyle,
        ];
    }
}
