<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * SML ("Scoriet Meta Language") code-behind attached to a window, a
 * UiWindowElement (container/tab_container/looper/...), a UiWindowControl
 * (button, edit, ...) or a UiWindowMenu (menu bar item), one row per event
 * handler.
 *
 * `control_id`/`element_id`/`menu_id` are mutually exclusive; all three
 * null means the event belongs to the window itself (e.g. `declarations`,
 * `init`). `window_id` is always set, even for control/element/menu
 * events, so every row has a direct relation to its window per the
 * feature spec.
 */
class UiWindowEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'window_id',
        'control_id',
        'element_id',
        'menu_id',
        'event_name',
        'code',
    ];

    protected $casts = [
        'window_id' => 'integer',
        'control_id' => 'integer',
        'element_id' => 'integer',
        'menu_id' => 'integer',
    ];

    public function window(): BelongsTo
    {
        return $this->belongsTo(UiWindow::class, 'window_id');
    }

    public function control(): BelongsTo
    {
        return $this->belongsTo(UiWindowControl::class, 'control_id');
    }

    public function element(): BelongsTo
    {
        return $this->belongsTo(UiWindowElement::class, 'element_id');
    }

    public function menu(): BelongsTo
    {
        return $this->belongsTo(UiWindowMenu::class, 'menu_id');
    }

    public function scopeForWindowTarget($query, int $windowId)
    {
        return $query->where('window_id', $windowId)->whereNull('control_id')->whereNull('element_id')->whereNull('menu_id');
    }

    public function scopeForControl($query, int $controlId)
    {
        return $query->where('control_id', $controlId);
    }

    public function scopeForElement($query, int $elementId)
    {
        return $query->where('element_id', $elementId);
    }

    public function scopeForMenu($query, int $menuId)
    {
        return $query->where('menu_id', $menuId);
    }
}
