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
    const TYPE_PROJECT_DOWNLOAD = 'project_download';

    // Status constants
    const STATUS_PENDING = 'pending';
    const STATUS_PROCESSING = 'processing';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';

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
