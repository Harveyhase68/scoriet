<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Makes credential failures that skip the real password check take as long
 * as one that performs it.
 *
 * A bcrypt/argon check costs ~100ms+, so "unknown user" or "IP banned" would
 * otherwise answer measurably faster than "wrong password" - a timing oracle
 * for account existence and for the silent fail2ban state.
 *
 * The comparison runs against a dummy hash created with the CURRENT hashing
 * configuration. It is cached, and regenerated whenever the configuration
 * changes (Hash::needsRehash), so its cost always matches real user hashes.
 */
final class PasswordCheckTiming
{
    private const CACHE_KEY = 'auth:password-check-timing-hash';

    public static function equalize(string $password): void
    {
        Hash::check($password, self::dummyHash());
    }

    private static function dummyHash(): string
    {
        $hash = Cache::get(self::CACHE_KEY);

        if (! is_string($hash) || Hash::needsRehash($hash)) {
            $hash = Hash::make(Str::random(40));
            Cache::forever(self::CACHE_KEY, $hash);
        }

        return $hash;
    }
}
