<?php

namespace App\Models;

use App\Support\PricingCatalog;
use Illuminate\Database\Eloquent\Model;

class Settings extends Model
{
    protected $fillable = [
        'global_google_translate_key',
        'price_team_studio_monthly',
        'price_team_studio_yearly',
        'price_pro_unlimited_monthly',
        'price_pro_unlimited_yearly',
        'price_credits_500',
        'price_credits_1000',
        'price_credits_2500',
    ];

    protected $casts = [
        'price_team_studio_monthly' => 'decimal:2',
        'price_team_studio_yearly' => 'decimal:2',
        'price_pro_unlimited_monthly' => 'decimal:2',
        'price_pro_unlimited_yearly' => 'decimal:2',
        'price_credits_500' => 'decimal:2',
        'price_credits_1000' => 'decimal:2',
        'price_credits_2500' => 'decimal:2',
    ];

    /**
     * Get the singleton settings instance
     */
    public static function get()
    {
        $settings = self::first();

        if (! $settings) {
            $settings = self::create(PricingCatalog::defaultPriceColumns());
        }

        return $settings;
    }
}
