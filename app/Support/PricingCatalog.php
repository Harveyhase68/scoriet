<?php

namespace App\Support;

use App\Models\Settings;

/**
 * Current public prices, read from the settings row with documented defaults.
 *
 * Shared by the public pricing API (/api/pricing) and the server-rendered
 * landing page so both always show the same numbers.
 */
final class PricingCatalog
{
    public const CURRENCY = 'EUR';

    private const DEFAULTS = [
        'patron_annual' => 34.90,
        'patron_monthly' => 49.90,
        'credits_500' => 9.90,
        'credits_1000' => 17.90,
        'credits_2500' => 29.90,
    ];

    /**
     * @return array{prices: array<string, float>, currency: string, updated_at: \DateTimeInterface}
     */
    public static function current(): array
    {
        $settings = Settings::first();

        if (! $settings) {
            return [
                'prices' => self::DEFAULTS,
                'currency' => self::CURRENCY,
                'updated_at' => now(),
            ];
        }

        return [
            'prices' => [
                'patron_annual' => (float) $settings->price_patron_annual,
                'patron_monthly' => (float) $settings->price_patron_monthly,
                'credits_500' => (float) $settings->price_credits_500,
                'credits_1000' => (float) $settings->price_credits_1000,
                'credits_2500' => (float) $settings->price_credits_2500,
            ],
            'currency' => self::CURRENCY,
            'updated_at' => $settings->updated_at ?? now(),
        ];
    }
}
