<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Subscription as AppSubscription;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Srmklive\PayPal\Services\PayPal as PayPalClient;
use Stripe\Stripe;
use Stripe\Subscription;

class SubscriptionController extends Controller
{
    /**
     * Get all subscriptions for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $subscriptions = AppSubscription::where('user_id', $user->id)
            ->where('is_active', true)
            ->orderBy('expires_at')
            ->get()
            ->map(function ($subscription) {
                $daysUntilExpiry = $subscription->getDaysUntilExpiry();
                $isEligibleForBonus = $subscription->isEligibleForEarlyRenewalBonus();

                return [
                    'id' => $subscription->id,
                    'type' => $subscription->subscription_type,
                    'type_display' => $subscription->getTypeDisplayName(),
                    'entity_id' => $subscription->entity_id,
                    'entity_name' => $subscription->getEntityName(),
                    'is_free_tier' => $subscription->is_free_tier,
                    'is_patron' => $subscription->is_free_tier && $subscription->expires_at === null,
                    'expires_at' => $subscription->expires_at?->toIso8601String(),
                    'expires_at_formatted' => $subscription->expires_at?->format('d.m.Y'),
                    'days_until_expiry' => $daysUntilExpiry,
                    'is_expired' => $subscription->isExpired(),
                    'is_soft_locked' => $subscription->is_soft_locked,
                    'is_eligible_for_bonus' => $isEligibleForBonus,
                    'bonus_days' => $isEligibleForBonus ? AppSubscription::EARLY_RENEWAL_BONUS_DAYS : 0,
                    'renewal_cost' => 50, // Credits
                ];
            });

        return response()->json([
            'subscriptions' => $subscriptions,
            'user_credits' => $user->credits,
        ]);
    }

    /**
     * Renew a specific subscription.
     */
    public function renew(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $subscription = AppSubscription::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$subscription) {
            return response()->json([
                'error' => 'Subscription nicht gefunden',
            ], 404);
        }

        // Can't renew patron subscriptions
        if ($subscription->is_free_tier) {
            return response()->json([
                'error' => 'Patron-Subscriptions müssen nicht verlängert werden',
            ], 400);
        }

        // Check if user has enough credits
        $renewalCost = 50;
        if ($user->credits < $renewalCost) {
            return response()->json([
                'error' => "Nicht genügend Credits. Benötigt: {$renewalCost}, Vorhanden: {$user->credits}",
                'required_credits' => $renewalCost,
                'current_credits' => $user->credits,
            ], 400);
        }

        // Deduct credits
        $user->decrement('credits', $renewalCost);

        // Renew with bonus
        $result = $subscription->renewWithBonus();

        Log::info('Subscription renewed', [
            'subscription_id' => $subscription->id,
            'user_id' => $user->id,
            'type' => $subscription->subscription_type,
            'bonus_days' => $result['bonus_days'],
            'new_expires_at' => $result['new_expires_at'],
        ]);

