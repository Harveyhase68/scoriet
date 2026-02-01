<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware to check if user has valid CLI access
 *
 * This middleware verifies that the authenticated user has an active,
 * non-expired CLI subscription before allowing access to CLI-protected routes.
 */
class CheckCliAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required',
                'error_code' => 'AUTH_REQUIRED',
            ], 401);
        }

        // Check if user has valid CLI access
        if (!$user->hasCliAccess()) {
            $accessStatus = $user->getCliAccessStatus();

            return response()->json([
                'success' => false,
                'message' => 'CLI access required. Your subscription may have expired or you need to unlock CLI access.',
                'error_code' => 'CLI_ACCESS_REQUIRED',
                'cli_cost' => $accessStatus['cli_cost'] ?? 50,
                'bundle_cost' => $accessStatus['bundle_cost'] ?? 90,
                'user_credits' => $accessStatus['user_credits'] ?? 0,
                'unlock_instructions' => [
                    'cli_only' => 'scoriet auth unlock cli',
                    'bundle' => 'scoriet auth unlock bundle',
                ],
                'purchase_url' => 'https://scoriet.dev/credits',
            ], 402); // Payment Required
        }

        return $next($request);
    }
}
