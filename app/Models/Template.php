<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Template extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'category',
        'language',
        'is_active',
        'tags',
        'file_count',
    ];

    protected $casts = [
        'tags' => 'array',
        'is_active' => 'boolean',
        'file_count' => 'integer',
    ];

    /**
     * Get the template files for the template.
     */
    public function files()
    {
        return $this->hasMany(TemplateFile::class);
    }

    /**
     * Get the project assignments for the template.
     */
    public function projectAssignments()
    {
        return $this->hasMany(ProjectTemplate::class);
    }

    /**
     * Get the assigned schema versions through project templates.
     */
    public function schemaVersions()
    {
        return $this->belongsToMany(SchemaVersion::class, 'project_templates')
            ->withPivot('is_enabled', 'template_config')
            ->withTimestamps();
    }

    /**
     * Scope a query to only include active templates.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to filter by category.
     */
    public function scopeCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Scope a query to search templates.
     */
    public function scopeSearch($query, $search)
    {
        return $query->where(function ($query) use ($search) {
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('language', 'like', "%{$search}%")
                  ->orWhereJsonContains('tags', $search);
        });
    }
}