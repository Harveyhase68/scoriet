<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use PragmaRX\Google2FA\Google2FA;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;

class TwoFactorController extends Controller
{
    protected Google2FA $google2fa;

    public function __construct()
    {
        $this->google2fa = new Google2FA();
    }

    /**
     * Get current 2FA status for user
     */
    public function status(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'two_factor' => $user->getTwoFactorStatus(),
        ]);
    }

    /**
     * Enable 2FA - Generate secret and QR code
     */
    public function enable(Request $request)
    {
        $user = $request->user();

        // Check password first
        if (!$request->has('password') || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => __('twofactorcontrollerphp44'),
            ], 422);
        }

        // Check if already enabled
        if ($user->hasTwoFactorEnabled()) {
            return response()->json([
                'message' => __('twofactorcontrollerphp51'),
            ], 400);
        }

        // Generate secret key
        $secret = $this->google2fa->generateSecretKey();

        // Store secret (not yet confirmed)
        $user->two_factor_secret = $secret;
        $user->two_factor_enabled = false;
        $user->two_factor_confirmed_at = null;
        $user->save();

        // Generate QR Code URL
        $qrCodeUrl = $this->google2fa->getQRCodeUrl(
            config('app.name', 'Scoriet'),
            $user->email,
            $secret
        );

        // Generate QR Code as SVG
        $renderer = new ImageRenderer(
            new RendererStyle(200),
            new SvgImageBackEnd()
        );
        $writer = new Writer($renderer);
        $qrCodeSvg = $writer->writeString($qrCodeUrl);

        return response()->json([
            'message' => __('twofactorcontrollerphp80'),
            'secret' => $secret,
            'qr_code_svg' => $qrCodeSvg,
            'qr_code_url' => $qrCodeUrl,
        ]);
    }

    /**
     * Confirm 2FA setup with verification code
     */
    public function confirm(Request $request)
    {
        $request->validate([
            'code' => 'required|string|size:6',
        ]);

        $user = $request->user();

        // Check if setup is pending
        if (!$user->isTwoFactorPending()) {
            return response()->json([
                'message' => __('twofactorcontrollerphp101'),
            ], 400);
        }

        // Verify the code
        $valid = $this->google2fa->verifyKey($user->two_factor_secret, $request->code);

        if (!$valid) {
            return response()->json([
                'message' => __('twofactorcontrollerphp110'),
            ], 422);
        }

        // Enable 2FA
        $user->enableTwoFactor();

        // Generate recovery codes
        $recoveryCodes = $user->generateTwoFactorRecoveryCodes();

        return response()->json([
            'message' => __('twofactorcontrollerphp121'),
            'recovery_codes' => $recoveryCodes,
            'two_factor' => $user->getTwoFactorStatus(),
        ]);
    }

    /**
     * Verify 2FA code during login
     */
    public function verify(Request $request)
    {
        $request->validate([
            'code' => 'required|string',
            'trust_device' => 'nullable|boolean',
            'device_id' => 'nullable|string',
            'browser' => 'nullable|string',
        ]);

        $user = $request->user();

        if (!$user->hasTwoFactorEnabled()) {
            return response()->json([
                'message' => __('twofactorcontrollerphp143'),
            ], 400);
        }

        $code = $request->code;
        $isRecoveryCode = strlen($code) === 10; // Recovery codes are 10 chars

        $verified = false;

        if ($isRecoveryCode) {
            // Try recovery code
            $verified = $user->verifyRecoveryCode($code);
        } else {
            // Try TOTP code
            $verified = $this->google2fa->verifyKey($user->two_factor_secret, $code);

            if ($verified) {
                $user->updateTwoFactorVerificationTime();
            }
        }

        if (!$verified) {
            return response()->json([
                'message' => __('twofactorcontrollerphp166'),
            ], 422);
        }

        // Trust device if requested
        if ($request->boolean('trust_device') && $request->device_id) {
            $user->trustDevice(
                $request->device_id,
                $request->browser ?? __('twofactorcontrollerphp174'),
                $request->ip()
            );
        }

        return response()->json([
            'message' => __('twofactorcontrollerphp180'),
            'verified' => true,
            'recovery_code_used' => $isRecoveryCode,
            'recovery_codes_remaining' => $isRecoveryCode ? $user->getRecoveryCodesCount() : null,
        ]);
    }

    /**
     * Check if device is trusted (before showing 2FA prompt)
     */
    public function checkDevice(Request $request)
    {
        $request->validate([
            'device_id' => 'required|string',
        ]);

        $user = $request->user();

        if (!$user->hasTwoFactorEnabled()) {
            return response()->json([
                'requires_2fa' => false,
                'trusted' => false,
            ]);
        }

        $trusted = $user->isDeviceTrusted($request->device_id);
        $needsReverification = $user->needsTwoFactorReVerification();

        return response()->json([
            'requires_2fa' => true,
            'trusted' => $trusted && !$needsReverification,
            'needs_reverification' => $needsReverification,
        ]);
    }

    /**
     * Disable 2FA
     */
    public function disable(Request $request)
    {
        $request->validate([
            'password' => 'required|string',
            'code' => 'required|string',
        ]);

        $user = $request->user();

        // Check password
        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => __('twofactorcontrollerphp230'),
            ], 422);
        }

        if (!$user->hasTwoFactorEnabled()) {
            return response()->json([
                'message' => __('twofactorcontrollerphp236'),
            ], 400);
        }

        // Verify code (TOTP or recovery)
        $code = $request->code;
        $isRecoveryCode = strlen($code) === 10;

        $verified = false;

        if ($isRecoveryCode) {
            // For disabling, just check if it's a valid recovery code (don't consume it)
            $codes = $user->two_factor_recovery_codes ?? [];
            $verified = in_array(strtoupper(trim($code)), $codes, true);
        } else {
            $verified = $this->google2fa->verifyKey($user->two_factor_secret, $code);
        }

        if (!$verified) {
            return response()->json([
                'message' => __('twofactorcontrollerphp256'),
            ], 422);
        }

        // Disable 2FA
        $user->disableTwoFactor();

        return response()->json([
            'message' => __('twofactorcontrollerphp264'),
            'two_factor' => $user->getTwoFactorStatus(),
        ]);
    }

    /**
     * Regenerate recovery codes
     */
    public function regenerateRecoveryCodes(Request $request)
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        $user = $request->user();

        // Check password
        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => __('twofactorcontrollerphp283'),
            ], 422);
        }

        if (!$user->hasTwoFactorEnabled()) {
            return response()->json([
                'message' => __('twofactorcontrollerphp289'),
            ], 400);
        }

        $recoveryCodes = $user->generateTwoFactorRecoveryCodes();

        return response()->json([
            'message' => __('twofactorcontrollerphp296'),
            'recovery_codes' => $recoveryCodes,
        ]);
    }

    /**
     * Get trusted devices
     */
    public function trustedDevices(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'trusted_devices' => $user->getTrustedDevices(),
        ]);
    }

    /**
     * Remove a trusted device
     */
    public function removeTrustedDevice(Request $request, string $deviceId)
    {
        $user = $request->user();

        $user->removeTrustedDevice($deviceId);

        return response()->json([
            'message' => __('twofactorcontrollerphp323'),
            'trusted_devices' => $user->getTrustedDevices(),
        ]);
    }

    /**
     * Remove all trusted devices
     */
    public function removeAllTrustedDevices(Request $request)
    {
        $user = $request->user();

        $user->removeAllTrustedDevices();

        return response()->json([
            'message' => __('twofactorcontrollerphp338'),
        ]);
    }

    /**
     * Cancel 2FA setup (before confirmation)
     */
    public function cancelSetup(Request $request)
    {
        $user = $request->user();

        if (!$user->isTwoFactorPending()) {
            return response()->json([
                'message' => __('twofactorcontrollerphp351'),
            ], 400);
        }

        // Clear the pending setup
        $user->two_factor_secret = null;
        $user->save();

        return response()->json([
            'message' => __('twofactorcontrollerphp360'),
            'two_factor' => $user->getTwoFactorStatus(),
        ]);
    }
}
