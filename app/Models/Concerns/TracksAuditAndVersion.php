<?php

namespace App\Models\Concerns;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;

/**
 * Shared audit + per-row version helpers for SchemaTable and SchemaField.
 *
 * Both models track *who* last touched them (text username, never NULL) and a
 * monotonic `version` counter that is bumped only when meaningful columns
 * change. The actual "when to bump" policy lives in the model observers —
 * this trait just provides the building blocks they call.
 */
trait TracksAuditAndVersion
{
    /**
     * Per-class flag observers must honour. Storage layers that already set
     * audit/version explicitly (SQL import) flip this on so the observer
     * doesn't double-bump on top of the imported values.
     *
     * Use `withAuditSuppressed()` to scope a closure with the flag set.
     */
    public static bool $suppressAudit = false;

    public static function withAuditSuppressed(callable $callback): mixed
    {
        $previous = static::$suppressAudit;
        static::$suppressAudit = true;
        try {
            return $callback();
        } finally {
            static::$suppressAudit = $previous;
        }
    }

    public function bumpVersion(): void
    {
        $this->version = ($this->version ?? 0) + 1;
    }

    /**
     * Stamp the create-side audit. Caller may pass an explicit username/date
     * (e.g. recovered from a JSON-in-COMMENT round-trip); otherwise uses the
     * current authenticated user and now().
     */
    public function applyAuditOnCreate(?string $username = null, ?string $createdAt = null): void
    {
        $now = Carbon::now();
        $user = $username ?: static::currentUsername();

        $this->created_by_username = $user;
        $this->updated_by_username = $user;
        $this->created_at = $createdAt ? Carbon::parse($createdAt) : $now;
        $this->updated_at = $now;
    }

    public function applyAuditOnUpdate(?string $username = null): void
    {
        $this->updated_by_username = $username ?: static::currentUsername();
        $this->updated_at = Carbon::now();
    }

    /**
     * Resolve the username we attribute the current request to.
     *
     * Preference order: users.username → users.name → 'system'. Email is
     * deliberately not used (PII bloat in SQL COMMENTs). Returns 'system'
     * for unauthenticated contexts (artisan, queue jobs, seeders).
     */
    public static function currentUsername(): string
    {
        $user = Auth::user();
        if (!$user) {
            return 'system';
        }
        return $user->username ?: ($user->name ?: 'system');
    }
}
