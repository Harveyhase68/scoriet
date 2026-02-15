<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DemoProtection
{
    /**
     * Protected HTTP methods that demo users cannot use.
     */
    protected array $protectedMethods = ['DELETE'];

    /**
     * Handle an incoming request.
     *
     * Prevents demo users from performing destructive operations (DELETE).
     * Demo users can still create (POST) and update (PUT/PATCH) data.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip if demo mode is not active
        if (!config('scoriet.demo', false)) {
            return $next($request);
        }

        // Skip if user is not authenticated
        if (!$request->user()) {
            return $next($request);
        }

        // Check if user is a demo user
        $user = $request->user();
        if (!$this->isDemoUser($user)) {
            return $next($request);
        }

        // Block protected methods (DELETE)
        if (in_array($request->method(), $this->protectedMethods)) {
            return response()->json([
                'error' => 'demo_restricted',
                'message' => 'Delete operations are not allowed in demo mode. Data resets daily at 05:00 UTC.',
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }

    /**
     * Check if the user is a demo user.
     */
    protected function isDemoUser($user): bool
    {
        // Check by email prefix
        if (str_starts_with($user->email, 'demo-')) {
            return true;
        }

        // Check by email pattern (demo@, demo., etc.)
        if (str_contains($user->email, 'demo')) {
            return true;
        }

        return false;
    }
}
