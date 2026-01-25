<?php

namespace App\Services;

use App\Models\Project;
use App\Models\ProjectAttachment;
use App\Models\FloatingSchema;
use App\Models\SchemaVersion;
use App\Models\Template;
use App\Models\CodeAdjustment;
use App\Models\FormSet;
use App\Models\ProjectFormSet;
use App\Models\SchemaDesignerLayout;
use App\Models\SchemaTranslation;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use ZipArchive;

class ProjectExportService
{
    protected Project $project;
    protected string $exportPath;
    protected string $tempDir;
    protected array $exportData = [];

    /**
     * Export a project to an archive file
     *
     * @param Project $project The project to export
     * @param string $format Archive format: 'zip', 'tar.gz', or 'tar.xz'
     * @return string Path to the generated archive file
     */
    public function export(Project $project, string $format = 'zip'): string
    {
        $this->project = $project;
        $this->tempDir = storage_path('app/temp/project-export-' . Str::uuid());

        // Create temp directory
        if (!file_exists($this->tempDir)) {
            mkdir($this->tempDir, 0755, true);
        }

        try {
            // Collect all export data
            $this->collectProjectData();
            $this->collectAttachments();
            $this->collectSchemas();
            $this->collectSchemaTranslations();
            $this->collectTemplates();
            $this->collectCodeAdjustments();
            $this->collectForms();
            // Note: generation_tree is NOT exported - it's regenerated on import

            // Write manifest JSON
            $this->writeManifest();

            // Create archive
            $archivePath = $this->createArchive($format);

            return $archivePath;
        } finally {
            // Cleanup temp directory
            $this->cleanupTempDir();
        }
    }

    /**
     * Collect main project data
     */
    protected function collectProjectData(): void
    {
        $this->exportData['project'] = [
            'name' => $this->project->name,
            'description' => $this->project->description,
            'is_public' => $this->project->is_public,
            'allow_join_requests' => $this->project->allow_join_requests,
            'settings' => $this->project->settings,
            // Database settings (without credentials)
            'database_name' => $this->project->database_name,
            'database_type' => $this->project->database_type,
            // Diagram settings
            'diagram_max_tables_per_row' => $this->project->diagram_max_tables_per_row,
            'diagram_table_width' => $this->project->diagram_table_width,
            'diagram_table_height' => $this->project->diagram_table_height,
            'diagram_horizontal_spacing' => $this->project->diagram_horizontal_spacing,
            'diagram_vertical_spacing' => $this->project->diagram_vertical_spacing,
            // Form designer settings
            'form_designer_snap_to_grid' => $this->project->form_designer_snap_to_grid,
            'form_designer_grid_size' => $this->project->form_designer_grid_size,
            // Project settings
            'project_directory' => $this->project->project_directory,
            'project_url' => $this->project->project_url,
            'start_page' => $this->project->start_page,
            'default_language' => $this->project->default_language,
            'archive_format' => $this->project->archive_format,
            'filename_short_length' => $this->project->filename_short_length,
            'decimal_separator' => $this->project->decimal_separator,
            'thousands_separator' => $this->project->thousands_separator,
            'date_format' => $this->project->date_format,
            'time_format' => $this->project->time_format,
            'currency_symbol' => $this->project->currency_symbol,
            'timezone' => $this->project->timezone,
            'enabled_languages' => $this->project->enabled_languages,
            'protected_files' => $this->project->protected_files,
            'install_script' => $this->project->install_script,
            'update_script' => $this->project->update_script,
            // Git settings (without provider credentials)
            'git_repository' => $this->project->git_repository,
            'git_default_branch' => $this->project->git_default_branch,
            'git_main_branch' => $this->project->git_main_branch,
            'git_target_directory' => $this->project->git_target_directory,
            'git_workflow' => $this->project->git_workflow,
            'git_pr_title_template' => $this->project->git_pr_title_template,
            'git_pr_description_template' => $this->project->git_pr_description_template,
            'git_auto_delete_branch' => $this->project->git_auto_delete_branch,
        ];

        $this->exportData['export_info'] = [
            'version' => '1.0',
            'exported_at' => now()->toIso8601String(),
            'scoriet_version' => config('app.version', '1.0.0'),
        ];
    }

