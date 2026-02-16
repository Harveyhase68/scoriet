<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    // Overrides the Laravel default
});

// Update Tor exit nodes daily at 3 AM
Schedule::command('security:update-tor-nodes')->daily()->at('03:00');

// Update disposable email domains weekly on Sunday at 4 AM
Schedule::command('security:update-disposable-domains')->weekly()->sundays()->at('04:00');

// Check subscription expiry every 10 minutes and send notifications
Schedule::command('subscriptions:check-expiry')
    ->everyTenMinutes()
    ->withoutOverlapping()
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/subscription-expiry.log'));

// Check for inactive users daily at 6 AM and send warning emails / deactivate
Schedule::command('users:check-inactive')
    ->dailyAt('06:00')
    ->withoutOverlapping()
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/inactive-users.log'));

// Demo reset countdown: set cache flag 5 minutes before reset (only when SCORIET_DEMO=true)
Schedule::call(function () {
    Cache::put('demo_reset_at', now()->addMinutes(5)->toIso8601String(), 10); // TTL 10 min (auto-cleanup)
})
    ->dailyAt('04:55')
    ->when(function () {
        return config('scoriet.demo', false);
    });

// Reset demo database daily at 5 AM (only runs when SCORIET_DEMO=true)
Schedule::command('demo:reset')
    ->dailyAt('05:00')
    ->when(function () {
        return config('scoriet.demo', false);
    })
    ->withoutOverlapping()
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/demo-reset.log'));
