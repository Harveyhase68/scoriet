<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Settings;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class SettingsController extends Controller
{
    private function checkSystemAdmin()
    {
        $user = auth()->user();
        if (!$user || $user->user_type !== 'system') {
            abort(403, 'Unauthorized. System admin access required.');
        }
    }

    /**
     * Get the global settings
     */
    public function show(): JsonResponse
    {
        $this->checkSystemAdmin();

        $settings = Settings::get();
        return response()->json($settings);
    }

    /**
     * Update the global settings
     */
    public function update(Request $request): JsonResponse
    {
        $this->checkSystemAdmin();

        $validated = $request->validate([
            'global_google_translate_key' => 'nullable|string|max:500',
            'price_patron_annual' => 'required|numeric|min:0|max:9999999.99',
            'price_patron_monthly' => 'required|numeric|min:0|max:9999999.99',
            'price_credits_500' => 'required|numeric|min:0|max:9999999.99',
            'price_credits_1000' => 'required|numeric|min:0|max:9999999.99',
            'price_credits_2500' => 'required|numeric|min:0|max:9999999.99',
        ]);

        $settings = Settings::get();
        $settings->update($validated);

        return response()->json([
            'message' => 'Settings updated successfully',
            'settings' => $settings
        ]);
    }
}
