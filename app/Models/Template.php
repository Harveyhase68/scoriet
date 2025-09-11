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
        'owner_id',
        'visibility',
        'template_files',
        'category',
        'language',
        'is_active',
        'tags',
        'file_count',
    ];

    protected $casts = [
        'template_files' => 'array',
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
     * Get the owner of this template
     */
    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Get schemas that this template depends on
     */
    public function schemasDependencies()
    {
        return $this->belongsToMany(FloatingSchema::class, 'template_schema_dependencies', 'template_id', 'schema_id')
            ->withPivot(['is_required', 'alias'])
            ->withTimestamps();
    }

    /**
     * Get the assigned schema versions through project templates (legacy).
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

    /**
     * Scope to get public templates
     */
    public function scopePublic($query)
    {
        return $query->where('visibility', 'public');
    }

    /**
     * Scope to get accessible templates for a user (public + their private)
     */
    public function scopeAccessibleByUser($query, $userId)
    {
        return $query->where(function($q) use ($userId) {
            $q->where('visibility', 'public')
              ->orWhere(function($subQ) use ($userId) {
                  $subQ->where('visibility', 'private')
                       ->where('owner_id', $userId);
              });
        });
    }

    /**
     * Check if user can access this template
     */
    public function canBeAccessedBy($user): bool
    {
        return $this->visibility === 'public' || $this->owner_id === $user->id;
    }

    /**
     * Check if user can edit this template
     */
    public function canBeEditedBy($user): bool
    {
        return $this->owner_id === $user->id;
    }

    /**
     * Check if template has all required schema dependencies satisfied
     */
    public function hasRequiredSchemasDependenciesSatisfied($availableSchemas): bool
    {
        $requiredSchemas = $this->schemasDependencies()->wherePivot('is_required', true)->get();
        
        foreach ($requiredSchemas as $requiredSchema) {
            $found = false;
            foreach ($availableSchemas as $availableSchema) {
                if ($availableSchema->id === $requiredSchema->id || 
                    $availableSchema->name === $requiredSchema->name) {
                    $found = true;
                    break;
                }
            }
            if (!$found) {
                return false;
            }
        }
        
        return true;
    }
}