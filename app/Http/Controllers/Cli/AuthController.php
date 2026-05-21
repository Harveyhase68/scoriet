<?php

namespace App\Http\Controllers\Cli;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Laravel\Passport\Token;

class AuthController extends Controller
{
    /**
     * Authorize CLI client and generate Personal Access Token
     *
     * POST /cli/auth/authorize
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function authorize(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
            'client_name' => 'string|max:255', // Optional: Name des CLI Clients (z.B. "MacBook Pro")
            'device_id' => 'nullable|string',  // Optional: persistent device id for trust-device flow
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        // Find user
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid credentials',
            ], 401);
        }

        // Check if email is verified
        if (!$user->hasVerifiedEmail()) {
            return response()->json([
                'success' => false,
                'message' => 'Email not verified. Please verify your email address.',
                'email_verified' => false,
            ], 403);
        }

        // 2FA gate: if the user has 2FA enabled and the device isn't trusted
        // (or re-verification is due), defer token issuance. The CLI client
        // should then call /cli/auth/verify-2fa with the returned
        // two_factor_token plus the TOTP / recovery code.
        if ($user->hasTwoFactorEnabled()) {
            $deviceId = $request->input('device_id');
            $deviceTrusted = $deviceId && $user->isDeviceTrusted($deviceId);
            $needsReverification = $user->needsTwoFactorReVerification();

            if (!$deviceTrusted || $needsReverification) {
                $twoFactorToken = bin2hex(random_bytes(32));
                \Cache::put('cli_2fa_pending_' . $twoFactorToken, [
                    'user_id' => $user->id,
                    'device_id' => $deviceId,
                    'client_name' => $request->input('client_name', 'Scoriet CLI'),
                    'created_at' => now()->toISOString(),
                ], now()->addMinutes(10));

                return response()->json([
                    'success' => false,
                    'two_factor_required' => true,
                    'two_factor_token' => $twoFactorToken,
                    'needs_reverification' => $needsReverification,
                    'message' => 'Two-factor authentication required',
                ], 200);
            }
        }

        // Create Personal Access Token for CLI
        $clientName = $request->input('client_name', 'Scoriet CLI');
        $token = $user->createToken($clientName); // No scope restrictions

        // Bind the token to the calling device so that removing this device
        // from the user's Trusted Devices list also revokes this token.
        if ($request->input('device_id')) {
            $token->token->device_id = $request->input('device_id');
            $token->token->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Authorization successful',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'user_type' => $user->user_type,
            ],
            'token' => [
                'access_token' => $token->accessToken,
                'token_type' => 'Bearer',
                'expires_at' => $token->token->expires_at->toIso8601String(),
            ],
        ], 200);
    }

    /**
     * Verify a 2FA code against a previously issued two_factor_token and
     * complete the CLI login by issuing a Personal Access Token.
     *
     * POST /cli/auth/verify-2fa
     *
     * Body: {
     *   two_factor_token: string,        // from the /authorize response
     *   code: string,                    // 6-digit TOTP or 10-digit recovery code
     *   trust_device?: boolean,          // mark this device as trusted for 30 days
     *   device_id?: string,              // required when trust_device is true
     *   client_name?: string             // override client name from /authorize
     * }
     */
    public function verifyTwoFactor(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'two_factor_token' => 'required|string',
            'code' => 'required|string',
            'trust_device' => 'nullable|boolean',
            'device_id' => 'nullable|string',
            'client_name' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $cacheKey = 'cli_2fa_pending_' . $request->two_factor_token;
        $pendingData = \Cache::get($cacheKey);
        if (!$pendingData) {
            return response()->json([
                'success' => false,
                'message' => 'Pending 2FA session expired or not found. Please log in again.',
            ], 401);
        }

        $user = User::find($pendingData['user_id']);
        if (!$user) {
            \Cache::forget($cacheKey);
            return response()->json([
                'success' => false,
                'message' => 'User not found',
            ], 401);
        }

        // Brute-force protection: count failed verify attempts inside the
        // pending session. Progressive delay slows down automated tools, the
        // hard cap forces re-login after MAX_ATTEMPTS so an attacker cannot
        // use a single two_factor_token to scan the entire 6-digit space.
        $maxAttempts = 5;
        $failedAttempts = (int) ($pendingData['failed_attempts'] ?? 0);

        // Verify the code. 10-character codes are recovery codes, 6-character
        // codes are standard TOTP from the authenticator app.
        $code = trim($request->code);
        $isRecoveryCode = strlen($code) === 10;
        $verified = false;

        if ($isRecoveryCode) {
            $verified = $user->verifyRecoveryCode($code);
        } else {
            $google2fa = new \PragmaRX\Google2FA\Google2FA();
            $verified = $google2fa->verifyKey($user->two_factor_secret, $code);
            if ($verified) {
                $user->updateTwoFactorVerificationTime();
            }
        }

        if (!$verified) {
            $failedAttempts++;

            // Hard cap: invalidate the pending session and force a fresh
            // /authorize call (which re-checks the password).
            if ($failedAttempts >= $maxAttempts) {
                \Cache::forget($cacheKey);
                return response()->json([
                    'success' => false,
                    'message' => 'Too many invalid attempts. Pending session expired - please log in again.',
                ], 429);
            }

            // Progressive delay: 0s, 0s, 1s, 3s, 8s. Doesn't block legitimate
            // users much but rate-limits anyone scanning the 6-digit space.
            $delaySeconds = max(0, (1 << ($failedAttempts - 1)) - 1);
            if ($delaySeconds > 0) {
                sleep(min($delaySeconds, 8));
            }

            // Persist the updated counter back into the cache. Keep TTL on
            // the original 10-minute window so failures don't extend it.
            $pendingData['failed_attempts'] = $failedAttempts;
            \Cache::put($cacheKey, $pendingData, now()->addMinutes(10));

            return response()->json([
                'success' => false,
                'message' => 'Invalid 2FA code',
                'attempts_remaining' => $maxAttempts - $failedAttempts,
            ], 422);
        }

        // Consume the pending entry - codes are single-use.
        \Cache::forget($cacheKey);

        // Mark device as trusted if requested. Browser field is set to a
        // CLI-recognisable string so the user sees it clearly in the
        // "Trusted Devices" list in the web UI.
        if ($request->boolean('trust_device') && $request->device_id) {
            $user->trustDevice(
                $request->device_id,
                'Scoriet CLI',
                $request->ip()
            );
        }

        // Issue the Personal Access Token (same shape as /authorize success)
        $clientName = $request->input('client_name', $pendingData['client_name'] ?? 'Scoriet CLI');
        $token = $user->createToken($clientName);

        // Bind the token to the verifying device so that removing this device
        // from the user's Trusted Devices list also revokes this token.
        $deviceId = $request->input('device_id') ?? ($pendingData['device_id'] ?? null);
        if ($deviceId) {
            $token->token->device_id = $deviceId;
            $token->token->save();
        }

        $response = [
            'success' => true,
            'message' => 'Authorization successful',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'user_type' => $user->user_type,
            ],
            'token' => [
                'access_token' => $token->accessToken,
                'token_type' => 'Bearer',
                'expires_at' => $token->token->expires_at->toIso8601String(),
            ],
        ];