    /**
     * Collect project attachments
     */
    protected function collectAttachments(): void
    {
        $attachments = $this->project->attachments()->get();
        $this->exportData['attachments'] = [];

        // Create attachments directory
        $attachmentsDir = $this->tempDir . '/attachments';
        if (!file_exists($attachmentsDir)) {
            mkdir($attachmentsDir, 0755, true);
        }

        foreach ($attachments as $attachment) {
            $attachmentData = [
                'original_filename' => $attachment->original_filename,
                'mime_type' => $attachment->mime_type,
                'size' => $attachment->size,
                'description' => $attachment->description,
                'category' => $attachment->category,
                'is_pinned' => $attachment->is_pinned,
                'created_at' => $attachment->created_at?->toIso8601String(),
            ];

            // Copy the actual file to temp directory using Storage facade (same as download)
            $disk = Storage::disk('local');
            if ($disk->exists($attachment->path)) {
                $exportFilename = $attachment->id . '_' . $attachment->original_filename;
                $destPath = $attachmentsDir . '/' . $exportFilename;
                // Get file content from storage and write to export directory
                file_put_contents($destPath, $disk->get($attachment->path));
                $attachmentData['export_filename'] = 'attachments/' . $exportFilename;
                $attachmentData['file_missing'] = false;
            } else {
                // File doesn't exist on disk - mark as missing but still export metadata
                $attachmentData['file_missing'] = true;
                $attachmentData['export_filename'] = null;
                \Log::warning("Project export: Attachment file missing", [
                    'project_id' => $this->project->id,
                    'attachment_id' => $attachment->id,
                    'expected_path' => $attachment->path,
                ]);
            }

            $this->exportData['attachments'][] = $attachmentData;
        }
    }

    /**
     * Collect schemas with all versions and related data
     */
    protected function collectSchemas(): void
    {
        $schemas = $this->project->floatingSchemas()
            ->withPivot(['association_type', 'alias'])
            ->get();

        $this->exportData['schemas'] = [];

        foreach ($schemas as $schema) {
            $schemaData = [
                'name' => $schema->name,
                'description' => $schema->description,
                'database_type' => $schema->database_type,
                'association_type' => $schema->pivot->association_type,
                'alias' => $schema->pivot->alias,
                'last_version' => $schema->last_version,
                'versions' => [],
            ];

            // Export all versions
            $versions = $schema->versions()->orderBy('version_number')->get();
            foreach ($versions as $version) {
                // Get designer layout for this version
                $designerLayouts = SchemaDesignerLayout::getLayoutForVersion($schema->id, $version->version_number);

                $versionData = [
                    'version_number' => $version->version_number,
                    'description' => $version->description,
                    'created_at' => $version->created_at?->toIso8601String(),
                    'tables' => [],
                    'designer_layouts' => $designerLayouts, // Full layout data for all tables
                ];

                // Export tables
                $tables = $version->tables()->get();
                foreach ($tables as $table) {
                    $tableData = [
                        'table_name' => $table->table_name,
                        'table_comment' => $table->table_comment,
                        'primarykeyfield' => $table->primarykeyfield,
                        'filekeyname' => $table->filekeyname,
                        'file_name_renamed' => $table->file_name_renamed,
                        'file_name_short' => $table->file_name_short,
                        'engine' => $table->engine,
                        'charset' => $table->charset,
                        'collation' => $table->collation,
                        'fields' => [],
                        'constraints' => [],
                        'designer_layout' => null,
                    ];

                    // Export fields
                    $fields = $table->fields()->orderBy('field_order')->get();
                    foreach ($fields as $field) {
                        $tableData['fields'][] = [
                            'field_name' => $field->field_name,
                            'field_type' => $field->field_type,
                            'field_length' => $field->field_length,
                            'field_precision' => $field->field_precision,
                            'field_scale' => $field->field_scale,
                            'is_unsigned' => $field->is_unsigned,
                            'is_nullable' => $field->is_nullable,
                            'default_value' => $field->default_value,
                            'is_auto_increment' => $field->is_auto_increment,
                            'is_primary_key' => $field->is_primary_key,
                            'is_index' => $field->is_index,
                            'is_unique' => $field->is_unique,
                            'field_comment' => $field->field_comment,
                            'field_order' => $field->field_order,
                            'control_type' => $field->control_type,
                            'link_table' => $field->link_table,
                            'link_field' => $field->link_field,
                            'link_display_field' => $field->link_display_field,
                            'link_order_field' => $field->link_order_field,
                            'link_order_direction' => $field->link_order_direction,
                            'editmask' => $field->editmask,
                        ];
                    }

                    // Export constraints
                    $constraints = $table->constraints()->get();
                    foreach ($constraints as $constraint) {
                        $constraintData = [
                            'name' => $constraint->name,
                            'type' => $constraint->type,
                            'columns' => [],
                            'foreign_key_reference' => null,
                        ];

                        // Export constraint columns
                        $columns = $constraint->constraintColumns()->get();
                        foreach ($columns as $column) {
                            $constraintData['columns'][] = [
                                'column_name' => $column->column_name,
                                'position' => $column->position,
                            ];
                        }

                        // Export foreign key reference if exists
                        if ($constraint->type === 'FOREIGN KEY' && $constraint->foreignKeyReference) {
                            $fkRef = $constraint->foreignKeyReference;
                            $constraintData['foreign_key_reference'] = [
                                'referenced_table_name' => $fkRef->referenced_table_name,
                                'on_delete' => $fkRef->on_delete,
                                'on_update' => $fkRef->on_update,
                                'reference_columns' => [],
                            ];

                            $refColumns = $fkRef->referenceColumns()->get();
                            foreach ($refColumns as $refCol) {
                                $constraintData['foreign_key_reference']['reference_columns'][] = [
                                    'column_name' => $refCol->column_name,
                                    'referenced_column_name' => $refCol->referenced_column_name,
                                ];
                            }
                        }

                        $tableData['constraints'][] = $constraintData;
                    }

                    // Get designer layout for this specific table from version layouts
                    if (isset($designerLayouts[$table->table_name])) {
                        $tableData['designer_layout'] = $designerLayouts[$table->table_name];
                    }

                    $versionData['tables'][] = $tableData;
                }

                // Export translations for this version
                $translations = $version->translations ?? [];
                if ($translations instanceof \Illuminate\Database\Eloquent\Collection) {
                    $versionData['translations'] = $translations->map(function ($t) {
                        return [
                            'language_code' => $t->language_code,
                            'table_name' => $t->table_name,
                            'field_name' => $t->field_name,
                            'translated_name' => $t->translated_name,
                            'translated_description' => $t->translated_description,
                        ];
                    })->toArray();
                } else {
                    $versionData['translations'] = [];
                }

                $schemaData['versions'][] = $versionData;
            }

            $this->exportData['schemas'][] = $schemaData;
        }
    }

