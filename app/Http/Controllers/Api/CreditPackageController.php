<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Settings;
use App\Models\CreditTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class CreditPackageController extends Controller
{
    /**
     * Get available credit packages
     */
    public function index(): JsonResponse
    {
        $settings = Settings::get();

        $packages = [
            [
                'id' => 'credits_500',
                'credits' => 500,
                'price' => (float) $settings->price_credits_500,
                'price_per_credit' => round((float) $settings->price_credits_500 / 500, 4),
                'currency' => '€',
                'popular' => false,
            ],
            [
                'id' => 'credits_1000',
                'credits' => 1000,
                'price' => (float) $settings->price_credits_1000,
                'price_per_credit' => round((float) $settings->price_credits_1000 / 1000, 4),
                'currency' => '€',
                'popular' => true,
            ],
            [
                'id' => 'credits_2500',
                'credits' => 2500,
                'price' => (float) $settings->price_credits_2500,
                'price_per_credit' => round((float) $settings->price_credits_2500 / 2500, 4),
                'currency' => '€',
                'popular' => false,
                'best_value' => true,
            ],
        ];

        return response()->json([
            'success' => true,
            'packages' => $packages
        ]);
    }

    /**
     * Purchase credit package
     * NOTE: This is a placeholder - integrate with Stripe/PayPal/etc. in production
     */
    public function purchase(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'package_id' => ['required', Rule::in(['credits_500', 'credits_1000', 'credits_2500'])],
            'payment_method' => ['required', Rule::in(['stripe', 'paypal', 'demo'])], // demo for testing
        ]);

        $settings = Settings::get();

        // Get package details
        $packageMap = [
            'credits_500' => ['credits' => 500, 'price' => $settings->price_credits_500],
            'credits_1000' => ['credits' => 1000, 'price' => $settings->price_credits_1000],
            'credits_2500' => ['credits' => 2500, 'price' => $settings->price_credits_2500],
        ];

        $package = $packageMap[$validated['package_id']];

        // TODO: Integrate real payment gateway here
        // For now, we'll simulate a successful payment in demo mode
        if ($validated['payment_method'] === 'demo') {
            // DEMO MODE: Simulate successful payment
            CreditTransaction::createAndUpdateCredits(
                $user->id,
                $package['credits'],
                'purchase',
                "Credit-Paket gekauft: {$package['credits']} Credits",
                null,
                null,
                (float) $package['price']
            );

            return response()->json([
                'success' => true,
                'message' => "Erfolgreich {$package['credits']} Credits gekauft!",
                'credits_purchased' => $package['credits'],
                'new_balance' => $user->fresh()->credits,
                'amount_paid' => $package['price'],
                'note' => 'DEMO MODE: Keine echte Zahlung erforderlich'
            ]);
        }

        // Real payment integration goes here
        return response()->json([
            'success' => false,
            'message' => 'Payment gateway integration coming soon!',
            'payment_method' => $validated['payment_method']
        ], 501); // 501 Not Implemented
    }

    /**
     * Get user's credit transaction history
     */
    public function history(): JsonResponse
    {
        $user = Auth::user();

        $transactions = CreditTransaction::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json([
            'success' => true,
            'transactions' => $transactions,
            'current_balance' => $user->credits
        ]);
    }
}
