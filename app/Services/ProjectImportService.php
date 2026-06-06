<?php

namespace App\Services;

use App\Models\Project;
use App\Models\ProjectAttachment;
use App\Models\FloatingSchema;
use App\Models\SchemaVersion;
use App\Models\SchemaTable;
use App\Models\SchemaField;
use App\Models\SchemaConstraint;
use App\Models\SchemaConstraintColumn;
use App\Models\SchemaForeignKeyReference;
use App\Models\SchemaForeignKeyReferenceColumn;
use App\Models\Template;
use App\Models\TemplateFile;
use App\Models\CodeAdjustment;
use App\Models\CodeAdjustmentInsertion;
use App\Models\FormSet;
use App\Models\ReportPattern;
use App\Models\FormWindow;
use App\Models\FormElement;
use App\Models\ProjectFormSet;
use App\Models\ProjectTemplateUsage;
use App\Models\ProjectTemplateVariableValue;
use App\Models\SchemaDesignerLayout;
use App\Models\SchemaTranslation;
use App\Models\ProjectTranslation;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use ZipArchive;

class ProjectImportService
{
    protected array $manifest = [];
    protected string $tempDir;
    protected User $user;
    protected array $options = [];

    // Mapping of old IDs/names to new IDs for reference resolution
    protected array $schemaMapping = [];
    protected array $templateMapping = [];
    protected array $formSetMapping = [];

    /**
     * Tables that referenced a FormSet/ReportPattern by NAME during import
     * but couldn't be linked yet because the FormSet/ReportPattern hadn't
     * been imported at that point. Resolved in a second pass after
     * importFormSets() runs (see resolveTableFormReferences()).
     *
     * Shape: [['table_id' => 42, 'form_set_name' => 'X', 'report_pattern_name' => 'Y'], ...]
     */
    protected array $pendingTableFormReferences = [];

    /**
     * Analyze a ZIP file and return conflict information
     */
    public function analyze(string $zipPath, User $user): array
    {
        $this->user = $user;
        $this->tempDir = storage_path('app/temp/project-import-' . Str::uuid());

        try {
            // Extract ZIP
            $this->extractZip($zipPath);

            // Read manifest
            $this->readManifest();

            // Analyze conflicts
            return $this->analyzeConflicts();
        } finally {
            // Don't cleanup yet - we need the files for import
            // Store temp dir path for later use
        }
    }

    /**
     * Execute the import with user-provided options
     */
    public function execute(string $zipPath, User $user, array $options): array
    {
        $this->user = $user;
        $this->options = $options;
        $this->tempDir = storage_path('app/temp/project-import-' . Str::uuid());

        try {
            // Extract ZIP
            $this->extractZip($zipPath);

            // Read manifest
            $this->readManifest();

            // Execute import in transaction
            return DB::transaction(function () {
                $result = [
                    'success' => true,
                    'project' => null,
                    'imported' => [
                        'schemas' => 0,
                        'templates' => 0,
                        'form_sets' => 0,
                        'code_adjustments' => 0,
                        'attachments' => 0,
                        'translations' => 0,
                    ],
                    'errors' => [],
                    'warnings' => [],
                ];

                // 1. Import Schemas first (needed for template dependencies)
                $this->importSchemas($result);

                // 2. Import Templates (with schema mapping)
                $this->importTemplates($result);

                // 3. Import FormSets
                $this->importFormSets($result);

                // 3b. Now that FormSets exist (and any ReportPatterns the
                // user has in their account are reachable by name), wire up
                // the table → form_set / report_pattern links that we
                // captured during schema import.
                $this->resolveTableFormReferences($result);

                // 4. Create/Update Project
                $project = $this->importProject($result);
                $result['project'] = $project;

                // 5. Link schemas, templates, formsets to project
                $this->linkEntitiesToProject($project, $result);

                // 6. Import Code Adjustments
                $this->importCodeAdjustments($project, $result);

                // 7. Import Template Variable Values
                $this->importTemplateVariableValues($project, $result);

                // 8. Import Schema Translations
                $this->importTranslations($result);

                // 8b. Import Project Translations (per-language captions, descriptions, locale)
                $this->importProjectTranslations($project, $result);

                // 9. Import Attachments
                $this->importAttachments($project, $result);

                return $result;
            });
        } finally {
            $this->cleanupTempDir();
        }
    }

    /**
     * Extract ZIP file to temp directory
     */
    protected function extractZip(string $zipPath): void
    {
        if (!file_exists($this->tempDir)) {
            mkdir($this->tempDir, 0755, true);
        }

        $zip = new ZipArchive();
        if ($zip->open($zipPath) !== true) {
            throw new \RuntimeException('Could not open ZIP file');
        }

        $zip->extractTo($this->tempDir);
        $zip->close();
    }

    /**
     * Read and parse manifest.json
     */
    protected function readManifest(): void
    {
        $manifestPath = $this->tempDir . '/manifest.json';
        if (!file_exists($manifestPath)) {
            throw new \RuntimeException('manifest.json not found in archive');
        }

        $content = file_get_contents($manifestPath);
        $this->manifest = json_decode($content, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \RuntimeException('Invalid manifest.json: ' . json_last_error_msg());
        }
    }

    /**
     * Analyze potential conflicts
     */
    protected function analyzeConflicts(): array
    {
        $analysis = [
            'export_info' => $this->manifest['export_info'] ?? [],
            'project' => $this->analyzeProjectConflict(),
            'schemas' => $this->analyzeSchemaConflicts(),
            'templates' => $this->analyzeTemplateConflicts(),
            'form_sets' => $this->analyzeFormSetConflicts(),
            'counts' => [
                'code_adjustments' => count($this->manifest['code_adjustments'] ?? []),
                'attachments' => count($this->manifest['attachments'] ?? []),
                'translations' => count($this->manifest['schema_translations'] ?? []),
                'project_translations' => count($this->manifest['project_translations'] ?? []),
                'template_variable_values' => count($this->manifest['template_variable_values'] ?? []),
            ],
            'temp_dir' => $this->tempDir,
        ];

        return $analysis;
    }

