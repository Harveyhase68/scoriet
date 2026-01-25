<?php

namespace App\Services;

use App\Models\PerformanceMetric;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class PerformanceTrackingService
{
    /**
     * Track the execution of an operation
     *
     * @param string $operation The operation type (use PerformanceMetric constants)
     * @param callable $callback The code to execute and measure
     * @param array $context Additional context data
     * @return mixed The result of the callback
     */
    public static function track(string $operation, callable $callback, array $context = []): mixed
    {
        $startTime = microtime(true);
        $startMemory = memory_get_usage(true);

        try {
            $result = $callback();
        } finally {
            $duration = (int)((microtime(true) - $startTime) * 1000);
            $memoryPeak = (int)(memory_get_peak_usage(true) / 1024 / 1024);

            try {
                PerformanceMetric::create([
                    'user_id' => auth()->id(),
                    'operation' => $operation,
                    'operation_detail' => $context['detail'] ?? null,
                    'duration_ms' => $duration,
                    'memory_peak_mb' => $memoryPeak,
                    'tables_count' => $context['tables_count'] ?? null,
                    'fields_count' => $context['fields_count'] ?? null,
                    'from_cache' => $context['from_cache'] ?? false,
                    'subscription_type' => self::getSubscriptionType(),
                    'metadata' => $context['metadata'] ?? null,
                    'created_at' => now(),
                ]);
            } catch (\Exception $e) {
                \Log::error("Performance tracking failed: {$e->getMessage()}");
            }
        }

        return $result;
    }

    /**
     * Get the current user's subscription type
     */
    private static function getSubscriptionType(): ?string
    {
        $user = auth()->user();
        if (!$user) {
            return null;
        }

        $subscription = $user->subscription;
        return $subscription?->type ?? 'free';
    }

    /**
     * Get statistics for a specific operation
     */
    public static function getOperationStats(string $operation, ?Carbon $from = null, ?Carbon $to = null): array
    {
        $query = PerformanceMetric::forOperation($operation)
            ->inDateRange($from, $to);

        $stats = $query->selectRaw('
            COUNT(*) as total_count,
            AVG(duration_ms) as avg_duration,
            MAX(duration_ms) as max_duration,
            MIN(duration_ms) as min_duration,
            AVG(memory_peak_mb) as avg_memory,
            SUM(CASE WHEN from_cache = 1 THEN 1 ELSE 0 END) as cache_hits
        ')->first();

        return [
            'operation' => $operation,
            'label' => PerformanceMetric::OPERATION_LABELS[$operation] ?? $operation,
            'total_count' => (int) $stats->total_count,
            'avg_duration_ms' => (int) round($stats->avg_duration ?? 0),
            'max_duration_ms' => (int) ($stats->max_duration ?? 0),
            'min_duration_ms' => (int) ($stats->min_duration ?? 0),
            'avg_memory_mb' => (int) round($stats->avg_memory ?? 0),
            'cache_hit_rate' => $stats->total_count > 0
                ? round(($stats->cache_hits / $stats->total_count) * 100, 1)
                : 0,
        ];
    }

    /**
     * Get overview statistics for all operations
     */
    public static function getOverview(?Carbon $from = null, ?Carbon $to = null): array
    {
        $operations = [
            PerformanceMetric::OP_GENERATION,
            PerformanceMetric::OP_SCHEMA_LOAD,
            PerformanceMetric::OP_GTREE_BUILD,
            PerformanceMetric::OP_DIFF_COMPUTE,
            PerformanceMetric::OP_TRANSLATION_LOAD,
        ];

        $result = [];
        foreach ($operations as $operation) {
            $result[$operation] = self::getOperationStats($operation, $from, $to);
        }

        // Add totals
        $totals = PerformanceMetric::inDateRange($from, $to)
            ->selectRaw('
                COUNT(*) as total_operations,
                COUNT(DISTINCT user_id) as unique_users,
                SUM(duration_ms) as total_duration_ms
            ')
            ->first();

        $result['_totals'] = [
            'total_operations' => (int) $totals->total_operations,
            'unique_users' => (int) $totals->unique_users,
            'total_duration_ms' => (int) $totals->total_duration_ms,
        ];

        return $result;
    }

    /**
     * Get daily statistics grouped by date
     */
    public static function getDailyStats(?Carbon $from = null, ?Carbon $to = null): Collection
    {
        $from = $from ?? Carbon::now()->subDays(30);
        $to = $to ?? Carbon::now();

        return PerformanceMetric::inDateRange($from, $to)
            ->selectRaw('
                DATE(created_at) as date,
                operation,
                COUNT(*) as count,
                AVG(duration_ms) as avg_duration,
                MAX(duration_ms) as max_duration,
                SUM(CASE WHEN from_cache = 1 THEN 1 ELSE 0 END) as cache_hits
            ')
            ->groupBy('date', 'operation')
            ->orderBy('date')
            ->get()
            ->groupBy('date')
            ->map(function ($dayData, $date) {
                $result = ['date' => $date];
                foreach ($dayData as $opData) {
                    $result[$opData->operation] = [
                        'count' => (int) $opData->count,
                        'avg_duration' => (int) round($opData->avg_duration),
                        'max_duration' => (int) $opData->max_duration,
                        'cache_hits' => (int) $opData->cache_hits,
                    ];
                }
                return $result;
            })
            ->values();
    }

    /**
     * Get the slowest operations
     */
    public static function getSlowOperations(int $limit = 50, ?Carbon $from = null, ?Carbon $to = null): Collection
    {
        return PerformanceMetric::with('user:id,name,email')
            ->inDateRange($from, $to)
            ->orderByDesc('duration_ms')
            ->limit($limit)
            ->get()
            ->map(function ($metric) {
                return [
                    'id' => $metric->id,
                    'operation' => $metric->operation,
                    'operation_label' => $metric->operation_label,
                    'operation_detail' => $metric->operation_detail,
                    'duration_ms' => $metric->duration_ms,
                    'formatted_duration' => $metric->formatted_duration,
                    'memory_mb' => $metric->memory_peak_mb,
                    'tables_count' => $metric->tables_count,
                    'fields_count' => $metric->fields_count,
                    'from_cache' => $metric->from_cache,
                    'subscription_type' => $metric->subscription_type,
                    'user' => $metric->user ? [
                        'id' => $metric->user->id,
                        'name' => $metric->user->name,
                        'email' => $metric->user->email,
                    ] : null,
                    'created_at' => $metric->created_at->toIso8601String(),
                ];
            });
    }

    /**
     * Get hourly distribution of operations (for heatmap)
     */
    public static function getHourlyDistribution(?string $operation = null, ?Carbon $from = null, ?Carbon $to = null): array
    {
        $from = $from ?? Carbon::now()->subDays(7);
        $to = $to ?? Carbon::now();

        $query = PerformanceMetric::inDateRange($from, $to);

        if ($operation) {
            $query->forOperation($operation);
        }

        $data = $query->selectRaw('
            DAYOFWEEK(created_at) as day_of_week,
            HOUR(created_at) as hour,
            COUNT(*) as count,
            AVG(duration_ms) as avg_duration
        ')
            ->groupBy('day_of_week', 'hour')
            ->get();

        // Initialize empty grid (7 days x 24 hours)
        $grid = [];
        for ($day = 1; $day <= 7; $day++) {
            for ($hour = 0; $hour < 24; $hour++) {
                $grid[$day][$hour] = ['count' => 0, 'avg_duration' => 0];
            }
        }

        // Fill in the data
        foreach ($data as $row) {
            $grid[$row->day_of_week][$row->hour] = [
                'count' => (int) $row->count,
                'avg_duration' => (int) round($row->avg_duration),
            ];
        }

        return $grid;
    }

    /**
     * Get statistics grouped by subscription type
     */
    public static function getStatsBySubscription(?Carbon $from = null, ?Carbon $to = null): Collection
    {
        return PerformanceMetric::inDateRange($from, $to)
            ->selectRaw('
                subscription_type,
                operation,
                COUNT(*) as count,
                AVG(duration_ms) as avg_duration,
                SUM(duration_ms) as total_duration
            ')
            ->groupBy('subscription_type', 'operation')
            ->get()
            ->groupBy('subscription_type');
    }

    /**
     * Clean up old metrics (keep last N days)
     */
    public static function cleanup(int $keepDays = 90): int
    {
        $cutoff = Carbon::now()->subDays($keepDays);
        return PerformanceMetric::where('created_at', '<', $cutoff)->delete();
    }
}
