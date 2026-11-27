<?php

namespace App\Support\Seo;

/**
 * Registry of the keyword landing pages ("use case" pages).
 *
 * URL scheme (same as the home page):
 *   /{topic}            English (hreflang x-default)
 *   /{locale}/{topic}   other languages, e.g. /de/laravel-crud-generator
 *
 * Slugs stay English in every language: developers search these terms in
 * English, and identical slugs keep the hreflang cluster simple.
 * Content lives in lang/{locale}/topics.php under "pages.{slug}".
 * Adding a topic = one entry here + one content block per language.
 */
final class TopicPages
{
    /** slug => icon (primeicons) shown on cards and in the page header */
    public const TOPICS = [
        'database-to-app' => 'pi-database',
        'ai-app-foundation' => 'pi-sparkles',
        'laravel-crud-generator' => 'pi-code',
        'spring-boot-code-generator' => 'pi-code',
        'csharp-code-generator' => 'pi-code',
        'flutter-app-generator' => 'pi-mobile',
        'rust-code-generator' => 'pi-cog',
        'windev-migration' => 'pi-window-maximize',
    ];

    /** @return list<string> */
    public static function slugs(): array
    {
        return array_keys(self::TOPICS);
    }

    public static function exists(string $slug): bool
    {
        return array_key_exists($slug, self::TOPICS);
    }

    public static function icon(string $slug): string
    {
        return self::TOPICS[$slug] ?? 'pi-code';
    }

    public static function url(string $locale, string $slug): string
    {
        return $locale === PublicLocales::DEFAULT
            ? route('topic', ['topic' => $slug])
            : route('topic.localized', ['locale' => $locale, 'topic' => $slug]);
    }

    /**
     * hreflang alternates of one topic: every locale plus x-default.
     *
     * @return array<string, string>
     */
    public static function alternates(string $slug): array
    {
        $alternates = [];
        foreach (PublicLocales::codes() as $code) {
            $alternates[$code] = self::url($code, $slug);
        }
        $alternates['x-default'] = self::url(PublicLocales::DEFAULT, $slug);

        return $alternates;
    }
}