    /**
     * Analyze project name conflict
     */
    protected function analyzeProjectConflict(): array
    {
        $projectData = $this->manifest['project'] ?? [];
        $name = $projectData['name'] ?? 'imported_project';

        $existing = Project::where('owner_id', $this->user->id)
            ->where('name', $name)
            ->first();

        $suggestedName = $name;
        if ($existing) {
            $suggestedName = $this->generateUniqueName($name, 'project');
        }

        return [
            'name' => $name,
            'description' => $projectData['description'] ?? '',
            'exists' => $existing !== null,
            'existing_id' => $existing?->id,
            'suggested_name' => $suggestedName,
        ];
    }

    /**
     * Analyze schema conflicts
     */
    protected function analyzeSchemaConflicts(): array
    {
        $schemas = $this->manifest['schemas'] ?? [];
        $conflicts = [];

        foreach ($schemas as $schema) {
            $name = $schema['name'] ?? '';
            $existing = FloatingSchema::where('owner_id', $this->user->id)
                ->where('name', $name)
                ->first();

            $suggestedName = $name;
            if ($existing) {
                $suggestedName = $this->generateUniqueName($name, 'schema');
            }

            $conflicts[] = [
                'name' => $name,
                'description' => $schema['description'] ?? '',
                'database_type' => $schema['database_type'] ?? 'mysql',
                'versions_count' => count($schema['versions'] ?? []),
                'exists' => $existing !== null,
                'existing_id' => $existing?->id,
                'suggested_name' => $suggestedName,
            ];
        }

        return $conflicts;
    }

    /**
     * Analyze template conflicts
     */
    protected function analyzeTemplateConflicts(): array
    {
        $templates = $this->manifest['templates'] ?? [];
        $conflicts = [];

        foreach ($templates as $templateUsage) {
            $template = $templateUsage['template'] ?? [];
            $name = $template['name'] ?? '';

            $existing = Template::where('creator_user_id', $this->user->id)
                ->where('name', $name)
                ->first();

            $suggestedName = $name;
            if ($existing) {
                $suggestedName = $this->generateUniqueName($name, 'template');
            }

            $conflicts[] = [
                'name' => $name,
                'full_name' => $template['full_name'] ?? '',
                'description' => $template['description'] ?? '',
                'category' => $template['category'] ?? '',
                'files_count' => count($template['files'] ?? []),
                'exists' => $existing !== null,
                'existing_id' => $existing?->id,
                'suggested_name' => $suggestedName,
                'usage_type' => $templateUsage['usage_type'] ?? 'linked',
            ];
        }

        return $conflicts;
    }

    /**
     * Analyze formset conflicts
     */
    protected function analyzeFormSetConflicts(): array
    {
        $formSets = $this->manifest['form_sets'] ?? [];
        $conflicts = [];

        foreach ($formSets as $formSet) {
            $name = $formSet['name'] ?? '';

            // Check if a FormSet with this name exists that the user has access to
            // Either public, or linked to one of the user's projects via ProjectFormSet
            $existing = FormSet::where('name', $name)
                ->where(function ($q) {
                    // Public form sets
                    $q->where('visibility', 'public')
                    // Or private form sets linked to user's projects
                    ->orWhereIn('id', function ($subQ) {
                        $subQ->select('form_set_id')
                            ->from('project_form_set')
                            ->whereIn('project_id', function ($projectQ) {
                                $projectQ->select('id')
                                    ->from('projects')
                                    ->where('owner_id', $this->user->id);
                            });
                    });
                })
                ->first();

            $suggestedName = $name;
            if ($existing) {
                $suggestedName = $this->generateUniqueName($name, 'formset');
            }

            $conflicts[] = [
                'name' => $name,
                'description' => $formSet['description'] ?? '',
                'windows_count' => count($formSet['windows'] ?? []),
                'exists' => $existing !== null,
                'existing_id' => $existing?->id,
                'suggested_name' => $suggestedName,
            ];
        }

        return $conflicts;
    }

    /**
     * Generate a unique name by appending/incrementing number suffix
     */
    protected function generateUniqueName(string $baseName, string $type): string
    {
        // Check if name ends with _<number>
        if (preg_match('/^(.+)_(\d+)$/', $baseName, $matches)) {
            $prefix = $matches[1];
            $number = (int) $matches[2];
        } else {
            $prefix = $baseName;
            $number = 0;
        }

        // Find unique name
        $newName = $baseName;
        $attempts = 0;
        $maxAttempts = 100;

        while ($attempts < $maxAttempts) {
            $number++;
            $newName = $prefix . '_' . $number;

            $exists = match ($type) {
                'project' => Project::where('owner_id', $this->user->id)->where('name', $newName)->exists(),
                'schema' => FloatingSchema::where('owner_id', $this->user->id)->where('name', $newName)->exists(),
                'template' => Template::where('creator_user_id', $this->user->id)->where('name', $newName)->exists(),
                'formset' => FormSet::where('name', $newName)->exists(),
                default => false,
            };

            if (!$exists) {
                return $newName;
            }

            $attempts++;
        }

        // Fallback: append UUID
        return $baseName . '_' . Str::random(6);
    }

