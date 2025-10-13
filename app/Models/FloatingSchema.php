<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class FloatingSchema extends Model
{
    protected $table = 'schemas';
    
    protected $fillable = [
        'name',
        'description', 
        'owner_id',
        'visibility',
        'last_version'
    ];

    /**
     * Get the owner of this schema
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Get all schema tables for this schema
     */
    public function schemaTables(): HasMany
    {
        return $this->hasMany(SchemaTable::class, 'schema_id');
    }

    /**
     * Get projects that use this schema
     */
    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'project_schemas', 'schema_id', 'project_id')
                    ->withPivot(['association_type', 'alias'])
                    ->withTimestamps();
    }

    /**
     * Get templates that depend on this schema
     */
    public function templates(): BelongsToMany
    {
        return $this->belongsToMany(Template::class, 'template_schema_dependencies')
                    ->withPivot(['is_required', 'alias'])
                    ->withTimestamps();
    }

    /**
     * Get all versions of this schema
     */
    public function versions(): HasMany
    {
        return $this->hasMany(SchemaVersion::class, 'schema_id')->orderBy('version_number', 'desc');
    }

    /**
     * Get the current (latest) version
     */
    public function currentVersion()
    {
        return $this->versions()->where('version_number', $this->last_version)->first();
    }

    /**
     * Get latest version
     */
    public function latestVersion()
    {
        return $this->versions()->first(); // Already ordered by version_number desc
    }

    /**
     * Create new version and increment counters
     */
    public function createNewVersion(?string $description = null): SchemaVersion
    {
        return SchemaVersion::createNewVersion($this, $description);
    }

    /**
     * Scope to get public schemas
     */
    public function scopePublic($query)
    {
        return $query->where('visibility', 'public');
    }

    /**
     * Scope to get private schemas for a specific owner
     */
    public function scopePrivateForOwner($query, $ownerId)
    {
        return $query->where('visibility', 'private')
                    ->where('owner_id', $ownerId);
    }

    /**
     * Scope to get accessible schemas for a user (public + their private)
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
     * Check if user can access this schema
     */
    public function canBeAccessedBy(User $user): bool
    {
        // Public schemas are accessible to everyone
        if ($this->visibility === 'public') {
            return true;
        }
        
        // Owner can always access (force string comparison for cross-platform compatibility)
        if ((string)$this->owner_id === (string)$user->id) {
            return true;
        }
        
        // If schema has no owner, first user (admin) can access it
        // This handles cases where schemas were created without proper ownership
        if (empty($this->owner_id) && $user->id === (string)1) {
            return true;
        }
        
        // For development: if user is the first user and schema owner is also first user
        // (handles different user IDs between local and production)
        if ($user->id === 1 && $this->owner_id <= 3) {
            return true;
        }
        
        return false;
    }

    /**
     * Check if user can edit this schema
     */
    public function canBeEditedBy(User $user): bool
    {
        // Owner can always edit
        if ((string)$this->owner_id === (string)$user->id) {
            return true;
        }
        
        // If schema has no owner, first user (admin) can edit it
        if (empty($this->owner_id) && $user->id === 1) {
            return true;
        }
        
        // For development: if user is the first user and schema owner is also first user
        if ($user->id === 1 && $this->owner_id <= 3) {
            return true;
        }
        
        return false;
    }

    /**
     * Clone this schema for a new owner
     */
    public function cloneForOwner(User $newOwner, ?string $newName = null): self
    {
        $cloneName = $newName ?? $this->name . ' (Clone)';
        
        $clone = $this->replicate();
        $clone->owner_id = $newOwner->id;
        $clone->name = $cloneName;
        $clone->visibility = 'private'; // Clones are always private initially
        $clone->save();

        // Clone all schema tables and their relationships
        $this->schemaTables->each(function($table) use ($clone) {
            $table->cloneToSchema($clone);
        });

        return $clone;
    }
}
