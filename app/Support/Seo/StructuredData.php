<?php

namespace App\Support\Seo;

/**
 * schema.org JSON-LD builders for the public pages.
 *
 * Every node carries a stable "@id" (URL + fragment) so the separate script
 * blocks of one page reference each other (publisher, isPartOf) instead of
 * repeating the same entity, which is how Google links them into one graph.
 */
final class StructuredData
{
    private const SAME_AS = [
        'https://github.com/Harveyhase68/scoriet',
        'https://x.com/Harveyhase68',
        'https://www.youtube.com/@Harveyhase68a',
    ];

    public static function organizationId(): string
    {
        return route('landing').'/#organization';
    }

    public static function websiteId(): string
    {
        return route('landing').'/#website';
    }

    /** @return array<string, mixed> */
    public static function organization(): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'Organization',
            '@id' => self::organizationId(),
            'name' => 'Scoriet',
            'url' => route('landing'),
            'logo' => asset('images/logos/scoriet-logo.png'),
            'sameAs' => self::SAME_AS,
        ];
    }

    /** @return array<string, mixed> */
    public static function website(string $locale): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'WebSite',
            '@id' => self::websiteId(),
            'name' => 'Scoriet',
            'url' => route('landing'),
            'inLanguage' => $locale,
            'publisher' => ['@id' => self::organizationId()],
        ];
    }

    /**
     * @param  array<string, float>  $prices  as returned by PricingCatalog::current()['prices']
     * @return array<string, mixed>
     */
    public static function softwareApplication(string $locale, string $description, array $prices, string $currency): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'SoftwareApplication',
            '@id' => route('landing').'/#software',
            'name' => 'Scoriet',
            'alternateName' => ['Scoriet Schema-to-Stack Studio', 'Scoriet Application & Code Generator'],
            'applicationSubCategory' => 'Open-source application and code generator',
            'isAccessibleForFree' => true,
            'description' => $description,
            'url' => PublicLocales::homeUrl($locale),
            'applicationCategory' => 'DeveloperApplication',
            'operatingSystem' => 'Web browser',
            'inLanguage' => $locale,
            'image' => asset('images/logos/scoriet-logo.png'),
            'publisher' => ['@id' => self::organizationId()],
            'offers' => [
                self::offer('Free', 0.0, $currency),
                self::offer('Patron Annual', $prices['patron_annual'] ?? 0.0, $currency),
                self::offer('Patron Monthly', $prices['patron_monthly'] ?? 0.0, $currency),
            ],
        ];
    }

    /** @return array<string, mixed> */
    public static function webPage(string $url, string $name, string $description, string $locale): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'WebPage',
            '@id' => $url.'#webpage',
            'url' => $url,
            'name' => $name,
            'description' => $description,
            'inLanguage' => $locale,
            'isPartOf' => ['@id' => self::websiteId()],
        ];
    }

    /**
     * @param  array<string, mixed>  $project  keys: url, name, description, author_name, author_username, created_at, updated_at
     * @return array<string, mixed>
     */
    public static function project(array $project): array
    {
        return array_filter([
            '@context' => 'https://schema.org',
            '@type' => 'CreativeWork',
            '@id' => $project['url'].'#project',
            'url' => $project['url'],
            'name' => $project['name'],
            'description' => $project['description'] ?: null,
            'author' => [
                '@type' => 'Person',
                'name' => $project['author_name'],
                'alternateName' => '@'.$project['author_username'],
            ],
            'dateCreated' => $project['created_at'],
            'dateModified' => $project['updated_at'],
            'isPartOf' => ['@id' => self::websiteId()],
        ], fn ($value) => $value !== null);
    }

    /**
     * @param  list<array{name: string, url: string}>  $items  ordered from root to current page
     * @return array<string, mixed>
     */
    public static function breadcrumbs(array $items): array
    {
        $elements = [];
        foreach ($items as $index => $item) {
            $elements[] = [
                '@type' => 'ListItem',
                'position' => $index + 1,
                'name' => $item['name'],
                'item' => $item['url'],
            ];
        }

        return [
            '@context' => 'https://schema.org',
            '@type' => 'BreadcrumbList',
            'itemListElement' => $elements,
        ];
    }

    /** @return array<string, mixed> */
    private static function offer(string $name, float $price, string $currency): array
    {
        return [
            '@type' => 'Offer',
            'name' => $name,
            'price' => number_format($price, 2, '.', ''),
            'priceCurrency' => $currency,
        ];
    }
}
