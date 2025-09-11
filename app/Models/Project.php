<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'owner_id',
        'is_active',
        'is_public',
        'join_code',
        'allow_join_requests',
        'settings',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_public' => 'boolean',
        'allow_join_requests' => 'boolean',
        'settings' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $with = ['owner'];

    /**
     * Get the owner of the project
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Get teams associated with this project through pivot table
     */
    public function teams(): BelongsToMany
    {
        return $this->belongsToMany(Team::class, 'project_teams', 'project_id', 'team_id')
                    ->withPivot('assigned_at', 'assigned_by')
                    ->withTimestamps()
                    ->orderBy('assigned_at', 'desc');
    }

    /**
     * Get templates associated with this project (legacy - needs updating)
     * TODO: Update this relationship for the new floating schemas system
     */
    public function templates(): BelongsToMany
    {
        // For now, return empty collection to avoid SQL errors
        // This needs to be properly implemented with the new schema system
        return $this->belongsToMany(Template::class, 'project_templates', 'project_id', 'template_id')
                    ->whereRaw('1 = 0'); // Always return empty result set
    }

    /**
     * Get floating schemas associated with this project
     */
    public function floatingSchemas(): BelongsToMany
    {
        return $this->belongsToMany(FloatingSchema::class, 'project_schemas', 'project_id', 'schema_id')
                    ->withPivot(['association_type', 'alias'])
                    ->withTimestamps();
    }

    /**
     * Get linked schemas (read-only reference to public schemas)
     */
    public function linkedSchemas()
    {
        return $this->floatingSchemas()->wherePivot('association_type', 'linked');
    }

    /**
     * Get cloned schemas (private copies of schemas)
     */
    public function clonedSchemas()
    {
        return $this->floatingSchemas()->wherePivot('association_type', 'cloned');
    }

    /**
     * Get imported schemas (merged into existing schemas)
     */
    public function importedSchemas()
    {
        return $this->floatingSchemas()->wherePivot('association_type', 'imported');
    }

    /**
     * Get databases associated with this project (legacy method for compatibility)
     */
    public function databases()
    {
        // Return floating schemas for backward compatibility
        return $this->floatingSchemas;
    }

    /**
     * Scope for active projects
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for projects owned by a user
     */
    public function scopeOwnedBy($query, $userId)
    {
        return $query->where('owner_id', $userId);
    }

    /**
     * Get project applications
     */
    public function applications(): HasMany
    {
        return $this->hasMany(ProjectApplication::class);
    }

    /**
     * Get pending applications
     */
    public function pendingApplications(): HasMany
    {
        return $this->hasMany(ProjectApplication::class)->where('status', 'pending');
    }

    /**
     * Generate a unique join code
     */
    public function generateJoinCode(): string
    {
        do {
            $code = 'PROJ-' . strtoupper(\Str::random(8));
        } while (self::where('join_code', $code)->exists());

        $this->join_code = $code;
        $this->save();

        return $code;
    }

    /**
     * Scopes for visibility
     */
    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    public function scopePrivate($query)
    {
        return $query->where('is_public', false);
    }

    public function scopeVisibleTo($query, $user = null)
    {
        if (!$user) {
            return $query->where('is_public', true);
        }

        return $query->where(function ($q) use ($user) {
            $q->where('is_public', true)
              ->orWhere('owner_id', $user->id)
              ->orWhereHas('teams.members', function ($teamQuery) use ($user) {
                  $teamQuery->where('user_id', $user->id);
              });
        });
    }

    /**
     * Check if user can create private projects
     */
    public function canCreatePrivate($user): bool
    {
        return $user && in_array($user->user_type, ['premium', 'admin']);
    }

    /**
     * Get counts for dashboard
     */
    public function getCounts()
    {
        return [
            'teams_count' => $this->teams()->count(),
            'applications_count' => $this->pendingApplications()->count(),
            'templates_count' => 0, // TODO: Fix template relationship for new schema system
            'schemas_count' => $this->floatingSchemas()->count(),
            'databases_count' => $this->floatingSchemas()->count(), // For backward compatibility
        ];
    }

    /**
     * Associate a schema with this project
     */
    public function associateSchema(FloatingSchema $schema, string $associationType = 'linked', ?string $alias = null)
    {
        return $this->floatingSchemas()->attach($schema->id, [
            'association_type' => $associationType,
            'alias' => $alias,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Remove schema association from this project
     */
    public function dissociateSchema(FloatingSchema $schema)
    {
        return $this->floatingSchemas()->detach($schema->id);
    }

    /**
     * Check if project has access to a specific schema
     */
    public function hasSchemaAccess(FloatingSchema $schema): bool
    {
        return $this->floatingSchemas()->where('schema_id', $schema->id)->exists();
    }

    /**
     * Clone a template's schemas into this project
     */
    public function cloneTemplateSchemas(Template $template, $user)
    {
        $clonedSchemas = [];
        
        foreach ($template->schemasDependencies as $templateSchema) {
            if ($templateSchema->pivot->is_required || $this->shouldIncludeOptionalSchema($templateSchema)) {
                // Clone the schema for this project owner
                $clonedSchema = $templateSchema->cloneForOwner($user, $templateSchema->name . ' (from ' . $template->name . ')');
                
                // Associate the cloned schema with this project
                $this->associateSchema($clonedSchema, 'cloned', $templateSchema->pivot->alias);
                
                $clonedSchemas[] = $clonedSchema;
            }
        }
        
        return $clonedSchemas;
    }

    /**
     * Check if an optional schema should be included (can be overridden)
     */
    protected function shouldIncludeOptionalSchema(FloatingSchema $schema): bool
    {
        // Default: include all schemas, but this can be customized
        return true;
    }
}
