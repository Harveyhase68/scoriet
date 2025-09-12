<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;

class Authenticate extends Middleware
{
    protected function redirectTo($request): ?string
    {
        // Never redirect API requests - always return 401
        if ($request->is('api/*')) {
            return null;
        }

        if (! $request->expectsJson()) {
            return route('login');
        }

        return null;
    }
}
