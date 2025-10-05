<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Settings extends Model
{
    protected $fillable = [
        'global_google_translate_key',
        'price_premium',
        'price_business',
        'price_patron',
    ];

    protected $casts = [
        'price_premium' => 'decimal:2',
        'price_business' => 'decimal:2',
        'price_patron' => 'decimal:2',
    ];

    /**
     * Get the singleton settings instance
     */
    public static function get()
    {
        $settings = self::first();

        if (!$settings) {
            $settings = self::create([
                'price_premium' => 9.99,
                'price_business' => 29.99,
                'price_patron' => 99.99,
            ]);
        }

        return $settings;
    }
}
