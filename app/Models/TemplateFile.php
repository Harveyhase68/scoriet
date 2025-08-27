<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TemplateFile extends Model
{
    use HasFactory;

    protected $fillable = [
        'template_id',
        'file_name',
        'file_path',
        'file_content',
        'file_type',
        'file_order',
    ];

    protected $casts = [
        'template_id' => 'integer',
        'file_order' => 'integer',
    ];

    /**
     * Get the template that owns the file.
     */
    public function template()
    {
        return $this->belongsTo(Template::class);
    }

    /**
     * Scope a query to order files by their order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('file_order');
    }

    /**
     * Scope a query to filter by file type.
     */
    public function scopeType($query, $type)
    {
        return $query->where('file_type', $type);
    }
}