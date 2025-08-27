<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Index');
})->name('index');

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