    /**
     * Import schemas
     */
    protected function importSchemas(array &$result): void
    {
        $schemas = $this->manifest['schemas'] ?? [];
        $schemaOptions = $this->options['schemas'] ?? [];

        foreach ($schemas as $index => $schemaData) {
            $option = $schemaOptions[$index] ?? ['action' => 'create'];
            $originalName = $schemaData['name'] ?? '';

            try {
                if ($option['action'] === 'skip') {
                    continue;
                }

                if ($option['action'] === 'use_existing') {
                    // Use existing schema
                    $this->schemaMapping[$originalName] = $option['existing_id'];
                    continue;
                }

                // Create new schema
                $newName = $option['name'] ?? $originalName;

                $schema = FloatingSchema::create([
                    'name' => $newName,
                    'description' => $schemaData['description'] ?? '',
                    'database_type' => $schemaData['database_type'] ?? 'mysql',
                    'owner_id' => $this->user->id,
                    // Visibility is forced to 'private' on imported schemas
                    // regardless of the source value — sharing a freshly
                    // pulled-in schema with other users is an explicit act,
                    // never a side-effect of an import.
                    'visibility' => 'private',
                    'last_version' => $schemaData['last_version'] ?? 1,
                    // Schema-level defaults — restore the source values so
                    // a re-export produces byte-identical SQL.
                    'default_charset' => $schemaData['default_charset'] ?? null,
                    'default_collation' => $schemaData['default_collation'] ?? null,
                    // is_system_schema is only honoured when the importing
                    // user can actually own one — non-system users keep the
                    // default (false). System flag carries through for
                    // platform/admin restores.
                    'is_system_schema' => ($this->user->user_type ?? null) === 'system'
                        ? (bool) ($schemaData['is_system_schema'] ?? false)
                        : false,
                ]);

                $this->schemaMapping[$originalName] = $schema->id;

                // Import versions
                foreach ($schemaData['versions'] ?? [] as $versionData) {
                    $this->importSchemaVersion($schema, $versionData);
                }

                $result['imported']['schemas']++;

            } catch (\Exception $e) {
                $result['errors'][] = "Schema '{$originalName}': " . $e->getMessage();
            }
        }
    }

    /**
     * Import a schema version with tables, fields, constraints
     */
    protected function importSchemaVersion(FloatingSchema $schema, array $versionData): void
    {
        $version = SchemaVersion::create([
            'schema_id' => $schema->id,
            'version_number' => $versionData['version_number'] ?? 1,
            'version_name' => $versionData['version_name'] ?? 'v' . ($versionData['version_number'] ?? 1),
            'description' => $versionData['description'] ?? '',
            'imported_at' => now(),
        ]);

        // Audit handling for project import mirrors the SQL round-trip:
        //   - JSON contains audit/version → preserve created_* verbatim,
        //     refresh updated_* to (now, importing user) so we know who
        //     pulled the snapshot in.
        //   - JSON omits them (legacy backups from before this feature) →
        //     stamp everything fresh.
        // Observer suppression is mandatory because both Create paths below
        // would otherwise overwrite our explicit values via the trait's
        // applyAuditOnCreate hook.
        $now = Carbon::now();
        $currentUser = SchemaTable::currentUsername();

        // Import tables
        foreach ($versionData['tables'] ?? [] as $tableData) {
            $tableAudit = $this->buildAuditAttributes($tableData, $now, $currentUser);

            // forceFill + save (not create) because created_at/updated_at
            // aren't in $fillable; mass-assignment would silently drop them
            // and Eloquent's auto-timestamp logic would re-stamp NOW(),
            // losing the imported history.
            $tableAttrs = array_merge([
                'schema_version_id' => $version->id,
                'schema_id' => $schema->id,
                'table_name' => $tableData['table_name'] ?? '',
                'singular_name' => $tableData['singular_name'] ?? null,
                'primarykeyfield' => $tableData['primarykeyfield'] ?? null,
                'filekeyname' => $tableData['filekeyname'] ?? null,
                'file_name_renamed' => $tableData['file_name_renamed'] ?? '',
                'file_name_short' => $tableData['file_name_short'] ?? '',
                'comment' => $tableData['table_comment'] ?? null,
                'display_state' => $tableData['display_state'] ?? 'enabled',
                'generation_mode' => $tableData['generation_mode'] ?? 'full',
                // form_set_id / report_pattern_id stay null at this stage —
                // FormSets and ReportPatterns are imported AFTER schemas, so
                // their ids don't exist yet. We capture the names below and
                // resolve them in resolveTableFormReferences() (step 4b).
            ], $tableAudit);
            $table = SchemaTable::withAuditSuppressed(function () use ($tableAttrs) {
                $t = new SchemaTable();
                $t->forceFill($tableAttrs);
                $t->save();
                return $t;
            });

            // Stash the name references for the post-FormSet-import pass.
            $formSetName = $tableData['form_set_name'] ?? null;
            $reportPatternName = $tableData['report_pattern_name'] ?? null;
            if ($formSetName !== null || $reportPatternName !== null) {
                $this->pendingTableFormReferences[] = [
                    'table_id' => $table->id,
                    'form_set_name' => $formSetName,
                    'report_pattern_name' => $reportPatternName,
                ];
            }

            // Import fields
            foreach ($tableData['fields'] ?? [] as $fieldData) {
                $fieldAudit = $this->buildAuditAttributes($fieldData, $now, $currentUser);

                // Same forceFill rationale as the table block above.
                $fieldAttrs = array_merge([
                    'table_id' => $table->id,
                    'field_name' => $fieldData['field_name'] ?? '',
                    'field_type' => $fieldData['field_type'] ?? 'VARCHAR',
                    'is_unsigned' => $fieldData['is_unsigned'] ?? false,
                    'is_nullable' => $fieldData['is_nullable'] ?? true,
                    'default_value' => $fieldData['default_value'] ?? null,
                    'is_auto_increment' => $fieldData['is_auto_increment'] ?? false,
                    'is_primary_key' => $fieldData['is_primary_key'] ?? false,
                    'is_index' => $fieldData['is_index'] ?? false,
                    'is_unique' => $fieldData['is_unique'] ?? false,
                    'comment' => $fieldData['field_comment'] ?? $fieldData['comment'] ?? '',
                    'field_order' => $fieldData['field_order'] ?? 0,
                    'control_type' => $fieldData['control_type'] ?? 'TEXT',
                    'link_table' => $fieldData['link_table'] ?? null,
                    'link_field' => $fieldData['link_field'] ?? null,
                    'link_display_field' => $fieldData['link_display_field'] ?? null,
                    'link_order_field' => $fieldData['link_order_field'] ?? null,
                    'link_order_direction' => $fieldData['link_order_direction'] ?? 'ASC',
                    'editmask' => $fieldData['editmask'] ?? null,
                    'display_state' => $fieldData['display_state'] ?? 'enabled',
                    'generation_mode' => $fieldData['generation_mode'] ?? 'full',
                ], $fieldAudit);
                SchemaField::withAuditSuppressed(function () use ($fieldAttrs) {
                    $f = new SchemaField();
                    $f->forceFill($fieldAttrs);
                    $f->save();
                });
            }

            // Import constraints - need to find field_id by field_name
            foreach ($tableData['constraints'] ?? [] as $constraintData) {
                $constraintType = $constraintData['constraint_type'] ?? $constraintData['type'] ?? 'INDEX';

                $constraint = SchemaConstraint::create([
                    'table_id' => $table->id,
                    'constraint_name' => $constraintData['constraint_name'] ?? $constraintData['name'] ?? '',
                    'constraint_type' => $constraintType,
                ]);

                // Import constraint columns - need to find the field_id by field_name
                foreach ($constraintData['columns'] ?? $constraintData['constraint_columns'] ?? [] as $colData) {
                    $fieldName = $colData['field_name'] ?? $colData['column_name'] ?? '';
                    $field = $table->fields()->where('field_name', $fieldName)->first();

                    if ($field) {
                        SchemaConstraintColumn::create([
                            'constraint_id' => $constraint->id,
                            'field_id' => $field->id,
                            'column_order' => $colData['column_order'] ?? $colData['position'] ?? 0,
                        ]);
                    }
                }

                // Import foreign key reference if exists
                $foreignKeyRef = $constraintData['foreign_key_reference'] ?? $constraintData['foreignKeyReference'] ?? null;
                if ($constraintType === 'FOREIGN KEY' && !empty($foreignKeyRef)) {
                    $fkRef = $foreignKeyRef;
                    // Note: For foreign keys we store the referenced_table_id
                    // We'll need to resolve this after all tables are created
                    // For now, store without referenced_table_id - would need a second pass
                    $foreignKey = SchemaForeignKeyReference::create([
                        'constraint_id' => $constraint->id,
                        'referenced_table_id' => null, // Will need to be resolved later if needed
                    ]);
                }
            }

        }

        // Import designer layouts - collect all table layouts and save as JSON
        $layoutData = [];
        foreach ($versionData['tables'] ?? [] as $tableData) {
            if (!empty($tableData['designer_layout'])) {
                $tableName = $tableData['table_name'] ?? '';
                $layoutData[$tableName] = [
                    'x_position' => $tableData['designer_layout']['x_position'] ?? 0,
                    'y_position' => $tableData['designer_layout']['y_position'] ?? 0,
                    'width' => $tableData['designer_layout']['width'] ?? 200,
                    'height' => $tableData['designer_layout']['height'] ?? null,
                ];
            }
        }

        if (!empty($layoutData)) {
            SchemaDesignerLayout::updateOrCreate(
                [
                    'schema_id' => $schema->id,
                    'version_number' => $version->version_number,
                ],
                [
                    'layout_data' => $layoutData,
                ]
            );
        }
    }

