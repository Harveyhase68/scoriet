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
    $userType = request('user', 'demo-user');
    
    if (!in_array($userType, ['demo-admin', 'demo-user'])) {
        $userType = 'demo-user';
    }
    
    return Inertia::render('Index', [
        'demoLogin' => true,
        'demoUser' => $userType,
        'demoMessage' => 'Demo-Modus aktiviert! Daten werden alle 20 Minuten zurückgesetzt.'
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
