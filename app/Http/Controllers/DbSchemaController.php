<?php

namespace App\Http\Controllers;

use App\Models\FloatingSchema;
use App\Models\Template;
use App\Models\TemplateDbSchemaDependency;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DbSchemaController extends Controller
{
    /**
     * Get all available DB schemas for templates
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            $query = FloatingSchema::with(['owner']);

            // Apply search filter
            if ($request->has('search') && !empty($request->search)) {
                $query->where(function($q) use ($request) {
                    $q->where('name', 'like', "%{$request->search}%")
                      ->orWhere('description', 'like', "%{$request->search}%");
                });
            }

            // Apply owner filter - user can see their own schemas and public ones
            if (!$request->has('show_all')) {
                $query->where(function($q) use ($user) {
                    $q->where('owner_id', $user->id)
                      ->orWhere('visibility', 'public');
                });
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
     * Get a specific DB schema with details
     */
    public function show($id)
    {
        try {
            $user = Auth::user();
            $schema = FloatingSchema::with(['owner', 'latestVersion', 'versions'])
                ->findOrFail($id);

            // Check access permissions - user can access their own schemas and public ones
            if ($schema->owner_id !== $user->id && $schema->visibility !== 'public') {
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
     * Get templates that depend on this DB schema
     */
    public function getDependentTemplates($id)
    {
        try {
            $user = Auth::user();
            $schema = FloatingSchema::findOrFail($id);

            // Check access permissions
            if ($schema->owner_id !== $user->id && $schema->visibility !== 'public') {
                return response()->json([
                    'success' => false,
                    'error' => 'Access denied to this schema',
                ], 403);
            }

            $dependencies = TemplateDbSchemaDependency::with('template.creator')
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
     * Link a template to a DB schema
     */
    public function linkTemplate(Request $request, $id)
    {
        try {
            $user = Auth::user();
            $schema = FloatingSchema::findOrFail($id);

            // Check if user can access this schema
            if ($schema->owner_id !== $user->id && $schema->visibility !== 'public') {
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
            $existingDependency = TemplateDbSchemaDependency::where('template_id', $template->id)
                ->where('schema_id', $schema->id)
                ->first();

            if ($existingDependency) {
                return response()->json([
                    'success' => false,
                    'error' => 'Template is already linked to this DB schema',
                ], 409);
            }

            $dependency = TemplateDbSchemaDependency::create([
                'template_id' => $template->id,
                'schema_id' => $schema->id,
                'is_required' => $validated['is_required'] ?? true,
                'alias' => $validated['alias'],
            ]);

            return response()->json([
                'success' => true,
                'dependency' => $dependency->load(['template', 'dbSchema']),
                'message' => 'Template linked to DB schema successfully',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Unlink a template from a DB schema
     */
    public function unlinkTemplate($id, $templateId)
    {
        try {
            $user = Auth::user();
            $schema = FloatingSchema::findOrFail($id);
            $template = Template::findOrFail($templateId);

            // Check if user can edit this template
            if (!$template->canBeEditedBy($user)) {
                return response()->json([
                    'success' => false,
                    'error' => 'You cannot edit this template',
                ], 403);
            }

            $dependency = TemplateDbSchemaDependency::where('template_id', $template->id)
                ->where('schema_id', $schema->id)
                ->firstOrFail();

            $dependency->delete();

            return response()->json([
                'success' => true,
                'message' => 'Template unlinked from DB schema successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Dependency not found',
            ], 404);
        }
    }

    /**
     * Get public global DB schemas (available to everyone)
     */
    public function getGlobalSchemas()
    {
        try {
            $schemas = FloatingSchema::with(['owner', 'latestVersion'])
                ->where('visibility', 'public')
                ->whereHas('owner', function($query) {
                    $query->where('user_type', 'system');
                })
                ->orderBy('schema_name')
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