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
                'error' => __('registrationinvitecontrollerphp111'),
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
                'error' => __('registrationinvitecontrollerphp123'),
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
                Log::error(__('registrationinvitecontrollerphp143'), [
                    'invite_id' => $invite->id,
                    'email' => $invite->email,
                    'error' => $e->getMessage(),
                ]);
                // Don't fail the request, just note that email wasn't sent
            }
        }

        return response()->json([
            'success' => true,
            'message' => __('registrationinvitecontrollerphp154'),
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
            return response()->json(['error' => __('registrationinvitecontrollerphp178')], 422);
        }

        if ($invite->isExpired()) {
            return response()->json(['error' => __('registrationinvitecontrollerphp182')], 422);
        }

        try {
            $this->sendInviteEmail($invite);
            $invite->markAsSent();

            return response()->json([
                'success' => true,
                'message' => __('registrationinvitecontrollerphp191'),
            ]);
        } catch (\Exception $e) {
            Log::error(__('registrationinvitecontrollerphp194'), [
                'invite_id' => $invite->id,
                'email' => $invite->email,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => __('registrationinvitecontrollerphp201') . $e->getMessage(),
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
            return response()->json(['error' => __('registrationinvitecontrollerphp216')], 422);
        }

        $invite->delete();

        return response()->json([
            'success' => true,
            'message' => __('registrationinvitecontrollerphp223'),
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
                'error' => __('registrationinvitecontrollerphp237'),
            ], 400);
        }

        $invite = RegistrationInvite::where('token', $token)->first();

        if (!$invite) {
            return response()->json([
                'valid' => false,
                'error' => __('registrationinvitecontrollerphp246'),
            ]);
        }

        if ($invite->isUsed()) {
            return response()->json([
                'valid' => false,
                'error' => __('registrationinvitecontrollerphp253'),
            ]);
        }

        if ($invite->isExpired()) {
            return response()->json([
                'valid' => false,
                'error' => __('registrationinvitecontrollerphp260'),
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
                ->subject(__('registrationinvitecontrollerphp283') . $appName . '!')
                ->html($this->getInviteEmailHtml($invite, $appName, $registrationUrl, $expiresAt));
        });
    }

    /**
     * Generate the invite email HTML
     */
    private function getInviteEmailHtml(RegistrationInvite $invite, string $appName, string $registrationUrl, string $expiresAt): string
    {
        $name = $invite->name ? htmlspecialchars($invite->name) : 'there';
        $inviteText1 = __('registrationinvitecontrollerphp311');
        $inviteText2 = __('registrationinvitecontrollerphp311_2');
        $clickText = __('registrationinvitecontrollerphp313');
        $createAccountBtn = __('registrationinvitecontrollerphp316');
        $copyLinkText = __('registrationinvitecontrollerphp319');
        $noteLabel = __('registrationinvitecontrollerphp324_note');
        $expiresText = __('registrationinvitecontrollerphp324');
        $ignoreText = __('registrationinvitecontrollerphp330');
        $rightsText = __('registrationinvitecontrollerphp331');
        $titleText = __('registrationinvitecontrollerphp310');
        $welcomeText = __('registrationinvitecontrollerphp314');
        $hiText = __('registrationinvitecontrollerphp318');

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{$titleText} {$appName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">{$welcomeText} {$appName}!</h1>
    </div>

    <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">{$hiText} {$name},</p>

        <p style="font-size: 16px;">{$inviteText1}<strong>{$appName}</strong>{$inviteText2}</p>

        <p style="font-size: 16px;">{$clickText}</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{$registrationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-size: 18px; font-weight: bold;">{$createAccountBtn}</a>
        </div>

        <p style="font-size: 14px; color: #666;">{$copyLinkText}</p>
        <p style="font-size: 12px; background: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all;">{$registrationUrl}</p>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <p style="font-size: 14px; color: #888; margin: 0;">
                <strong>{$noteLabel}</strong> {$expiresText} <strong>{$expiresAt}</strong>.
            </p>
        </div>
    </div>

    <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
        <p>{$ignoreText}</p>
        <p>&copy; 2026 {$appName}. {$rightsText}</p>
    </div>
</body>
</html>
HTML;
    }
}
