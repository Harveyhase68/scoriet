<?php

namespace App\Services;

use App\Models\Template;
use App\Models\TemplateFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Service for managing compiled template caching
 *
 * Cache Strategy:
 * - Each template file has its own cache entry (not entire template)
 * - Cache key includes file_id, table_name, language_code, updated_at
 * - Only invalidate affected cache entries on file changes
 * - Use Redis tags for efficient bulk invalidation if needed
 */
class TemplateCacheService
{
    /** @var int Number of cache hits in current request */
    private int $cacheHits = 0;

    /** @var int Number of cache misses in current request */
    private int $cacheMisses = 0;

    /**
     * Get cache hit/miss statistics for current request
     */
    public function getHitStats(): array
    {
        $total = $this->cacheHits + $this->cacheMisses;
        return [
            'hits' => $this->cacheHits,
            'misses' => $this->cacheMisses,
            'total' => $total,
            'hit_rate' => $total > 0 ? round(($this->cacheHits / $total) * 100, 1) : 0,
        ];
    }

    /**
     * Reset hit/miss counters (call before a new generation batch)
     */
    public function resetHitStats(): void
    {
        $this->cacheHits = 0;
        $this->cacheMisses = 0;
    }

    /**
     * Build cache key for a compiled template file
     *
     * @param int $templateId
     * @param int $fileId Template file ID (specific file, not entire template)
     * @param string|null $tableName
     * @param string|null $languageCode
     * @param int $fileUpdatedAt Timestamp of file's updated_at
     * @param bool $includeSource Whether to include template source in comments
     * @return string
     */
    public function buildCacheKey(
        int $templateId,
        int $fileId,
        ?string $tableName,
        ?string $languageCode,
        int $fileUpdatedAt,
        bool $includeSource = false
    ): string {
        return sprintf(
            'compiled_template:%d:%d:%s:%s:%d:%s',
            $templateId,
            $fileId,
            $tableName ?? 'project',
            $languageCode ?? 'none',
            $fileUpdatedAt,
            $includeSource ? 'src' : 'nosrc'
        );
    }

    /**
     * Get compiled template from cache or compile if not cached
     *
     * @param int $templateId
     * @param int $fileId
     * @param string|null $tableName
     * @param string|null $languageCode
     * @param callable $compileCallback Callback that compiles the template
     * @param bool $includeSource Whether to include template source in comments
     * @return array Compiled template data
     */
    public function getOrCompile(
        int $templateId,
        int $fileId,
        ?string $tableName,
        ?string $languageCode,
        callable $compileCallback,
        bool $includeSource = false
    ): array {
        // Get file's updated_at timestamp
        $file = TemplateFile::find($fileId);
        if (!$file) {
            throw new \Exception("Template file {$fileId} not found");
        }

        $cacheKey = $this->buildCacheKey(
            $templateId,
            $fileId,
            $tableName,
            $languageCode,
            $file->updated_at->timestamp,
            $includeSource
        );

        // Try cache first, track hit/miss
        $ttl = now()->addHours(24);

        if (config('cache.default') === 'redis') {
            $cached = Cache::tags([
                "template:{$templateId}",
                "template_file:{$fileId}"
            ])->get($cacheKey);

            if ($cached !== null) {
                $this->cacheHits++;
                return $cached;
            }

            $this->cacheMisses++;
            $result = $compileCallback();
            Cache::tags([
                "template:{$templateId}",
                "template_file:{$fileId}"
            ])->put($cacheKey, $result, $ttl);
            return $result;
        } else {
            $cached = Cache::get($cacheKey);

            if ($cached !== null) {
                $this->cacheHits++;
                return $cached;
            }

            $this->cacheMisses++;
            $result = $compileCallback();
            Cache::put($cacheKey, $result, $ttl);
            return $result;
        }
    }

    /**
     * Invalidate cache for a specific template file
     * Only invalidates cache entries related to this file
     *
     * @param int $fileId
     * @return void
     */
    public function invalidateFile(int $fileId): void
    {
        if (config('cache.default') === 'redis') {
            // Redis: Use tags to flush all cache entries for this file
            Cache::tags(["template_file:{$fileId}"])->flush();
        } else {
            // File cache: We can't easily find all keys, so we rely on updated_at
            // When file is updated, updated_at changes → new cache key → old cache expires naturally
        }
    }

