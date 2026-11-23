<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A freely designed, project-scoped screen - independent of FormSets/table
 * generation. Unlike FormWindow (fixed 3-type-per-FormSet), any number of
 * Windows can exist per project, organized via UiWindowCategory.
 *
 * `schema_table_id` is an optional generator property (see project roadmap
 * Step 2) - it is not yet consumed by the code generator.
 */
class UiWindow extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'category_id',
        'name',
        'source_name',
        'display_name',
        'display_name_labels',
        'description',
        'schema_table_id',
        'canvas_width',
        'canvas_height',
        'background_color',
        'window_color',
        'text_color',
        'background_image',
        'has_status_bar',
        'is_first_window',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'project_id' => 'integer',
        'category_id' => 'integer',
        'schema_table_id' => 'integer',
        'canvas_width' => 'integer',
        'canvas_height' => 'integer',
        'display_name_labels' => 'array',
        'has_status_bar' => 'boolean',
        'is_first_window' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(UiWindowCategory::class, 'category_id');
    }

    public function schemaTable(): BelongsTo
    {
        return $this->belongsTo(SchemaTable::class);
    }

    public function elements(): HasMany
    {
        return $this->hasMany(UiWindowElement::class, 'window_id')->orderBy('sort_order');
    }

    public function controls(): HasMany
    {
        return $this->hasMany(UiWindowControl::class, 'window_id')->orderBy('sort_order');
    }

    public function menus(): HasMany
    {
        return $this->hasMany(UiWindowMenu::class, 'window_id')->orderBy('sort_order');
    }

    /**
     * Base GTree representation for the template engine (Step 3 roadmap).
     * Only project-scoped scalar fields for now - controls/elements are
     * attached separately once generator integration lands.
     */
    public function toGTreeArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            // The original WinDev unit name (e.g. "WIN_IP"), if this window
            // was imported - SML code-behind (win.open/win.close/...) always
            // names windows this way, never by Scoriet's own sanitized
            // machine name, so the generated app needs both to resolve one
            // from the other (see window_modules.dart's source-name lookup).
            'source_name' => $this->source_name,
            'display_name' => $this->display_name ?? $this->name,
            'description' => $this->description,
            'schema_table' => $this->schemaTable?->table_name,
            'canvas_width' => $this->canvas_width,
            'canvas_height' => $this->canvas_height,
            'background_color' => $this->background_color,
            'window_color' => $this->window_color,
            'text_color' => $this->text_color,
            'background_image' => $this->background_image,
            // WLanguage's `Message()` writes into this bar (see
            // sml_to_dart.js's own bare-call handling) - never a dialog.
            'has_status_bar' => (bool) $this->has_status_bar,
            // Which ONE window per project a generated app launches directly
            // into instead of a menu/demo screen - see window_modules.dart's
            // startupWindowId (built from a separate, project-wide lookup in
            // UltimateTemplateController, not from this per-window value -
            // included here too for any template that wants a single
            // window's own flag directly).
            'is_first_window' => (bool) $this->is_first_window,
        ];
    }
}
