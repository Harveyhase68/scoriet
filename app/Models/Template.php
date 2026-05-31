<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Template extends Model
{
    use HasFactory;

    /**
     * Build a unique full_name in the canonical "username/template_slug"
     * format. This is the single source of truth — every code path that
     * creates or renames a template MUST go through here so we never end
     * up with the old "projectname/templatename" inconsistency again.
     *
     * Uniqueness is global (full_name has to be one-of-a-kind across the
     * platform). Pass $excludeId on UPDATE so a template doesn't trip on
     * its own existing full_name and bump to "_2".
     *
     * @param  string|null $username      Defaults to "anonymous" when the
     *                                    user has neither username nor name.
     * @param  string      $templateName  Raw template name; will be slugged.
     * @param  int|null    $excludeId     Template id to skip during the
     *                                    uniqueness scan (the row that is
     *                                    BEING renamed).
     */
    public static function buildFullName(?string $username, string $templateName, ?int $excludeId = null): string
    {
        $u = strtolower(trim((string) $username));
        if ($u === '') {
            $u = 'anonymous';
        }
        $base = $u . '/' . Str::slug($templateName, '_');
        $fullName = $base;
        $counter  = 2;

        $query = function (string $candidate) use ($excludeId) {
            $q = self::where('full_name', $candidate);
            if ($excludeId !== null) {
                $q->where('id', '!=', $excludeId);
            }
            return $q->exists();
        };

        while ($query($fullName)) {
            $fullName = $base . '_' . $counter;
            $counter++;
        }

        return $fullName;
    }

    protected $fillable = [
        'name',
        'full_name',
        'compatibility_tag',
        'generation_order',
        'version',
        'description',
        'creator_user_id',
        'project_id',
        'visibility',
        'is_system_template',
        'original_template_id',
        'template_type',
        'history',
        'community_rating',
        'category',
        'language',
        'is_active',
        'tags',
        'file_count',
        'review_status',
        'review_score',
        'protected_files',
        'install_script',
        'update_script',
        // Store fields
        'price_type',
        'price_credits',
        'price_euros',
        'is_store_approved',
        'sales_count',
        'total_revenue',
        'is_from_store',
        'resale_allowed',
        // Clone tracking
        'cloned_from_template_id',
        'visibility_locked',
    ];

    protected $casts = [
        // See note on Project::$casts re: BIGINT-as-string from MariaDB/PDO.
        'creator_user_id' => 'integer',
        'project_id' => 'integer',
        'original_template_id' => 'integer',
        'tags' => 'array',
        'is_active' => 'boolean',
        'is_system_template' => 'boolean',
        'generation_order' => 'integer',
        'version' => 'integer',
        'file_count' => 'integer',
        'review_score' => 'integer',
        'protected_files' => 'array',
        'install_script' => 'array',
        'update_script' => 'array',
        'history' => 'array',
        'community_rating' => 'array',
        // Store fields
        'price_credits' => 'integer',
        'price_euros' => 'decimal:2',
        'is_store_approved' => 'boolean',
        'sales_count' => 'integer',
        'total_revenue' => 'decimal:2',
        'is_from_store' => 'boolean',
        'resale_allowed' => 'boolean',
        'visibility_locked' => 'boolean',
    ];

    /**
     * Get the template files for the template.
     */
    public function files()
    {
        return $this->hasMany(TemplateFile::class)
            ->orderByRaw('CASE WHEN file_order > 0 THEN 0 ELSE 1 END')
            ->orderBy('file_order')
            ->orderBy('file_name');
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
     * Get the reviews for this template
     */
    public function reviews()
    {
        return $this->hasMany(TemplateReview::class);
    }

    /**
     * Get all media for this template.
     */
    public function media()
    {
        return $this->hasMany(TemplateMedia::class)->ordered();
    }

    /**
     * Get the logo for this template.
     */
    public function logo()
    {
        return $this->hasOne(TemplateMedia::class)->where('media_type', 'logo');
    }

    /**
     * Get all images for this template.
     */
    public function images()
    {
        return $this->hasMany(TemplateMedia::class)->where('media_type', 'image')->ordered();
    }

    /**
     * Get all videos for this template.
     */
    public function videos()
    {
        return $this->hasMany(TemplateMedia::class)->where('media_type', 'video')->ordered();
    }

    /**
     * Get all purchases for this template.
     */
    public function purchases()
    {
        return $this->hasMany(TemplatePurchase::class);
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
     * Get the assigned schema versions through project templates (legacy - DEPRECATED).
     * This relationship is no longer used and always returns empty.
     */
    public function schemaVersions()
    {
        return $this->belongsToMany(SchemaVersion::class, 'project_template_usage')
            ->whereRaw('1 = 0'); // Always return empty - legacy relationship
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
            // System templates (ALWAYS accessible, no review required)
            $q->where('is_system_template', true)
            // User's own templates (ALL of them, including system templates they created)
            ->orWhere('creator_user_id', $userId)
            // Public project templates from user's accessible projects (any score - frontend filters by reviewer status)
            ->orWhere(function($projectQ) use ($userId) {
                $projectQ->where('is_system_template', false)
                         ->whereHas('project', function($projectAccessQ) use ($userId) {
                             $projectAccessQ->visibleTo(\App\Models\User::find($userId));
                         })
                         ->where('visibility', 'public')
                         ->where('creator_user_id', '!=', $userId); // Avoid duplicates with own templates
            })
            // Other users' public templates without project association (any score - frontend filters by reviewer status)
            ->orWhere(function($publicQ) use ($userId) {
                $publicQ->where('is_system_template', false)
                        ->where('visibility', 'public')
                        ->whereNull('project_id')
                        ->where('creator_user_id', '!=', $userId); // Avoid duplicates with own templates
            })
            // Store templates (any score - frontend filters by reviewer status and is_store_approved)
            ->orWhere(function($storeQ) use ($userId) {
                $storeQ->where('is_system_template', false)
                       ->where('visibility', 'store')
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
        // Public templates are accessible to everyone
        if ($this->visibility === 'public') {
            return true;
        }

        // Owner can always access
        if ($this->owner_id == (string)$user->id || $this->creator_user_id == (string)$user->id) {
            return true;
        }

        // Project templates - check project access and permissions
        if ($this->project_id && $this->project) {
            // Project owner can always access
            if ((string)$this->project->owner_id === (string)$user->id) {
                return true;
            }

            // Check team permissions if project has a team
            if ($this->project->team_id) {
                $team = \App\Models\Team::find($this->project->team_id);
                if ($team) {
                    // Team owner can always access
                    if ($team->project_owner_id === $user->id) {
                        return true;
                    }

                    // Check team member's template.view permission
                    $member = \App\Models\TeamMember::where('team_id', $team->id)
                        ->where('user_id', $user->id)
                        ->first();

                    if ($member && $member->hasPermission('template.view')) {
                        return true;
                    }
                }
            }

            // Fallback to basic project access for non-team projects
            return $this->project->userCanAccess($user);
        }

        return false;
    }

    /**
     * Check if user can edit this template
     */
    public function canBeEditedBy($user): bool
    {
        // System templates can only be edited by system users (the creator)
        if ($this->is_system_template) {
            return $user->user_type === 'system' && $this->creator_user_id == (string)$user->id;
        }

        // Creator can always edit
        if ($this->creator_user_id == $user->id) {
            return true;
        }

        // Project templates - check project access and permissions
        if ($this->project_id && $this->project) {
            // Project owner can always edit
            if ((string)$this->project->owner_id === (string)$user->id) {
                return true;
            }

            // Check team permissions if project has a team
            if ($this->project->team_id) {
                $team = \App\Models\Team::find($this->project->team_id);
                if ($team) {
                    // Team owner can always edit
                    if ($team->project_owner_id === $user->id) {
                        return true;
                    }

                    // Check team member's template.edit permission
                    $member = \App\Models\TeamMember::where('team_id', $team->id)
                        ->where('user_id', $user->id)
                        ->first();

                    if ($member && $member->hasPermission('template.edit')) {
                        return true;
                    }
                }
            }

            // Fallback to basic project access for non-team projects
            return $this->project->userCanAccess($user);
        }

        return false;
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

        // Store templates can be cloned if purchased
        if ($this->visibility === 'store') {
            return \App\Models\TemplatePurchase::hasPurchased($user->id, $this->id);
        }

        // Private templates can only be cloned by users with project access
        if ($this->project_id) {
            return $this->project && $this->project->userCanAccess($user);
        }

        // Fallback to creator check
        return $this->creator_user_id == $user->id;
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

        // Reviewers (system, review user types or inner_core) can use any public/store template for testing
        // This allows them to test templates before approval
        $isReviewer = in_array($user->user_type, ['system', 'review']) || $user->is_inner_core;
        if ($isReviewer && in_array($this->visibility, ['public', 'store'])) {
            return true;
        }

        // Store templates can be used if purchased
        if ($this->visibility === 'store') {
            // Check if user purchased this template
            return \App\Models\TemplatePurchase::hasPurchased($user->id, $this->id);
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
                if ($availableSchema->id == $requiredSchema->id ||
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

        // Project templates can be viewed by users with project access (team members)
        if ($this->project_id) {
            if ($this->project && $this->project->userCanAccess($user)) {
                return true;
            }
        }

        // Templates linked to projects via project_template_usage can be viewed by project members
        $linkedProjects = ProjectTemplateUsage::where('template_id', $this->id)
            ->where('is_active', true)
            ->pluck('project_id');

        if ($linkedProjects->isNotEmpty()) {
            foreach ($linkedProjects as $projectId) {
                $project = Project::find($projectId);
                if ($project && $project->userCanAccess($user)) {
                    return true;
                }
            }
        }

        // Inner Core members can view public and store templates for review purposes
        if ($user->is_inner_core && in_array($this->visibility, ['public', 'store'])) {
            return true;
        }

        // Admins and system users can view all templates
        if ($user->user_type === 'system') {
            return true;
        }

        // Public templates can be viewed by anyone
        if ($this->visibility === 'public') {
            return true;
        }

        // Store templates can be viewed if purchased
        if ($this->visibility === 'store') {
            return \App\Models\TemplatePurchase::hasPurchased($user->id, $this->id);
        }

        // Private templates can only be viewed by creator
        return false;
    }

    /**
     * Clone this template for a project with new name
     */
    /**
     * Clone this template for a user. The clone's full_name is built from
     * the cloning user's username — never from a project name — so the
     * identity stays stable even if the clone later gets linked to multiple
     * projects (or none).
     *
     * @param  \App\Models\User      $user        The user performing the clone (becomes the creator)
     * @param  string|null           $newName     Optional new template name (defaults to original)
     * @param  string                $visibility  'public' or 'private' (private requires patron/system tier)
     * @param  \App\Models\Project|null $project  Optional origin/home project — only used to populate
     *                                            the legacy project_id column for backwards-compatible
     *                                            multi-project listings. Pass null to clone without
     *                                            any project association.
     */
    public function cloneForUser($user, ?string $newName = null, string $visibility = 'public', $project = null): Template
    {
        $newTemplateName = $newName ?: $this->name;

        // Ensure template name follows validation rules
        if (!self::validateTemplateName($newTemplateName)) {
            $newTemplateName = self::sanitizeTemplateName($newTemplateName);
        }

        $fullName = self::buildFullName($user->username ?? $user->name, $newTemplateName);

        // Private visibility requires patron/system tier — checked against the
        // CLONING user (not a project owner), so the permission follows the
        // person doing the action.
        $canCreatePrivate = in_array($user->user_type, ['patron', 'system']);
        $finalVisibility  = ($visibility === 'private' && $canCreatePrivate) ? 'private' : 'public';

        $clonedTemplate = Template::create([
            'name'                 => $newTemplateName,
            'full_name'            => $fullName,
            'description'          => $this->description,
            'project_id'           => $project?->id, // optional origin marker
            'creator_user_id'      => $user->id,     // cloner owns the clone
            'visibility'           => $finalVisibility,
            'is_system_template'   => false,
            'original_template_id' => $this->id,
            'category'             => $this->category,
            'language'             => $this->language,
            'is_active'            => true,
            'tags'                 => $this->tags,
            'file_count'           => $this->file_count,
            'protected_files'      => $this->protected_files,
            'install_script'       => $this->install_script,
            'update_script'        => $this->update_script,
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

    /**
     * Get the custom variables defined for this template
     */
    public function variables()
    {
        return $this->hasMany(TemplateVariable::class);
    }

    /**
     * Get the variable values for projects using this template
     */
    public function variableValues()
    {
        return $this->hasMany(ProjectTemplateVariableValue::class);
    }

    /**
     * Check if template is a clone
     */
    public function isClone(): bool
    {
        return $this->template_type === 'cloned';
    }

    /**
     * Check if template is linked
     */
    public function isLinked(): bool
    {
        return $this->template_type === 'linked';
    }

    /**
     * Check if template is original
     */
    public function isOriginal(): bool
    {
        return $this->template_type === 'original';
    }

    /**
     * Get community warning status
     */
    public function hasWarning(): bool
    {
        $rating = $this->community_rating ?? [];
        $negative = $rating['negative'] ?? 0;
        return $negative >= 5;
    }

    /**
     * Get community verified status
     */
    public function isCommunityVerified(): bool
    {
        $rating = $this->community_rating ?? [];
        $positive = $rating['positive'] ?? 0;
        return $positive >= 5;
    }

    /**
     * Add history entry when template is published
     */
    public function addHistoryEntry($userId, $changesDescription = null): void
    {
        $history = $this->history ?? [];

        // Initialize history if this is first publish
        if (empty($history)) {
            $history = [
                'original_creator_id' => $this->creator_user_id,
                'original_created_at' => $this->created_at->toIso8601String(),
                'forks' => []
            ];
        }

        // Add new fork entry
        $history['forks'][] = [
            'user_id' => $userId,
            'forked_at' => now()->toIso8601String(),
            'published_at' => now()->toIso8601String(),
            'changes_description' => $changesDescription
        ];

        $this->history = $history;
        $this->save();
    }

    /**
     * Update community rating
     */
    public function updateCommunityRating($positive = 0, $negative = 0, $warning = null): void
    {
        $rating = $this->community_rating ?? [
            'total_reviews' => 0,
            'positive' => 0,
            'negative' => 0,
            'warnings' => [],
            'last_reviewed_at' => null
        ];

        $rating['positive'] += $positive;
        $rating['negative'] += $negative;
        $rating['total_reviews'] = $rating['positive'] + $rating['negative'];
        $rating['last_reviewed_at'] = now()->toIso8601String();

        if ($warning) {
            $rating['warnings'][] = $warning;
        }

        $this->community_rating = $rating;
        $this->save();
    }

    /**
     * Scope to get only user's own templates (original + cloned)
     */
    public function scopeOwnedBy($query, $userId)
    {
        return $query->where('creator_user_id', $userId)
                    ->whereIn('template_type', ['original', 'cloned']);
    }

    /**
     * Scope to get community templates (system + public from other users)
     */
    public function scopeCommunity($query, $userId)
    {
        return $query->where(function($q) use ($userId) {
            // System templates
            $q->where('is_system_template', true)
              ->where('visibility', 'public')
            // OR public templates from other users
              ->orWhere(function($publicQ) use ($userId) {
                  $publicQ->where('is_system_template', false)
                          ->where('visibility', 'public')
                          ->where('creator_user_id', '!=', $userId);
              });
        });
    }

    /**
     * Get the subscription for this template
     */
    public function subscription()
    {
        return $this->hasOne(Subscription::class, 'entity_id')
                    ->where('subscription_type', Subscription::TYPE_TEMPLATE);
    }

    // =====================================================
    // STORE METHODS
    // =====================================================

    /**
     * Check if this template is a store template.
     */
    public function isStoreTemplate(): bool
    {
        return $this->visibility === 'store';
    }

    /**
     * Check if this template can be sold in the store.
     * Requires admin approval OR 5+ positive reviews.
     */
    public function canBeSoldInStore(): bool
    {
        if ($this->is_store_approved) {
            return true;
        }

        return $this->review_score >= 5;
    }

    /**
     * Scope for store templates.
     */
    public function scopeStore($query)
    {
        return $query->where('visibility', 'store');
    }

    /**
     * Scope for approved store templates.
     */
    public function scopeStoreApproved($query)
    {
        return $query->where('visibility', 'store')
                    ->where(function($q) {
                        $q->where('is_store_approved', true)
                          ->orWhere('review_score', '>=', 5);
                    });
    }

    /**
     * Check if a user can purchase this template.
     */
    public function canBePurchasedBy($user): bool
    {
        // Can't buy your own template
        if ($this->creator_user_id == $user->id) {
            return false;
        }

        // Must be a store template
        if (!$this->isStoreTemplate()) {
            return false;
        }

        // Check if already purchased
        if (TemplatePurchase::hasPurchased($user->id, $this->id)) {
            return false;
        }

        return true;
    }

    /**
     * Check if a user owns this template (creator or purchased).
     */
    public function isOwnedBy($user): bool
    {
        // Creator always owns
        if ($this->creator_user_id == $user->id) {
            return true;
        }

        // Check if purchased
        return TemplatePurchase::hasPurchased($user->id, $this->id);
    }

    /**
     * Check if this template can be cloned for resale.
     * Store-purchased templates cannot be resold unless explicitly allowed.
     */
    public function canBeClonedForResale(): bool
    {
        if (!$this->is_from_store) {
            return true;
        }

        return $this->resale_allowed;
    }

    /**
     * Get the price in the template's price type.
     */
    public function getPrice(): ?float
    {
        if ($this->price_type === 'credits') {
            return (float) $this->price_credits;
        }

        if ($this->price_type === 'euros') {
            return (float) $this->price_euros;
        }

        return null;
    }

    /**
     * Get formatted price string.
     */
    public function getFormattedPriceAttribute(): string
    {
        if ($this->price_type === 'credits') {
            return $this->price_credits . ' Credits';
        }

        if ($this->price_type === 'euros') {
            return number_format($this->price_euros, 2) . ' EUR';
        }

        return 'Free';
    }

    /**
     * Check if this template accepts credit payments.
     */
    public function acceptsCredits(): bool
    {
        return $this->price_type === 'credits';
    }

    /**
     * Check if this template accepts euro payments.
     */
    public function acceptsEuros(): bool
    {
        return $this->price_type === 'euros';
    }

    /**
     * Calculate seller revenue (80%).
     */
    public function calculateSellerRevenue(): float
    {
        return round($this->getPrice() * 0.80, 2);
    }

    /**
     * Calculate platform fee (20%).
     */
    public function calculatePlatformFee(): float
    {
        return round($this->getPrice() * 0.20, 2);
    }

    /**
     * Increment sales count and revenue.
     */
    public function recordSale(float $revenue): void
    {
        $this->increment('sales_count');
        $this->increment('total_revenue', $revenue);
    }

    /**
     * Validate store price.
     * Credits: minimum 50
     * Euros: minimum 1.00
     */
    public static function validateStorePrice(?string $priceType, ?int $priceCredits, ?float $priceEuros): array
    {
        $errors = [];

        if ($priceType === 'credits') {
            if ($priceCredits === null || $priceCredits < 50) {
                $errors['price_credits'] = 'Minimum price is 50 credits.';
            }
        } elseif ($priceType === 'euros') {
            if ($priceEuros === null || $priceEuros < 1.00) {
                $errors['price_euros'] = 'Minimum price is 1.00 EUR.';
            }
        } else {
            $errors['price_type'] = 'Price type must be credits or euros for store templates.';
        }

        return $errors;
    }
}