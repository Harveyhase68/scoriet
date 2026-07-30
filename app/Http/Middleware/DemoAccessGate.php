<?php

namespace App\Http\Middleware;

use App\Support\DemoAccessCookie;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Server-side gate for the DEMO deployment. No-op unless `config('scoriet.demo')`
 * (so it is completely inert on the main site).
 *
 * The demo auto-login posts hardcoded credentials (demo-user/demo1234) to
 * /api/oauth/token, so gating the landing button or the page alone is useless —
 * anyone could replay that POST. This middleware is the real chokepoint: it
 * requires a valid signed `demo_access` cookie (only obtainable by redeeming a
 * valid emailed token, see DemoAccessController::redeemEntry) on:
 *
 *   - POST /api/oauth/token   -> 403 JSON `demo_access_required` if missing
 *   - GET  /app, /demo-login  -> 302 bounce to the main site if missing
 *
 * The redeem entry route (/demo-access/{token}) is intentionally NOT gated —
 * it is how the cookie is obtained. Everything else (assets, /up, other api
 * calls that already require a bearer token) is left untouched.
 */
class DemoAccessGate
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!config('scoriet.demo', false)) {
            return $next($request);
        }

        if (DemoAccessCookie::valid($request->cookie(DemoAccessCookie::NAME))) {
            return $next($request);
        }

        // The token-issuing endpoint: block the credential replay outright.
        if ($request->isMethod('POST') && $request->is('api/oauth/token')) {
            return response()->json([
                'error' => 'demo_access_required',
                'message' => __('demoaccess.gate_blocked'),
            ], Response::HTTP_FORBIDDEN);
        }

        // The demo entry pages: bounce to the main site so the visitor is asked
        // for their email (the landing page auto-opens the request modal).
        if ($request->is('app') || $request->is('demo-login')) {
            $mainUrl = rtrim((string) config('scoriet.main_url'), '/');
            return redirect()->away($mainUrl . '/?demo_access=required');
        }

        return $next($request);
    }
}