    /**
     * Import templates
     */
    protected function importTemplates(array &$result): void
    {
        $templates = $this->manifest['templates'] ?? [];
        $templateOptions = $this->options['templates'] ?? [];

        foreach ($templates as $index => $templateUsage) {
            $templateData = $templateUsage['template'] ?? [];
            $option = $templateOptions[$index] ?? ['action' => 'create'];
            $originalName = $templateData['name'] ?? '';

            try {
                if ($option['action'] === 'skip') {
                    continue;
                }

                if ($option['action'] === 'use_existing') {
                    $this->templateMapping[$originalName] = [
                        'id' => $option['existing_id'],
                        'usage_type' => $templateUsage['usage_type'] ?? 'linked',
                        'alias' => $templateUsage['alias'] ?? null,
                        'config' => $templateUsage['config'] ?? null,
                    ];
                    continue;
                }

                // Create new template
                $newName = $option['name'] ?? $originalName;

                $template = Template::create([
                    'name'        => $newName,
                    'full_name'   => Template::buildFullName($this->user->username ?? $this->user->name, $newName),
                    'description' => $templateData['description'] ?? '',
                    'creator_user_id' => $this->user->id,
                    'visibility' => 'private',
                    'is_system_template' => false,
                    'category' => $templateData['category'] ?? null,
                    'language' => $templateData['language'] ?? null,
                    'tags' => $templateData['tags'] ?? [],
                    'is_active' => true,
                    'protected_files' => $templateData['protected_files'] ?? [],
                    'install_script' => $templateData['install_script'] ?? null,
                    'update_script' => $templateData['update_script'] ?? null,
                    'file_count' => count($templateData['files'] ?? []),
                ]);

                $this->templateMapping[$originalName] = [
                    'id' => $template->id,
                    'usage_type' => $templateUsage['usage_type'] ?? 'cloned',
                    'alias' => $templateUsage['alias'] ?? null,
                    'config' => $templateUsage['config'] ?? null,
                ];

                // Import template files
                foreach ($templateData['files'] ?? [] as $fileData) {
                    // Extract file_name from file_path if not provided
                    $filePath = $fileData['file_path'] ?? '';
                    $fileName = $fileData['file_name'] ?? basename($filePath);

                    TemplateFile::create([
                        'template_id' => $template->id,
                        'file_name' => $fileName,
                        'file_path' => $filePath,
                        'output_path' => $fileData['output_path'] ?? $filePath,
                        'file_content' => $fileData['file_content'] ?? '',
                        'file_type' => $fileData['file_type'] ?? 'text',
                        'content_type' => $fileData['content_type'] ?? 'text/plain',
                        'zip_filename' => $fileData['zip_filename'] ?? null,
                        'file_order' => $fileData['file_order'] ?? $fileData['sort_order'] ?? 0,
                    ]);
                }

                // Link schema dependencies
                foreach ($templateData['schema_dependencies'] ?? [] as $dep) {
                    $schemaName = $dep['schema_name'] ?? '';
                    if (isset($this->schemaMapping[$schemaName])) {
                        $template->dbSchemasDependencies()->attach($this->schemaMapping[$schemaName], [
                            'is_required' => $dep['is_required'] ?? true,
                            'alias' => $dep['alias'] ?? null,
                        ]);
                    }
                }

                $result['imported']['templates']++;

            } catch (\Exception $e) {
                $result['errors'][] = "Template '{$originalName}': " . $e->getMessage();
            }
        }
    }