        if ($isRecoveryCode) {
            $response['recovery_code_used'] = true;
            $response['recovery_codes_remaining'] = $user->getRecoveryCodesCount();
        }

        return response()->json($response, 200);
    }

    /**
     * Refresh the access token
     *
     * POST /cli/auth/refresh
     *
     * Revokes the current token and creates a new one.
     * Requires valid authentication (current token must be valid).
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function refresh(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated. Please provide valid Bearer token in Authorization header.',
            ], 401);
        }

        $currentToken = $user->token();

        if (!$currentToken) {
            return response()->json([
                'success' => false,
                'message' => 'No valid token found to refresh',
            ], 401);
        }

        try {
            // Get client name from request or use the current token's name
            $clientName = $request->input('client_name', 'Scoriet CLI');

            // Revoke the old token
            $currentToken->revoke();

            // Create new token
            $newToken = $user->createToken($clientName);

            return response()->json([
                'success' => true,
                'message' => 'Token refreshed successfully',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'user_type' => $user->user_type,
                ],
                'token' => [
                    'access_token' => $newToken->accessToken,
                    'token_type' => 'Bearer',
                    'expires_at' => $newToken->token->expires_at->toIso8601String(),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Token refresh failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get current authenticated user information
     *
     * GET /cli/auth/whoami
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function whoami(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'user_type' => $user->user_type,
                'email_verified_at' => $user->email_verified_at?->toIso8601String(),
                'created_at' => $user->created_at->toIso8601String(),
            ],
        ], 200);
    }

    /**
     * Logout / Revoke the current access token
     *
     * POST /cli/auth/logout
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout(Request $request)
    {
        // Revoke the token that was used to authenticate the current request
        $token = $request->user()->token();

        if ($token) {
            $token->revoke();

            return response()->json([
                'success' => true,
                'message' => 'Token revoked successfully',
            ], 200);
        }

        return response()->json([
            'success' => false,
            'message' => 'No token found to revoke',
        ], 400);
    }

    /**
     * Verify if the current token is valid
     *
     * GET /cli/auth/verify
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verify(Request $request)
    {
        $user = $request->user();
        $token = $request->user()->token();

        return response()->json([
            'success' => true,
            'valid' => true,
            'token' => [
                'expires_at' => $token->expires_at->toIso8601String(),
                'revoked' => $token->revoked,
                'scopes' => $token->scopes,
            ],
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
            ],
        ], 200);
    }

    /**
     * Get CLI/Service access status
     *
     * GET /cli/auth/cli-access
     *
     * Returns access status for CLI tool and Windows Service
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function cliAccess(Request $request)
    {
        $user = $request->user();
        $accessStatus = $user->getCliAccessStatus();

        return response()->json([
            'success' => true,
            ...$accessStatus,
        ], 200);
    }

    /**
     * Purchase CLI access with credits
     *
     * POST /cli/auth/unlock-cli
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function unlockCli(Request $request)
    {
        $user = $request->user();

        // Check if already has access
        if ($user->hasCliAccess()) {
            return response()->json([
                'success' => true,
                'message' => 'You already have CLI access',
                'already_unlocked' => true,
                ...$user->getCliAccessStatus(),
            ], 200);
        }

        // Check credits
        if ($user->credits < Subscription::CLI_UNLOCK_COST) {
            return response()->json([
                'success' => false,
                'message' => 'Not enough credits',
                'required_credits' => Subscription::CLI_UNLOCK_COST,
                'user_credits' => $user->credits,
                'purchase_url' => 'https://scoriet.dev/credits',
            ], 402); // Payment Required
        }

        // Unlock CLI
        $subscription = Subscription::unlockCliWithCredits($user->id);

        if (!$subscription) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to unlock CLI access',
            ], 500);
        }

        // Refresh user
        $user->refresh();

        return response()->json([
            'success' => true,
            'message' => 'CLI access unlocked successfully for 1 year',
            'credits_spent' => Subscription::CLI_UNLOCK_COST,
            'credits_remaining' => $user->credits,
            'expires_at' => $subscription->expires_at->toIso8601String(),
            ...$user->getCliAccessStatus(),
        ], 200);
    }

    /**
     * Purchase Service access with credits
     *
     * POST /cli/auth/unlock-service
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function unlockService(Request $request)
    {
        $user = $request->user();

        // Check if already has access
        if ($user->hasServiceAccess()) {
            return response()->json([
                'success' => true,
                'message' => 'You already have Service access',
                'already_unlocked' => true,
                ...$user->getCliAccessStatus(),
            ], 200);
        }

        // Check credits
        if ($user->credits < Subscription::SERVICE_UNLOCK_COST) {
            return response()->json([
                'success' => false,
                'message' => 'Not enough credits',
                'required_credits' => Subscription::SERVICE_UNLOCK_COST,
                'user_credits' => $user->credits,
                'purchase_url' => 'https://scoriet.dev/credits',
            ], 402);
        }

        // Unlock Service
        $subscription = Subscription::unlockServiceWithCredits($user->id);

        if (!$subscription) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to unlock Service access',
            ], 500);
        }

        // Refresh user
        $user->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Windows Service access unlocked successfully for 1 year',
            'credits_spent' => Subscription::SERVICE_UNLOCK_COST,
            'credits_remaining' => $user->credits,
            'expires_at' => $subscription->expires_at->toIso8601String(),
            ...$user->getCliAccessStatus(),
        ], 200);
    }

    /**
     * Purchase Bundle (CLI + Service) access with credits
     *
     * POST /cli/auth/unlock-bundle
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function unlockBundle(Request $request)
    {
        $user = $request->user();

        // Check if already has full access
        if ($user->hasCliAccess() && $user->hasServiceAccess()) {
            return response()->json([
                'success' => true,
                'message' => 'You already have CLI and Service access',
                'already_unlocked' => true,
                ...$user->getCliAccessStatus(),
            ], 200);
        }

        // Check credits
        if ($user->credits < Subscription::BUNDLE_UNLOCK_COST) {
            return response()->json([
                'success' => false,
                'message' => 'Not enough credits',
                'required_credits' => Subscription::BUNDLE_UNLOCK_COST,
                'user_credits' => $user->credits,
                'purchase_url' => 'https://scoriet.dev/credits',
            ], 402);
        }

        // Unlock Bundle
        $subscription = Subscription::unlockBundleWithCredits($user->id);

        if (!$subscription) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to unlock Bundle access',
            ], 500);
        }

        // Refresh user
        $user->refresh();

        return response()->json([
            'success' => true,
            'message' => 'CLI + Service Bundle unlocked successfully for 1 year',
            'credits_spent' => Subscription::BUNDLE_UNLOCK_COST,
            'credits_remaining' => $user->credits,
            'expires_at' => $subscription->expires_at->toIso8601String(),
            ...$user->getCliAccessStatus(),
        ], 200);
    }
}