    /**
     * Collect schema translations for all tables and fields in the project's schemas
     */
    protected function collectSchemaTranslations(): void
    {
        $this->exportData['schema_translations'] = [];

        // Collect all table and field names from the exported schemas
        $itemNames = [];

        foreach ($this->exportData['schemas'] as $schema) {
            foreach ($schema['versions'] as $version) {
                foreach ($version['tables'] as $table) {
                    $tableName = $table['table_name'];
                    if ($tableName) {
                        // Add table name
                        $itemNames[] = $tableName;

                        // Add field names (format: table_name.field_name)
                        foreach ($table['fields'] as $field) {
                            if ($field['field_name']) {
                                $itemNames[] = $tableName . '.' . $field['field_name'];
                            }
                        }
                    }
                }
            }
        }

        // Remove duplicates
        $itemNames = array_unique($itemNames);

        if (empty($itemNames)) {
            return;
        }

        // Get all translations for these items
        $translations = SchemaTranslation::whereIn('item_name', $itemNames)
            ->where('is_active', true)
            ->get();

        foreach ($translations as $translation) {
            $this->exportData['schema_translations'][] = [
                'item_name' => $translation->item_name,
                'language_code' => $translation->code,
                'translated_text' => $translation->translated_text,
                'description' => $translation->description,
            ];
        }
    }

