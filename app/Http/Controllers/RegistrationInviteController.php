<?php

namespace App\Http\Controllers;

use App\Models\RegistrationInvite;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class RegistrationInviteController extends Controller
{
    /**
     * Check if the current user is the system user (admin)
     */
    private function isSystemUser(Request $request): bool
    {
        $user = $request->user();
        return $user && $user->user_type === 'system';
    }

    /**
     * Get registration status (open or invite-only)
     */
    public function getStatus(): JsonResponse
    {
        return response()->json([
            'registration_open' => config('app.registration_open', false),
        ]);
    }

    /**
     * List all invites (admin only)
     */
    public function index(Request $request): JsonResponse
    {
        if (!$this->isSystemUser($request)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $invites = RegistrationInvite::with(['inviter:id,name,username', 'usedBy:id,name,email,username'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($invite) {
                return [
                    'id' => $invite->id,
                    'email' => $invite->email,
                    'name' => $invite->name,
                    'note' => $invite->note,
                    'token' => $invite->token,
                    'registration_url' => $invite->registration_url,
                    'status' => $invite->status,
                    'sent_at' => $invite->sent_at?->toISOString(),
                    'used_at' => $invite->used_at?->toISOString(),
                    'expires_at' => $invite->expires_at->toISOString(),
                    'created_at' => $invite->created_at->toISOString(),
                    'inviter' => $invite->inviter ? [
                        'id' => $invite->inviter->id,
                        'name' => $invite->inviter->name,
                        'username' => $invite->inviter->username,
                    ] : null,
                    'used_by' => $invite->usedBy ? [
                        'id' => $invite->usedBy->id,
                        'name' => $invite->usedBy->name,
                        'email' => $invite->usedBy->email,
                        'username' => $invite->usedBy->username,
                    ] : null,
                ];
            });

        // Get stats
        $stats = [
            'total' => RegistrationInvite::count(),
            'pending' => RegistrationInvite::pending()->count(),
            'used' => RegistrationInvite::used()->count(),
            'expired' => RegistrationInvite::expired()->whereNull('used_at')->count(),
        ];

        return response()->json([
            'invites' => $invites,
            'stats' => $stats,
            'registration_open' => config('app.registration_open', false),
        ]);
    }

    /**
     * Create a new invite (admin only)
     */
    public function store(Request $request): JsonResponse
    {
        if (!$this->isSystemUser($request)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'email' => 'required|email|max:255',
            'name' => 'nullable|string|max:255',
            'note' => 'nullable|string|max:1000',
            'send_email' => 'boolean',
            'expires_days' => 'integer|min:1|max:30',
        ]);

        // Check if email already has a valid invite
        $existingInvite = RegistrationInvite::where('email', $validated['email'])
            ->valid()
            ->first();

        if ($existingInvite) {
            return response()->json([
                'error' => 'A valid invite already exists for this email address.',
                'existing_invite' => [
                    'id' => $existingInvite->id,
                    'expires_at' => $existingInvite->expires_at->toISOString(),
                ],
            ], 422);
        }

        // Check if email is already registered
        $existingUser = User::where('email', $validated['email'])->first();
        if ($existingUser) {
            return response()->json([
                'error' => 'A user with this email is already registered.',
            ], 422);
        }

        // Create the invite
        $invite = RegistrationInvite::create([
            'email' => $validated['email'],
            'name' => $validated['name'] ?? null,
            'note' => $validated['note'] ?? null,
            'token' => RegistrationInvite::generateToken(),
            'invited_by' => $request->user()->id,
            'expires_at' => now()->addDays($validated['expires_days'] ?? 7),
        ]);

        // Send email if requested
        if ($request->input('send_email', true)) {
            try {
                $this->sendInviteEmail($invite);
                $invite->markAsSent();
            } catch (\Exception $e) {
                Log::error('Failed to send invite email', [
                    'invite_id' => $invite->id,
                    'email' => $invite->email,
                    'error' => $e->getMessage(),
                ]);
                // Don't fail the request, just note that email wasn't sent
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Invite created successfully',
            'invite' => [
                'id' => $invite->id,
                'email' => $invite->email,
                'name' => $invite->name,
                'token' => $invite->token,
                'registration_url' => $invite->registration_url,
                'status' => $invite->status,
                'sent_at' => $invite->sent_at?->toISOString(),
                'expires_at' => $invite->expires_at->toISOString(),
            ],
        ], 201);
    }

    /**
     * Resend invite email (admin only)
     */
    public function resend(Request $request, RegistrationInvite $invite): JsonResponse
    {
        if (!$this->isSystemUser($request)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($invite->isUsed()) {
            return response()->json(['error' => 'This invite has already been used.'], 422);
        }

        if ($invite->isExpired()) {
            return response()->json(['error' => 'This invite has expired. Please create a new one.'], 422);
        }

        try {
            $this->sendInviteEmail($invite);
            $invite->markAsSent();

            return response()->json([
                'success' => true,
                'message' => 'Invite email sent successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to resend invite email', [
                'invite_id' => $invite->id,
                'email' => $invite->email,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Failed to send email: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete an invite (admin only)
     */
    public function destroy(Request $request, RegistrationInvite $invite): JsonResponse
    {
        if (!$this->isSystemUser($request)) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($invite->isUsed()) {
            return response()->json(['error' => 'Cannot delete an invite that has been used.'], 422);
        }

        $invite->delete();

        return response()->json([
            'success' => true,
            'message' => 'Invite deleted successfully',
        ]);
    }

    /**
     * Validate an invite token (public endpoint)
     */
    public function validateToken(Request $request): JsonResponse
    {
        $token = $request->input('token');

        if (!$token) {
            return response()->json([
                'valid' => false,
                'error' => 'No token provided',
            ], 400);
        }

        $invite = RegistrationInvite::where('token', $token)->first();

        if (!$invite) {
            return response()->json([
                'valid' => false,
                'error' => 'Invalid invite token',
            ]);
        }

        if ($invite->isUsed()) {
            return response()->json([
                'valid' => false,
                'error' => 'This invite has already been used',
            ]);
        }

        if ($invite->isExpired()) {
            return response()->json([
                'valid' => false,
                'error' => 'This invite has expired',
            ]);
        }

        return response()->json([
            'valid' => true,
            'email' => $invite->email,
            'name' => $invite->name,
            'expires_at' => $invite->expires_at->toISOString(),
        ]);
    }

    /**
     * Send the invite email
     */
    private function sendInviteEmail(RegistrationInvite $invite): void
    {
        $appName = config('app.name', 'Scoriet');
        $registrationUrl = $invite->registration_url;
        $expiresAt = $invite->expires_at->format('F j, Y');

        Mail::send([], [], function ($message) use ($invite, $appName, $registrationUrl, $expiresAt) {
            $message->to($invite->email, $invite->name)
                ->subject("You're invited to join {$appName}!")
                ->html($this->getInviteEmailHtml($invite, $appName, $registrationUrl, $expiresAt));
        });
    }

    /**
     * Generate the invite email HTML
     */
    private function getInviteEmailHtml(RegistrationInvite $invite, string $appName, string $registrationUrl, string $expiresAt): string
    {
        $name = $invite->name ? htmlspecialchars($invite->name) : 'there';

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>You're invited to {$appName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to {$appName}!</h1>
    </div>

    <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Hi {$name},</p>

        <p style="font-size: 16px;">You've been invited to join <strong>{$appName}</strong> - the Enterprise Code Generator that automates code generation through intelligent templating.</p>

        <p style="font-size: 16px;">Click the button below to create your account:</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{$registrationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">Create Your Account</a>
        </div>

        <p style="font-size: 14px; color: #666;">Or copy this link into your browser:</p>
        <p style="font-size: 12px; background: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all;">{$registrationUrl}</p>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="font-size: 14px; color: #888; margin: 0;">
                <strong>Note:</strong> This invitation expires on <strong>{$expiresAt}</strong>.
            </p>
        </div>
    </div>

    <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
        <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        <p>&copy; 2026 {$appName}. All rights reserved.</p>
    </div>
</body>
</html>
HTML;
    }
}
