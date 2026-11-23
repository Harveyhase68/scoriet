<?php

namespace App\Http\Controllers;

use App\Models\Page;
use App\Support\Seo\PublicLocales;
use App\Support\Seo\SeoMeta;
use App\Support\Seo\StructuredData;
use Illuminate\Http\Request;
use Illuminate\View\View;

/**
 * Localized CMS pages (/{locale}/{slug}), server-rendered with Blade so the
 * content is visible to crawlers without JavaScript. See PublicSiteController
 * for the overall public-site architecture.
 */
class PageController extends Controller
{
    public function show(Request $request, string $locale, string $slug): View
    {
        return $this->renderPage($locale, $slug);
    }

    /** Named route kept for existing links (route('pages.help')). */
    public function help(Request $request, string $locale): View
    {
        return $this->renderPage($locale, 'help');
    }

    /** Named route kept for existing links (route('pages.impressum')). */
    public function impressum(Request $request, string $locale): View
    {
        return $this->renderPage($locale, 'impressum');
    }

    /** Named route kept for existing links (route('pages.contact')). */
    public function contact(Request $request, string $locale): View
    {
        return $this->renderPage($locale, 'contact');
    }

    private function renderPage(string $locale, string $slug): View
    {
        app()->setLocale($locale);

        $page = Page::where('slug', $slug)
            ->where('locale', $locale)
            ->where('is_active', true)
            ->first();

        if (! $page) {
            abort(404);
        }

        $url = route('page', ['locale' => $locale, 'slug' => $slug]);
        $title = $page->title.' – Scoriet';
        $description = SeoMeta::summarize($page->content) ?: __('landing.seo_description');
        $alternates = $this->alternatesFor($slug);

        $seo = new SeoMeta(
            title: $title,
            description: $description,
            canonical: $url,
            locale: $locale,
            alternates: $alternates,
            ogType: 'article',
            jsonLd: [
                StructuredData::webPage($url, $page->title, $description, $locale),
                StructuredData::breadcrumbs([
                    ['name' => 'Scoriet', 'url' => PublicLocales::homeUrl($locale)],
                    ['name' => $page->title, 'url' => $url],
                ]),
            ],
        );

        return view('public.page', [
            'locale' => $locale,
            'seo' => $seo,
            'page' => $page,
            'isDemo' => (bool) config('scoriet.demo'),
            'languageLinks' => array_diff_key($alternates, ['x-default' => true]),
            'islandContext' => [
                'page' => 'cms',
                'locale' => $locale,
                'uiLanguage' => $locale,
                'isDemo' => (bool) config('scoriet.demo'),
                'openRegister' => false,
                'inviteToken' => null,
                'cmsPageId' => $page->id,
            ],
        ]);
    }

    /**
     * hreflang alternates: the same slug in every language where it is published.
     * x-default points to the default-language version when it exists.
     *
     * @return array<string, string>
     */
    private function alternatesFor(string $slug): array
    {
        $locales = Page::where('slug', $slug)
            ->where('is_active', true)
            ->whereIn('locale', PublicLocales::codes())
            ->pluck('locale')
            ->unique()
            ->all();

        // A single language has no alternates to announce.
        if (count($locales) < 2) {
            return [];
        }

        $alternates = [];
        foreach (PublicLocales::codes() as $code) {
            if (in_array($code, $locales, true)) {
                $alternates[$code] = route('page', ['locale' => $code, 'slug' => $slug]);
            }
        }
        if (isset($alternates[PublicLocales::DEFAULT])) {
            $alternates['x-default'] = $alternates[PublicLocales::DEFAULT];
        }

        return $alternates;
    }

    /**
     * Get popups for landing page (public endpoint)
     */
    public function getLandingPagePopups(Request $request)
    {
        $locale = $request->input('locale', 'en');

        $popups = Page::where('popup_on_landingpage', true)
            ->where('is_active', true)
            ->where('locale', $locale)
            ->orderBy('popup_priority', 'asc')
            ->get(['id', 'title', 'content', 'popup_priority', 'popup_version', 'slug']);

        return response()->json($popups);
    }

    /**
     * Get popups for app (public endpoint)
     */
    public function getAppPopups(Request $request)
    {
        $locale = $request->input('locale', 'en');

        $popups = Page::where('popup_on_app', true)
            ->where('is_active', true)
            ->where('locale', $locale)
            ->orderBy('popup_priority', 'asc')
            ->get(['id', 'title', 'content', 'popup_priority', 'popup_version', 'slug']);

        return response()->json($popups);
    }
}
