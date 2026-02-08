<?php

use App\Http\Middleware\CheckCliAccess;
use App\Http\Middleware\CheckServiceAccess;
use App\Http\Middleware\CheckTeamPermission;
use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\SetLocale;
use App\Http\Middleware\TrackVisitor;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Support\Facades\Route;
use Laravel\Passport\Http\Middleware\CreateFreshApiToken;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            // CLI Routes (separate from web/api for better security)
            Route::prefix('cli')
                ->middleware('api')
                ->group(base_path('routes/cli.php'));

            // Payment & Monetization Routes
            Route::prefix('api')
                ->middleware('api')
                ->group(base_path('routes/payment.php'));
        }
    )
    ->withSchedule(function (Schedule $schedule) {
        // 🧪 TEST: Heartbeat every minute (zum Testen - kann später gelöscht werden)
        $schedule->call(function () {
            \Log::info('💓 Scheduler Heartbeat: ' . now()->toDateTimeString());
        })->everyMinute();

        // 🔥 Warm cache every 6 hours (keeps cache fresh)
        $schedule->command('cache:warm')
            ->everySixHours()
            ->withoutOverlapping()
            ->runInBackground();

        // 🔥 Force rebuild cache daily at 3 AM (ensures fresh data)
        $schedule->command('cache:warm --force')
            ->dailyAt('03:00')
            ->withoutOverlapping()
            ->runInBackground();
    })
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
            CreateFreshApiToken::class,
            TrackVisitor::class,
        ]);

        $middleware->api(append: [
            SetLocale::class,
        ]);

        // Register middleware aliases
        $middleware->alias([
            'admin' => EnsureUserIsAdmin::class,
            'team.permission' => CheckTeamPermission::class,
            'cli.access' => CheckCliAccess::class,
            'service.access' => CheckServiceAccess::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
