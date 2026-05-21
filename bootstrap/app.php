<?php

use App\Http\Middleware\CheckCliAccess;
use App\Http\Middleware\CheckServiceAccess;
use App\Http\Middleware\CheckTeamPermission;
use App\Http\Middleware\DemoProtection;
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
        channels: __DIR__.'/../routes/channels.php',
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

        // 🔒 Clear stale project edit locks (older than 15 minutes)
        $schedule->command('projects:clear-stale-locks')
            ->everyFiveMinutes()
            ->withoutOverlapping();

        // ⌛ Auto-fail pending CLI tasks whose pickup window has passed.
        // The scoriet-svc queue endpoint already filters these out at read
        // time, but without this cleanup they would sit in the DB as
        // "pending" forever and confuse status views. Per-type TTLs come
        // from CliTask::PICKUP_TIMEOUT_MINUTES.
        $schedule->call(function () {
            foreach (\App\Models\CliTask::PICKUP_TIMEOUT_MINUTES as $type => $minutes) {
                \App\Models\CliTask::query()
                    ->where('status', \App\Models\CliTask::STATUS_PENDING)
                    ->where('task_type', $type)
                    ->where('created_at', '<', now()->subMinutes($minutes))
                    ->update([
                        'status'        => \App\Models\CliTask::STATUS_FAILED,
                        'failed_at'     => now(),
                        'error_message' => "Task expired - service did not pick it up within {$minutes} minutes",
                    ]);
            }
        })->name('cli-tasks-expire-stale')
          ->everyFiveMinutes()
          ->withoutOverlapping();
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
            DemoProtection::class,
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
        // For non-browser entry points (CLI client, JSON API consumers) we
        // never want to fall through to Laravel's default web-redirect on
        // an AuthenticationException - that would land the caller on the
        // login HTML page with status 200 (after the redirect is followed),
        // which a JSON client cannot parse and which masks the real reason.
        // Force a clean 401 JSON response on every /cli/* and /api/* path
        // and on any other route that explicitly expects JSON.
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, \Illuminate\Http\Request $request) {
            if ($request->is('cli/*') || $request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage() ?: 'Unauthenticated.',
                ], 401);
            }
            // Fall through to default redirect behaviour for browser / web routes
            return null;
        });
    })->create();
