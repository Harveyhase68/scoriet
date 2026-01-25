<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KanbanCardActivity extends Model
{
    protected $fillable = [
        'card_id',
        'user_id',
        'action',
        'old_value',
        'new_value',
    ];

    protected $casts = [
        'old_value' => 'array',
        'new_value' => 'array',
    ];

    public const ACTIONS = [
        'created' => 'Created',
        'moved' => 'Moved',
        'updated' => 'Updated',
        'assigned' => 'Assigned',
        'unassigned' => 'Unassigned',
        'completed' => 'Completed',
        'reopened' => 'Reopened',
        'commented' => 'Commented',
        'label_added' => 'Label Added',
        'label_removed' => 'Label Removed',
    ];

    public function card(): BelongsTo
    {
        return $this->belongsTo(KanbanCard::class, 'card_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get human-readable action description
     */
    public function getDescriptionAttribute(): string
    {
        return self::ACTIONS[$this->action] ?? $this->action;
    }
}
