<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Settings;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class PatronSubscriptionController extends Controller
{
    /**
     * Get available patron subscription plans
     */
    public function index(): JsonResponse
    {
        $settings = Settings::get();

        $plans = [
            [
                'id' => 'patron_annual',
                'name' => 'Patron Annual',
                'type' => 'annual',
                'price' => (float) $settings->price_patron_annual,
                'billing_period' => 'year',
                'currency' => '€',
                'features' => [
                    'Teams unlocked',
                    'Private templates',
                    'Uses credits for generation (5 credits/gen)',
                    'Buy credits as needed',
                    '5 free support tickets/month'
                ],
                'popular' => true,
            ],
            [
                'id' => 'patron_monthly',
                'name' => 'Patron Monthly',
                'type' => 'monthly',
                'price' => (float) $settings->price_patron_monthly,
                'billing_period' => 'month',
                'currency' => '€',
                'features' => [
                    'Everything unlimited',
                    'No credits needed for generation',
                    'Unlimited private projects',
                    'Unlimited databases',
                    'Teams unlocked',
                    '5 free support tickets/month'
                ],
                'popular' => false,
            ],
        ];

        return response()->json([
            'success' => true,
            'plans' => $plans
        ]);
    }

    /**
     * Subscribe to patron plan
     * NOTE: This is a placeholder - integrate with Stripe/PayPal subscriptions in production
     */
    public function subscribe(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'plan_id' => ['required', Rule::in(['patron_annual', 'patron_monthly'])],
            'payment_method' => ['required', Rule::in(['stripe', 'paypal', 'demo'])],
        ]);

        $settings = Settings::get();

        // Get plan details
        $planMap = [
            'patron_annual' => ['type' => 'annual', 'price' => $settings->price_patron_annual],
            'patron_monthly' => ['type' => 'monthly', 'price' => $settings->price_patron_monthly],
        ];

        $plan = $planMap[$validated['plan_id']];

        // TODO: Integrate real payment subscription here (Stripe/PayPal recurring)
        if ($validated['payment_method'] === 'demo') {
            // DEMO MODE: Activate patron subscription
            $user->user_type = 'patron';
            $user->patron_type = $plan['type'];
            $user->save();

            return response()->json([
                'success' => true,
                'message' => "Willkommen als Patron {$plan['type']}!",
                'subscription' => [
                    'type' => $plan['type'],
                    'price' => $plan['price'],
                    'status' => 'active'
                ],
                'note' => 'DEMO MODE: Keine echte Zahlung erforderlich'
            ]);
        }

        // Real subscription integration goes here
        return response()->json([
            'success' => false,
            'message' => 'Subscription gateway integration coming soon!',
            'payment_method' => $validated['payment_method']
        ], 501);
    }

    /**
     * Cancel patron subscription
     */
    public function cancel(): JsonResponse
    {
        $user = Auth::user();

        if ($user->user_type !== 'patron') {
            return response()->json([
                'success' => false,
                'message' => 'Du hast keine aktive Patron-Subscription'
            ], 400);
        }

        // TODO: Cancel subscription in payment gateway (Stripe/PayPal)

        // Downgrade to free
        $user->user_type = 'free';
        $user->patron_type = null;
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Patron-Subscription erfolgreich gekündigt',
            'new_user_type' => 'free'
        ]);
    }

    /**
     * Get current subscription status
     */
    public function status(): JsonResponse
    {
        $user = Auth::user();

        $status = [
            'is_patron' => $user->isPatron(),
            'user_type' => $user->user_type,
            'patron_type' => $user->patron_type,
        ];

        if ($user->isPatron()) {
            $settings = Settings::get();
            $status['subscription'] = [
                'type' => $user->patron_type,
                'price' => $user->patron_type === 'annual'
                    ? (float) $settings->price_patron_annual
                    : (float) $settings->price_patron_monthly,
                'billing_period' => $user->patron_type === 'annual' ? 'year' : 'month',
            ];

            // Calculate free tickets remaining this month
            $currentMonth = now()->startOfMonth();
            $usedFreeTickets = \App\Models\Ticket::where('user_id', $user->id)
                ->where('type', '!=', 'bug_report')
                ->where('credits_cost', 0)
                ->where('created_at', '>=', $currentMonth)
                ->count();

            $status['subscription']['free_tickets_remaining'] = max(0, 5 - $usedFreeTickets);
        }

        return response()->json([
            'success' => true,
            'status' => $status
        ]);
    }
}
