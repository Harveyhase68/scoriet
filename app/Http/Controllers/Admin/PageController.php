<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Page;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;

class PageController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $pages = Page::orderBy('slug')->orderBy('locale')->get();

        return view('admin.pages.index', compact('pages'));
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
            'slug' => 'required|string|max:255',
            'locale' => 'required|string|size:2|in:en,de,fr,es,it',
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'is_active' => 'boolean',
        ]);

        // Check if slug + locale combination already exists
        $exists = Page::where('slug', $validated['slug'])
                     ->where('locale', $validated['locale'])
                     ->exists();

        if ($exists) {
            return back()->withErrors(['slug' => 'A page with this slug already exists for the selected language.'])->withInput();
        }

        Page::create($validated);

        return Redirect::route('admin.pages.index')->with('success', 'Page created successfully.');
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
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'is_active' => 'boolean',
        ]);

        $page->update($request->only(['title', 'content', 'is_active']));

        return Redirect::route('admin.pages.index')->with('success', 'Page updated successfully.');
    }
}
