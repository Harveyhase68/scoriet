<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\FloatingSchema;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use App\Models\Team;
use App\Services\ProjectFileTreeGenerator;
use App\Events\ProjectUpdated;
use App\Events\ProjectLocked;
use App\Events\ProjectUnlocked;

class ProjectController extends Controller
{
    /**
     * Check if user has access to project (owner or team member)
     */
    private function userHasProjectAccess(Project $project, $user = null): bool
    {
        $user = $user ?? Auth::user();
        
        
        if (!$user) {
            return false;
        }
        
        // Owner has access (force string comparison for cross-platform compatibility)
        if ((string)$project->owner_id === (string)$user->id) {
            return true;
        }
        
        // Team members have access
        return $project->teams()->whereHas('members', function($query) use ($user) {
            $query->where('user_id', $user->id);
        })->exists();
    }
    /**
     * Display a listing of projects visible to the user
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $showPublic = $request->get('public', false);
        
        if ($showPublic) {
            // Public project gallery - all public projects
            $projects = Project::with(['owner'])
                ->public()
                ->active()
                ->latest()
                ->get()
                ->map(function ($project) {
                    $counts = $project->getCounts();
                    return [
                        'id' => $project->id,
                        'name' => $project->name,
                        'description' => $project->description,
                        'owner' => $project->owner->only(['id', 'name', 'username']),
                        'is_public' => $project->is_public,
                        'created_at' => $project->created_at,
                        'teams_count' => $counts['teams_count'],
                        'schemas_count' => $counts['schemas_count'],
                        'templates_count' => $counts['templates_count'],
                        'can_join' => $project->allow_join_requests && !empty($project->join_code),
                    ];
                });
        } else {
            // Simple approach: just get projects owned by the user for now
            $projects = Project::with(['owner'])
                ->where('owner_id', $user->id)
                ->active()
                ->latest()
                ->get()
                ->map(function ($project) use ($user) {
                    // Get actual counts using the Project model's getCounts() method
                    $counts = $project->getCounts();

                    // Get subscription info for this project
                    $subscription = $project->subscription;
                    $subscriptionData = null;
                    $isSoftLocked = false;

                    if ($subscription) {
                        // Auto-apply soft-lock if expired
                        $subscription->checkAndApplySoftLock();
                        $isSoftLocked = $subscription->is_soft_locked;

                        $subscriptionData = [
                            'id' => $subscription->id,
                            'expires_at' => $subscription->expires_at?->toISOString(),
                            'is_expired' => $subscription->isExpired(),
                            'is_soft_locked' => $subscription->is_soft_locked,
                            'days_remaining' => $subscription->getDaysUntilExpiry(),
                        ];
                    }

                    return array_merge($project->toArray(), [
                        'teams_count' => $counts['teams_count'],
                        'members_count' => $counts['members_count'],
                        'applications_count' => $counts['applications_count'],
                        'templates_count' => $counts['templates_count'],
                        'schemas_count' => $counts['schemas_count'],
                        'databases_count' => $counts['databases_count'],
                        'is_owner' => true, // Since we only get owned projects
                        'is_soft_locked' => $isSoftLocked,
                        'subscription' => $subscriptionData,
                    ]);
                });

            // Get current project (for now, just the latest one)
            $currentProject = $projects->first();

            // Calculate subscription info for free users
            $subscriptionInfo = null;
            $isFreeUser = $user->user_type === 'free' || !$user->user_type;

            if ($isFreeUser) {
                // Count active project subscription SLOTS (not expired)
                // NOTE: Subscriptions are slot-based (entity_id = null), not tied to specific projects
                $activeSlots = \App\Models\Subscription::where('user_id', $user->id)
                    ->where('subscription_type', \App\Models\Subscription::TYPE_PROJECT)
                    ->where('is_active', true)
                    ->where('expires_at', '>', now())
                    ->get();

                $activeSubscriptionsCount = $activeSlots->count();

                // Get the earliest expiring slot for warning purposes
                $earliestExpiry = $activeSlots->min('expires_at');
                $daysUntilExpiry = $earliestExpiry ? now()->diffInDays($earliestExpiry, false) : null;

                // Free users can have: 1 (free) + number of active subscription slots
                $maxAllowedProjects = 1 + $activeSubscriptionsCount;
                $ownedProjectsCount = $projects->count();

                // Calculate available slots (can be negative if subscriptions expired)
                $availableSlots = $maxAllowedProjects - $ownedProjectsCount;

                $subscriptionInfo = [
                    'active_slots' => $activeSubscriptionsCount,
                    'owned_projects' => $ownedProjectsCount,
                    'max_allowed' => $maxAllowedProjects,
                    'available_slots' => max(0, $availableSlots),
                    'needs_unlock' => $ownedProjectsCount >= $maxAllowedProjects,
                    'earliest_expiry' => $earliestExpiry?->toISOString(),
                    'days_until_expiry' => $daysUntilExpiry,
                    // Legacy field for backwards compatibility
                    'active_subscriptions' => $activeSubscriptionsCount,
                ];
            }

            return response()->json([
                'projects' => $projects,
                'current_project' => $currentProject,
                'total_projects' => $projects->count(),
                'subscription_info' => $subscriptionInfo,
            ]);
        }

        return response()->json([
            'projects' => $projects,
            'total_projects' => $projects->count(),
        ]);
    }

    /**
     * Store a newly created project
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(_[a-z0-9]+)*$/', // Lowercase letters, numbers, and underscores for snake_case
                Rule::unique('projects')->where(function ($query) use ($user) {
                    return $query->where('owner_id', $user->id);
                })
            ],
            'description' => 'nullable|string|max:1000',
            'is_public' => 'boolean',
            'allow_join_requests' => 'boolean',
            // Clone-specific fields
            'is_clone' => 'boolean',
            'original_project_id' => 'nullable|integer|exists:projects,id',
            'creator_user_id' => 'nullable|integer', // Original creator attribution
            // Database connection fields
            'database_name' => 'nullable|string|max:255',
            'database_type' => 'nullable|string|max:50',
            'database_server' => 'nullable|string|max:255',
            'database_port' => 'nullable|string|max:10',
            'database_username' => 'nullable|string|max:255',
            'database_password' => 'nullable|string|max:255',
            // Diagram settings
            'diagram_max_tables_per_row' => 'nullable|integer|min:1|max:100',
            'diagram_table_width' => 'nullable|integer|min:100|max:1000',
            'diagram_table_height' => 'nullable|integer|min:100|max:2000',
            'diagram_horizontal_spacing' => 'nullable|integer|min:100|max:2000',
            'diagram_vertical_spacing' => 'nullable|integer|min:100|max:2000',
            // Form Designer settings
            'form_designer_snap_to_grid' => 'nullable|boolean',
            'form_designer_grid_size' => 'nullable|integer|min:5|max:100',
            // Report Designer settings
            'report_designer_snap_to_grid' => 'nullable|boolean',
            'report_designer_grid_unit' => 'nullable|string|in:mm,inch',
            'report_designer_grid_size' => 'nullable|numeric|min:0.1|max:100',
            // Project paths
            'project_directory' => 'nullable|string|max:500',
            'project_url' => 'nullable|string|max:500',
            // Project properties
            'start_page' => 'nullable|string|max:255',
            'default_language' => 'nullable|string|max:10',
            'target_language' => 'nullable|string|max:30',
            'archive_format' => 'nullable|string|in:zip,tar.gz,tar.xz',
            'filename_short_length' => 'nullable|integer|min:2|max:5',
            // API Keys
            'google_translate_api_key' => 'nullable|string|max:500',
        ]);

        // Handle cloning: Load original project if cloning
        $originalProject = null;
        $isClone = $validated['is_clone'] ?? false;
        if ($isClone && isset($validated['original_project_id'])) {
            $originalProject = Project::find($validated['original_project_id']);

            // Original project must be public to be cloned
            if (!$originalProject || !$originalProject->is_public) {
                return response()->json([
                    'message' => __('projectcontrollerphp238')
                ], 404);
            }
        }

        // Check project limit for free users
        $needsProjectSubscription = false;
        if ($user->user_type === 'free') {
            // Count active subscriptions (not expired)
            $activeSubscriptionsCount = \App\Models\Subscription::where('user_id', $user->id)
                ->where('subscription_type', \App\Models\Subscription::TYPE_PROJECT)
                ->where('is_active', true)
                ->where('expires_at', '>', now())
                ->count();

            // Free users can have: 1 (free) + number of active subscriptions
            $maxAllowedProjects = 1 + $activeSubscriptionsCount;
            $activeProjectCount = Project::where('owner_id', $user->id)->where('is_active', true)->count();

            if ($activeProjectCount >= $maxAllowedProjects) {
                // User needs to buy a new subscription slot
                if (!$user->hasCredits(50)) {
                    return response()->json([
                        'message' => __('projectcontrollerphp261'),
                        'error_code' => 'INSUFFICIENT_CREDITS',
                        'required_credits' => 50,
                        'current_credits' => $user->credits,
                        'active_projects' => $activeProjectCount,
                        'max_allowed' => $maxAllowedProjects,
                        'active_subscriptions' => $activeSubscriptionsCount
                    ], 403);
                }

                // User has enough credits - will deduct after project creation
                $needsProjectSubscription = true;
            }
        }

        // Note: All users can create private projects now
        // The only restriction is the number of projects (1 free, then 50 credits each)

        // Get user's profile language to add as first project language
        $userLanguage = $user->language ?? 'de'; // Default to 'de' if not set

        $project = Project::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'owner_id' => $user->id,
            'is_active' => true,
            'is_public' => $validated['is_public'] ?? true,
            'allow_join_requests' => $validated['allow_join_requests'] ?? false,
            // Database connection settings
            'database_name' => $validated['database_name'] ?? null,
            'database_type' => $validated['database_type'] ?? 'MySQL',
            'database_server' => $validated['database_server'] ?? '127.0.0.1',
            'database_port' => $validated['database_port'] ?? '3306',
            'database_username' => $validated['database_username'] ?? null,
            'database_password' => $validated['database_password'] ?? null,
            // Diagram settings
            'diagram_max_tables_per_row' => $validated['diagram_max_tables_per_row'] ?? 20,
            'diagram_table_width' => $validated['diagram_table_width'] ?? 280,
            'diagram_table_height' => $validated['diagram_table_height'] ?? 450,
            'diagram_horizontal_spacing' => $validated['diagram_horizontal_spacing'] ?? 600,
            'diagram_vertical_spacing' => $validated['diagram_vertical_spacing'] ?? 700,
            // Form Designer settings
            'form_designer_snap_to_grid' => $validated['form_designer_snap_to_grid'] ?? true,
            'form_designer_grid_size' => $validated['form_designer_grid_size'] ?? 20,
            // Project paths
            'project_directory' => $validated['project_directory'] ?? null,
            'project_url' => $validated['project_url'] ?? null,
            // Project properties
            'start_page' => $validated['start_page'] ?? 'index.php',
            'default_language' => $validated['default_language'] ?? 'en',
            'filename_short_length' => $validated['filename_short_length'] ?? 2,
            // Language settings - automatically add user's profile language
            'enabled_languages' => [$userLanguage],
            // API Keys
            'google_translate_api_key' => $validated['google_translate_api_key'] ?? null,
        ]);

        // Generate join code if join requests are allowed
        if ($project->allow_join_requests) {
            $project->generateJoinCode();
        }

        // Add the owner as the first project member with 'owner' role
        $project->members()->create([
            'user_id' => $user->id,
            'role' => 'owner',
            'joined_at' => now(),
        ]);

        // Note: Projects no longer create automatic schema versions
        // Schema versions are now created when schemas are associated with projects
        // via the project_schemas relationship

        // 🔄 CLONE: Copy schemas and templates from original project
        if ($isClone && $originalProject) {
            // Copy schema associations (link them, not clone them)
            $originalSchemas = $originalProject->floatingSchemas()->get();
            foreach ($originalSchemas as $schema) {
                // Link the schema to the new project (same association type)
                $project->floatingSchemas()->attach($schema->id, [
                    'association_type' => 'linked', // Always link when cloning (user can edit their own later)
                    'alias' => $schema->pivot->alias,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Copy template associations (link them, not clone them)
            $originalTemplateUsages = $originalProject->templateUsages()->where('is_active', true)->get();
            foreach ($originalTemplateUsages as $usage) {
                \App\Models\ProjectTemplateUsage::create([
                    'project_id' => $project->id,
                    'template_id' => $usage->template_id,
                    'usage_type' => 'linked', // Always link when cloning
                    'alias' => $usage->alias,
                    'config' => $usage->config,
                    'is_active' => true,
                    'used_at' => now(),
                ]);
            }

            // Copy project settings from original (if not explicitly set)
            $settingsToCopy = [
                'diagram_max_tables_per_row',
                'diagram_table_width',
                'diagram_table_height',
                'diagram_horizontal_spacing',
                'diagram_vertical_spacing',
                'form_designer_snap_to_grid',
                'form_designer_grid_size',
                'start_page',
                'default_language',
                'target_language',
                'archive_format',
                'filename_short_length',
                'enabled_languages',
            ];

            $updateData = [];
            foreach ($settingsToCopy as $setting) {
                // Only copy if not explicitly set in the request and original has a value
                if (!isset($validated[$setting]) && $originalProject->$setting !== null) {
                    $updateData[$setting] = $originalProject->$setting;
                }
            }

            if (!empty($updateData)) {
                $project->update($updateData);
            }

        }

        // If user needed a project subscription (Free user creating 2nd+ project)
        if ($needsProjectSubscription) {
            // Deduct 50 credits
            $user->deductCredits(50);

            // Create project subscription SLOT (valid for 1 year)
            // NOTE: entity_id is NULL - this is a "slot" subscription, not bound to a specific project
            // This allows users to delete and recreate projects without losing their subscription benefit
            \App\Models\Subscription::create([
                'user_id' => $user->id,
                'subscription_type' => \App\Models\Subscription::TYPE_PROJECT,
                'entity_id' => null, // SLOT-BASED: Not tied to specific project
                'expires_at' => now()->addYear(),
                'is_active' => true,
            ]);

            // Log the transaction
            \App\Models\CreditTransaction::create([
                'user_id' => $user->id,
                'amount' => -50,
                'type' => 'project_renewal',
                'description' => 'Project slot (1 year) - created project: ' . $project->name,
                'reference_type' => 'App\Models\Subscription',
                'reference_id' => null, // Slot-based, no specific entity
                'price_paid' => null,
            ]);
        }

        // Load the owner relationship
        $project->load('owner');

        // Add counts
        $counts = $project->getCounts();
        $projectData = array_merge($project->toArray(), $counts);

        return response()->json($projectData, 201);
    }

    /**
     * Display the specified project
     */
    public function show(Project $project): JsonResponse
    {
        // Check if user has access to this project
        if (!$this->userHasProjectAccess($project)) {
            return response()->json(['message' => __('projectcontrollerphp450')], 403);
        }

        // Load gitProvider relationship for Git integration
        $project->load('gitProvider');

        $counts = $project->getCounts();
        $projectData = array_merge($project->toArray(), $counts);

        return response()->json($projectData);
    }

