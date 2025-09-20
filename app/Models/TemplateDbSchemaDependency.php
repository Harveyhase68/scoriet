<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TemplateDbSchemaDependency extends Model
{
    use HasFactory;

    protected $table = 'template_schema_dependencies';

    protected $fillable = [
        'template_id',
        'schema_id',
        'is_required',
        'alias',
    ];

    protected $casts = [
        'is_required' => 'boolean',
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(Template::class);
    }

    public function dbSchema(): BelongsTo
    {
        return $this->belongsTo(FloatingSchema::class, 'schema_id');
    }

    public function scopeRequired($query)
    {
        return $query->where('is_required', true);
    }

    public function scopeOptional($query)
    {
        return $query->where('is_required', false);
    }
}