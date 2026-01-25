<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KanbanCardComment extends Model
{
    protected $fillable = [
        'card_id',
        'user_id',
        'content',
    ];

    public function card(): BelongsTo
    {
        return $this->belongsTo(KanbanCard::class, 'card_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
