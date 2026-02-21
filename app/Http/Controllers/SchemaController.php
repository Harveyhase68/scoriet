<?php

namespace App\Http\Controllers;

use App\Models\Schema;
use App\Models\Template;
use App\Models\TemplateSchemaDepedency;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;

class SchemaController extends Controller
{
    /**
     * Get all schemas with optional filtering
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            $query = Schema::with(['owner', 'templateDependencies.template']);

            // Apply accessibility filter - user can see public schemas and their own private schemas
            if (!$request->has('show_all') || !$user->isAdmin()) {
                $query->accessible($user->id);
            }

            // Apply visibility filter
            if ($request->has('visibility') && in_array($request->visibility, ['public', 'private'])) {
                $query->where('visibility', $request->visibility);
            }

            // Apply search filter
            if ($request->has('search') && !empty($request->search)) {
                $query->search($request->search);
            }

            // Apply owner filter
            if ($request->has('owner_id')) {
                $query->where('owner_id', $request->owner_id);
            }

            $schemas = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'schemas' => $schemas,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a specific schema with details
     */
    public function show($id)
    {
        try {
            $user = Auth::user();
            $schema = Schema::with(['owner', 'tables', 'templateDependencies.template'])
                ->findOrFail($id);

            // Check access permissions
            if (!$schema->canBeAccessedBy($user->id)) {
                return response()->json([
                    'success' => false,
                    'error' => __('schemacontrollerphp71'),
                ], 403);
            }

            return response()->json([
                'success' => true,
                'schema' => $schema,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => __('schemacontrollerphp82'),
            ], 404);
        }
    }

