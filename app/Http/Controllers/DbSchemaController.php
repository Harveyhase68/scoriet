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

    /**
     * Copy a database schema with all its data
     */
    public function copySchema(Request $request, $id)
    {
        try {
            $user = Auth::user();
            $sourceSchema = FloatingSchema::with(['versions'])->findOrFail($id);

            // Check access permissions - user must own the schema to copy it
            if (!$sourceSchema->canBeEditedBy($user)) {
                return response()->json([
                    'success' => false,
                    'error' => 'You can only copy your own schemas',
                ], 403);
            }

            // Check if source schema has any versions/tables
            if (!$sourceSchema->last_version || $sourceSchema->last_version === 0) {
                return response()->json([
                    'success' => false,
                    'error' => 'Cannot copy an empty schema. The source schema must have at least one version with tables.',
                ], 422);
            }

            // Validate the copy name
            $validated = $request->validate([
                'name' => 'required|string|max:100',
            ]);

            // Check if user already has a schema with this name
            $existingSchema = FloatingSchema::where('owner_id', $user->id)
                ->where('name', $validated['name'])
                ->first();

            if ($existingSchema) {
                return response()->json([
                    'success' => false,
                    'error' => 'You already have a schema with this name. Please choose a different name.',
                ], 409);
            }

            // Create the new schema (copy)
            $newSchema = FloatingSchema::create([
                'name' => $validated['name'],
                'description' => ($sourceSchema->description ?? '') . ' (Copy)',
                'owner_id' => $user->id,
                'visibility' => $sourceSchema->visibility,
                'last_version' => 0, // Will be set to 1 after copying
            ]);

            // Ensure the schema ID is loaded
            $newSchema->refresh();

            // Get the latest version from source schema with all relationships
            $sourceVersion = $sourceSchema->latestVersion();

            if (!$sourceVersion) {
                // If no version found, clean up and return error
                $newSchema->delete();
                return response()->json([
                    'success' => false,
                    'error' => 'Source schema has no valid versions to copy',
                ], 422);
            }

            // Load all tables with their relationships
            $sourceVersion->load(['tables.fields', 'tables.constraints.constraintColumns', 'tables.constraints.foreignKeyReference.referenceColumns']);

            // Create Version 1 in the new schema by copying from source
            $newVersion = \App\Models\SchemaVersion::create([
                'schema_id' => $newSchema->id,
                'version_name' => 'v1',
                'version_number' => 1,
                'description' => 'Copied from ' . $sourceSchema->name,
                'imported_at' => now(),
            ]);

            // Ensure version ID is loaded
            $newVersion->refresh();

            // Update the new schema's last_version
            $newSchema->update(['last_version' => 1]);

            // Copy all tables from source version
            $tableMapping = [];
            foreach ($sourceVersion->tables as $sourceTable) {
                // Ensure both IDs are set
                if (!$newSchema->id) {
                    throw new \Exception('New schema ID is not set');
                }
                if (!$newVersion->id) {
                    throw new \Exception('New version ID is not set');
                }

                $newTable = \App\Models\SchemaTable::create([
                    'schema_id' => $newSchema->id,
                    'schema_version_id' => $newVersion->id,
                    'table_name' => $sourceTable->table_name,
                    'table_comment' => $sourceTable->table_comment,
                    'engine' => $sourceTable->engine,
                    'charset' => $sourceTable->charset,
                    'collation' => $sourceTable->collation,
                ]);

                $tableMapping[$sourceTable->id] = $newTable;

                // Copy all fields
                foreach ($sourceTable->fields as $sourceField) {
                    \App\Models\SchemaField::create([
                        'table_id' => $newTable->id,
                        'field_name' => $sourceField->field_name,
                        'field_type' => strtolower($sourceField->field_type),
                        'field_length' => $sourceField->field_length,
                        'field_precision' => $sourceField->field_precision,
                        'field_scale' => $sourceField->field_scale,
                        'is_nullable' => $sourceField->is_nullable ?? true,
                        'default_value' => $sourceField->default_value,
                        'is_primary_key' => $sourceField->is_primary_key ?? false,
                        'is_unique' => $sourceField->is_unique ?? false,
                        'is_auto_increment' => $sourceField->is_auto_increment ?? false,
                        'field_comment' => $sourceField->field_comment,
                        'field_order' => $sourceField->field_order ?? 0,
                    ]);
                }

                // Copy non-foreign-key constraints
                $nonFkConstraints = $sourceTable->constraints()->where('constraint_type', '!=', 'FOREIGN KEY')->get();
                foreach ($nonFkConstraints as $sourceConstraint) {
                    $newConstraint = \App\Models\SchemaConstraint::create([
                        'table_id' => $newTable->id,
                        'constraint_name' => $sourceConstraint->constraint_name,
                        'constraint_type' => $sourceConstraint->constraint_type,
                    ]);

                    // Copy constraint columns
                    foreach ($sourceConstraint->constraintColumns as $sourceColumn) {
                        $newField = $newTable->fields()->where('field_name', $sourceColumn->field_name)->first();
                        if ($newField) {
                            \App\Models\SchemaConstraintColumn::create([
                                'constraint_id' => $newConstraint->id,
                                'field_id' => $newField->id,
                                'column_order' => $sourceColumn->column_order,
                            ]);
                        }
                    }
                }
            }

            // Copy foreign key constraints (after all tables are created)
            foreach ($sourceVersion->tables as $sourceTable) {
                $newTable = $tableMapping[$sourceTable->id];
                $fkConstraints = $sourceTable->constraints()->where('constraint_type', 'FOREIGN KEY')->get();

                foreach ($fkConstraints as $sourceConstraint) {
                    $newConstraint = \App\Models\SchemaConstraint::create([
                        'table_id' => $newTable->id,
                        'constraint_name' => $sourceConstraint->constraint_name,
                        'constraint_type' => $sourceConstraint->constraint_type,
                        'column_names' => $sourceConstraint->column_names,
                    ]);

                    // Copy constraint columns
                    foreach ($sourceConstraint->constraintColumns as $sourceColumn) {
                        $newField = $newTable->fields()->where('field_name', $sourceColumn->field_name)->first();
                        if ($newField) {
                            \App\Models\SchemaConstraintColumn::create([
                                'constraint_id' => $newConstraint->id,
                                'field_id' => $newField->id,
                                'column_order' => $sourceColumn->column_order,
                            ]);
                        }
                    }

                    // Copy foreign key reference
                    if ($sourceConstraint->foreignKeyReference) {
                        $referencedTableName = $sourceConstraint->foreignKeyReference->referencedTable->table_name;
                        $referencedTable = $newVersion->tables()->where('table_name', $referencedTableName)->first();

                        if ($referencedTable) {
                            $newForeignKeyRef = \App\Models\SchemaForeignKeyReference::create([
                                'constraint_id' => $newConstraint->id,
                                'referenced_table_id' => $referencedTable->id,
                            ]);

                            // Copy reference columns
                            foreach ($sourceConstraint->foreignKeyReference->referenceColumns as $sourceRefColumn) {
                                $referencedField = $referencedTable->fields()->where('field_name', $sourceRefColumn->referencedField->field_name)->first();
                                if ($referencedField) {
                                    \App\Models\SchemaForeignKeyReferenceColumn::create([
                                        'reference_id' => $newForeignKeyRef->id,
                                        'referenced_field_id' => $referencedField->id,
                                    ]);
                                }
                            }
                        }
                    }
                }
            }

            // Copy schema_designer_layouts from the latest version of source schema
            // Set them to version 1 in the new schema
            $sourceLayouts = \App\Models\SchemaDesignerLayout::where('schema_id', $sourceSchema->id)
                ->where('version_number', $sourceSchema->last_version)
                ->get();

            foreach ($sourceLayouts as $sourceLayout) {
                \App\Models\SchemaDesignerLayout::create([
                    'schema_id' => $newSchema->id,
                    'version_number' => 1, // Reset to version 1 in the copy
                    'layout_data' => $sourceLayout->layout_data,
                ]);
            }

            return response()->json([
                'success' => true,
                'schema' => $newSchema->load('owner'),
                'message' => 'Database schema copied successfully',
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Failed to copy schema: ' . $e->getMessage(),
            ], 500);
        }
    }
}