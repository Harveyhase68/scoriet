<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectGeneration extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'schema_version_id',
        'user_id',
        'generation_number',
        'filename',
        'file_path',
        'archive_type',
        'file_size',
        'languages',
        'tables',
        'tables_count',
        'files_count',
        'template_id',
        'template_name',
        'status',
        'notes',
    ];

    protected $casts = [
        'languages' => 'array',
        'tables' => 'array',
        'generation_number' => 'integer',
        'file_size' => 'integer',
        'tables_count' => 'integer',
        'files_count' => 'integer',
    ];

    // ========== RELATIONSHIPS ==========

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function schemaVersion(): BelongsTo
    {
        return $this->belongsTo(SchemaVersion::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class);
    }

    // ========== SCOPES ==========

    public function scopeForProject($query, int $projectId)
    {
        return $query->where('project_id', $projectId);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeLatest($query)
    {
        return $query->orderBy('generation_number', 'desc');
    }

    // ========== METHODS ==========

    /**
     * Get the next generation number for a project
     */
    public static function getNextGenerationNumber(int $projectId): int
    {
        $max = static::where('project_id', $projectId)->max('generation_number');
        return ($max ?? 0) + 1;
    }

    /**
     * Get human-readable file size
     */
    public function getHumanFileSizeAttribute(): string
    {
        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        return round($bytes, 2) . ' ' . $units[$i];
    }

    /**
     * Check if the archive file exists
     */
    public function fileExists(): bool
    {
        return file_exists($this->file_path);
    }

    /**
     * Get the full path to the archive
     */
    public function getFullPath(): string
    {
        return $this->file_path;
    }

    /**
     * Convert to API array
     */
    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'project_id' => $this->project_id,
            'generation_number' => $this->generation_number,
            'filename' => $this->filename,
            'archive_type' => $this->archive_type,
            'file_size' => $this->file_size,
            'file_size_human' => $this->human_file_size,
            'languages' => $this->languages,
            'tables' => $this->tables,
            'tables_count' => $this->tables_count,
            'files_count' => $this->files_count,
            'template_name' => $this->template_name,
            'status' => $this->status,
            'file_exists' => $this->fileExists(),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
