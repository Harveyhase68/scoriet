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

            \Log::info('Registration with invitation token', [
                'token' => $request->invitation_token,
                'email' => $request->email,
                'invitation_found' => !!$invitation,
            ]);
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
            \Log::info('Pending invitation found for registration', [
                'invitation_id' => $invitation->id,
                'project_id' => $invitation->project_id,
            ]);
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
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validierungsfehler',
                'errors' => $validator->errors()
            ], 422);
        }

        $credentials = $request->only('email', 'password');

        if (!Auth::attempt($credentials)) {
            return response()->json([
                'message' => 'Login fehlgeschlagen'
            ], 401);
        }

        $user = Auth::user();

        // Check if email is verified
        if (!$user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'E-Mail-Adresse muss vor dem Login bestätigt werden',
                'email_verification_required' => true
            ], 403);
        }

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

        // SINGLE SESSION ENFORCEMENT: Revoke all existing tokens before creating new one
        // This prevents account sharing and ensures only one active session per user
        $existingTokenCount = $user->tokens()->where('revoked', false)->count();
        $user->tokens()->update(['revoked' => true]);

        // Create a personal access token instead of OAuth token
        $tokenResult = $user->createToken('Personal Access Token');
        $token = $tokenResult->accessToken;

        // Refresh user to get updated pending invitation
        $user->refresh();

        return response()->json([
            'message' => 'Login erfolgreich',
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
            'has_pending_invitation' => $user->hasPendingInvitation(),
            'other_sessions_revoked' => $existingTokenCount > 0,
            'revoked_session_count' => $existingTokenCount,
        ]);
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
                'message' => 'E-Mail-Adresse nicht gefunden',
                'errors' => $validator->errors()
            ], 422);
        }

        $status = Password::sendResetLink(
            $request->only('email')
        );

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json([
                'message' => 'Reset-Link wurde gesendet'
            ]);
        }

        return response()->json([
            'message' => 'Fehler beim Senden des Reset-Links'
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
                'message' => 'Validierungsfehler',
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
                'message' => 'Passwort erfolgreich zurückgesetzt'
            ]);
        }

        return response()->json([
            'message' => 'Fehler beim Zurücksetzen des Passworts'
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
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validierungsfehler',
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

        $user->update($updateData);

        return response()->json([
            'message' => 'Profil erfolgreich aktualisiert',
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
                'message' => 'Validierungsfehler',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check current password
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Das aktuelle Passwort ist nicht korrekt'
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json([
            'message' => 'Passwort erfolgreich geändert'
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
                'message' => 'Validierungsfehler',
                'errors' => $validator->errors()
            ], 422);
        }

        // Basic validation when seller mode is enabled
        if ($request->is_seller) {
            $errors = [];

            if (empty($request->company_name)) {
                $errors['company_name'] = ['Firmenname ist erforderlich'];
            }
            if (empty($request->company_country)) {
                $errors['company_country'] = ['Land ist erforderlich'];
            }
            if (empty($request->payout_method)) {
                $errors['payout_method'] = ['Auszahlungsmethode ist erforderlich'];
            }
            if ($request->payout_method === 'paypal' && empty($request->paypal_payout_email)) {
                $errors['paypal_payout_email'] = ['PayPal E-Mail ist erforderlich'];
            }
            if ($request->payout_method === 'bank_transfer') {
                if (empty($request->bank_iban)) {
                    $errors['bank_iban'] = ['IBAN ist erforderlich'];
                }
                if (empty($request->bank_account_holder)) {
                    $errors['bank_account_holder'] = ['Kontoinhaber ist erforderlich'];
                }
            }

            if (!empty($errors)) {
                return response()->json([
                    'message' => 'Bitte füllen Sie alle erforderlichen Felder aus',
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
            'message' => 'Verkäufer-Profil erfolgreich aktualisiert',
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
                'message' => 'Ungültiger Bestätigungslink. Der Benutzer existiert nicht oder wurde gelöscht.',
                'invalid_link' => true
            ], 404);
        }

        // Check if the hash matches
        if (!hash_equals((string) $request->route('hash'), sha1($user->getEmailForVerification()))) {
            return response()->json([
                'message' => 'Ungültiger Bestätigungslink. Der Link ist abgelaufen oder wurde manipuliert.',
                'invalid_link' => true
            ], 400);
        }

        if ($user->hasVerifiedEmail()) {
            // User already verified - still auto-login them
            $tokenResult = $user->createToken('Personal Access Token');
            $token = $tokenResult->accessToken;

            return response()->json([
                'message' => 'E-Mail-Adresse bereits bestätigt',
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
                    \Log::info('Auto-accepting invitation after email verification', [
                        'user_id' => $user->id,
                        'invitation_id' => $invitation->id,
                        'project_id' => $invitation->project_id,
                    ]);

                    $success = $invitation->accept();
                    if ($success) {
                        $invitationAccepted = true;
                        $projectName = $invitation->project->name;
                        $user->clearPendingInvitation();
                        \Log::info('Invitation auto-accepted successfully', ['project' => $projectName]);
                    }
                }
            }

            return response()->json([
                'message' => 'Email address successfully confirmed',
                'user' => $user,
                'access_token' => $token,
                'token_type' => 'Bearer',
                'has_pending_invitation' => false,
                'invitation_auto_accepted' => $invitationAccepted,
                'project_name' => $projectName,
            ]);
        }

        return response()->json([
            'message' => 'Email confirmation error'
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
                'message' => 'E-Mail-Adresse bereits bestätigt'
            ], 400);
        }

        $user->sendEmailVerificationNotification();

        return response()->json([
            'message' => 'Bestätigungs-E-Mail wurde erneut gesendet'
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
                'message' => 'Validierungsfehler',
                'errors' => $validator->errors()
            ], 422);
        }

        // Check current password
        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Das eingegebene Passwort ist nicht korrekt'
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
                'message' => 'Ihr Account wurde erfolgreich gelöscht'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Fehler beim Löschen des Accounts'
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
            'message' => 'Erfolgreich abgemeldet'
        ]);
    }

    /**
     * Update user's preferred language
     */
    public function updateLanguage(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'language' => 'required|string|in:en,de,fr'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Invalid language selection',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = Auth::user();
            $user->language = $request->language;
            $user->save();

            return response()->json([
                'message' => 'Language preference updated successfully',
                'language' => $user->language
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update language preference'
            ], 500);
        }
    }
}