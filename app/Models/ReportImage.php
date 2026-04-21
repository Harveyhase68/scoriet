<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportImage extends Model
{
    use HasFactory;

    protected $fillable = [
        'report_pattern_id',
        'element_id',
        'name',
        'language',
        'mime_type',
        'filename',
        'file_size',
        'width',
        'height',
        'image_data',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
    ];

    // Don't include binary data in default serialization
    protected $hidden = ['image_data'];

    public function pattern(): BelongsTo
    {
        return $this->belongsTo(ReportPattern::class, 'report_pattern_id');
    }
}
