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
                    'error' => 'Access denied to this schema',
                ], 403);
            }

            return response()->json([
                'success' => true,
                'schema' => $schema,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Schema not found',
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

            // Check if user can create private schemas
            if ($validated['visibility'] === 'private' && !$user->canCreatePrivateSchemas()) {
                return response()->json([
                    'success' => false,
                    'error' => 'You need a premium account to create private schemas',
                ], 403);
            }

            // Check for duplicate schema name for this user
            $existingSchema = Schema::where('owner_id', $user->id)
                ->where('name', $validated['name'])
                ->first();

            if ($existingSchema) {
                return response()->json([
                    'success' => false,
                    'error' => 'You already have a schema with this name',
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
                'message' => 'Schema created successfully',
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
                    'error' => 'You can only edit your own schemas',
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
                    'error' => 'You need a premium account to make schemas private',
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
                        'error' => 'You already have a schema with this name',
                    ], 409);
                }
            }

            $schema->update($validated);

            return response()->json([
                'success' => true,
                'schema' => $schema->load('owner'),
                'message' => 'Schema updated successfully',
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
                    'error' => 'You can only delete your own schemas',
                ], 403);
            }

            // Check if schema is being used by templates
            $dependentTemplates = TemplateSchemaDepedency::where('schema_id', $schema->id)->count();
            if ($dependentTemplates > 0) {
                return response()->json([
                    'success' => false,
                    'error' => "Cannot delete schema. It is being used by {$dependentTemplates} template(s)",
                ], 409);
            }

            $schema->delete();

            return response()->json([
                'success' => true,
                'message' => 'Schema deleted successfully',
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
                    'error' => 'Access denied to this schema',
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
                'error' => 'Schema not found',
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
                    'error' => 'Access denied to this schema',
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
                    'error' => 'You cannot edit this template',
                ], 403);
            }

            // Check if dependency already exists
            $existingDependency = TemplateSchemaDepedency::where('template_id', $template->id)
                ->where('schema_id', $schema->id)
                ->first();

            if ($existingDependency) {
                return response()->json([
                    'success' => false,
                    'error' => 'Template is already linked to this schema',
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
                'message' => 'Template linked to schema successfully',
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
                    'error' => 'You cannot edit this template',
                ], 403);
            }

            $dependency = TemplateSchemaDepedency::where('template_id', $template->id)
                ->where('schema_id', $schema->id)
                ->firstOrFail();

            $dependency->delete();

            return response()->json([
                'success' => true,
                'message' => 'Template unlinked from schema successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Dependency not found',
            ], 404);
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