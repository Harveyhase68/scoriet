<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Builder;

class MessageThread extends Model
{
    protected $fillable = [
        'subject',
        'is_broadcast',
    ];

    protected $casts = [
        'is_broadcast' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // ========================================
    // Relationships
    // ========================================

    /**
     * Get all messages in this thread
     */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class, 'thread_id')->orderBy('created_at', 'asc');
    }

    /**
     * Get all participants in this thread
     */
    public function participants(): HasMany
    {
        return $this->hasMany(MessageThreadParticipant::class, 'thread_id');
    }

    /**
     * Get the latest message in this thread
     */
    public function latestMessage(): HasOne
    {
        return $this->hasOne(Message::class, 'thread_id')->latestOfMany('created_at');
    }

    // ========================================
    // Scopes
    // ========================================

    /**
     * Scope to get threads for a specific user (active participants only)
     */
    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->whereHas('participants', function ($q) use ($userId) {
            $q->where('user_id', $userId)->whereNull('deleted_at');
        });
    }

    /**
     * Scope to get only broadcast threads
     */
    public function scopeBroadcasts(Builder $query): Builder
    {
        return $query->where('is_broadcast', true);
    }

    /**
     * Scope to get threads with unread messages for a user
     */
    public function scopeWithUnread(Builder $query, int $userId): Builder
    {
        return $query->whereHas('participants', function ($q) use ($userId) {
            $q->where('user_id', $userId)
              ->whereNull('deleted_at')
              ->where(function ($sub) {
                  $sub->whereNull('last_read_at')
                      ->orWhereHas('thread.messages', function ($msg) {
                          $msg->whereColumn('messages.created_at', '>', 'message_thread_participants.last_read_at');
                      });
              });
        });
    }

    // ========================================
    // Methods
    // ========================================

    /**
     * Add a participant to the thread
     */
    public function addParticipant(int $userId): MessageThreadParticipant
    {
        return $this->participants()->updateOrCreate(
            ['user_id' => $userId],
            ['deleted_at' => null]
        );
    }

    /**
     * Remove a participant from the thread (soft delete)
     */
    public function removeParticipant(int $userId): bool
    {
        return $this->participants()
            ->where('user_id', $userId)
            ->update(['deleted_at' => now()]) > 0;
    }

    /**
     * Check if thread has unread messages for a user
     */
    public function hasUnreadFor(int $userId): bool
    {
        $participant = $this->participants()->where('user_id', $userId)->first();

        if (!$participant) {
            return false;
        }

        // If never read, check if there are any messages
        if (!$participant->last_read_at) {
            return $this->messages()->exists();
        }

        // Check if any messages are newer than last read
        return $this->messages()
            ->where('created_at', '>', $participant->last_read_at)
            ->exists();
    }

    /**
     * Get the count of unread messages for a user
     */
    public function getUnreadCountFor(int $userId): int
    {
        $participant = $this->participants()->where('user_id', $userId)->first();

        if (!$participant) {
            return 0;
        }

        if (!$participant->last_read_at) {
            return $this->messages()->count();
        }

        return $this->messages()
            ->where('created_at', '>', $participant->last_read_at)
            ->count();
    }

    /**
     * Check if user is a participant
     */
    public function hasParticipant(int $userId): bool
    {
        return $this->participants()
            ->where('user_id', $userId)
            ->whereNull('deleted_at')
            ->exists();
    }

    /**
     * Get other participants (excluding a specific user)
     */
    public function getOtherParticipants(int $excludeUserId)
    {
        return $this->participants()
            ->where('user_id', '!=', $excludeUserId)
            ->whereNull('deleted_at')
            ->with('user:id,name,username')
            ->get();
    }

    /**
     * Create a new thread with participants and initial message
     */
    public static function createWithMessage(
        string $subject,
        int $senderId,
        array $recipientIds,
        string $body,
        bool $isBroadcast = false
    ): self {
        // Create thread
        $thread = static::create([
            'subject' => $subject,
            'is_broadcast' => $isBroadcast,
        ]);

        // Add sender as participant
        $thread->addParticipant($senderId);

        // Add recipients as participants
        foreach ($recipientIds as $recipientId) {
            $thread->addParticipant($recipientId);
        }

        // Create initial message
        $thread->messages()->create([
            'sender_id' => $senderId,
            'body' => $body,
        ]);

        // Mark as read for sender
        $thread->participants()
            ->where('user_id', $senderId)
            ->update(['last_read_at' => now()]);

        return $thread;
    }
}