    /**
     * Update the specified project
     */
    public function update(Request $request, Project $project): JsonResponse
    {
        // Check if user has access to this project
        if (!$this->userHasProjectAccess($project)) {
            return response()->json(['message' => __('projectcontrollerphp469')], 403);
        }

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(_[a-z0-9]+)*$/', // Lowercase letters, numbers, and underscores for snake_case
                Rule::unique('projects')->ignore($project->id)->where(function ($query) use ($project) {
                    return $query->where('owner_id', $project->owner_id);
                })
            ],
            'description' => 'nullable|string|max:1000',
            'is_active' => 'sometimes|boolean',
            'is_public' => 'sometimes|boolean',
            'join_code' => 'nullable|string|max:50|unique:projects,join_code,' . $project->id,
            'new_owner_id' => 'nullable|integer|exists:users,id',
            // Database connection fields
            'database_name' => 'nullable|string|max:255',
            'database_type' => 'nullable|string|max:50',
            'database_server' => 'nullable|string|max:255',
            'database_port' => 'nullable|string|max:10',
            'database_username' => 'nullable|string|max:255',
            'database_password' => 'nullable|string|max:255',
            // Diagram settings
            'diagram_max_tables_per_row' => 'nullable|integer|min:1|max:100',
            'diagram_table_width' => 'nullable|integer|min:100|max:1000',
            'diagram_table_height' => 'nullable|integer|min:100|max:2000',
            'diagram_horizontal_spacing' => 'nullable|integer|min:100|max:2000',
            'diagram_vertical_spacing' => 'nullable|integer|min:100|max:2000',
            // Form Designer settings
            'form_designer_snap_to_grid' => 'nullable|boolean',
            'form_designer_grid_size' => 'nullable|integer|min:5|max:100',
            // Report Designer settings
            'report_designer_snap_to_grid' => 'nullable|boolean',
            'report_designer_grid_unit' => 'nullable|string|in:mm,inch',
            'report_designer_grid_size' => 'nullable|numeric|min:0.1|max:100',
            // Project paths
            'project_directory' => 'nullable|string|max:500',
            'project_url' => 'nullable|string|max:500',
            // Project properties
            'start_page' => 'nullable|string|max:255',
            'default_language' => 'nullable|string|max:10',
            'target_language' => 'nullable|string|max:30',
            'archive_format' => 'nullable|string|in:zip,tar.gz,tar.xz',
            'filename_short_length' => 'nullable|integer|min:2|max:5',
            // API Keys
            'google_translate_api_key' => 'nullable|string|max:500',
            // Git integration fields
            'git_provider_id' => 'nullable|integer|exists:user_git_providers,id',
            'git_repository' => 'nullable|string|max:255',
            'git_default_branch' => 'nullable|string|max:100',
            'git_main_branch' => 'nullable|string|max:100',
            'git_target_directory' => 'nullable|string|max:500',
            'git_workflow' => 'nullable|in:push_only,push_and_pr,push_pr_merge',
            'git_pr_title_template' => 'nullable|string|max:255',
            'git_pr_description_template' => 'nullable|string|max:2000',
            'git_auto_delete_branch' => 'nullable|boolean',
        ]);

        // Handle owner transfer first if requested
        if (isset($validated['new_owner_id']) && $validated['new_owner_id']) {
            // Only current owner can transfer ownership
            $user = Auth::user();
            if ($project->owner_id !== $user->id) {
                return response()->json(['message' => __('projectcontrollerphp537')], 403);
            }

            // Check if new owner is a project member
            $newOwnerMembership = $project->members()->where('user_id', $validated['new_owner_id'])->first();
            if (!$newOwnerMembership) {
                return response()->json(['message' => __('projectcontrollerphp543')], 400);
            }

            // Transfer ownership
            $project->update(['owner_id' => $validated['new_owner_id']]);

            // Update memberships: new owner becomes owner, old owner becomes admin
            $newOwnerMembership->update(['role' => 'owner']);
            $oldOwnerMembership = $project->members()->where('user_id', $user->id)->first();
            if ($oldOwnerMembership) {
                $oldOwnerMembership->update(['role' => 'admin']);
            }

            // Transfer all teams associated with this project to the new owner
            $projectTeams = $project->teams()->get();
            foreach ($projectTeams as $team) {
                // Only transfer teams that belong to the old owner
                if ($team->project_owner_id == $user->id) {
                    $team->update(['project_owner_id' => $validated['new_owner_id']]);
                }
            }

            // Transfer all floating schemas associated with this project to the new owner
            $projectSchemas = $project->floatingSchemas()->get();
            foreach ($projectSchemas as $schema) {
                // Only transfer schemas that belong to the old owner
                if ($schema->owner_id == $user->id) {
                    $schema->update(['owner_id' => $validated['new_owner_id']]);
                }
            }

            // Transfer all project templates to the new owner
            // Note: creator_user_id stays the same (preserves original creator attribution)
            // Only project ownership changes via project_id relationship
            $projectTemplates = \App\Models\Template::where('project_id', $project->id)->get();
            // Templates automatically belong to new owner via project relationship
            // No additional updates needed for templates
        }

        // Remove new_owner_id from validated data before updating other fields
        unset($validated['new_owner_id']);
        $project->update($validated);

        // Refresh the project with owner
        $project->refresh();
        $project->load('owner');

        // Broadcast project update to all listeners
        $user = $user ?? Auth::user();
        ProjectUpdated::dispatch($project, $user->id);

        // Auto-release edit lock after successful save
        if ($project->isLockedBy($user)) {
            $project->forceUnlock();
            ProjectUnlocked::dispatch($project);
        }

        // Add counts
        $counts = $project->getCounts();
        $projectData = array_merge($project->toArray(), $counts);

        return response()->json($projectData);
    }

    /**
     * Remove the specified project (soft delete by setting is_active = false)
     */
    public function destroy(Project $project): JsonResponse
    {
        // Check if user has access to this project
        if (!$this->userHasProjectAccess($project)) {
            return response()->json(['message' => __('projectcontrollerphp604')], 403);
        }

        try {
            DB::beginTransaction();

            // Delete all project-related data (Pivot tables and HasMany relations)
            // Teams, Templates, and Schemas themselves are NOT deleted, only the associations

            // 1. Delete pivot table entries (associations with teams, schemas, templates)
            DB::table('project_teams')->where('project_id', $project->id)->delete();
            DB::table('project_schemas')->where('project_id', $project->id)->delete();
            DB::table('project_template_usage')->where('project_id', $project->id)->delete();

            // 2. Delete project-owned data
            DB::table('project_applications')->where('project_id', $project->id)->delete();
            DB::table('project_invitations')->where('project_id', $project->id)->delete();

            // 3. Delete items with CASCADE (will be deleted automatically, but explicit for clarity)
            // - project_generation_trees (has onDelete cascade)
            // - project_template_variable_values (has onDelete cascade)

            // NOTE: Project subscriptions are NOT deleted!
            // Subscriptions are slot-based (entity_id = null) and remain valid for future projects.
            // This allows users to delete and recreate projects without losing their paid subscription benefit.

            // 4. Finally, delete the project itself
            $project->delete();

            DB::commit();

            return response()->json(['message' => __('projectcontrollerphp635')]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to delete project', [
                'project_id' => $project->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => __('projectcontrollerphp646'),
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Permanently delete the project
     */
    public function forceDestroy(Project $project): JsonResponse
    {
        // Check if user has access to this project
        if (!$this->userHasProjectAccess($project)) {
            return response()->json(['message' => __('projectcontrollerphp659')], 403);
        }

        $project->delete();

        return response()->json(['message' => __('projectcontrollerphp664')]);
    }

    /**
     * Restore a deactivated project
     */
    public function restore(Project $project): JsonResponse
    {
        // Check if user has access to this project
        if (!$this->userHasProjectAccess($project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $project->update(['is_active' => true]);

        return response()->json(['message' => __('projectcontrollerphp679')]);
    }

    /**
     * Get available teams for assignment to project
     */
    public function getAvailableTeams(Project $project): JsonResponse
    {
        // Check if user has access to this project
        if (!$this->userHasProjectAccess($project)) {
            return response()->json(['message' => __('projectcontrollerphp689')], 403);
        }

        // Get teams that are not yet assigned to this project
        $assignedTeamIds = $project->teams()->pluck('teams.id')->toArray();
        
        $availableTeams = Team::with(['owner'])
            ->where('project_owner_id', Auth::id()) // Teams owned by current user
            ->whereNotIn('id', $assignedTeamIds) // Not already assigned to this project
            ->where('is_active', true)
            ->get();

        return response()->json($availableTeams);
    }

    /**
     * Get teams assigned to project
     */
    public function getAssignedTeams(Project $project): JsonResponse
    {
        // Check if user has access to this project
        if (!$this->userHasProjectAccess($project)) {
            return response()->json(['message' => __('projectcontrollerphp711')], 403);
        }

        // Get ONLY teams that are assigned via pivot table to this specific project
        $assignedTeams = Team::with(['owner'])
            ->whereHas('projects', function($q) use ($project) {
                $q->where('project_id', $project->id);
            })
            ->where('is_active', true)
            ->get();

        return response()->json($assignedTeams);
    }

    /**
     * Get all projects with their assigned teams (optimized single query)
     */
    public function getProjectsWithTeams(): JsonResponse
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => __('projectcontrollerphp733')], 401);
        }

        // Get team IDs where user is a member (existence in table = active membership)
        $teamIds = \App\Models\TeamMember::where('user_id', $user->id)
            ->pluck('team_id');

        // Get projects owned by the user OR accessible via team membership
        $projects = Project::where(function($query) use ($user, $teamIds) {
                // Projects owned by user
                $query->where('owner_id', $user->id);

                // OR projects accessible via team membership
                if ($teamIds->isNotEmpty()) {
                    $query->orWhereHas('teams', function($q) use ($teamIds) {
                        $q->whereIn('teams.id', $teamIds)
                          ->where('teams.is_active', true);
                    });
                }
            })
            ->active()
            ->with(['owner', 'teams' => function($query) {
                // Only load teams that are actually assigned to this project
                $query->where('is_active', true);
            }, 'teams.owner'])
            ->get()
            ->unique('id'); // Remove duplicates if user owns project AND is team member

        // Format projects with teams data
        $formattedProjects = $projects->map(function ($project) {
            $teams = $project->teams->map(function ($team) {
                return [
                    'id' => $team->id,
                    'name' => $team->name,
                    'description' => $team->description,
                    'project_owner_id' => $team->project_owner_id,
                    'is_active' => $team->is_active,
                    'created_at' => $team->created_at,
                    'updated_at' => $team->updated_at,
                    'owner' => $team->owner ? [
                        'id' => $team->owner->id,
                        'name' => $team->owner->name,
                        'email' => $team->owner->email,
                        'email_verified_at' => $team->owner->email_verified_at,
                        'username' => $team->owner->username,
                        'user_type' => $team->owner->user_type,
                        'language' => $team->owner->language,
                        'credits' => $team->owner->credits,
                        'patron_type' => $team->owner->patron_type,
                        'pending_project_invitation_id' => $team->owner->pending_project_invitation_id,
                        'created_at' => $team->owner->created_at,
                        'updated_at' => $team->owner->updated_at,
                    ] : null,
                ];
            });

            return [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'owner_id' => $project->owner_id,
                'is_active' => $project->is_active,
                'is_public' => $project->is_public,
                'created_at' => $project->created_at,
                'updated_at' => $project->updated_at,
                'owner' => $project->owner ? [
                    'id' => $project->owner->id,
                    'name' => $project->owner->name,
                    'email' => $project->owner->email,
                    'username' => $project->owner->username,
                ] : null,
                'teams' => $teams,
                'teams_count' => $teams->count(),
            ];
        });

        return response()->json([
            'projects' => $formattedProjects->values(), // Reset array keys after unique()
            'total_projects' => $formattedProjects->count(),
        ]);
    }

    /**
     * Assign teams to project
     */
    public function assignTeams(Request $request, Project $project): JsonResponse
    {
        // Check if user has access to this project
        if (!$this->userHasProjectAccess($project)) {
            return response()->json(['message' => __('projectcontrollerphp822')], 403);
        }

        $validated = $request->validate([
            'team_ids' => 'required|array',
            'team_ids.*' => 'exists:teams,id',
        ]);

        $teamIds = $validated['team_ids'];

        // Verify all teams belong to the current user
        $userTeams = Team::whereIn('id', $teamIds)
            ->where('project_owner_id', Auth::id())
            ->pluck('id')
            ->toArray();

        if (count($userTeams) !== count($teamIds)) {
            return response()->json(['message' => __('projectcontrollerphp839')], 403);
        }

        // Assign teams to project using pivot table
        $pivotData = [];
        foreach ($teamIds as $teamId) {
            $pivotData[$teamId] = [
                'assigned_at' => now(),
                'assigned_by' => Auth::id(),
                'created_at' => now(),
                'updated_at' => now()
            ];
        }
        
        $project->teams()->attach($pivotData);

        return response()->json(['message' => __('projectcontrollerphp855')]);
    }

    /**
     * Remove team from project
     */
    public function removeTeam(Project $project, Team $team): JsonResponse
    {
        // Check if user has access to this project
        if (!$this->userHasProjectAccess($project)) {
            return response()->json(['message' => __('projectcontrollerphp865')], 403);
        }

        // Check if team belongs to user
        if ((string)$team->project_owner_id !== (string)Auth::id()) {
            return response()->json(['message' => __('projectcontrollerphp870')], 403);
        }

        // Check if team is assigned to this project
        if (!$project->teams()->where('teams.id', $team->id)->exists()) {
            return response()->json(['message' => __('projectcontrollerphp875')], 400);
        }

        // Remove team from project using pivot table
        $project->teams()->detach($team->id);

        return response()->json(['message' => __('projectcontrollerphp881')]);
    }

    /**
     * Associate a schema with this project
     */
    public function associateSchema(Request $request, Project $project): JsonResponse
    {
        // Check if user has access to this project
        if (!$this->userHasProjectAccess($project)) {
            return response()->json(['message' => __('projectcontrollerphp891')], 403);
        }

        $validated = $request->validate([
            'schema_id' => 'required|exists:schemas,id',
            'association_type' => 'required|in:linked,cloned,imported',
            'alias' => 'nullable|string|max:255',
        ]);

        $schema = FloatingSchema::findOrFail($validated['schema_id']);
        
        // Check if user can access the schema
        if (!$schema->canBeAccessedBy(Auth::user())) {
            return response()->json(['message' => __('projectcontrollerphp904')], 404);
        }

        // Check if association already exists
        if ($project->hasSchemaAccess($schema)) {
            return response()->json(['message' => __('projectcontrollerphp909')], 422);
        }

        // Associate the schema
        $project->associateSchema($schema, $validated['association_type'], $validated['alias']);

        return response()->json(['message' => __('projectcontrollerphp915')]);
    }

    /**
     * Remove schema association from project
     */
    public function dissociateSchema(Project $project, FloatingSchema $schema): JsonResponse
    {
        // Check if user has access to this project
        if (!$this->userHasProjectAccess($project)) {
            return response()->json(['message' => __('projectcontrollerphp925')], 403);
        }

        // Check if association exists
        if (!$project->hasSchemaAccess($schema)) {
            return response()->json(['message' => __('projectcontrollerphp930')], 422);
        }

        // Remove association
        $project->dissociateSchema($schema);

        return response()->json(['message' => __('projectcontrollerphp936')]);
    }

    /**
     * Get schemas associated with this project
     */
    public function getProjectSchemas(Project $project): JsonResponse
    {
        $user = Auth::user();

        // Check if user has access to the project
        if (!$project->visibleTo($user)->exists()) {
            return response()->json(['message' => __('projectcontrollerphp948')], 404);
        }

        // Get all schemas linked to the project
        $linkedSchemas = $project->floatingSchemas()
            ->with(['owner', 'subscription'])
            ->withCount('schemaTables')
            ->get()
            ->map(function ($schema) use ($user) {
                // Get subscription info for this schema (if user owns it)
                $subscriptionData = null;
                $isSoftLocked = false;

                // Use integer comparison for owner check
                if ((int)$schema->owner_id === (int)$user->id) {
                    $subscription = $schema->subscription;
                    if ($subscription) {
                        // Auto-apply soft-lock if expired
                        $subscription->checkAndApplySoftLock();
                        $isSoftLocked = $subscription->is_soft_locked;

                        $subscriptionData = [
                            'id' => $subscription->id,
                            'expires_at' => $subscription->expires_at?->toISOString(),
                            'is_expired' => $subscription->isExpired(),
                            'is_soft_locked' => $subscription->is_soft_locked,
                            'days_remaining' => $subscription->getDaysUntilExpiry(),
                        ];
                    }
                }

                return [
                    'id' => $schema->id,
                    'name' => $schema->name,
                    'description' => $schema->description,
                    'owner_id' => $schema->owner_id,
                    'visibility' => $schema->visibility,
                    'last_version' => $schema->last_version,
                    'is_system_schema' => $schema->is_system_schema,
                    'created_at' => $schema->created_at,
                    'updated_at' => $schema->updated_at,
                    'association_type' => $schema->pivot->association_type,
                    'alias' => $schema->pivot->alias,
                    'associated_at' => $schema->pivot->created_at,
                    'owner' => $schema->owner ? [
                        'id' => $schema->owner->id,
                        'name' => $schema->owner->name,
                        'username' => $schema->owner->username,
                    ] : null,
                    'tables_count' => $schema->schema_tables_count ?? 0,
                    'is_soft_locked' => $isSoftLocked,
                    'subscription' => $subscriptionData,
                ];
            });

        // Get all schemas owned by the current user (regardless of link status)
        $ownedSchemas = FloatingSchema::where('owner_id', $user->id)
            ->with(['owner', 'subscription'])
            ->get()
            ->map(function ($schema) use ($linkedSchemas, $user) {
                // Check if already linked
                $existingLink = $linkedSchemas->firstWhere('id', $schema->id);
                if ($existingLink) {
                    return null; // Already in linked schemas
                }

                // Get subscription info for this schema
                $subscriptionData = null;
                $isSoftLocked = false;

                $subscription = $schema->subscription;
                if ($subscription) {
                    // Auto-apply soft-lock if expired
                    $subscription->checkAndApplySoftLock();
                    $isSoftLocked = $subscription->is_soft_locked;

                    $subscriptionData = [
                        'id' => $subscription->id,
                        'expires_at' => $subscription->expires_at?->toISOString(),
                        'is_expired' => $subscription->isExpired(),
                        'is_soft_locked' => $subscription->is_soft_locked,
                        'days_remaining' => $subscription->getDaysUntilExpiry(),
                    ];
                }

                // Add as unlinked schema
                return [
                    'id' => $schema->id,
                    'name' => $schema->name,
                    'description' => $schema->description,
                    'owner_id' => $schema->owner_id,
                    'visibility' => $schema->visibility,
                    'last_version' => $schema->last_version,
                    'is_system_schema' => $schema->is_system_schema,
                    'created_at' => $schema->created_at,
                    'updated_at' => $schema->updated_at,
                    'association_type' => null,
                    'alias' => null,
                    'associated_at' => null,
                    'owner' => $schema->owner ? [
                        'id' => $schema->owner->id,
                        'name' => $schema->owner->name,
                        'username' => $schema->owner->username,
                    ] : null,
                    'is_soft_locked' => $isSoftLocked,
                    'subscription' => $subscriptionData,
                ];
            })
            ->filter(); // Remove nulls

        // Merge owned schemas with linked schemas (use concat for arrays)
        $allSchemas = $linkedSchemas->concat($ownedSchemas)->values();

        return response()->json($allSchemas);
    }

    /**
     * Get editable schemas for this project (cloned/imported/linked if owner)
     */
    public function getEditableSchemas(Project $project): JsonResponse
    {
        $user = Auth::user();

        // Check if user has access to the project
        if (!$project->visibleTo($user)->exists()) {
            return response()->json(['message' => __('projectcontrollerphp1071')], 404);
        }

        // Get all schemas associated with the project
        $allSchemas = $project->floatingSchemas()
            ->with(['owner'])
            ->get();

        // Filter to only include editable schemas:
        // - cloned and imported schemas are always editable
        // - linked schemas are editable only if user is the owner
        $editableSchemas = $allSchemas->filter(function ($schema) use ($user) {
            $associationType = $schema->pivot->association_type;

            // Cloned and imported schemas are always editable
            if (in_array($associationType, ['cloned', 'imported'])) {
                return true;
            }

            // Linked schemas are editable only if user is the owner
            if ($associationType === 'linked' && (string)$schema->owner_id === (string)$user->id) {
                return true;
            }

            return false;
        })->map(function ($schema) {
            return [
                'id' => $schema->id,
                'name' => $schema->name,
                'description' => $schema->description,
                'last_version' => $schema->last_version,
                'association_type' => $schema->pivot->association_type,
                'alias' => $schema->pivot->alias,
                'owner' => $schema->owner->only(['id', 'name']),
            ];
        })->values(); // Re-index the collection

        return response()->json($editableSchemas);
    }

    /**
     * Get project members
     */
    public function getProjectMembers(Project $project): JsonResponse
    {
        $user = Auth::user();

        // Check if user has access to the project
        if (!$project->visibleTo($user)->exists()) {
            return response()->json(['message' => __('projectcontrollerphp1120')], 404);
        }

        // Get all project members with user details
        $members = $project->members()
            ->with(['user'])
            ->orderBy('role', 'desc') // Owner first, then admin, then member
            ->orderBy('joined_at', 'asc')
            ->get()
            ->map(function ($membership) {
                return [
                    'id' => $membership->id,
                    'user_id' => $membership->user_id,
                    'role' => $membership->role,
                    'joined_at' => $membership->joined_at,
                    'user' => [
                        'id' => $membership->user->id,
                        'name' => $membership->user->name,
                        'email' => $membership->user->email,
                        'username' => $membership->user->username,
                    ]
                ];
            });

        // Add project owner if not already in members list (fallback for old projects)
        $ownerAlreadyInList = $members->where('user_id', $project->owner_id)->isNotEmpty();
        if (!$ownerAlreadyInList && $project->owner) {
            $members->prepend([
                'id' => 0, // Special ID for owner
                'user_id' => $project->owner->id,
                'role' => 'owner',
                'joined_at' => $project->created_at,
                'user' => [
                    'id' => $project->owner->id,
                    'name' => $project->owner->name,
                    'email' => $project->owner->email,
                    'username' => $project->owner->username,
                ]
            ]);
        }

        return response()->json($members->values());
    }

    /**
     * Remove project member
     */
    public function removeProjectMember(Project $project, Request $request): JsonResponse
    {
        $user = Auth::user();

        // Check if user is project owner or admin
        $userMembership = $project->members()->where('user_id', $user->id)->first();
        if (!$userMembership || !in_array($userMembership->role, ['owner', 'admin'])) {
            return response()->json(['message' => 'Insufficient permissions'], 403);
        }

        $request->validate([
            'user_id' => 'required|integer|exists:users,id'
        ]);

        $memberToRemove = $project->members()->where('user_id', $request->user_id)->first();

        if (!$memberToRemove) {
            return response()->json(['message' => __('projectcontrollerphp1184')], 404);
        }

        // Prevent removing project owner
        if ($memberToRemove->role === 'owner') {
            return response()->json(['message' => __('projectcontrollerphp1189')], 400);
        }

        // Prevent non-owners from removing admins
        if ($userMembership->role !== 'owner' && $memberToRemove->role === 'admin') {
            return response()->json(['message' => __('projectcontrollerphp1194')], 403);
        }

        // Get the user ID before deleting the membership
        $userIdToRemove = $memberToRemove->user_id;

        // Remove the project membership
        $memberToRemove->delete();

        // Also delete any application for this user/project combination
        // This allows the user to re-apply if they want to rejoin later
        DB::table('project_applications')
            ->where('project_id', $project->id)
            ->where('user_id', $userIdToRemove)
            ->delete();

        // Also remove the user from all teams associated with this project
        $projectTeams = $project->teams;
        foreach ($projectTeams as $team) {
            $team->members()->where('user_id', $userIdToRemove)->delete();
        }

        return response()->json([
            'message' => __('projectcontrollerphp1217')
        ]);
    }

    /**
     * Update project member role
     */
    public function updateProjectMemberRole(Project $project, Request $request): JsonResponse
    {
        $user = Auth::user();

        // Check if user is project owner (only owners can change roles)
        $userMembership = $project->members()->where('user_id', $user->id)->first();
        if (!$userMembership || $userMembership->role !== 'owner') {
            return response()->json(['message' => __('projectcontrollerphp1231')], 403);
        }

        $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'role' => 'required|in:member,admin'
        ]);

        $memberToUpdate = $project->members()->where('user_id', $request->user_id)->first();

        if (!$memberToUpdate) {
            return response()->json(['message' => __('projectcontrollerphp1242')], 404);
        }

        // Prevent changing owner role
        if ($memberToUpdate->role === 'owner') {
            return response()->json(['message' => __('projectcontrollerphp1247')], 400);
        }

        $memberToUpdate->update(['role' => $request->role]);

        return response()->json(['message' => __('projectcontrollerphp1252')]);
    }

    /**
     * Update project settings (language settings)
     */
    public function updateSettings(Request $request, Project $project)
    {
        $user = Auth::user();

        // Check if user has access to this project
        if (!$project->userCanAccess($user)) {
            return response()->json(['message' => __('projectcontrollerphp1264')], 403);
        }

        $validated = $request->validate([
            'enabled_languages' => 'nullable|array',
            'enabled_languages.*' => 'string|max:10',
            'default_language' => 'nullable|string|max:10',
            'protected_files' => 'nullable|array',
            'protected_files.*' => 'string',
            'install_script' => 'nullable|array',
            'install_script.*.step' => 'required|integer',
            'install_script.*.description' => 'required|string',
            'install_script.*.command' => 'nullable|string',
            'update_script' => 'nullable|array',
            'update_script.*.step' => 'required|integer',
            'update_script.*.description' => 'required|string',
            'update_script.*.command' => 'nullable|string',
        ]);

        $updateData = [
            'enabled_languages' => $validated['enabled_languages'] ?? [],
            'default_language' => $validated['default_language'] ?? $project->default_language,
        ];

        // Add deployment-related fields if provided
        if (isset($validated['protected_files'])) {
            $updateData['protected_files'] = $validated['protected_files'];
        }
        if (isset($validated['install_script'])) {
            $updateData['install_script'] = $validated['install_script'];
        }
        if (isset($validated['update_script'])) {
            $updateData['update_script'] = $validated['update_script'];
        }

        $project->update($updateData);

        // Note: No separate ProjectUpdated broadcast here — the main update()
        // endpoint already broadcasts when both are called together from the
        // settings panel, avoiding duplicate notifications for a single save.

        return response()->json([
            'message' => __('projectcontrollerphp1302'),
            'project' => $project
        ]);
    }

    /**
     * Get project settings
     */
    public function getSettings(Project $project)
    {
        $user = Auth::user();

        // Check if user has access to this project
        if (!$project->userCanAccess($user)) {
            return response()->json(['message' => __('projectcontrollerphp1316')], 403);
        }

        return response()->json([
            'enabled_languages' => $project->enabled_languages ?? [],
            'default_language' => $project->default_language,
            'protected_files' => $project->protected_files ?? [],
            'install_script' => $project->install_script ?? [],
            'update_script' => $project->update_script ?? [],
        ]);
    }

    /**
     * Get project translations for all enabled languages
     */
    public function getTranslations(Project $project)
    {
        $user = Auth::user();
        if (!$project->userCanAccess($user)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $translations = \App\Models\ProjectTranslation::where('project_id', $project->id)->get()
            ->keyBy('language_code');

        return response()->json($translations);
    }

    /**
     * Save project translation for a specific language
     */
    public function saveTranslation(Request $request, Project $project)
    {
        $user = Auth::user();
        if (!$project->userCanAccess($user)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'language_code' => 'required|string|max:10',
            'caption' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'decimal_separator' => 'nullable|string|max:1',
            'thousands_separator' => 'nullable|string|max:1',
            'date_format' => 'nullable|string|max:20',
            'time_format' => 'nullable|string|max:20',
            'currency_symbol' => 'nullable|string|max:5',
            'timezone' => 'nullable|string|max:50',
        ]);

        $translation = \App\Models\ProjectTranslation::updateOrCreate(
            ['project_id' => $project->id, 'language_code' => $validated['language_code']],
            $validated
        );

        return response()->json([
            'message' => 'Translation saved',
            'translation' => $translation,
        ]);
    }

    /**
     * Get locale defaults for a language code (for pre-filling)
     */
    public function getLocaleDefaults(Request $request)
    {
        $code = $request->query('code', 'en');
        return response()->json(\App\Models\ProjectTranslation::getLocaleDefaults($code));
    }

    /**
     * Get all projects the current user has access to (owner or team member)
     */
    public function getUserProjects(): JsonResponse
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => __('projectcontrollerphp1336')], 401);
        }

        // Get projects owned by the user
        $ownedProjects = Project::where('owner_id', $user->id)
            ->active()
            ->get();

        // Get projects where user is a team member - BUT only if team is NOT soft-locked
        $teamProjects = Project::whereHas('teams', function($teamQuery) use ($user) {
            $teamQuery->whereHas('members', function($memberQuery) use ($user) {
                $memberQuery->where('user_id', $user->id);
            })
            // Exclude teams that have a soft-locked subscription
            ->where(function ($subQuery) {
                $subQuery->whereDoesntHave('subscription')
                         ->orWhereHas('subscription', function ($subscriptionQuery) {
                             $subscriptionQuery->where('is_soft_locked', false);
                         });
            });
        })
        ->with(['owner', 'teams.members.user']) // Load all related data for debugging
        ->active()
        ->get();

        // Also try a more explicit query to make sure we're getting team projects
        // This query also excludes soft-locked teams
        $explicitTeamProjects = DB::table('projects')
            ->join('project_teams', 'projects.id', '=', 'project_teams.project_id')
            ->join('teams', 'project_teams.team_id', '=', 'teams.id')
            ->join('team_members', 'teams.id', '=', 'team_members.team_id')
            ->leftJoin('subscriptions', function($join) {
                $join->on('teams.id', '=', 'subscriptions.entity_id')
                     ->where('subscriptions.subscription_type', '=', 'team');
            })
            ->where('team_members.user_id', $user->id)
            ->where('projects.is_active', true)
            // Exclude soft-locked teams: either no subscription OR subscription is not soft-locked
            ->where(function($query) {
                $query->whereNull('subscriptions.id')
                      ->orWhere('subscriptions.is_soft_locked', false);
            })
            ->select('projects.*')
            ->distinct()
            ->get()
            ->map(function($item) {
                return (array) $item;
            });

        // Convert to Eloquent models with relationships loaded
        $explicitTeamProjectIds = $explicitTeamProjects->pluck('id')->filter()->unique();
        $explicitTeamProjectsModels = $explicitTeamProjectIds->isNotEmpty()
            ? Project::with('owner')->whereIn('id', $explicitTeamProjectIds)->get()
            : collect();

        // Merge with the relationship-based query results
        $allTeamProjects = $teamProjects->merge($explicitTeamProjectsModels)->unique('id');

        // Merge and remove duplicates (in case user is both owner and team member)
        $allProjects = $ownedProjects->merge($allTeamProjects)
            ->filter(function($project) {
                // Filter out any projects without valid ID (should never happen, but safety check)
                return $project->id !== null && is_numeric($project->id);
            })
            ->unique('id');

        // Format projects with additional info
        $projects = $allProjects->map(function ($project) use ($user) {
            $counts = $project->getCounts();

            // Check if user is owner or team member
            $isOwner = (string)$project->owner_id === (string)$user->id;
            $isTeamMember = $project->teams()->whereHas('members', function($query) use ($user) {
                $query->where('user_id', $user->id);
            })->exists();

            // Get subscription info for this project
            $subscription = $project->subscription;
            $subscriptionData = null;
            $isSoftLocked = false;

            if ($subscription) {
                // Auto-apply soft-lock if expired
                $subscription->checkAndApplySoftLock();
                $isSoftLocked = $subscription->is_soft_locked;

                $subscriptionData = [
                    'id' => $subscription->id,
                    'expires_at' => $subscription->expires_at?->toISOString(),
                    'is_expired' => $subscription->isExpired(),
                    'is_soft_locked' => $subscription->is_soft_locked,
                    'days_remaining' => $subscription->getDaysUntilExpiry(),
                ];
            }

            return array_merge($project->toArray(), [
                'teams_count' => $counts['teams_count'],
                'members_count' => $counts['members_count'],
                'applications_count' => $counts['applications_count'],
                'templates_count' => $counts['templates_count'],
                'schemas_count' => $counts['schemas_count'],
                'databases_count' => $counts['databases_count'],
                'is_owner' => $isOwner,
                'is_team_member' => $isTeamMember,
                'access_type' => $isOwner ? 'owner' : 'team_member',
                'is_soft_locked' => $isSoftLocked,
                'subscription' => $subscriptionData,
            ]);
        });

        return response()->json([
            'projects' => $projects,
            'total_projects' => $projects->count(),
        ]);
    }

    /**
     * Get or generate the file generation tree for a project
     */
    public function getGenerationTree(Project $project): JsonResponse
    {
        // Check if user has access to this project
        if (!$this->userHasProjectAccess($project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Check if we have a fresh tree in the database
        $generationTree = $project->generationTree;

        if (!$generationTree || $generationTree->is_stale) {
            // Generate and save a new tree
            $generator = new ProjectFileTreeGenerator();
            $generationTree = $generator->generateAndSave($project);
        }

        return response()->json([
            'tree_data' => $generationTree->tree_data,
            'generated_at' => $generationTree->generated_at,
            'is_stale' => $generationTree->is_stale,
        ]);
    }

    /**
     * Force regenerate the file generation tree for a project
     */
    public function regenerateTree(Project $project): JsonResponse
    {
        // Check if user has access to this project
        if (!$this->userHasProjectAccess($project)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $generator = new ProjectFileTreeGenerator();
        $generationTree = $generator->generateAndSave($project);

        return response()->json([
            'message' => __('projectcontrollerphp1496'),
            'tree_data' => $generationTree->tree_data,
            'generated_at' => $generationTree->generated_at,
        ]);
    }

    /**
     * Get templates linked to this project with their protected_files
     */
    public function getTemplatesWithProtectedFiles(Project $project): JsonResponse
    {
        $user = Auth::user();

        // Check if user has access to this project
        if (!$project->userCanAccess($user)) {
            return response()->json(['message' => __('projectcontrollerphp1511')], 403);
        }

        // Load templates from project_template_usage with protected_files
        $templates = $project->templates()
            ->select(['templates.id', 'templates.name', 'templates.protected_files'])
            ->get();

        return response()->json([
            'templates' => $templates
        ]);
    }

    /**
     * Get Git integration settings for a project
     */
    public function getGitSettings(Project $project): JsonResponse
    {
        $user = Auth::user();

        // Check if user has access to this project
        if (!$project->userCanAccess($user)) {
            return response()->json(['message' => __('projectcontrollerphp1533')], 403);
        }

        // Load the git provider relationship
        $project->load('gitProvider');

        // Get available git providers for this user
        $availableProviders = $user->gitProviders()->get()->map(fn($p) => [
            'id' => $p->id,
            'provider' => $p->provider,
            'provider_name' => $p->getProviderDisplayName(),
            'username' => $p->username,
            'avatar_url' => $p->avatar_url,
            'is_expired' => $p->isTokenExpired(),
        ]);

        return response()->json([
            'git_settings' => $project->getGitSettings(),
            'available_providers' => $availableProviders,
        ]);
    }

    /**
     * Update Git integration settings for a project
     */
    public function updateGitSettings(Request $request, Project $project): JsonResponse
    {
        $user = Auth::user();

        // Check if user has access to this project
        if (!$project->userCanAccess($user)) {
            return response()->json(['message' => __('projectcontrollerphp1564')], 403);
        }

        $validated = $request->validate([
            'git_provider_id' => 'nullable|integer|exists:user_git_providers,id',
            'git_repository' => 'nullable|string|max:255',
            'git_default_branch' => 'nullable|string|max:100',
            'git_main_branch' => 'nullable|string|max:100',
            'git_target_directory' => 'nullable|string|max:500',
            'git_workflow' => 'nullable|in:push_only,push_and_pr,push_pr_merge',
            'git_pr_title_template' => 'nullable|string|max:255',
            'git_pr_description_template' => 'nullable|string|max:2000',
            'git_auto_delete_branch' => 'nullable|boolean',
        ]);

        // If git_provider_id is set, verify it belongs to the user
        if (isset($validated['git_provider_id']) && $validated['git_provider_id']) {
            $gitProvider = $user->gitProviders()->find($validated['git_provider_id']);
            if (!$gitProvider) {
                return response()->json(['error' => __('projectcontrollerphp1583')], 400);
            }
        }

        // Update the project with git settings
        $project->update($validated);

        // Reload git provider relationship
        $project->load('gitProvider');

        return response()->json([
            'message' => __('projectcontrollerphp1594'),
            'git_settings' => $project->getGitSettings(),
        ]);
    }

    /**
     * Remove Git integration from a project
     */
    public function removeGitIntegration(Project $project): JsonResponse
    {
        $user = Auth::user();

        // Check if user has access to this project
        if (!$project->userCanAccess($user)) {
            return response()->json(['message' => __('projectcontrollerphp1608')], 403);
        }

        // Clear all git settings
        $project->update([
            'git_provider_id' => null,
            'git_repository' => null,
            'git_default_branch' => null,
            'git_main_branch' => null,
            'git_target_directory' => null,
            'git_workflow' => 'push_only',
            'git_pr_title_template' => null,
            'git_pr_description_template' => null,
            'git_auto_delete_branch' => true,
        ]);

        return response()->json([
            'message' => __('projectcontrollerphp1625'),
        ]);
    }

    /**
     * Lock a project for editing (pessimistic locking)
     */
    public function lockProject(Project $project): JsonResponse
    {
        $user = Auth::user();
        if (!$project->userCanAccess($user)) {
            return response()->json(['message' => __('projectcontrollerphp469')], 403);
        }

        if ($project->isEditLocked() && !$project->isLockedBy($user)) {
            $lockedBy = $project->lockedByUser;
            return response()->json([
                'locked' => true,
                'locked_by_user_id' => $project->locked_by_user_id,
                'locked_by_user_name' => $lockedBy ? $lockedBy->name : 'Unknown',
                'locked_at' => $project->locked_at?->toISOString(),
            ], 409);
        }

        $project->lockForEditing($user);
        ProjectLocked::dispatch($project, $user->id, $user->name);

        return response()->json([
            'locked' => true,
            'locked_by_user_id' => $user->id,
            'locked_by_user_name' => $user->name,
        ]);
    }

    /**
     * Unlock a project (release edit lock)
     */
    public function unlockProject(Project $project): JsonResponse
    {
        $user = Auth::user();
        if (!$project->isLockedBy($user) && !$project->userCanManage($user)) {
            return response()->json(['message' => 'Not locked by you'], 403);
        }

        $project->forceUnlock();
        ProjectUnlocked::dispatch($project);

        return response()->json(['unlocked' => true]);
    }

    /**
     * Heartbeat to keep the edit lock alive
     */
    public function heartbeatLock(Project $project): JsonResponse
    {
        $user = Auth::user();
        if ($project->isLockedBy($user)) {
            $project->update(['locked_at' => now()]);
            return response()->json(['renewed' => true]);
        }
        return response()->json(['renewed' => false], 409);
    }
}
