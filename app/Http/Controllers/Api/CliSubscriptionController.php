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
        ]);

        $user = $request->user();
        $type = $validated['type'];

        // Check if patron (already has unlimited access)
        if ($user->user_type === 'patron') {
            return response()->json([
                'success' => false,
                'error' => 'Als Patron haben Sie bereits unbegrenzten Zugang.',
            ], 400);
        }

        // Get cost
        $cost = $this->getCreditCost($type);

        // Map type to subscription_type
        $subscriptionType = match ($type) {
            'cli' => Subscription::TYPE_CLI,
            'service' => Subscription::TYPE_SERVICE,
            'bundle' => Subscription::TYPE_BUNDLE,
        };

        // Check if already has active subscription
        if ($type === 'cli' || $type === 'bundle') {
            $existingCli = Subscription::where('user_id', $user->id)
                ->whereIn('subscription_type', [Subscription::TYPE_CLI, Subscription::TYPE_BUNDLE])
                ->active()
                ->notExpired()
                ->exists();
            if ($existingCli && $type === 'cli') {
                return response()->json([
                    'success' => false,
                    'error' => 'Sie haben bereits eine aktive CLI-Subscription.',
                ], 400);
            }
        }

        if ($type === 'service' || $type === 'bundle') {
            $existingService = Subscription::where('user_id', $user->id)
                ->whereIn('subscription_type', [Subscription::TYPE_SERVICE, Subscription::TYPE_BUNDLE])
                ->active()
                ->notExpired()
                ->exists();
            if ($existingService && $type === 'service') {
                return response()->json([
                    'success' => false,
                    'error' => 'Sie haben bereits eine aktive Service-Subscription.',
                ], 400);
            }
        }

        // Check credits
        if ($user->credits < $cost) {
            return response()->json([
                'success' => false,
                'error' => "Nicht genug Credits. Benötigt: {$cost}, Vorhanden: {$user->credits}",
                'required' => $cost,
                'available' => $user->credits,
            ], 400);
        }

        // Use transaction for safety
        $result = DB::transaction(function () use ($user, $type, $subscriptionType, $cost) {
            // Create subscription
            $subscription = Subscription::create([
                'user_id' => $user->id,
                'subscription_type' => $subscriptionType,
                'entity_id' => null, // CLI subscriptions have no entity
                'is_active' => true,
                'expires_at' => now()->addYear(),
            ]);

            // Deduct credits
            $user->credits -= $cost;
            $user->save();

            // Create credit transaction
            CreditTransaction::create([
                'user_id' => $user->id,
                'amount' => -$cost,
                'type' => 'cli_unlock',
                'description' => match ($type) {
                    'cli' => 'CLI Tool freigeschaltet (1 Jahr)',
                    'service' => 'Service freigeschaltet (1 Jahr)',
                    'bundle' => 'CLI + Service Bundle freigeschaltet (1 Jahr)',
                },
                'reference_type' => 'Subscription',
                'reference_id' => $subscription->id,
            ]);

            return $subscription;
        });

        return response()->json([
            'success' => true,
            'message' => match ($type) {
                'cli' => 'CLI Tool erfolgreich freigeschaltet!',
                'service' => 'Service erfolgreich freigeschaltet!',
                'bundle' => 'CLI + Service Bundle erfolgreich freigeschaltet!',
            },
            'subscription' => $result,
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
