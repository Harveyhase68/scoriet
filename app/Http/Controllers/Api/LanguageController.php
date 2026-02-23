<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Language;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class LanguageController extends Controller
{
    private function checkSystemAdmin()
    {
        $user = auth()->user();
        if (!$user || $user->user_type !== 'system') {
            abort(403, 'Unauthorized. System admin access required.');
        }
    }

    public function index(): JsonResponse
    {
        $this->checkSystemAdmin();

        $languages = Language::with('creator')
            ->ordered()
            ->get();

        return response()->json($languages);
    }

    public function store(Request $request): JsonResponse
    {
        $this->checkSystemAdmin();

        $validated = $request->validate([
            'code' => 'required|string|max:5|unique:languages,code',
            'name' => 'required|string|max:100',
            'native_name' => 'required|string|max:100',
            'flag' => 'nullable|string|max:10',
            'is_active' => 'boolean',
            'is_default' => 'boolean',
            'sort_order' => 'integer|min:0',
            'description' => 'nullable|string|max:1000'
        ]);

        $validated['created_by'] = auth()->id();

        if (!empty($validated['is_default'])) {
            Language::where('is_default', true)->update(['is_default' => false]);
        }

        $language = Language::create($validated);
        $language->load('creator');

        return response()->json($language, 201);
    }

    public function show(Language $language): JsonResponse
    {
        $this->checkSystemAdmin();

        $language->load('creator');
        return response()->json($language);
    }

    public function update(Request $request, Language $language): JsonResponse
    {
        $this->checkSystemAdmin();

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:5', Rule::unique('languages', 'code')->ignore($language->id)],
            'name' => 'required|string|max:100',
            'native_name' => 'required|string|max:100',
            'flag' => 'nullable|string|max:10',
            'is_active' => 'boolean',
            'is_default' => 'boolean',
            'sort_order' => 'integer|min:0',
            'description' => 'nullable|string|max:1000'
        ]);

        if (!empty($validated['is_default'])) {
            Language::where('is_default', true)->where('id', '!=', $language->id)->update(['is_default' => false]);
        }

        $language->update($validated);
        $language->load('creator');

        return response()->json($language);
    }

    public function destroy(Language $language): JsonResponse
    {
        $this->checkSystemAdmin();

        if ($language->is_default) {
            return response()->json(['error' => __('languagecontrollerphp97')], 422);
        }

        $language->delete();

        return response()->json(['message' => __('languagecontrollerphp102')]);
    }

    public function setDefault(Language $language): JsonResponse
    {
        $this->checkSystemAdmin();

        if (!$language->is_active) {
            return response()->json(['error' => __('languagecontrollerphp110')], 422);
        }

        Language::setDefault($language->id);
        $language->refresh();
        $language->load('creator');

        return response()->json($language);
    }

    public function toggleActive(Language $language): JsonResponse
    {
        $this->checkSystemAdmin();

        if ($language->is_default && $language->is_active) {
            return response()->json(['error' => __('languagecontrollerphp125')], 422);
        }

        $language->update(['is_active' => !$language->is_active]);
        $language->load('creator');

        return response()->json($language);
    }

    // Public endpoint for getting active languages (no admin check)
    public function getActiveLanguages(): JsonResponse
    {
        $languages = Language::active()->ordered()->get();
        return response()->json($languages);
    }
}