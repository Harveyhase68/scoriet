<?php

namespace App\Providers;

use Carbon\CarbonInterval;
use Laravel\Passport\Passport;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;
use App\Models\Template;
use App\Models\SchemaVersion;
use App\Models\Project;
use App\Models\TemplateFile;
use App\Models\ProjectTemplateUsage;
use App\Models\SchemaTable;
use App\Models\ProjectGenerationTree;
use App\Models\ProjectSchema;
use App\Observers\TemplateObserver;
use App\Observers\SchemaVersionObserver;
use App\Observers\ProjectObserver;
use App\Observers\TemplateFileObserver;
use App\Observers\ProjectTemplateUsageObserver;
use App\Observers\SchemaFieldObserver;
use App\Observers\SchemaTableObserver;
use App\Models\SchemaField;
use App\Observers\ProjectGenerationTreeObserver;
use App\Observers\ProjectSchemaObserver;
use App\Observers\LanguageObserver;
use App\Observers\ProjectFormSetObserver;
use App\Observers\SchemaTranslationObserver;
use App\Observers\TemplateFileFieldAssignmentObserver;
use App\Models\Language;
use App\Models\ProjectFormSet;
use App\Models\SchemaTranslation;
use App\Models\TemplateFileFieldAssignment;

class AppServiceProvider extends \Illuminate\Foundation\Support\Providers\AuthServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {

        $this->registerPolicies();

        // 🔒 SCHUTZ: Verhindere passport:install in bestehenden Projekten
        // Schützt OAuth Clients vor versehentlichem Überschreiben
        try {
            // Prüfe nur wenn DB-Verbindung verfügbar (verhindert Fehler bei composer install in CI)
            if (Schema::hasTable('oauth_clients')) {
                Artisan::command('passport:install {--force : Force the operation to run}', function () {
                    $this->error('⚠️  FEHLER: passport:install darf nicht in bestehenden Projekten ausgeführt werden!');
                    $this->error('');
                    $this->error('Die OAuth Clients existieren bereits in der Datenbank.');
                    $this->error('Ein erneutes Ausführen würde die bestehenden Clients überschreiben!');
                    $this->error('');
                    $this->info('💡 Wenn Sie neue OAuth Clients erstellen möchten, verwenden Sie:');
                    $this->info('   php artisan passport:client --password    # Password Grant Client');
                    $this->info('   php artisan passport:client --personal    # Personal Access Client');
                    $this->info('   php artisan passport:client               # Standard OAuth Client');
                    $this->error('');
                    $this->error('Dieser Schutz ist in app/Providers/AppServiceProvider.php implementiert.');

                    return 1; // Exit code 1 = Fehler
                })->describe('BLOCKIERT: Passport ist bereits installiert. Schutz gegen versehentliches Überschreiben.');
            }
        } catch (\Exception $e) {
            // DB nicht verfügbar (z.B. während composer install in CI) - ignorieren
        }

        // Default token expiry (will be overridden in CustomTokenController for remember_me)
        Passport::tokensExpireIn(now()->addHours(2));
        Passport::refreshTokensExpireIn(now()->addDays(7));
        Passport::personalAccessTokensExpireIn(CarbonInterval::months(6));

        // Enable Password Grant Type
        Passport::enablePasswordGrant();

        // Custom email verification URL
        VerifyEmail::createUrlUsing(function ($notifiable) {
            $id = $notifiable->getKey();
            $hash = sha1($notifiable->getEmailForVerification());

            return url("/verify-email/{$id}/{$hash}") .
                   '?expires=' . now()->addHour()->timestamp .
                   '&signature=' . hash_hmac('sha256',
                       "verify-email/{$id}/{$hash}",
                       config('app.key'));
        });

        // Register observers for automatic generation tree regeneration
        Template::observe(TemplateObserver::class);
        SchemaVersion::observe(SchemaVersionObserver::class);
        Project::observe(ProjectObserver::class);
        TemplateFile::observe(TemplateFileObserver::class);
        ProjectTemplateUsage::observe(ProjectTemplateUsageObserver::class);
        SchemaTable::observe(SchemaTableObserver::class);
        SchemaField::observe(SchemaFieldObserver::class);
        ProjectGenerationTree::observe(ProjectGenerationTreeObserver::class);
        ProjectSchema::observe(ProjectSchemaObserver::class);
        Language::observe(LanguageObserver::class);
        ProjectFormSet::observe(ProjectFormSetObserver::class);
        SchemaTranslation::observe(SchemaTranslationObserver::class);
        TemplateFileFieldAssignment::observe(TemplateFileFieldAssignmentObserver::class);

        $this->registerApiRateLimiters();
    }

    /**
     * Per-token rate limits for the public CLI/API surface.
     *
     * Bucketed by Passport token id (not user id, not IP) so:
     *   - A user with multiple CLI installs gets full budget per install.
     *   - A leaked token can't burn through a user's entire allowance
     *     while the user is still working with another token.
     *   - Unauthenticated calls fall back to an IP bucket so the limiter
     *     can't be invoked without `by(...)` and crash.
     *
     * Two named limiters:
     *   cli-default   — broad ceiling for all /cli/v1/* calls (1000/h).
     *                   Generous enough that legitimate clients (CLI, svc
     *                   polling progress, dev with Postman) never feel it,
     *                   but tight enough that a leaked token + malicious
     *                   loop is capped at a hard hourly limit.
     *   cli-generate  — tighter limit on code generation (30/h). Each
     *                   generation costs credits AND queue-worker time,
     *                   so this is the real DoS / credit-drain valve.
     *                   30/h still allows a CI pipeline that regenerates
     *                   on every commit to keep working.
     *
     * The scoriet-svc daemon endpoints (/svc/*) are the exception: they are a
     * CONTINUOUS HEARTBEAT, not discrete calls. The daemon polls /svc/queue
     * every few seconds and appends task logs in bursts. At a 2s cadence that
     * is ~1800 queue req/h — it would blow the 1000/h cli-default ceiling
     * inside the hour and then 429 for the rest of it (exactly the bug we hit).
     * A poller needs a PER-MINUTE bucket so a transient burst recovers within
     * a minute instead of locking the daemon out for a full hour. These routes
     * are already gated behind auth:api + service.access (a trusted, device-
     * registered daemon), so a generous per-minute ceiling is safe.
     */
    private function registerApiRateLimiters(): void
    {
        $bucketFor = function (Request $request, int $authedPerHour, int $anonPerHour): Limit {
            $token = $request->user()?->token();
            return $token
                ? Limit::perHour($authedPerHour)->by('cli-token:' . $token->id)
                : Limit::perHour($anonPerHour)->by($request->ip());
        };

        RateLimiter::for('cli-default', function (Request $request) use ($bucketFor) {
            // scoriet-svc heartbeat (queue poll + log/submit bursts): a
            // continuously-polling daemon, not discrete CLI traffic. Give it a
            // per-minute bucket (recovers every minute) sized well above the
            // poll cadence so legitimate polling never trips it, while still
            // capping a runaway loop at 120/min.
            if ($request->is('cli/v1/svc/*')) {
                $token = $request->user()?->token();
                return $token
                    ? Limit::perMinute(120)->by('svc-token:' . $token->id)
                    : Limit::perMinute(20)->by($request->ip());
            }
            return $bucketFor($request, 1000, 60);
        });

        RateLimiter::for('cli-generate', function (Request $request) use ($bucketFor) {
            return $bucketFor($request, 30, 5);
        });
    }
}
