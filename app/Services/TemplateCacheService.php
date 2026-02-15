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

        // Try cache with tags for easier invalidation
        $ttl = now()->addHours(24);

        if (config('cache.default') === 'redis') {
            // Redis supports tags - use them for bulk invalidation
            return Cache::tags([
                "template:{$templateId}",
                "template_file:{$fileId}"
            ])->remember($cacheKey, $ttl, $compileCallback);
        } else {
            // File cache doesn't support tags - use simple key
            return Cache::remember($cacheKey, $ttl, $compileCallback);
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
            Log::info("Cache invalidated for template_file:{$fileId} (Redis tags)");
        } else {
            // File cache: We can't easily find all keys, so we rely on updated_at
            // When file is updated, updated_at changes → new cache key → old cache expires naturally
            Log::info("Cache will auto-invalidate for template_file:{$fileId} (updated_at changed)");
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
            Log::info("Cache invalidated for template:{$templateId} (Redis tags)");
        } else {
            // File cache: Touch all template files → updated_at changes
            $template = Template::find($templateId);
            if ($template) {
                $template->files()->each(function ($file) {
                    $file->touch();
                });
            }
            Log::info("Cache will auto-invalidate for template:{$templateId} (files touched)");
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

        if ($projectIds->isNotEmpty()) {
            Log::info("GTree cache invalidated for template {$templateId} across " . $projectIds->count() . " projects");
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

            Log::info("All template compilation cache cleared", [
                'tags_flushed' => $tagsFlushed,
                'untagged_keys_cleaned' => $keysCleaned,
            ]);
        } else {
            Cache::flush();
            Log::info("All cache cleared (file cache)");
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
