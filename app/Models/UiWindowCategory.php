<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A tree node used to organize Windows (see UiWindow) inside a project.
 * Deleting a category never cascades to its children or windows - both
 * relationships use `set null` at the DB level, so content is only
 * "uncategorized" / promoted to root, never destroyed.
 */
class UiWindowCategory extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'parent_id',
        'name',
        'sort_order',
    ];

    protected $casts = [
        'project_id' => 'integer',
        'parent_id' => 'integer',
        'sort_order' => 'integer',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('sort_order');
    }

    public function windows(): HasMany
    {
        return $this->hasMany(UiWindow::class, 'category_id')->orderBy('sort_order');
    }
}
