<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

class ProjectAttachment extends Model
{
    /**
     * Available categories for project attachments
     */
    public const CATEGORIES = [
        'system_analysis' => 'Systemanalyse',
        'specification' => 'Pflichtenheft',
        'design' => 'Design',
        'offer' => 'Angebot',
        'correspondence' => 'Korrespondenz',
        'other' => 'Sonstiges',
    ];

    protected $fillable = [
        'project_id',
        'uploaded_by',
        'filename',
        'original_filename',
        'mime_type',
        'size',
        'path',
        'description',
        'category',
        'is_pinned',
        'download_count',
    ];

    protected $casts = [
        'size' => 'integer',
        'is_pinned' => 'boolean',
        'download_count' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $appends = ['url', 'formatted_size'];

    // ========================================
    // Relationships
    // ========================================

    /**
     * Get the project this attachment belongs to
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the user who uploaded this attachment
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    // ========================================
    // Accessors
    // ========================================

    /**
     * Get the URL for downloading this attachment
     */
    public function getUrlAttribute(): string
    {
        return '/api/projects/' . $this->project_id . '/attachments/' . $this->id . '/download';
    }

    /**
     * Get human-readable file size
     */
    public function getFormattedSizeAttribute(): string
    {
        return $this->getFormattedSize();
    }

    // ========================================
    // Methods
    // ========================================

    /**
     * Get human-readable file size
     */
    public function getFormattedSize(): string
    {
        $bytes = $this->size;

        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2) . ' GB';
        }

        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        }

        if ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        }

        return $bytes . ' Bytes';
    }

    /**
     * Check if attachment is an image
     */
    public function isImage(): bool
    {
        return str_starts_with($this->mime_type, 'image/');
    }

    /**
     * Check if attachment is a PDF
     */
    public function isPdf(): bool
    {
        return $this->mime_type === 'application/pdf';
    }

    /**
     * Check if attachment is a document (Word, Excel, etc.)
     */
    public function isDocument(): bool
    {
        $documentTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'text/csv',
        ];

        return in_array($this->mime_type, $documentTypes);
    }

    /**
     * Get the file extension
     */
    public function getExtension(): string
    {
        return pathinfo($this->original_filename, PATHINFO_EXTENSION);
    }

    /**
     * Get the category label
     */
    public function getCategoryLabel(): string
    {
        return self::CATEGORIES[$this->category] ?? $this->category;
    }

    /**
     * Get a signed URL for downloading this attachment (for use in emails)
     * The link is valid for 7 days
     */
    public function getSignedDownloadUrl(int $expirationDays = 7): string
    {
        return URL::temporarySignedRoute(
            'api.projects.attachments.download-signed',
            now()->addDays($expirationDays),
            ['project' => $this->project_id, 'attachment' => $this->id]
        );
    }

    /**
     * Increment the download counter
     */
    public function incrementDownloadCount(): void
    {
        $this->increment('download_count');
    }

    /**
     * Delete the file from storage
     */
    public function deleteFile(): bool
    {
        $disk = Storage::disk('local');
        if ($disk->exists($this->path)) {
            return $disk->delete($this->path);
        }
        return true;
    }

    /**
     * Boot method to handle file deletion when model is deleted
     */
    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($attachment) {
            $attachment->deleteFile();
        });
    }
}
