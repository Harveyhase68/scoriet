<?php

namespace App\Support;

use App\Models\Settings;

/**
 * Plans, billing intervals and current public prices — single source of truth
 * on the server.
 *
 * Shared by the public pricing API (/api/pricing), the server-rendered landing
 * page, the Stripe/PayPal checkout and the admin notifications, so all of them
 * always agree on names, prices and provider IDs.
 * Client-side counterpart: resources/js/lib/plans.ts.
 *
 * Vocabulary
 *  - plan key:     'patron_annual' (Team & Studio) | 'patron_monthly' (Pro Unlimited).
 *                  Technical identifiers from the time each plan had only one
 *                  interval; they are stored in Stripe/PayPal metadata and must
 *                  never change. They name the plan, NOT the billing interval.
 *  - patron_type:  the same plan stored on users ('annual' | 'monthly'),
 *                  used by the permission checks (User::isPatronMonthly() = unlimited).
 *  - interval:     'month' | 'year' (Stripe vocabulary), stored in users.billing_interval.
 */
final class PricingCatalog
{
    public const CURRENCY = 'EUR';

    /**
     * Display names of the plans. Names are branding, identical in every language.
     */
    public const PLAN_NAMES = [
        'free' => 'Starter / Pay-as-you-go',
        'patron_annual' => 'Team & Studio',
        'patron_monthly' => 'Pro Unlimited',
    ];

    /** Subscription plan key => users.patron_type value. */
    public const PATRON_TYPES = [
        'patron_annual' => 'annual',
        'patron_monthly' => 'monthly',
    ];

    public const INTERVALS = ['month', 'year'];

    /** Interval preselected in every pricing view. */
    public const DEFAULT_INTERVAL = 'year';

    /** settings column per subscription plan and interval. */
    private const SUBSCRIPTION_PRICE_COLUMNS = [
        'patron_annual' => ['month' => 'price_team_studio_monthly', 'year' => 'price_team_studio_yearly'],
        'patron_monthly' => ['month' => 'price_pro_unlimited_monthly', 'year' => 'price_pro_unlimited_yearly'],
    ];

    private const CREDIT_PRICE_COLUMNS = [
        'credits_500' => 'price_credits_500',
        'credits_1000' => 'price_credits_1000',
        'credits_2500' => 'price_credits_2500',
    ];

    /** Used when the settings row does not exist yet. */
    private const DEFAULT_PRICES = [
        'price_team_studio_monthly' => 4.90,
        'price_team_studio_yearly' => 34.90,
        'price_pro_unlimited_monthly' => 49.90,
        'price_pro_unlimited_yearly' => 478.80,
        'price_credits_500' => 9.90,
        'price_credits_1000' => 17.90,
        'price_credits_2500' => 29.90,
    ];

    /**
     * How each plan presents its yearly price — a product decision, kept here.
     * Client-side counterpart: YEARLY_PRESENTATION in resources/js/lib/plans.ts.
     *  - yearly_as 'year':  "34.90 /year";  'month': "39.90 /month" + "478.80 billed yearly"
     *  - savings_as 'percent': "Save 40%";  'amount': "Save EUR 120"
     */
    private const YEARLY_PRESENTATION = [
        'patron_annual' => ['yearly_as' => 'year', 'savings_as' => 'percent'],
        'patron_monthly' => ['yearly_as' => 'month', 'savings_as' => 'amount'],
    ];

    /**
     * What a pricing card shows for one plan in one interval
     * (mirror of planPriceView() in resources/js/lib/plans.ts).
     *
     * @param  array{month: float, year: float}  $prices
     * @return array{
     *     amount: float,
     *     per: string,
     *     billed_yearly: float|null,
     *     savings: array{kind: string, value: float|int}|null
     * }
     */
    public static function priceView(string $plan, array $prices, string $interval): array
    {
        if ($interval === 'month') {
            return ['amount' => $prices['month'], 'per' => 'month', 'billed_yearly' => null, 'savings' => null];
        }

        $presentation = self::YEARLY_PRESENTATION[$plan];
        $saved = self::yearlySavings($prices);
        $savings = $saved['amount'] <= 0
            ? null
            : ($presentation['savings_as'] === 'percent'
                ? ['kind' => 'percent', 'value' => $saved['percent']]
                : ['kind' => 'amount', 'value' => $saved['amount']]);

        return $presentation['yearly_as'] === 'month'
            ? ['amount' => round($prices['year'] / 12, 2), 'per' => 'month', 'billed_yearly' => $prices['year'], 'savings' => $savings]
            : ['amount' => $prices['year'], 'per' => 'year', 'billed_yearly' => null, 'savings' => $savings];
    }

