<?php

namespace App\Http\Controllers;

use Laravel\Passport\Http\Controllers\AccessTokenController;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\ResponseInterface;
use Symfony\Component\HttpFoundation\Response;
use App\Models\User;
use Illuminate\Http\Request;
use GuzzleHttp\Psr7\ServerRequest;
use Laravel\Passport\Passport;
use Illuminate\Support\Facades\Hash;

class CustomTokenController extends AccessTokenController
{
    public function issueToken(ServerRequestInterface $psrRequest, ResponseInterface $psrResponse): Response
    {
        try {
            // Get the request data - handle both JSON and form data
            $requestData = $psrRequest->getParsedBody();
            
            // If parsed body is null (JSON request), get from request body
            if (!$requestData) {
                $body = (string) $psrRequest->getBody();
                if (!empty($body)) {
                    $requestData = json_decode($body, true) ?: [];
                }
            }
            
            if (isset($requestData['grant_type']) && $requestData['grant_type'] === 'password') {
                if (isset($requestData['username'])) {
                    // Support both email and username login
                    $loginField = $requestData['username'];
                    
                    // Check if input contains @ symbol to determine if it's email or username
                    if (str_contains($loginField, '@')) {
                        // Login with email - use as is
                        $user = User::where('email', $loginField)->first();
                    } else {
                        // Login with username - convert to email for Passport
                        $user = User::where('username', $loginField)->first();
                        
                        if ($user) {
                            // Replace username with email in request for Passport
                            $requestData['username'] = $user->email;
                        } else {
                            // User not found with username
                            return response()->json([
                                'error' => 'invalid_credentials',
                                'message' => __('customtokencontrollerphp51')
                            ], 401);
                        }
                    }
                    
                    if ($user && !$user->hasVerifiedEmail()) {
                        return response()->json([
                            'message' => 'E-Mail-Adresse muss vor dem Login bestätigt werden',
                            'email_verification_required' => true
                        ], 403);
                    }

                    // Check if user account is deactivated due to inactivity
                    // If so, reactivate it on login (user is proving they're active)
                    if ($user && $user->isDeactivated()) {
                        $user->reactivate();
                    }

                    // Check password before 2FA check
                    if ($user && !Hash::check($requestData['password'] ?? '', $user->password)) {
                        return response()->json([
                            'error' => 'invalid_credentials',
                            'message' => 'The provided credentials are incorrect.'
                        ], 401);
                    }

                    // Check if 2FA is enabled
                    if ($user && $user->hasTwoFactorEnabled()) {
                        $deviceId = $requestData['device_id'] ?? null;
                        $deviceTrusted = $deviceId && $user->isDeviceTrusted($deviceId);
                        $needsReverification = $user->needsTwoFactorReVerification();

                        // If device is not trusted or needs re-verification, require 2FA
                        if (!$deviceTrusted || $needsReverification) {
                            // Create a temporary login token that's only valid for 2FA verification
                            $twoFactorToken = bin2hex(random_bytes(32));
                            \Cache::put('2fa_pending_' . $twoFactorToken, [
                                'user_id' => $user->id,
                                'device_id' => $deviceId,
                                'remember_me' => $requestData['remember_me'] ?? false,
                                'created_at' => now()->toISOString(),
                            ], now()->addMinutes(10)); // Token valid for 10 minutes

                            return response()->json([
                                'message' => '2FA-Verifizierung erforderlich',
                                'two_factor_required' => true,
                                'two_factor_token' => $twoFactorToken,
                                'needs_reverification' => $needsReverification,
                            ], 200);
                        }
                    }

                    // Record login and reset inactivity warnings
                    if ($user) {
                        $user->recordLogin();
                        // Also try to claim monthly credits (if eligible)
                        $user->claimMonthlyCredits();

                        // SINGLE SESSION ENFORCEMENT: Revoke all existing WEB tokens before creating new one
                        // This prevents account sharing and ensures only one active web session per user
                        // CLI/Service tokens (name starts with "Scoriet CLI") are preserved across web logins
                        // Skip in demo mode to allow multiple users sharing the same demo accounts
                        $existingTokenCount = 0;
                        if (!config('scoriet.demo')) {
                            $existingTokenCount = $user->tokens()->where('revoked', false)->count();
                            $user->tokens()
                                ->where('name', 'not like', 'Scoriet CLI%')
                                ->update(['revoked' => true]);
                        }

                        // Store the count for the response (will be used later)
                        $requestData['_revoked_sessions'] = $existingTokenCount;
                    }
                }
            }

            // Handle remember_me functionality with custom token creation
            if (isset($requestData['remember_me']) && $requestData['remember_me'] && isset($user)) {
                // Custom token creation for remember_me with 30-day expiry
                if (!Hash::check($requestData['password'], $user->password)) {
                    return response()->json([
                        'error' => 'invalid_credentials',
                        'message' => 'The provided credentials are incorrect.'
                    ], 401);
                }

                // Try to claim monthly credits (50 credits if eligible)
                $creditsAwarded = $user->claimMonthlyCredits();

                // Create custom token with extended expiry
                $tokenResult = $user->createToken('RememberMe Token');
                $token = $tokenResult->token;

                // Set 30-day expiry for remember me
                $token->expires_at = now()->addDays(30);
                $token->save();

                $revokedSessions = $requestData['_revoked_sessions'] ?? 0;

                return response()->json([
                    'access_token' => $tokenResult->accessToken,
                    'refresh_token' => null, // Not implemented for custom tokens yet
                    'token_type' => 'Bearer',
                    'expires_in' => 30 * 24 * 60 * 60, // 30 days in seconds
                    'monthly_credits_awarded' => $creditsAwarded,
                    'other_sessions_revoked' => $revokedSessions > 0,
                    'revoked_session_count' => $revokedSessions,
                ]);
            }

            // Update the parsed body with the modified request data
            $psrRequest = $psrRequest->withParsedBody($requestData);

            // Continue with normal token issuance for non-remember-me logins
            return parent::issueToken($psrRequest, $psrResponse);
            
        } catch (\League\OAuth2\Server\Exception\OAuthServerException $e) {
            \Log::error('OAuth token error: ' . $e->getMessage());
            return response()->json([
                'error' => $e->getErrorType(),
                'message' => $e->getMessage(),
            ], $e->getHttpStatusCode());
        } catch (\Exception $e) {
            \Log::error('OAuth token error: ' . $e->getMessage());
            return response()->json([
                'error' => 'server_error',
                'message' => 'An error occurred while processing your request.'
            ], 500);
        }
    }
}