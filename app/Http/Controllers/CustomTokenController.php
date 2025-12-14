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
                                'message' => 'The provided credentials are incorrect.'
                            ], 401);
                        }
                    }
                    
                    if ($user && !$user->hasVerifiedEmail()) {
                        return response()->json([
                            'message' => 'E-Mail-Adresse muss vor dem Login bestätigt werden',
                            'email_verification_required' => true
                        ], 403);
                    }

                    // Try to claim monthly credits for this user (if eligible)
                    if ($user) {
                        $user->claimMonthlyCredits();
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

                return response()->json([
                    'access_token' => $tokenResult->accessToken,
                    'refresh_token' => null, // Not implemented for custom tokens yet
                    'token_type' => 'Bearer',
                    'expires_in' => 30 * 24 * 60 * 60, // 30 days in seconds
                    'monthly_credits_awarded' => $creditsAwarded,
                ]);
            }

            // Update the parsed body with the modified request data
            $psrRequest = $psrRequest->withParsedBody($requestData);

            // Continue with normal token issuance for non-remember-me logins
            return parent::issueToken($psrRequest, $psrResponse);
            
        } catch (\Exception $e) {
            \Log::error('OAuth token error: ' . $e->getMessage());
            return response()->json([
                'error' => 'server_error',
                'message' => 'An error occurred while processing your request.'
            ], 500);
        }
    }
}