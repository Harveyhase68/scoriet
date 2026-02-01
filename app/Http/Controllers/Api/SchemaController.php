<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FloatingSchema;
use App\Models\PerformanceMetric;
use App\Models\SchemaVersion;
use App\Models\SchemaDesignerLayout;
use App\Models\SchemaTable;
use App\Models\SchemaField;
use App\Models\SchemaConstraint;
use App\Models\SchemaConstraintColumn;
use App\Models\SchemaForeignKeyReference;
use App\Models\SchemaForeignKeyReferenceColumn;
use App\Models\Project;
use App\Models\ProjectSchema;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class SchemaController extends Controller
{
    /**
     * Display a listing of schemas visible to the user
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        $projectId = $request->get('project_id');

        // Get schemas visible to the user:
        // 1. Schemas owned by the user
        // 2. Public schemas
        // 3. Private schemas linked to projects the user has access to (via ownership, direct membership, or team membership)
        $query = FloatingSchema::with(['owner', 'projects'])
            ->where(function ($query) use ($user) {
                $query->where('owner_id', $user->id)
                      ->orWhere('visibility', 'public')
                      // Also include private schemas linked to projects the user has access to
                      ->orWhereHas('projects', function($projectQuery) use ($user) {
                          $projectQuery->where(function($pq) use ($user) {
                              // User is project owner
                              $pq->where('owner_id', $user->id)
                                 // User is direct project member
                                 ->orWhereHas('members', function($memberQuery) use ($user) {
                                     $memberQuery->where('user_id', $user->id);
                                 })
                                 // User is team member of a team that has access to the project
                                 ->orWhereHas('teams.members', function($teamQuery) use ($user) {
                                     $teamQuery->where('user_id', $user->id);
                                 });
                          });
                      });
            });

        // Filter by project if specified
        if ($projectId) {
            $query->whereHas('projects', function ($projectQuery) use ($projectId) {
                $projectQuery->where('project_id', $projectId);
            });
        }

        $schemas = $query->latest()->get()
            ->map(function ($schema) use ($user) {
                // Get user's accessible projects (own projects + direct members + team members)
                $userAccessibleProjectIds = Project::where(function($query) use ($user) {
                    $query->where('owner_id', $user->id)
                        ->orWhereHas('members', function($memberQuery) use ($user) {
                            $memberQuery->where('user_id', $user->id);
                        })
                        ->orWhereHas('teams.members', function($teamQuery) use ($user) {
                            $teamQuery->where('user_id', $user->id);
                        });
                })->pluck('id')->toArray();

                // Filter projects to only show those the user has access to
                $projects = $schema->projects
                    ->filter(function($project) use ($userAccessibleProjectIds) {
                        return in_array($project->id, $userAccessibleProjectIds);
                    })
                    ->map(function ($project) {
                        return [
                            'id' => $project->id,
                            'name' => $project->name,
                            'association_type' => $project->pivot->association_type,
                            'alias' => $project->pivot->alias,
                        ];
                    })
                    ->values(); // Reset array keys

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

                return array_merge($schema->toArray(), [
                    'is_owner' => (int)$schema->owner_id === (int)$user->id,
                    'tables_count' => 0, // TODO: Implement proper tables count
                    'projects_count' => $projects->count(), // Count only accessible projects
                    'projects' => $projects,
                    'is_soft_locked' => $isSoftLocked,
                    'subscription' => $subscriptionData,
                ]);
            });

        // Calculate subscription info for free users
        $subscriptionInfo = null;
        if ($user->user_type === 'free' || !$user->user_type) {
            // Count active schema subscription SLOTS (not expired)
            // NOTE: Subscriptions are slot-based (entity_id = null), not tied to specific schemas
            $activeSlots = \App\Models\Subscription::where('user_id', $user->id)
                ->where('subscription_type', \App\Models\Subscription::TYPE_SCHEMA)
                ->where('is_active', true)
                ->where('expires_at', '>', now())
                ->get();

            $activeSubscriptionsCount = $activeSlots->count();

            // Get the earliest expiring slot for warning purposes
            $earliestExpiry = $activeSlots->min('expires_at');
            $daysUntilExpiry = $earliestExpiry ? now()->diffInDays($earliestExpiry, false) : null;

            $ownedSchemasCount = FloatingSchema::where('owner_id', $user->id)->count();
            $maxAllowed = 1 + $activeSubscriptionsCount;
            $availableSlots = $maxAllowed - $ownedSchemasCount;

            $subscriptionInfo = [
                'active_slots' => $activeSubscriptionsCount,
                'owned_schemas' => $ownedSchemasCount,
                'max_allowed' => $maxAllowed,
                'available_slots' => max(0, $availableSlots),
                'needs_unlock' => $ownedSchemasCount >= $maxAllowed,
                'earliest_expiry' => $earliestExpiry?->toISOString(),
                'days_until_expiry' => $daysUntilExpiry,
                // Legacy field for backwards compatibility
                'active_subscriptions' => $activeSubscriptionsCount,
            ];
        }

        return response()->json([
            'schemas' => $schemas,
            'total_schemas' => $schemas->count(),
            'subscription_info' => $subscriptionInfo,
        ]);
    }

    /**
     * Store a newly created schema
     */
    public function store(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('schemas')->where(function ($query) use ($user) {
                    return $query->where('owner_id', $user->id);
                })
            ],
            'description' => 'nullable|string|max:1000',
            'visibility' => 'required|in:public,private',
            'is_system_schema' => 'sometimes|boolean',
            'project_ids' => 'nullable|array',
            'project_ids.*' => 'integer|exists:projects,id',
        ]);

        // Extract project_ids before creating schema (it's not a schema field)
        $projectIds = $validated['project_ids'] ?? [];
        unset($validated['project_ids']);

        // Add owner_id to the validated data
        $validated['owner_id'] = $user->id;

        // Only system/admin users can create system schemas
        if (isset($validated['is_system_schema']) && $validated['is_system_schema']) {
            if ($user->user_type !== 'system' && $user->user_type !== 'admin') {
                $validated['is_system_schema'] = false;
            }
        } else {
            $validated['is_system_schema'] = false;
        }

        // Check schema limit for free users
        $needsSchemaSubscription = false;
        if ($user->user_type === 'free') {
            // Count active subscriptions (not expired)
            $activeSubscriptionsCount = \App\Models\Subscription::where('user_id', $user->id)
                ->where('subscription_type', \App\Models\Subscription::TYPE_SCHEMA)
                ->where('is_active', true)
                ->where('expires_at', '>', now())
                ->count();

            // Free users can have: 1 (free) + number of active subscriptions
            $maxAllowedSchemas = 1 + $activeSubscriptionsCount;
            $activeSchemaCount = FloatingSchema::where('owner_id', $user->id)->count();

            if ($activeSchemaCount >= $maxAllowedSchemas) {
                // User needs to buy a new subscription slot
                if (!$user->hasCredits(50)) {
                    return response()->json([
                        'message' => 'Nicht genug Credits. Sie benötigen 50 Credits um eine zusätzliche Datenbank freizuschalten.',
                        'error_code' => 'INSUFFICIENT_CREDITS',
                        'required_credits' => 50,
                        'current_credits' => $user->credits,
                        'active_schemas' => $activeSchemaCount,
                        'max_allowed' => $maxAllowedSchemas,
                        'active_subscriptions' => $activeSubscriptionsCount
                    ], 403);
                }

                // User has enough credits - will deduct after schema creation
                $needsSchemaSubscription = true;
            }
        }

        $schema = FloatingSchema::create($validated);

        // If user needed a schema subscription (Free user creating 2nd+ schema)
        if ($needsSchemaSubscription) {
            // Deduct 50 credits
            $user->deductCredits(50);

            // Create schema subscription SLOT (valid for 1 year)
            // NOTE: entity_id is NULL - this is a "slot" subscription, not bound to a specific schema
            // This allows users to delete and recreate schemas without losing their subscription benefit
            \App\Models\Subscription::create([
                'user_id' => $user->id,
                'subscription_type' => \App\Models\Subscription::TYPE_SCHEMA,
                'entity_id' => null, // SLOT-BASED: Not tied to specific schema
                'expires_at' => now()->addYear(),
                'is_active' => true,
            ]);

            // Log the transaction
            \App\Models\CreditTransaction::create([
                'user_id' => $user->id,
                'amount' => -50,
                'type' => 'db_renewal',
                'description' => 'Schema slot (1 year) - created schema: ' . $schema->name,
                'reference_type' => 'App\Models\Subscription',
                'reference_id' => null, // Slot-based, no specific entity
                'price_paid' => null,
            ]);
        }

        // Link schema to projects if project_ids were provided
        $linkedProjectIds = [];
        if (!empty($projectIds)) {
            foreach ($projectIds as $projectId) {
                // Verify user owns this project
                $project = \App\Models\Project::find($projectId);
                if ($project && $project->owner_id == $user->id) {
                    $schema->projects()->attach($projectId, [
                        'association_type' => 'linked',
                        'alias' => null,
                    ]);
                    $linkedProjectIds[] = $projectId;
                }
            }
        }

        // Load the schema with owner relationship
        $schema->load('owner');

        return response()->json(array_merge($schema->toArray(), [
            'is_owner' => true,
            'tables_count' => 0,
            'projects_count' => count($linkedProjectIds),
            'linked_project_ids' => $linkedProjectIds,
        ]), 201);
    }

    /**
     * Display the specified schema
     */
    public function show(FloatingSchema $schema): JsonResponse
    {
        $user = Auth::user();
        
        // Check if user can access this schema
        if (!$schema->canBeAccessedBy($user)) {
            return response()->json(['message' => 'Schema not found'], 404);
        }

        $schema->load(['owner', 'projects']);

        return response()->json(array_merge($schema->toArray(), [
            'is_owner' => $schema->owner_id === (string)$user->id,
            'tables_count' => 0, // TODO: Implement proper tables count
            'projects_count' => $schema->projects()->count(),
        ]));
    }

    /**
     * Update the specified schema
     */
    public function update(Request $request, FloatingSchema $schema): JsonResponse
    {
        $user = Auth::user();
        
        // Check if user can edit this schema
        if (!$schema->canBeEditedBy($user)) {
            return response()->json(['message' => 'Unauthorized to edit this schema'], 403);
        }

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('schemas')->where(function ($query) use ($user) {
                    return $query->where('owner_id', $user->id);
                })->ignore($schema->id)
            ],
            'description' => 'nullable|string|max:1000',
            'visibility' => 'required|in:public,private',
            'is_system_schema' => 'sometimes|boolean',
        ]);

        // Only system/admin users can change system schema status
        if (isset($validated['is_system_schema'])) {
            if ($user->user_type !== 'system' && $user->user_type !== 'admin') {
                $validated['is_system_schema'] = $schema->is_system_schema; // Keep original value
            }
        }

        $schema->update($validated);
        $schema->load('owner');

        return response()->json(array_merge($schema->toArray(), [
            'is_owner' => $schema->owner_id === (string)$user->id,
            'tables_count' => 0, // TODO: Implement proper tables count
            'projects_count' => $schema->projects()->count(),
        ]));
    }

    /**
     * Remove the specified schema with cascade deletion
     */
    public function destroy(Request $request, FloatingSchema $schema): JsonResponse
    {
        $user = Auth::user();

        // Check if user can delete this schema
        if (!$schema->canBeEditedBy($user)) {
            return response()->json(['message' => 'Unauthorized to delete this schema'], 403);
        }

        // Get counts for confirmation message
        $projectsCount = $schema->projects()->count();
        $versionsCount = $schema->versions()->count();
        $totalTablesCount = SchemaTable::whereIn('schema_version_id',
            $schema->versions()->pluck('id')
        )->count();

        // Force delete flag for cascading all related data
        $forceDelete = $request->input('force_delete', false);

        if (!$forceDelete && $projectsCount > 0) {
            // Return 200 with requires_force flag to avoid browser console error
            // The frontend will handle this and make a second request with force_delete=true
            return response()->json([
                'success' => false,
                'message' => "Schema is being used by {$projectsCount} project(s). Use force delete to proceed.",
                'projects_count' => $projectsCount,
                'versions_count' => $versionsCount,
                'tables_count' => $totalTablesCount,
                'requires_force' => true
            ], 200);
        }

        try {
            // Remove project associations first
            ProjectSchema::where('schema_id', $schema->id)->delete();

            // Try to detach using Eloquent as well
            try {
                $schema->projects()->detach();
            } catch (\Exception $e) {
                // Ignore - already removed via direct delete
            }

            // Delete the schema and all related data
            DB::transaction(function () use ($schema) {
                // Get all related IDs first
                $versionIds = $schema->versions()->pluck('id')->toArray();
                $tableIds = SchemaTable::whereIn('schema_version_id', $versionIds)->pluck('id')->toArray();
                $constraintIds = SchemaConstraint::whereIn('table_id', $tableIds)->pluck('id')->toArray();
                $referenceIds = SchemaForeignKeyReference::whereIn('constraint_id', $constraintIds)->pluck('id')->toArray();

                // Delete in proper dependency order
                if (!empty($referenceIds)) {
                    SchemaForeignKeyReferenceColumn::whereIn('reference_id', $referenceIds)->delete();
                }

                if (!empty($constraintIds)) {
                    SchemaForeignKeyReference::whereIn('constraint_id', $constraintIds)->delete();
                    SchemaConstraintColumn::whereIn('constraint_id', $constraintIds)->delete();
                }

                if (!empty($tableIds)) {
                    SchemaConstraint::whereIn('table_id', $tableIds)->delete();
                    SchemaField::whereIn('table_id', $tableIds)->delete();
                }

                // Delete schema designer layouts
                SchemaDesignerLayout::where('schema_id', $schema->id)->delete();

                if (!empty($versionIds)) {
                    SchemaTable::whereIn('schema_version_id', $versionIds)->delete();
                    SchemaVersion::whereIn('id', $versionIds)->delete();
                }

                // Double-check project associations are gone
                ProjectSchema::where('schema_id', $schema->id)->delete();

                // Finally delete the schema itself
                $schema->delete();
            });

            return response()->json([
                'message' => 'Schema and all related data deleted successfully',
                'deleted_projects_count' => $projectsCount,
                'deleted_versions_count' => $versionsCount,
                'deleted_tables_count' => $totalTablesCount
            ]);

        } catch (\Exception $e) {
            Log::error("❌ Schema deletion failed", [
                'schema_id' => $schema->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to delete schema',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get schemas available for a specific project
     */
    public function getAvailableForProject(Project $project): JsonResponse
    {
        $user = Auth::user();
        
        // Check if user has access to the project
        if (!$project->visibleTo($user)->exists()) {
            return response()->json(['message' => 'Project not found'], 404);
        }

        // Get schemas that are not already associated with this project
        $associatedSchemaIds = $project->floatingSchemas()->pluck('schema_id');
        
        $availableSchemas = FloatingSchema::with(['owner'])
            ->where(function ($query) use ($user) {
                $query->where('owner_id', $user->id)
                      ->orWhere('visibility', 'public');
            })
            ->whereNotIn('id', $associatedSchemaIds)
            ->latest()
            ->get();

        return response()->json($availableSchemas);
    }

    /**
     * Get versions for a specific floating schema
     */
    public function getSchemaVersions(FloatingSchema $schema): JsonResponse
    {
        $user = Auth::user();

        // Check if user can access this schema
        if (!$schema->canBeAccessedBy($user)) {
            return response()->json(['message' => 'Schema not found'], 404);
        }

        $versions = $schema->versions()
            ->withCount('tables')
            ->orderByDesc('version_number')
            ->get();

        return response()->json($versions);
    }

    /**
     * Get tables for a specific schema version
     */
    public function getVersionTables(SchemaVersion $version): JsonResponse
    {
        $startTime = microtime(true);
        $user = Auth::user();

        // If this schema version has a schema, check access
        if ($version->hasSchema()) {
            $schema = $version->schema;
            if (!$schema->canBeAccessedBy($user)) {
                return response()->json(['message' => 'Schema version not found'], 404);
            }
        }

        // Get tables with fields and constraints including foreign key references
        // Order by id to preserve original import sequence
        $tables = $version->tables()->with([
            'fields',
            'constraints.constraintColumns.field',
            'constraints.foreignKeyReference.referencedTable',
            'constraints.foreignKeyReference.referenceColumns'
        ])->orderBy('id')->get();

        // Transform constraints to include columns data for frontend compatibility
        $tables->each(function ($table) {
            $table->constraints->each(function ($constraint) {
                // Add columns attribute by manually mapping constraintColumns
                $constraint->columns = $constraint->constraintColumns->map(function ($constraintColumn) {
                    return [
                        'field_name' => $constraintColumn->field?->field_name,
                        'field_id' => $constraintColumn->field_id,
                    ];
                });
            });
        });

        // Track performance
        $duration = (int) ((microtime(true) - $startTime) * 1000);
        $tablesCount = $tables->count();
        $fieldsCount = $tables->sum(fn($t) => $t->fields->count());

        try {
            PerformanceMetric::create([
                'user_id' => $user?->id,
                'operation' => PerformanceMetric::OP_SCHEMA_LOAD,
                'operation_detail' => $version->schema?->name ?? 'Version #' . $version->id,
                'duration_ms' => $duration,
                'memory_peak_mb' => (int) (memory_get_peak_usage(true) / 1024 / 1024),
                'tables_count' => $tablesCount,
                'fields_count' => $fieldsCount,
                'from_cache' => false,
                'subscription_type' => $user?->subscription?->type ?? 'free',
                'created_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::error("Performance tracking failed: " . $e->getMessage());
        }

        return response()->json($tables);
    }

    /**
     * Save layout data for a schema version
     */
    public function saveLayout(Request $request, FloatingSchema $schema, int $versionNumber): JsonResponse
    {
        $user = Auth::user();
        
        // Check if user can edit this schema
        if (!$schema->canBeEditedBy($user)) {
            return response()->json(['message' => 'Unauthorized to edit this schema'], 403);
        }

        $request->validate([
            'layouts' => 'required|array',
            'layouts.*.table_name' => 'required|string',
            'layouts.*.x_position' => 'required|numeric',
            'layouts.*.y_position' => 'required|numeric',
            'layouts.*.width' => 'nullable|numeric',
            'layouts.*.height' => 'nullable|numeric',
        ]);

        try {
            SchemaDesignerLayout::saveLayoutForVersion(
                $schema->id,
                $versionNumber,
                $request->input('layouts')
            );

            return response()->json(['message' => 'Layout saved successfully']);
        } catch (\Exception $e) {
            \Log::error('Layout save error: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json([
                'message' => 'Failed to save layout',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get layout data for a schema version
     */
    public function getLayout(FloatingSchema $schema, int $versionNumber): JsonResponse
    {
        $user = Auth::user();
        
        // Check if user can access this schema
        if (!$schema->canBeAccessedBy($user)) {
            return response()->json(['message' => 'Schema not found'], 404);
        }

        $layouts = SchemaDesignerLayout::getLayoutForVersion($schema->id, $versionNumber);

        return response()->json($layouts);
    }

    /**
     * Create a new table in a schema version
     */
    public function createTable(Request $request, SchemaVersion $version): JsonResponse
    {
        $user = Auth::user();

        // Check if this schema version has a schema and user can edit it
        if ($version->hasSchema()) {
            $schema = $version->schema;
            if (!$schema->canBeEditedBy($user)) {
                return response()->json(['message' => 'Unauthorized to edit this schema'], 403);
            }
        }

        $request->validate([
            'table_name' => 'required|string|max:255',
            'filekeyname' => 'nullable|string|max:100',
            'file_name_renamed' => 'nullable|string|max:100',
            'file_name_short' => 'nullable|string|max:50',
            'columns' => 'array',
            'columns.*.column_name' => 'required|string|max:255',
            'columns.*.data_type' => 'required|string|max:255',
            'columns.*.field_length' => 'nullable|integer',
            'columns.*.is_unsigned' => 'boolean',
            'columns.*.is_nullable' => 'boolean',
            'columns.*.is_auto_increment' => 'boolean',
            'columns.*.is_primary_key' => 'boolean',
            'columns.*.is_index' => 'boolean',
            'columns.*.is_unique' => 'boolean',
            'columns.*.comment' => 'nullable|string',
            'columns.*.control_type' => 'nullable|string|max:30',
            'columns.*.link_table' => 'nullable|string|max:64',
            'columns.*.link_field' => 'nullable|string|max:64',
            'columns.*.link_display_field' => 'nullable|string|max:64',
            'columns.*.link_order_field' => 'nullable|string|max:64',
            'columns.*.link_order_direction' => 'nullable|in:ASC,DESC',
        ]);

        try {
            // Create the table
            $table = \App\Models\SchemaTable::create([
                'schema_version_id' => $version->id,
                'schema_id' => $version->schema_id, // Add the missing schema_id
                'table_name' => $request->table_name,
                'filekeyname' => $request->filekeyname,
                'file_name_renamed' => $request->file_name_renamed,
                'file_name_short' => $request->file_name_short,
            ]);

            // Create columns if provided
            if ($request->has('columns')) {
                $primaryKeyFields = [];
                $indexFields = [];
                $uniqueFields = [];

                foreach ($request->columns as $index => $columnData) {

                    $fieldType = strtolower($columnData['data_type']);
                    $fieldLength = $columnData['field_length'];

                    if ($fieldLength > 0 && in_array($fieldType, ['varchar', 'char', 'binary', 'varbinary', 'datetime'])) {
                       $combinedType = $fieldType . '(' . $fieldLength . ')';
                    } else {
                        $combinedType = $fieldType;
                    }

                    $field = \App\Models\SchemaField::create([
                        'table_id' => $table->id,
                        'field_name' => $columnData['column_name'],
                        'field_type' => $combinedType,
                        'field_length' => $columnData['field_length'] ?? null,
                        'is_unsigned' => $columnData['is_unsigned'] ?? false,
                        'is_nullable' => $columnData['is_nullable'] ?? true,
                        'is_auto_increment' => $columnData['is_auto_increment'] ?? false,
                        'is_primary_key' => $columnData['is_primary_key'] ?? false,
                        'is_index' => $columnData['is_index'] ?? false,
                        'is_unique' => $columnData['is_unique'] ?? false,
                        'extra' => $columnData['is_auto_increment'] ? 'auto_increment' : null,
                        'field_order' => $index + 1, // Logische Reihenfolge: 1, 2, 3, 4... (starts at 1)
                        'comment' => $columnData['comment'] ?? null,
                        // Control Type & Link fields for ComboBox, ListBox, etc.
                        'control_type' => $columnData['control_type'] ?? 'TEXT',
                        'link_table' => $columnData['link_table'] ?? null,
                        'link_field' => $columnData['link_field'] ?? null,
                        'link_display_field' => $columnData['link_display_field'] ?? null,
                        'link_order_field' => $columnData['link_order_field'] ?? null,
                        'link_order_direction' => $columnData['link_order_direction'] ?? 'ASC',
                    ]);

                    // Track constraint fields
                    if (!empty($columnData['is_primary_key'])) {
                        $primaryKeyFields[] = $field;
                    }
                    if (!empty($columnData['is_index'])) {
                        $indexFields[] = $field;
                    }
                    if (!empty($columnData['is_unique'])) {
                        $uniqueFields[] = $field;
                    }
                }

                // Create PRIMARY KEY constraint if we have primary key fields
                if (!empty($primaryKeyFields)) {
                    $fieldNames = collect($primaryKeyFields)->pluck('field_name')->toArray();
                    $constraintName = 'PK_' . $table->table_name . '_' . implode('_', $fieldNames);
                    $primaryKeyConstraint = \App\Models\SchemaConstraint::create([
                        'table_id' => $table->id,
                        'constraint_name' => $constraintName,
                        'constraint_type' => 'PRIMARY KEY',
                    ]);
                    foreach ($primaryKeyFields as $index => $field) {
                        \App\Models\SchemaConstraintColumn::create([
                            'constraint_id' => $primaryKeyConstraint->id,
                            'field_id' => $field->id,
                            'column_order' => $index,
                        ]);
                    }
                }

                // Create INDEX constraints for individual fields
                foreach ($indexFields as $field) {
                    $constraintName = 'IDX_' . $table->table_name . '_' . $field->field_name;
                    $indexConstraint = \App\Models\SchemaConstraint::create([
                        'table_id' => $table->id,
                        'constraint_name' => $constraintName,
                        'constraint_type' => 'INDEX',
                    ]);
                    \App\Models\SchemaConstraintColumn::create([
                        'constraint_id' => $indexConstraint->id,
                        'field_id' => $field->id,
                        'column_order' => 0,
                    ]);
                }

                // Create UNIQUE constraints for individual fields
                foreach ($uniqueFields as $field) {
                    $constraintName = 'UQ_' . $table->table_name . '_' . $field->field_name;
                    $uniqueConstraint = \App\Models\SchemaConstraint::create([
                        'table_id' => $table->id,
                        'constraint_name' => $constraintName,
                        'constraint_type' => 'UNIQUE',
                    ]);
                    \App\Models\SchemaConstraintColumn::create([
                        'constraint_id' => $uniqueConstraint->id,
                        'field_id' => $field->id,
                        'column_order' => 0,
                    ]);
                }
            }

            foreach ($request->columns as $index => $columnData) {
            }

            $table->load('fields');

            return response()->json([
                'message' => 'Table created successfully',
                'table' => $table
            ], 201);

        } catch (\Exception $e) {
            \Log::error('CreateTable Exception:', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to create table',
                'error' => $e->getMessage(),
                'debug' => [
                    'file' => $e->getFile(),
                    'line' => $e->getLine()
                ]
            ], 500);
        }
    }

    /**
     * Update an existing table in a schema version
     */
    public function updateTable(Request $request, SchemaVersion $version, \App\Models\SchemaTable $table): JsonResponse
    {
        $user = Auth::user();

        // Check if this schema version has a schema and user can edit it
        if ($version->hasSchema()) {
            $schema = $version->schema;
            if (!$schema->canBeEditedBy($user)) {
                return response()->json(['message' => 'Unauthorized to edit this schema'], 403);
            }
        }

        // Validate that the table belongs to this version
        if ($table->schema_version_id !== $version->id) {
            return response()->json(['message' => 'Table does not belong to this schema version'], 404);
        }

        $request->validate([
            'table_name' => 'required|string|max:255',
            'filekeyname' => 'nullable|string|max:100',
            'file_name_renamed' => 'nullable|string|max:100',
            'file_name_short' => 'nullable|string|max:50',
            'columns' => 'array',
            'columns.*.column_name' => 'required|string|max:255',
            'columns.*.data_type' => 'required|string|max:255',
            'columns.*.field_length' => 'nullable|integer',
            'columns.*.is_unsigned' => 'boolean',
            'columns.*.is_nullable' => 'boolean',
            'columns.*.is_auto_increment' => 'boolean',
            'columns.*.is_primary_key' => 'boolean',
            'columns.*.is_index' => 'boolean',
            'columns.*.is_unique' => 'boolean',
            'columns.*.comment' => 'nullable|string',
            'columns.*.control_type' => 'nullable|string|max:30',
            'columns.*.link_table' => 'nullable|string|max:64',
            'columns.*.link_field' => 'nullable|string|max:64',
            'columns.*.link_display_field' => 'nullable|string|max:64',
            'columns.*.link_order_field' => 'nullable|string|max:64',
            'columns.*.link_order_direction' => 'nullable|in:ASC,DESC',
        ]);

        try {
            // Update the table
            $table->update([
                'table_name' => $request->table_name,
                'filekeyname' => $request->filekeyname,
                'file_name_renamed' => $request->file_name_renamed,
                'file_name_short' => $request->file_name_short,
            ]);

            // 🔐 SAVE FOREIGN KEYS before deleting (to restore them after update)
            $existingForeignKeys = \App\Models\SchemaConstraint::where('table_id', $table->id)
                ->where('constraint_type', 'FOREIGN KEY')
                ->with([
                    'constraintColumns.field',
                    'foreignKeyReference.referencedTable',
                    'foreignKeyReference.referenceColumns.referencedField'
                ])
                ->get()
                ->map(function($fk) {
                    $fkRef = $fk->foreignKeyReference;
                    if (!$fkRef || !$fkRef->referencedTable) {
                        return null; // Skip invalid FKs
                    }

                    return [
                        'constraint_name' => $fk->constraint_name,
                        'constraint_type' => $fk->constraint_type,
                        'source_fields' => $fk->constraintColumns->map(fn($col) => $col->field->field_name)->toArray(),
                        'referenced_table_name' => $fkRef->referencedTable->table_name,
                        'referenced_table_id' => $fkRef->referenced_table_id,
                        'referenced_fields' => $fkRef->referenceColumns->map(fn($refCol) => $refCol->referencedField->field_name)->toArray(),
                        'on_delete' => $fkRef->on_delete ?? 'NO ACTION',
                        'on_update' => $fkRef->on_update ?? 'NO ACTION',
                    ];
                })
                ->filter() // Remove null entries
                ->values()
                ->toArray();

            // ✅ AKADEMISCH KORREKTE LÖSUNG: UPDATE/INSERT/DELETE statt DELETE/INSERT
            // Lade bestehende Felder
            $existingFields = \App\Models\SchemaField::where('table_id', $table->id)
                ->get()
                ->keyBy('field_name');

            $updatedFields = [];
            $primaryKeyFields = [];
            $indexFields = [];
            $uniqueFields = [];
            
            // Process incoming columns
            if ($request->has('columns')) {
                $incomingFieldNames = [];

                foreach ($request->columns as $index => $columnData) {
                    $fieldName = $columnData['column_name'];
                    $incomingFieldNames[] = $fieldName;
                    
                    $fieldType = strtolower($columnData['data_type']);
                    $fieldLength = $columnData['field_length'];

                    if ($fieldLength > 0 && in_array($fieldType, ['varchar', 'char', 'binary', 'varbinary', 'datetime'])) {
                       $combinedType = $fieldType . '(' . $fieldLength . ')';
                    } else {
                        $combinedType = $fieldType;
                    }

                    $fieldData = [
                        'table_id' => $table->id,
                        'field_name' => $fieldName,
                        'field_type' => $combinedType,
                        'field_length' => $columnData['field_length'] ?? null,
                        'is_unsigned' => $columnData['is_unsigned'] ?? false,
                        'is_nullable' => $columnData['is_nullable'] ?? true,
                        'is_auto_increment' => $columnData['is_auto_increment'] ?? false,
                        'is_primary_key' => $columnData['is_primary_key'] ?? false,
                        'is_index' => $columnData['is_index'] ?? false,
                        'is_unique' => $columnData['is_unique'] ?? false,
                        'extra' => $columnData['is_auto_increment'] ? 'auto_increment' : null,
                        'field_order' => $index + 1, // Logical order: 1, 2, 3, 4... (starts at 1)
                        'comment' => $columnData['comment'] ?? null,
                        // Control Type & Link fields for ComboBox, ListBox, etc.
                        'control_type' => $columnData['control_type'] ?? 'TEXT',
                        'link_table' => $columnData['link_table'] ?? null,
                        'link_field' => $columnData['link_field'] ?? null,
                        'link_display_field' => $columnData['link_display_field'] ?? null,
                        'link_order_field' => $columnData['link_order_field'] ?? null,
                        'link_order_direction' => $columnData['link_order_direction'] ?? 'ASC',
                    ];

                    // UPDATE existing field or INSERT new field
                    if ($existingFields->has($fieldName)) {
                        // UPDATE: Field already exists - preserve ID!
                        $field = $existingFields->get($fieldName);
                        $field->update($fieldData);
                    } else {
                        // INSERT: New field
                        $field = \App\Models\SchemaField::create($fieldData);
                    }

                    $updatedFields[$fieldName] = $field;

                    // Track constraint fields
                    if (!empty($columnData['is_primary_key'])) {
                        $primaryKeyFields[] = $field;
                    }
                    if (!empty($columnData['is_index'])) {
                        $indexFields[] = $field;
                    }
                    if (!empty($columnData['is_unique'])) {
                        $uniqueFields[] = $field;
                    }
                }

                // DELETE fields that are no longer in the request
                $fieldsToDelete = $existingFields->keys()->diff($incomingFieldNames);
                foreach ($fieldsToDelete as $fieldName) {
                    $existingFields->get($fieldName)->delete();
                }
            }

            // ============================================================
            // SMART CONSTRAINT UPDATE: Only change what was actually changed
            // Preserve existing constraint names and IDs!
            // ============================================================

            // Load existing constraints (non-FK) with their columns
            $existingConstraints = \App\Models\SchemaConstraint::where('table_id', $table->id)
                ->where('constraint_type', '!=', 'FOREIGN KEY')
                ->with('constraintColumns')
                ->get();

            // Build maps of existing constraints by type and field
            $existingPK = $existingConstraints->firstWhere('constraint_type', 'PRIMARY KEY');
            $existingIndexes = $existingConstraints->filter(fn($c) => in_array($c->constraint_type, ['INDEX', 'KEY']));
            $existingUniques = $existingConstraints->where('constraint_type', 'UNIQUE');

            // Get current field IDs from existing constraints
            $existingIndexFieldIds = $existingIndexes->mapWithKeys(function($idx) {
                $fieldIds = $idx->constraintColumns->pluck('field_id')->sort()->values()->toArray();
                return [implode(',', $fieldIds) => $idx];
            });

            $existingUniqueFieldIds = $existingUniques->mapWithKeys(function($uq) {
                $fieldIds = $uq->constraintColumns->pluck('field_id')->sort()->values()->toArray();
                return [implode(',', $fieldIds) => $uq];
            });

            // --- PRIMARY KEY: Update only if changed ---
            $newPKFieldIds = collect($primaryKeyFields)->pluck('id')->sort()->values()->toArray();
            $existingPKFieldIds = $existingPK
                ? $existingPK->constraintColumns->pluck('field_id')->sort()->values()->toArray()
                : [];

            if ($newPKFieldIds !== $existingPKFieldIds) {
                // PK changed - need to update
                if ($existingPK) {
                    if (empty($newPKFieldIds)) {
                        // PK removed
                        $existingPK->delete();
                    } else {
                        // PK columns changed - update constraint columns (keep constraint name!)
                        \App\Models\SchemaConstraintColumn::where('constraint_id', $existingPK->id)->delete();
                        foreach ($primaryKeyFields as $index => $field) {
                            \App\Models\SchemaConstraintColumn::create([
                                'constraint_id' => $existingPK->id,
                                'field_id' => $field->id,
                                'column_order' => $index,
                            ]);
                        }
                    }
                } elseif (!empty($newPKFieldIds)) {
                    // New PK - create with generated name
                    $fieldNames = collect($primaryKeyFields)->pluck('field_name')->toArray();
                    $constraintName = 'PK_' . $table->table_name . '_' . implode('_', $fieldNames);

                    $newPK = \App\Models\SchemaConstraint::create([
                        'table_id' => $table->id,
                        'constraint_name' => $constraintName,
                        'constraint_type' => 'PRIMARY KEY',
                    ]);
                    foreach ($primaryKeyFields as $index => $field) {
                        \App\Models\SchemaConstraintColumn::create([
                            'constraint_id' => $newPK->id,
                            'field_id' => $field->id,
                            'column_order' => $index,
                        ]);
                    }
                }
            }

            // --- INDEX: Only add/remove what changed ---
            $newIndexFieldIds = collect($indexFields)->mapWithKeys(function($field) {
                return [(string)$field->id => $field];
            });

            // Find indexes to remove (exist but not in new list)
            foreach ($existingIndexes as $existingIdx) {
                $fieldIdKey = $existingIdx->constraintColumns->pluck('field_id')->sort()->values()->implode(',');
                $fieldIds = $existingIdx->constraintColumns->pluck('field_id')->toArray();

                // Check if this index's fields are still marked as index
                $stillNeeded = false;
                foreach ($fieldIds as $fid) {
                    if ($newIndexFieldIds->has((string)$fid)) {
                        $stillNeeded = true;
                        break;
                    }
                }

                if (!$stillNeeded) {
                    $existingIdx->delete();
                } else {
                    // Mark as processed
                    foreach ($fieldIds as $fid) {
                        $newIndexFieldIds->forget((string)$fid);
                    }
                }
            }

            // Add new indexes (fields that are marked as index but don't have constraint yet)
            foreach ($newIndexFieldIds as $fieldId => $field) {
                $constraintName = $table->table_name . '_' . $field->field_name . '_ckey';

                $newIdx = \App\Models\SchemaConstraint::create([
                    'table_id' => $table->id,
                    'constraint_name' => $constraintName,
                    'constraint_type' => 'KEY', // Use KEY for consistency with PHP parser
                ]);
                \App\Models\SchemaConstraintColumn::create([
                    'constraint_id' => $newIdx->id,
                    'field_id' => $field->id,
                    'column_order' => 0,
                ]);
            }

            // --- UNIQUE: Only add/remove what changed ---
            $newUniqueFieldIds = collect($uniqueFields)->mapWithKeys(function($field) {
                return [(string)$field->id => $field];
            });

            // Find uniques to remove
            foreach ($existingUniques as $existingUq) {
                $fieldIds = $existingUq->constraintColumns->pluck('field_id')->toArray();

                $stillNeeded = false;
                foreach ($fieldIds as $fid) {
                    if ($newUniqueFieldIds->has((string)$fid)) {
                        $stillNeeded = true;
                        break;
                    }
                }

                if (!$stillNeeded) {
                    $existingUq->delete();
                } else {
                    foreach ($fieldIds as $fid) {
                        $newUniqueFieldIds->forget((string)$fid);
                    }
                }
            }

            // Add new uniques
            foreach ($newUniqueFieldIds as $fieldId => $field) {
                $constraintName = $table->table_name . '_' . $field->field_name . '_ukey';

                $newUq = \App\Models\SchemaConstraint::create([
                    'table_id' => $table->id,
                    'constraint_name' => $constraintName,
                    'constraint_type' => 'UNIQUE',
                ]);
                \App\Models\SchemaConstraintColumn::create([
                    'constraint_id' => $newUq->id,
                    'field_id' => $field->id,
                    'column_order' => 0,
                ]);
            }

            // 🔓 RESTORE FOREIGN KEYS after recreating fields
            foreach ($existingForeignKeys as $fkData) {
                // Map source field names to field IDs (using updated/preserved IDs)
                $sourceFieldIds = [];
                foreach ($fkData['source_fields'] as $fieldName) {
                    if (isset($updatedFields[$fieldName])) {
                        $sourceFieldIds[] = $updatedFields[$fieldName]->id;
                    }
                }

                // Check if all source fields still exist
                if (count($sourceFieldIds) !== count($fkData['source_fields'])) {
                    Log::warning('⚠️ Could not restore FK (source fields missing):', [
                        'constraint' => $fkData['constraint_name'],
                        'fields' => $fkData['source_fields']
                    ]);
                    continue;
                }

                // Find referenced table (still exists, unchanged)
                $referencedTable = \App\Models\SchemaTable::find($fkData['referenced_table_id']);
                if (!$referencedTable) {
                    Log::warning('⚠️ Could not restore FK (referenced table not found):', [
                        'constraint' => $fkData['constraint_name'],
                        'referenced_table_id' => $fkData['referenced_table_id']
                    ]);
                    continue;
                }

                // Find referenced field IDs
                $referencedFieldIds = [];
                foreach ($fkData['referenced_fields'] as $fieldName) {
                    $refField = \App\Models\SchemaField::where('table_id', $referencedTable->id)
                        ->where('field_name', $fieldName)
                        ->first();
                    if ($refField) {
                        $referencedFieldIds[] = $refField->id;
                    }
                }

                // Check if all referenced fields exist
                if (count($referencedFieldIds) !== count($fkData['referenced_fields'])) {
                    Log::warning('⚠️ Could not restore FK (referenced fields missing):', [
                        'constraint' => $fkData['constraint_name'],
                        'referenced_fields' => $fkData['referenced_fields']
                    ]);
                    continue;
                }

                // Recreate the FK constraint
                $restoredFK = \App\Models\SchemaConstraint::create([
                    'table_id' => $table->id,
                    'constraint_name' => $fkData['constraint_name'],
                    'constraint_type' => 'FOREIGN KEY',
                ]);

                // Add constraint columns (source fields)
                foreach ($sourceFieldIds as $index => $fieldId) {
                    \App\Models\SchemaConstraintColumn::create([
                        'constraint_id' => $restoredFK->id,
                        'field_id' => $fieldId,
                        'column_order' => $index,
                    ]);
                }

                // Add FK reference
                $fkReference = \App\Models\SchemaForeignKeyReference::create([
                    'constraint_id' => $restoredFK->id,
                    'referenced_table_id' => $fkData['referenced_table_id'],
                    'on_delete' => $fkData['on_delete'],
                    'on_update' => $fkData['on_update'],
                ]);

                // Add referenced columns
                foreach ($referencedFieldIds as $refFieldId) {
                    \App\Models\SchemaForeignKeyReferenceColumn::create([
                        'reference_id' => $fkReference->id,
                        'referenced_field_id' => $refFieldId,
                    ]);
                }
            }

            $table->load(['fields', 'constraints']);

            return response()->json([
                'message' => 'Table updated successfully',
                'table' => $table
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update table',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a table from a schema version
     */
    public function deleteTable(SchemaVersion $version, \App\Models\SchemaTable $table): JsonResponse
    {
        $user = Auth::user();

        // Check if this schema version has a schema and user can edit it
        if ($version->hasSchema()) {
            $schema = $version->schema;
            if (!$schema->canBeEditedBy($user)) {
                return response()->json(['message' => 'Unauthorized to edit this schema'], 403);
            }
        }

        // Check if table belongs to this version
        if ($table->schema_version_id !== $version->id) {
            return response()->json(['message' => 'Table does not belong to this schema version'], 400);
        }

        try {
            // Delete FK constraints that reference this table from other tables
            $deletedFKs = $this->deleteOrphanedForeignKeyReferences($table);

            // Delete the table and all its related data (fields, constraints, etc.)
            $table->delete();

            $message = 'Table deleted successfully';
            if ($deletedFKs > 0) {
                $message .= " ({$deletedFKs} FK-Constraint(s) die auf diese Tabelle zeigten wurden ebenfalls gelöscht)";
            }

            return response()->json(['success' => true, 'message' => $message, 'deleted_fks' => $deletedFKs]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete table with version copy - creates new version first, then deletes table
     */
    public function deleteTableWithVersionCopy(SchemaVersion $version, \App\Models\SchemaTable $table, Request $request): JsonResponse
    {
        $user = Auth::user();

        // Check if this schema version has a schema and user can edit it
        if (!$version->hasSchema()) {
            return response()->json(['message' => 'This action requires a floating schema'], 400);
        }

        $schema = $version->schema;
        if (!$schema->canBeEditedBy($user)) {
            return response()->json(['message' => 'Unauthorized to edit this schema'], 403);
        }

        // Check if table belongs to this version
        if ($table->schema_version_id !== $version->id) {
            return response()->json(['message' => 'Table does not belong to this schema version'], 400);
        }

        try {
            // Create new version with complete copy of current data
            $newVersion = SchemaVersion::createNewVersionWithCopy(
                $schema,
                $version->version_number,
                $request->input('description', "Table deletion: {$table->table_name}")
            );

            // Find the table to delete in the NEW version
            $tableToDelete = $newVersion->tables()->where('table_name', $table->table_name)->first();

            if (!$tableToDelete) {
                throw new \Exception("Table '{$table->table_name}' not found in new version {$newVersion->version_number}");
            }

            // Delete FK constraints that reference this table from other tables
            $deletedFKs = $this->deleteOrphanedForeignKeyReferences($tableToDelete);

            // Delete the table from the NEW version only
            $tableToDelete->delete();

            $message = 'New version created and table deleted';
            if ($deletedFKs > 0) {
                $message .= " ({$deletedFKs} FK-Constraint(s) die auf diese Tabelle zeigten wurden ebenfalls gelöscht)";
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'new_version' => $newVersion,
                'new_version_number' => $newVersion->version_number,
                'deleted_fks' => $deletedFKs
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Mark a schema version as having unsaved changes
     */
    public function markUnsavedChanges(SchemaVersion $version): JsonResponse
    {
        $user = Auth::user();
        
        // Check if this schema version has a schema and user can edit it
        if ($version->hasSchema()) {
            $schema = $version->schema;
            if (!$schema->canBeEditedBy($user)) {
                return response()->json(['message' => 'Unauthorized to edit this schema'], 403);
            }
        }

        $version->update(['has_unsaved_changes' => true]);

        return response()->json(['success' => true]);
    }

    /**
     * Create a new version for a floating schema
     */
    public function createNewVersion(Request $request, FloatingSchema $schema): JsonResponse
    {
        $user = Auth::user();
        
        // Check if user can edit this schema
        if (!$schema->canBeEditedBy($user)) {
            return response()->json(['message' => 'Unauthorized to edit this schema'], 403);
        }

        $request->validate([
            'description' => 'nullable|string|max:500'
        ]);

        try {
            // Get the latest version number to copy from
            $latestVersion = $schema->versions()->orderByDesc('version_number')->first();

            if ($latestVersion) {
                // Create new version WITH COPY of existing tables
                $nextVersionNumber = $latestVersion->version_number + 1;
                $newVersion = SchemaVersion::createNewVersionWithCopy(
                    $schema,
                    $latestVersion->version_number,
                    $request->input('description', "Version {$nextVersionNumber}")
                );
            } else {
                // First version - create empty version
                $newVersion = SchemaVersion::createNewVersion($schema, $request->input('description'));
            }

            return response()->json($newVersion);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete a schema version (HARD delete - permanent!)
     */
    public function deleteVersion(FloatingSchema $schema, SchemaVersion $version): JsonResponse
    {
        $user = Auth::user();

        // Check if user can edit this schema
        if (!$schema->canBeEditedBy($user)) {
            return response()->json(['message' => 'Unauthorized to edit this schema'], 403);
        }

        // Check if version belongs to this schema
        if ($version->schema_id !== $schema->id) {
            return response()->json(['message' => 'Version does not belong to this schema'], 400);
        }

        // Check if this is the last version
        $versionCount = $schema->versions()->count();
        if ($versionCount <= 1) {
            return response()->json(['message' => 'Cannot delete the only version. Delete the schema instead.'], 422);
        }

        try {
            $deletedVersionNumber = $version->version_number;

            // Delete associated designer layout for this version
            \App\Models\SchemaDesignerLayout::where('schema_id', $schema->id)
                ->where('version_number', $deletedVersionNumber)
                ->delete();

            // Hard delete the version
            $version->delete();

            // Update schema's last_version if we deleted the current last version
            if ($schema->last_version === $deletedVersionNumber) {
                // Find the new highest version number
                $newLastVersion = $schema->versions()->max('version_number');
                $schema->update(['last_version' => $newLastVersion]);
            }

            // Refresh the schema to get updated values
            $schema->refresh();

            return response()->json([
                'success' => true,
                'message' => 'Schema version deleted successfully',
                'new_last_version' => $schema->last_version,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete version',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create a new version and add a table to it
     */
    public function createVersionAndTable(Request $request, FloatingSchema $schema): JsonResponse
    {
        $user = Auth::user();

        // Check if user can edit this schema
        if (!$schema->canBeEditedBy($user)) {
            return response()->json(['message' => 'Unauthorized to edit this schema'], 403);
        }

        $request->validate([
            'table_name' => 'required|string|max:255',
            'comment' => 'nullable|string',
            'columns' => 'array',
            'columns.*.column_name' => 'required|string|max:255',
            'columns.*.data_type' => 'required|string|max:255',
            'columns.*.is_nullable' => 'boolean',
            'columns.*.is_auto_increment' => 'boolean',
            'description' => 'nullable|string|max:500'
        ]);

        try {
            // Get the latest version to copy from
            $latestVersion = $schema->versions()->orderByDesc('version_number')->first();

            if ($latestVersion) {
                // Create new version WITH COPY of existing tables from latest version
                $newVersion = SchemaVersion::createNewVersionWithCopy(
                    $schema,
                    $latestVersion->version_number,
                    $request->input('description', "New table: {$request->table_name}")
                );
            } else {
                // First version - create empty version
                $newVersion = SchemaVersion::createNewVersion(
                    $schema,
                    $request->input('description', "New table: {$request->table_name}")
                );
            }

            // Check if table with same name already exists in this version
            $existingTable = $newVersion->tables()->where('table_name', $request->table_name)->first();

            if ($existingTable) {
                return response()->json([
                    'message' => 'A table with this name already exists in this schema version',
                    'error' => "Table '{$request->table_name}' already exists"
                ], 422);
            }

            // Create the new table in the new version
            $table = \App\Models\SchemaTable::create([
                'schema_id' => $schema->id,
                'schema_version_id' => $newVersion->id,
                'table_name' => $request->table_name,
                'comment' => $request->comment,
            ]);

            // Create columns if provided
            if ($request->has('columns')) {
                foreach ($request->columns as $index => $columnData) {
                    \App\Models\SchemaField::create([
                        'table_id' => $table->id,
                        'field_name' => $columnData['column_name'],
                        'field_type' => strtolower($columnData['data_type']),
                        'is_nullable' => $columnData['is_nullable'] ?? true,
                        'is_auto_increment' => $columnData['is_auto_increment'] ?? false,
                        'is_primary_key' => $columnData['is_primary_key'] ?? false,
                        'is_index' => $columnData['is_index'] ?? false,
                        'is_unique' => $columnData['is_unique'] ?? false,
                        'field_order' => $index, // Logische Reihenfolge: 0, 1, 2, 3...
                    ]);
                }
            }

            $table->load('fields');

            return response()->json([
                'message' => 'New version created with table successfully',
                'version' => $newVersion,
                'table' => $table
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create version and table',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Debug schema version to show detailed statistics
     */
    public function debugSchemaVersion(SchemaVersion $version): JsonResponse
    {
        $user = Auth::user();
        
        // Check access
        if ($version->hasSchema()) {
            $schema = $version->schema;
            if (!$schema->canBeAccessedBy($user)) {
                return response()->json(['message' => 'Schema version not found'], 404);
            }
        }

        $tables = $version->tables()->with(['fields', 'constraints'])->get();
        
        $stats = [
            'version_info' => [
                'id' => $version->id,
                'version_number' => $version->version_number,
                'schema_id' => $version->schema_id,
                'created_at' => $version->created_at
            ],
            'totals' => [
                'tables' => $tables->count(),
                'fields' => $tables->sum(function($table) { return $table->fields->count(); }),
                'constraints' => $tables->sum(function($table) { return $table->constraints->count(); }),
            ],
            'constraint_breakdown' => [
                'PRIMARY KEY' => 0,
                'FOREIGN KEY' => 0,
                'UNIQUE' => 0,
                'KEY' => 0,
                'OTHER' => 0
            ],
            'tables_detail' => []
        ];

        foreach ($tables as $table) {
            $tableStats = [
                'name' => $table->table_name,
                'fields' => $table->fields->count(),
                'constraints' => $table->constraints->count(),
                'constraint_types' => []
            ];

            foreach ($table->constraints as $constraint) {
                $type = $constraint->constraint_type ?? 'OTHER';
                if (!isset($tableStats['constraint_types'][$type])) {
                    $tableStats['constraint_types'][$type] = 0;
                }
                $tableStats['constraint_types'][$type]++;
                $stats['constraint_breakdown'][$type] = ($stats['constraint_breakdown'][$type] ?? 0) + 1;
            }

            $stats['tables_detail'][] = $tableStats;
        }

        return response()->json($stats);
    }

    /**
     * Delete a foreign key constraint (creates new version if not latest)
     */
    public function deleteForeignKey(Request $request, $constraintId): JsonResponse
    {
        $user = Auth::user();

        try {
            // Find the constraint
            $constraint = \App\Models\SchemaConstraint::findOrFail($constraintId);

            // Get the table and version
            $table = $constraint->table;
            $version = $table->schemaVersion;

            if (!$version || !$version->hasSchema()) {
                return response()->json(['message' => 'This action requires a floating schema'], 400);
            }

            $schema = $version->schema;

            // Check permissions
            if (!$schema->canBeEditedBy($user)) {
                return response()->json(['message' => 'Unauthorized to edit this schema'], 403);
            }

            // Check if this is a foreign key
            if ($constraint->constraint_type !== 'FOREIGN KEY') {
                return response()->json(['message' => 'Only foreign key constraints can be deleted with this endpoint'], 400);
            }

            // Get constraint info for response
            $constraintInfo = [
                'constraint_name' => $constraint->constraint_name,
                'table_name' => $table->table_name,
            ];

            // Check if this is the latest version
            $isLatestVersion = $version->version_number === $schema->last_version;

            if (!$isLatestVersion) {
                // Need to create a new version first
                $newVersion = \App\Models\SchemaVersion::createNewVersionWithCopy(
                    $schema,
                    $version->version_number,
                    "Delete FK: {$constraint->constraint_name}"
                );

                // Find the corresponding constraint in the new version
                $newTable = $newVersion->tables()->where('table_name', $table->table_name)->first();
                if (!$newTable) {
                    return response()->json(['message' => 'Failed to find table in new version'], 500);
                }

                $newConstraint = $newTable->constraints()
                    ->where('constraint_name', $constraint->constraint_name)
                    ->where('constraint_type', 'FOREIGN KEY')
                    ->first();

                if (!$newConstraint) {
                    return response()->json(['message' => 'Failed to find constraint in new version'], 500);
                }

                // Delete the constraint in the new version
                $newConstraint->delete();

                return response()->json([
                    'success' => true,
                    'message' => 'New version created and foreign key deleted',
                    'constraint' => $constraintInfo,
                    'new_version' => [
                        'id' => $newVersion->id,
                        'version_number' => $newVersion->version_number,
                    ]
                ]);
            } else {
                // Latest version - delete directly
                $constraint->delete();

                return response()->json([
                    'success' => true,
                    'message' => 'Foreign key deleted successfully',
                    'constraint' => $constraintInfo,
                ]);
            }

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Constraint not found'], 404);
        } catch (\Exception $e) {
            \Log::error('Delete FK Error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to delete foreign key',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a foreign key constraint (creates new version if not latest)
     */
    public function updateForeignKey(Request $request, $constraintId): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'constraint_name' => 'required|string|max:255',
            'on_delete' => 'sometimes|string|in:CASCADE,SET NULL,RESTRICT,NO ACTION,SET DEFAULT',
            'on_update' => 'sometimes|string|in:CASCADE,SET NULL,RESTRICT,NO ACTION,SET DEFAULT',
        ]);

        try {
            // Find the constraint
            $constraint = \App\Models\SchemaConstraint::findOrFail($constraintId);

            // Get the table and version
            $table = $constraint->table;
            $version = $table->schemaVersion;

            if (!$version || !$version->hasSchema()) {
                return response()->json(['message' => 'This action requires a floating schema'], 400);
            }

            $schema = $version->schema;

            // Check permissions
            if (!$schema->canBeEditedBy($user)) {
                return response()->json(['message' => 'Unauthorized to edit this schema'], 403);
            }

            // Check if this is a foreign key
            if ($constraint->constraint_type !== 'FOREIGN KEY') {
                return response()->json(['message' => 'Only foreign key constraints can be updated with this endpoint'], 400);
            }

            // Check if this is the latest version
            $isLatestVersion = $version->version_number === $schema->last_version;

            if (!$isLatestVersion) {
                // Need to create a new version first
                $newVersion = \App\Models\SchemaVersion::createNewVersionWithCopy(
                    $schema,
                    $version->version_number,
                    "Update FK: {$constraint->constraint_name}"
                );

                // Find the corresponding constraint in the new version
                $newTable = $newVersion->tables()->where('table_name', $table->table_name)->first();
                if (!$newTable) {
                    return response()->json(['message' => 'Failed to find table in new version'], 500);
                }

                $newConstraint = $newTable->constraints()
                    ->where('constraint_name', $constraint->constraint_name)
                    ->where('constraint_type', 'FOREIGN KEY')
                    ->first();

                if (!$newConstraint) {
                    return response()->json(['message' => 'Failed to find constraint in new version'], 500);
                }

                // Update the constraint in the new version
                $this->updateConstraintNameAndActions($newConstraint, $validated);

                return response()->json([
                    'success' => true,
                    'message' => 'New version created and foreign key updated',
                    'new_version' => [
                        'id' => $newVersion->id,
                        'version_number' => $newVersion->version_number,
                    ]
                ]);
            } else {
                // Latest version - update directly
                $this->updateConstraintNameAndActions($constraint, $validated);

                return response()->json([
                    'success' => true,
                    'message' => 'Foreign key updated successfully',
                ]);
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Constraint not found'], 404);
        } catch (\Exception $e) {
            \Log::error('Update FK Error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to update foreign key',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new foreign key constraint (creates new version if not latest)
     */
    public function createForeignKey(Request $request, $tableId): JsonResponse
    {
        $user = Auth::user();

        $validated = $request->validate([
            'source_field_id' => 'required|exists:schema_fields,id',
            'target_field_id' => 'required|exists:schema_fields,id',
            'on_delete' => 'nullable|in:CASCADE,SET NULL,RESTRICT,NO ACTION,SET DEFAULT',
            'on_update' => 'nullable|in:CASCADE,SET NULL,RESTRICT,NO ACTION,SET DEFAULT',
            'constraint_name' => 'nullable|string|max:255',
        ]);

        try {
            // Find the table
            $table = \App\Models\SchemaTable::findOrFail($tableId);
            $version = $table->schemaVersion;

            if (!$version || !$version->hasSchema()) {
                return response()->json(['message' => 'This action requires a floating schema'], 400);
            }

            $schema = $version->schema;

            // Check permissions
            if (!$schema->canBeEditedBy($user)) {
                return response()->json(['message' => 'Unauthorized to edit this schema'], 403);
            }

            // Get source and target fields for validation
            $sourceField = \App\Models\SchemaField::find($validated['source_field_id']);
            $targetField = \App\Models\SchemaField::find($validated['target_field_id']);

            if (!$sourceField || !$targetField) {
                return response()->json(['message' => 'Source or target field not found'], 404);
            }

            // Validate data type compatibility
            $typeValidation = $this->validateForeignKeyCompatibility($sourceField, $targetField);
            if (!$typeValidation['valid']) {
                return response()->json([
                    'message' => $typeValidation['message'],
                    'error_type' => 'incompatible_types',
                ], 422);
            }

            // Validate field requirements (PK/Index) - can now return errors too
            $fieldValidation = $this->validateForeignKeyFieldRequirements($sourceField, $targetField);
            if (!$fieldValidation['valid']) {
                return response()->json([
                    'message' => $fieldValidation['message'],
                    'error_type' => 'invalid_field_requirements',
                ], 422);
            }

            // Validate SET NULL actions - cannot use SET NULL if source field is NOT NULL
            $onDelete = $validated['on_delete'] ?? 'RESTRICT';
            $onUpdate = $validated['on_update'] ?? 'RESTRICT';

            if (!$sourceField->is_nullable) {
                if (strtoupper($onDelete) === 'SET NULL') {
                    return response()->json([
                        'message' => "SET NULL bei ON DELETE nicht möglich: Das Quellfeld '{$sourceField->field_name}' ist NOT NULL. MySQL kann keine NULL-Werte in eine NOT NULL Spalte schreiben.",
                        'error_type' => 'set_null_on_not_null',
                    ], 422);
                }
                if (strtoupper($onUpdate) === 'SET NULL') {
                    return response()->json([
                        'message' => "SET NULL bei ON UPDATE nicht möglich: Das Quellfeld '{$sourceField->field_name}' ist NOT NULL. MySQL kann keine NULL-Werte in eine NOT NULL Spalte schreiben.",
                        'error_type' => 'set_null_on_not_null',
                    ], 422);
                }
            }

            // Collect all warnings (only index recommendations now)
            $warnings = [];
            if (!empty($fieldValidation['warnings'])) {
                $warnings = array_merge($warnings, $fieldValidation['warnings']);
            }

            // Check if this is the latest version
            $isLatestVersion = $version->version_number === $schema->last_version;

            if (!$isLatestVersion) {
                // Need to create a new version first
                $newVersion = \App\Models\SchemaVersion::createNewVersionWithCopy(
                    $schema,
                    $version->version_number,
                    "Create FK on {$table->table_name}"
                );

                // Find the corresponding table in the new version
                $newTable = $newVersion->tables()->where('table_name', $table->table_name)->first();
                if (!$newTable) {
                    return response()->json(['message' => 'Failed to find table in new version'], 500);
                }

                // Create the constraint in the new version
                $this->createConstraintData($newTable, $validated);

                $response = [
                    'success' => true,
                    'message' => 'New version created and foreign key created',
                    'new_version' => [
                        'id' => $newVersion->id,
                        'version_number' => $newVersion->version_number,
                    ]
                ];
                if (!empty($warnings)) {
                    $response['warnings'] = $warnings;
                }
                return response()->json($response);
            } else {
                // Latest version - create directly
                $this->createConstraintData($table, $validated);

                $response = [
                    'success' => true,
                    'message' => 'Foreign key created successfully',
                ];
                if (!empty($warnings)) {
                    $response['warnings'] = $warnings;
                }
                return response()->json($response);
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Table not found'], 404);
        } catch (\Exception $e) {
            \Log::error('Create FK Error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to create foreign key',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper: Update constraint data
     */
    private function updateConstraintNameAndActions($constraint, $validated)
    {
        // Update constraint name
        $constraint->update(['constraint_name' => $validated['constraint_name']]);

        // Update on_delete and on_update actions if FK reference exists
        $fkReference = $constraint->foreignKeyReference;
        if ($fkReference) {
            $updateData = [];
            if (isset($validated['on_delete'])) {
                $updateData['on_delete'] = $validated['on_delete'];
            }
            if (isset($validated['on_update'])) {
                $updateData['on_update'] = $validated['on_update'];
            }
            if (!empty($updateData)) {
                $fkReference->update($updateData);
            }
        }
    }

    private function updateConstraintData($constraint, $validated)
    {
        // Update constraint name if provided
        if (!empty($validated['constraint_name'])) {
            $constraint->update(['constraint_name' => $validated['constraint_name']]);
        }

        // Delete old constraint columns
        $constraint->constraintColumns()->delete();

        // Create new constraint column for source field
        $sourceField = \App\Models\SchemaField::find($validated['source_field_id']);
        \App\Models\SchemaConstraintColumn::create([
            'constraint_id' => $constraint->id,
            'field_id' => $sourceField->id,
            'column_order' => 0,
        ]);

        // Update or create foreign key reference
        $targetField = \App\Models\SchemaField::find($validated['target_field_id']);
        $targetTable = $targetField->table;

        $fkReference = $constraint->foreignKeyReference;
        if ($fkReference) {
            $fkReference->update([
                'referenced_table_id' => $targetTable->id,
                'on_delete' => $validated['on_delete'] ?? 'RESTRICT',
                'on_update' => $validated['on_update'] ?? 'RESTRICT',
            ]);
            $fkReference->referenceColumns()->delete();
        } else {
            $fkReference = \App\Models\SchemaForeignKeyReference::create([
                'constraint_id' => $constraint->id,
                'referenced_table_id' => $targetTable->id,
                'on_delete' => $validated['on_delete'] ?? 'RESTRICT',
                'on_update' => $validated['on_update'] ?? 'RESTRICT',
            ]);
        }

        // Create reference column
        \App\Models\SchemaForeignKeyReferenceColumn::create([
            'reference_id' => $fkReference->id,
            'referenced_field_id' => $targetField->id,
        ]);
    }

    /**
     * Helper: Create constraint data
     */
    private function createConstraintData($table, $validated)
    {
        $sourceField = \App\Models\SchemaField::find($validated['source_field_id']);
        $targetField = \App\Models\SchemaField::find($validated['target_field_id']);
        $targetTable = $targetField->table;

        // Generate constraint name if not provided
        $constraintName = $validated['constraint_name'] ??
            'fk_' . $table->table_name . '_' . $sourceField->field_name;

        // Create constraint
        $constraint = \App\Models\SchemaConstraint::create([
            'table_id' => $table->id,
            'constraint_name' => $constraintName,
            'constraint_type' => 'FOREIGN KEY',
        ]);

        // Create constraint column
        \App\Models\SchemaConstraintColumn::create([
            'constraint_id' => $constraint->id,
            'field_id' => $sourceField->id,
            'column_order' => 0,
        ]);

        // Create foreign key reference
        $fkReference = \App\Models\SchemaForeignKeyReference::create([
            'constraint_id' => $constraint->id,
            'referenced_table_id' => $targetTable->id,
            'on_delete' => $validated['on_delete'] ?? 'RESTRICT',
            'on_update' => $validated['on_update'] ?? 'RESTRICT',
        ]);

        // Create reference column
        \App\Models\SchemaForeignKeyReferenceColumn::create([
            'reference_id' => $fkReference->id,
            'referenced_field_id' => $targetField->id,
        ]);
    }

    /**
     * Delete FK constraints from other tables that reference this table
     * This is called when a table is being deleted to clean up orphaned references
     * Returns the number of deleted FK constraints
     */
    private function deleteOrphanedForeignKeyReferences(\App\Models\SchemaTable $table): int
    {
        $deletedCount = 0;

        // Get the schema version ID of the table being deleted
        $schemaVersionId = $table->schema_version_id;

        // Find all FK references that point to this table within the SAME schema version
        // We need to join through constraints and tables to filter by schema version
        $fkReferences = \App\Models\SchemaForeignKeyReference::where('referenced_table_id', $table->id)
            ->whereHas('constraint.table', function ($query) use ($schemaVersionId) {
                $query->where('schema_version_id', $schemaVersionId);
            })
            ->get();

        \Log::info("Looking for FK references to table", [
            'table_id' => $table->id,
            'table_name' => $table->table_name,
            'schema_version_id' => $schemaVersionId,
            'found_references' => $fkReferences->count(),
        ]);

        foreach ($fkReferences as $fkReference) {
            // Get the parent constraint
            $constraint = $fkReference->constraint;
            if ($constraint) {
                // Delete the constraint (this will cascade delete the reference and columns)
                $constraint->delete();
                $deletedCount++;

                \Log::info("Deleted orphaned FK constraint", [
                    'constraint_name' => $constraint->constraint_name,
                    'source_table_id' => $constraint->table_id,
                    'referenced_table_id' => $table->id,
                    'referenced_table_name' => $table->table_name,
                ]);
            }
        }

        return $deletedCount;
    }

    /**
     * Validate FK data type compatibility between source and target fields
     * Returns array with 'valid' boolean and 'message' string
     */
    private function validateForeignKeyCompatibility(\App\Models\SchemaField $sourceField, \App\Models\SchemaField $targetField): array
    {
        $sourceType = strtoupper($sourceField->field_type);
        $targetType = strtoupper($targetField->field_type);

        // Extract base type (without size) for comparison
        $sourceBaseType = $this->extractBaseType($sourceType);
        $targetBaseType = $this->extractBaseType($targetType);

        // Define compatible type groups
        $integerTypes = ['TINYINT', 'SMALLINT', 'MEDIUMINT', 'INT', 'INTEGER', 'BIGINT'];
        $stringTypes = ['CHAR', 'VARCHAR', 'TEXT', 'TINYTEXT', 'MEDIUMTEXT', 'LONGTEXT'];
        $binaryTypes = ['BINARY', 'VARBINARY', 'BLOB', 'TINYBLOB', 'MEDIUMBLOB', 'LONGBLOB'];
        $decimalTypes = ['DECIMAL', 'NUMERIC', 'FLOAT', 'DOUBLE', 'REAL'];
        $dateTypes = ['DATE', 'DATETIME', 'TIMESTAMP', 'TIME', 'YEAR'];

        // Check if both types are in the same compatible group
        $typeGroups = [
            'integer' => $integerTypes,
            'string' => $stringTypes,
            'binary' => $binaryTypes,
            'decimal' => $decimalTypes,
            'date' => $dateTypes,
        ];

        $sourceGroup = null;
        $targetGroup = null;

        foreach ($typeGroups as $groupName => $types) {
            if (in_array($sourceBaseType, $types)) {
                $sourceGroup = $groupName;
            }
            if (in_array($targetBaseType, $types)) {
                $targetGroup = $groupName;
            }
        }

        // If both fields are in the same type group, check for exact compatibility
        if ($sourceGroup !== null && $sourceGroup === $targetGroup) {
            // Strict check for integer types: size AND unsigned must match exactly
            if ($sourceGroup === 'integer') {
                $sourceSize = $this->getIntegerSize($sourceBaseType);
                $targetSize = $this->getIntegerSize($targetBaseType);

                // Integer size must match exactly (MySQL requirement)
                if ($sourceSize !== $targetSize) {
                    return [
                        'valid' => false,
                        'message' => "Inkompatible Integer-Größen: {$sourceField->field_name} ({$sourceBaseType}) und {$targetField->field_name} ({$targetBaseType}) müssen den gleichen Datentyp haben. MySQL erlaubt keine Foreign Keys zwischen unterschiedlichen Integer-Größen.",
                    ];
                }

                // UNSIGNED attribute must match exactly (MySQL requirement)
                if ($sourceField->is_unsigned !== $targetField->is_unsigned) {
                    $sourceUnsigned = $sourceField->is_unsigned ? 'UNSIGNED' : 'SIGNED';
                    $targetUnsigned = $targetField->is_unsigned ? 'UNSIGNED' : 'SIGNED';
                    return [
                        'valid' => false,
                        'message' => "UNSIGNED-Attribut stimmt nicht überein: {$sourceField->field_name} ist {$sourceUnsigned}, aber {$targetField->field_name} ist {$targetUnsigned}. Beide Felder müssen das gleiche UNSIGNED-Attribut haben.",
                    ];
                }
            }

            // Strict check for string types: length must be compatible
            if ($sourceGroup === 'string') {
                $sourceLength = $this->extractTypeLength($sourceType);
                $targetLength = $this->extractTypeLength($targetType);

                // For CHAR/VARCHAR, lengths should match or source should be smaller/equal
                if ($sourceLength !== null && $targetLength !== null && $sourceLength > $targetLength) {
                    return [
                        'valid' => false,
                        'message' => "Inkompatible String-Längen: {$sourceField->field_name} ({$sourceType}) ist größer als {$targetField->field_name} ({$targetType}). Das Quellfeld darf nicht größer sein als das Zielfeld.",
                    ];
                }

                // Base types should match (CHAR with CHAR, VARCHAR with VARCHAR)
                if ($sourceBaseType !== $targetBaseType &&
                    !($sourceBaseType === 'CHAR' && $targetBaseType === 'VARCHAR') &&
                    !($sourceBaseType === 'VARCHAR' && $targetBaseType === 'CHAR')) {
                    return [
                        'valid' => false,
                        'message' => "Inkompatible String-Typen: {$sourceField->field_name} ({$sourceBaseType}) und {$targetField->field_name} ({$targetBaseType}) sind nicht kompatibel.",
                    ];
                }
            }

            // Strict check for decimal types: precision must match
            if ($sourceGroup === 'decimal') {
                if ($sourceBaseType !== $targetBaseType) {
                    return [
                        'valid' => false,
                        'message' => "Inkompatible Dezimal-Typen: {$sourceField->field_name} ({$sourceBaseType}) und {$targetField->field_name} ({$targetBaseType}) müssen den gleichen Typ haben.",
                    ];
                }
            }

            // Build result with optional warnings
            $result = ['valid' => true];

            // NULL/NOT NULL compatibility warning (not an error, but informative)
            $sourceNullable = $sourceField->is_nullable ? 'NULL' : 'NOT NULL';
            $targetNullable = $targetField->is_nullable ? 'NULL' : 'NOT NULL';

            if (!$sourceField->is_nullable && $targetField->is_nullable) {
                // Source is NOT NULL, target is NULL - this is usually fine, just informative
                $result['warning'] = "Hinweis: Quellfeld '{$sourceField->field_name}' ist NOT NULL, Zielfeld '{$targetField->field_name}' erlaubt NULL. SET NULL Aktionen sind nicht verfügbar.";
            }

            return $result;
        }

        // Types are incompatible
        return [
            'valid' => false,
            'message' => "Inkompatible Datentypen: {$sourceField->field_name} ({$sourceType}) kann nicht mit {$targetField->field_name} ({$targetType}) verknüpft werden. Foreign Keys erfordern kompatible Datentypen.",
        ];
    }

    /**
     * Extract base type from field type (e.g., VARCHAR(255) -> VARCHAR)
     */
    private function extractBaseType(string $fieldType): string
    {
        // Remove size/precision info: VARCHAR(255) -> VARCHAR, DECIMAL(10,2) -> DECIMAL
        $baseType = preg_replace('/\(.*\)/', '', $fieldType);
        // Remove UNSIGNED, ZEROFILL etc.
        $baseType = preg_replace('/\s+(UNSIGNED|ZEROFILL|SIGNED).*$/i', '', $baseType);
        return trim(strtoupper($baseType));
    }

    /**
     * Extract length from type (e.g., VARCHAR(255) -> 255)
     */
    private function extractTypeLength(string $fieldType): ?int
    {
        if (preg_match('/\((\d+)/', $fieldType, $matches)) {
            return (int) $matches[1];
        }
        return null;
    }

    /**
     * Get integer type size for comparison (larger = more bytes)
     */
    private function getIntegerSize(string $baseType): int
    {
        $sizes = [
            'TINYINT' => 1,
            'SMALLINT' => 2,
            'MEDIUMINT' => 3,
            'INT' => 4,
            'INTEGER' => 4,
            'BIGINT' => 8,
        ];
        return $sizes[$baseType] ?? 4;
    }

    /**
     * Validate FK field requirements (PK/Index checks)
     * Returns array with 'valid' boolean, 'message' for errors, optional 'warnings' array
     */
    private function validateForeignKeyFieldRequirements(\App\Models\SchemaField $sourceField, \App\Models\SchemaField $targetField): array
    {
        $warnings = [];

        // CRITICAL: Source field should NOT be a primary key (FK direction is probably wrong)
        if ($sourceField->is_primary_key) {
            return [
                'valid' => false,
                'message' => "Ungültige FK-Richtung: Das Quellfeld '{$sourceField->field_name}' ist ein PRIMARY KEY. " .
                            "Primary Keys sollten das ZIEL eines Foreign Keys sein, nicht die QUELLE. " .
                            "Bitte tauschen Sie Quelle und Ziel, oder entfernen Sie den Primary Key vom Quellfeld.",
            ];
        }

        // CRITICAL: Target field MUST have a unique constraint (PK or UNIQUE) - MySQL requirement
        if (!$targetField->is_primary_key && !$targetField->is_unique) {
            return [
                'valid' => false,
                'message' => "MySQL-Fehler: Das Zielfeld '{$targetField->field_name}' muss einen PRIMARY KEY oder UNIQUE-Index haben. " .
                            "Foreign Keys können nur auf eindeutig indizierte Felder verweisen. " .
                            "Bitte fügen Sie einen PRIMARY KEY oder UNIQUE-Index zum Zielfeld hinzu.",
            ];
        }

        // Source field should have an index for performance (warning only)
        if (!$sourceField->is_index && !$sourceField->is_unique) {
            $warnings[] = "Empfehlung: Das Quellfeld '{$sourceField->field_name}' sollte einen Index haben für bessere Query-Performance bei JOINs.";
        }

        return [
            'valid' => true,
            'warnings' => $warnings,
        ];
    }

    /**
     * Get FK suggestions for a schema version
     * Analyzes field names and types to suggest potential foreign key relationships
     */
    public function getForeignKeySuggestions($versionId): JsonResponse
    {
        $user = Auth::user();

        try {
            $version = \App\Models\SchemaVersion::with(['tables.fields', 'tables.constraints.constraintColumns', 'tables.constraints.foreignKeyReference'])
                ->findOrFail($versionId);

            if (!$version->hasSchema()) {
                return response()->json(['message' => 'Schema not found'], 404);
            }

            $schema = $version->schema;

            // Check permissions
            if (!$schema->canBeAccessedBy($user)) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $suggestions = [];
            $existingFKs = [];

            // Collect existing FK relationships to avoid suggesting duplicates
            foreach ($version->tables as $table) {
                foreach ($table->constraints as $constraint) {
                    if ($constraint->constraint_type === 'FOREIGN KEY' && $constraint->foreignKeyReference) {
                        $sourceFieldIds = $constraint->constraintColumns->pluck('field_id')->toArray();
                        foreach ($sourceFieldIds as $sourceFieldId) {
                            $existingFKs[] = $sourceFieldId;
                        }
                    }
                }
            }

            // Find all primary key fields (potential FK targets)
            $primaryKeyFields = [];
            foreach ($version->tables as $table) {
                foreach ($table->fields as $field) {
                    if ($field->is_primary_key) {
                        $primaryKeyFields[] = [
                            'table' => $table,
                            'field' => $field,
                        ];
                    }
                }
            }

            // Analyze each table for potential FK source fields
            foreach ($version->tables as $sourceTable) {
                foreach ($sourceTable->fields as $sourceField) {
                    // Skip if already has FK
                    if (in_array($sourceField->id, $existingFKs)) {
                        continue;
                    }

                    // Skip primary keys (they're usually targets, not sources)
                    if ($sourceField->is_primary_key) {
                        continue;
                    }

                    // Look for matching PK fields in other tables
                    foreach ($primaryKeyFields as $pkData) {
                        $targetTable = $pkData['table'];
                        $targetField = $pkData['field'];

                        // Skip same table
                        if ($sourceTable->id === $targetTable->id) {
                            continue;
                        }

                        // Check for name pattern match
                        $matchScore = $this->calculateFKMatchScore(
                            $sourceField,
                            $targetField,
                            $sourceTable,
                            $targetTable
                        );

                        if ($matchScore > 0) {
                            // Verify data type compatibility
                            $typeValidation = $this->validateForeignKeyCompatibility($sourceField, $targetField);

                            $suggestions[] = [
                                'source_table_id' => $sourceTable->id,
                                'source_table_name' => $sourceTable->table_name,
                                'source_field_id' => $sourceField->id,
                                'source_field_name' => $sourceField->field_name,
                                'source_field_type' => $sourceField->field_type,
                                'target_table_id' => $targetTable->id,
                                'target_table_name' => $targetTable->table_name,
                                'target_field_id' => $targetField->id,
                                'target_field_name' => $targetField->field_name,
                                'target_field_type' => $targetField->field_type,
                                'match_score' => $matchScore,
                                'is_compatible' => $typeValidation['valid'],
                                'compatibility_warning' => $typeValidation['warning'] ?? null,
                            ];
                        }
                    }
                }
            }

            // Sort by match score (highest first)
            usort($suggestions, function ($a, $b) {
                return $b['match_score'] <=> $a['match_score'];
            });

            return response()->json([
                'success' => true,
                'suggestions' => $suggestions,
                'total' => count($suggestions),
            ]);

        } catch (\Exception $e) {
            \Log::error('FK Suggestions Error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to get FK suggestions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate match score for potential FK relationship
     * Higher score = more likely to be a valid FK
     */
    private function calculateFKMatchScore(
        \App\Models\SchemaField $sourceField,
        \App\Models\SchemaField $targetField,
        \App\Models\SchemaTable $sourceTable,
        \App\Models\SchemaTable $targetTable
    ): int {
        $score = 0;
        $sourceFieldName = strtolower($sourceField->field_name);
        $targetFieldName = strtolower($targetField->field_name);
        $targetTableName = strtolower($targetTable->table_name);

        // Pattern 1: source field is "{table}_id" or "{table}id" matching target table
        // e.g., user_id -> users.id (score: 100)
        $singularTableName = rtrim($targetTableName, 's'); // Simple singular (users -> user)
        if ($sourceFieldName === $singularTableName . '_id' ||
            $sourceFieldName === $singularTableName . 'id' ||
            $sourceFieldName === $targetTableName . '_id' ||
            $sourceFieldName === $targetTableName . 'id') {
            $score += 100;
        }

        // Pattern 2: source field contains target table name
        // e.g., customer_user_id -> users.id (score: 50)
        elseif (str_contains($sourceFieldName, $singularTableName) ||
                str_contains($sourceFieldName, $targetTableName)) {
            $score += 50;
        }

        // Pattern 3: field names match exactly
        // e.g., orders.user_id -> users.user_id (score: 30)
        elseif ($sourceFieldName === $targetFieldName) {
            $score += 30;
        }

        // Pattern 4: source field ends with _id and has index
        // General FK candidate (score: 20)
        elseif ((str_ends_with($sourceFieldName, '_id') || str_ends_with($sourceFieldName, 'id')) &&
                ($sourceField->is_index || $sourceField->is_unique)) {
            $score += 20;
        }

        // Bonus: Data types match exactly
        if (strtoupper($sourceField->field_type) === strtoupper($targetField->field_type)) {
            $score += 10;
        }

        // Bonus: Source field has index
        if ($sourceField->is_index || $sourceField->is_unique) {
            $score += 5;
        }

        return $score;
    }

    /**
     * Get FK dependencies for a field
     * Returns all FK relationships where this field is involved (as source or target)
     */
    public function getFieldFKDependencies($versionId, $fieldId): JsonResponse
    {
        $user = Auth::user();

        try {
            $field = \App\Models\SchemaField::with('table')->findOrFail($fieldId);
            $version = \App\Models\SchemaVersion::findOrFail($versionId);

            // Check authorization
            if ($version->hasSchema()) {
                $schema = $version->schema;
                if (!$schema->canBeAccessedBy($user)) {
                    return response()->json(['message' => 'Unauthorized'], 403);
                }
            }

            $dependencies = [
                'as_source' => [], // FK constraints where this field is the source (child)
                'as_target' => [], // FK constraints where this field is the target (parent)
            ];

            // Find FKs where this field is the SOURCE (child field pointing to parent)
            $sourceConstraintColumns = \App\Models\SchemaConstraintColumn::where('field_id', $field->id)
                ->with(['constraint.table', 'constraint.foreignKeyReference.referencedTable', 'constraint.foreignKeyReference.referenceColumns.field'])
                ->get();

            foreach ($sourceConstraintColumns as $column) {
                $constraint = $column->constraint;
                if ($constraint && $constraint->constraint_type === 'FOREIGN KEY' && $constraint->foreignKeyReference) {
                    $fkRef = $constraint->foreignKeyReference;
                    $refTable = $fkRef->referencedTable;
                    $refFields = $fkRef->referenceColumns->map(fn($c) => $c->field)->filter();

                    $dependencies['as_source'][] = [
                        'constraint_id' => $constraint->id,
                        'constraint_name' => $constraint->constraint_name,
                        'source_table' => $field->table->table_name,
                        'source_field' => $field->field_name,
                        'source_field_type' => $field->field_type,
                        'source_is_unsigned' => $field->is_unsigned,
                        'target_table' => $refTable ? $refTable->table_name : null,
                        'target_table_id' => $refTable ? $refTable->id : null,
                        'target_fields' => $refFields->map(fn($f) => [
                            'id' => $f->id,
                            'name' => $f->field_name,
                            'type' => $f->field_type,
                            'is_unsigned' => $f->is_unsigned,
                        ])->values()->toArray(),
                    ];
                }
            }

            // Find FKs where this field is the TARGET (parent field being referenced)
            $targetRefColumns = \App\Models\SchemaForeignKeyReferenceColumn::where('field_id', $field->id)
                ->with(['reference.constraint.table', 'reference.constraint.constraintColumns.field'])
                ->get();

            foreach ($targetRefColumns as $refColumn) {
                $reference = $refColumn->reference;
                if ($reference && $reference->constraint) {
                    $constraint = $reference->constraint;
                    $sourceTable = $constraint->table;
                    $sourceFields = $constraint->constraintColumns->map(fn($c) => $c->field)->filter();

                    $dependencies['as_target'][] = [
                        'constraint_id' => $constraint->id,
                        'constraint_name' => $constraint->constraint_name,
                        'source_table' => $sourceTable ? $sourceTable->table_name : null,
                        'source_table_id' => $sourceTable ? $sourceTable->id : null,
                        'source_fields' => $sourceFields->map(fn($f) => [
                            'id' => $f->id,
                            'name' => $f->field_name,
                            'type' => $f->field_type,
                            'is_unsigned' => $f->is_unsigned,
                        ])->values()->toArray(),
                        'target_table' => $field->table->table_name,
                        'target_field' => $field->field_name,
                        'target_field_type' => $field->field_type,
                        'target_is_unsigned' => $field->is_unsigned,
                    ];
                }
            }

            $hasDependencies = !empty($dependencies['as_source']) || !empty($dependencies['as_target']);

            return response()->json([
                'success' => true,
                'field' => [
                    'id' => $field->id,
                    'name' => $field->field_name,
                    'type' => $field->field_type,
                    'is_unsigned' => $field->is_unsigned,
                    'table_name' => $field->table->table_name,
                ],
                'has_dependencies' => $hasDependencies,
                'dependencies' => $dependencies,
                'total_as_source' => count($dependencies['as_source']),
                'total_as_target' => count($dependencies['as_target']),
            ]);

        } catch (\Exception $e) {
            \Log::error('Get Field FK Dependencies Error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to get FK dependencies',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Apply cascading field changes to all FK-related fields
     * When a primary key field changes (type, unsigned), propagate to all FK source fields
     */
    public function applyCascadingFieldChanges(Request $request, $versionId, $fieldId): JsonResponse
    {
        $user = Auth::user();

        try {
            $validated = $request->validate([
                'new_type' => 'nullable|string',
                'new_unsigned' => 'nullable|boolean',
                'cascade_to_source_fields' => 'required|boolean', // Update child FK fields
            ]);

            $field = \App\Models\SchemaField::with('table')->findOrFail($fieldId);
            $version = \App\Models\SchemaVersion::findOrFail($versionId);

            // Check authorization
            if ($version->hasSchema()) {
                $schema = $version->schema;
                if (!$schema->canBeEditedBy($user)) {
                    return response()->json(['message' => 'Unauthorized to edit this schema'], 403);
                }
            }

            $updatedFields = [];
            $errors = [];

            // Only cascade if this field is a target (parent) and cascade is requested
            if ($validated['cascade_to_source_fields']) {
                // Find all FK constraints where this field is the TARGET (parent)
                $targetRefColumns = \App\Models\SchemaForeignKeyReferenceColumn::where('field_id', $field->id)
                    ->with(['reference.constraint.constraintColumns.field'])
                    ->get();

                foreach ($targetRefColumns as $refColumn) {
                    $reference = $refColumn->reference;
                    if (!$reference || !$reference->constraint) continue;

                    $constraint = $reference->constraint;

                    // Get all source fields of this FK constraint
                    foreach ($constraint->constraintColumns as $sourceColumn) {
                        $sourceField = $sourceColumn->field;
                        if (!$sourceField) continue;

                        $updates = [];

                        // Update type if specified
                        if (isset($validated['new_type']) && $validated['new_type'] !== null) {
                            $updates['field_type'] = $validated['new_type'];
                        }

                        // Update unsigned if specified
                        if (isset($validated['new_unsigned']) && $validated['new_unsigned'] !== null) {
                            $updates['is_unsigned'] = $validated['new_unsigned'];
                        }

                        if (!empty($updates)) {
                            try {
                                $sourceField->update($updates);
                                $updatedFields[] = [
                                    'id' => $sourceField->id,
                                    'table_name' => $sourceField->table->table_name ?? 'Unknown',
                                    'field_name' => $sourceField->field_name,
                                    'old_type' => $sourceField->getOriginal('field_type'),
                                    'new_type' => $updates['field_type'] ?? $sourceField->field_type,
                                    'old_unsigned' => $sourceField->getOriginal('is_unsigned'),
                                    'new_unsigned' => $updates['is_unsigned'] ?? $sourceField->is_unsigned,
                                ];
                            } catch (\Exception $e) {
                                $errors[] = [
                                    'field_id' => $sourceField->id,
                                    'field_name' => $sourceField->field_name,
                                    'error' => $e->getMessage(),
                                ];
                            }
                        }
                    }
                }
            }

            // Update the original field itself
            $originalUpdates = [];
            if (isset($validated['new_type']) && $validated['new_type'] !== null) {
                $originalUpdates['field_type'] = $validated['new_type'];
            }
            if (isset($validated['new_unsigned']) && $validated['new_unsigned'] !== null) {
                $originalUpdates['is_unsigned'] = $validated['new_unsigned'];
            }

            if (!empty($originalUpdates)) {
                $field->update($originalUpdates);
            }

            return response()->json([
                'success' => true,
                'message' => 'Cascading changes applied successfully',
                'updated_field' => [
                    'id' => $field->id,
                    'name' => $field->field_name,
                    'type' => $field->field_type,
                    'is_unsigned' => $field->is_unsigned,
                ],
                'cascaded_fields' => $updatedFields,
                'cascaded_count' => count($updatedFields),
                'errors' => $errors,
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Apply Cascading Field Changes Error:', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to apply cascading changes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get linked projects for a schema
     */
    public function getLinkedProjects($id)
    {
        $user = Auth::user();
        $schema = FloatingSchema::findOrFail($id);

        // Check if user owns this schema or can access it
        if ($schema->owner_id != $user->id && !$schema->canBeAccessedBy($user)) {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized'
            ], 403);
        }

        // Get linked project IDs from project_schemas table
        $projectIds = \DB::table('project_schemas')
            ->where('schema_id', $schema->id)
            ->pluck('project_id')
            ->toArray();

        return response()->json([
            'success' => true,
            'project_ids' => $projectIds
        ]);
    }

    /**
     * Update linked projects for a schema
     */
    public function updateLinkedProjects(Request $request, $id)
    {
        $user = Auth::user();
        $schema = FloatingSchema::findOrFail($id);

        // Check if user can link this schema
        // System schemas and public schemas can be linked by anyone
        // Private schemas can only be linked by their owner
        $canLink = $schema->is_system_schema
                || $schema->visibility === 'public'
                || $schema->owner_id == $user->id;

        if (!$canLink) {
            \Log::warning('updateLinkedProjects UNAUTHORIZED', [
                'schema_id' => $id,
                'user_id' => $user->id,
                'is_system' => $schema->is_system_schema,
                'visibility' => $schema->visibility,
                'owner' => $schema->owner_id
            ]);
            return response()->json([
                'success' => false,
                'error' => 'Sie haben keine Berechtigung, dieses Schema zu verknüpfen'
            ], 403);
        }

        $validated = $request->validate([
            'project_ids' => 'array', // Allow empty array to remove all links
            'project_ids.*' => 'integer|exists:projects,id'
        ]);

        $newProjectIds = $validated['project_ids'] ?? [];

        // Get current user's accessible projects (own projects + direct members + team members)
        $userAccessibleProjectIds = Project::where(function($query) use ($user) {
            $query->where('owner_id', $user->id)
                ->orWhereHas('members', function($memberQuery) use ($user) {
                    $memberQuery->where('user_id', $user->id);
                })
                ->orWhereHas('teams.members', function($teamQuery) use ($user) {
                    $teamQuery->where('user_id', $user->id);
                });
        })->pluck('id')->toArray();

        // Filter to only user's projects
        $newProjectIds = array_intersect($newProjectIds, $userAccessibleProjectIds);

        // Get current linked projects (only user's projects)
        $currentProjectIds = \DB::table('project_schemas')
            ->where('schema_id', $schema->id)
            ->whereIn('project_id', $userAccessibleProjectIds)
            ->pluck('project_id')
            ->toArray();

        // Determine which to add and which to remove
        $toAdd = array_diff($newProjectIds, $currentProjectIds);
        $toRemove = array_diff($currentProjectIds, $newProjectIds);

        // Remove unlinked projects (only user's projects)
        if (!empty($toRemove)) {
            \DB::table('project_schemas')
                ->where('schema_id', $schema->id)
                ->whereIn('project_id', $toRemove)
                ->whereIn('project_id', $userAccessibleProjectIds) // Only remove user's projects
                ->delete();
        }

        // Add new linked projects
        foreach ($toAdd as $projectId) {
            $project = Project::find($projectId);

            // Check if user has access to this project
            if (!$project || !$project->userCanAccess($user)) {
                continue;
            }

            \DB::table('project_schemas')->updateOrInsert(
                [
                    'project_id' => $projectId,
                    'schema_id' => $schema->id
                ],
                [
                    'association_type' => 'linked',
                    'created_at' => now(),
                    'updated_at' => now()
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Schema-Verknüpfungen erfolgreich aktualisiert'
        ]);
    }
}