    /**
     * Import form sets
     */
    protected function importFormSets(array &$result): void
    {
        $formSets = $this->manifest['form_sets'] ?? [];
        $formSetOptions = $this->options['form_sets'] ?? [];

        foreach ($formSets as $index => $formSetData) {
            $option = $formSetOptions[$index] ?? ['action' => 'create'];
            $originalName = $formSetData['name'] ?? '';

            try {
                if ($option['action'] === 'skip') {
                    continue;
                }

                if ($option['action'] === 'use_existing') {
                    $this->formSetMapping[$originalName] = $option['existing_id'];
                    continue;
                }

                // Create new form set
                $newName = $option['name'] ?? $originalName;

                $formSet = FormSet::create([
                    'name' => $newName,
                    'description' => $formSetData['description'] ?? '',
                    'creator_user_id' => $this->user->id,
                    'visibility' => $formSetData['visibility'] ?? 'private',
                    'default_background_color' => $formSetData['default_background_color'] ?? null,
                    'default_window_color' => $formSetData['default_window_color'] ?? null,
                    'default_text_color' => $formSetData['default_text_color'] ?? null,
                    'default_button_color' => $formSetData['default_button_color'] ?? null,
                    'default_button_text_color' => $formSetData['default_button_text_color'] ?? null,
                ]);

                $this->formSetMapping[$originalName] = $formSet->id;

                // Delete auto-created default windows (created by FormSet boot observer)
                // We will import the actual windows from the export data
                $formSet->windows()->delete();

                // Import windows
                foreach ($formSetData['windows'] ?? [] as $windowData) {
                    $window = FormWindow::create([
                        'form_set_id' => $formSet->id,
                        'name' => $windowData['name'] ?? '',
                        'display_name' => $windowData['display_name'] ?? '',
                        'window_type' => $windowData['window_type'] ?? 'standard',
                        'min_width' => $windowData['min_width'] ?? null,
                        'min_height' => $windowData['min_height'] ?? null,
                        'default_width' => $windowData['default_width'] ?? null,
                        'default_height' => $windowData['default_height'] ?? null,
                        'background_color' => $windowData['background_color'] ?? null,
                        'window_color' => $windowData['window_color'] ?? null,
                        'text_color' => $windowData['text_color'] ?? null,
                        'sort_order' => $windowData['sort_order'] ?? 0,
                    ]);

                    // Import elements
                    foreach ($windowData['elements'] ?? [] as $elementData) {
                        FormElement::create([
                            'form_window_id' => $window->id,
                            'element_type' => $elementData['element_type'] ?? 'container',
                            'x_position' => $elementData['x_position'] ?? 0,
                            'y_position' => $elementData['y_position'] ?? 0,
                            'width' => $elementData['width'] ?? 100,
                            'height' => $elementData['height'] ?? 100,
                            'container_orientation' => $elementData['container_orientation'] ?? null,
                            'max_fields' => $elementData['max_fields'] ?? null,
                            'container_gap' => $elementData['container_gap'] ?? null,
                            'container_columns' => $elementData['container_columns'] ?? null,
                            'button_label' => $elementData['button_label'] ?? null,
                            'button_icon' => $elementData['button_icon'] ?? null,
                            'button_action' => $elementData['button_action'] ?? null,
                            'button_background_color' => $elementData['button_background_color'] ?? null,
                            'button_text_color' => $elementData['button_text_color'] ?? null,
                            'tab_label' => $elementData['tab_label'] ?? null,
                            'custom_style' => $elementData['custom_style'] ?? null,
                            'sort_order' => $elementData['sort_order'] ?? 0,
                            'is_visible' => $elementData['is_visible'] ?? true,
                        ]);
                    }
                }

                $result['imported']['form_sets']++;

            } catch (\Exception $e) {
                $result['errors'][] = "FormSet '{$originalName}': " . $e->getMessage();
            }
        }
    }

