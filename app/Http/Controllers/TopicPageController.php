<?php

namespace App\Http\Controllers;

use App\Support\Seo\PublicLocales;
use App\Support\Seo\SeoMeta;
use App\Support\Seo\StructuredData;
use App\Support\Seo\TopicPages;
use Illuminate\Http\RedirectResponse;
use Illuminate\View\View;

/**
 * Keyword landing pages ("use cases"), server-rendered like the home page.
 * Registry: App\Support\Seo\TopicPages — content: lang/{locale}/topics.php.
 */
class TopicPageController extends Controller
{
    /** "/{topic}" — English version (hreflang x-default). */
    public function show(string $topic): View
    {
        return $this->render(PublicLocales::DEFAULT, $topic);
    }

    /** "/{locale}/{topic}" — other languages. */
    public function showLocalized(string $locale, string $topic): View
    {
        return $this->render($locale, $topic);
    }

    /** "/en/{topic}" — English lives without prefix (one URL per language). */
    public function redirectDefault(string $topic): RedirectResponse
    {
        return redirect(TopicPages::url(PublicLocales::DEFAULT, $topic), 301);
    }

    private function render(string $locale, string $topic): View
    {
        if (! TopicPages::exists($topic)) {
            abort(404);
        }

        app()->setLocale($locale);

        $content = __('topics.pages.'.$topic);
        $url = TopicPages::url($locale, $topic);
        $alternates = TopicPages::alternates($topic);

        $seo = new SeoMeta(
            title: $content['title'],
            description: $content['description'],
            canonical: $url,
            locale: $locale,
            alternates: $alternates,
            ogType: 'article',
            jsonLd: [
                StructuredData::webPage($url, $content['h1'], $content['description'], $locale),
                StructuredData::breadcrumbs([
                    ['name' => 'Scoriet', 'url' => PublicLocales::homeUrl($locale)],
                    ['name' => $content['nav'], 'url' => $url],
                ]),
                StructuredData::faqPage($url, $content['faq']),
            ],
        );

        $related = [];
        foreach (TopicPages::slugs() as $slug) {
            if ($slug !== $topic) {
                $related[] = [
                    'url' => TopicPages::url($locale, $slug),
                    'label' => __('topics.pages.'.$slug.'.nav'),
                    'icon' => TopicPages::icon($slug),
                ];
            }
        }

        return view('public.topic', [
            'locale' => $locale,
            'seo' => $seo,
            'topic' => $topic,
            'icon' => TopicPages::icon($topic),
            'content' => $content,
            'related' => $related,
            'isDemo' => (bool) config('scoriet.demo'),
            'languageLinks' => array_diff_key($alternates, ['x-default' => true]),
            'islandContext' => [
                'page' => 'topic',
                'locale' => $locale,
                'uiLanguage' => $locale,
                'isDemo' => (bool) config('scoriet.demo'),
                'openRegister' => false,
                'inviteToken' => null,
                'cmsPageId' => null,
            ],
        ]);
    }
}
