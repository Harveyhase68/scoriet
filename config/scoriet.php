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
];
