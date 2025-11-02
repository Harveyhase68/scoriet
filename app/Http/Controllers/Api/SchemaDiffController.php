<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SchemaDiffService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Schema Diff Controller
 *
 * Vergleicht zwei Schema-Versionen und generiert Migration Scripts
 */
class SchemaDiffController extends Controller
{
    private SchemaDiffService $diffService;

    public function __construct(SchemaDiffService $diffService)
    {
        $this->diffService = $diffService;
    }

    /**
     * Vergleiche zwei Schema-Versionen
     *
     * POST /api/schema-diff/compare
     *
     * Body: {
     *   "from_version_id": 1,
     *   "to_version_id": 2
     * }
     *
     * Response: {
     *   "sql": "-- Migration Script...",
     *   "changes": [...],
     *   "summary": {...},
     *   "from_version": {...},
     *   "to_version": {...}
     * }
     */
    public function compare(Request $request)
    {
        $validated = $request->validate([
            'from_version_id' => 'required|integer|exists:schema_versions,id',
            'to_version_id' => 'required|integer|exists:schema_versions,id',
        ]);

        $fromVersionId = $validated['from_version_id'];
        $toVersionId = $validated['to_version_id'];

        Log::info("Schema Diff requested", [
            'from_version_id' => $fromVersionId,
            'to_version_id' => $toVersionId,
            'user_id' => auth()->id(),
        ]);

        try {
            $result = $this->diffService->compareVersions($fromVersionId, $toVersionId);

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);

        } catch (\Exception $e) {
            Log::error("Schema Diff failed", [
                'from_version_id' => $fromVersionId,
                'to_version_id' => $toVersionId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to compare schema versions: ' . $e->getMessage(),
            ], 500);
        }
    }
}
