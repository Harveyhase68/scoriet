<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class KanbanCard extends Model
{
    protected $fillable = [
        'column_id',
        'created_by',
        'assigned_to',
        'title',
        'description',
        'color',
        'position',
        'priority',
        'due_date',
        'estimated_hours',
        'actual_hours',
        'completed_at',
    ];

    protected $casts = [
        'position' => 'integer',
        'estimated_hours' => 'integer',
        'actual_hours' => 'integer',
        'due_date' => 'date',
        'completed_at' => 'datetime',
    ];

    public const PRIORITIES = [
        'low' => 'Low',
        'medium' => 'Medium',
        'high' => 'High',
        'urgent' => 'Urgent',
    ];

    public const PRIORITY_COLORS = [
        'low' => '#6b7280',
        'medium' => '#3b82f6',
        'high' => '#f59e0b',
        'urgent' => '#ef4444',
    ];

    public function column(): BelongsTo
    {
        return $this->belongsTo(KanbanColumn::class, 'column_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function labels(): BelongsToMany
    {
        return $this->belongsToMany(KanbanLabel::class, 'kanban_card_label', 'card_id', 'label_id');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(KanbanCardComment::class, 'card_id')->orderBy('created_at', 'desc');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(KanbanCardActivity::class, 'card_id')->orderBy('created_at', 'desc');
    }

    /**
     * Get all assignees for this card (many-to-many)
     */
    public function assignees(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'kanban_card_assignees', 'card_id', 'user_id')
            ->withPivot(['assigned_by', 'assigned_at'])
            ->withTimestamps();
    }

    /**
     * Assign a user to this card
     */
    public function assignUser(int $userId, int $assignedBy): void
    {
        // Check if already assigned
        if ($this->assignees()->where('user_id', $userId)->exists()) {
            return;
        }

        $this->assignees()->attach($userId, [
            'assigned_by' => $assignedBy,
            'assigned_at' => now(),
        ]);

        // Log activity
        $user = User::find($userId);
        $this->logActivity($assignedBy, 'assigned', null, ['user_id' => $userId, 'username' => $user?->username]);
    }

    /**
     * Remove a user from this card
     */
    public function unassignUser(int $userId, int $unassignedBy): void
    {
        $user = User::find($userId);

        $this->assignees()->detach($userId);

        // Log activity
        $this->logActivity($unassignedBy, 'unassigned', ['user_id' => $userId, 'username' => $user?->username], null);
    }

    /**
     * Check if a specific user is assigned to this card
     */
    public function isAssignedTo(int $userId): bool
    {
        return $this->assignees()->where('user_id', $userId)->exists();
    }

    /**
     * Check if card is overdue
     */
    public function getIsOverdueAttribute(): bool
    {
        if (!$this->due_date || $this->completed_at) {
            return false;
        }

        return $this->due_date->isPast();
    }

    /**
     * Check if card is due soon (within 2 days)
     */
    public function getIsDueSoonAttribute(): bool
    {
        if (!$this->due_date || $this->completed_at || $this->is_overdue) {
            return false;
        }

        return $this->due_date->diffInDays(now()) <= 2;
    }

    /**
     * Move card to another column
     */
    public function moveToColumn(int $columnId, int $position, int $userId): void
    {
        $oldColumnId = $this->column_id;
        $oldPosition = $this->position;

        $this->update([
            'column_id' => $columnId,
            'position' => $position,
        ]);

        // Check if moved to done column
        $newColumn = KanbanColumn::find($columnId);
        if ($newColumn && $newColumn->is_done_column && !$this->completed_at) {
            $this->update(['completed_at' => now()]);
        } elseif ($newColumn && !$newColumn->is_done_column && $this->completed_at) {
            $this->update(['completed_at' => null]);
        }

        // Log activity
        $this->activities()->create([
            'user_id' => $userId,
            'action' => 'moved',
            'old_value' => json_encode(['column_id' => $oldColumnId, 'position' => $oldPosition]),
            'new_value' => json_encode(['column_id' => $columnId, 'position' => $position]),
        ]);
    }

    /**
     * Log activity for this card
     */
    public function logActivity(int $userId, string $action, ?array $oldValue = null, ?array $newValue = null): void
    {
        $this->activities()->create([
            'user_id' => $userId,
            'action' => $action,
            'old_value' => $oldValue ? json_encode($oldValue) : null,
            'new_value' => $newValue ? json_encode($newValue) : null,
        ]);
    }
}