    /**
     * Import/create project
     */
    protected function importProject(array &$result): Project
    {
        $projectData = $this->manifest['project'] ?? [];
        $projectOption = $this->options['project'] ?? ['action' => 'create'];

        if ($projectOption['action'] === 'merge' && !empty($projectOption['existing_id'])) {
            // Merge into existing project
            $project = Project::findOrFail($projectOption['existing_id']);

            // Update project settings from import (optional fields only)
            // Don't overwrite name, owner, etc.
            $project->update([
                'description' => $projectData['description'] ?? $project->description,
                'settings' => array_merge($project->settings ?? [], $projectData['settings'] ?? []),
            ]);

            $result['warnings'][] = 'Merged into existing project: ' . $project->name;

            return $project;
        }

        // Create new project
        $newName = $projectOption['name'] ?? $projectData['name'] ?? 'imported_project';

        $project = Project::create([
            'name' => $newName,
            'description' => $projectData['description'] ?? '',
            'owner_id' => $this->user->id,
            'is_active' => true,
            'is_public' => $projectData['is_public'] ?? false,
            'allow_join_requests' => $projectData['allow_join_requests'] ?? false,
            'settings' => $projectData['settings'] ?? [],
            'database_name' => $projectData['database_name'] ?? null,
            'database_type' => $projectData['database_type'] ?? 'mysql',
            'diagram_max_tables_per_row' => $projectData['diagram_max_tables_per_row'] ?? 5,
            'diagram_table_width' => $projectData['diagram_table_width'] ?? 200,
            'diagram_table_height' => $projectData['diagram_table_height'] ?? null,
            'diagram_horizontal_spacing' => $projectData['diagram_horizontal_spacing'] ?? 50,
            'diagram_vertical_spacing' => $projectData['diagram_vertical_spacing'] ?? 50,
            'form_designer_snap_to_grid' => $projectData['form_designer_snap_to_grid'] ?? true,
            'form_designer_grid_size' => $projectData['form_designer_grid_size'] ?? 10,
            'project_directory' => $projectData['project_directory'] ?? '',
            'project_url' => $projectData['project_url'] ?? '',
            'start_page' => $projectData['start_page'] ?? '',
            'default_language' => $projectData['default_language'] ?? 'de',
            'archive_format' => $projectData['archive_format'] ?? 'zip',
            'filename_short_length' => $projectData['filename_short_length'] ?? 8,
            'decimal_separator' => $projectData['decimal_separator'] ?? ',',
            'thousands_separator' => $projectData['thousands_separator'] ?? '.',
            'date_format' => $projectData['date_format'] ?? 'd.m.Y',
            'time_format' => $projectData['time_format'] ?? 'H:i',
            'currency_symbol' => $projectData['currency_symbol'] ?? '€',
            'timezone' => $projectData['timezone'] ?? 'Europe/Vienna',
            'enabled_languages' => $projectData['enabled_languages'] ?? ['de', 'en'],
            'protected_files' => $projectData['protected_files'] ?? [],
            'install_script' => $projectData['install_script'] ?? null,
            'update_script' => $projectData['update_script'] ?? null,
            'git_repository' => $projectData['git_repository'] ?? null,
            'git_default_branch' => $projectData['git_default_branch'] ?? 'main',
            'git_main_branch' => $projectData['git_main_branch'] ?? 'main',
            'git_target_directory' => $projectData['git_target_directory'] ?? '',
            'git_workflow' => $projectData['git_workflow'] ?? 'push_only',
            'git_pr_title_template' => $projectData['git_pr_title_template'] ?? null,
            'git_pr_description_template' => $projectData['git_pr_description_template'] ?? null,
            'git_auto_delete_branch' => $projectData['git_auto_delete_branch'] ?? true,
        ]);

        return $project;
    }

    /**
     * Link schemas, templates, formsets to the project
     */
    protected function linkEntitiesToProject(Project $project, array &$result): void
    {
        // Link schemas
        foreach ($this->schemaMapping as $originalName => $schemaId) {
            // Find the original schema data to get association_type and alias
            $schemaData = collect($this->manifest['schemas'] ?? [])->firstWhere('name', $originalName);

            $project->floatingSchemas()->syncWithoutDetaching([
                $schemaId => [
                    'association_type' => $schemaData['association_type'] ?? 'cloned',
                    'alias' => $schemaData['alias'] ?? null,
                ]
            ]);
        }

        // Link templates
        foreach ($this->templateMapping as $originalName => $templateInfo) {
            ProjectTemplateUsage::updateOrCreate(
                [
                    'project_id' => $project->id,
                    'template_id' => $templateInfo['id'],
                ],
                [
                    'usage_type' => $templateInfo['usage_type'],
                    'alias' => $templateInfo['alias'],
                    'config' => $templateInfo['config'],
                    'is_active' => true,
                    'used_at' => now(),
                ]
            );
        }

        // Link form sets
        foreach ($this->formSetMapping as $originalName => $formSetId) {
            ProjectFormSet::updateOrCreate(
                [
                    'project_id' => $project->id,
                    'form_set_id' => $formSetId,
                ],
                [
                    'is_active' => true,
                ]
            );
        }
    }

