<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeploymentLog extends Model
{
    protected $fillable = [
        'project_id',
        'task_id',
        'user_id',
        'type',
        'message',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the project that owns this log
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the task that owns this log
     */
    public function task(): BelongsTo
    {
        return $this->belongsTo(CliTask::class, 'task_id');
    }

    /**
     * Get the user that created this log
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Create a deployment log entry
     *
     * @param int $projectId
     * @param int $userId
     * @param string $type (info|success|warning|error)
     * @param string $message
     * @param int|null $taskId
     * @param array|null $metadata
     * @return static
     */
    public static function log(
        int $projectId,
        int $userId,
        string $type,
        string $message,
        ?int $taskId = null,
        ?array $metadata = null
    ): self {
        return self::create([
            'project_id' => $projectId,
            'user_id' => $userId,
            'type' => $type,
            'message' => $message,
            'task_id' => $taskId,
            'metadata' => $metadata,
        ]);
    }
}
