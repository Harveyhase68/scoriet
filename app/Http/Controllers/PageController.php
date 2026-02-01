<?php

namespace App\Http\Controllers;

use App\Models\Page;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PageController extends Controller
{
    public function show(Request $request, $locale, $slug)
    {
        // Set the locale from the URL
        app()->setLocale($locale);

        $page = Page::where('slug', $slug)
            ->where('locale', $locale)
            ->where('is_active', true)
            ->first();

        if (!$page) {
            abort(404);
        }

        return Inertia::render('CMSPage', [
            'title' => $page->title,
            'content' => $page->content,
            'pageId' => $page->id,
            'slug' => $page->slug,
            'locale' => $locale,
        ]);
    }

    /**
     * Display the Help page
     */
    public function help(Request $request)
    {
        $locale = $request->route('locale', 'de');
        app()->setLocale($locale);

        // Load from database
        $page = Page::where('slug', 'help')
            ->where('locale', $locale)
            ->where('is_active', true)
            ->first();

        if (!$page) {
            abort(404, "Help page not found for locale: {$locale}");
        }

        return Inertia::render('CMSPage', [
            'title' => $page->title,
            'content' => $page->content,
            'pageId' => $page->id,
            'slug' => $page->slug,
            'locale' => $locale,
        ]);
    }

    /**
     * Display the Impressum page
     */
    public function impressum(Request $request)
    {
        $locale = $request->route('locale', 'de');
        app()->setLocale($locale);

        // Load from database
        $page = Page::where('slug', 'impressum')
            ->where('locale', $locale)
            ->where('is_active', true)
            ->first();

        if (!$page) {
            abort(404, "Impressum page not found for locale: {$locale}");
        }

        return Inertia::render('CMSPage', [
            'title' => $page->title,
            'content' => $page->content,
            'pageId' => $page->id,
            'slug' => $page->slug,
            'locale' => $locale,
        ]);
    }

    /**
     * Display the Contact page
     */
    public function contact(Request $request)
    {
        $locale = $request->route('locale', 'de');
        app()->setLocale($locale);

        // Load from database
        $page = Page::where('slug', 'contact')
            ->where('locale', $locale)
            ->where('is_active', true)
            ->first();

        if (!$page) {
            abort(404, "Contact page not found for locale: {$locale}");
        }

        return Inertia::render('CMSPage', [
            'title' => $page->title,
            'content' => $page->content,
            'pageId' => $page->id,
            'slug' => $page->slug,
            'locale' => $locale,
        ]);
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