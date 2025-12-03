<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\TemplateCache;
use App\Services\CacheProgressService;
use App\Jobs\CachePrecompilationJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Redis;

class CacheController extends Controller
{
    /**
     * Get cache statistics and overview
     */
    public function stats()
    {
        try {
            // Use cache connection (database 1) instead of default connection (database 0)
            $redis = Redis::connection('cache');

            // Get the full prefix (combines REDIS_PREFIX + CACHE_PREFIX)
            // Example: scoriet_database_scoriet_cache
            $redisPrefix = config('database.redis.options.prefix') ?: '';
            $cachePrefix = config('cache.prefix') ?: 'scoriet_cache';
            $fullPrefix = $redisPrefix . $cachePrefix;

            // Search for all cache key patterns:
            // 1. Test cache keys: template_*_compiled (old test keys)
            // 2. Template cache keys: compiled_template:* (old compiled templates - deprecated)
            // 3. Schema data cache: schema_data:* (NEW!)
            // 4. Gtree cache: gtree:* (NEW!)
            // IMPORTANT: Don't add fullPrefix here! Laravel's keys() auto-adds prefix
            $testKeys = $redis->executeRaw(['KEYS', $fullPrefix . 'template_*']);
            $compiledKeys = $redis->executeRaw(['KEYS', $fullPrefix . 'compiled_template:*']);
            $schemaKeys = $redis->executeRaw(['KEYS', $fullPrefix . 'schema_data:*']);
            $gtreeKeys = $redis->executeRaw(['KEYS', $fullPrefix . 'gtree:*']);

            // Merge all keys
            $allKeys = array_merge($testKeys, $compiledKeys, $schemaKeys, $gtreeKeys);

            // Get cache info
            $stats = [
                'enabled' => config('scoriet.template_cache.enabled', false),
                'ttl_hours' => config('scoriet.template_cache.ttl_hours', 24),
                'total_entries' => count($allKeys),
                'test_entries' => count($testKeys),
                'compiled_entries' => count($compiledKeys), // Old template cache (deprecated)
                'schema_entries' => count($schemaKeys), // NEW: Schema data cache
                'gtree_entries' => count($gtreeKeys), // NEW: Gtree cache
                'entries' => [],
            ];

            // Get details for each cached template
            // IMPORTANT: keys() returns full keys WITH prefix,
            // so we must use executeRaw() to avoid double-prefixing!
            foreach ($allKeys as $key) {
                // Remove full prefix to get clean key
                $cleanKey = str_replace($fullPrefix, '', $key);

                // Get TTL (time to live in seconds)
                $ttl = $redis->executeRaw(['TTL', $key]);

                // Get value size
                $value = $redis->executeRaw(['GET', $key]);
                $size = strlen($value);

                // Determine type based on key pattern
                $type = 'unknown';
                if (str_starts_with($cleanKey, 'template_')) {
                    $type = 'test';
                } elseif (str_starts_with($cleanKey, 'compiled_template:')) {
                    $type = 'compiled';
                } elseif (str_starts_with($cleanKey, 'schema_data:')) {
                    $type = 'schema';
                } elseif (str_starts_with($cleanKey, 'gtree:')) {
                    $type = 'gtree';
                }

                $stats['entries'][] = [
                    'key' => $cleanKey,
                    'type' => $type,
                    'size_bytes' => $size,
                    'size_kb' => round($size / 1024, 2),
                    'ttl_seconds' => $ttl,
                    'ttl_hours' => $ttl > 0 ? round($ttl / 3600, 2) : null,
                    'expires_at' => $ttl > 0 ? now()->addSeconds($ttl)->toDateTimeString() : null,
                ];
            }

            // Sort by type, then by key
            usort($stats['entries'], function($a, $b) {
                if ($a['type'] === $b['type']) {
                    return strcmp($a['key'], $b['key']);
                }
                return $a['type'] === 'compiled' ? -1 : 1;
            });

            return response()->json($stats);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to get cache stats',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Clear template cache
     */
    public function clear(Request $request)
    {
        try {
            $type = $request->input('type', 'all');

            if ($type === 'template') {
                // Clear only template cache
                $redis = Redis::connection('cache');
                $redisPrefix = config('database.redis.options.prefix') ?: '';
                $cachePrefix = config('cache.prefix') ?: 'scoriet_cache';
                $fullPrefix = $redisPrefix . $cachePrefix;
                // Use executeRaw to avoid double-prefixing
                $templateKeys = $redis->executeRaw(['KEYS', $fullPrefix . 'template_*']);

                foreach ($templateKeys as $key) {
                    $redis->executeRaw(['DEL', $key]);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Template cache cleared',
                    'cleared_keys' => count($templateKeys),
                ]);
            } else {
                // Clear all cache
                Cache::flush();

                return response()->json([
                    'success' => true,
                    'message' => 'All cache cleared',
                ]);
            }
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to clear cache',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Test template generation with cache tracking
     */
    public function testGeneration(Request $request)
    {
        $request->validate([
            'template_id' => 'required|integer|min:1',
            'use_cache' => 'boolean',
        ]);

        $templateId = $request->input('template_id');
        $useCache = $request->input('use_cache', true);

        try {
            $startTime = microtime(true);

            // Get cache key that would be used
            $cacheKey = "template_{$templateId}_compiled";

            // Check if cached version exists
            $isCached = Cache::has($cacheKey);

            // Track cache behavior
            $result = [
                'template_id' => $templateId,
                'cache_enabled' => config('scoriet.template_cache.enabled', false),
                'use_cache_requested' => $useCache,
                'was_cached' => $isCached,
                'cache_key' => $cacheKey,
                'timestamp' => now()->toDateTimeString(),
            ];

            if ($useCache && $isCached) {
                // Get from cache
                $compiled = Cache::get($cacheKey);
                $result['source'] = 'cache';
            } else {
                // Simulate compilation (you can replace this with actual template compilation)
                $compiled = "// Compiled template {$templateId}\n// Generated at " . now()->toDateTimeString();

                // Add some realistic template content
                $compiled .= "\n\n// This is a simulated template compilation";
                $compiled .= "\n// In production, this would contain the actual compiled template code";
                $compiled .= "\n\nfunction generateCode() {";
                $compiled .= "\n  // Template logic here";
                $compiled .= "\n  return 'Generated code for template ID: {$templateId}';";
                $compiled .= "\n}";

                if ($useCache && config('scoriet.template_cache.enabled', false)) {
                    // Store in cache - ensure TTL is integer
                    $ttlHours = (int) config('scoriet.template_cache.ttl_hours', 24);
                    Cache::put($cacheKey, $compiled, now()->addHours($ttlHours));
                    $result['cached_for_hours'] = $ttlHours;
                }

                $result['source'] = 'compilation';
            }

            $endTime = microtime(true);
            $result['execution_time_ms'] = round(($endTime - $startTime) * 1000, 2);
            $result['compiled_size_bytes'] = strlen($compiled);
            $result['compiled_size_kb'] = round(strlen($compiled) / 1024, 2);

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Test generation failed',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Start cache precompilation in background
     */
    public function startPrecompilation(Request $request)
    {
        $request->validate([
            'project_id' => 'nullable|exists:projects,id',
            'template_id' => 'nullable|exists:templates,id',
        ]);

        try {
            $userId = $request->user()->id;
            $projectId = $request->input('project_id');
            $templateId = $request->input('template_id');

            // Dispatch the job to queue
            CachePrecompilationJob::dispatch($userId, $projectId, $templateId);

            return response()->json([
                'success' => true,
                'message' => 'Cache precompilation started in background',
                'user_id' => $userId,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to start cache precompilation',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get cache precompilation progress
     */
    public function getProgress(Request $request)
    {
        try {
            $userId = $request->user()->id;
            $progressService = app(CacheProgressService::class);

            // Get active session for this user
            $progress = $progressService->getActiveSession($userId);

            if (!$progress) {
                return response()->json([
                    'active' => false,
                    'message' => 'No active cache precompilation session',
                ]);
            }

            return response()->json([
                'active' => true,
                'progress' => $progress,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to get progress',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update user online status (heartbeat)
     * Frontend should call this every minute
     */
    public function updateOnlineStatus(Request $request)
    {
        try {
            $userId = $request->user()->id;

            // Store last activity timestamp
            Cache::put("user_online_{$userId}", now(), now()->addMinutes(10));

            return response()->json([
                'success' => true,
                'timestamp' => now()->toDateTimeString(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to update online status',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Inspect cache content - shows RAW Redis keys
     */
    public function inspect()
    {
        try {
            // Use cache connection (database 1)
            $redis = Redis::connection('cache');

            // Get full prefix
            $redisPrefix = config('database.redis.options.prefix') ?: '';
            $cachePrefix = config('cache.prefix') ?: 'scoriet_cache';
            $fullPrefix = $redisPrefix . $cachePrefix;

            // Get ALL keys (be careful in production with lots of data!)
            // Use executeRaw to get RAW keys without prefix manipulation
            $allKeys = $redis->executeRaw(['KEYS', '*']);

            $inspection = [
                'cache_driver' => config('cache.default'),
                'redis_prefix' => $redisPrefix,
                'cache_prefix' => $cachePrefix,
                'full_prefix' => $fullPrefix,
                'redis_database' => config('database.redis.cache.database', '1'),
                'total_redis_keys' => count($allKeys),
                'keys' => [],
            ];

            // Group keys by pattern (only include existing keys)
            // IMPORTANT: keys() returns full keys WITH prefix,
            // so we must use executeRaw() to avoid double-prefixing!
            foreach ($allKeys as $key) {
                $type = $redis->executeRaw(['TYPE', $key]);
                $ttl = $redis->executeRaw(['TTL', $key]);

                // Skip keys that don't exist anymore (type = none, ttl = -2)
                // This happens when keys expire between keys() and type() calls
                if ($type === 'none' || $ttl === -2) {
                    continue;
                }

                $inspection['keys'][] = [
                    'raw_key' => $key,
                    'has_prefix' => str_starts_with($key, $fullPrefix),
                    'type' => $type,
                    'ttl' => $ttl,
                    'ttl_human' => $ttl > 0 ? gmdate('H:i:s', $ttl) : ($ttl === -1 ? 'No Expiry' : 'Expired'),
                    'size_bytes' => strlen($redis->executeRaw(['GET', $key]) ?? ''),
                ];
            }

            // Update count after filtering
            $inspection['total_redis_keys'] = count($inspection['keys']);

            // Sort by key name
            usort($inspection['keys'], function($a, $b) {
                return strcmp($a['raw_key'], $b['raw_key']);
            });

            return response()->json($inspection);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to inspect cache',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Cleanup expired/dead keys from Redis
     */
    public function cleanup()
    {
        try {
            $redis = Redis::connection('cache');
            // Use executeRaw to get RAW keys
            $allKeys = $redis->executeRaw(['KEYS', '*']);
            $removedCount = 0;

            foreach ($allKeys as $key) {
                $type = $redis->executeRaw(['TYPE', $key]);
                $ttl = $redis->executeRaw(['TTL', $key]);

                // Remove keys that are expired or don't exist
                if ($type === 'none' || $ttl === -2) {
                    $redis->executeRaw(['DEL', $key]);
                    $removedCount++;
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Cleaned up {$removedCount} expired/dead keys",
                'removed_count' => $removedCount,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to cleanup cache',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get cache content for a specific key
     */
    public function getContent(Request $request)
    {
        $request->validate([
            'key' => 'required|string',
        ]);

        try {
            $redis = Redis::connection('cache');
            $key = $request->input('key');

            // Use executeRaw to avoid double-prefixing (key already has prefix)
            $value = $redis->executeRaw(['GET', $key]);

            if ($value === null) {
                return response()->json([
                    'found' => false,
                    'key' => $key,
                ]);
            }

            return response()->json([
                'found' => true,
                'key' => $key,
                'type' => $redis->executeRaw(['TYPE', $key]),
                'ttl' => $redis->executeRaw(['TTL', $key]),
                'size_bytes' => strlen($value),
                'content' => $value,
                'content_preview' => substr($value, 0, 500), // First 500 chars
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to get cache content',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
