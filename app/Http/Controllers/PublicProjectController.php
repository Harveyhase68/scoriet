<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\User;
use App\Support\Seo\PublicLocales;
use App\Support\Seo\SeoMeta;
use App\Support\Seo\StructuredData;

class PublicProjectController extends Controller
{
    /**
     * Show a public project overview page
     * No authentication required
     */
    public function show(string $username, string $projectname)
    {
        // Find user by username
        $user = User::where('username', $username)->first();

        if (! $user) {
            abort(404, __('publicprojectcontrollerphp22'));
        }

        // Find project by name and owner
        $project = Project::where('owner_id', $user->id)
            ->where('name', $projectname)
            ->where('is_public', true)
            ->where('is_active', true)
            ->first();

        if (! $project) {
            abort(404, __('publicprojectcontrollerphp33'));
        }

        // Load related data (without sensitive information)
        $project->load(['owner:id,name,username']);

        // Get project statistics
        $stats = [
            'teams_count' => $project->teams()->count(),
            'templates_count' => $project->templates()->count(),
            'schemas_count' => $project->floatingSchemas()->count(),
        ];

        // Get team names (public info)
        $teams = $project->teams()
            ->select('teams.id', 'teams.name', 'teams.description')
            ->get();

        // Get template names (public info, only public/system templates)
        $templates = $project->templates()
            ->where(function ($query) {
                $query->where('templates.visibility', 'public')
                    ->orWhere('templates.is_system_template', true);
            })
            ->select('templates.id', 'templates.name', 'templates.description', 'templates.is_system_template')
            ->get();

        // Get schema names (public info, only public schemas)
        $schemas = $project->floatingSchemas()
            ->where('schemas.visibility', 'public')
            ->select('schemas.id', 'schemas.name', 'schemas.description')
            ->get();

        // Get attachments (public listing without download - only metadata)
        $attachments = $project->attachments()
            ->select('id', 'original_filename', 'mime_type', 'category', 'size', 'is_pinned')
            ->get()
            ->map(function ($attachment) {
                return [
                    'id' => $attachment->id,
                    'original_filename' => $attachment->original_filename,
                    'mime_type' => $attachment->mime_type,
                    'category_label' => $attachment->getCategoryLabel(),
                    'formatted_size' => $attachment->getFormattedSize(),
                    'is_pinned' => $attachment->is_pinned,
                ];
            });

        // Prepare public project data (exclude sensitive fields)
        $project->load('translations');
        $publicProjectData = [
            'id' => $project->id,
            'name' => $project->name,
            'caption' => $project->getTranslatedCaption(),
            'description' => $project->getTranslatedDescription(),
            'owner' => [
                'name' => $project->owner->name,
                'username' => $project->owner->username,
            ],
            'created_at' => $project->created_at,
            'updated_at' => $project->updated_at,
            // Public settings
            'default_language' => $project->default_language,
            'enabled_languages' => $project->enabled_languages,
            // Project URL (if set and public)
            'project_url' => $project->project_url,
            // Statistics
            'stats' => $stats,
            // Related entities
            'teams' => $teams,
            'templates' => $templates,
            'schemas' => $schemas,
            'attachments' => $attachments,
        ];

        // Server-rendered (Blade) so the project is visible to crawlers without
        // JavaScript. The URL carries no locale, so the page uses the default
        // public language; see PublicSiteController for the architecture.
        $locale = PublicLocales::DEFAULT;
        app()->setLocale($locale);

        $url = route('public.project', ['username' => $username, 'projectname' => $projectname]);
        $displayName = $publicProjectData['caption'] ?: $project->name;
        $description = SeoMeta::summarize($publicProjectData['description'])
            ?: $displayName.' – a code generation project by @'.$username.' on Scoriet.';

        $seo = new SeoMeta(
            title: $displayName.' by @'.$username.' – Scoriet',
            description: $description,
            canonical: $url,
            locale: $locale,
            ogType: 'article',
            jsonLd: [
                StructuredData::project([
                    'url' => $url,
                    'name' => $displayName,
                    'description' => $publicProjectData['description'],
                    'author_name' => $project->owner->name,
                    'author_username' => $project->owner->username,
                    'created_at' => optional($project->created_at)->toAtomString(),
                    'updated_at' => optional($project->updated_at)->toAtomString(),
                ]),
                StructuredData::breadcrumbs([
                    ['name' => 'Scoriet', 'url' => PublicLocales::homeUrl($locale)],
                    ['name' => $displayName, 'url' => $url],
                ]),
            ],
        );

        return view('public.project', [
            'locale' => $locale,
            'seo' => $seo,
            'project' => $publicProjectData,
            'displayName' => $displayName,
            'isDemo' => (bool) config('scoriet.demo'),
            'languageLinks' => [],
            'islandContext' => [
                'page' => 'project',
                'locale' => $locale,
                // No locale in the URL: modals follow the visitor's stored app language.
                'uiLanguage' => null,
                'isDemo' => (bool) config('scoriet.demo'),
                'openRegister' => false,
                'inviteToken' => null,
                'cmsPageId' => null,
            ],
        ]);
    }

    /**
     * API endpoint to get public project data (JSON)
     */
    public function getData(string $username, string $projectname)
    {
        // Find user by username
        $user = User::where('username', $username)->first();

        if (! $user) {
            return response()->json(['error' => __('publicprojectcontrollerphp129')], 404);
        }

        // Find project by name and owner
        $project = Project::where('owner_id', $user->id)
            ->where('name', $projectname)
            ->where('is_public', true)
            ->where('is_active', true)
            ->first();

        if (! $project) {
            return response()->json(['error' => __('publicprojectcontrollerphp140')], 404);
        }

        // Return basic public data
        $project->load('translations');

        return response()->json([
            'name' => $project->name,
            'caption' => $project->getTranslatedCaption(),
            'description' => $project->getTranslatedDescription(),
            'owner' => [
                'name' => $project->owner->name,
                'username' => $project->owner->username,
            ],
            'created_at' => $project->created_at,
        ]);
    }
}
