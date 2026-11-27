<?php

namespace App\Http\Controllers;

use App\Support\PricingCatalog;
use App\Support\Seo\PublicLocales;
use App\Support\Seo\SeoMeta;
use App\Support\Seo\StructuredData;
use Illuminate\Http\Request;
use Illuminate\View\View;

/**
 * Server-rendered public home page (marketing site).
 *
 * The page is plain HTML from Blade so search engines and AI crawlers that do
 * not execute JavaScript see the full content. Interactive parts (login,
 * registration, demo access, plans, popups) are mounted on top by the small
 * React island in resources/js/public.tsx.
 *
 * The React LandingPage component is still used as the in-app welcome tab
 * (pages/Index.tsx); it is no longer served on public URLs.
 */
class PublicSiteController extends Controller
{
    /** "/" — English home page and hreflang x-default. */
    public function home(): View
    {
        return $this->renderHome(PublicLocales::DEFAULT);
    }

    /** "/de", "/fr", ... — localized home pages. */
    public function localizedHome(string $locale): View
    {
        return $this->renderHome($locale);
    }

    /**
     * "/register?invite=..." — the home page with the registration modal opened.
     * Not indexable; its canonical points to the home page in the same language.
     * The language follows the browser (Accept-Language) because invite links
     * carry no locale.
     */
    public function register(Request $request): View
    {
        $locale = $request->getPreferredLanguage(PublicLocales::codes()) ?? PublicLocales::DEFAULT;

        return $this->renderHome($locale, [
            'openRegister' => true,
            'inviteToken' => $request->query('invite'),
            // The visitor's stored app language wins over Accept-Language for the modals.
            'uiLanguage' => null,
        ], indexable: false);
    }

    /**
     * @param  array<string, mixed>  $contextOverrides  merged into the island context
     */
    private function renderHome(string $locale, array $contextOverrides = [], bool $indexable = true): View
    {
        app()->setLocale($locale);

        $pricing = PricingCatalog::current();
        $title = __('landing.seo_title');
        $description = __('landing.seo_description');

        $seo = new SeoMeta(
            title: $title,
            description: $description,
            canonical: PublicLocales::homeUrl($locale),
            locale: $locale,
            // hreflang only on indexable pages; a noindex page must not join the language cluster.
            alternates: $indexable ? PublicLocales::homeAlternates() : [],
            indexable: $indexable,
            jsonLd: [
                StructuredData::organization(),
                StructuredData::website($locale),
                StructuredData::softwareApplication($locale, $description, $pricing['subscriptions'], $pricing['currency']),
                StructuredData::faqPage(PublicLocales::homeUrl($locale), __('home.faq')),
            ],
        );

        return view('public.home', [
            'locale' => $locale,
            'seo' => $seo,
            'pricing' => $pricing,
            'screenshots' => $this->screenshots(),
            'isDemo' => (bool) config('scoriet.demo'),
            'languageLinks' => array_diff_key(PublicLocales::homeAlternates(), ['x-default' => true]),
            'islandContext' => array_merge([
                'page' => 'home',
                'locale' => $locale,
                'uiLanguage' => $locale,
                'isDemo' => (bool) config('scoriet.demo'),
                'openRegister' => false,
                'inviteToken' => null,
                'cmsPageId' => null,
            ], $contextOverrides),
        ]);
    }

    /**
     * Optional screenshots of the home page, looked up in public/images/landing/.
     * A slot is rendered only when its file exists, so the live page never shows
     * an empty placeholder. Drop in e.g. "studio.webp" to activate a slot.
     *
     * @return array<string, string|null> slot => asset URL or null
     */
    private function screenshots(): array
    {
        $slots = ['studio', 'generated', 'editor'];
        $extensions = ['webp', 'png', 'jpg'];

        $found = [];
        foreach ($slots as $slot) {
            $found[$slot] = null;
            foreach ($extensions as $extension) {
                $relative = 'images/landing/'.$slot.'.'.$extension;
                if (is_file(public_path($relative))) {
                    $found[$slot] = asset($relative);
                    break;
                }
            }
        }

        return $found;
    }
}
