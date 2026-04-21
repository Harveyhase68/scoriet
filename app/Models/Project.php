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
        'locked_by_user_id',
        'locked_at',
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
        'form_designer_snap_to_grid',
        'form_designer_grid_size',
        'report_designer_snap_to_grid',
        'report_designer_grid_unit',
        'report_designer_grid_size',
        'project_directory',
        'project_url',
        'start_page',
        'default_language',
        'target_language',
        'archive_format',
        'filename_short_length',
        'enabled_languages',
        'google_translate_api_key',
        'protected_files',
        'install_script',
        'update_script',
        // Git integration fields
        'git_provider_id',
        'git_repository',
        'git_default_branch',
        'git_main_branch',
        'git_target_directory',
        'git_workflow',
        'git_pr_title_template',
        'git_pr_description_template',
        'git_auto_delete_branch',
        // FTP/SSH deployment fields
        'deployment_type',
        'ftp_host',
        'ftp_port',
        'ftp_username',
        'ftp_password',
        'ftp_directory',
        'ftp_passive',
        'ftp_ssl',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_public' => 'boolean',
        'allow_join_requests' => 'boolean',
        'form_designer_snap_to_grid' => 'boolean',
        'report_designer_snap_to_grid' => 'boolean',
        'report_designer_grid_size' => 'decimal:2',
        'settings' => 'array',
        'enabled_languages' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'locked_at' => 'datetime',
        'protected_files' => 'array',
        'install_script' => 'array',
        'update_script' => 'array',
        'git_auto_delete_branch' => 'boolean',
        'ftp_passive' => 'boolean',
        'ftp_ssl' => 'boolean',
    ];

    /**
     * Encrypt FTP password when setting
     */
    public function setFtpPasswordAttribute($value)
    {
        $this->attributes['ftp_password'] = $value ? encrypt($value) : null;
    }

    /**
     * Decrypt FTP password when getting
     */
    public function getFtpPasswordAttribute($value)
    {
        if (!$value) {
            return null;
        }
        try {
            return decrypt($value);
        } catch (\Exception $e) {
            return $value; // Return as-is if decryption fails (might be plain text from before encryption)
        }
    }

    /**
     * Check if project has FTP/SSH deployment configured
     */
    public function hasFtpDeployment(): bool
    {
        return !empty($this->deployment_type) && !empty($this->ftp_host) && !empty($this->ftp_username);
    }

    /**
     * Accessor for has_ftp_deployment attribute
     */
    public function getHasFtpDeploymentAttribute(): bool
    {
        return $this->hasFtpDeployment();
    }

    /**
     * Attributes to append to JSON serialization
     */
    protected $appends = ['has_ftp_deployment'];

    protected $with = ['owner'];

    /**
     * Get the user who has locked this project for editing
     */
    public function lockedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'locked_by_user_id');
    }

    /**
     * Check if the project is currently locked for editing
     * Auto-expires locks older than 15 minutes
     */
    public function isEditLocked(): bool
    {
        if (!$this->locked_by_user_id) {
            return false;
        }
        // Auto-expire locks older than 15 minutes
        if ($this->locked_at && $this->locked_at->diffInMinutes(now()) > 15) {
            $this->forceUnlock();
            return false;
        }
        return true;
    }

    /**
     * Check if the project is locked by a specific user
     */
    public function isLockedBy(User $user): bool
    {
        return $this->locked_by_user_id !== null
            && (string)$this->locked_by_user_id === (string)$user->id;
    }

    /**
     * Lock the project for editing by a user
     * Returns false if already locked by someone else
     */
    public function lockForEditing(User $user): bool
    {
        if ($this->isEditLocked() && !$this->isLockedBy($user)) {
            return false;
        }
        $this->update([
            'locked_by_user_id' => $user->id,
            'locked_at' => now(),
        ]);
        return true;
    }

    /**
     * Force-unlock the project (clear edit lock)
     */
    public function forceUnlock(): void
    {
        $this->update([
            'locked_by_user_id' => null,
            'locked_at' => null,
        ]);
    }

    /**
     * Get the owner of the project
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function translations(): HasMany
    {
        return $this->hasMany(ProjectTranslation::class);
    }

    /**
     * Get translated caption for a language (fallback: default language → formatted name)
     */
    public function getTranslatedCaption(?string $langCode = null): string
    {
        $langCode = $langCode ?? $this->default_language ?? 'en';
        $trans = $this->translations->firstWhere('language_code', $langCode);
        if ($trans && $trans->caption) return $trans->caption;
        // Fallback: default language
        $defaultTrans = $this->translations->firstWhere('language_code', $this->default_language ?? 'en');
        if ($defaultTrans && $defaultTrans->caption) return $defaultTrans->caption;
        // Last fallback: format project name
        return ucwords(str_replace('_', ' ', $this->name));
    }

    /**
     * Get translated description for a language (fallback: default language → project description)
     */
    public function getTranslatedDescription(?string $langCode = null): string
    {
        $langCode = $langCode ?? $this->default_language ?? 'en';
        $trans = $this->translations->firstWhere('language_code', $langCode);
        if ($trans && $trans->description) return $trans->description;
        // Fallback: default language
        $defaultTrans = $this->translations->firstWhere('language_code', $this->default_language ?? 'en');
        if ($defaultTrans && $defaultTrans->description) return $defaultTrans->description;
        return $this->description ?? '';
    }

    /**
     * Get the Git provider connection for this project
     */
    public function gitProvider(): BelongsTo
    {
        return $this->belongsTo(UserGitProvider::class, 'git_provider_id');
    }

    /**
     * Check if project has Git integration configured
     */
    public function hasGitIntegration(): bool
    {
        return $this->git_provider_id !== null && $this->git_repository !== null;
    }

    /**
     * Get Git settings as array for frontend
     */
    public function getGitSettings(): array
    {
        return [
            'provider_id' => $this->git_provider_id,
            'provider' => $this->gitProvider?->provider,
            'provider_username' => $this->gitProvider?->username,
            'repository' => $this->git_repository,
            'default_branch' => $this->git_default_branch,
            'main_branch' => $this->git_main_branch,
            'target_directory' => $this->git_target_directory,
            'workflow' => $this->git_workflow ?? 'push_only',
            'pr_title_template' => $this->git_pr_title_template,
            'pr_description_template' => $this->git_pr_description_template,
            'auto_delete_branch' => $this->git_auto_delete_branch ?? true,
            'is_configured' => $this->hasGitIntegration(),
        ];
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
     * Get attachments for this project (documents, images, PDFs etc.)
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(ProjectAttachment::class)
                    ->orderBy('is_pinned', 'desc')
                    ->orderBy('created_at', 'desc');
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
     * Get code adjustments for this project
     */
    public function codeAdjustments(): HasMany
    {
        return $this->hasMany(CodeAdjustment::class)->orderBy('execution_order');
    }

    /**
     * Get active code adjustments
     */
    public function activeCodeAdjustments(): HasMany
    {
        return $this->hasMany(CodeAdjustment::class)
                    ->where('is_active', true)
                    ->orderBy('execution_order');
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
              ->orWhereHas('teams', function ($teamQuery) use ($user) {
                  // Team members of project teams - but only if team is NOT soft-locked
                  $teamQuery->whereHas('members', function ($memberQuery) use ($user) {
                      $memberQuery->where('user_id', $user->id);
                  })
                  // Exclude teams that have a soft-locked subscription
                  ->where(function ($subQuery) {
                      $subQuery->whereDoesntHave('subscription')
                               ->orWhereHas('subscription', function ($subscriptionQuery) {
                                   $subscriptionQuery->where('is_soft_locked', false);
                               });
                  });
              });
        });
    }

    /**
     * Check if user can create private projects
     */
    public function canCreatePrivate($user): bool
    {
        return $user && in_array($user->user_type, ['patron', 'system']);
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

    /**
     * Check if user has a specific permission for this project via team membership
     *
     * @param User $user
     * @param string $permission Permission name (e.g., 'schema.edit', 'template.view')
     * @return bool
     */
    public function userHasPermission(User $user, string $permission): bool
    {
        // Project owner has all permissions
        if ((string)$this->owner_id === (string)$user->id) {
            return true;
        }

        // Check team membership if project has a team
        if ($this->team_id) {
            $team = Team::find($this->team_id);
            if ($team) {
                // Team owner has all permissions
                if ($team->project_owner_id === $user->id) {
                    return true;
                }

                // Check team member's permission
                $member = TeamMember::where('team_id', $team->id)
                    ->where('user_id', $user->id)
                    ->first();

                if ($member) {
                    return $member->hasPermission($permission);
                }
            }
        }

        // Direct project member - check legacy role (admin has all permissions)
        $directMembership = $this->getMembership($user);
        if ($directMembership) {
            // Legacy: admin has all permissions, member has view permissions
            if ($directMembership->isAdmin()) {
                return true;
            }
            // Basic members can view
            if (str_contains($permission, '.view')) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if user can view schemas in this project
     */
    public function userCanViewSchemas(User $user): bool
    {
        return $this->userHasPermission($user, 'schema.view');
    }

    /**
     * Check if user can edit schemas in this project
     */
    public function userCanEditSchemas(User $user): bool
    {
        return $this->userHasPermission($user, 'schema.edit');
    }

    /**
     * Check if user can view templates in this project
     */
    public function userCanViewTemplates(User $user): bool
    {
        return $this->userHasPermission($user, 'template.view');
    }

    /**
     * Check if user can edit templates in this project
     */
    public function userCanEditTemplates(User $user): bool
    {
        return $this->userHasPermission($user, 'template.edit');
    }

    /**
     * Check if user can run code generation in this project
     */
    public function userCanGenerate(User $user): bool
    {
        return $this->userHasPermission($user, 'generation.run');
    }

    /**
     * Check if user can deploy from this project
     */
    public function userCanDeploy(User $user): bool
    {
        return $this->userHasPermission($user, 'generation.deploy');
    }

    /**
     * Check if user can manage forms in this project
     */
    public function userCanManageForms(User $user): bool
    {
        return $this->userHasPermission($user, 'forms.manage');
    }

    /**
     * Check if user can use kanban in this project
     */
    public function userCanUseKanban(User $user): bool
    {
        return $this->userHasPermission($user, 'kanban.use');
    }

    /**
     * Check if user can send messages in this project
     */
    public function userCanSendMessages(User $user): bool
    {
        return $this->userHasPermission($user, 'messaging.send');
    }

    /**
     * Check if user can edit this project settings
     */
    public function userCanEditProject(User $user): bool
    {
        return $this->userHasPermission($user, 'project.edit');
    }

    /**
     * Check if user can delete this project
     */
    public function userCanDeleteProject(User $user): bool
    {
        return $this->userHasPermission($user, 'project.delete');
    }
}
