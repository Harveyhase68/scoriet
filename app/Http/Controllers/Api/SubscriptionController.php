<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Srmklive\PayPal\Services\PayPal as PayPalClient;
use Stripe\Stripe;
use Stripe\Subscription;

class SubscriptionController extends Controller
{
    /**
     * Cancel the user's current subscription
     */
    public function cancel(Request $request)
    {
        $user = $request->user();

        if ($user->user_type !== 'patron') {
            return response()->json([
                'success' => false,
                'error' => 'No active subscription to cancel',
            ], 400);
        }

        try {
            // Check if user has Stripe subscription
            if ($user->stripe_subscription_id) {
                return $this->cancelStripeSubscription($user);
            }

            // Check if user has PayPal subscription
            if ($user->paypal_subscription_id) {
                return $this->cancelPayPalSubscription($user);
            }

            // No subscription ID found - just mark as cancelled
            // This can happen if subscription was created before we stored IDs
            Log::warning("User {$user->id} has no subscription ID stored, marking as free");

            $user->update([
                'user_type' => 'free',
                'patron_type' => null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Subscription cancelled',
            ]);

        } catch (\Exception $e) {
            Log::error('Subscription cancellation error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Failed to cancel subscription: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cancel a Stripe subscription
     */
    private function cancelStripeSubscription($user)
    {
        Stripe::setApiKey(config('services.stripe.secret'));

        try {
            $subscription = Subscription::retrieve($user->stripe_subscription_id);

            // Cancel at period end (user keeps access until subscription ends)
            $subscription->cancel_at_period_end = true;
            $subscription->save();

            Log::info("Stripe subscription {$user->stripe_subscription_id} cancelled for user {$user->id}");

            // Note: We don't change user_type here - the webhook will handle that when the subscription actually ends
            // For now, we can store that cancellation was requested

            return response()->json([
                'success' => true,
                'message' => 'Subscription will be cancelled at the end of the current billing period',
                'ends_at' => date('Y-m-d', $subscription->current_period_end),
            ]);

        } catch (\Exception $e) {
            Log::error('Stripe cancellation error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Cancel a PayPal subscription
     */
    private function cancelPayPalSubscription($user)
    {
        try {
            $provider = new PayPalClient;
            $provider->setApiCredentials(config('paypal'));
            $provider->getAccessToken();

            // Cancel the subscription
            $response = $provider->cancelSubscription($user->paypal_subscription_id, 'User requested cancellation');

            Log::info("PayPal subscription {$user->paypal_subscription_id} cancelled for user {$user->id}", [
                'response' => $response,
            ]);

            // Note: Similar to Stripe, the webhook will handle the actual status change
            // PayPal subscriptions are cancelled immediately but access continues until period end

            return response()->json([
                'success' => true,
                'message' => 'Subscription cancelled. You will remain a Patron until the end of your current billing period.',
            ]);

        } catch (\Exception $e) {
            Log::error('PayPal cancellation error: ' . $e->getMessage());
            throw $e;
        }
    }
}
