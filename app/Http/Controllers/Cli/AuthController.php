<?php

namespace App\Http\Controllers\Cli;

use App\Http\Controllers\Controller;
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

        // Create Personal Access Token for CLI
        $clientName = $request->input('client_name', 'Scoriet CLI');
        $token = $user->createToken($clientName); // No scope restrictions

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
}
