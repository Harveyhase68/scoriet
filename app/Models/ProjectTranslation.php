<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectTranslation extends Model
{
    protected $fillable = [
        'project_id',
        'language_code',
        'caption',
        'description',
        'decimal_separator',
        'thousands_separator',
        'date_format',
        'time_format',
        'currency_symbol',
        'timezone',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get locale defaults for a given language code.
     * Used to pre-fill fields when a new language translation is created.
     */
    public static function getLocaleDefaults(string $languageCode): array
    {
        $defaults = [
            'de' => ['decimal_separator' => ',', 'thousands_separator' => '.', 'date_format' => 'd.m.Y', 'time_format' => 'H:i:s', 'currency_symbol' => '€', 'timezone' => 'Europe/Vienna'],
            'en' => ['decimal_separator' => '.', 'thousands_separator' => ',', 'date_format' => 'm/d/Y', 'time_format' => 'h:i A', 'currency_symbol' => '$', 'timezone' => 'America/New_York'],
            'fr' => ['decimal_separator' => ',', 'thousands_separator' => ' ', 'date_format' => 'd/m/Y', 'time_format' => 'H:i',  'currency_symbol' => '€', 'timezone' => 'Europe/Paris'],
            'es' => ['decimal_separator' => ',', 'thousands_separator' => '.', 'date_format' => 'd/m/Y', 'time_format' => 'H:i',  'currency_symbol' => '€', 'timezone' => 'Europe/Madrid'],
            'it' => ['decimal_separator' => ',', 'thousands_separator' => '.', 'date_format' => 'd/m/Y', 'time_format' => 'H:i',  'currency_symbol' => '€', 'timezone' => 'Europe/Rome'],
        ];

        return $defaults[$languageCode] ?? $defaults['en'];
    }
}
