<?php

namespace App\Http\Controllers;

use App\Models\Page;
use App\Models\Project;
use App\Support\Seo\PublicLocales;
use Illuminate\Http\Response;

/**
 * Generates the public sitemap dynamically from the database so it never goes
 * stale. Static files would have to be hand-maintained as public projects and
 * CMS pages change; this route always reflects the current published state.
 *
 * Only genuinely public, indexable URLs are listed here. Everything behind
 * authentication (/app, /api, payment & token flows, admin) is intentionally
 * excluded and additionally blocked in public/robots.txt.
 */
class SitemapController extends Controller
{
    public function index(): Response
    {
        $urls = [];

        // Home page in every language ("/" = English, "/de", "/fr", ...), each
        // listing all language versions as hreflang alternates.
        $homeAlternates = PublicLocales::homeAlternates();
        foreach (PublicLocales::codes() as $locale) {
            $urls[] = [
                'loc' => PublicLocales::homeUrl($locale),
                'changefreq' => 'weekly',
                'priority' => '1.0',
                'alternates' => $homeAlternates,
            ];
        }

        // Localized CMS / info pages. Every active Page row (help, impressum,
        // contact and any other published page) is reachable at /{locale}/{slug}.
        // Translations of one slug announce each other as hreflang alternates.
        $pages = Page::where('is_active', true)
            ->whereIn('locale', PublicLocales::codes())
            ->get(['slug', 'locale', 'updated_at']);

        foreach ($pages->groupBy('slug') as $slug => $translations) {
            $alternates = [];
            if ($translations->count() > 1) {
                foreach ($translations as $translation) {
                    $alternates[$translation->locale] = route('page', ['locale' => $translation->locale, 'slug' => $slug]);
                }
                if (isset($alternates[PublicLocales::DEFAULT])) {
                    $alternates['x-default'] = $alternates[PublicLocales::DEFAULT];
                }
            }

            foreach ($translations as $translation) {
                $urls[] = [
                    'loc' => route('page', ['locale' => $translation->locale, 'slug' => $slug]),
                    'lastmod' => optional($translation->updated_at)->toAtomString(),
                    'changefreq' => 'monthly',
                    'priority' => '0.6',
                    'alternates' => $alternates,
                ];
            }
        }

        // Public project overview pages (/project/{username}/{projectname}).
        Project::query()
            ->where('is_public', true)
            ->where('is_active', true)
            ->with('owner:id,username')
            ->get()
            ->each(function (Project $project) use (&$urls) {
                $username = $project->owner?->username;
                // Without an owner username the public URL cannot be built.
                if (! $username) {
                    return;
                }
                $urls[] = [
                    'loc' => route('public.project', [
                        'username' => $username,
                        'projectname' => $project->name,
                    ]),
                    'lastmod' => optional($project->updated_at)->toAtomString(),
                    'changefreq' => 'weekly',
                    'priority' => '0.8',
                ];
            });

        return response($this->renderXml($urls), 200)
            ->header('Content-Type', 'application/xml; charset=UTF-8');
    }

    /**
     * Build the <urlset> document. Each value is XML-escaped so URLs containing
     * ampersands or other special characters stay valid.
     *
     * @param  array<int, array<string, mixed>>  $urls
     */
    private function renderXml(array $urls): string
    {
        $lines = [];
        $lines[] = '<?xml version="1.0" encoding="UTF-8"?>';
        $lines[] = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">';

        foreach ($urls as $url) {
            $lines[] = '  <url>';
            $lines[] = '    <loc>'.htmlspecialchars($url['loc'], ENT_XML1 | ENT_QUOTES, 'UTF-8').'</loc>';
            if (! empty($url['lastmod'])) {
                $lines[] = '    <lastmod>'.htmlspecialchars($url['lastmod'], ENT_XML1, 'UTF-8').'</lastmod>';
            }
            if (! empty($url['changefreq'])) {
                $lines[] = '    <changefreq>'.$url['changefreq'].'</changefreq>';
            }
            if (! empty($url['priority'])) {
                $lines[] = '    <priority>'.$url['priority'].'</priority>';
            }
            foreach ($url['alternates'] ?? [] as $hreflang => $href) {
                $lines[] = '    <xhtml:link rel="alternate" hreflang="'.htmlspecialchars($hreflang, ENT_XML1 | ENT_QUOTES, 'UTF-8')
                    .'" href="'.htmlspecialchars($href, ENT_XML1 | ENT_QUOTES, 'UTF-8').'"/>';
            }
            $lines[] = '  </url>';
        }

        $lines[] = '</urlset>';

        return implode("\n", $lines)."\n";
    }
}
