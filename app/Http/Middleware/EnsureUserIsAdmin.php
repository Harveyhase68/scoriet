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
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Try to authenticate via session first (web guard)
        $user = auth('web')->user();

        // If not authenticated via session, try API guard (Passport)
        // This handles Bearer tokens from Authorization header or cookies
        if (!$user) {
            // Check if we have a Bearer token in the Authorization header
            if ($request->bearerToken()) {
                $user = auth('api')->user();
            }
        }

        // Check if user is authenticated
        if (!$user) {
            Log::warning('Admin access denied: User not authenticated');

            // For API or Inertia requests, return JSON error
            if ($request->expectsJson() || $request->header('X-Inertia')) {
                return response()->json([
                    'message' => 'Unauthenticated. Please login first.'
                ], 401);
            }

            // For web requests, redirect to landing page
            return redirect('/')->with('error', 'Bitte melden Sie sich an, um auf diesen Bereich zuzugreifen.');
        }

        // Check if user is admin or system user
        $isSystemAdmin = in_array($user->user_type, ['admin', 'system']);

        if (!$isSystemAdmin) {
            Log::warning('Admin access denied: User is not admin/system', [
                'user_id' => $user->id,
                'user_type' => $user->user_type,
            ]);

            // For API or Inertia requests, return JSON error
            if ($request->expectsJson() || $request->header('X-Inertia')) {
                return response()->json([
                    'message' => 'Forbidden. Administrator access required.'
                ], 403);
            }

            // For web requests, redirect to app with error
            return redirect('/app')->with('error', 'Zugriff verweigert. Nur System-Administratoren haben Zugang zu diesem Bereich.');
        }

        return $next($request);
    }
}