    /**
     * Collect templates used by the project
     */
    protected function collectTemplates(): void
    {
        $templateUsages = $this->project->templateUsages()
            ->with(['template.files', 'template.dbSchemasDependencies'])
            ->get();

        $this->exportData['templates'] = [];

        foreach ($templateUsages as $usage) {
            if (!$usage->template) {
                continue;
            }

            $template = $usage->template;
            $templateData = [
                'usage_type' => $usage->usage_type,
                'alias' => $usage->alias,
                'config' => $usage->config,
                'is_active' => $usage->is_active,
                'template' => [
                    'name' => $template->name,
                    'full_name' => $template->full_name,
                    'description' => $template->description,
                    'category' => $template->category,
                    'language' => $template->language,
                    'tags' => $template->tags,
                    'protected_files' => $template->protected_files,
                    'install_script' => $template->install_script,
                    'update_script' => $template->update_script,
                    'files' => [],
                    'schema_dependencies' => [],
                ],
            ];

            // Export template files
            foreach ($template->files as $file) {
                $templateData['template']['files'][] = [
                    'file_path' => $file->file_path,
                    'file_content' => $file->file_content,
                    'file_type' => $file->file_type,
                    'content_type' => $file->content_type,
                    'is_binary' => $file->is_binary,
                    'encoding' => $file->encoding,
                    'description' => $file->description,
                    'sort_order' => $file->sort_order,
                ];
            }

            // Export schema dependencies
            if ($template->dbSchemasDependencies) {
                foreach ($template->dbSchemasDependencies as $dep) {
                    $templateData['template']['schema_dependencies'][] = [
                        'schema_name' => $dep->name,
                        'is_required' => $dep->pivot->is_required ?? true,
                        'alias' => $dep->pivot->alias ?? null,
                    ];
                }
            }

            $this->exportData['templates'][] = $templateData;
        }

        // Also export template variable values (use template_name instead of template_id for portability)
        $variableValues = $this->project->templateVariableValues()->with('template')->get();
        $this->exportData['template_variable_values'] = $variableValues->map(function ($v) {
            return [
                'template_name' => $v->template?->name,
                'variable_name' => $v->variable_name,
                'language' => $v->language,
                'value' => $v->value,
            ];
        })->toArray();
    }

    /**
     * Collect code adjustments
     */
    protected function collectCodeAdjustments(): void
    {
        $adjustments = $this->project->codeAdjustments()
            ->with('insertions')
            ->orderBy('execution_order')
            ->get();

        $this->exportData['code_adjustments'] = [];

        foreach ($adjustments as $adjustment) {
            $adjustmentData = [
                'name' => $adjustment->name,
                'description' => $adjustment->description,
                'file_pattern' => $adjustment->file_pattern,
                'match_type' => $adjustment->match_type,
                'scope' => $adjustment->scope,
                'execution_order' => $adjustment->execution_order,
                'is_active' => $adjustment->is_active,
                'insertions' => [],
            ];

            foreach ($adjustment->insertions as $insertion) {
                $adjustmentData['insertions'][] = [
                    'insertion_type' => $insertion->insertion_type,
                    'anchor_text' => $insertion->anchor_text,
                    'insertion_content' => $insertion->insertion_content,
                    'line_offset' => $insertion->line_offset,
                    'order_index' => $insertion->order_index,
                ];
            }

            $this->exportData['code_adjustments'][] = $adjustmentData;
        }
    }

    /**
     * Collect form sets and forms
     */
    protected function collectForms(): void
    {
        // Get form sets associated with this project via pivot table
        $formSetIds = ProjectFormSet::where('project_id', $this->project->id)->pluck('form_set_id');
        $formSets = FormSet::whereIn('id', $formSetIds)->with(['windows.elements'])->get();

        $this->exportData['form_sets'] = [];

        foreach ($formSets as $formSet) {
            $formSetData = [
                'name' => $formSet->name,
                'description' => $formSet->description,
                'visibility' => $formSet->visibility,
                'default_background_color' => $formSet->default_background_color,
                'default_window_color' => $formSet->default_window_color,
                'default_text_color' => $formSet->default_text_color,
                'default_button_color' => $formSet->default_button_color,
                'default_button_text_color' => $formSet->default_button_text_color,
                'windows' => [],
            ];

            foreach ($formSet->windows as $window) {
                $windowData = [
                    'name' => $window->name,
                    'display_name' => $window->display_name,
                    'window_type' => $window->window_type,
                    'min_width' => $window->min_width,
                    'min_height' => $window->min_height,
                    'default_width' => $window->default_width,
                    'default_height' => $window->default_height,
                    'background_color' => $window->background_color,
                    'window_color' => $window->window_color,
                    'text_color' => $window->text_color,
                    'sort_order' => $window->sort_order,
                    'elements' => [],
                ];

                foreach ($window->elements as $element) {
                    $windowData['elements'][] = [
                        'element_type' => $element->element_type,
                        'x_position' => $element->x_position,
                        'y_position' => $element->y_position,
                        'width' => $element->width,
                        'height' => $element->height,
                        'container_orientation' => $element->container_orientation,
                        'max_fields' => $element->max_fields,
                        'container_gap' => $element->container_gap,
                        'container_columns' => $element->container_columns,
                        'button_label' => $element->button_label,
                        'button_icon' => $element->button_icon,
                        'button_action' => $element->button_action,
                        'button_background_color' => $element->button_background_color,
                        'button_text_color' => $element->button_text_color,
                        'tab_label' => $element->tab_label,
                        'custom_style' => $element->custom_style,
                        'sort_order' => $element->sort_order,
                        'is_visible' => $element->is_visible,
                    ];
                }

                $formSetData['windows'][] = $windowData;
            }

            $this->exportData['form_sets'][] = $formSetData;
        }
    }

