<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PerformanceTrackingService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PerformanceMetricsController extends Controller
{
    /**
     * Check if the current user is an admin
     */
    private function checkAdminAccess(): void
    {
        $user = auth()->user();
        if (!$user || !$user->isAdmin()) {
            abort(403, 'Admin access required');
        }
    }

    /**
     * Get overview of all performance metrics
     */
    public function overview(Request $request): JsonResponse
    {
        $this->checkAdminAccess();

        $from = $request->filled('from') ? Carbon::parse($request->from)->startOfDay() : Carbon::now()->subDays(30)->startOfDay();
        $to = $request->filled('to') ? Carbon::parse($request->to)->endOfDay() : Carbon::now()->endOfDay();

        $data = PerformanceTrackingService::getOverview($from, $to);

        return response()->json([
            'success' => true,
            'data' => $data,
            'period' => [
                'from' => $from->toIso8601String(),
                'to' => $to->toIso8601String(),
            ],
        ]);
    }

    /**
     * Get daily statistics
     */
    public function daily(Request $request): JsonResponse
    {
        $this->checkAdminAccess();

        $from = $request->filled('from') ? Carbon::parse($request->from)->startOfDay() : Carbon::now()->subDays(30)->startOfDay();
        $to = $request->filled('to') ? Carbon::parse($request->to)->endOfDay() : Carbon::now()->endOfDay();

        $data = PerformanceTrackingService::getDailyStats($from, $to);

        return response()->json([
            'success' => true,
            'data' => $data,
            'period' => [
                'from' => $from->toIso8601String(),
                'to' => $to->toIso8601String(),
            ],
        ]);
    }

    /**
     * Get details for a specific operation
     */
    public function operation(Request $request, string $operation): JsonResponse
    {
        $this->checkAdminAccess();

        $from = $request->filled('from') ? Carbon::parse($request->from)->startOfDay() : Carbon::now()->subDays(30)->startOfDay();
        $to = $request->filled('to') ? Carbon::parse($request->to)->endOfDay() : Carbon::now()->endOfDay();

        $data = PerformanceTrackingService::getOperationStats($operation, $from, $to);

        return response()->json([
            'success' => true,
            'data' => $data,
            'period' => [
                'from' => $from->toIso8601String(),
                'to' => $to->toIso8601String(),
            ],
        ]);
    }

    /**
     * Get slowest operations
     */
    public function slow(Request $request): JsonResponse
    {
        $this->checkAdminAccess();

        $limit = $request->input('limit', 50);
        $from = $request->filled('from') ? Carbon::parse($request->from)->startOfDay() : Carbon::now()->subDays(7)->startOfDay();
        $to = $request->filled('to') ? Carbon::parse($request->to)->endOfDay() : Carbon::now()->endOfDay();

        $data = PerformanceTrackingService::getSlowOperations($limit, $from, $to);

        return response()->json([
            'success' => true,
            'data' => $data,
            'period' => [
                'from' => $from->toIso8601String(),
                'to' => $to->toIso8601String(),
            ],
        ]);
    }

    /**
     * Get hourly distribution (for heatmap)
     */
    public function hourly(Request $request): JsonResponse
    {
        $this->checkAdminAccess();

        $operation = $request->input('operation');
        $from = $request->filled('from') ? Carbon::parse($request->from)->startOfDay() : Carbon::now()->subDays(7)->startOfDay();
        $to = $request->filled('to') ? Carbon::parse($request->to)->endOfDay() : Carbon::now()->endOfDay();

        $data = PerformanceTrackingService::getHourlyDistribution($operation, $from, $to);

        return response()->json([
            'success' => true,
            'data' => $data,
            'period' => [
                'from' => $from->toIso8601String(),
                'to' => $to->toIso8601String(),
            ],
        ]);
    }

    /**
     * Get statistics by subscription type
     */
    public function bySubscription(Request $request): JsonResponse
    {
        $this->checkAdminAccess();

        $from = $request->filled('from') ? Carbon::parse($request->from)->startOfDay() : Carbon::now()->subDays(30)->startOfDay();
        $to = $request->filled('to') ? Carbon::parse($request->to)->endOfDay() : Carbon::now()->endOfDay();

        $data = PerformanceTrackingService::getStatsBySubscription($from, $to);

        return response()->json([
            'success' => true,
            'data' => $data,
            'period' => [
                'from' => $from->toIso8601String(),
                'to' => $to->toIso8601String(),
            ],
        ]);
    }

    /**
     * Cleanup old metrics (admin only)
     */
    public function cleanup(Request $request): JsonResponse
    {
        $this->checkAdminAccess();

        $keepDays = $request->input('keep_days', 90);
        $deleted = PerformanceTrackingService::cleanup($keepDays);

        return response()->json([
            'success' => true,
            'deleted' => $deleted,
            'message' => "Deleted {$deleted} metrics older than {$keepDays} days",
        ]);
    }
}
