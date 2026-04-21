<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CliDevice extends Model
{
    protected $fillable = [
        'user_id',
        'device_id',
        'device_name',
        'platform',
        'hostname',
        'last_seen_at',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_seen_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if the device was seen recently (within 30 seconds = ~6 poll cycles)
     */
    public function isOnline(): bool
    {
        return $this->is_active && $this->last_seen_at && $this->last_seen_at->diffInSeconds(now()) < 30;
    }

    /**
     * Update the last_seen_at timestamp (called on every queue poll)
     */
    public function heartbeat(): void
    {
        $this->last_seen_at = now();
        $this->save();
    }
}
