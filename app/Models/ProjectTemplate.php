<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'schema_version_id',
        'template_id',
        'is_enabled',
        'template_config',
    ];

    protected $casts = [
        'schema_version_id' => 'integer',
        'template_id' => 'integer',
        'is_enabled' => 'boolean',
        'template_config' => 'array',
    ];

    /**
     * Get the schema version that owns the project template.
     */
    public function schemaVersion()
    {
        return $this->belongsTo(SchemaVersion::class);
    }

    /**
     * Get the template that owns the project template.
     */
    public function template()
    {
        return $this->belongsTo(Template::class);
    }

    /**
     * Scope a query to only include enabled templates.
     */
    public function scopeEnabled($query)
    {
        return $query->where('is_enabled', true);
    }
}