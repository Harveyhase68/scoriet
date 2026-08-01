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
        $result = $this->resolveToken($token, $request->input('redeemed_ip'));

        if (!$result['valid']) {
            return response()->json(['valid' => false, 'reason' => 'invalid_or_expired'], 200);
        }

        return response()->json($result, 200);
    }

    /**
     * Shared token-validation core used by both redeem() (cross-deployment,
     * called over HTTP) and redeemEntry() (same-deployment, called in-process
     * — see redeemEntry() docblock for why the in-process path exists).
     *
     * @return array{valid: bool, expires_at: int|null}
     */
    private function resolveToken(string $token, ?string $ip): array
    {
        $accessRequest = DemoAccessRequest::where('token', $token)->first();

        if (!$accessRequest || $accessRequest->isExpired()) {
            return ['valid' => false, 'expires_at' => null];
        }

        $accessRequest->markRedeemed($ip);

        return ['valid' => true, 'expires_at' => $accessRequest->expires_at->getTimestamp()];
    }

    /**
     * DEMO — the emailed link target. Validates against main, sets the signed
     * gate cookie, and redirects to a clean URL (no token) so bookmarks cannot
     * capture the GUID. Bounces to main on any failure.
     *
     * `main_url` defaults to this instance's own `app.url` and is only ever
     * overridden (via SCORIET_MAIN_URL) on a deployment that is NOT main —
     * see the docblock on config/scoriet.php ("On main this points at
     * itself"). So `main_url === app.url` is exactly "am I main", regardless
     * of which hostname/vhost this particular request came in on (relevant
     * locally, where both the main and demo vhosts proxy to the same app).
     * When true, there is no real network boundary to cross, so the token is
     * resolved in-process instead of round-tripping over HTTP to itself.
     *
     * That self-call is not just a local quirk: it deadlocks on any
     * synchronous single-worker request handler (PHP's built-in server has
     * no worker pool on Windows, and a saturated php-fpm pool could exhibit
     * the same failure in production) because the one worker handling this
     * request is also the only one that could answer it. Skipping the hop
     * when there is nothing on the other end of it removes that failure mode
     * entirely rather than papering over it. Deliberately independent of
     * whether DEMO_REDEEM_SECRET is configured — that secret authenticates a
     * network boundary and signs the gate cookie; it says nothing about
     * whether this instance IS main.
     */
    public function redeemEntry(Request $request, string $token): RedirectResponse
    {
        $mainUrl = (string) config('scoriet.main_url');
        $secret = (string) config('scoriet.redeem_secret');
        $isMain = rtrim((string) config('app.url'), '/') === $mainUrl;

        if ($isMain) {
            $result = $this->resolveToken($token, $request->ip());

            if (!$result['valid']) {
                return redirect()->away($mainUrl . '/?demo_access=expired');
            }

            $expiresAtEpoch = (int) $result['expires_at'];
        } else {
            try {
                $response = Http::withHeaders([
                    'X-Demo-Redeem-Secret' => $secret,
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
        }

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
