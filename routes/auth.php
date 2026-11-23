<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Auth Entry Points (GET only)
|--------------------------------------------------------------------------
|
| Scoriet authenticates exclusively through Passport (/api/auth/* and
| /api/oauth/token), where invite-only registration, registration security
| checks, email verification and 2FA are enforced.
|
| There must be NO session-based login/registration on the web guard: the
| web middleware group runs Passport's CreateFreshApiToken, so any web
| session would be silently upgraded to a full API credential (laravel_token
| cookie), bypassing every check above. The routes below only render the SPA
| or exist as named targets that the framework links to.
|
*/

Route::middleware('guest')->group(function () {
    // Registration page with optional invite token - renders the public home page
    // (Blade) with the register modal opened by the React island.
    // The form itself posts to /api/auth/register.
    Route::get('register', [App\Http\Controllers\PublicSiteController::class, 'register'])->name('register');

    // Named target for the Authenticate middleware redirect.
    Route::get('login', function () {
        return redirect('/');
    })->name('login');

    // Link target of the password reset email (route name 'password.reset' is
    // used by Laravel's ResetPassword notification). The modal posts to
    // /api/auth/reset-password.
    Route::get('reset-password/{token}', function ($token) {
        return Inertia::render('Index', [
            'resetToken' => $token,
            'resetEmail' => request()->get('email'),
        ]);
    })->name('password.reset');
});
