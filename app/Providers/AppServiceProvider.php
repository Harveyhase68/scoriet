<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\Passport\Passport;
use Carbon\Carbon;
use Carbon\CarbonInterval;

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
        
    }
}
