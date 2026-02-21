<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Page;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class PageController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $pages = Page::orderBy('slug')->orderBy('locale')->get();

        return response()->json($pages);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('admin.pages.create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'slug' => ['required', 'string', 'max:255', 'regex:/^[a-z0-9_]+$/'],
            'locale' => 'required|string|size:2|in:en,de,fr,es,it',
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'is_active' => 'boolean',
            'popup_on_landingpage' => 'boolean',
            'popup_on_app' => 'boolean',
            'popup_priority' => 'integer|min:1|max:999',
            'popup_version' => 'integer|min:1',
        ]);

        // Check if slug + locale combination already exists
        $exists = Page::where('slug', $validated['slug'])
                     ->where('locale', $validated['locale'])
                     ->exists();

        if ($exists) {
            return response()->json(['error' => __('pagecontrollerphp54')], 422);
        }

        $page = Page::create($validated);

        return response()->json($page, 201);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Page $page)
    {
        return view('admin.pages.edit', compact('page'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Page $page)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'is_active' => 'boolean',
            'popup_on_landingpage' => 'boolean',
            'popup_on_app' => 'boolean',
            'popup_priority' => 'integer|min:1|max:999',
            'popup_version' => 'integer|min:1',
        ]);

        $page->update($validated);

        return response()->json($page);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Page $page)
    {
        $page->delete();

        return response()->json(['message' => 'Page deleted successfully.']);
    }
}