    /**
     * Write the manifest JSON file
     */
    protected function writeManifest(): void
    {
        $manifestPath = $this->tempDir . '/manifest.json';
        file_put_contents(
            $manifestPath,
            json_encode($this->exportData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
        );
    }

    /**
     * Create the archive file
     */
    protected function createArchive(string $format): string
    {
        $projectSlug = Str::slug($this->project->name);
        $timestamp = now()->format('Y-m-d_His');
        $baseFilename = "project_{$projectSlug}_{$timestamp}";

        $exportDir = storage_path('app/project-exports');
        if (!file_exists($exportDir)) {
            mkdir($exportDir, 0755, true);
        }

        switch ($format) {
            case 'tar.gz':
                $archivePath = $exportDir . '/' . $baseFilename . '.tar.gz';
                $this->createTarGzArchive($archivePath);
                break;

            case 'tar.xz':
                $archivePath = $exportDir . '/' . $baseFilename . '.tar.xz';
                $this->createTarXzArchive($archivePath);
                break;

            case 'zip':
            default:
                $archivePath = $exportDir . '/' . $baseFilename . '.zip';
                $this->createZipArchive($archivePath);
                break;
        }

        return $archivePath;
    }

    /**
     * Create ZIP archive
     */
    protected function createZipArchive(string $archivePath): void
    {
        $zip = new ZipArchive();
        if ($zip->open($archivePath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new \RuntimeException('Could not create ZIP archive');
        }

        $this->addDirectoryToZip($zip, $this->tempDir, '');
        $zip->close();
    }

    /**
     * Recursively add directory contents to ZIP
     */
    protected function addDirectoryToZip(ZipArchive $zip, string $dir, string $prefix): void
    {
        $files = scandir($dir);
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') {
                continue;
            }

            $fullPath = $dir . '/' . $file;
            $zipPath = $prefix ? $prefix . '/' . $file : $file;

            if (is_dir($fullPath)) {
                $zip->addEmptyDir($zipPath);
                $this->addDirectoryToZip($zip, $fullPath, $zipPath);
            } else {
                $zip->addFile($fullPath, $zipPath);
            }
        }
    }

    /**
     * Create tar.gz archive
     */
    protected function createTarGzArchive(string $archivePath): void
    {
        $tarPath = str_replace('.gz', '', $archivePath);

        // Create tar
        $phar = new \PharData($tarPath);
        $phar->buildFromDirectory($this->tempDir);

        // Compress to gz
        $phar->compress(\Phar::GZ);

        // Remove uncompressed tar
        if (file_exists($tarPath)) {
            unlink($tarPath);
        }
    }

    /**
     * Create tar.xz archive
     */
    protected function createTarXzArchive(string $archivePath): void
    {
        // On Windows, fall back to ZIP if xz is not available
        if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
            // Try using 7z if available, otherwise fall back to tar.gz
            $sevenZipPath = 'C:\\Program Files\\7-Zip\\7z.exe';
            if (file_exists($sevenZipPath)) {
                $tarPath = str_replace('.xz', '', $archivePath);
                $phar = new \PharData($tarPath);
                $phar->buildFromDirectory($this->tempDir);

                // Use 7z to create xz
                $command = sprintf(
                    '"%s" a -txz "%s" "%s"',
                    $sevenZipPath,
                    $archivePath,
                    $tarPath
                );
                exec($command);

                if (file_exists($tarPath)) {
                    unlink($tarPath);
                }
            } else {
                // Fall back to tar.gz
                $gzPath = str_replace('.xz', '.gz', $archivePath);
                $this->createTarGzArchive($gzPath);
                rename($gzPath, $archivePath);
            }
        } else {
            // Unix: use native tar with xz
            $command = sprintf(
                'tar -cJf %s -C %s .',
                escapeshellarg($archivePath),
                escapeshellarg($this->tempDir)
            );
            exec($command);
        }
    }

    /**
     * Cleanup temporary directory
     */
    protected function cleanupTempDir(): void
    {
        if (file_exists($this->tempDir)) {
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
}
