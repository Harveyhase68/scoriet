<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Service for tracking cache precompilation progress
 * Stores progress in Redis for real-time updates
 */
class CacheProgressService
{
    /**
     * Start a new cache precompilation session
     */
    public function start(int $userId, int $totalItems): string
    {
        $sessionId = 'cache_progress_' . $userId . '_' . time();

        $data = [
            'user_id' => $userId,
            'total_items' => $totalItems,
            'completed_items' => 0,
            'percentage' => 0,
            'status' => 'running', // running, completed, failed
            'started_at' => now()->toDateTimeString(),
            'updated_at' => now()->toDateTimeString(),
            'current_item' => null,
        ];

        Cache::put($sessionId, $data, now()->addHours(24));

        return $sessionId;
    }

    /**
     * Update progress for a session
     */
    public function update(string $sessionId, int $completedItems, ?string $currentItem = null): void
    {
        $data = Cache::get($sessionId);

        if (!$data) {
            Log::warning("Cache precompilation session not found", ['session_id' => $sessionId]);
            return;
        }

        $data['completed_items'] = $completedItems;
        $data['percentage'] = $data['total_items'] > 0
            ? round(($completedItems / $data['total_items']) * 100, 2)
            : 0;
        $data['updated_at'] = now()->toDateTimeString();
        $data['current_item'] = $currentItem;

        Cache::put($sessionId, $data, now()->addHours(24));
    }

    /**
     * Mark session as completed
     */
    public function complete(string $sessionId): void
    {
        $data = Cache::get($sessionId);

        if (!$data) {
            return;
        }

        $data['status'] = 'completed';
        $data['percentage'] = 100;
        $data['completed_at'] = now()->toDateTimeString();
        $data['updated_at'] = now()->toDateTimeString();

        Cache::put($sessionId, $data, now()->addHours(24));
    }

    /**
     * Mark session as failed
     */
    public function fail(string $sessionId, string $error): void
    {
        $data = Cache::get($sessionId);

        if (!$data) {
            return;
        }

        $data['status'] = 'failed';
        $data['error'] = $error;
        $data['failed_at'] = now()->toDateTimeString();
        $data['updated_at'] = now()->toDateTimeString();

        Cache::put($sessionId, $data, now()->addHours(24));

        Log::error("Cache precompilation failed", ['session_id' => $sessionId, 'error' => $error]);
    }

    /**
     * Get progress data for a session
     */
    public function get(string $sessionId): ?array
    {
        return Cache::get($sessionId);
    }

    /**
     * Get active session for a user
     */
    public function getActiveSession(int $userId): ?array
    {
        // Find the most recent session for this user
        $pattern = "cache_progress_{$userId}_*";

        try {
            $redis = Cache::getRedis();
            $cachePrefix = config('cache.prefix') ?: 'scoriet_cache';
            $keys = $redis->keys($cachePrefix . ':' . $pattern);

            if (empty($keys)) {
                return null;
            }

            // Sort by timestamp (newest first)
            rsort($keys);

            // Get the most recent session
            foreach ($keys as $key) {
                $cleanKey = str_replace($cachePrefix . ':', '', $key);
                $data = $this->get($cleanKey);

                if ($data && $data['status'] === 'running') {
                    $data['session_id'] = $cleanKey;
                    return $data;
                }
            }

            return null;
        } catch (\Exception $e) {
            Log::error("Failed to get active cache session", [
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Get overall cache statistics for a project
     */
    public function getProjectCacheStats(int $projectId): array
    {
        // This would check how many templates are cached vs total
        // For now, return basic stats
        return [
            'project_id' => $projectId,
            'total_templates' => 0,
            'cached_templates' => 0,
            'cache_percentage' => 0,
        ];
    }
}
