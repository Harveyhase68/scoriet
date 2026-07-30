<?php

namespace App\Http\Controllers;

use App\Models\Page;
use App\Models\Project;
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
    /**
     * Locales that have public, indexable localized pages.
     * Mirrors the route constraint in routes/web.php (->where('locale', 'en|de|fr|es|it')).
     */
    private const LOCALES = ['en', 'de', 'fr', 'es', 'it'];

    public function index(): Response
    {
        $urls = [];

        // Landing page — highest priority, no reliable per-record lastmod.
        $urls[] = [
            'loc' => route('landing'),
            'changefreq' => 'weekly',
            'priority' => '1.0',
        ];

        // Localized CMS / info pages. Every active Page row (help, impressum,
        // contact and any other published page) is reachable at /{locale}/{slug}.
        Page::where('is_active', true)
            ->get(['slug', 'locale', 'updated_at'])
            ->each(function (Page $page) use (&$urls) {
                // Skip locales the localized route would not match (404 otherwise).
                if (!in_array($page->locale, self::LOCALES, true)) {
                    return;
                }
                $urls[] = [
                    'loc' => route('page', ['locale' => $page->locale, 'slug' => $page->slug]),
                    'lastmod' => optional($page->updated_at)->toAtomString(),
                    'changefreq' => 'monthly',
                    'priority' => '0.6',
                ];
            });

        // Public project overview pages (/project/{username}/{projectname}).
        Project::query()
            ->where('is_public', true)
            ->where('is_active', true)
            ->with('owner:id,username')
            ->get()
            ->each(function (Project $project) use (&$urls) {
                $username = $project->owner?->username;
                // Without an owner username the public URL cannot be built.
                if (!$username) {
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
     * @param  array<int, array<string, string|null>>  $urls
     */
    private function renderXml(array $urls): string
    {
        $lines = [];
        $lines[] = '<?xml version="1.0" encoding="UTF-8"?>';
        $lines[] = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

        foreach ($urls as $url) {
            $lines[] = '  <url>';
            $lines[] = '    <loc>' . htmlspecialchars($url['loc'], ENT_XML1 | ENT_QUOTES, 'UTF-8') . '</loc>';
            if (!empty($url['lastmod'])) {
                $lines[] = '    <lastmod>' . htmlspecialchars($url['lastmod'], ENT_XML1, 'UTF-8') . '</lastmod>';
            }
            if (!empty($url['changefreq'])) {
                $lines[] = '    <changefreq>' . $url['changefreq'] . '</changefreq>';
            }
            if (!empty($url['priority'])) {
                $lines[] = '    <priority>' . $url['priority'] . '</priority>';
            }
            $lines[] = '  </url>';
        }

        $lines[] = '</urlset>';

        return implode("\n", $lines) . "\n";
    }
}
