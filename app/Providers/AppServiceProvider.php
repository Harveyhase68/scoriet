<?php

namespace App\Providers;

use Carbon\CarbonInterval;
use Laravel\Passport\Passport;

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
        Passport::tokensExpireIn(now()->addHour());
        Passport::refreshTokensExpireIn(now()->addDays(30));
        Passport::personalAccessTokensExpireIn(CarbonInterval::months(6));
        
        // Enable Password Grant Type
        Passport::enablePasswordGrant();

    }
}