        return response()->json([
            'success' => true,
            'message' => $result['bonus_days'] > 0
                ? "Abo erfolgreich verlängert! Sie haben {$result['bonus_days']} Bonus-Tage erhalten!"
                : 'Abo erfolgreich verlängert!',
            'old_expires_at' => $result['old_expires_at'],
            'new_expires_at' => $result['new_expires_at'],
            'bonus_days' => $result['bonus_days'],
            'credits_remaining' => $user->fresh()->credits,
        ]);
    }

    /**
     * Unlock Code Adjustments with credits.
     */
    public function unlockCodeAdjustments(Request $request): JsonResponse
    {
        $user = $request->user();

        // Check if already has access
        if ($user->hasCodeAdjustmentsAccess()) {
            return response()->json([
                'message' => 'Code Anpassungen ist bereits freigeschaltet',
                'access_status' => $user->getCodeAdjustmentsAccessStatus(),
            ]);
        }

        // Check if user has enough credits
        $cost = AppSubscription::CODE_ADJUSTMENTS_UNLOCK_COST;
        if ($user->credits < $cost) {
            return response()->json([
                'message' => "Nicht genügend Credits. Benötigt: {$cost}, Vorhanden: {$user->credits}",
                'required_credits' => $cost,
                'current_credits' => $user->credits,
            ], 400);
        }

        // Unlock with credits
        $subscription = AppSubscription::unlockCodeAdjustmentsWithCredits($user->id);

        if (!$subscription) {
            return response()->json([
                'message' => 'Freischaltung fehlgeschlagen',
            ], 500);
        }

        Log::info('Code Adjustments unlocked', [
            'user_id' => $user->id,
            'subscription_id' => $subscription->id,
        ]);

        return response()->json([
            'message' => 'Code Anpassungen erfolgreich freigeschaltet!',
            'access_status' => $user->getCodeAdjustmentsAccessStatus(),
            'credits_remaining' => $user->fresh()->credits,
        ]);
    }

    /**
     * Get Code Adjustments access status.
     */
    public function getCodeAdjustmentsStatus(Request $request): JsonResponse
    {
        $user = $request->user();
        return response()->json($user->getCodeAdjustmentsAccessStatus());
    }

    /**
     * Unlock Database Designer with credits.
     */
    public function unlockDatabaseDesigner(Request $request): JsonResponse
    {
        $user = $request->user();

        // Check if already has access
        if ($user->hasDatabaseDesignerAccess()) {
            return response()->json([
                'message' => 'Datenbank Designer ist bereits freigeschaltet',
                'access_status' => $user->getDatabaseDesignerAccessStatus(),
            ]);
        }

        // Check if user has enough credits
        $cost = AppSubscription::DATABASE_DESIGNER_UNLOCK_COST;
        if ($user->credits < $cost) {
            return response()->json([
                'message' => "Nicht genügend Credits. Benötigt: {$cost}, Vorhanden: {$user->credits}",
                'required_credits' => $cost,
                'current_credits' => $user->credits,
            ], 400);
        }

        // Unlock with credits
        $subscription = AppSubscription::unlockDatabaseDesignerWithCredits($user->id);

        if (!$subscription) {
            return response()->json([
                'message' => 'Freischaltung fehlgeschlagen',
            ], 500);
        }

        Log::info('Database Designer unlocked', [
            'user_id' => $user->id,
            'subscription_id' => $subscription->id,
        ]);

        return response()->json([
            'message' => 'Datenbank Designer erfolgreich freigeschaltet!',
            'access_status' => $user->getDatabaseDesignerAccessStatus(),
            'credits_remaining' => $user->fresh()->credits,
        ]);
    }

    /**
     * Get Database Designer access status.
     */
    public function getDatabaseDesignerStatus(Request $request): JsonResponse
    {
        $user = $request->user();
        return response()->json($user->getDatabaseDesignerAccessStatus());
    }

    /**
     * Unlock Schema Migration with credits.
     */
    public function unlockSchemaMigration(Request $request): JsonResponse
    {
        $user = $request->user();

        // Check if already has access
        if ($user->hasSchemaMigrationAccess()) {
            return response()->json([
                'message' => 'Schema Migration ist bereits freigeschaltet',
                'access_status' => $user->getSchemaMigrationAccessStatus(),
            ]);
        }

        // Check if user has enough credits
        $cost = AppSubscription::SCHEMA_MIGRATION_UNLOCK_COST;
        if ($user->credits < $cost) {
            return response()->json([
                'message' => "Nicht genügend Credits. Benötigt: {$cost}, Vorhanden: {$user->credits}",
                'required_credits' => $cost,
                'current_credits' => $user->credits,
            ], 400);
        }

        // Unlock with credits
        $subscription = AppSubscription::unlockSchemaMigrationWithCredits($user->id);

        if (!$subscription) {
            return response()->json([
                'message' => 'Freischaltung fehlgeschlagen',
            ], 500);
        }

        Log::info('Schema Migration unlocked', [
            'user_id' => $user->id,
            'subscription_id' => $subscription->id,
        ]);

        return response()->json([
            'message' => 'Schema Migration erfolgreich freigeschaltet!',
            'access_status' => $user->getSchemaMigrationAccessStatus(),
            'credits_remaining' => $user->fresh()->credits,
        ]);
    }

    /**
     * Get Schema Migration access status.
     */
    public function getSchemaMigrationStatus(Request $request): JsonResponse
    {
        $user = $request->user();
        return response()->json($user->getSchemaMigrationAccessStatus());
    }

    /**
     * Unlock Teams feature with credits.
     */
    public function unlockTeams(Request $request): JsonResponse
    {
        $user = $request->user();

        // Check if already has access
        $existingSubscription = AppSubscription::where('user_id', $user->id)
            ->where('subscription_type', 'team')
            ->where('is_active', true)
            ->first();

        if ($existingSubscription && !$existingSubscription->isExpired()) {
            // Extend existing subscription
            $existingSubscription->expires_at = $existingSubscription->expires_at->addYear();
            $existingSubscription->save();

            // Deduct credits
            $user->decrement('credits', 50);

            return response()->json([
                'message' => 'Teams-Abo um 1 Jahr verlängert!',
                'expires_at' => $existingSubscription->expires_at->toIso8601String(),
                'credits_remaining' => $user->fresh()->credits,
            ]);
        }

        // Check if user has enough credits
        $cost = 50;
        if ($user->credits < $cost) {
            return response()->json([
                'message' => "Nicht genügend Credits. Benötigt: {$cost}, Vorhanden: {$user->credits}",
                'required_credits' => $cost,
                'current_credits' => $user->credits,
            ], 400);
        }

        // Create new subscription
        $subscription = AppSubscription::create([
            'user_id' => $user->id,
            'subscription_type' => 'team',
            'is_active' => true,
            'expires_at' => now()->addYear(),
        ]);

        // Deduct credits
        $user->decrement('credits', $cost);

        Log::info('Teams feature unlocked', [
            'user_id' => $user->id,
            'subscription_id' => $subscription->id,
        ]);

        return response()->json([
            'message' => 'Teams erfolgreich freigeschaltet!',
            'expires_at' => $subscription->expires_at->toIso8601String(),
            'credits_remaining' => $user->fresh()->credits,
        ]);
    }

    /**
     * Get all available feature subscriptions with status.
     * This returns all possible features, not just the ones the user has.
     */
    public function getAllFeatures(Request $request): JsonResponse
    {
        $user = $request->user();
        $isPatron = $user->user_type === 'patron';

        // Define all available features
        $features = [
            [
                'type' => 'bundle',
                'name' => 'CLI + Service Bundle',
                'description' => 'Beide Tools zum Vorteilspreis',
                'icon' => 'pi-gift',
                'iconColor' => 'text-yellow-400',
                'cost' => 90,
                'isBundle' => true,
                'bundleChildren' => ['cli', 'service'],
            ],
            [
                'type' => 'cli',
                'name' => 'CLI Tool',
                'description' => 'Kommandozeilen-Tool für lokale Code-Generierung',
                'icon' => 'pi-desktop',
                'iconColor' => 'text-blue-400',
                'cost' => 50,
                'parentBundle' => 'bundle',
            ],
            [
                'type' => 'service',
                'name' => 'Windows Service',
                'description' => 'Hintergrund-Service für automatische Synchronisation',
                'icon' => 'pi-server',
                'iconColor' => 'text-green-400',
                'cost' => 50,
                'parentBundle' => 'bundle',
            ],
            [
                'type' => 'database_designer',
                'name' => 'Datenbank Designer',
                'description' => 'Visueller Editor für Datenbankstrukturen',
                'icon' => 'pi-database',
                'iconColor' => 'text-purple-400',
                'cost' => AppSubscription::DATABASE_DESIGNER_UNLOCK_COST,
            ],
            [
                'type' => 'form_designer',
                'name' => 'Formular Designer',
                'description' => 'Visueller Editor für Formulare',
                'icon' => 'pi-window-maximize',
                'iconColor' => 'text-orange-400',
                'cost' => 50, // Assume same cost
            ],
            [
                'type' => 'git_integration',
                'name' => 'Git Integration',
                'description' => 'Push zu GitHub/GitLab, PRs erstellen',
                'icon' => 'pi-github',
                'iconColor' => 'text-gray-300',
                'cost' => 50,
            ],
            [
                'type' => 'code_adjustments',
                'name' => 'Code Anpassungen',
                'description' => 'Anpassungen am generierten Code',
                'icon' => 'pi-code',
                'iconColor' => 'text-cyan-400',
                'cost' => AppSubscription::CODE_ADJUSTMENTS_UNLOCK_COST,
            ],
            [
                'type' => 'schema_migration',
                'name' => 'Schema Migration',
                'description' => 'Datenbank-Migrationen generieren',
                'icon' => 'pi-sync',
                'iconColor' => 'text-indigo-400',
                'cost' => AppSubscription::SCHEMA_MIGRATION_UNLOCK_COST,
            ],
            [
                'type' => 'team',
                'name' => 'Teams',
                'description' => 'Unbegrenzt Teams anlegen und zusammenarbeiten',
                'icon' => 'pi-users',
                'iconColor' => 'text-pink-400',
                'cost' => 50,
            ],
        ];

        // Get all active subscriptions for this user
        $activeSubscriptions = AppSubscription::where('user_id', $user->id)
            ->where('is_active', true)
            ->get()
            ->keyBy('subscription_type');

        // Check if bundle is active
        $bundleSub = $activeSubscriptions->get('bundle');
        $bundleActive = $bundleSub && !$bundleSub->isExpired();

        // Enrich features with user's status
        $enrichedFeatures = [];
        foreach ($features as $feature) {
            $subscription = $activeSubscriptions->get($feature['type']);
            $unlocked = false;
            $expiresAt = null;
            $daysRemaining = null;
            $coveredByBundle = false;

            if ($isPatron) {
                $unlocked = true;
            } elseif ($subscription && !$subscription->isExpired()) {
                $unlocked = true;
                $expiresAt = $subscription->expires_at?->toIso8601String();
                $daysRemaining = $subscription->getDaysUntilExpiry();
            }

            // CLI and Service: check if covered by bundle
            if (in_array($feature['type'], ['cli', 'service']) && $bundleActive) {
                $unlocked = true;
                $coveredByBundle = true;
                // If no individual subscription or bundle expires later, show bundle info
                if (!$subscription || $bundleSub->expires_at > $subscription->expires_at) {
                    $expiresAt = $bundleSub->expires_at->toIso8601String();
                    $daysRemaining = $bundleSub->getDaysUntilExpiry();
                }
            }

            $enrichedFeatures[] = array_merge($feature, [
                'unlocked' => $unlocked,
                'expires_at' => $expiresAt,
                'days_remaining' => $daysRemaining,
                'is_patron' => $isPatron,
                'covered_by_bundle' => $coveredByBundle,
            ]);
        }

        return response()->json([
            'features' => $enrichedFeatures,
            'user_credits' => $user->credits,
            'is_patron' => $isPatron,
        ]);
    }

    /**
     * Calculate bundle discount based on existing subscriptions.
     * Returns discount info if user has CLI or Service already.
     */
    public function getBundleDiscount(Request $request): JsonResponse
    {
        $user = $request->user();

        $cliSub = AppSubscription::where('user_id', $user->id)
            ->where('subscription_type', 'cli')
            ->where('is_active', true)
            ->first();

        $serviceSub = AppSubscription::where('user_id', $user->id)
            ->where('subscription_type', 'service')
            ->where('is_active', true)
            ->first();

        $bundlePrice = 90;
        $discount = 0;
        $discountReason = null;
        $options = [];

        // If user has CLI
        if ($cliSub && !$cliSub->isExpired()) {
            $daysRemaining = $cliSub->getDaysUntilExpiry();
            $dailyRate = 50 / 365; // CLI cost per day
            $cliValue = round($daysRemaining * $dailyRate);

            $options[] = [
                'type' => 'keep_cli',
                'label' => 'Voller Preis (CLI läuft nach Bundle weiter)',
                'price' => $bundlePrice,
                'description' => "Ihre CLI-Subscription ({$daysRemaining} Tage verbleibend) bleibt bestehen und läuft nach dem Bundle weiter.",
            ];

            $options[] = [
                'type' => 'apply_discount',
                'label' => "Rabattierter Preis (CLI-Wert anrechnen)",
                'price' => max(0, $bundlePrice - $cliValue),
                'discount' => $cliValue,
                'description' => "CLI-Restwert ({$cliValue} Credits für {$daysRemaining} Tage) wird angerechnet. CLI wird durch Bundle ersetzt.",
            ];
        }

        // If user has Service
        if ($serviceSub && !$serviceSub->isExpired()) {
            $daysRemaining = $serviceSub->getDaysUntilExpiry();
            $dailyRate = 50 / 365; // Service cost per day
            $serviceValue = round($daysRemaining * $dailyRate);

            if (empty($options)) {
                $options[] = [
                    'type' => 'keep_service',
                    'label' => 'Voller Preis (Service läuft nach Bundle weiter)',
                    'price' => $bundlePrice,
                    'description' => "Ihre Service-Subscription ({$daysRemaining} Tage verbleibend) bleibt bestehen und läuft nach dem Bundle weiter.",
                ];

                $options[] = [
                    'type' => 'apply_discount',
                    'label' => "Rabattierter Preis (Service-Wert anrechnen)",
                    'price' => max(0, $bundlePrice - $serviceValue),
                    'discount' => $serviceValue,
                    'description' => "Service-Restwert ({$serviceValue} Credits für {$daysRemaining} Tage) wird angerechnet. Service wird durch Bundle ersetzt.",
                ];
            }
        }

        // If user has both
        if ($cliSub && !$cliSub->isExpired() && $serviceSub && !$serviceSub->isExpired()) {
            $cliDays = $cliSub->getDaysUntilExpiry();
            $serviceDays = $serviceSub->getDaysUntilExpiry();
            $cliValue = round($cliDays * (50 / 365));
            $serviceValue = round($serviceDays * (50 / 365));
            $totalValue = $cliValue + $serviceValue;

            // Calculate actual price - can be negative (= credit refund)
            $discountedPrice = $bundlePrice - $totalValue;

            $options = [
                [
                    'type' => 'keep_both',
                    'label' => 'Voller Preis (Beide laufen nach Bundle weiter)',
                    'price' => $bundlePrice,
                    'description' => "CLI ({$cliDays} Tage) und Service ({$serviceDays} Tage) bleiben bestehen.",
                ],
                [
                    'type' => 'apply_all_discount',
                    'label' => "Maximaler Rabatt (Beide Werte anrechnen)",
                    'price' => $discountedPrice,
                    'discount' => $totalValue,
                    'isRefund' => $discountedPrice < 0,
                    'refundAmount' => $discountedPrice < 0 ? abs($discountedPrice) : 0,
                    'description' => $discountedPrice < 0
                        ? "Sie erhalten " . abs($discountedPrice) . " Credits gutgeschrieben! Beide werden durch Bundle ersetzt."
                        : "Gesamtwert ({$totalValue} Credits) wird angerechnet. Beide werden durch Bundle ersetzt.",
                ],
            ];
        }

        return response()->json([
            'has_existing_subscriptions' => !empty($options),
            'options' => $options,
            'cli_status' => $cliSub ? [
                'unlocked' => !$cliSub->isExpired(),
                'days_remaining' => $cliSub->getDaysUntilExpiry(),
                'expires_at' => $cliSub->expires_at?->toIso8601String(),
            ] : null,
            'service_status' => $serviceSub ? [
                'unlocked' => !$serviceSub->isExpired(),
                'days_remaining' => $serviceSub->getDaysUntilExpiry(),
                'expires_at' => $serviceSub->expires_at?->toIso8601String(),
            ] : null,
        ]);
    }

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
