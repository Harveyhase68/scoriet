<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PushSubscription extends Model
{
    protected $fillable = [
        'user_id',
        'endpoint',
        'endpoint_hash',
        'p256dh_key',
        'auth_token',
        'user_agent',
    ];

    /**
     * Boot method to automatically compute endpoint_hash
     */
    protected static function boot(): void
    {
        parent::boot();

        static::saving(function (PushSubscription $subscription) {
            $subscription->endpoint_hash = hash('sha256', $subscription->endpoint);
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
