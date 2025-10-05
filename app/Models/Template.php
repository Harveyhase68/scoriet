<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Template extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'full_name',
        'description',
        'creator_user_id',
        'project_id',
        'visibility',
        'is_system_template',
        'original_template_id',
        'category',
        'language',
        'is_active',
        'tags',
        'file_count',
    ];

    protected $casts = [
        'tags' => 'array',
        'is_active' => 'boolean',
        'is_system_template' => 'boolean',
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
     * Get the project usages for the template.
     */
    public function projectUsages()
    {
        return $this->hasMany(ProjectTemplateUsage::class);
    }

    /**
     * Get the creator/author of this template
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_user_id');
    }

    /**
     * Get the current owner via project relationship
     */
    public function currentOwner()
    {
        return $this->project ? $this->project->owner : $this->creator;
    }

    /**
     * Get the project this template belongs to
     */
    public function project()
    {
        return $this->belongsTo(Project::class, 'project_id');
    }

    /**
     * Get the original template this was cloned from
     */
    public function originalTemplate()
    {
        return $this->belongsTo(Template::class, 'original_template_id');
    }

    /**
     * Get all templates that were cloned from this template
     */
    public function clones()
    {
        return $this->hasMany(Template::class, 'original_template_id');
    }

    /**
     * Get DB schemas that this template depends on
     */
    public function dbSchemasDependencies()
    {
        return $this->belongsToMany(FloatingSchema::class, 'template_schema_dependencies', 'template_id', 'schema_id')
            ->withPivot(['is_required', 'alias'])
            ->withTimestamps();
    }

    /**
     * Get the dependencies as relationship objects
     */
    public function dbSchemaDependencies()
    {
        return $this->hasMany(TemplateDbSchemaDependency::class);
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
     * Scope to get system templates
     */
    public function scopeSystemTemplates($query)
    {
        return $query->where('is_system_template', true);
    }

    /**
     * Scope to get project templates
     */
    public function scopeProjectTemplates($query)
    {
        return $query->where('is_system_template', false)->whereNotNull('project_id');
    }

    /**
     * Scope to get templates for a specific project
     */
    public function scopeForProject($query, $projectId)
    {
        return $query->where('project_id', $projectId);
    }

    /**
     * Scope to get accessible templates for a user based on project access
     */
    public function scopeAccessibleByUser($query, $userId, $projectId = null)
    {
        return $query->where(function($q) use ($userId, $projectId) {
            // System templates (always accessible if public)
            $q->where(function($systemQ) {
                $systemQ->where('is_system_template', true)
                        ->where('visibility', 'public');
            })
            // User's own templates (regardless of project)
            ->orWhere(function($ownQ) use ($userId) {
                $ownQ->where('creator_user_id', $userId)
                     ->where('is_system_template', false);
            })
            // Public project templates from user's accessible projects
            ->orWhere(function($projectQ) use ($userId) {
                $projectQ->where('is_system_template', false)
                         ->whereHas('project', function($projectAccessQ) use ($userId) {
                             $projectAccessQ->visibleTo(\App\Models\User::find($userId));
                         })
                         ->where('visibility', 'public')
                         ->where('creator_user_id', '!=', $userId); // Avoid duplicates with own templates
            })
            // Other users' public templates without project association
            ->orWhere(function($publicQ) use ($userId) {
                $publicQ->where('is_system_template', false)
                        ->where('visibility', 'public')
                        ->whereNull('project_id')
                        ->where('creator_user_id', '!=', $userId); // Avoid duplicates with own templates
            });

            // If specific project context, also include templates from that project
            if ($projectId) {
                $q->orWhere('project_id', $projectId);
            }
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
        // System templates can only be edited by system users (the creator)
        if ($this->is_system_template) {
            return $user->user_type === 'system' && $this->creator_user_id === $user->id;
        }

        // Project templates can only be edited by project members
        if ($this->project_id) {
            return $this->project && $this->project->userCanAccess($user);
        }

        // Fallback to creator check
        return $this->creator_user_id === $user->id;
    }

    /**
     * Check if template can be cloned
     */
    public function canBeClonedBy($user): bool
    {
        // Anyone can clone public templates
        if ($this->visibility === 'public') {
            return true;
        }

        // Private templates can only be cloned by users with project access
        if ($this->project_id) {
            return $this->project && $this->project->userCanAccess($user);
        }

        // Fallback to creator check
        return $this->creator_user_id === $user->id;
    }

    /**
     * Check if template can be linked/used
     */
    public function canBeUsedBy($user): bool
    {
        // System templates can always be used (if public)
        if ($this->is_system_template) {
            return $this->visibility === 'public';
        }

        // Same logic as cloning for project templates
        return $this->canBeClonedBy($user);
    }

    /**
     * Check if this is a read-only template
     */
    public function isReadOnly(): bool
    {
        return $this->is_system_template;
    }

    /**
     * Check if template has all required DB schema dependencies satisfied
     */
    public function hasRequiredDbSchemasDependenciesSatisfied($availableSchemas): bool
    {
        $requiredSchemas = $this->dbSchemasDependencies()->wherePivot('is_required', true)->get();
        
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

    /**
     * Validate template name format (lowercase, numbers, max one underscore)
     */
    public static function validateTemplateName(string $name): bool
    {
        // Check if name matches pattern: lowercase letters, numbers, max one underscore anywhere
        $underscoreCount = substr_count($name, '_');
        return preg_match('/^[a-z0-9_]+$/', $name) === 1 && $underscoreCount <= 1;
    }

    /**
     * Sanitize template name to valid format
     */
    public static function sanitizeTemplateName(string $name): string
    {
        // Convert to lowercase
        $name = strtolower($name);

        // Replace spaces and special chars with underscore
        $name = preg_replace('/[^a-z0-9_]/', '_', $name);

        // Replace multiple underscores with single underscore
        $name = preg_replace('/_+/', '_', $name);

        // Remove leading/trailing underscores
        $name = trim($name, '_');

        // If still contains more than one underscore, take only first two parts
        $parts = explode('_', $name);
        if (count($parts) > 2) {
            $name = $parts[0] . '_' . $parts[1];
        }

        return $name;
    }

    /**
     * Check if user can view this template
     */
    public function canBeViewedBy($user): bool
    {
        // System templates are public
        if ($this->is_system_template) {
            return true;
        }

        // Creator can always view
        if ($this->creator_user_id == $user->id) {
            return true;
        }

        // Public templates can be viewed by anyone
        if ($this->visibility === 'public') {
            return true;
        }

        // Private templates can only be viewed by creator
        return false;
    }

    /**
     * Clone this template for a project with new name
     */
    public function cloneForProject($project, $newName = null, $visibility = 'public'): Template
    {
        $newTemplateName = $newName ?: $this->name;

        // Ensure template name follows validation rules
        if (!self::validateTemplateName($newTemplateName)) {
            $newTemplateName = self::sanitizeTemplateName($newTemplateName);
        }

        $fullName = $project->name . '/' . $newTemplateName;

        // Check if user can create private templates
        $canCreatePrivate = $project->owner && in_array($project->owner->user_type, ['premium', 'admin']);
        $finalVisibility = ($visibility === 'private' && $canCreatePrivate) ? 'private' : 'public';

        $clonedTemplate = Template::create([
            'name' => $newTemplateName,
            'full_name' => $fullName,
            'description' => $this->description,
            'project_id' => $project->id,
            'creator_user_id' => $project->owner_id, // Current project owner becomes creator
            'visibility' => $finalVisibility,
            'is_system_template' => false,
            'original_template_id' => $this->id,
            'category' => $this->category,
            'language' => $this->language,
            'is_active' => true,
            'tags' => $this->tags,
            'file_count' => $this->file_count,
        ]);

        // Clone template files
        foreach ($this->files as $file) {
            $clonedTemplate->files()->create([
                'filename' => $file->filename,
                'content' => $file->content,
                'file_type' => $file->file_type,
                'order_index' => $file->order_index,
            ]);
        }

        // Update file_count after cloning files
        $clonedTemplate->update(['file_count' => $clonedTemplate->files()->count()]);

        // Clone DB schema dependencies
        foreach ($this->dbSchemasDependencies as $schema) {
            $clonedTemplate->dbSchemasDependencies()->attach($schema->id, [
                'is_required' => $schema->pivot->is_required,
                'alias' => $schema->pivot->alias,
            ]);
        }

        return $clonedTemplate;
    }
}