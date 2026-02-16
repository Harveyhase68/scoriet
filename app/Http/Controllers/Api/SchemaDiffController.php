<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PerformanceMetric;
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
     *   "to_version_id": 2,
     *   "dialect": "mysql" // optional: mysql, pgsql, sqlite, sqlsrv
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
            'dialect' => 'nullable|string|in:mysql,pgsql,sqlite,sqlsrv',
        ]);

        $fromVersionId = $validated['from_version_id'];
        $toVersionId = $validated['to_version_id'];
        $dialect = $validated['dialect'] ?? 'mysql'; // Default to MySQL

        $startTime = microtime(true);

        try {
            $result = $this->diffService->compareVersions($fromVersionId, $toVersionId, $dialect);

            // Track performance
            $duration = (int) ((microtime(true) - $startTime) * 1000);
            $user = auth()->user();
            try {
                $changesCount = count($result['changes'] ?? []);
                PerformanceMetric::create([
                    'user_id' => $user?->id,
                    'operation' => PerformanceMetric::OP_DIFF_COMPUTE,
                    'operation_detail' => "v{$fromVersionId} → v{$toVersionId} ({$dialect})",
                    'duration_ms' => $duration,
                    'memory_peak_mb' => (int) (memory_get_peak_usage(true) / 1024 / 1024),
                    'tables_count' => $changesCount,
                    'fields_count' => null,
                    'from_cache' => false,
                    'subscription_type' => $user?->subscription?->type ?? 'free',
                    'metadata' => [
                        'from_version_id' => $fromVersionId,
                        'to_version_id' => $toVersionId,
                        'dialect' => $dialect,
                        'changes_count' => $changesCount,
                    ],
                    'created_at' => now(),
                ]);
            } catch (\Exception $trackingError) {
                Log::error("Performance tracking failed: " . $trackingError->getMessage());
            }

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
