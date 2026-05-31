<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PerformanceMetric;
use App\Models\SchemaTranslation;
use App\Models\Language;
use App\Models\Project;
use App\Models\SchemaVersion;
use App\Models\SchemaTable;
use App\Models\SchemaField;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class SchemaTranslationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $startTime = microtime(true);

        $query = SchemaTranslation::with(['creator', 'language']);

        // Filter by language code
        if ($request->has('code')) {
            $query->where('code', $request->code);
        }

        // Filter by item name (table or field)
        if ($request->has('item_name')) {
            $query->where('item_name', 'like', '%' . $request->item_name . '%');
        }

        // Filter by item type (table or field)
        if ($request->has('item_type')) {
            if ($request->item_type === 'table') {
                $query->whereRaw('item_name NOT LIKE "%%.%"');
            } elseif ($request->item_type === 'field') {
                $query->whereRaw('item_name LIKE "%%.%"');
            }
        }

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $translations = $query->orderBy('item_name')->orderBy('code')->get();

        // Track performance
        $duration = (int) ((microtime(true) - $startTime) * 1000);
        $user = auth()->user();
        try {
            PerformanceMetric::create([
                'user_id' => $user?->id,
                'operation' => PerformanceMetric::OP_TRANSLATION_LOAD,
                'operation_detail' => $request->get('code', 'all languages'),
                'duration_ms' => $duration,
                'memory_peak_mb' => (int) (memory_get_peak_usage(true) / 1024 / 1024),
                'tables_count' => $translations->count(),
                'fields_count' => null,
                'from_cache' => false,
                'subscription_type' => $user?->subscription?->type ?? 'free',
                'created_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::error("Performance tracking failed: " . $e->getMessage());
        }

        return response()->json($translations);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'item_name' => 'required|string|max:255',
            'code' => 'required|string|max:5|exists:languages,code',
            'translated_text' => 'required|string|max:65535',
            'description' => 'nullable|string|max:1000',
            'is_active' => 'boolean'
        ]);

        $validated['created_by'] = auth()->id();

        try {
            $translation = SchemaTranslation::create($validated);
            $translation->load(['creator', 'language']);

            return response()->json($translation, 201);
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() === '23000') {
                return response()->json([
                    'error' => 'Translation already exists for this item and language.'
                ], 422);
            }
            throw $e;
        }
    }

    public function show(SchemaTranslation $schemaTranslation): JsonResponse
    {
        $schemaTranslation->load(['creator', 'language']);
        return response()->json($schemaTranslation);
    }

    public function update(Request $request, SchemaTranslation $schemaTranslation): JsonResponse
    {
        // BOLA guard: only the user who created the translation may edit it.
        // Schema translations are scoped to the creating user — letting any
        // authenticated user overwrite anyone's translation would corrupt
        // the global registry.
        if ((string)$schemaTranslation->created_by !== (string)auth()->id()) {
            return response()->json(['error' => 'You do not have permission to edit this translation.'], 403);
        }

        $validated = $request->validate([
            'item_name' => 'required|string|max:255',
            'code' => 'required|string|max:5|exists:languages,code',
            'translated_text' => 'required|string|max:65535',
            'description' => 'nullable|string|max:1000',
            'is_active' => 'boolean'
        ]);

        // Check if the combination would create a duplicate (excluding current record)
        $existingTranslation = SchemaTranslation::where('item_name', $validated['item_name'])
            ->where('code', $validated['code'])
            ->where('id', '!=', $schemaTranslation->id)
            ->first();

        if ($existingTranslation) {
            return response()->json([
                'error' => 'Translation already exists for this item and language.'
            ], 422);
        }

        $schemaTranslation->update($validated);
        $schemaTranslation->load(['creator', 'language']);

        return response()->json($schemaTranslation);
    }

    public function destroy(SchemaTranslation $schemaTranslation): JsonResponse
    {
        // BOLA guard: only the creator may delete.
        if ((string)$schemaTranslation->created_by !== (string)auth()->id()) {
            return response()->json(['error' => 'You do not have permission to delete this translation.'], 403);
        }

        $schemaTranslation->delete();
        return response()->json(['message' => 'Translation deleted successfully.']);
    }

    public function toggleActive(SchemaTranslation $schemaTranslation): JsonResponse
    {
        // BOLA guard: toggling is_active is a state change, restricted to
        // the creator — same rule as update/destroy above.
        if ((string)$schemaTranslation->created_by !== (string)auth()->id()) {
            return response()->json(['error' => 'You do not have permission to toggle this translation.'], 403);
        }

        $schemaTranslation->update(['is_active' => !$schemaTranslation->is_active]);
        $schemaTranslation->load(['creator', 'language']);

        return response()->json($schemaTranslation);
    }

    // Get all available schema items (tables and fields) from current project's schema
    public function getAvailableItems(Request $request): JsonResponse
    {
        $user = auth()->user();

        // Get project_id from request
        $projectId = $request->get('project_id');

        if (!$projectId) {
            return response()->json([
                'error' => 'project_id parameter is required'
            ], 400);
        }

        // Get the project and check user access
        $project = Project::find($projectId);
        if (!$project || !$project->isVisibleTo($user)) {
            return response()->json([
                'error' => 'Project not found or access denied'
            ], 404);
        }

        // Get ALL floating schemas for this project
        $projectSchemas = $project->floatingSchemas;

        if ($projectSchemas->isEmpty()) {
            return response()->json([
                'tables' => []
            ]);
        }

        // Collect tables from ALL schemas (not just the first one)
        $allTables = collect();

        foreach ($projectSchemas as $schema) {
            // Get latest version of this schema
            $latestVersion = $schema->versions()
                ->orderByDesc('version_number')
                ->first();

            if ($latestVersion) {
                // Get tables with fields for this schema version
                $tables = $latestVersion->tables()
                    ->with('fields')
                    ->get();

                // Add schema name to each table for context
                $tables->each(function ($table) use ($schema) {
                    $table->schema_name = $schema->name;
                });

                $allTables = $allTables->merge($tables);
            }
        }

        // Sort all tables by name
        $allTables = $allTables->sortBy('table_name');

        $schemaStructure = $allTables->map(function ($table) {
            return [
                'id' => $table->id,
                'table_name' => $table->table_name,
                'comment' => $table->comment,
                'schema_name' => $table->schema_name ?? 'Unknown', // Include schema name
                'fields' => $table->fields->map(function ($field) {
                    return [
                        'id' => $field->id,
                        'field_name' => $field->field_name,
                        'field_type' => strtolower($field->field_type),
                        'field_order' => $field->field_order,
                        'comment' => $field->comment,
                        'control_type' => $field->control_type ?? 'TEXT',
                    ];
                })->toArray()
            ];
        })->values()->toArray();

        return response()->json([
            'tables' => $schemaStructure,
            'schemas_count' => $projectSchemas->count(),
            'tables_count' => $allTables->count()
        ]);
    }

    // Get translation for specific item and language
    public function getTranslation(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'item_name' => 'required|string',
            'code' => 'required|string|exists:languages,code'
        ]);

        $translation = SchemaTranslation::getTranslation(
            $validated['item_name'],
            $validated['code']
        );

        return response()->json([
            'item_name' => $validated['item_name'],
            'code' => $validated['code'],
            'translated_text' => $translation
        ]);
    }

    // Get all translations for a specific item across all languages
    public function getItemTranslations(Request $request, string $itemName): JsonResponse
    {
        $startTime = microtime(true);

        $translations = SchemaTranslation::getAllTranslationsForItem($itemName);

        // Track performance
        $duration = (int) ((microtime(true) - $startTime) * 1000);
        $user = auth()->user();
        try {
            PerformanceMetric::create([
                'user_id' => $user?->id,
                'operation' => PerformanceMetric::OP_TRANSLATION_LOAD,
                'operation_detail' => $itemName,
                'duration_ms' => $duration,
                'memory_peak_mb' => (int) (memory_get_peak_usage(true) / 1024 / 1024),
                'tables_count' => count($translations),
                'fields_count' => null,
                'from_cache' => false,
                'subscription_type' => $user?->subscription?->type ?? 'free',
                'created_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::error("Performance tracking failed: " . $e->getMessage());
        }

        return response()->json([
            'item_name' => $itemName,
            'translations' => $translations
        ]);
    }

    // Bulk update translations for multiple languages
    public function bulkUpdate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'item_name' => 'required|string|max:255',
            'translations' => 'required|array',
            'translations.*.code' => 'required|string|max:5|exists:languages,code',
            'translations.*.translated_text' => 'required|string|max:65535',
            'translations.*.description' => 'nullable|string|max:1000'
        ]);

        $results = [];

        foreach ($validated['translations'] as $translationData) {
            $translation = SchemaTranslation::setTranslation(
                $validated['item_name'],
                $translationData['code'],
                $translationData['translated_text'],
                $translationData['description'] ?? null
            );

            $translation->load(['creator', 'language']);
            $results[] = $translation;
        }

        return response()->json([
            'message' => 'Translations updated successfully.',
            'translations' => $results
        ]);
    }
}