<?php

namespace App\Services;

use App\Models\User;
use App\Models\Template;
use App\Models\TemplatePurchase;
use App\Models\CreditTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TemplateStoreService
{
    /**
     * Revenue split: 80% seller, 20% platform
     */
    public const SELLER_PERCENTAGE = 0.80;
    public const PLATFORM_PERCENTAGE = 0.20;

    /**
     * Minimum prices
     */
    public const MIN_CREDITS = 50;
    public const MIN_EUROS = 1.00;

    /**
     * Purchase a template with credits.
     *
     * @param User $buyer
     * @param Template $template
     * @return array ['success' => bool, 'message' => string, 'purchase' => TemplatePurchase|null]
     */
    public static function purchaseWithCredits(User $buyer, Template $template): array
    {
        // Validation
        if (!$template->isStoreTemplate()) {
            return [
                'success' => false,
                'message' => __('templatestoreservicephp39'),
                'purchase' => null,
            ];
        }

        if (!$template->acceptsCredits()) {
            return [
                'success' => false,
                'message' => __('templatestoreservicephp47'),
                'purchase' => null,
            ];
        }

        if (!$template->canBePurchasedBy($buyer)) {
            return [
                'success' => false,
                'message' => __('templatestoreservicephp55'),
                'purchase' => null,
            ];
        }

        $price = $template->price_credits;
        if ($buyer->credits < $price) {
            return [
                'success' => false,
                'message' => __('templatestoreservicephp64'). "{$price}".__('templatestoreservicephp64_2')."{$buyer->credits}",
                'purchase' => null,
            ];
        }

        $seller = $template->creator;
        if (!$seller) {
            return [
                'success' => false,
                'message' => __('templatestoreservicephp73'),
                'purchase' => null,
            ];
        }

        // Calculate revenue split
        $sellerCredits = (int) floor($price * self::SELLER_PERCENTAGE);
        $platformCredits = $price - $sellerCredits;

        try {
            $purchase = DB::transaction(function () use ($buyer, $seller, $template, $price, $sellerCredits, $platformCredits) {
                // Refresh to prevent race conditions
                $buyer->refresh();
                if ($buyer->credits < $price) {
                    throw new \Exception(__('templatestoreservicephp87'));
                }

                // Check double purchase
                if (TemplatePurchase::hasPurchased($buyer->id, $template->id)) {
                    throw new \Exception(__('templatestoreservicephp92'));
                }

                // Deduct credits from buyer
                $buyer->decrement('credits', $price);

                // Credit seller (80%)
                $seller->increment('credits', $sellerCredits);

                // Create buyer's credit transaction (deduction)
                $buyerTransaction = CreditTransaction::create([
                    'user_id' => $buyer->id,
                    'amount' => -$price,
                    'type' => 'template_purchase',
                    'description' => __('templatestoreservicephp106')."{$template->name}",
                    'reference_type' => 'template',
                    'reference_id' => $template->id,
                ]);

                // Create seller's credit transaction (credit)
                CreditTransaction::create([
                    'user_id' => $seller->id,
                    'amount' => $sellerCredits,
                    'type' => 'template_sale',
                    'description' => __('templatestoreservicephp116')."{$template->name}".__('templatestoreservicephp116_2')."{$price}".__('templatestoreservicephp116_3').")",
                    'reference_type' => 'template',
                    'reference_id' => $template->id,
                ]);

                // Create purchase record
                $purchase = TemplatePurchase::create([
                    'buyer_user_id' => $buyer->id,
                    'seller_user_id' => $seller->id,
                    'template_id' => $template->id,
                    'payment_type' => 'credits',
                    'price_credits' => $price,
                    'seller_credits' => $sellerCredits,
                    'platform_credits' => $platformCredits,
                    'credit_transaction_id' => $buyerTransaction->id,
                ]);

                // Update template stats
                $template->recordSale($price);

                return $purchase;
            });

            return [
                'success' => true,
                'message' => __('templatestoreservicephp141')."'{$template->name}'".__('templatestoreservicephp141_2')."{$price}".__('templatestoreservicephp141_3'),
                'purchase' => $purchase,
            ];

        } catch (\Exception $e) {
            Log::error(__('templatestoreservicephp146'), [
                'buyer_id' => $buyer->id,
                'template_id' => $template->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => $e->getMessage(),
                'purchase' => null,
            ];
        }
    }

    /**
     * Initialize a euro purchase (creates pending purchase, returns payment info).
     * Actual completion happens after Stripe/PayPal callback.
     *
     * @param User $buyer
     * @param Template $template
     * @param string $paymentMethod 'stripe' or 'paypal'
     * @return array
     */
    public static function initializeEuroPurchase(User $buyer, Template $template, string $paymentMethod): array
    {
        // Validation
        if (!$template->isStoreTemplate()) {
            return [
                'success' => false,
                'message' => __('templatestoreservicephp175'),
            ];
        }

        if (!$template->acceptsEuros()) {
            return [
                'success' => false,
                'message' => __('templatestoreservicephp182'),
            ];
        }

        if (!$template->canBePurchasedBy($buyer)) {
            return [
                'success' => false,
                'message' => __('templatestoreservicephp189'),
            ];
        }

        if (!in_array($paymentMethod, ['stripe', 'paypal'])) {
            return [
                'success' => false,
                'message' => __('templatestoreservicephp196'),
            ];
        }

        $price = $template->price_euros;
        $sellerEuros = round($price * self::SELLER_PERCENTAGE, 2);
        $platformEuros = round($price * self::PLATFORM_PERCENTAGE, 2);

        return [
            'success' => true,
            'message' => 'Ready for payment',
            'payment_info' => [
                'template_id' => $template->id,
                'template_name' => $template->name,
                'price_euros' => $price,
                'seller_euros' => $sellerEuros,
                'platform_euros' => $platformEuros,
                'payment_method' => $paymentMethod,
                'buyer_id' => $buyer->id,
                'seller_id' => $template->creator_user_id,
            ],
        ];
    }

    /**
     * Complete an euro purchase after successful payment.
     *
     * @param User $buyer
     * @param Template $template
     * @param string $paymentId Stripe or PayPal payment ID
     * @param string $paymentMethod 'stripe' or 'paypal'
     * @return array
     */
    public static function completeEuroPurchase(
        User $buyer,
        Template $template,
        string $paymentId,
        string $paymentMethod
    ): array {
        // Check not already purchased
        if (TemplatePurchase::hasPurchased($buyer->id, $template->id)) {
            return [
                'success' => false,
                'message' => __('templatestoreservicephp239'),
                'purchase' => null,
            ];
        }

        $seller = $template->creator;
        if (!$seller) {
            return [
                'success' => false,
                'message' => __('templatestoreservicephp248'),
                'purchase' => null,
            ];
        }

        $price = $template->price_euros;
        $sellerEuros = round($price * self::SELLER_PERCENTAGE, 2);
        $platformEuros = round($price * self::PLATFORM_PERCENTAGE, 2);

        try {
            $purchase = DB::transaction(function () use (
                $buyer, $seller, $template, $price, $sellerEuros, $platformEuros, $paymentId, $paymentMethod
            ) {
                // Double-check not purchased
                if (TemplatePurchase::hasPurchased($buyer->id, $template->id)) {
                    throw new \Exception(__('templatestoreservicephp263'));
                }

                // Create purchase record
                $purchaseData = [
                    'buyer_user_id' => $buyer->id,
                    'seller_user_id' => $seller->id,
                    'template_id' => $template->id,
                    'payment_type' => 'euros',
                    'price_euros' => $price,
                    'seller_euros' => $sellerEuros,
                    'platform_euros' => $platformEuros,
                ];

                if ($paymentMethod === 'stripe') {
                    $purchaseData['stripe_payment_id'] = $paymentId;
                } else {
                    $purchaseData['paypal_payment_id'] = $paymentId;
                }

                $purchase = TemplatePurchase::create($purchaseData);

                // Update template stats (record revenue in euros)
                $template->recordSale($price);

                return $purchase;
            });

            return [
                'success' => true,
                'message' => __('templatestoreservicephp293')."'{$template->name}'".__('templatestoreservicephp293_2')."{$price}".__('templatestoreservicephp293_3'),
                'purchase' => $purchase,
            ];

        } catch (\Exception $e) {
            Log::error(__('templatestoreservicephp298'), [
                'buyer_id' => $buyer->id,
                'template_id' => $template->id,
                'payment_id' => $paymentId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => $e->getMessage(),
                'purchase' => null,
            ];
        }
    }

    /**
     * Check if a user can sell templates in the store.
     *
     * @param User $user
     * @return array
     */
    public static function canSellInStore(User $user): array
    {
        // Admin can always sell
        if ($user->isAdmin()) {
            return [
                'can_sell' => true,
                'reason' => null,
            ];
        }

        // User must have at least one approved template OR be verified
        $hasApprovedTemplate = Template::where('creator_user_id', $user->id)
            ->where('is_store_approved', true)
            ->exists();

        if ($hasApprovedTemplate) {
            return [
                'can_sell' => true,
                'reason' => null,
            ];
        }

        // Check for templates with 5+ review score
        $hasHighRatedTemplate = Template::where('creator_user_id', $user->id)
            ->where('review_score', '>=', 5)
            ->exists();

        if ($hasHighRatedTemplate) {
            return [
                'can_sell' => true,
                'reason' => null,
            ];
        }

        return [
            'can_sell' => false,
            'reason' => __('templatestoreservicephp355'),
        ];
    }

    /**
     * Get seller statistics.
     *
     * @param User $seller
     * @return array
     */
    public static function getSellerStats(User $seller): array
    {
        $sales = TemplatePurchase::where('seller_user_id', $seller->id)->get();

        $totalSales = $sales->count();
        $totalCreditsEarned = $sales->where('payment_type', 'credits')->sum('seller_credits');
        $totalEurosEarned = $sales->where('payment_type', 'euros')->sum('seller_euros');

        $templatesInStore = Template::where('creator_user_id', $seller->id)
            ->where('visibility', 'store')
            ->count();

        return [
            'total_sales' => $totalSales,
            'total_credits_earned' => $totalCreditsEarned,
            'total_euros_earned' => $totalEurosEarned,
            'templates_in_store' => $templatesInStore,
        ];
    }

    /**
     * Calculate revenue split.
     *
     * @param float $price
     * @return array ['seller' => float, 'platform' => float]
     */
    public static function calculateRevenueSplit(float $price): array
    {
        $seller = round($price * self::SELLER_PERCENTAGE, 2);
        $platform = round($price * self::PLATFORM_PERCENTAGE, 2);

        return [
            'seller' => $seller,
            'platform' => $platform,
        ];
    }
}
