<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TemplateFingerprint extends Model
{
    use HasFactory;

    protected $fillable = [
        'template_id',
        'template_file_id',
        'file_hash',
        'normalized_content',
        'content_length',
        'token_signature',
        'file_type',
        'is_significant',
    ];

    protected $casts = [
        'token_signature' => 'array',
        'is_significant' => 'boolean',
    ];

    /**
     * Get the template this fingerprint belongs to.
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class);
    }

    /**
     * Get the template file this fingerprint belongs to.
     */
    public function templateFile(): BelongsTo
    {
        return $this->belongsTo(TemplateFile::class);
    }
}
