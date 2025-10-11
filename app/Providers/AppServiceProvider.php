<?php

namespace App\Providers;

use Carbon\CarbonInterval;
use Laravel\Passport\Passport;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\Template;
use App\Models\SchemaVersion;
use App\Models\Project;
use App\Observers\TemplateObserver;
use App\Observers\SchemaVersionObserver;
use App\Observers\ProjectObserver;

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
    }
}
