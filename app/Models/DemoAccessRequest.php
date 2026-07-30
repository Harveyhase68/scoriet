<?php

namespace App\Models;

use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * An email-gated demo-access request / lead. Stored in the MAIN database
 * (persistent). The token travels in the emailed link; redeeming it on the
 * demo deployment grants a time-boxed demo session.
 *
 * Lifecycle: created (request) -> sent (email dispatched) -> redeemed (first
 * click). The token stays re-redeemable until `expires_at` so a same-day page
 * refresh before the demo cookie is set does not break; `redeemed_at` is a
 * "first click" analytics marker, not a hard single-use lock.
 */
class DemoAccessRequest extends Model
{
    protected $fillable = [
        'email',
        'token',
        'expires_at',
        'sent_at',
        'redeemed_at',
        'redeemed_ip',
        'request_ip',
        'consent',
        'consent_text_version',
        'user_agent',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'sent_at' => 'datetime',
        'redeemed_at' => 'datetime',
        'consent' => 'boolean',
    ];

    /**
     * UTC hour at which the demo database is reset daily (see DemoReset /
     * routes/console.php). Access windows are aligned to this so data and
     * access expire together.
     */
    public const RESET_HOUR_UTC = 5;

    /**
     * Minimum minutes of access we are willing to hand out. If less than this
     * remains before the next reset, the window is pushed to the FOLLOWING
     * reset so a late lead does not receive a near-dead link.
     */
    public const MIN_WINDOW_MINUTES = 30;

    /**
     * Compute the access-window expiry: the next 05:00 UTC reset, or the one
     * after if fewer than MIN_WINDOW_MINUTES remain.
     */
    public static function nextExpiry(): CarbonImmutable
    {
        $now = CarbonImmutable::now('UTC');
        $reset = $now->setTime(self::RESET_HOUR_UTC, 0, 0);

        if ($reset->lessThanOrEqualTo($now)) {
            $reset = $reset->addDay();
        }

        if ($now->diffInMinutes($reset) < self::MIN_WINDOW_MINUTES) {
            $reset = $reset->addDay();
        }

        return $reset;
    }

    /**
     * Generate a unique 64-char token (mirrors RegistrationInvite).
     */
    public static function generateToken(): string
    {
        do {
            $token = Str::random(64);
        } while (self::where('token', $token)->exists());

        return $token;
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isValid(): bool
    {
        return $this->expires_at->isFuture();
    }

    public function markSent(): void
    {
        $this->update(['sent_at' => now()]);
    }

    /**
     * Record the first redemption (analytics only — re-redeeming an unexpired
     * token is allowed and does not overwrite the first-click timestamp).
     */
    public function markRedeemed(?string $ip): void
    {
        if (is_null($this->redeemed_at)) {
            $this->update([
                'redeemed_at' => now(),
                'redeemed_ip' => $ip,
            ]);
        }
    }

    /**
     * Scope: a still-usable token for a given email (used to dedupe/resend
     * instead of minting a second row).
     */
    public function scopeActiveForEmail($query, string $email)
    {
        return $query->where('email', $email)
            ->where('expires_at', '>', now());
    }
}
