<?php

namespace App\Http\Controllers;

use Laravel\Passport\Http\Controllers\AccessTokenController;
use Laravel\Passport\Token;
use Laravel\Passport\RefreshToken;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\ResponseInterface;
use Symfony\Component\HttpFoundation\Response;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class CustomTokenController extends AccessTokenController
{
    public function issueToken(ServerRequestInterface $psrRequest, ResponseInterface $psrResponse): Response
    {
        $requestData = $this->parseRequestBody($psrRequest);

        // Non-password grants (refresh_token, etc.) go straight through to
        // standard Passport - none of our extensions apply to them.
        $isPasswordGrant = ($requestData['grant_type'] ?? null) === 'password'
                         && isset($requestData['username']);

        if (!$isPasswordGrant) {
            try {
                return parent::issueToken($psrRequest, $psrResponse);
            } catch (\League\OAuth2\Server\Exception\OAuthServerException $e) {
                return $this->oauthErrorResponse($e);
            } catch (\Exception $e) {
                return $this->genericErrorResponse($e);
            }
        }

        // ================================================================
        // Section 1: User identification & credential check
        //   - Resolve username/email -> User
        //   - Block if email not verified
        //   - Reactivate dormant accounts
        //   - Verify password
        // ================================================================
        $user = null;
        try {
            $loginField = $requestData['username'];

            if (str_contains($loginField, '@')) {
                $user = User::where('email', $loginField)->first();
            } else {
                $user = User::where('username', $loginField)->first();
                if (!$user) {
                    return response()->json([
                        'error' => 'invalid_credentials',
                        'message' => __('customtokencontrollerphp51'),
                    ], 401);
                }
                // Pass the email on to Passport - it only knows email.
                $requestData['username'] = $user->email;
            }

            if ($user && !$user->hasVerifiedEmail()) {
                return response()->json([
                    'message' => 'E-Mail-Adresse muss vor dem Login bestätigt werden',
                    'email_verification_required' => true,
                ], 403);
            }

            // Inactivity-deactivated accounts come back to life on a successful
            // login attempt - the user is proving they're still around.
            if ($user && $user->isDeactivated()) {
                $user->reactivate();
            }

            if ($user && !Hash::check($requestData['password'] ?? '', $user->password)) {
                return response()->json([
                    'error' => 'invalid_credentials',
                    'message' => 'The provided credentials are incorrect.',
                ], 401);
            }
        } catch (\Exception $e) {
            return $this->genericErrorResponse($e);
        }

        // ================================================================
        // Section 2: Two-Factor Authentication gate
        //   - Skip if a 2fa_verified_<user_id> marker is present
        //     (set by AuthController::loginWith2FA after successful TOTP)
        //   - Skip if the device is trusted and re-verification not due
        //   - Otherwise: stash encrypted password, return 2fa_required
        // ================================================================
        try {
            if ($user && $user->hasTwoFactorEnabled() && !\Cache::pull('2fa_verified_' . $user->id)) {
                $deviceId = $requestData['device_id'] ?? null;
                $deviceTrusted = $deviceId && $user->isDeviceTrusted($deviceId);
                $needsReverification = $user->needsTwoFactorReVerification();

                if (!$deviceTrusted || $needsReverification) {
                    $twoFactorToken = bin2hex(random_bytes(32));
                    \Cache::put('2fa_pending_' . $twoFactorToken, [
                        'user_id' => $user->id,
                        'device_id' => $deviceId,
                        'remember_me' => $requestData['remember_me'] ?? false,
                        // Stashed so loginWith2FA can replay password grant
                        // post-verification and obtain a real refresh_token.
                        'password' => encrypt($requestData['password']),
                        'created_at' => now()->toISOString(),
                    ], now()->addMinutes(10));

                    return response()->json([
                        'message' => '2FA-Verifizierung erforderlich',
                        'two_factor_required' => true,
                        'two_factor_token' => $twoFactorToken,
                        'needs_reverification' => $needsReverification,
                    ], 200);
                }
            }
        } catch (\Exception $e) {
            return $this->genericErrorResponse($e);
        }

        // ================================================================
        // Section 3: Token issuance & response decoration
        //   - recordLogin / claim monthly credits / single-session revoke
        //   - Hand control to Passport's standard password grant
        //   - Lift access+refresh token expiry to 30 days for remember_me
        //   - Decorate JSON body with session metadata for the frontend
        // ================================================================
        try {
            $creditsAwarded = false;
            $existingTokenCount = 0;
            if ($user) {
                $user->recordLogin();
                $creditsAwarded = $user->claimMonthlyCredits();

                // SINGLE SESSION ENFORCEMENT: revoke any existing WEB tokens
                // for this user before issuing a new one. Prevents account
                // sharing and limits each user to one active web session.
                // CLI/Service tokens ("Scoriet CLI%") are preserved.
                // Demo mode skips this so multiple users can share an account.
                //
                // Filter handles MySQL's three-valued logic: `name NOT LIKE x`
                // returns NULL for NULL names (not TRUE), so a plain "not like"
                // would silently skip OAuth2 password-grant tokens (which have
                // name = NULL). Explicitly include them via whereNull.
                if (!config('scoriet.demo')) {
                    $webTokenFilter = function ($q) {
                        $q->whereNull('name')
                          ->orWhere('name', 'not like', 'Scoriet CLI%');
                    };

                    $existingTokenCount = $user->tokens()
                        ->where('revoked', false)
                        ->where($webTokenFilter)
                        ->count();

                    $user->tokens()
                        ->where($webTokenFilter)
                        ->update(['revoked' => true]);
                }
            }

            // Strip our remember_me extension before forwarding - Passport's
            // grant server rejects unknown fields on some configurations.
            $rememberMe = (bool) ($requestData['remember_me'] ?? false);
            unset($requestData['remember_me']);
            $psrRequest = $psrRequest->withParsedBody($requestData);

            $response = parent::issueToken($psrRequest, $psrResponse);

            if ($response->getStatusCode() !== 200 || !isset($user)) {
                return $response;
            }

            $tokenData = json_decode($response->getContent(), true);
            if (!is_array($tokenData) || !isset($tokenData['access_token'])) {
                return $response;
            }

            $tokenId = $this->extractJwtId($tokenData['access_token']);

            if ($tokenId && $rememberMe) {
                // Rewrite the DB rows that Passport just inserted with default
                // short lifetimes - we want 30 days for remember_me logins.
                $extendedExpiry = now()->addDays(30);
                Token::where('id', $tokenId)->update(['expires_at' => $extendedExpiry]);
                RefreshToken::where('access_token_id', $tokenId)
                    ->update(['expires_at' => $extendedExpiry]);

                $tokenData['expires_in'] = 30 * 24 * 60 * 60;
            }

            $tokenData['monthly_credits_awarded'] = $creditsAwarded;
            $tokenData['other_sessions_revoked'] = $existingTokenCount > 0;
            $tokenData['revoked_session_count'] = $existingTokenCount;

            return response()->json($tokenData, 200);
        } catch (\League\OAuth2\Server\Exception\OAuthServerException $e) {
            return $this->oauthErrorResponse($e);
        } catch (\Exception $e) {
            return $this->genericErrorResponse($e);
        }
    }

    /**
     * Read the request body from a PSR-7 request, accepting both JSON and
     * form-encoded payloads.
     */
    private function parseRequestBody(ServerRequestInterface $psrRequest): array
    {
        $data = $psrRequest->getParsedBody();
        if (!$data) {
            $body = (string) $psrRequest->getBody();
            if (!empty($body)) {
                $data = json_decode($body, true) ?: [];
            }
        }
        return is_array($data) ? $data : [];
    }

    /**
     * Translate a League OAuth2 server exception into the JSON shape clients
     * expect, preserving the original HTTP status code.
     */
    private function oauthErrorResponse(\League\OAuth2\Server\Exception\OAuthServerException $e): Response
    {
        \Log::error('OAuth token error: ' . $e->getMessage());
        return response()->json([
            'error' => $e->getErrorType(),
            'message' => $e->getMessage(),
        ], $e->getHttpStatusCode());
    }

    /**
     * Generic 500-fallback for unexpected errors. Logs the original message
     * but returns a non-leaking response to the client.
     */
    private function genericErrorResponse(\Throwable $e): Response
    {
        \Log::error('OAuth token error: ' . $e->getMessage());
        return response()->json([
            'error' => 'server_error',
            'message' => 'An error occurred while processing your request.',
        ], 500);
    }

    /**
     * Extract the JWT ID (jti claim) from an access token without verifying
     * the signature. Safe to use here because we just issued the token in
     * the same request and only need the id to look up the matching DB rows.
     */
    private function extractJwtId(string $jwt): ?string
    {
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) {
            return null;
        }

        $payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);
        return is_array($payload) ? ($payload['jti'] ?? null) : null;
    }
}