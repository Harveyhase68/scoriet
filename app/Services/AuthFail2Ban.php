<?php

namespace App\Services;

use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Fail2ban-style IP banning for the authentication endpoints.
 *
 * Semantics follow fail2ban:
 *  - A failure is recorded per client IP with its timestamp.
 *  - When max_retry failures fall inside the sliding find_time window, the
 *    IP is banned and its failure history is cleared.
 *  - Ban durations escalate per IP (ban_times), like fail2ban's
 *    bantime.increment; the escalation level is forgotten after forget_time
 *    without a new ban.
 *  - While banned, attempts are "dropped": they are neither evaluated nor
 *    counted. Callers answer them with their normal failure response, so a
 *    ban is indistinguishable from a wrong password (silent ban).
 *
 * Deliberate design decisions:
 *  - Keyed by IP only, never by account. A per-account ban would let anyone
 *    lock a victim out of their own account by failing three times with the
 *    victim's email. Distributed attacks on one account are capped by the
 *    per-account RateLimiters (see AppServiceProvider::registerAuthRateLimiters).
 *  - A successful login does NOT clear the failure history. Otherwise an
 *    attacker with one valid account could interleave successful logins to
 *    reset the counter and guess other accounts' passwords without limit.
 *  - All read-modify-write sequences run under a cache lock, so the counters
 *    stay correct on every cache store (file, database, redis), not only on
 *    stores with atomic increments.
 */
class AuthFail2Ban
{
    private const PREFIX = 'auth-fail2ban:';

    public function isBanned(Request $request): bool
    {
        $ip = $request->ip();

        return $ip !== null && $this->enabled() && ! $this->isIgnored($ip) && $this->banExpiresAt($ip) !== null;
    }

    /**
     * Record a failed authentication attempt and ban the IP once the
     * threshold is reached.
     *
     * @param  string  $reason  short identifier of the failing endpoint, for the log
     */
    public function recordFailure(Request $request, string $reason): void
    {
        $ip = $request->ip();

        if ($ip === null || ! $this->enabled() || $this->isIgnored($ip)) {
            return;
        }

        try {
            Cache::lock(self::PREFIX.'lock:'.$ip, 5)->block(3, function () use ($ip, $reason) {
                $this->recordFailureLocked($ip, $reason);
            });
        } catch (LockTimeoutException $e) {
            // Fail open: losing one failure record is harmless, the
            // RateLimiters on the same routes remain in force.
            Log::warning('AuthFail2Ban: lock timeout, failure not recorded', ['ip' => $ip, 'reason' => $reason]);
        }
    }

    /**
     * Current state of an IP, for diagnostics and the security:auth-bans command.
     *
     * @return array{banned_until: int|null, level: int, recent_failures: int}
     */
    public function status(string $ip): array
    {
        return [
            'banned_until' => $this->banExpiresAt($ip),
            'level' => (int) Cache::get($this->levelKey($ip), 0),
            'recent_failures' => count($this->recentFailures($ip, now()->getTimestamp())),
        ];
    }

    /**
     * Lift an active ban. With $resetLevel the escalation history is cleared
     * as well, so the next ban starts again at the shortest duration.
     */
    public function unban(string $ip, bool $resetLevel = false): void
    {
        Cache::forget($this->banKey($ip));
        Cache::forget($this->failuresKey($ip));

        if ($resetLevel) {
            Cache::forget($this->levelKey($ip));
        }
    }

    private function recordFailureLocked(string $ip, string $reason): void
    {
        $now = now()->getTimestamp();

        // Attempts during a ban are dropped, exactly like fail2ban drops
        // packets from a banned address: they must not extend the ban.
        if ($this->banExpiresAt($ip) !== null) {
            return;
        }

        $findTime = $this->config('find_time');
        $failures = $this->recentFailures($ip, $now);
        $failures[] = $now;

        if (count($failures) < $this->config('max_retry')) {
            Cache::put($this->failuresKey($ip), $failures, $findTime);

            return;
        }

        $level = (int) Cache::get($this->levelKey($ip), 0);
        $banTimes = $this->banTimes();
        $duration = $banTimes[min($level, count($banTimes) - 1)];

        Cache::put($this->banKey($ip), $now + $duration, $duration);
        Cache::put($this->levelKey($ip), $level + 1, max($this->config('forget_time'), $duration));
        Cache::forget($this->failuresKey($ip));

        Log::warning('AuthFail2Ban: IP banned', [
            'ip' => $ip,
            'ban_seconds' => $duration,
            'ban_number' => $level + 1,
            'trigger' => $reason,
        ]);
    }

    /**
     * Failure timestamps of this IP that are still inside the find_time window.
     *
     * @return list<int>
     */
    private function recentFailures(string $ip, int $now): array
    {
        $stored = Cache::get($this->failuresKey($ip), []);
        $windowStart = $now - $this->config('find_time');
        $recent = [];

        foreach (is_array($stored) ? $stored : [] as $timestamp) {
            if (is_int($timestamp) && $timestamp > $windowStart) {
                $recent[] = $timestamp;
            }
        }

        return $recent;
    }

    /**
     * Unix timestamp at which the active ban ends, or null when not banned.
     * The stored timestamp is checked in addition to the cache TTL because
     * some stores expire entries with coarse granularity.
     */
    private function banExpiresAt(string $ip): ?int
    {
        $until = Cache::get($this->banKey($ip));

        return is_int($until) && $until > now()->getTimestamp() ? $until : null;
    }

    private function isIgnored(string $ip): bool
    {
        return in_array($ip, (array) config('scoriet.auth_fail2ban.ignore_ips', []), true);
    }

    private function enabled(): bool
    {
        return (bool) config('scoriet.auth_fail2ban.enabled', true);
    }

    private function config(string $key): int
    {
        return max(1, (int) config('scoriet.auth_fail2ban.'.$key));
    }

    /**
     * @return non-empty-list<int>
     */
    private function banTimes(): array
    {
        $banTimes = [];

        foreach ((array) config('scoriet.auth_fail2ban.ban_times', []) as $seconds) {
            if ((int) $seconds > 0) {
                $banTimes[] = (int) $seconds;
            }
        }

        return $banTimes === [] ? [60] : $banTimes;
    }

    private function failuresKey(string $ip): string
    {
        return self::PREFIX.'failures:'.$ip;
    }

    private function banKey(string $ip): string
    {
        return self::PREFIX.'ban:'.$ip;
    }

    private function levelKey(string $ip): string
    {
        return self::PREFIX.'level:'.$ip;
    }
}
