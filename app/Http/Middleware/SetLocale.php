<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $supportedLocales = ['en', 'de', 'fr', 'es', 'it'];
        $locale = null;

        // 1. Check route parameter
        $routeLocale = $request->route('locale');
        if ($routeLocale && in_array($routeLocale, $supportedLocales)) {
            $locale = $routeLocale;
        }

        // 2. Check authenticated user's language preference
        if (!$locale && $request->user() && $request->user()->language) {
            $userLocale = $request->user()->language;
            if (in_array($userLocale, $supportedLocales)) {
                $locale = $userLocale;
            }
        }

        // 3. Check Accept-Language header
        if (!$locale) {
            $acceptLanguage = $request->header('Accept-Language');
            if ($acceptLanguage) {
                $browserLocale = substr($acceptLanguage, 0, 2);
                if (in_array($browserLocale, $supportedLocales)) {
                    $locale = $browserLocale;
                }
            }
        }

        // 4. Default to English
        if ($locale) {
            App::setLocale($locale);
        }

        return $next($request);
    }
}
