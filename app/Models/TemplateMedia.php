<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TemplateMedia extends Model
{
    use HasFactory;

    protected $table = 'template_media';

    protected $fillable = [
        'template_id',
        'media_type',
        'file_path',
        'file_data',
        'mime_type',
        'file_size',
        'video_url',
        'title',
        'description',
        'sort_order',
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'file_size' => 'integer',
    ];

    /**
     * Hidden from JSON serialization - we don't want to send blob data directly
     */
    protected $hidden = [
        'file_data',
    ];

    /**
     * Get the template that owns this media.
     */
    public function template()
    {
        return $this->belongsTo(Template::class);
    }

    /**
     * Scope a query to only include logos.
     */
    public function scopeLogo($query)
    {
        return $query->where('media_type', 'logo');
    }

    /**
     * Scope a query to only include images.
     */
    public function scopeImages($query)
    {
        return $query->where('media_type', 'image');
    }

    /**
     * Scope a query to only include videos.
     */
    public function scopeVideos($query)
    {
        return $query->where('media_type', 'video');
    }

    /**
     * Scope to order by sort_order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order', 'asc');
    }

    /**
     * Check if this media is a logo.
     */
    public function isLogo(): bool
    {
        return $this->media_type === 'logo';
    }

    /**
     * Check if this media is an image.
     */
    public function isImage(): bool
    {
        return $this->media_type === 'image';
    }

    /**
     * Check if this media is a video.
     */
    public function isVideo(): bool
    {
        return $this->media_type === 'video';
    }

    /**
     * Get the full URL for the media file.
     */
    public function getUrlAttribute(): ?string
    {
        if ($this->isVideo()) {
            return $this->video_url;
        }

        if ($this->file_path) {
            return asset('storage/' . $this->file_path);
        }

        return null;
    }

    /**
     * Validate a video URL (YouTube or Vimeo).
     */
    public static function isValidVideoUrl(string $url): bool
    {
        // YouTube patterns
        $youtubePatterns = [
            '/^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/',
            '/^https?:\/\/youtu\.be\/[\w-]+/',
            '/^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/',
        ];

        // Vimeo patterns
        $vimeoPatterns = [
            '/^https?:\/\/(www\.)?vimeo\.com\/\d+/',
            '/^https?:\/\/player\.vimeo\.com\/video\/\d+/',
        ];

        foreach (array_merge($youtubePatterns, $vimeoPatterns) as $pattern) {
            if (preg_match($pattern, $url)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get the video embed URL for YouTube/Vimeo.
     */
    public function getEmbedUrlAttribute(): ?string
    {
        if (!$this->isVideo() || !$this->video_url) {
            return null;
        }

        $url = $this->video_url;

        // YouTube
        if (strpos($url, 'youtube.com') !== false || strpos($url, 'youtu.be') !== false) {
            $videoId = $this->extractYouTubeId($url);
            if ($videoId) {
                return "https://www.youtube.com/embed/{$videoId}";
            }
        }

        // Vimeo
        if (strpos($url, 'vimeo.com') !== false) {
            $videoId = $this->extractVimeoId($url);
            if ($videoId) {
                return "https://player.vimeo.com/video/{$videoId}";
            }
        }

        return null;
    }

    /**
     * Extract YouTube video ID from URL.
     */
    private function extractYouTubeId(string $url): ?string
    {
        // youtube.com/watch?v=ID
        if (preg_match('/[?&]v=([^&]+)/', $url, $matches)) {
            return $matches[1];
        }

        // youtu.be/ID
        if (preg_match('/youtu\.be\/([^?&]+)/', $url, $matches)) {
            return $matches[1];
        }

        // youtube.com/embed/ID
        if (preg_match('/embed\/([^?&]+)/', $url, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * Extract Vimeo video ID from URL.
     */
    private function extractVimeoId(string $url): ?string
    {
        // vimeo.com/ID
        if (preg_match('/vimeo\.com\/(\d+)/', $url, $matches)) {
            return $matches[1];
        }

        // player.vimeo.com/video/ID
        if (preg_match('/video\/(\d+)/', $url, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * Get the video platform (youtube or vimeo).
     */
    public function getVideoPlatformAttribute(): ?string
    {
        if (!$this->isVideo() || !$this->video_url) {
            return null;
        }

        if (strpos($this->video_url, 'youtube.com') !== false || strpos($this->video_url, 'youtu.be') !== false) {
            return 'youtube';
        }

        if (strpos($this->video_url, 'vimeo.com') !== false) {
            return 'vimeo';
        }

        return null;
    }
}