    /**
     * Invalidate cache for entire template (all files)
     * Use sparingly - only when template structure changes
     *
     * @param int $templateId
     * @return void
     */
    public function invalidateTemplate(int $templateId): void
    {
        if (config('cache.default') === 'redis') {
            Cache::tags(["template:{$templateId}"])->flush();
        } else {
            // File cache: Touch all template files → updated_at changes
            $template = Template::find($templateId);
            if ($template) {
                $template->files()->each(function ($file) {
                    $file->touch();
                });
            }
        }
    }

    /**
     * Invalidate GTree cache for all projects using a specific template
     *
     * @param int $templateId
     * @return void
     */
    public function invalidateGtreeForTemplate(int $templateId): void
    {
        $projectIds = \Illuminate\Support\Facades\DB::table('project_template_usage')
            ->where('template_id', $templateId)
            ->where('is_active', true)
            ->pluck('project_id')
            ->unique();

        foreach ($projectIds as $projectId) {
            $gtreeCacheKey = "gtree:{$projectId}:{$templateId}";
            Cache::forget($gtreeCacheKey);
        }



    }

    /**
     * Invalidate GTree cache for ALL templates linked to a specific project
     *
     * Use when project-level data changes (settings, languages, variables, etc.)
     *
     * @param int $projectId
     * @return void
     */
    public function invalidateGtreeForProject(int $projectId): void
    {
        $templateIds = \Illuminate\Support\Facades\DB::table('project_template_usage')
            ->where('project_id', $projectId)
            ->where('is_active', true)
            ->pluck('template_id')
            ->unique();

        foreach ($templateIds as $templateId) {
            $gtreeCacheKey = "gtree:{$projectId}:{$templateId}";
            Cache::forget($gtreeCacheKey);
        }
    }

    /**
     * Invalidate compiled template cache for ALL templates linked to a specific project
     *
     * Use when project-level data that affects compilation changes (e.g. template variable values)
     *
     * @param int $projectId
     * @return void
     */
    public function invalidateCompiledForProject(int $projectId): void
    {
        $templateIds = \Illuminate\Support\Facades\DB::table('project_template_usage')
            ->where('project_id', $projectId)
            ->where('is_active', true)
            ->pluck('template_id')
            ->unique();

        if (config('cache.default') === 'redis') {
            foreach ($templateIds as $templateId) {
                Cache::tags(["template:{$templateId}"])->flush();
            }
        }
    }

    /**
     * Clear all template compilation cache
     * Use only for major changes (schema updates, etc.)
     *
     * @return void
     */
    public function clearAll(): void
    {
        if (config('cache.default') === 'redis') {
            $tagsFlushed = 0;
            $keysCleaned = 0;

            // 1. Flush tagged entries via template tags
            $templateIds = Template::pluck('id');
            foreach ($templateIds as $templateId) {
                try {
                    Cache::tags(["template:{$templateId}"])->flush();
                    $tagsFlushed++;
                } catch (\Exception $e) {
                    Log::warning("Failed to flush tag for template {$templateId}: " . $e->getMessage());
                }
            }

            // 2. Also clear un-tagged compiled_template keys using proper prefix
            try {
                $prefix = Cache::getStore()->getPrefix();
                $redis = Cache::getRedis();
                $keys = $redis->keys($prefix . 'compiled_template:*');
                if (!empty($keys)) {
                    $redis->del($keys);
                    $keysCleaned = count($keys);
                }
            } catch (\Exception $e) {
                Log::error("Failed to clear untagged template cache: " . $e->getMessage());
            }

        } else {
            Cache::flush();
        }
    }

    /**
     * Get cache statistics
     *
     * @return array
     */
    public function getStats(): array
    {
        $stats = [
            'driver' => config('cache.default'),
            'supports_tags' => config('cache.default') === 'redis',
        ];

        if (config('cache.default') === 'redis') {
            try {
                $prefix = Cache::getStore()->getPrefix();
                $redis = Cache::getRedis();
                $keys = $redis->keys($prefix . 'compiled_template:*');
                $stats['cached_templates'] = count($keys);

                // Calculate total size
                $totalSize = 0;
                foreach ($keys as $key) {
                    $totalSize += strlen($redis->get($key) ?? '');
                }
                $stats['total_size_mb'] = round($totalSize / 1024 / 1024, 2);
            } catch (\Exception $e) {
                $stats['error'] = $e->getMessage();
            }
        }

        return $stats;
    }
}
