<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Landing Page (Public)
Route::get('/', function () {
    // Frontend handles auth state via JavaScript and localStorage
    return Inertia::render('LandingPage');
})->name('landing');

// Protected App
Route::get('/app', function () {
    return Inertia::render('Index');
})->name('app');

Route::get('/verify-email/{id}/{hash}', function ($id, $hash) {
    return Inertia::render('EmailVerification', [
        'userId' => $id,
        'hash' => $hash
    ]);
})->name('verification.verify');

// Project Invitation Routes (from email links)
Route::get('/project-invitations/accept/{token}', function ($token) {
    return Inertia::render('ProjectInvitationResponse', [
        'token' => $token,
        'action' => 'accept'
    ]);
})->name('project-invitations.accept');

Route::get('/project-invitations/decline/{token}', function ($token) {
    return Inertia::render('ProjectInvitationResponse', [
        'token' => $token,
        'action' => 'decline'
    ]);
})->name('project-invitations.decline');

// Demo login route (for demo.scoriet.dev)
Route::get('/demo-login', function () {
    // Only demo-user is allowed - no system/admin access in demo mode
    return Inertia::render('Index', [
        'demoLogin' => true,
        'demoUser' => 'demo-user',
        'demoMessage' => __('webphp45')
    ]);
})->name('demo.login');

/*
Route::get('/app', function () {
    return Inertia::render('Dashboard', [
        'user' => auth()->user() // User-Daten mitgeben
    ]);
});

Route::get('/users', function () {
    return Inertia::render('Users');
})->name('users');

Route::get('/activity', function () {
    return Inertia::render('Activity');
})->name('activity');

Route::get('/security', function () {
    return Inertia::render('Security');
})->name('security');

Route::get('/database', function () {
    return Inertia::render('Database');
})->name('database');

Route::get('/admin-settings', function () {
    return Inertia::render('Settings');
})->name('admin-settings');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});
*/

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

// Admin routes for CMS (protected - only system administrators)
// Note: These should be accessed from within /app, not directly
// Payment result routes (Stripe redirects)
Route::get('/payment/success', function () {
    return Inertia::render('PaymentResult', [
        'status' => 'success',
        'session_id' => request('session_id'),
        'provider' => request('provider', 'stripe'),
        'type' => request('type', 'credits'),
    ]);
})->name('payment.success');

Route::get('/payment/cancel', function () {
    return Inertia::render('PaymentResult', [
        'status' => 'cancelled'
    ]);
})->name('payment.cancel');

// PayPal success route (user returns after approval - for one-time payments)
Route::get('/payment/paypal/success', function () {
    return Inertia::render('PaymentResult', [
        'status' => 'pending_capture',
        'provider' => 'paypal',
        'token' => request('token'),
        'payer_id' => request('PayerID')
    ]);
})->name('payment.paypal.success');

// PayPal subscription success route (user returns after subscribing)
Route::get('/payment/paypal/subscription-success', [App\Http\Controllers\Api\PayPalController::class, 'handleSubscriptionSuccess'])
    ->name('payment.paypal.subscription-success');

// Git OAuth Callback (for popup windows)
Route::get('/auth/git/{provider}/callback', function ($provider) {
    $code = request('code');
    $state = request('state');
    $error = request('error');
    $errorDescription = request('error_description');

    // Return a simple HTML page that communicates with the parent window
    return response()->view('auth.git-callback', [
        'provider' => $provider,
        'code' => $code,
        'state' => $state,
        'error' => $error,
        'errorDescription' => $errorDescription,
    ]);
})->name('git.callback');

// Public Project Overview (no authentication required)
// URL format: /project/{username}/{projectname}
Route::get('/project/{username}/{projectname}', [App\Http\Controllers\PublicProjectController::class, 'show'])
    ->name('public.project');

Route::middleware(['web', 'admin'])->group(function () {
    Route::get('/admin/pages', [App\Http\Controllers\Admin\PageController::class, 'index'])->name('admin.pages.index');
    Route::get('/admin/pages/create', [App\Http\Controllers\Admin\PageController::class, 'create'])->name('admin.pages.create');
    Route::post('/admin/pages', [App\Http\Controllers\Admin\PageController::class, 'store'])->name('admin.pages.store');
    Route::get('/admin/pages/{page}/edit', [App\Http\Controllers\Admin\PageController::class, 'edit'])->name('admin.pages.edit');
    Route::put('/admin/pages/{page}', [App\Http\Controllers\Admin\PageController::class, 'update'])->name('admin.pages.update');
    Route::delete('/admin/pages/{page}', [App\Http\Controllers\Admin\PageController::class, 'destroy'])->name('admin.pages.destroy');
});

// Localized CMS pages using Inertia (must be before generic route)
Route::get('/{locale}/help', [App\Http\Controllers\PageController::class, 'help'])
    ->where('locale', 'en|de|fr|es|it')
    ->name('pages.help');

Route::get('/{locale}/impressum', [App\Http\Controllers\PageController::class, 'impressum'])
    ->where('locale', 'en|de|fr|es|it')
    ->name('pages.impressum');

Route::get('/{locale}/contact', [App\Http\Controllers\PageController::class, 'contact'])
    ->where('locale', 'en|de|fr|es|it')
    ->name('pages.contact');

// Localized static pages (only for known locales)
Route::middleware(['web'])->group(function () {
    Route::get('/{locale}/{slug}', [App\Http\Controllers\PageController::class, 'show'])
        ->where('locale', 'en|de|fr|es|it') // Only allow known locales
        ->where('slug', '[a-z-]+')
        ->name('page');
});
