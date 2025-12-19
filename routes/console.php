<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    // Overrides the Laravel default
});

// Update Tor exit nodes daily at 3 AM
Schedule::command('security:update-tor-nodes')->daily()->at('03:00');

// Update disposable email domains weekly on Sunday at 4 AM
Schedule::command('security:update-disposable-domains')->weekly()->sundays()->at('04:00');
