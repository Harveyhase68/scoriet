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

class AuthController extends Controller
{
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
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validierungsfehler',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'username' => $request->username,
            'email' => $request->email,
            'password' => Hash::make($request->password),
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
            'email_verification_required' => true
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
        
        // Create a personal access token instead of OAuth token
        $tokenResult = $user->createToken('Personal Access Token');
        $token = $tokenResult->accessToken;

        return response()->json([
            'message' => 'Login erfolgreich',
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer'
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
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validierungsfehler',
                'errors' => $validator->errors()
            ], 422);
        }

        $user->update([
            'name' => $request->name,
            'email' => $request->email,
        ]);

        return response()->json([
            'message' => 'Profil erfolgreich aktualisiert',
            'user' => $user
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
     * E-Mail-Adresse bestätigen
     */
    public function verifyEmail(Request $request)
    {
        $user = User::findOrFail($request->route('id'));

        // Check if the hash matches
        if (!hash_equals((string) $request->route('hash'), sha1($user->getEmailForVerification()))) {
            return response()->json([
                'message' => 'Ungültiger Bestätigungslink'
            ], 400);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'E-Mail-Adresse bereits bestätigt',
                'already_verified' => true
            ]);
        }

        if ($user->markEmailAsVerified()) {
            return response()->json([
                'message' => 'E-Mail-Adresse erfolgreich bestätigt'
            ]);
        }

        return response()->json([
            'message' => 'Fehler bei der E-Mail-Bestätigung'
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
}