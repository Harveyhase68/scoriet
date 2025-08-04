<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\SqlParserController;  // ← Das ist wichtig!

Route::get('/', function () {
    return Inertia::render('Index');
})->name('index');

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

// Neue Route für RC-Dock Database Visualizer
Route::get('/database-designer', function () {
    return Inertia::render('DatabaseDesigner');
})->name('database-designer');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
