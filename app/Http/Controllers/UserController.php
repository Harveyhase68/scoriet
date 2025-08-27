<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    /**
     * Aktualisiert den 'last_login_at' Zeitstempel für den eingeloggten Benutzer.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function userUpdate(Request $request)
    {
        // Get the currently authenticated user.
        // `auth()->user()` is the simplest method to obtain the User object.
        $user = auth()->user();

        // If no user is logged in (which shouldn't happen with your route,
        // since it has 'auth:api' middleware), we return an error message.
        if (! $user) {
            return response()->json(['message' => 'Benutzer nicht authentifiziert.'], 401);
        }

        // Set the 'last_login_at' timestamp to the current time.
        // `Carbon::now()` gives you a DateTime object with the current time.
        $user->last_login_at = Carbon::now();

        // Save the changes to the database.
        $user->save();

        // Return a success message as JSON.
        return response()->json(['message' => 'Login-Zeitstempel erfolgreich aktualisiert.']);
    }
}
