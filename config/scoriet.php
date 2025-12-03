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
];
