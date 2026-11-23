<?php

namespace App\View\Composers;

use App\Models\Page;
use App\Support\Seo\PublicLocales;
use Illuminate\View\View;

/**
 * Resolves the internal CMS links of the public footer.
 *
 * A link is only rendered when the page is actually published: first in the
 * page language, otherwise in the default language. This prevents footer
 * links to non-existent translations (404s hurt crawl quality and users).
 */
class PublicFooterComposer
{
    /** CMS slugs linked from the footer, in display order. */
    private const SLUGS = ['help', 'downloads'];

    public function compose(View $view): void
    {
        $locale = $view->getData()['locale'] ?? PublicLocales::DEFAULT;
        $candidates = array_values(array_unique([$locale, PublicLocales::DEFAULT]));

        $published = Page::query()
            ->whereIn('slug', self::SLUGS)
            ->whereIn('locale', $candidates)
            ->where('is_active', true)
            ->get(['slug', 'locale']);

        $links = [];
        foreach (self::SLUGS as $slug) {
            foreach ($candidates as $candidate) {
                $exists = $published->contains(
                    fn (Page $page) => $page->slug === $slug && $page->locale === $candidate
                );
                if ($exists) {
                    $links[$slug] = route('page', ['locale' => $candidate, 'slug' => $slug]);
                    break;
                }
            }
        }

        $view->with('footerPageLinks', $links);
    }
}
