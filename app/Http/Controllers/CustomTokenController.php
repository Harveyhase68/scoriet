<?php

namespace App\Http\Controllers;

use Laravel\Passport\Http\Controllers\AccessTokenController;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\ResponseInterface;
use Symfony\Component\HttpFoundation\Response;
use App\Models\User;

class CustomTokenController extends AccessTokenController
{
    public function issueToken(ServerRequestInterface $psrRequest, ResponseInterface $psrResponse): Response
    {
        // Get the request data to check for email verification
        $requestData = $psrRequest->getParsedBody();
        
        if (isset($requestData['grant_type']) && $requestData['grant_type'] === 'password') {
            if (isset($requestData['username'])) {
                $user = User::where('email', $requestData['username'])->first();
                
                if ($user && !$user->hasVerifiedEmail()) {
                    return response()->json([
                        'message' => 'E-Mail-Adresse muss vor dem Login bestätigt werden',
                        'email_verification_required' => true
                    ], 403);
                }
                
            }
        }
        
        // Continue with normal token issuance
        return parent::issueToken($psrRequest, $psrResponse);
    }
}