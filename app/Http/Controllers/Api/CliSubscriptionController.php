<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\CreditTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CliSubscriptionController extends Controller
{
    /**
     * Get credit cost for CLI subscription types
     */
    private function getCreditCost(string $type): int
    {
        return match ($type) {
            'cli' => 50,
            'service' => 50,
            'bundle' => 90,
            default => 0,
        };
    }

    /**
     * Get current user's CLI/Service subscription status
     */
    public function status(Request $request)
    {
        $user = $request->user();

        // Get active subscriptions
        $cliSub = Subscription::where('user_id', $user->id)
            ->whereIn('subscription_type', [Subscription::TYPE_CLI, Subscription::TYPE_BUNDLE])
            ->active()
            ->notExpired()
            ->first();

        $serviceSub = Subscription::where('user_id', $user->id)
            ->whereIn('subscription_type', [Subscription::TYPE_SERVICE, Subscription::TYPE_BUNDLE])
            ->active()
            ->notExpired()
            ->first();

        // Check if user is patron (unlimited access)
        $isPatron = $user->user_type === 'patron';

        return response()->json([
            'cli' => [
                'unlocked' => $isPatron || $cliSub !== null,
                'expires_at' => $cliSub?->expires_at,
                'is_patron' => $isPatron,
            ],
            'service' => [
                'unlocked' => $isPatron || $serviceSub !== null,
                'expires_at' => $serviceSub?->expires_at,
                'is_patron' => $isPatron,
            ],
            'credits' => $user->credits,
            'prices' => [
                'cli' => 50,
                'service' => 50,
                'bundle' => 90,
            ],
        ]);
    }

    /**
     * Unlock CLI, Service, or Bundle
     */
    public function unlock(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:cli,service,bundle',
            'bundle_option' => 'nullable|in:keep_both,keep_cli,keep_service,apply_discount,apply_all_discount',
        ]);

        $user = $request->user();
        $type = $validated['type'];
        $bundleOption = $validated['bundle_option'] ?? null;

        // Check if patron (already has unlimited access)
        if ($user->user_type === 'patron') {
            return response()->json([
                'success' => false,
                'error' => 'Als Patron haben Sie bereits unbegrenzten Zugang.',
            ], 400);
        }

        // Get base cost
        $cost = $this->getCreditCost($type);

        // Map type to subscription_type
        $subscriptionType = match ($type) {
            'cli' => Subscription::TYPE_CLI,
            'service' => Subscription::TYPE_SERVICE,
            'bundle' => Subscription::TYPE_BUNDLE,
        };

        // Get existing subscriptions
        $existingCliSub = Subscription::where('user_id', $user->id)
            ->where('subscription_type', Subscription::TYPE_CLI)
            ->active()
            ->notExpired()
            ->first();

        $existingServiceSub = Subscription::where('user_id', $user->id)
            ->where('subscription_type', Subscription::TYPE_SERVICE)
            ->active()
            ->notExpired()
            ->first();

        $existingBundleSub = Subscription::where('user_id', $user->id)
            ->where('subscription_type', Subscription::TYPE_BUNDLE)
            ->active()
            ->notExpired()
            ->first();

        // Check if already has active subscription - extend instead of creating new
        if ($type === 'cli' && $existingCliSub) {
            return $this->extendSubscription($user, $existingCliSub, $cost, 'CLI Tool');
        }

        if ($type === 'service' && $existingServiceSub) {
            return $this->extendSubscription($user, $existingServiceSub, $cost, 'Service');
        }

        if ($type === 'bundle' && $existingBundleSub) {
            return $this->extendSubscription($user, $existingBundleSub, $cost, 'CLI + Service Bundle');
        }

        // Bundle with existing subscriptions - calculate actual cost
        $actualCost = $cost;
        $refundAmount = 0;
        $deactivateSubscriptions = [];

        if ($type === 'bundle' && ($existingCliSub || $existingServiceSub)) {
            // Check if user wants to apply discount
            if (in_array($bundleOption, ['apply_discount', 'apply_all_discount'])) {
                $totalValue = 0;

                if ($existingCliSub) {
                    $cliDays = $existingCliSub->getDaysUntilExpiry();
                    $cliValue = round($cliDays * (50 / 365));
                    $totalValue += $cliValue;
                    $deactivateSubscriptions[] = $existingCliSub;
                }

                if ($existingServiceSub) {
                    $serviceDays = $existingServiceSub->getDaysUntilExpiry();
                    $serviceValue = round($serviceDays * (50 / 365));
                    $totalValue += $serviceValue;
                    $deactivateSubscriptions[] = $existingServiceSub;
                }

                // Calculate actual cost (can be negative = refund)
                $actualCost = $cost - $totalValue;

                if ($actualCost < 0) {
                    $refundAmount = abs($actualCost);
                    $actualCost = 0;
                }
            }
            // else: keep_both - user pays full price, existing subs continue after bundle
        }

        // Check credits (only if cost is positive)
        if ($actualCost > 0 && $user->credits < $actualCost) {
            return response()->json([
                'success' => false,
                'error' => "Nicht genug Credits. Benötigt: {$actualCost}, Vorhanden: {$user->credits}",
                'required' => $actualCost,
                'available' => $user->credits,
            ], 400);
        }

        // Use transaction for safety
        $result = DB::transaction(function () use ($user, $type, $subscriptionType, $actualCost, $refundAmount, $deactivateSubscriptions) {
            // Deactivate old subscriptions if applying discount
            foreach ($deactivateSubscriptions as $oldSub) {
                $oldSub->is_active = false;
                $oldSub->save();
            }

            // Create subscription
            $subscription = Subscription::create([
                'user_id' => $user->id,
                'subscription_type' => $subscriptionType,
                'entity_id' => null, // CLI subscriptions have no entity
                'is_active' => true,
                'expires_at' => now()->addYear(),
            ]);

            // Handle credits
            if ($actualCost > 0) {
                // Deduct credits
                $user->credits -= $actualCost;
                $user->save();

                CreditTransaction::create([
                    'user_id' => $user->id,
                    'amount' => -$actualCost,
                    'type' => 'cli_unlock',
                    'description' => match ($type) {
                        'cli' => 'CLI Tool freigeschaltet (1 Jahr)',
                        'service' => 'Service freigeschaltet (1 Jahr)',
                        'bundle' => 'CLI + Service Bundle freigeschaltet (1 Jahr)',
                    },
                    'reference_type' => 'Subscription',
                    'reference_id' => $subscription->id,
                ]);
            }

            // Refund credits if applicable
            if ($refundAmount > 0) {
                $user->credits += $refundAmount;
                $user->save();

                CreditTransaction::create([
                    'user_id' => $user->id,
                    'amount' => $refundAmount,
                    'type' => 'bundle_refund',
                    'description' => "Bundle-Upgrade Gutschrift: {$refundAmount} Credits",
                    'reference_type' => 'Subscription',
                    'reference_id' => $subscription->id,
                ]);
            }

            return $subscription;
        });

        $message = match ($type) {
            'cli' => 'CLI Tool erfolgreich freigeschaltet!',
            'service' => 'Service erfolgreich freigeschaltet!',
            'bundle' => $refundAmount > 0
                ? "CLI + Service Bundle freigeschaltet! {$refundAmount} Credits wurden gutgeschrieben."
                : 'CLI + Service Bundle erfolgreich freigeschaltet!',
        };

        return response()->json([
            'success' => true,
            'message' => $message,
            'subscription' => $result,
            'new_credits' => $user->fresh()->credits,
            'refund_amount' => $refundAmount,
        ]);
    }

    /**
     * Extend an existing subscription by 1 year
     */
    private function extendSubscription($user, $subscription, $cost, $name)
    {
        if ($user->credits < $cost) {
            return response()->json([
                'success' => false,
                'error' => "Nicht genug Credits. Benötigt: {$cost}, Vorhanden: {$user->credits}",
                'required' => $cost,
                'available' => $user->credits,
            ], 400);
        }

        DB::transaction(function () use ($user, $subscription, $cost, $name) {
            $subscription->expires_at = $subscription->expires_at->addYear();
            $subscription->save();

            $user->credits -= $cost;
            $user->save();

            CreditTransaction::create([
                'user_id' => $user->id,
                'amount' => -$cost,
                'type' => 'cli_extend',
                'description' => "{$name} um 1 Jahr verlängert",
                'reference_type' => 'Subscription',
                'reference_id' => $subscription->id,
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => "{$name} um 1 Jahr verlängert!",
            'subscription' => $subscription->fresh(),
            'new_credits' => $user->fresh()->credits,
        ]);
    }

    /**
     * Check if user can access CLI (for CLI authentication)
     */
    public function checkCliAccess(Request $request)
    {
        $user = $request->user();

        // Patron has unlimited access
        if ($user->user_type === 'patron') {
            return response()->json(['access' => true, 'reason' => 'patron']);
        }

        // Check for active subscription
        $hasAccess = Subscription::where('user_id', $user->id)
            ->whereIn('subscription_type', [Subscription::TYPE_CLI, Subscription::TYPE_BUNDLE])
            ->active()
            ->notExpired()
            ->exists();

        return response()->json([
            'access' => $hasAccess,
            'reason' => $hasAccess ? 'subscription' : 'no_subscription',
        ]);
    }

    /**
     * Check if user can access Service (for Service authentication)
     */
    public function checkServiceAccess(Request $request)
    {
        $user = $request->user();

        // Patron has unlimited access
        if ($user->user_type === 'patron') {
            return response()->json(['access' => true, 'reason' => 'patron']);
        }

        // Check for active subscription
        $hasAccess = Subscription::where('user_id', $user->id)
            ->whereIn('subscription_type', [Subscription::TYPE_SERVICE, Subscription::TYPE_BUNDLE])
            ->active()
            ->notExpired()
            ->exists();

        return response()->json([
            'access' => $hasAccess,
            'reason' => $hasAccess ? 'subscription' : 'no_subscription',
        ]);
    }
}