    /** @return list<string> the subscription plan keys */
    public static function subscriptionPlans(): array
    {
        return array_keys(self::PATRON_TYPES);
    }

    public static function isSubscriptionPlan(?string $plan): bool
    {
        return $plan !== null && array_key_exists($plan, self::PATRON_TYPES);
    }

    public static function isInterval(?string $interval): bool
    {
        return $interval !== null && in_array($interval, self::INTERVALS, true);
    }

    /** Display name for a patron_type value ('annual' | 'monthly'). */
    public static function nameForPatronType(?string $patronType): string
    {
        return $patronType === 'annual'
            ? self::PLAN_NAMES['patron_annual']
            : self::PLAN_NAMES['patron_monthly'];
    }

    /** Display name including the billing interval, e.g. "Team & Studio (yearly)". */
    public static function displayName(string $plan, ?string $interval): string
    {
        $name = self::PLAN_NAMES[$plan] ?? $plan;

        return match ($interval) {
            'month' => $name.' (monthly)',
            'year' => $name.' (yearly)',
            default => $name,
        };
    }

    /** @return array<string, float> column => default price, for creating the settings row */
    public static function defaultPriceColumns(): array
    {
        return self::DEFAULT_PRICES;
    }

    /** Price of one subscription plan in one interval. */
    public static function subscriptionPrice(Settings $settings, string $plan, string $interval): float
    {
        return (float) $settings->{self::SUBSCRIPTION_PRICE_COLUMNS[$plan][$interval]};
    }

    /** Stripe Price ID (config/services.php), null = checkout builds the price inline. */
    public static function stripePriceId(string $plan, string $interval): ?string
    {
        return config("services.stripe.subscription_prices.{$plan}.{$interval}") ?: null;
    }

    /** PayPal billing plan ID (config/paypal.php), null = not configured. */
    public static function paypalPlanId(string $plan, string $interval): ?string
    {
        return config("paypal.billing_plans.{$plan}.{$interval}") ?: null;
    }

    /**
     * What yearly billing saves compared to twelve monthly payments.
     * Calculated in cents so 12 × 49.90 − 478.80 is exactly 120.00.
     * The percentage is rounded down so the page never promises more than is saved.
     *
     * @param  array<string, float>  $prices  ['month' => float, 'year' => float]
     * @return array{amount: float, percent: int}
     */
    public static function yearlySavings(array $prices): array
    {
        $twelveMonths = (int) round($prices['month'] * 100) * 12;
        $yearly = (int) round($prices['year'] * 100);
        $saved = max(0, $twelveMonths - $yearly);

        return [
            'amount' => $saved / 100,
            'percent' => $twelveMonths > 0 ? intdiv($saved * 100, $twelveMonths) : 0,
        ];
    }

    /**
     * @return array{
     *     prices: array<string, float>,
     *     subscriptions: array<string, array{month: float, year: float}>,
     *     currency: string,
     *     updated_at: \DateTimeInterface
     * }
     */
    public static function current(): array
    {
        // first() instead of Settings::get(): rendering a public page must never write.
        $settings = Settings::first();
        $read = fn (string $column): float => $settings
            ? (float) $settings->{$column}
            : self::DEFAULT_PRICES[$column];

        $credits = [];
        foreach (self::CREDIT_PRICE_COLUMNS as $key => $column) {
            $credits[$key] = $read($column);
        }

        $subscriptions = [];
        foreach (self::SUBSCRIPTION_PRICE_COLUMNS as $plan => $columns) {
            $subscriptions[$plan] = [
                'month' => $read($columns['month']),
                'year' => $read($columns['year']),
            ];
        }

        return [
            'prices' => $credits,
            'subscriptions' => $subscriptions,
            'currency' => self::CURRENCY,
            'updated_at' => $settings?->updated_at ?? now(),
        ];
    }
}
