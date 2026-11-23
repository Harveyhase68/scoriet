<?php

namespace App\Support\Seo;

/**
 * Single source of truth for the languages of the public (crawlable) website.
 *
 * URL scheme:
 *   /            English home page (also the hreflang "x-default")
 *   /de, /fr ... localized home pages
 *   /{locale}/{slug}  localized CMS pages
 *
 * English lives at "/" instead of "/en" so the strongest URL of the domain
 * carries the international version; "/en" permanently redirects to "/".
 * The route constraints in routes/web.php are built from routePattern(), so
 * adding a language here is the only change needed on the routing side.
 */
final class PublicLocales
{
    public const DEFAULT = 'en';

    /** Locale code => native language name (shown in the language switcher). */
    public const SUPPORTED = [
        'en' => 'English',
        'de' => 'Deutsch',
        'fr' => 'Français',
        'es' => 'Español',
        'it' => 'Italiano',
    ];

    /** Open Graph locale identifiers (language_TERRITORY). */
    private const OG_LOCALES = [
        'en' => 'en_US',
        'de' => 'de_DE',
        'fr' => 'fr_FR',
        'es' => 'es_ES',
        'it' => 'it_IT',
    ];

    /** @return list<string> */
    public static function codes(): array
    {
        return array_keys(self::SUPPORTED);
    }

    public static function isSupported(?string $locale): bool
    {
        return $locale !== null && array_key_exists($locale, self::SUPPORTED);
    }

    /** Route constraint matching every supported locale, e.g. "en|de|fr|es|it". */
    public static function routePattern(): string
    {
        return implode('|', self::codes());
    }

    /** Route constraint for the localized home pages (default locale excluded, it lives at "/"). */
    public static function nonDefaultRoutePattern(): string
    {
        return implode('|', array_values(array_diff(self::codes(), [self::DEFAULT])));
    }

    public static function homeUrl(string $locale): string
    {
        return $locale === self::DEFAULT
            ? route('landing')
            : route('landing.localized', ['locale' => $locale]);
    }

    /**
     * hreflang alternates of the home page: every locale plus x-default.
     *
     * @return array<string, string>
     */
    public static function homeAlternates(): array
    {
        $alternates = [];
        foreach (self::codes() as $code) {
            $alternates[$code] = self::homeUrl($code);
        }
        $alternates['x-default'] = self::homeUrl(self::DEFAULT);

        return $alternates;
    }

    public static function ogLocale(string $locale): string
    {
        return self::OG_LOCALES[$locale] ?? self::OG_LOCALES[self::DEFAULT];
    }
}
