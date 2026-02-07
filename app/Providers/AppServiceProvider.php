<?php

namespace App\Providers;

use Carbon\CarbonInterval;
use Laravel\Passport\Passport;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Artisan;
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
use App\Observers\SchemaTableObserver;
use App\Observers\ProjectGenerationTreeObserver;
use App\Observers\ProjectSchemaObserver;

class AppServiceProvider extends \Illuminate\Foundation\Support\Providers\AuthServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        Passport::ignoreMigrations();
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
        ProjectGenerationTree::observe(ProjectGenerationTreeObserver::class);
        ProjectSchema::observe(ProjectSchemaObserver::class);
    }
}
