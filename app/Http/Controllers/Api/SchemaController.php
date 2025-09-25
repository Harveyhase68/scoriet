<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FloatingSchema;
use App\Models\SchemaVersion;
use App\Models\SchemaDesignerLayout;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class SchemaController extends Controller
{
    /**
     * Display a listing of schemas visible to the user
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        // Get schemas owned by the user or public schemas they can access
        $schemas = FloatingSchema::with(['owner', 'projects'])
            ->where(function ($query) use ($user) {
                $query->where('owner_id', $user->id)
                      ->orWhere('visibility', 'public');
            })
            ->latest()
            ->get()
            ->map(function ($schema) use ($user) {
                // Get project associations with pivot data
                $projects = $schema->projects->map(function ($project) {
                    return [
                        'id' => $project->id,
                        'name' => $project->name,
                        'association_type' => $project->pivot->association_type,
                        'alias' => $project->pivot->alias,
                    ];
                });

                return array_merge($schema->toArray(), [
                    'is_owner' => $schema->owner_id === $user->id,
                    'tables_count' => 0, // TODO: Implement proper tables count
                    'projects_count' => $schema->projects()->count(),
                    'projects' => $projects,
                ]);
            });

        return response()->json([
            'schemas' => $schemas,
            'total_schemas' => $schemas->count(),
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
        ]);

        // Add owner_id to the validated data
        $validated['owner_id'] = $user->id;

        $schema = FloatingSchema::create($validated);

        // Load the schema with owner relationship
        $schema->load('owner');

        return response()->json(array_merge($schema->toArray(), [
            'is_owner' => true,
            'tables_count' => 0,
            'projects_count' => 0,
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
            'is_owner' => $schema->owner_id === $user->id,
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
        ]);

        $schema->update($validated);
        $schema->load('owner');

        return response()->json(array_merge($schema->toArray(), [
            'is_owner' => $schema->owner_id === $user->id,
            'tables_count' => 0, // TODO: Implement proper tables count
            'projects_count' => $schema->projects()->count(),
        ]));
    }

    /**
     * Remove the specified schema
     */
    public function destroy(FloatingSchema $schema): JsonResponse
    {
        $user = Auth::user();
        
        // Check if user can delete this schema
        if (!$schema->canBeEditedBy($user)) {
            return response()->json(['message' => 'Unauthorized to delete this schema'], 403);
        }

        // Check if schema is being used by projects
        $projectsCount = $schema->projects()->count();
        if ($projectsCount > 0) {
            return response()->json([
                'message' => "Cannot delete schema. It is currently being used by {$projectsCount} project(s).",
                'projects_count' => $projectsCount
            ], 422);
        }

        $schema->delete();

        return response()->json(['message' => 'Schema deleted successfully']);
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
            ->orderByDesc('version_number')
            ->get();

        return response()->json($versions);
    }

    /**
     * Get tables for a specific schema version
     */
    public function getVersionTables(SchemaVersion $version): JsonResponse
    {
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
            'constraints.constraintColumns',
            'constraints.foreignKeyReference.referencedTable',
            'constraints.foreignKeyReference.referenceColumns'
        ])->orderBy('id')->get();

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
            return response()->json(['message' => 'Failed to save layout'], 500);
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
            'comment' => 'nullable|string',
            'columns' => 'array',
            'columns.*.column_name' => 'required|string|max:255',
            'columns.*.data_type' => 'required|string|max:255',
            'columns.*.is_nullable' => 'boolean',
            'columns.*.is_auto_increment' => 'boolean',
            'columns.*.comment' => 'nullable|string',
        ]);

        try {
            // Create the table
            $table = \App\Models\SchemaTable::create([
                'schema_version_id' => $version->id,
                'table_name' => $request->table_name,
                'comment' => $request->comment,
            ]);

            // Create columns if provided
            if ($request->has('columns')) {
                foreach ($request->columns as $index => $columnData) {
                    \App\Models\SchemaField::create([
                        'table_id' => $table->id,
                        'field_name' => $columnData['column_name'],
                        'field_type' => $columnData['data_type'],
                        'is_nullable' => $columnData['is_nullable'] ?? true,
                        'is_auto_increment' => $columnData['is_auto_increment'] ?? false,
                        'comment' => $columnData['comment'] ?? null,
                        'field_order' => $index, // Logische Reihenfolge: 0, 1, 2, 3...
                    ]);
                }
            }

            $table->load('fields');

            return response()->json([
                'message' => 'Table created successfully',
                'table' => $table
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create table',
                'error' => $e->getMessage()
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
            'comment' => 'nullable|string',
            'columns' => 'array',
            'columns.*.column_name' => 'required|string|max:255',
            'columns.*.data_type' => 'required|string|max:255',
            'columns.*.is_nullable' => 'boolean',
            'columns.*.is_auto_increment' => 'boolean',
            'columns.*.comment' => 'nullable|string',
        ]);

        try {
            // Update the table
            $table->update([
                'table_name' => $request->table_name,
                'comment' => $request->comment,
            ]);

            // Delete existing fields and recreate them
            \App\Models\SchemaField::where('table_id', $table->id)->delete();

            // Create new columns if provided
            if ($request->has('columns')) {
                foreach ($request->columns as $index => $columnData) {
                    \App\Models\SchemaField::create([
                        'table_id' => $table->id,
                        'field_name' => $columnData['column_name'],
                        'field_type' => $columnData['data_type'],
                        'is_nullable' => $columnData['is_nullable'] ?? true,
                        'extra' => $columnData['is_auto_increment'] ? 'auto_increment' : null,
                        'comment' => $columnData['comment'] ?? null,
                        'field_order' => $index, // Logical order: 0, 1, 2, 3...
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
            // Delete the table and all its related data (fields, constraints, etc.)
            $table->delete();

            return response()->json(['success' => true, 'message' => 'Table deleted successfully']);
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
        
        // IMMEDIATE DEBUG: Log exact route model binding resolution
        \Log::info("🚨 ROUTE MODEL BINDING DEBUG: Method entry", [
            'timestamp' => now()->toISOString(),
            'user_id' => $user->id,
            'request_url' => $request->fullUrl(),
            'request_method' => $request->method(),
            'route_name' => $request->route()->getName(),
            'route_uri' => $request->route()->uri(),
            'raw_route_parameters' => $request->route()->parameters(),
            'version_param_from_route' => [
                'id' => $version->id,
                'version_number' => $version->version_number,
                'schema_id' => $version->schema_id
            ],
            'table_param_from_route' => [
                'id' => $table->id,
                'table_name' => $table->table_name,
                'schema_version_id' => $table->schema_version_id,
                'laravel_route_key' => $table->getRouteKey(),
                'laravel_route_key_name' => $table->getRouteKeyName()
            ],
            'request_segments' => $request->segments(),
            'uri_path' => $request->path()
        ]);
        
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
            \Log::info("🔍 API CALLED: deleteTableWithVersionCopy", [
                'user_id' => $user->id,
                'schema_id' => $schema->id,
                'schema_name' => $schema->name,
                'version_id' => $version->id,
                'version_number' => $version->version_number,
                'table_id_from_route' => $table->id,
                'table_name_from_route' => $table->table_name,
                'table_schema_version_id' => $table->schema_version_id,
                'request_url' => $request->fullUrl(),
                'route_params' => $request->route()->parameters(),
                'raw_route_table_id' => $request->route()->parameter('table'),
                'request_method' => $request->method(),
                'request_path' => $request->path()
            ]);
            
            // CRITICAL: Verify the table actually belongs to this version
            \Log::info("🔍 CRITICAL VERIFICATION: Checking table ownership", [
                'table_id' => $table->id,
                'table_name' => $table->table_name,
                'table_belongs_to_version_id' => $table->schema_version_id,
                'expected_version_id' => $version->id,
                'table_belongs_to_correct_version' => $table->schema_version_id === $version->id,
                'version_tables_count' => $version->tables()->count(),
                'all_table_ids_in_version' => $version->tables()->pluck('id')->toArray(),
                'all_table_names_in_version' => $version->tables()->pluck('table_name', 'id')->toArray()
            ]);
            
            // Double-check: Find the table by ID in this specific version
            $tableFoundInVersion = $version->tables()->where('id', $table->id)->first();
            \Log::info("🔍 DOUBLE CHECK: Table lookup by ID in version", [
                'searching_for_table_id' => $table->id,
                'found_in_version' => !!$tableFoundInVersion,
                'found_table_name' => $tableFoundInVersion ? $tableFoundInVersion->table_name : 'NOT FOUND',
                'found_table_id' => $tableFoundInVersion ? $tableFoundInVersion->id : 'NOT FOUND'
            ]);
            
            // Create new version with complete copy of current data
            $newVersion = SchemaVersion::createNewVersionWithCopy(
                $schema, 
                $version->version_number,
                $request->input('description', "Table deletion: {$table->table_name}")
            );
            
            \Log::info("✅ New version created", [
                'new_version_id' => $newVersion->id,
                'new_version_number' => $newVersion->version_number
            ]);
            
            // Find the table to delete in the NEW version
            \Log::info("🔍 BEFORE: Looking for table to delete in new version", [
                'searching_for_table_name' => $table->table_name,
                'original_table_id' => $table->id,
                'new_version_id' => $newVersion->id,
                'all_tables_in_new_version' => $newVersion->tables()->select('id', 'table_name')->get()->toArray()
            ]);
            
            $tableToDelete = $newVersion->tables()->where('table_name', $table->table_name)->first();
            
            \Log::info("🔍 AFTER: Table lookup result in new version", [
                'searching_for_table_name' => $table->table_name,
                'original_table_id' => $table->id,
                'new_version_id' => $newVersion->id,
                'found' => !!$tableToDelete,
                'found_table_id' => $tableToDelete ? $tableToDelete->id : 'NULL',
                'found_table_name' => $tableToDelete ? $tableToDelete->table_name : 'NULL',
                'total_tables_in_new_version' => $newVersion->tables()->count(),
                'sql_query' => $newVersion->tables()->where('table_name', $table->table_name)->toSql(),
                'sql_bindings' => $newVersion->tables()->where('table_name', $table->table_name)->getBindings()
            ]);
            
            if (!$tableToDelete) {
                \Log::error("❌ Table not found in new version", [
                    'table_name' => $table->table_name,
                    'new_version_tables' => $newVersion->tables()->pluck('table_name')->toArray()
                ]);
                throw new \Exception("Table '{$table->table_name}' not found in new version {$newVersion->version_number}");
            }
            
            // Delete the table from the NEW version only
            \Log::info("🗑️ ABOUT TO DELETE: Final confirmation before deletion", [
                'table_id_to_delete' => $tableToDelete->id,
                'table_name_to_delete' => $tableToDelete->table_name,
                'table_schema_version_id' => $tableToDelete->schema_version_id,
                'new_version_id' => $newVersion->id,
                'original_table_requested' => $table->table_name,
                'original_table_id_requested' => $table->id,
                'about_to_delete_correct_table' => $tableToDelete->table_name === $table->table_name,
                'laravel_model_class' => get_class($tableToDelete),
                'laravel_model_key' => $tableToDelete->getKey()
            ]);
            
            // Get all related data before deletion for logging
            $fieldsCount = $tableToDelete->fields()->count();
            $constraintsCount = $tableToDelete->constraints()->count();
            
            \Log::info("🗑️ Table relationships before deletion", [
                'table_id' => $tableToDelete->id,
                'table_name' => $tableToDelete->table_name,
                'fields_count' => $fieldsCount,
                'constraints_count' => $constraintsCount
            ]);
            
            $tableToDelete->delete();
            
            \Log::info("✅ Table deletion completed", [
                'deleted_table_id' => $tableToDelete->id,
                'deleted_table_name' => $tableToDelete->table_name,
                'remaining_tables_in_version' => $newVersion->tables()->count(),
                'remaining_table_names' => $newVersion->tables()->pluck('table_name')->toArray()
            ]);
            
            \Log::info("✅ Table deleted successfully from new version");

            return response()->json([
                'success' => true, 
                'message' => 'New version created and table deleted',
                'new_version' => $newVersion,
                'new_version_number' => $newVersion->version_number
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
                        'field_type' => $columnData['data_type'],
                        'is_nullable' => $columnData['is_nullable'] ?? true,
                        'is_auto_increment' => $columnData['is_auto_increment'] ?? false,
                        'comment' => $columnData['comment'] ?? null,
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
}