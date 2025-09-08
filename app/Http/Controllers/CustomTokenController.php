<?php

namespace App\Http\Controllers;

use Laravel\Passport\Http\Controllers\AccessTokenController;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\ResponseInterface;
use Symfony\Component\HttpFoundation\Response;
use App\Models\User;
use Illuminate\Http\Request;
use GuzzleHttp\Psr7\ServerRequest;

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
            
            \Log::info('OAuth Request Data', ['data' => $requestData]);
            
            if (isset($requestData['grant_type']) && $requestData['grant_type'] === 'password') {
                if (isset($requestData['username'])) {
                    // Support both email and username login
                    $loginField = $requestData['username'];
                    
                    \Log::info('Login attempt with field: ' . $loginField);
                    
                    // Check if input contains @ symbol to determine if it's email or username
                    if (str_contains($loginField, '@')) {
                        // Login with email - use as is
                        $user = User::where('email', $loginField)->first();
                        \Log::info('Email login attempt', ['email' => $loginField, 'user_found' => $user ? 'yes' : 'no']);
                    } else {
                        // Login with username - convert to email for Passport
                        $user = User::where('username', $loginField)->first();
                        \Log::info('Username login attempt', ['username' => $loginField, 'user_found' => $user ? 'yes' : 'no']);
                        
                        if ($user) {
                            // Replace username with email in request for Passport
                            $requestData['username'] = $user->email;
                            
                            \Log::info('Converting username to email', ['original' => $loginField, 'converted_to' => $user->email]);
                        } else {
                            // User not found with username
                            \Log::warning('User not found with username: ' . $loginField);
                            return response()->json([
                                'error' => 'invalid_credentials',
                                'message' => 'The provided credentials are incorrect.'
                            ], 401);
                        }
                    }
                    
                    if ($user && !$user->hasVerifiedEmail()) {
                        \Log::info('User email not verified', ['user_id' => $user->id]);
                        return response()->json([
                            'message' => 'E-Mail-Adresse muss vor dem Login bestätigt werden',
                            'email_verification_required' => true
                        ], 403);
                    }
                    
                }
            }
            
            // Convert request data to form format for Passport compatibility
            $formData = http_build_query($requestData);
            
            // Create a new PSR request with form data format
            $newRequest = new ServerRequest(
                $psrRequest->getMethod(),
                $psrRequest->getUri(),
                ['Content-Type' => 'application/x-www-form-urlencoded'] + $psrRequest->getHeaders(),
                $formData
            );
            
            \Log::info('Proceeding to parent issueToken with form data');
            
            // Continue with normal token issuance
            return parent::issueToken($newRequest, $psrResponse);
            
        } catch (\Exception $e) {
            \Log::error('OAuth token error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'error' => 'server_error',
                'message' => 'An error occurred while processing your request.',
                'debug' => $e->getMessage()
            ], 500);
        }
    }
}