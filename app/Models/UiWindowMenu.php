<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * One item in a window's own menu bar (File, File > Exit, ...), imported
 * from WinDev's recursive `menus` export or hand-built in the Menu Bar
 * Designer. `parent_menu_id` is a self-referencing adjacency list, same
 * convention as UiWindowElement::parent_element_id - see that model's own
 * doc comment for why this codebase never uses a JSON tree column instead.
 */
class UiWindowMenu extends Model
{
    use HasFactory;

    protected $fillable = [
        'window_id',
        'parent_menu_id',
        'source_name',
        'caption',
        'caption_labels',
        'sort_order',
    ];

    protected $casts = [
        'window_id' => 'integer',
        'parent_menu_id' => 'integer',
        'caption_labels' => 'array',
        'sort_order' => 'integer',
    ];

    public function window(): BelongsTo
    {
        return $this->belongsTo(UiWindow::class, 'window_id');
    }

    public function parentMenu(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_menu_id');
    }

    public function childMenus(): HasMany
    {
        return $this->hasMany(self::class, 'parent_menu_id')->orderBy('sort_order');
    }

    /**
     * Base GTree representation - `menu_items`/`nmaxmenu_items` (nested
     * children) and `events`/`nmaxevents` (SML code-behind) are attached on
     * top by the caller (UltimateTemplateController::buildWindowMenuNode()),
     * same split of responsibility as UiWindowElement::toGTreeArray().
     */
    public function toGTreeArray(?string $language = null): array
    {
        $caption = $this->caption ?? '';
        if ($language && ! empty($this->caption_labels[$language])) {
            $caption = $this->caption_labels[$language];
        }

        return [
            'id' => $this->id,
            'source_name' => $this->source_name,
            'caption' => $caption,
            'sort_order' => $this->sort_order,
        ];
    }
}