    /**
     * Import code adjustments
     */
    protected function importCodeAdjustments(Project $project, array &$result): void
    {
        if (empty($this->options['import_code_adjustments'])) {
            return;
        }

        $adjustments = $this->manifest['code_adjustments'] ?? [];

        foreach ($adjustments as $adjustmentData) {
            try {
                // Check if adjustment with same name exists
                $existing = CodeAdjustment::where('project_id', $project->id)
                    ->where('name', $adjustmentData['name'] ?? '')
                    ->first();

                if ($existing) {
                    // Update existing
                    $existing->update([
                        'description' => $adjustmentData['description'] ?? '',
                        'file_pattern' => $adjustmentData['file_pattern'] ?? '',
                        'min_confidence' => $adjustmentData['min_confidence'] ?? 0.0,
                        'execution_order' => $adjustmentData['execution_order'] ?? 0,
                        'is_active' => $adjustmentData['is_active'] ?? true,
                    ]);

                    // Delete old insertions and recreate
                    $existing->insertions()->delete();
                    $adjustment = $existing;
                } else {
                    // Create new
                    $adjustment = CodeAdjustment::create([
                        'project_id' => $project->id,
                        'name' => $adjustmentData['name'] ?? '',
                        'description' => $adjustmentData['description'] ?? '',
                        'file_pattern' => $adjustmentData['file_pattern'] ?? '',
                        'min_confidence' => $adjustmentData['min_confidence'] ?? 0.0,
                        'execution_order' => $adjustmentData['execution_order'] ?? 0,
                        'is_active' => $adjustmentData['is_active'] ?? true,
                        'created_by_user_id' => $this->user->id,
                    ]);
                }

                // Import insertions
                foreach ($adjustmentData['insertions'] ?? [] as $insertionData) {
                    CodeAdjustmentInsertion::create([
                        'code_adjustment_id' => $adjustment->id,
                        'insertion_type' => $insertionData['insertion_type'] ?? 'after',
                        'anchor_text' => $insertionData['anchor_text'] ?? '',
                        'insertion_content' => $insertionData['insertion_content'] ?? '',
                        'line_offset' => $insertionData['line_offset'] ?? 0,
                        'order_index' => $insertionData['order_index'] ?? 0,
                    ]);
                }

                $result['imported']['code_adjustments']++;

            } catch (\Exception $e) {
                $result['errors'][] = "Code Adjustment '{$adjustmentData['name']}': " . $e->getMessage();
            }
        }
    }

    /**
     * Import template variable values
     */
    protected function importTemplateVariableValues(Project $project, array &$result): void
    {
        $variableValues = $this->manifest['template_variable_values'] ?? [];

        foreach ($variableValues as $valueData) {
            try {
                $templateName = $valueData['template_name'] ?? '';

                // Find template ID from mapping
                if (!isset($this->templateMapping[$templateName])) {
                    continue;
                }

                $templateId = $this->templateMapping[$templateName]['id'];

                ProjectTemplateVariableValue::updateOrCreate(
                    [
                        'project_id' => $project->id,
                        'template_id' => $templateId,
                        'variable_name' => $valueData['variable_name'] ?? '',
                        'language' => $valueData['language'] ?? 'de',
                    ],
                    [
                        'value' => $valueData['value'] ?? '',
                    ]
                );

            } catch (\Exception $e) {
                $result['warnings'][] = "Template variable: " . $e->getMessage();
            }
        }
    }

    /**
     * Import schema translations
     */
    protected function importTranslations(array &$result): void
    {
        if (empty($this->options['import_translations'])) {
            return;
        }

        $translations = $this->manifest['schema_translations'] ?? [];

        foreach ($translations as $translationData) {
            try {
                SchemaTranslation::updateOrCreate(
                    [
                        'item_name' => $translationData['item_name'] ?? '',
                        'code' => $translationData['language_code'] ?? '',
                    ],
                    [
                        'translated_text' => $translationData['translated_text'] ?? '',
                        'description' => $translationData['description'] ?? null,
                        'is_active' => true,
                        'created_by' => $this->user->id,
                    ]
                );

                $result['imported']['translations']++;

            } catch (\Exception $e) {
                // Silently ignore translation errors
            }
        }
    }

    /**
     * Import project translations (per-language captions, descriptions, locale settings)
     */
    protected function importProjectTranslations(Project $project, array &$result): void
    {
        $translations = $this->manifest['project_translations'] ?? [];

        if (empty($translations)) {
            return;
        }

        foreach ($translations as $translationData) {
            try {
                ProjectTranslation::updateOrCreate(
                    [
                        'project_id' => $project->id,
                        'language_code' => $translationData['language_code'],
                    ],
                    [
                        'caption' => $translationData['caption'] ?? null,
                        'description' => $translationData['description'] ?? null,
                        'decimal_separator' => $translationData['decimal_separator'] ?? null,
                        'thousands_separator' => $translationData['thousands_separator'] ?? null,
                        'date_format' => $translationData['date_format'] ?? null,
                        'time_format' => $translationData['time_format'] ?? null,
                        'currency_symbol' => $translationData['currency_symbol'] ?? null,
                        'timezone' => $translationData['timezone'] ?? null,
                    ]
                );

                $result['imported']['project_translations'] = ($result['imported']['project_translations'] ?? 0) + 1;

            } catch (\Exception $e) {
                $result['warnings'][] = "Failed to import project translation for language '{$translationData['language_code']}': {$e->getMessage()}";
            }
        }
    }

    /**
     * Import attachments
     */
    protected function importAttachments(Project $project, array &$result): void
    {
        if (empty($this->options['import_attachments'])) {
            return;
        }

        $attachments = $this->manifest['attachments'] ?? [];

        foreach ($attachments as $attachmentData) {
            try {
                // Skip if file was missing in export
                if ($attachmentData['file_missing'] ?? true) {
                    $result['warnings'][] = "Attachment '{$attachmentData['original_filename']}' skipped (file was missing in export)";
                    continue;
                }

                $exportFilename = $attachmentData['export_filename'] ?? '';
                $sourcePath = $this->tempDir . '/' . $exportFilename;

                if (!file_exists($sourcePath)) {
                    $result['warnings'][] = "Attachment file not found: {$exportFilename}";
                    continue;
                }

                // Generate new filename
                $extension = pathinfo($attachmentData['original_filename'], PATHINFO_EXTENSION);
                $newFilename = Str::uuid() . '.' . $extension;
                $storagePath = "project-attachments/{$project->id}";
                $fullStoragePath = $storagePath . '/' . $newFilename;

                // Copy file to storage
                $disk = Storage::disk('local');
                $disk->makeDirectory($storagePath);
                $disk->put($fullStoragePath, file_get_contents($sourcePath));

                // Create attachment record
                ProjectAttachment::create([
                    'project_id' => $project->id,
                    'uploaded_by' => $this->user->id,
                    'filename' => $newFilename,
                    'original_filename' => $attachmentData['original_filename'] ?? '',
                    'mime_type' => $attachmentData['mime_type'] ?? 'application/octet-stream',
                    'size' => $attachmentData['size'] ?? 0,
                    'path' => $fullStoragePath,
                    'description' => $attachmentData['description'] ?? '',
                    'category' => $attachmentData['category'] ?? 'other',
                    'is_pinned' => $attachmentData['is_pinned'] ?? false,
                    'download_count' => 0,
                ]);

                $result['imported']['attachments']++;

            } catch (\Exception $e) {
                $result['errors'][] = "Attachment '{$attachmentData['original_filename']}': " . $e->getMessage();
            }
        }
    }