    /**
     * Create a new schema
     */
    public function store(Request $request)
    {
        try {
            $user = Auth::user();

            $validated = $request->validate([
                'name' => 'required|string|max:100',
                'description' => 'nullable|string',
                'visibility' => ['required', Rule::in(['private', 'public'])],
            ]);

            // Check database limit for free users
            if ($user->user_type === 'free') {
                $schemaCount = Schema::where('owner_id', $user->id)->count();

                if ($schemaCount >= 1) {
                    return response()->json([
                        'success' => false,
                        'error' => __('schemacontrollerphp108'),
                        'error_code' => 'SCHEMA_LIMIT_REACHED',
                        'limit' => 1,
                        'current' => $schemaCount,
                        'upgrade_cost_credits' => 25
                    ], 403);
                }
            }

            // Check if user can create private schemas
            if ($validated['visibility'] === 'private' && !$user->canCreatePrivateSchemas()) {
                return response()->json([
                    'success' => false,
                    'error' => __('schemacontrollerphp121'),
                ], 403);
            }

            // Check for duplicate schema name for this user
            $existingSchema = Schema::where('owner_id', $user->id)
                ->where('name', $validated['name'])
                ->first();

            if ($existingSchema) {
                return response()->json([
                    'success' => false,
                    'error' => __('schemacontrollerphp133'),
                ], 409);
            }

            $schema = Schema::create([
                'name' => $validated['name'],
                'description' => $validated['description'],
                'owner_id' => $user->id,
                'visibility' => $validated['visibility'],
                'last_version' => 0,
            ]);

            return response()->json([
                'success' => true,
                'schema' => $schema->load('owner'),
                'message' => __('schemacontrollerphp148'),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Update a schema
     */
    public function update(Request $request, $id)
    {
        try {
            $user = Auth::user();
            $schema = Schema::findOrFail($id);

            // Check ownership
            if (!$schema->isOwnedBy($user->id)) {
                return response()->json([
                    'success' => false,
                    'error' => __('schemacontrollerphp171'),
                ], 403);
            }

            $validated = $request->validate([
                'name' => 'sometimes|required|string|max:100',
                'description' => 'nullable|string',
                'visibility' => ['sometimes', 'required', Rule::in(['private', 'public'])],
            ]);

            // Check if user can set private visibility
            if (isset($validated['visibility']) && $validated['visibility'] === 'private' && !$user->canCreatePrivateSchemas()) {
                return response()->json([
                    'success' => false,
                    'error' => __('schemacontrollerphp185'),
                ], 403);
            }

            // Check for duplicate name if name is being changed
            if (isset($validated['name']) && $validated['name'] !== $schema->name) {
                $existingSchema = Schema::where('owner_id', $user->id)
                    ->where('name', $validated['name'])
                    ->where('id', '!=', $schema->id)
                    ->first();

                if ($existingSchema) {
                    return response()->json([
                        'success' => false,
                        'error' => __('schemacontrollerphp199'),
                    ], 409);
                }
            }

            $schema->update($validated);

            return response()->json([
                'success' => true,
                'schema' => $schema->load('owner'),
                'message' => __('schemacontrollerphp209'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Delete a schema
     */
    public function destroy($id)
    {
        try {
            $user = Auth::user();
            $schema = Schema::findOrFail($id);

            // Check ownership
            if (!$schema->isOwnedBy($user->id)) {
                return response()->json([
                    'success' => false,
                    'error' => __('schemacontrollerphp232'),
                ], 403);
            }

            // Check if schema is being used by templates
            $dependentTemplates = TemplateSchemaDepedency::where('schema_id', $schema->id)->count();
            if ($dependentTemplates > 0) {
                return response()->json([
                    'success' => false,
                    'error' => __('schemacontrollerphp241')."{$dependentTemplates}".__('schemacontrollerphp241_2'),
                ], 409);
            }

            $schema->delete();

            return response()->json([
                'success' => true,
                'message' => __('schemacontrollerphp249'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get templates that depend on this schema
     */
    public function getDependentTemplates($id)
    {
        try {
            $user = Auth::user();
            $schema = Schema::findOrFail($id);

            // Check access permissions
            if (!$schema->canBeAccessedBy($user->id)) {
                return response()->json([
                    'success' => false,
                    'error' => __('schemacontrollerphp272'),
                ], 403);
            }

            $dependencies = TemplateSchemaDepedency::with('template.creator')
                ->where('schema_id', $schema->id)
                ->get();

            return response()->json([
                'success' => true,
                'dependencies' => $dependencies,
                'schema' => $schema,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => __('schemacontrollerphp288'),
            ], 404);
        }
    }

    /**
     * Link a template to a schema
     */
    public function linkTemplate(Request $request, $id)
    {
        try {
            $user = Auth::user();
            $schema = Schema::findOrFail($id);

            // Check if user can access this schema
            if (!$schema->canBeAccessedBy($user->id)) {
                return response()->json([
                    'success' => false,
                    'error' => __('schemacontrollerphp306'),
                ], 403);
            }

            $validated = $request->validate([
                'template_id' => 'required|exists:templates,id',
                'is_required' => 'boolean',
                'alias' => 'nullable|string|max:255',
            ]);

            $template = Template::findOrFail($validated['template_id']);

            // Check if user can edit this template
            if (!$template->canBeEditedBy($user)) {
                return response()->json([
                    'success' => false,
                    'error' => __('schemacontrollerphp322'),
                ], 403);
            }

            // Check if dependency already exists
            $existingDependency = TemplateSchemaDepedency::where('template_id', $template->id)
                ->where('schema_id', $schema->id)
                ->first();

            if ($existingDependency) {
                return response()->json([
                    'success' => false,
                    'error' => __('schemacontrollerphp334'),
                ], 409);
            }

            $dependency = TemplateSchemaDepedency::create([
                'template_id' => $template->id,
                'schema_id' => $schema->id,
                'is_required' => $validated['is_required'] ?? true,
                'alias' => $validated['alias'],
            ]);

            return response()->json([
                'success' => true,
                'dependency' => $dependency->load(['template', 'schema']),
                'message' => __('schemacontrollerphp348'),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Unlink a template from a schema
     */
    public function unlinkTemplate($id, $templateId)
    {
        try {
            $user = Auth::user();
            $schema = Schema::findOrFail($id);
            $template = Template::findOrFail($templateId);

            // Check if user can edit this template
            if (!$template->canBeEditedBy($user)) {
                return response()->json([
                    'success' => false,
                    'error' => __('schemacontrollerphp372'),
                ], 403);
            }

            $dependency = TemplateSchemaDepedency::where('template_id', $template->id)
                ->where('schema_id', $schema->id)
                ->firstOrFail();

            $dependency->delete();

            return response()->json([
                'success' => true,
                'message' => __('schemacontrollerphp384'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => __('schemacontrollerphp389'),
            ], 404);
        }
    }

    /**
     * Delete a foreign key constraint
     */
    public function deleteForeignKey(Request $request, $constraintId)
    {
        try {
            $constraint = SchemaConstraint::findOrFail($constraintId);
            $table = SchemaTable::findOrFail($constraint->table_id);
            $version = SchemaVersion::findOrFail($table->version_id);
            $schema = Schema::findOrFail($version->schema_id);

            // Check if user owns the schema
            if ($schema->owner_id !== auth()->id()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Unauthorized',
                ], 403);
            }

            // Check if this is the latest version
            $isLatestVersion = $version->version_number === $schema->last_version;

            DB::beginTransaction();
            try {
                if (!$isLatestVersion) {
                    // Create new version
                    $newVersion = $this->schemaVersionService->createVersionFromExisting(
                        $version,
                        __('schemacontrollerphp422')."{$constraint->constraint_name}"
                    );

                    // Find the constraint in the new version
                    $newTable = SchemaTable::where('version_id', $newVersion->id)
                        ->where('table_name', $table->table_name)
                        ->firstOrFail();
                    $newConstraint = SchemaConstraint::where('table_id', $newTable->id)
                        ->where('constraint_name', $constraint->constraint_name)
                        ->firstOrFail();

                    // Delete the constraint in the new version
                    $newConstraint->delete();

                    DB::commit();
                    return response()->json([
                        'success' => true,
                        'new_version' => $newVersion,
                    ]);
                } else {
                    // Delete in current version
                    $constraint->delete();

                    DB::commit();
                    return response()->json([
                        'success' => true,
                    ]);
                }
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a foreign key constraint
     */
    public function updateForeignKey(Request $request, $constraintId)
    {
        $request->validate([
            'constraint_name' => 'required|string|max:255',
            'on_delete' => 'sometimes|string|in:CASCADE,RESTRICT,SET NULL,NO ACTION,SET DEFAULT',
            'on_update' => 'sometimes|string|in:CASCADE,RESTRICT,SET NULL,NO ACTION,SET DEFAULT',
        ]);

        try {
            $constraint = SchemaConstraint::with('foreignKeyReference')->findOrFail($constraintId);
            $table = SchemaTable::findOrFail($constraint->table_id);
            $version = SchemaVersion::findOrFail($table->version_id);
            $schema = Schema::findOrFail($version->schema_id);

            // Check if user owns the schema
            if ($schema->owner_id !== auth()->id()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Unauthorized',
                ], 403);
            }

            // Check if this is the latest version
            $isLatestVersion = $version->version_number === $schema->last_version;

            DB::beginTransaction();
            try {
                if (!$isLatestVersion) {
                    // Create new version
                    $newVersion = $this->schemaVersionService->createVersionFromExisting(
                        $version,
                        "Updated FK constraint: {$constraint->constraint_name} → {$request->constraint_name}"
                    );

                    // Find the constraint in the new version
                    $newTable = SchemaTable::where('version_id', $newVersion->id)
                        ->where('table_name', $table->table_name)
                        ->firstOrFail();
                    $newConstraint = SchemaConstraint::with('foreignKeyReference')->where('table_id', $newTable->id)
                        ->where('constraint_name', $constraint->constraint_name)
                        ->firstOrFail();

                    // Update the constraint in the new version
                    $newConstraint->update([
                        'constraint_name' => $request->constraint_name,
                    ]);

                    // Update FK reference actions if provided
                    if ($newConstraint->foreignKeyReference) {
                        $updateData = [];
                        if ($request->has('on_delete')) {
                            $updateData['on_delete'] = $request->on_delete;
                        }
                        if ($request->has('on_update')) {
                            $updateData['on_update'] = $request->on_update;
                        }
                        if (!empty($updateData)) {
                            $newConstraint->foreignKeyReference->update($updateData);
                        }
                    }

                    DB::commit();
                    return response()->json([
                        'success' => true,
                        'new_version' => $newVersion,
                    ]);
                } else {
                    // Update in current version
                    $constraint->update([
                        'constraint_name' => $request->constraint_name,
                    ]);

                    // Update FK reference actions if provided
                    if ($constraint->foreignKeyReference) {
                        $updateData = [];
                        if ($request->has('on_delete')) {
                            $updateData['on_delete'] = $request->on_delete;
                        }
                        if ($request->has('on_update')) {
                            $updateData['on_update'] = $request->on_update;
                        }
                        if (!empty($updateData)) {
                            $constraint->foreignKeyReference->update($updateData);
                        }
                    }

                    DB::commit();
                    return response()->json([
                        'success' => true,
                    ]);
                }
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get public global schemas (Scoriet marketplace)
     */
    public function getGlobalSchemas()
    {
        try {
            $schemas = Schema::with(['owner', 'templateDependencies.template'])
                ->public()
                ->whereHas('owner', function($query) {
                    $query->where('user_type', 'system');
                })
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'schemas' => $schemas,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}