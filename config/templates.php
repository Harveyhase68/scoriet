<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Template Compilation Cache
    |--------------------------------------------------------------------------
    |
    | Enable caching of compiled templates to speed up code generation.
    | When enabled, compiled JavaScript templates are cached in Redis/File cache.
    |
    */

    'cache_enabled' => env('TEMPLATE_CACHE_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | Auto Pre-compilation
    |--------------------------------------------------------------------------
    |
    | When enabled, templates are automatically pre-compiled in the background
    | after being saved. This warms up the cache so the next code generation
    | is much faster.
    |
    | Disable this if you want to manually trigger pre-compilation only.
    |
    */

    'auto_precompile' => env('TEMPLATE_AUTO_PRECOMPILE', false),

    /*
    |--------------------------------------------------------------------------
    | Cache TTL (Time To Live)
    |--------------------------------------------------------------------------
    |
    | How long compiled templates should stay in cache (in hours).
    | After this time, they will be re-compiled on next use.
    |
    */

    'cache_ttl_hours' => env('TEMPLATE_CACHE_TTL_HOURS', 24),

    /*
    |--------------------------------------------------------------------------
    | AWS SQS Queue Configuration
    |--------------------------------------------------------------------------
    |
    | When scaling to AWS, configure SQS for queue processing.
    | Set QUEUE_CONNECTION=sqs in .env to use AWS SQS.
    |
    */

    'queue_connection' => env('QUEUE_CONNECTION', 'database'),

    /*
    |--------------------------------------------------------------------------
    | Pre-compilation Batch Size
    |--------------------------------------------------------------------------
    |
    | How many template compilations to process in parallel when pre-warming cache.
    | Lower = less server load, higher = faster pre-compilation.
    |
    */

    'precompile_batch_size' => env('TEMPLATE_PRECOMPILE_BATCH_SIZE', 10),

    /*
    |--------------------------------------------------------------------------
    | Template Categories
    |--------------------------------------------------------------------------
    |
    | Predefined template categories for dropdowns in the GUI.
    | Users can also enter custom categories (VARCHAR field).
    |
    */

    'categories' => [
        'Web',
        'Mobile',
        'API',
        'Desktop',
        'Database',
        'E-Commerce',
        'CMS',
        'Dashboard',
        'Fullstack',
        'Backend',
        'Frontend',
        'DevOps',
        'Testing',
        'Documentation',
        'Authentication',
        'Payment',
        'Admin Panel',
        'Landing Page',
        'Portfolio',
        'Blog',
    ],

    /*
    |--------------------------------------------------------------------------
    | Supported Programming Languages
    |--------------------------------------------------------------------------
    |
    | Predefined language options for templates.
    | This is just a suggestion list - users can enter custom languages.
    |
    */

    'languages' => [
        'PHP',
        'JavaScript',
        'TypeScript',
        'Python',
        'Java',
        'C#',
        'Go',
        'Rust',
        'Ruby',
        'Swift',
        'Kotlin',
        'Dart',
        'SQL',
        'HTML',
        'CSS',
        'SCSS',
        'Vue',
        'React',
        'Angular',
        'Laravel',
        'Django',
        'Spring',
        'ASP.NET',
    ],

];
