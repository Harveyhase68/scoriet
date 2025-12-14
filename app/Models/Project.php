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
        'database_name',
        'database_type',
        'database_server',
        'database_port',
        'database_username',
        'database_password',
        'diagram_max_tables_per_row',
        'diagram_table_width',
        'diagram_table_height',
        'diagram_horizontal_spacing',
        'diagram_vertical_spacing',
        'project_directory',
        'project_url',
        'start_page',
        'default_language',
        'archive_format',
        'filename_short_length',
        'decimal_separator',
        'thousands_separator',
        'date_format',
        'time_format',
        'currency_symbol',
        'timezone',
        'enabled_languages',
        'google_translate_api_key',
        'protected_files',
        'install_script',
        'update_script',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_public' => 'boolean',
        'allow_join_requests' => 'boolean',
        'settings' => 'array',
        'enabled_languages' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'protected_files' => 'array',
        'install_script' => 'array',
        'update_script' => 'array',
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
     * Get templates associated with this project
     */
    public function templates(): BelongsToMany
    {
        return $this->belongsToMany(Template::class, 'project_template_usage', 'project_id', 'template_id')
                    ->withPivot(['usage_type', 'alias', 'config', 'is_active', 'used_at'])
                    ->withTimestamps()
                    ->wherePivot('is_active', true);
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
            return $query->whereRaw('1 = 0'); // No projects visible to unauthenticated users
        }

        return $query->where(function ($q) use ($user) {
            $q->where('owner_id', $user->id) // Projects owned by user
              ->orWhereHas('members', function ($memberQuery) use ($user) {
                  $memberQuery->where('user_id', $user->id); // Direct project members
              })
              ->orWhereHas('teams.members', function ($teamQuery) use ($user) {
                  $teamQuery->where('user_id', $user->id); // Team members of project teams
              });
        });
    }

    /**
     * Check if user can create private projects
     */
    public function canCreatePrivate($user): bool
    {
        return $user && in_array($user->user_type, ['patron', 'admin', 'system']);
    }

    /**
     * Get counts for dashboard
     */
    public function getCounts()
    {
        try {
            // Count teams assigned to this project through project_teams table
            $teamsCount = $this->teams()->where('is_active', true)->count();

            return [
                'teams_count' => $teamsCount,
                'members_count' => $this->members()->count(),
                'applications_count' => $this->pendingApplications()->count(),
                'templates_count' => $this->templateUsages()->active()->count(),
                'schemas_count' => $this->floatingSchemas()->count(),
                'databases_count' => $this->floatingSchemas()->count(), // For backward compatibility
            ];
        } catch (\Exception $e) {
            // Return safe defaults if relationships fail
            return [
                'teams_count' => 0,
                'members_count' => 0,
                'applications_count' => 0,
                'templates_count' => 0,
                'schemas_count' => 0,
                'databases_count' => 0,
            ];
        }
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

    /**
     * Get all members of this project
     */
    public function members()
    {
        return $this->hasMany(ProjectMember::class);
    }

    /**
     * Get all invitations for this project
     */
    public function invitations()
    {
        return $this->hasMany(ProjectInvitation::class);
    }

    /**
     * Get the generation tree for this project
     */
    public function generationTree()
    {
        return $this->hasOne(ProjectGenerationTree::class);
    }

    /**
     * Get all template usages for this project
     */
    public function templateUsages()
    {
        return $this->hasMany(ProjectTemplateUsage::class);
    }

    /**
     * Get linked templates (read-only references)
     */
    public function linkedTemplates()
    {
        return $this->templateUsages()->linked()->with('template');
    }

    /**
     * Get cloned templates (editable copies)
     */
    public function clonedTemplates()
    {
        return $this->templateUsages()->cloned()->with('template');
    }

    /**
     * Get all used templates (both linked and cloned)
     */
    public function usedTemplates()
    {
        return $this->templateUsages()->active()->with('template.files');
    }

    /**
     * Get pending invitations
     */
    public function pendingInvitations()
    {
        return $this->invitations()->where('status', 'pending');
    }

    /**
     * Check if a user is a member of this project
     */
    public function hasMember(User $user): bool
    {
        return $this->members()->where('user_id', $user->id)->exists();
    }

    /**
     * Get a user's membership in this project
     */
    public function getMembership(User $user): ?ProjectMember
    {
        return $this->members()->where('user_id', $user->id)->first();
    }

    /**
     * Check if a user can manage this project
     */
    public function userCanManage(User $user): bool
    {
        // Project owner can always manage
        if ((string)$this->owner_id === (string)$user->id) {
            return true;
        }

        // Project admins can manage
        $membership = $this->getMembership($user);
        return $membership && $membership->isAdmin();
    }

    /**
     * Check if a user can access this project (owner, member, or team member)
     */
    public function userCanAccess(User $user): bool
    {
        // Project owner can always access
        if ((string)$this->owner_id === (string)$user->id) {
            return true;
        }

        // Direct project members can access
        if ($this->hasMember($user)) {
            return true;
        }

        // Team members can access
        return $this->teams()->whereHas('members', function($query) use ($user) {
            $query->where('user_id', $user->id);
        })->exists();
    }

    /**
     * Invite a user to this project
     */
    public function inviteUser(string $email, string $role = 'member', ?string $message = null, ?User $inviter = null): ProjectInvitation
    {
        $inviter = $inviter ?? auth()->user();
        
        if (!$inviter) {
            throw new \Exception('No authenticated user to send invitation');
        }

        return ProjectInvitation::create([
            'project_id' => $this->id,
            'invited_by' => $inviter->id,
            'invited_email' => $email,
            'role' => $role,
            'message' => $message,
        ]);
    }

    /**
     * Link a template to this project (read-only usage)
     */
    public function linkTemplate(Template $template, ?string $alias = null, ?array $config = null): ProjectTemplateUsage
    {
        // Check if a usage record already exists (active or inactive)
        $existingUsage = ProjectTemplateUsage::where('project_id', $this->id)
            ->where('template_id', $template->id)
            ->first();

        if ($existingUsage) {
            // Reactivate existing usage
            $existingUsage->update([
                'is_active' => true,
                'usage_type' => 'linked',
                'alias' => $alias,
                'config' => $config,
                'used_at' => now(),
            ]);

            return $existingUsage;
        }

        // Create new usage record
        return ProjectTemplateUsage::create([
            'project_id' => $this->id,
            'template_id' => $template->id,
            'usage_type' => 'linked',
            'alias' => $alias,
            'config' => $config,
            'used_at' => now(),
        ]);
    }

    /**
     * Clone a template for this project (editable copy)
     */
    public function cloneTemplate(Template $template, ?string $newName = null, string $visibility = 'public'): array
    {
        // Create the cloned template
        $clonedTemplate = $template->cloneForProject($this, $newName, $visibility);

        // Record the usage
        $usage = ProjectTemplateUsage::create([
            'project_id' => $this->id,
            'template_id' => $clonedTemplate->id,
            'usage_type' => 'cloned',
            'used_at' => now(),
        ]);

        return [
            'template' => $clonedTemplate,
            'usage' => $usage
        ];
    }

    /**
     * Check if project is using a specific template
     */
    public function isUsingTemplate(Template $template): bool
    {
        return $this->templateUsages()
            ->where('template_id', $template->id)
            ->where('is_active', true)
            ->exists();
    }

    /**
     * Get template usage for a specific template
     */
    public function getTemplateUsage(Template $template): ?ProjectTemplateUsage
    {
        return $this->templateUsages()
            ->where('template_id', $template->id)
            ->where('is_active', true)
            ->first();
    }

    /**
     * Validate project name format (lowercase, numbers, underscores for snake_case)
     */
    public static function validateProjectName(string $name): bool
    {
        return preg_match('/^[a-z0-9]+(_[a-z0-9]+)*$/', $name) === 1;
    }

    /**
     * Sanitize project name to valid format
     */
    public static function sanitizeProjectName(string $name): string
    {
        // Convert to lowercase
        $name = strtolower($name);

        // Replace spaces and special chars with underscore
        $name = preg_replace('/[^a-z0-9_]/', '_', $name);

        // Replace multiple underscores with single underscore
        $name = preg_replace('/_+/', '_', $name);

        // Remove leading/trailing underscores
        $name = trim($name, '_');

        return $name;
    }

    /**
     * Get the template variable values for this project
     */
    public function templateVariableValues()
    {
        return $this->hasMany(ProjectTemplateVariableValue::class);
    }

    /**
     * Get the subscription for this project
     */
    public function subscription()
    {
        return $this->hasOne(Subscription::class, 'entity_id')
                    ->where('subscription_type', Subscription::TYPE_PROJECT);
    }

    /**
     * Check if project is soft-locked
     */
    public function isSoftLocked(): bool
    {
        $subscription = $this->subscription;
        if (!$subscription) {
            return false;
        }

        // Auto-apply soft-lock if expired
        $subscription->checkAndApplySoftLock();

        return $subscription->is_soft_locked;
    }
}
