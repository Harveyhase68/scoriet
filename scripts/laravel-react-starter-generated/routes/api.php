<?php

use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProdGroupController;
use Illuminate\Support\Facades\Route;

Route::apiResource('products', ProductController::class);
Route::get('products/{product}/image', [ProductController::class, 'image'])->name('products.image');
Route::get('prod-groups', [ProdGroupController::class, 'index']);
Route::post('prod-groups', [ProdGroupController::class, 'store']);
