<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Template Cache Configuration
    |--------------------------------------------------------------------------
    |
    | These options control the caching behavior for compiled templates.
    | Enable caching in production for better performance.
    |
    */
    'template_cache' => [
        'enabled' => env('TEMPLATE_CACHE_ENABLED', false),
        'ttl_hours' => env('TEMPLATE_CACHE_TTL_HOURS', 24),
        'auto_precompile' => env('TEMPLATE_AUTO_PRECOMPILE', false),
        'precompile_batch_size' => env('TEMPLATE_PRECOMPILE_BATCH_SIZE', 10),
    ],

    /*
    |--------------------------------------------------------------------------
    | Demo Mode
    |--------------------------------------------------------------------------
    |
    | When enabled, certain features like registration and emails are disabled.
    |
    */
    'demo' => env('SCORIET_DEMO', false),

    /*
    |--------------------------------------------------------------------------
    | Email-Gated Demo Access
    |--------------------------------------------------------------------------
    |
    | The demo (demo.scoriet.dev) and the main site (scoriet.dev) are separate
    | deployments with separate databases. Visitors must request a one-time
    | access link by email on the main site; the demo redeems that token by
    | calling back to the main site (stateful validation).
    |
    | - main_url:      Base URL of the MAIN deployment the demo calls to redeem
    |                  tokens. On main this points at itself.
    | - redeem_secret: Shared secret. Used BOTH as the X-Demo-Redeem-Secret
    |                  header guarding the redeem API AND as the HMAC key that
    |                  signs the `demo_access` gate cookie. MUST be identical in
    |                  both .env / .env.demo. Never reuse APP_KEY.
    |
    */
    'main_url' => rtrim(env('SCORIET_MAIN_URL', env('APP_URL', 'http://localhost')), '/'),
    'demo_url' => rtrim(env('SCORIET_DEMO_URL', 'https://demo.scoriet.dev'), '/'),
    'redeem_secret' => env('DEMO_REDEEM_SECRET', ''),

    /*
    |--------------------------------------------------------------------------
    | Auth Fail2Ban
    |--------------------------------------------------------------------------
    |
    | Fail2ban-style IP banning for the authentication endpoints (login,
    | OAuth password grant, 2FA, password reset). See App\Services\AuthFail2Ban.
    |
    | - max_retry:   failures within find_time that trigger a ban.
    | - find_time:   sliding window (seconds) in which failures are counted.
    | - ban_times:   escalating ban durations (seconds). Ban #1 uses the first
    |                entry, ban #2 the second, ...; the last entry repeats.
    | - forget_time: seconds without a new ban after which an IP's escalation
    |                level is forgotten (fail2ban "recidive" memory). Must be
    |                longer than the largest ban time.
    | - ignore_ips:  comma-separated IPs that are never banned (fail2ban
    |                "ignoreip"), e.g. an office NAT or a monitoring host.
    |
    | While an IP is banned, every auth attempt from it fails with the
    | endpoint's normal failure response WITHOUT checking credentials - the
    | attacker cannot tell a ban from a wrong password.
    |
    */
    'auth_fail2ban' => [
        'enabled' => env('AUTH_FAIL2BAN_ENABLED', true),
        'max_retry' => (int) env('AUTH_FAIL2BAN_MAX_RETRY', 3),
        'find_time' => (int) env('AUTH_FAIL2BAN_FIND_TIME', 600),
        'ban_times' => [10, 50, 180, 600, 1800, 3600, 21600, 86400],
        'forget_time' => (int) env('AUTH_FAIL2BAN_FORGET_TIME', 7 * 86400),
        'ignore_ips' => array_values(array_filter(array_map('trim', explode(',', (string) env('AUTH_FAIL2BAN_IGNORE_IPS', ''))))),
    ],
];
