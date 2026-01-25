<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class KanbanLabel extends Model
{
    protected $fillable = [
        'board_id',
        'name',
        'color',
    ];

    public function board(): BelongsTo
    {
        return $this->belongsTo(KanbanBoard::class, 'board_id');
    }

    public function cards(): BelongsToMany
    {
        return $this->belongsToMany(KanbanCard::class, 'kanban_card_label', 'label_id', 'card_id');
    }
}
