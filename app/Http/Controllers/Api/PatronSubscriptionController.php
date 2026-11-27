<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Settings;
use App\Models\User;
use App\Support\PricingCatalog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class PatronSubscriptionController extends Controller
{
    private const PLAN_FEATURES = [
        'patron_annual' => [
            'Teams unlocked',
            'Private templates',
            'Uses credits for generation (5 credits/gen)',
            'Buy credits as needed',
            '5 free support tickets/month',
        ],
        'patron_monthly' => [
            'Everything unlimited',
            'No credits needed for generation',
            'Unlimited private projects',
            'Unlimited databases',
            'Teams unlocked',
            '5 free support tickets/month',
        ],
    ];

    /**
     * Get available patron subscription plans
     */
    public function index(): JsonResponse
    {
        $settings = Settings::get();

        $plans = [];
        foreach (PricingCatalog::subscriptionPlans() as $plan) {
            $prices = [];
            foreach (PricingCatalog::INTERVALS as $interval) {
                $prices[$interval] = PricingCatalog::subscriptionPrice($settings, $plan, $interval);
            }

            $plans[] = [
                'id' => $plan,
                'name' => PricingCatalog::PLAN_NAMES[$plan],
                'type' => PricingCatalog::PATRON_TYPES[$plan],
                'prices' => $prices,
                'savings' => PricingCatalog::yearlySavings($prices),
                'default_interval' => PricingCatalog::DEFAULT_INTERVAL,
                'currency' => '€',
                'features' => self::PLAN_FEATURES[$plan],
                'popular' => $plan === 'patron_annual',
            ];
        }

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
            'plan_id' => ['required', Rule::in(PricingCatalog::subscriptionPlans())],
            'interval' => ['sometimes', Rule::in(PricingCatalog::INTERVALS)],
            'payment_method' => ['required', Rule::in(['stripe', 'paypal', 'demo'])],
        ]);

        $settings = Settings::get();
        $planKey = $validated['plan_id'];
        $interval = $validated['interval'] ?? PricingCatalog::DEFAULT_INTERVAL;
        $patronType = PricingCatalog::PATRON_TYPES[$planKey];
        $price = PricingCatalog::subscriptionPrice($settings, $planKey, $interval);

        // TODO: Integrate real payment subscription here (Stripe/PayPal recurring)
        if ($validated['payment_method'] === 'demo') {
            // DEMO MODE: Activate patron subscription
            $user->user_type = 'patron';
            $user->patron_type = $patronType;
            $user->billing_interval = $interval;
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'Willkommen bei ' . PricingCatalog::displayName($planKey, $interval) . '!',
                'subscription' => [
                    'type' => $patronType,
                    'interval' => $interval,
                    'price' => $price,
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
        $user->billing_interval = null;
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
            $planKey = array_search($user->patron_type, PricingCatalog::PATRON_TYPES, true) ?: 'patron_monthly';
            $interval = $user->billing_interval ?? PricingCatalog::DEFAULT_INTERVAL;
            $status['subscription'] = [
                'type' => $user->patron_type,
                'price' => PricingCatalog::subscriptionPrice($settings, $planKey, $interval),
                'billing_period' => $interval,
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
