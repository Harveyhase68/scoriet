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
        // Uniqueness check uses Laravel's standard validator so the response
        // shape matches every other 422 in the app: errors.slug[0] carries
        // the specific message, which the frontend can show verbatim.
        // The combined locale check goes via a closure-based unique() that
        // factors locale into the WHERE — we can't use a column-level
        // unique() rule here because the constraint is composite.
        $validated = $request->validate([
            'slug' => [
                'required', 'string', 'max:255', 'regex:/^[a-z0-9_]+$/',
                function ($attribute, $value, $fail) use ($request) {
                    $locale = $request->input('locale');
                    if ($locale && Page::where('slug', $value)->where('locale', $locale)->exists()) {
                        // Specific, human-readable error — replaces the
                        // generic "API Error: 422 Unprocessable Content"
                        // that used to surface in the modal.
                        $fail("A page with slug '{$value}' already exists for locale '{$locale}'. Please choose a different slug or edit the existing page.");
                    }
                },
            ],
            'locale' => 'required|string|size:2|in:en,de,fr,es,it',
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'is_active' => 'boolean',
            'popup_on_landingpage' => 'boolean',
            'popup_on_app' => 'boolean',
            'popup_priority' => 'integer|min:1|max:999',
            'popup_version' => 'integer|min:1',
        ]);

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
