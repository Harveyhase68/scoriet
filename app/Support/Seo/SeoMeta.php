<?php

namespace App\Support\Seo;

/**
 * Everything the <head> of a public page needs for search engines and link
 * previews. Built by the controller, rendered by resources/views/public/partials/seo-head.blade.php.
 *
 * Keeping this in one immutable value object (instead of loose view variables)
 * guarantees that every public page ships a complete, consistent set of tags.
 */
final class SeoMeta
{
    /**
     * @param  array<string, string>  $alternates  hreflang code (or "x-default") => absolute URL
     * @param  list<array<string, mixed>>  $jsonLd  schema.org objects, each rendered as its own script block
     */
    public function __construct(
        public readonly string $title,
        public readonly string $description,
        public readonly string $canonical,
        public readonly string $locale,
        public readonly array $alternates = [],
        public readonly string $ogType = 'website',
        public readonly ?string $image = null,
        public readonly bool $indexable = true,
        public readonly array $jsonLd = [],
    ) {}

    public function robots(): string
    {
        return $this->indexable ? 'index, follow' : 'noindex, follow';
    }

    public function imageUrl(): string
    {
        return $this->image ?? asset('images/logos/scoriet-logo.png');
    }

    /**
     * Plain-text summary of HTML content for a meta description: tags removed,
     * whitespace collapsed, cut at a word boundary to at most $maxLength characters.
     */
    public static function summarize(?string $html, int $maxLength = 160): string
    {
        if ($html === null || $html === '') {
            return '';
        }

        // Block-level tags become spaces so "<p>a</p><p>b</p>" does not glue to "ab".
        $text = str_replace(['<br>', '<br/>', '<br />', '</p>', '</li>', '</h1>', '</h2>', '</h3>', '</div>'], ' ', $html);
        $text = html_entity_decode(strip_tags($text), ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $text = trim(implode(' ', preg_split('/\s+/u', $text, -1, PREG_SPLIT_NO_EMPTY) ?: []));

        if (mb_strlen($text) <= $maxLength) {
            return $text;
        }

        $cut = mb_substr($text, 0, $maxLength - 1);
        $lastSpace = mb_strrpos($cut, ' ');
        if ($lastSpace !== false && $lastSpace > $maxLength * 0.6) {
            $cut = mb_substr($cut, 0, $lastSpace);
        }

        return rtrim($cut, ' ,.;:-–').'…';
    }
}
