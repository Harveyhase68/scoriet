<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;
use Illuminate\Auth\Events\Registered;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use App\Notifications\NewUserRegistered;
use Illuminate\Support\Facades\Notification;
use App\Services\RegistrationValidationService;

class AuthController extends Controller
{
    protected RegistrationValidationService $registrationValidator;

    public function __construct(RegistrationValidationService $registrationValidator)
    {
        $this->registrationValidator = $registrationValidator;
    }

    /**
     * Benutzer registrieren
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:30|unique:users|regex:/^[a-z0-9_-]+$/',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'language' => 'nullable|string|in:en,de,fr',
            'invitation_token' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            $errors = $validator->errors();

            // Create user-friendly error messages
            $friendlyMessage = '';

            if ($errors->has('email')) {
                if (str_contains($errors->first('email'), 'has already been taken')) {
                    $friendlyMessage = 'Diese E-Mail-Adresse ist bereits registriert. Möchten Sie sich einloggen?';
                } else {
                    $friendlyMessage = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
                }
            } elseif ($errors->has('username')) {
                if (str_contains($errors->first('username'), 'has already been taken')) {
                    $friendlyMessage = 'Dieser Benutzername ist bereits vergeben. Bitte wählen Sie einen anderen.';
                } else {
                    $friendlyMessage = 'Der Benutzername darf nur Kleinbuchstaben, Zahlen, _ und - enthalten.';
                }
            } elseif ($errors->has('password')) {
                if (str_contains($errors->first('password'), 'confirmation')) {
                    $friendlyMessage = 'Die Passwörter stimmen nicht überein.';
                } else {
                    $friendlyMessage = 'Das Passwort muss mindestens 8 Zeichen lang sein.';
                }
            } elseif ($errors->has('name')) {
                $friendlyMessage = 'Bitte geben Sie Ihren Namen ein.';
            } else {
                $friendlyMessage = 'Bitte überprüfen Sie Ihre Eingaben.';
            }

            return response()->json([
                'message' => $friendlyMessage,
                'errors' => $errors,
                'field_errors' => $errors->toArray()
            ], 422);
        }

        // Honeypot check - if math_check field is filled, it's a bot
        // Silently pretend success but don't actually register
        if ($request->filled('math_check')) {
            \Log::warning('Bot registration blocked by honeypot', [
                'email' => $request->email,
                'ip' => $request->ip(),
                'honeypot_value' => $request->math_check,
            ]);

            // Return fake success response
            return response()->json([
                'message' => 'Benutzer erfolgreich registriert. Bitte überprüfen Sie Ihre E-Mail für den Bestätigungslink.',
                'user' => [
                    'id' => 0,
                    'name' => $request->name,
                    'email' => $request->email,
                ],
                'email_verification_required' => true,
                'has_pending_invitation' => false,
            ], 201);
        }

        // Security validation: check for Tor, disposable emails, scoriet in email, MX records
        $securityValidation = $this->registrationValidator->validate($request);
        if (!$securityValidation['valid']) {
            $securityErrors = $securityValidation['errors'];
            $friendlyMessage = reset($securityErrors); // Get first error message

            \Log::warning('Registration blocked by security validation', [
                'email' => $request->email,
                'ip' => $request->ip(),
                'errors' => $securityErrors,
            ]);

            return response()->json([
                'message' => $friendlyMessage,
                'errors' => $securityErrors,
                'field_errors' => $securityErrors,
                'security_blocked' => true,
            ], 422);
        }

        // ============================================================================
        // Invite-Only Registration Check
        // ============================================================================
        $registrationOpen = config('app.registration_open', false);
        $registrationInvite = null;

        // Check for invite token in request
        $inviteToken = $request->input('invite_token');
        if ($inviteToken) {
            $registrationInvite = \App\Models\RegistrationInvite::where('token', $inviteToken)
                ->whereNull('used_at')
                ->where('expires_at', '>', now())
                ->first();

            // If token provided but invalid
            if (!$registrationInvite) {
                return response()->json([
                    'message' => 'Invalid or expired invitation token.',
                    'registration_closed' => !$registrationOpen,
                ], 403);
            }

            // If token is for different email, reject
            if ($registrationInvite->email !== $request->email) {
                return response()->json([
                    'message' => 'This invitation is for a different email address.',
                    'expected_email' => $registrationInvite->email,
                    'registration_closed' => !$registrationOpen,
                ], 403);
            }
        }

        // If registration is closed and no valid invite, reject
        if (!$registrationOpen && !$registrationInvite) {
            return response()->json([
                'message' => 'Registration is currently by invitation only. Please request an invite or contact support.',
                'registration_closed' => true,
            ], 403);
        }

        // Check if there's a pending invitation for this email
        $pendingInvitationId = null;
        $invitation = null;

        // First check if invitation_token was provided
        if ($request->has('invitation_token')) {
            $invitation = \App\Models\ProjectInvitation::where('token', $request->invitation_token)
                ->where('invited_email', $request->email)
                ->where('status', 'pending')
                ->whereDate('expires_at', '>=', now())
                ->first();

        }

        // If not found via token, try to find by email
        if (!$invitation) {
            $invitation = \App\Models\ProjectInvitation::where('invited_email', $request->email)
                ->where('status', 'pending')
                ->whereDate('expires_at', '>=', now())
                ->first();
        }

        if ($invitation) {
            $pendingInvitationId = $invitation->id;
        }

        $user = User::create([
            'name' => $request->name,
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'language' => $request->language ?? 'en',
            'pending_project_invitation_id' => $pendingInvitationId,
            'last_monthly_credits_at' => now(), // Set to now so user doesn't get double credits on first login
        ]);

        // Mark registration invite as used (if any)
        if ($registrationInvite) {
            $registrationInvite->markAsUsed($user->id);
        }

        // Trigger the email verification
        event(new Registered($user));

        // Send admin notification
        try {
            Notification::route('mail', 'office@predl.cc')
                ->notify(new NewUserRegistered($user));
        } catch (\Exception $e) {
            // Log error but don't fail registration
            \Log::error('Failed to send admin notification: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Benutzer erfolgreich registriert. Bitte überprüfen Sie Ihre E-Mail für den Bestätigungslink.',
            'user' => $user,
            'email_verification_required' => true,
            'has_pending_invitation' => $user->hasPendingInvitation()
        ], 201);
    }

    /**
     * Benutzer einloggen
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string',
            'device_id' => 'nullable|string', // For 2FA trusted device check
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => __('authcontrollerphp199'),
                'errors' => $validator->errors()
            ], 422);
        }

        $credentials = $request->only('email', 'password');

        if (!Auth::attempt($credentials)) {
            return response()->json([
                'message' => __('authcontrollerphp208')
            ], 401);
        }

        $user = Auth::user();

        // Check if email is verified
        if (!$user->hasVerifiedEmail()) {
            return response()->json([
                'message' => __('authcontrollerphp217'),
                'email_verification_required' => true
            ], 403);
        }

        // Check if 2FA is enabled
        if ($user->hasTwoFactorEnabled()) {
            $deviceId = $request->input('device_id');
            $deviceTrusted = $deviceId && $user->isDeviceTrusted($deviceId);
            $needsReverification = $user->needsTwoFactorReVerification();

            // If device is not trusted or needs re-verification, require 2FA
            if (!$deviceTrusted || $needsReverification) {
                // Create a temporary login token that's only valid for 2FA verification
                // This token is stored in session/cache, not as a real access token
                $twoFactorToken = bin2hex(random_bytes(32));
                \Cache::put('2fa_pending_' . $twoFactorToken, [
                    'user_id' => $user->id,
                    'device_id' => $deviceId,
                    'created_at' => now()->toISOString(),
                ], now()->addMinutes(10)); // Token valid for 10 minutes

                return response()->json([
                    'message' => __('authcontrollerphp240'),
                    'two_factor_required' => true,
                    'two_factor_token' => $twoFactorToken,
                    'needs_reverification' => $needsReverification,
                ], 200);
            }

            // Device is trusted and doesn't need re-verification - continue with login
        }

        // Complete login (no 2FA or device trusted)
        return $this->completeLogin($user, $request);
    }

    /**
     * Complete login after 2FA verification
     */
    public function loginWith2FA(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'two_factor_token' => 'required|string',
            'code' => 'required|string',
            'trust_device' => 'nullable|boolean',
            'device_id' => 'nullable|string',
            'browser' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => __('authcontrollerphp269'),
                'errors' => $validator->errors()
            ], 422);
        }

        // Retrieve pending 2FA data
        $pendingData = \Cache::get('2fa_pending_' . $request->two_factor_token);

        if (!$pendingData) {
            return response()->json([
                'message' => __('authcontrollerphp279'),
            ], 401);
        }

        $user = User::find($pendingData['user_id']);

        if (!$user) {
            return response()->json([
                'message' => __('authcontrollerphp287'),
            ], 401);
        }

        // Verify the 2FA code
        $code = $request->code;
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
            return response()->json([
                'message' => __('authcontrollerphp309'),
            ], 422);
        }

        // Delete the pending token
        \Cache::forget('2fa_pending_' . $request->two_factor_token);

        // Trust device if requested
        if ($request->boolean('trust_device') && $request->device_id) {
            $user->trustDevice(
                $request->device_id,
                $request->browser ?? 'Unknown Browser',
                $request->ip()
            );
        }

        // Complete login with remember_me from pending data
        $rememberMe = $pendingData['remember_me'] ?? false;
        return $this->completeLogin($user, $request, $isRecoveryCode, $rememberMe);
    }

    /**
     * Complete the login process and return token
     */
    private function completeLogin(User $user, Request $request, bool $recoveryCodeUsed = false, bool $rememberMe = false)
    {
        // Check if user should have a pending invitation and doesn't already have one
        if (!$user->hasPendingInvitation()) {
            $invitation = \App\Models\ProjectInvitation::where('invited_email', $user->email)
                ->where('status', 'pending')
                ->whereDate('expires_at', '>=', now())
                ->first();

            if ($invitation) {
                $user->update(['pending_project_invitation_id' => $invitation->id]);
            }
        }

        // Record login and reset inactivity warnings
        $user->recordLogin();
        // Also try to claim monthly credits (if eligible)
        $creditsAwarded = $user->claimMonthlyCredits();

        // SINGLE SESSION ENFORCEMENT: Revoke all existing tokens before creating new one
        // This prevents account sharing and ensures only one active session per user
        $existingTokenCount = $user->tokens()->where('revoked', false)->count();
        $user->tokens()->update(['revoked' => true]);

        // Create a personal access token
        $tokenResult = $user->createToken($rememberMe ? 'RememberMe Token' : 'Personal Access Token');
        $tokenModel = $tokenResult->token;

        // Set extended expiry for remember_me (30 days)
        if ($rememberMe) {
            $tokenModel->expires_at = now()->addDays(30);
            $tokenModel->save();
        }

        // Refresh user to get updated pending invitation
        $user->refresh();

        $response = [
            'message' => __('authcontrollerphp371'),
            'user' => $user,
            'access_token' => $tokenResult->accessToken,
            'refresh_token' => null, // Not implemented for custom tokens
            'token_type' => 'Bearer',
            'expires_in' => $rememberMe ? (30 * 24 * 60 * 60) : (1 * 24 * 60 * 60), // 30 days or 1 day
            'has_pending_invitation' => $user->hasPendingInvitation(),
            'other_sessions_revoked' => $existingTokenCount > 0,
            'revoked_session_count' => $existingTokenCount,
            'monthly_credits_awarded' => $creditsAwarded ?? false,
        ];

        if ($recoveryCodeUsed) {
            $response['recovery_code_used'] = true;
            $response['recovery_codes_remaining'] = $user->getRecoveryCodesCount();
        }

        return response()->json($response);
    }

    /**
     * Passwort-Reset-Link senden
     */
    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => __('authcontrollerphp402'),
                'errors' => $validator->errors()
            ], 422);
        }

        $status = Password::sendResetLink(
            $request->only('email')
        );

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json([
                'message' => __('authcontrollerphp413')
            ]);
        }

        return response()->json([
            'message' => __('authcontrollerphp418')
        ], 500);
    }

    /**
     * Passwort zurücksetzen
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => __('authcontrollerphp435'),
                'errors' => $validator->errors()
            ], 422);
        }

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password)
                ]);

                $user->save();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'message' => __('authcontrollerphp453')
            ]);
        }

        return response()->json([
            'message' => __('authcontrollerphp458')
        ], 500);
    }

    /**
     * Aktuellen Benutzer abrufen
     */
    public function user(Request $request)
    {
        return response()->json($request->user());
    }

    /**
     * Profil aktualisieren
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'language' => 'nullable|string|in:en,de,fr,es,it',
            'email_system_notifications' => 'nullable|boolean',
            'email_user_notifications' => 'nullable|boolean',
            'kanban_initials' => 'nullable|string|max:3',
            'kanban_color' => 'nullable|string|max:7|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => __('authcontrollerphp489'),
                'errors' => $validator->errors()
            ], 422);
        }

        $updateData = [
            'name' => $request->name,
            'email' => $request->email,
        ];

        // Add language if provided
        if ($request->has('language')) {
            $updateData['language'] = $request->language;
        }

        // Add email notification settings if provided
        if ($request->has('email_system_notifications')) {
            $updateData['email_system_notifications'] = $request->boolean('email_system_notifications');
        }
        if ($request->has('email_user_notifications')) {
            $updateData['email_user_notifications'] = $request->boolean('email_user_notifications');
        }

        // Add Kanban display settings if provided
        if ($request->has('kanban_initials')) {
            $updateData['kanban_initials'] = $request->kanban_initials ? strtoupper($request->kanban_initials) : null;
        }
        if ($request->has('kanban_color')) {
            $updateData['kanban_color'] = $request->kanban_color;
        }

        $user->update($updateData);

        return response()->json([
            'message' => __('authcontrollerphp523'),
            'user' => $user->fresh() // Reload user data to get updated language
        ]);
    }

    /**
     * Passwort ändern
     */
    public function updatePassword(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => __('authcontrollerphp542'),
                'errors' => $validator->errors()
            ], 422);
        }

        // Check current password
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => __('authcontrollerphp550')
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json([
            'message' => __('authcontrollerphp559')
        ]);
    }

    /**
     * Seller profile update
     */
    public function updateSellerProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'is_seller' => 'required|boolean',
            'company_name' => 'nullable|string|max:255',
            'company_address' => 'nullable|string|max:1000',
            'company_country' => 'nullable|string|size:2',
            'vat_id' => 'nullable|string|max:50',
            'business_registration' => 'nullable|string|max:255',
            'tax_id' => 'nullable|string|max:50',
            'payout_method' => 'nullable|in:bank_transfer,paypal',
            'paypal_payout_email' => 'nullable|email|max:255',
            'bank_iban' => 'nullable|string|max:34',
            'bank_bic' => 'nullable|string|max:11',
            'bank_account_holder' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => __('authcontrollerphp587'),
                'errors' => $validator->errors()
            ], 422);
        }

        // Basic validation when seller mode is enabled
        if ($request->is_seller) {
            $errors = [];

            if (empty($request->company_name)) {
                $errors['company_name'] = [__('authcontrollerphp597')];
            }
            if (empty($request->company_country)) {
                $errors['company_country'] = [__('authcontrollerphp600')];
            }
            if (empty($request->payout_method)) {
                $errors['payout_method'] = [__('authcontrollerphp603')];
            }
            if ($request->payout_method === 'paypal' && empty($request->paypal_payout_email)) {
                $errors['paypal_payout_email'] = [__('authcontrollerphp606')];
            }
            if ($request->payout_method === 'bank_transfer') {
                if (empty($request->bank_iban)) {
                    $errors['bank_iban'] = [__('authcontrollerphp610')];
                }
                if (empty($request->bank_account_holder)) {
                    $errors['bank_account_holder'] = [__('authcontrollerphp613')];
                }
            }

            if (!empty($errors)) {
                return response()->json([
                    'message' => __('authcontrollerphp619'),
                    'errors' => $errors
                ], 422);
            }
        }

        // Update seller data
        $user->update([
            'is_seller' => $request->is_seller,
            'company_name' => $request->company_name,
            'company_address' => $request->company_address,
            'company_country' => $request->company_country,
            'vat_id' => $request->vat_id,
            'business_registration' => $request->business_registration,
            'tax_id' => $request->tax_id,
            'payout_method' => $request->payout_method,
            'paypal_payout_email' => $request->paypal_payout_email,
            'bank_iban' => $request->bank_iban,
            'bank_bic' => $request->bank_bic,
            'bank_account_holder' => $request->bank_account_holder,
        ]);

        // Auto-determine and update seller type
        if ($request->is_seller) {
            $user->updateSellerType();
        }

        return response()->json([
            'message' => __('authcontrollerphp647'),
            'user' => $user->fresh()
        ]);
    }

    /**
     * E-Mail-Adresse bestätigen
     */
    public function verifyEmail(Request $request)
    {
        try {
            $user = User::findOrFail($request->route('id'));
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => __('authcontrollerphp661'),
                'invalid_link' => true
            ], 404);
        }

        // Check if the hash matches
        if (!hash_equals((string) $request->route('hash'), sha1($user->getEmailForVerification()))) {
            return response()->json([
                'message' => __('authcontrollerphp669'),
                'invalid_link' => true
            ], 400);
        }

        if ($user->hasVerifiedEmail()) {
            // User already verified - still auto-login them
            $tokenResult = $user->createToken('Personal Access Token');
            $token = $tokenResult->accessToken;

            return response()->json([
                'message' => __('authcontrollerphp680'),
                'already_verified' => true,
                'user' => $user,
                'access_token' => $token,
                'token_type' => 'Bearer',
                'has_pending_invitation' => $user->hasPendingInvitation()
            ]);
        }

        if ($user->markEmailAsVerified()) {
            // Auto-login after successful verification
            $tokenResult = $user->createToken('Personal Access Token');
            $token = $tokenResult->accessToken;

            // Refresh user to get any updated data
            $user->refresh();

            // Auto-accept pending project invitation after email verification
            $invitationAccepted = false;
            $projectName = null;
            if ($user->hasPendingInvitation()) {
                $invitation = $user->pendingProjectInvitation;
                if ($invitation && $invitation->isPending()) {
                    $success = $invitation->accept();
                    if ($success) {
                        $invitationAccepted = true;
                        $projectName = $invitation->project->name;
                        $user->clearPendingInvitation();
                    }
                }
            }

            return response()->json([
                'message' => __('authcontrollerphp720'),
                'user' => $user,
                'access_token' => $token,
                'token_type' => 'Bearer',
                'has_pending_invitation' => false,
                'invitation_auto_accepted' => $invitationAccepted,
                'project_name' => $projectName,
            ]);
        }

        return response()->json([
            'message' => __('authcontrollerphp731')
        ], 500);
    }

    /**
     * Bestätigungs-E-Mail erneut senden
     */
    public function resendVerificationEmail(Request $request)
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => __('authcontrollerphp744')
            ], 400);
        }

        $user->sendEmailVerificationNotification();

        return response()->json([
            'message' => __('authcontrollerphp751')
        ]);
    }

    /**
     * Benutzer-Account löschen
     */
    public function deleteAccount(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => __('authcontrollerphp768'),
                'errors' => $validator->errors()
            ], 422);
        }

        // Check current password
        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => __('authcontrollerphp776')
            ], 422);
        }

        try {
            // Revoke all tokens before deletion
            $user->tokens->each(function ($token) {
                $token->revoke();
            });

            // Delete user account
            $user->delete();

            return response()->json([
                'message' => __('authcontrollerphp790')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => __('authcontrollerphp794')
            ], 500);
        }
    }

    /**
     * Logout - Token widerrufen (falls Passport verwendet wird)
     */
    public function logout(Request $request)
    {
        $token = $request->user()->token();
        $token->revoke();

        return response()->json([
            'message' => __('authcontrollerphp808')
        ]);
    }

    /**
     * Update user's preferred language
     */
    public function updateLanguage(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'language' => 'required|string|in:en,de,fr,es,it'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => __('authcontrollerphp823'),
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = Auth::user();
            $user->language = $request->language;
            $user->save();

            return response()->json([
                'message' => __('authcontrollerphp834'),
                'language' => $user->language
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => __('authcontrollerphp839')
            ], 500);
        }
    }

    /**
     * Update user's preferred theme
     */
    public function updateTheme(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'theme' => 'required|string|in:dark,light,green,auto'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => __('authcontrollerphp855'),
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = Auth::user();
            $user->theme = $request->theme;
            $user->save();

            return response()->json([
                'message' => __('authcontrollerphp866'),
                'theme' => $user->theme
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => __('authcontrollerphp871')
            ], 500);
        }
    }
}