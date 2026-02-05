<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class RegistrationInvite extends Model
{
    protected $fillable = [
        'email',
        'token',
        'name',
        'note',
        'invited_by',
        'sent_at',
        'used_at',
        'used_by_user_id',
        'expires_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'used_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    /**
     * Generate a unique invite token
     */
    public static function generateToken(): string
    {
        do {
            $token = Str::random(64);
        } while (self::where('token', $token)->exists());

        return $token;
    }

    /**
     * Check if the invite is valid (not used and not expired)
     */
    public function isValid(): bool
    {
        return is_null($this->used_at) && $this->expires_at->isFuture();
    }

    /**
     * Check if the invite has been used
     */
    public function isUsed(): bool
    {
        return !is_null($this->used_at);
    }

    /**
     * Check if the invite has expired
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Mark the invite as used
     */
    public function markAsUsed(int $userId): void
    {
        $this->update([
            'used_at' => now(),
            'used_by_user_id' => $userId,
        ]);
    }

    /**
     * Mark the invite as sent
     */
    public function markAsSent(): void
    {
        $this->update(['sent_at' => now()]);
    }

    /**
     * Get the user who created this invite
     */
    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    /**
     * Get the user who used this invite (if any)
     */
    public function usedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'used_by_user_id');
    }

    /**
     * Scope: Only valid invites
     */
    public function scopeValid($query)
    {
        return $query->whereNull('used_at')
                     ->where('expires_at', '>', now());
    }

    /**
     * Scope: Only expired invites
     */
    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<=', now());
    }

    /**
     * Scope: Only used invites
     */
    public function scopeUsed($query)
    {
        return $query->whereNotNull('used_at');
    }

    /**
     * Scope: Only pending (sent but not used) invites
     */
    public function scopePending($query)
    {
        return $query->whereNotNull('sent_at')
                     ->whereNull('used_at')
                     ->where('expires_at', '>', now());
    }

    /**
     * Get status label
     */
    public function getStatusAttribute(): string
    {
        if ($this->isUsed()) {
            return 'used';
        }
        if ($this->isExpired()) {
            return 'expired';
        }
        return 'pending';
    }

    /**
     * Get the registration URL with token
     */
    public function getRegistrationUrlAttribute(): string
    {
        return url('/register?invite=' . $this->token);
    }
}
