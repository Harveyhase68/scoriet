<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MessageThreadParticipant extends Model
{
    protected $fillable = [
        'thread_id',
        'user_id',
        'last_read_at',
        'deleted_at',
    ];

    protected $casts = [
        'last_read_at' => 'datetime',
        'deleted_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // ========================================
    // Relationships
    // ========================================

    /**
     * Get the thread this participant belongs to
     */
    public function thread(): BelongsTo
    {
        return $this->belongsTo(MessageThread::class, 'thread_id');
    }

    /**
     * Get the user for this participant
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ========================================
    // Methods
    // ========================================

    /**
     * Mark thread as read for this participant
     */
    public function markAsRead(): void
    {
        $this->update(['last_read_at' => now()]);
    }

    /**
     * Check if participant has deleted this thread
     */
    public function isDeleted(): bool
    {
        return $this->deleted_at !== null;
    }

    /**
     * Soft delete (hide) the thread for this participant
     */
    public function softDelete(): void
    {
        $this->update(['deleted_at' => now()]);
    }

    /**
     * Restore a soft-deleted thread for this participant
     */
    public function restore(): void
    {
        $this->update(['deleted_at' => null]);
    }

    /**
     * Get unread message count for this participant
     */
    public function getUnreadCount(): int
    {
        if (!$this->last_read_at) {
            return $this->thread->messages()->count();
        }

        return $this->thread->messages()
            ->where('created_at', '>', $this->last_read_at)
            ->count();
    }

    /**
     * Check if there are unread messages
     */
    public function hasUnread(): bool
    {
        return $this->getUnreadCount() > 0;
    }
}
