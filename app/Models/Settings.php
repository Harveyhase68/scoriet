<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Settings extends Model
{
    protected $fillable = [
        'global_google_translate_key',
        'price_patron_annual',
        'price_patron_monthly',
        'price_credits_500',
        'price_credits_1000',
        'price_credits_2500',
    ];

    protected $casts = [
        'price_patron_annual' => 'decimal:2',
        'price_patron_monthly' => 'decimal:2',
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

        if (!$settings) {
            $settings = self::create([
                'price_patron_annual' => 34.90,
                'price_patron_monthly' => 49.90,
                'price_credits_500' => 9.90,
                'price_credits_1000' => 17.90,
                'price_credits_2500' => 29.90,
            ]);
        }

        return $settings;
    }
}
