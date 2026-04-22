<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Message extends Model
{
    protected $fillable = [
        'thread_id',
        'sender_id',
        'body',
    ];

    protected $casts = [
        // See note on Project::$casts re: BIGINT-as-string from MariaDB/PDO.
        'thread_id' => 'integer',
        'sender_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // ========================================
    // Relationships
    // ========================================

    /**
     * Get the thread this message belongs to
     */
    public function thread(): BelongsTo
    {
        return $this->belongsTo(MessageThread::class, 'thread_id');
    }

    /**
     * Get the sender of this message
     */
    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /**
     * Get all attachments for this message
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(MessageAttachment::class);
    }

    // ========================================
    // Methods
    // ========================================

    /**
     * Check if message has attachments
     */
    public function hasAttachments(): bool
    {
        return $this->attachments()->exists();
    }

    /**
     * Get attachment count
     */
    public function getAttachmentCount(): int
    {
        return $this->attachments()->count();
    }

    /**
     * Check if this message is from a specific user
     */
    public function isFrom(int $userId): bool
    {
        return $this->sender_id === $userId;
    }

    /**
     * Get a preview of the message body
     */
    public function getPreview(int $length = 100): string
    {
        if (strlen($this->body) <= $length) {
            return $this->body;
        }

        return substr($this->body, 0, $length) . '...';
    }
}
