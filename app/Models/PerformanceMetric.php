<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Carbon\Carbon;

class PerformanceMetric extends Model
{
    /**
     * Disable updated_at since we only track creation time
     */
    const UPDATED_AT = null;

    /**
     * Operation type constants
     */
    const OP_GENERATION = 'generation';
    const OP_SCHEMA_LOAD = 'schema_load';
    const OP_GTREE_BUILD = 'gtree_build';
    const OP_DIFF_COMPUTE = 'diff_compute';
    const OP_TRANSLATION_LOAD = 'translation_load';

    /**
     * Human-readable operation labels
     */
    const OPERATION_LABELS = [
        self::OP_GENERATION => 'Code Generation',
        self::OP_SCHEMA_LOAD => 'Schema Loading',
        self::OP_GTREE_BUILD => 'Gtree Building',
        self::OP_DIFF_COMPUTE => 'Diff Computation',
        self::OP_TRANSLATION_LOAD => 'Translation Loading',
    ];

    protected $fillable = [
        'user_id',
        'operation',
        'operation_detail',
        'duration_ms',
        'memory_peak_mb',
        'tables_count',
        'fields_count',
        'from_cache',
        'subscription_type',
        'metadata',
        'created_at',
    ];

    protected $casts = [
        'duration_ms' => 'integer',
        'memory_peak_mb' => 'integer',
        'tables_count' => 'integer',
        'fields_count' => 'integer',
        'from_cache' => 'boolean',
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    /**
     * Get the user that triggered this metric
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope: Filter by operation type
     */
    public function scopeForOperation(Builder $query, string $operation): Builder
    {
        return $query->where('operation', $operation);
    }

    /**
     * Scope: Filter by date range
     */
    public function scopeInDateRange(Builder $query, ?Carbon $from = null, ?Carbon $to = null): Builder
    {
        if ($from) {
            $query->where('created_at', '>=', $from);
        }
        if ($to) {
            $query->where('created_at', '<=', $to);
        }
        return $query;
    }

    /**
     * Scope: Get slow operations (above average duration for that operation type)
     */
    public function scopeSlow(Builder $query): Builder
    {
        return $query->whereRaw('duration_ms > (SELECT AVG(duration_ms) FROM performance_metrics pm2 WHERE pm2.operation = performance_metrics.operation)');
    }

    /**
     * Scope: Filter by today
     */
    public function scopeToday(Builder $query): Builder
    {
        return $query->whereDate('created_at', Carbon::today());
    }

    /**
     * Scope: Filter by this week
     */
    public function scopeThisWeek(Builder $query): Builder
    {
        return $query->where('created_at', '>=', Carbon::now()->startOfWeek());
    }

    /**
     * Scope: Filter by this month
     */
    public function scopeThisMonth(Builder $query): Builder
    {
        return $query->where('created_at', '>=', Carbon::now()->startOfMonth());
    }

    /**
     * Get human-readable operation label
     */
    public function getOperationLabelAttribute(): string
    {
        return self::OPERATION_LABELS[$this->operation] ?? $this->operation;
    }

    /**
     * Get formatted duration (e.g., "1.5s" or "150ms")
     */
    public function getFormattedDurationAttribute(): string
    {
        if ($this->duration_ms >= 1000) {
            return round($this->duration_ms / 1000, 2) . 's';
        }
        return $this->duration_ms . 'ms';
    }

    /**
     * Get formatted memory (e.g., "256 MB")
     */
    public function getFormattedMemoryAttribute(): string
    {
        return $this->memory_peak_mb ? $this->memory_peak_mb . ' MB' : '-';
    }
}
