<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class UserController extends Controller
{
    /**
     * Aktualisiert den 'last_login_at' Zeitstempel für den eingeloggten Benutzer.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function userUpdate(Request $request)
    {
        // Hole den aktuell authentifizierten Benutzer.
        // `auth()->user()` ist die einfachste Methode, um das User-Objekt zu erhalten.
        $user = auth()->user();

        // Wenn kein Benutzer eingeloggt ist (was bei deiner Route nicht passieren sollte,
        // da sie 'auth:api' Middleware hat), geben wir eine Fehlermeldung zurück.
        if (!$user) {
            return response()->json(['message' => 'Benutzer nicht authentifiziert.'], 401);
        }

        // Setze den 'last_login_at' Zeitstempel auf die aktuelle Zeit.
        // `Carbon::now()` gibt dir ein DateTime-Objekt mit der aktuellen Zeit.
        $user->last_login_at = Carbon::now();

        // Speichere die Änderungen in der Datenbank.
        $user->save();

        // Gib eine Erfolgsmeldung als JSON zurück.
        return response()->json(['message' => 'Login-Zeitstempel erfolgreich aktualisiert.']);
    }
}
