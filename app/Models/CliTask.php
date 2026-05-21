<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CliTask extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_type',
        'status',
        'priority',
        'user_id',
        'project_id',
        'target_device_id',
        'payload',
        'result',
        'logs',
        'error_message',
        'retry_count',
        'max_retries',
        'started_at',
        'completed_at',
        'failed_at',
    ];

    protected $casts = [
        'payload' => 'array',
        'result' => 'array',
        'priority' => 'integer',
        'retry_count' => 'integer',
        'max_retries' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'failed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Task types constants
    const TYPE_DATABASE_IMPORT = 'database_import';
    const TYPE_DATABASE_EXPORT = 'database_export';
    const TYPE_PROJECT_DOWNLOAD = 'project_download';
    const TYPE_TEMPLATE_UPLOAD = 'template_upload';
    const TYPE_FILE_EDIT = 'file_edit';
    const TYPE_CONNECTION_TEST = 'connection_test';
    const TYPE_DATA_QUERY = 'data_query';

    // Status constants
    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';

    /**
     * How long a pending task may wait to be picked up before it is
     * considered stale (in minutes). Tasks older than this MUST NOT be
     * served by getQueue and SHOULD be auto-failed by the cleanup
     * scheduler. Different types get different TTLs because user-interactive
     * actions (connection test, single-row preview) become useless quickly,
     * while database import/export and full project deploys can legitimately
     * sit a while if the service was offline.
     */
    const PICKUP_TIMEOUT_MINUTES = [
        self::TYPE_CONNECTION_TEST => 5,
        self::TYPE_DATA_QUERY      => 5,
        self::TYPE_PROJECT_DOWNLOAD => 30,
        self::TYPE_TEMPLATE_UPLOAD => 30,
        self::TYPE_FILE_EDIT       => 30,
        self::TYPE_DATABASE_IMPORT => 60,
        self::TYPE_DATABASE_EXPORT => 60,
    ];

    /**
     * Default TTL used when a new task_type appears that isn't in the
     * map above. Conservative on purpose - new types fail-closed at 30
     * minutes rather than waiting forever.
     */
    const PICKUP_TIMEOUT_DEFAULT_MINUTES = 30;

    /**
     * Pickup TTL for this task. Wraps the constant lookup so callers don't
     * have to know the map exists.
     */
    public function getPickupTimeoutMinutes(): int
    {
        return self::PICKUP_TIMEOUT_MINUTES[$this->task_type] ?? self::PICKUP_TIMEOUT_DEFAULT_MINUTES;
    }

    /**
     * Has this still-pending task waited too long for a service to claim it?
     * Returns false for tasks that are already past pickup (processing /
     * completed / failed) because the TTL only governs the queue-wait window.
     */
    public function isPickupExpired(): bool
    {
        if ($this->status !== self::STATUS_PENDING) {
            return false;
        }
        return $this->created_at->lt(now()->subMinutes($this->getPickupTimeoutMinutes()));
    }

    /**
     * Relationships
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Scopes
     */
    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeProcessing($query)
    {
        return $query->where('status', self::STATUS_PROCESSING);
    }

    public function scopeFailed($query)
    {
        return $query->where('status', self::STATUS_FAILED);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    /**
     * Helper methods
     */
    public function markAsProcessing(): bool
    {
        $this->status = self::STATUS_PROCESSING;
        $this->started_at = now();
        return $this->save();
    }

    public function markAsCompleted(array $result = null): bool
    {
        $this->status = self::STATUS_COMPLETED;
        $this->completed_at = now();
        if ($result !== null) {
            $this->result = $result;
        }
        return $this->save();
    }

    public function markAsFailed(string $errorMessage): bool
    {
        $this->status = self::STATUS_FAILED;
        $this->failed_at = now();
        $this->error_message = $errorMessage;
        $this->retry_count++;
        return $this->save();
    }

    public function canRetry(): bool
    {
        return $this->retry_count < $this->max_retries;
    }

    public function resetForRetry(): bool
    {
        $this->status = self::STATUS_PENDING;
        $this->started_at = null;
        $this->error_message = null;
        return $this->save();
    }

    /**
     * Check if task is database import type
     */
    public function isDatabaseImport(): bool
    {
        return $this->task_type === self::TYPE_DATABASE_IMPORT;
    }

    /**
     * Check if task is project download type
     */
    public function isProjectDownload(): bool
    {
        return $this->task_type === self::TYPE_PROJECT_DOWNLOAD;
    }
}
