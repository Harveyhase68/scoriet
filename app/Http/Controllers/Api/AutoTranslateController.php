<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;

class AutoTranslateController extends Controller
{
    /**
     * 🤖 AUTO-TRANSLATE TEXT USING GOOGLE TRANSLATE API
     */
    public function translate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'project_id' => 'required|integer|exists:projects,id',
            'text' => 'required|string|max:500',
            'source_language' => 'nullable|string|max:5',
            'target_languages' => 'required|array',
            'target_languages.*' => 'string|max:5',
        ]);

        $projectId = $validated['project_id'];
        $text = $validated['text'];
        $sourceLanguage = $validated['source_language'] ?? null;
        $targetLanguages = $validated['target_languages'];

        // Get project and check access
        $project = Project::find($projectId);
        $user = auth()->user();

        if (!$project) {
            return response()->json(['message' => 'Project not found'], 404);
        }

        // Check if user has access to this project
        if ($project->owner_id !== $user->id && !$project->members()->where('user_id', $user->id)->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Get Google Translate API key
        $apiKey = $project->google_translate_api_key;

        if (empty($apiKey)) {
            return response()->json([
                'message' => 'Google Translate API key not configured for this project. Please add your API key in Project Settings → Localization Settings.'
            ], 400);
        }

        // Translate to each target language
        $translations = [];
        $errors = [];

        \Log::info('Auto-translate request', [
            'project_id' => $projectId,
            'text' => $text,
            'target_languages' => $targetLanguages,
            'api_key_set' => !empty($apiKey)
        ]);

        foreach ($targetLanguages as $targetLang) {
            try {
                $response = Http::get('https://translation.googleapis.com/language/translate/v2', [
                    'key' => $apiKey,
                    'q' => $text,
                    'target' => $targetLang,
                    'source' => $sourceLanguage,
                    'format' => 'text',
                ]);

                \Log::info('Google Translate API response', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                if (!$response->successful()) {
                    $errorData = $response->json();
                    $errors[] = [
                        'language' => $targetLang,
                        'error' => $errorData['error']['message'] ?? 'Translation failed',
                        'full_error' => $errorData
                    ];
                    continue;
                }

                $result = $response->json();

                if (isset($result['data']['translations'][0]['translatedText'])) {
                    $translations[] = [
                        'language' => $targetLang,
                        'text' => $result['data']['translations'][0]['translatedText'],
                    ];
                } else {
                    $errors[] = [
                        'language' => $targetLang,
                        'error' => 'No translation returned'
                    ];
                }

            } catch (\Exception $e) {
                $errors[] = [
                    'language' => $targetLang,
                    'error' => $e->getMessage()
                ];
            }
        }

        // Return results
        if (empty($translations) && !empty($errors)) {
            return response()->json([
                'message' => 'Translation failed for all languages',
                'errors' => $errors
            ], 500);
        }

        return response()->json([
            'success' => true,
            'translations' => $translations,
            'errors' => !empty($errors) ? $errors : null,
        ]);
    }
}
