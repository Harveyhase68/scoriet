<?php

namespace App\Http\Controllers;

use App\Mail\DemoAccessMail;
use App\Models\DemoAccessRequest;
use App\Services\RegistrationValidationService;
use App\Support\DemoAccessCookie;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Email-gated demo access.
 *
 *  - request()     runs on the MAIN deployment: captures the lead, emails a
 *                  one-time link to demo.scoriet.dev/demo-access/{token}.
 *  - redeem()      runs on the MAIN deployment: secret-guarded API the demo
 *                  calls server-side to validate a token (single source of truth).
 *  - redeemEntry() runs on the DEMO deployment: the link target. Calls main's
 *                  redeem(), sets the signed gate cookie, strips the token from
 *                  the URL, or bounces to the main site.
 *
 * The current consent wording version. Bump when the consent text changes so
 * stored `consent_text_version` stays auditable (GDPR).
 */
class DemoAccessController extends Controller
{
    private const CONSENT_VERSION = 'v1';

    /**
     * MAIN — public, throttled. Capture the email and send the access link.
     * Always returns a generic success to avoid email enumeration.
     */
    public function request(Request $request, RegistrationValidationService $validator): JsonResponse
    {
        // Honeypot: bots fill hidden fields. Pretend success, do nothing.
        if (!empty($request->input('website'))) {
            return $this->genericRequestResponse();
        }

        $request->validate([
            'email' => 'required|string|email|max:255',
            'consent' => 'accepted',
        ]);

        // Disposable / MX / Tor / "scoriet-in-localpart" checks (reused).
        $check = $validator->validate($request);
        if (!$check['valid']) {
            // Surface a field error so the user can correct a genuine typo /
            // disposable address — this is not enumeration (no account exists).
            return response()->json([
                'success' => false,
                'errors' => $check['errors'],
            ], 422);
        }

        $email = strtolower(trim($request->input('email')));

        // Dedupe: reuse an existing unexpired token instead of minting a second.
        $accessRequest = DemoAccessRequest::activeForEmail($email)->latest()->first();

        if (!$accessRequest) {
            $accessRequest = DemoAccessRequest::create([
                'email' => $email,
                'token' => DemoAccessRequest::generateToken(),
                'expires_at' => DemoAccessRequest::nextExpiry(),
                'consent' => true,
                'consent_text_version' => self::CONSENT_VERSION,
                'request_ip' => $request->ip(),
                'user_agent' => substr((string) $request->userAgent(), 0, 512),
            ]);
        }

        try {
            Mail::to($email)->send(new DemoAccessMail($accessRequest));
            $accessRequest->markSent();
        } catch (\Throwable $e) {
            Log::error('Demo access mail failed: ' . $e->getMessage());
            // Still return generic success — do not leak delivery state.
        }

        return $this->genericRequestResponse();
    }

    private function genericRequestResponse(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => __('demoaccess.request_sent'),
        ]);
    }

    /**
     * MAIN — secret-guarded API called by the demo deployment. Validates the
     * token, records the first redemption, returns the absolute expiry.
     */
    public function redeem(Request $request): JsonResponse
    {
        $secret = (string) config('scoriet.redeem_secret');
        if ($secret === '' || !hash_equals($secret, (string) $request->header('X-Demo-Redeem-Secret'))) {
            return response()->json(['valid' => false, 'reason' => 'unauthorized'], 401);
        }

        $token = (string) $request->input('token');
        $accessRequest = DemoAccessRequest::where('token', $token)->first();

        if (!$accessRequest || $accessRequest->isExpired()) {
            return response()->json(['valid' => false, 'reason' => 'invalid_or_expired'], 200);
        }

        $accessRequest->markRedeemed($request->input('redeemed_ip'));

        return response()->json([
            'valid' => true,
            'expires_at' => $accessRequest->expires_at->getTimestamp(),
        ], 200);
    }

    /**
     * DEMO — the emailed link target. Validates against main, sets the signed
     * gate cookie, and redirects to a clean URL (no token) so bookmarks cannot
     * capture the GUID. Bounces to main on any failure.
     */
    public function redeemEntry(Request $request, string $token): RedirectResponse
    {
        $mainUrl = (string) config('scoriet.main_url');

        try {
            $response = Http::withHeaders([
                'X-Demo-Redeem-Secret' => (string) config('scoriet.redeem_secret'),
            ])->timeout(8)->post($mainUrl . '/api/demo-access/redeem', [
                'token' => $token,
                'redeemed_ip' => $request->ip(),
            ]);
        } catch (\Throwable $e) {
            Log::error('Demo redeem call to main failed: ' . $e->getMessage());
            return redirect()->away($mainUrl . '/?demo_access=error');
        }

        if (!$response->ok() || !$response->json('valid')) {
            return redirect()->away($mainUrl . '/?demo_access=expired');
        }

        $expiresAtEpoch = (int) $response->json('expires_at');
        $minutes = max(1, (int) ceil(($expiresAtEpoch - time()) / 60));

        $cookie = Cookie::make(
            DemoAccessCookie::NAME,
            DemoAccessCookie::make($expiresAtEpoch),
            $minutes,
            '/',
            null,   // domain
            $request->secure(), // secure
            true,   // httpOnly
            false,
            'Lax'
        );

        // Clean URL: drop the token so a bookmark of the landing page won't
        // carry it. The gate cookie now authorises the session.
        return redirect('/demo-login')->withCookie($cookie);
    }
}
