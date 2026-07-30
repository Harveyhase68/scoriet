<?php

namespace App\Support;

/**
 * Self-signed (HMAC) value for the `demo_access` gate cookie.
 *
 * Why not rely on Laravel's cookie encryption: the cookie must be readable in
 * BOTH the web group (the redeem redirect / page loads) AND the api group
 * (the `/api/oauth/token` chokepoint). The api middleware group does not run
 * EncryptCookies, so an encrypted cookie would arrive undecrypted there.
 * Instead we leave this cookie unencrypted (added to encryptCookies `except`)
 * and sign it ourselves with the shared demo secret — forgery-proof and
 * readable identically in either group.
 *
 * Format: "{expiryEpoch}.{hmac}"  where hmac = HMAC-SHA256(expiryEpoch, secret)
 */
class DemoAccessCookie
{
    public const NAME = 'demo_access';

    private static function secret(): string
    {
        return (string) config('scoriet.redeem_secret');
    }

    /**
     * Build the signed cookie value for a given absolute expiry (unix epoch).
     */
    public static function make(int $expiresAtEpoch): string
    {
        $sig = hash_hmac('sha256', (string) $expiresAtEpoch, self::secret());

        return $expiresAtEpoch . '.' . $sig;
    }

    /**
     * Validate a cookie value: correct signature AND not expired.
     */
    public static function valid(?string $value): bool
    {
        if (empty($value) || self::secret() === '') {
            return false;
        }

        $parts = explode('.', $value, 2);
        if (count($parts) !== 2) {
            return false;
        }

        [$epoch, $sig] = $parts;
        if (!ctype_digit($epoch)) {
            return false;
        }

        $expected = hash_hmac('sha256', $epoch, self::secret());
        if (!hash_equals($expected, $sig)) {
            return false;
        }

        return (int) $epoch > time();
    }
}
