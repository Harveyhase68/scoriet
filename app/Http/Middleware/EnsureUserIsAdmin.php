<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Admin access is granted ONLY through a Passport Bearer token. Tokens
        // are issued exclusively by /api/auth/* and /api/oauth/token, which
        // enforce email verification and 2FA. The web (session) guard is
        // deliberately not consulted: a session is not proof of 2FA.
        $user = $request->bearerToken() ? auth('api')->user() : null;

        // Check if user is authenticated
        if (! $user) {
            Log::warning(__('ensureuserisadminphp33'));

            // For API or Inertia requests, return JSON error
            if ($request->expectsJson() || $request->header('X-Inertia')) {
                return response()->json([
                    'message' => __('ensureuserisadminphp38'),
                ], 401);
            }

            // For web requests, redirect to landing page
            return redirect('/')->with('error', __('ensureuserisadminphp43'));
        }

        // Check if user is admin or system user
        $isSystemAdmin = $user->user_type === 'system';

        if (! $isSystemAdmin) {
            Log::warning(__('ensureuserisadminphp50'), [
                'user_id' => $user->id,
                'user_type' => $user->user_type,
            ]);

            // For API or Inertia requests, return JSON error
            if ($request->expectsJson() || $request->header('X-Inertia')) {
                return response()->json([
                    'message' => __('ensureuserisadminphp58'),
                ], 403);
            }

            // For web requests, redirect to app with error
            return redirect('/app')->with('error', __('ensureuserisadminphp63'));
        }

        return $next($request);
    }
}
