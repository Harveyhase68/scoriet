<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\VisitorLog;
use Illuminate\Support\Facades\Auth;

class TrackVisitor
{
    /**
     * Track unique visitors per day.
     * Logs one entry per IP per day to avoid bloating the database.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only track GET requests (page visits, not form submissions)
        if ($request->isMethod('GET')) {
            $this->trackVisit($request);
        }

        return $next($request);
    }

    private function trackVisit(Request $request): void
    {
        try {
            $ip = $request->ip();
            $today = now()->toDateString();
            $user = Auth::guard('web')->user();
            $sessionId = $request->session()->getId();

            // Check if this IP was already logged today
            $alreadyLogged = VisitorLog::where('ip_address', $ip)
                ->where('visited_date', $today)
                ->exists();

            if ($alreadyLogged) {
                return;
            }

            VisitorLog::create([
                'user_id' => $user ? $user->id : null,
                'ip_address' => $ip,
                'session_id' => $sessionId,
                'page_url' => $request->fullUrl(),
                'referrer' => $request->header('referer'),
                'user_agent' => $request->userAgent(),
                'is_authenticated' => $user !== null,
                'visited_date' => $today,
            ]);
        } catch (\Exception $e) {
            // Never let tracking break the actual request
            \Illuminate\Support\Facades\Log::warning('Visitor tracking failed: ' . $e->getMessage());
        }
    }
}