    /**
     * Cleanup temporary directory
     */
    protected function cleanupTempDir(): void
    {
        if (!empty($this->tempDir) && file_exists($this->tempDir)) {
            $this->deleteDirectory($this->tempDir);
        }
    }

    /**
     * Recursively delete directory
     */
    protected function deleteDirectory(string $dir): void
    {
        if (!file_exists($dir)) {
            return;
        }

        $files = scandir($dir);
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') {
                continue;
            }

            $path = $dir . '/' . $file;
            if (is_dir($path)) {
                $this->deleteDirectory($path);
            } else {
                unlink($path);
            }
        }

        rmdir($dir);
    }

    /**
     * Second-pass resolver: link freshly-imported tables to FormSet and
     * ReportPattern rows that became reachable after step 3 finished.
     *
     * Names rather than ids cross the import boundary, because the source
     * ids are meaningless in the destination DB. We look the names up in
     * the importing user's accessible set:
     *   - FormSet: prefer one owned by the importing user; fall back to any
     *     name match (handles the case where the FormSet came in via the
     *     same ZIP and is now owned by the user).
     *   - ReportPattern: the project export doesn't currently ship report
     *     patterns, so we look for an existing one accessible to the user.
     *     If nothing matches we log a warning and leave the column NULL —
     *     the table still loads, just without its default form layout.
     */
    protected function resolveTableFormReferences(array &$result): void
    {
        if (empty($this->pendingTableFormReferences)) {
            return;
        }

        foreach ($this->pendingTableFormReferences as $pending) {
            $table = SchemaTable::find($pending['table_id']);
            if (!$table) {
                continue;
            }

            $updates = [];

            if ($pending['form_set_name']) {
                $formSetId = $this->lookupFormSetIdByName($pending['form_set_name']);
                if ($formSetId) {
                    $updates['form_set_id'] = $formSetId;
                } else {
                    $result['warnings'][] = "Table '{$table->table_name}': FormSet '{$pending['form_set_name']}' not found in your account — link skipped.";
                }
            }

            if ($pending['report_pattern_name']) {
                $reportPatternId = $this->lookupReportPatternIdByName($pending['report_pattern_name']);
                if ($reportPatternId) {
                    $updates['report_pattern_id'] = $reportPatternId;
                } else {
                    $result['warnings'][] = "Table '{$table->table_name}': ReportPattern '{$pending['report_pattern_name']}' not found in your account — link skipped.";
                }
            }

            if (!empty($updates)) {
                // Suppress the version bump — this is restoring an existing
                // relationship, not a user edit.
                SchemaTable::withAuditSuppressed(function () use ($table, $updates) {
                    $table->forceFill($updates)->saveQuietly();
                });
            }
        }
    }

    /**
     * Look up a FormSet id by name, preferring one owned by the importing
     * user. Returns null if nothing matches.
     */
    private function lookupFormSetIdByName(string $name): ?int
    {
        $own = FormSet::where('name', $name)
            ->where('creator_user_id', $this->user->id)
            ->value('id');
        if ($own) {
            return (int) $own;
        }
        // Fall back to any visible FormSet with that name. The user already
        // has read access via the FormSet listing scope rules; we only need
        // it for the FK to be valid.
        return FormSet::where('name', $name)->value('id') ?: null;
    }

    private function lookupReportPatternIdByName(string $name): ?int
    {
        $own = ReportPattern::where('name', $name)
            ->where('creator_user_id', $this->user->id)
            ->value('id');
        if ($own) {
            return (int) $own;
        }
        return ReportPattern::where('name', $name)->value('id') ?: null;
    }

    /**
     * Build the audit-and-version slice for a table/field create call.
     *
     * Rule (mirrors the SQL round-trip in SchemaStorageService):
     *   - If the JSON snapshot carries `version` + `created_by_username` it
     *     came from a backup that already tracked audit history → preserve
     *     `created_*` verbatim, refresh `updated_*` to "(now, importing
     *     user)" so the trail records who pulled the snapshot in.
     *   - Otherwise (legacy backup from before this feature, or a missing
     *     field) stamp everything fresh.
     *
     * Username/timestamp are NEVER NULL — the migration enforces it via
     * column DEFAULT, and we mirror that defence here so a malformed JSON
     * can't crash the insert.
     */
    private function buildAuditAttributes(array $data, Carbon $now, string $currentUser): array
    {
        $hasSnapshot = isset($data['version']) && isset($data['created_by_username']);

        if ($hasSnapshot) {
            return [
                'version' => (int) $data['version'],
                'created_by_username' => $data['created_by_username'] ?: 'system',
                'created_at' => isset($data['created_at']) ? Carbon::parse($data['created_at']) : $now,
                'updated_by_username' => $currentUser,
                'updated_at' => $now,
            ];
        }

        return [
            'version' => 1,
            'created_by_username' => $currentUser,
            'created_at' => $now,
            'updated_by_username' => $currentUser,
            'updated_at' => $now,
        ];
    }
}
