<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KanbanColumn extends Model
{
    protected $fillable = [
        'board_id',
        'name',
        'color',
        'position',
        'wip_limit',
        'is_done_column',
    ];

    protected $casts = [
        // See note on Project::$casts re: BIGINT-as-string from MariaDB/PDO.
        'board_id' => 'integer',
        'position' => 'integer',
        'wip_limit' => 'integer',
        'is_done_column' => 'boolean',
    ];

    public function board(): BelongsTo
    {
        return $this->belongsTo(KanbanBoard::class, 'board_id');
    }

    public function cards(): HasMany
    {
        return $this->hasMany(KanbanCard::class, 'column_id')->orderBy('position');
    }

    /**
     * Check if WIP limit is reached
     */
    public function isWipLimitReached(): bool
    {
        if ($this->wip_limit === null) {
            return false;
        }

        return $this->cards()->count() >= $this->wip_limit;
    }

    /**
     * Get cards count
     */
    public function getCardsCountAttribute(): int
    {
        return $this->cards()->count();
    }
}
