<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CreditPackageController;
use App\Http\Controllers\Api\PatronSubscriptionController;
use App\Http\Controllers\Api\TicketController;

/*
|--------------------------------------------------------------------------
| Payment & Monetization API Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:api')->group(function () {
    // Credit Packages
    Route::get('/credit-packages', [CreditPackageController::class, 'index']);
    Route::post('/credit-packages/purchase', [CreditPackageController::class, 'purchase']);
    Route::get('/credit-packages/history', [CreditPackageController::class, 'history']);

    // Patron Subscriptions
    Route::get('/patron/plans', [PatronSubscriptionController::class, 'index']);
    Route::post('/patron/subscribe', [PatronSubscriptionController::class, 'subscribe']);
    Route::post('/patron/cancel', [PatronSubscriptionController::class, 'cancel']);
    Route::get('/patron/status', [PatronSubscriptionController::class, 'status']);

    // Ticket System
    Route::get('/tickets', [TicketController::class, 'index']);
    Route::post('/tickets', [TicketController::class, 'store']);
    Route::get('/tickets/stats', [TicketController::class, 'stats']);
    Route::get('/tickets/{id}', [TicketController::class, 'show']);
});
