<?php

namespace App\Services;

use App\Models\PerformanceMetric;
use App\Models\Project;
use App\Models\ProjectGenerationTree;
use App\Models\Template;
use App\Models\TemplateFile;
use App\Models\Language;
use App\Models\SchemaTable;
use App\Models\SchemaVersion;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProjectFileTreeGenerator
{
    /**
     * Generate the complete file tree for a project
     */
    public function generateTreeForProject(Project $project): array
    {
        // Load all required data
        $templates = $this->loadProjectTemplates($project);
        $languages = $this->loadActiveLanguages();
        $tablesWithVersions = $this->loadProjectTables($project);

        // Build the tree structure
        $tree = [];

        foreach ($templates as $template) {
            $templateNode = $this->buildTemplateNode($template, $tablesWithVersions, $languages, $project);
            if (!empty($templateNode['children'])) {
                $tree[] = $templateNode;
            }
        }

        return $tree;
    }

    /**
     * Generate and save the tree to database
     */
    public function generateAndSave(Project $project): ProjectGenerationTree
    {
        $startTime = microtime(true);

        $tree = $this->generateTreeForProject($project);

        // Find or create the generation tree record
        $generationTree = ProjectGenerationTree::firstOrNew([
            'project_id' => $project->id,
        ]);

        $generationTree->tree_data = $tree;
        $generationTree->markAsFresh();
        $generationTree->save();

        // Track performance
        $duration = (int) ((microtime(true) - $startTime) * 1000);
        try {
            $user = $project->owner;
            PerformanceMetric::create([
                'user_id' => $user?->id,
                'operation' => PerformanceMetric::OP_GTREE_BUILD,
                'operation_detail' => $project->name,
                'duration_ms' => $duration,
                'memory_peak_mb' => (int) (memory_get_peak_usage(true) / 1024 / 1024),
                'tables_count' => count($tree),
                'fields_count' => null,
                'from_cache' => false,
                'subscription_type' => $user?->subscription?->type ?? 'free',
                'metadata' => [
                    'tree_items' => count($tree),
                    'project_id' => $project->id,
                ],
                'created_at' => now(),
            ]);
        } catch (\Exception $e) {
            Log::error("Performance tracking failed: " . $e->getMessage());
        }

        return $generationTree;
    }

    /**
     * Load all templates used by this project
     */
    protected function loadProjectTemplates(Project $project): array
    {
        return DB::table('project_template_usage')
            ->join('templates', 'project_template_usage.template_id', '=', 'templates.id')
            ->where('project_template_usage.project_id', $project->id)
            ->where('project_template_usage.is_active', true)
            ->select('templates.*')
            ->get()
            ->toArray();
    }

    /**
     * Load all active languages
     */
    protected function loadActiveLanguages(): array
    {
        return Language::where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->toArray();
    }

    /**
     * Load all tables from the latest schema version for this project
     * Returns array with tables and their version numbers
     * Only loads schemas that are linked to the project via project_schemas
     */
    protected function loadProjectTables(Project $project): array
    {
        $tables = [];

        // Get only the schema IDs that are linked to this project
        $linkedSchemaIds = DB::table('project_schemas')
            ->where('project_id', $project->id)
            ->pluck('schema_id')
            ->toArray();

        if (empty($linkedSchemaIds)) {
            return $tables;
        }

        // Get schema versions only for linked schemas
        $schemaVersions = SchemaVersion::whereIn('schema_id', $linkedSchemaIds)
            ->orderBy('schema_id')
            ->orderBy('version_number', 'desc')
            ->get();

        // Group by schema_id to get only the latest version per schema
        $latestVersionsBySchema = [];
        foreach ($schemaVersions as $version) {
            if (!isset($latestVersionsBySchema[$version->schema_id]) ||
                $version->version_number > $latestVersionsBySchema[$version->schema_id]->version_number) {
                $latestVersionsBySchema[$version->schema_id] = $version;
            }
        }

        foreach ($latestVersionsBySchema as $schemaId => $latestVersion) {
            // Load all tables for this version
            $schemaTables = SchemaTable::where('schema_version_id', $latestVersion->id)
                ->orderBy('table_name')
                ->get()
                ->toArray();

            // Add version number to each table
            foreach ($schemaTables as &$table) {
                $table['schema_version_number'] = $latestVersion->version_number;
                $table['schema_id'] = $schemaId;
            }

            $tables = array_merge($tables, $schemaTables);
        }

        return $tables;
    }

    /**
     * Build a template node with all its files
     */
    protected function buildTemplateNode($template, array $tables, array $languages, Project $project): array
    {
        $templateFiles = TemplateFile::where('template_id', $template->id)
            ->orderBy('file_order')
            ->get();

        $children = [];

        foreach ($templateFiles as $templateFile) {
            if ($templateFile->file_type === 'project_file') {
                // Project-level file: generate once
                $fileNode = $this->buildProjectFileNode($templateFile, $template, $project);
                $this->insertIntoTree($children, $fileNode);
            } elseif ($templateFile->file_type === 'db_table_file_languages') {
                // Table + Language file: generate for each table × each language
                foreach ($tables as $table) {
                    foreach ($languages as $language) {
                        $fileNode = $this->buildTableLanguageFileNode(
                            $templateFile,
                            $template,
                            $table,
                            $language,
                            $project
                        );
                        $this->insertIntoTree($children, $fileNode);
                    }
                }
            } elseif ($templateFile->file_type === 'db_table_file') {
                // Table file: generate for each table (without language)
                foreach ($tables as $table) {
                    $fileNode = $this->buildTableFileNode(
                        $templateFile,
                        $template,
                        $table,
                        $project
                    );
                    $this->insertIntoTree($children, $fileNode);
                }
            }
        }

        // Sort the tree structure alphabetically by directory/file names
        $this->sortTreeNodes($children);

        return [
            'id' => 'template-' . $template->id,
            'name' => $template->name,
            'type' => 'template-group',
            'templateId' => $template->id,
            'children' => $children,
        ];
    }

    /**
     * Build a node for a project-level file
     */
    protected function buildProjectFileNode($templateFile, $template, Project $project): array
    {
        // Project-level files don't have table or language context
        $placeholders = [
            '%1' => '',  // No table name for project files
            '%2' => '',  // No language code
            '%3' => '',  // No language name
            '%4' => '',  // No language localization
            '%5' => $template->name ?? '',  // Template name
            '%6' => date('Y-m-d'),  // Date (UNC friendly)
            '%7' => date('H-i-s'),  // Time (UNC friendly)
            '%8' => date('Y-m-d_H-i-s'),  // DateTime (UNC friendly)
            '%9' => '',  // No database version for project files
        ];

        // Use output_path for directory structure, file_path for the actual file
        $outputPath = $templateFile->output_path ?? '';
        $filePath = $templateFile->file_path ?? $templateFile->file_name ?? '';
        
        // Resolve placeholders in both paths
        $resolvedOutputPath = $this->resolvePlaceholders($outputPath, $placeholders);
        $resolvedFilePath = $this->resolvePlaceholders($filePath, $placeholders);
        
        // Combine output path and file path
        $fullPath = $resolvedOutputPath;
        if (!empty($resolvedFilePath)) {
            // If file_path includes directories, we need to handle them
            $fileName = basename($resolvedFilePath);
            $fileDir = dirname($resolvedFilePath);
            
            if ($fileDir !== '.' && $fileDir !== '/') {
                // Add file directory to output path
                $fullPath = rtrim($fullPath, '/') . '/' . ltrim($fileDir, '/');
            }
            
            // Add filename
            $fullPath = rtrim($fullPath, '/') . '/' . $fileName;
        }
        
        // Always ensure we have a valid path
        if (empty($fullPath)) {
            $fullPath = $templateFile->file_name;
            Log::warning("🧪 [TREE-GEN] Resolved path is empty for TemplateFile ID {$templateFile->id}, using file_name: '{$fullPath}'");
        }

        return [
            'id' => 'gen-file-project-' . $templateFile->id,
            'name' => basename($fullPath),
            'type' => 'generated-file',
            'path' => $fullPath,
            'templateId' => $template->id,
            'fileId' => $templateFile->id,
            'fileType' => 'project_file',
        ];
    }

    /**
     * Build a node for a table+language file
     */
    protected function buildTableLanguageFileNode($templateFile, $template, $table, $language, Project $project): array
    {
        // Convert to array if it's an object
        $tableData = is_array($table) ? $table : (array)$table;
        $languageData = is_array($language) ? $language : (array)$language;

        $tableName = $tableData['table_name'] ?? '';
        $languageCode = $languageData['code'] ?? '';
        $languageName = $languageData['name'] ?? '';
        $versionNumber = $tableData['schema_version_number'] ?? '';

        // Build language localization (e.g., de_DE, en_US)
        $languageLocalization = $this->getLanguageLocalization($languageCode);

        $placeholders = [
            '%1' => $tableName,                      // Table name
            '%2' => $languageCode,                   // Language code (2 chars)
            '%3' => $languageName,                   // Language name
            '%4' => $languageLocalization,           // Language localization (de_DE)
            '%5' => $template->name ?? '',           // Template name
            '%6' => date('Y-m-d'),                   // Date (UNC friendly)
            '%7' => date('H-i-s'),                   // Time (UNC friendly)
            '%8' => date('Y-m-d_H-i-s'),            // DateTime (UNC friendly)
            '%9' => $versionNumber,                  // Database version number
        ];

        // Use output_path for directory structure, file_path for the actual file
        $outputPath = $templateFile->output_path ?? '';
        $filePath = $templateFile->file_path ?? $templateFile->file_name ?? '';
        
        // Resolve placeholders in both paths
        $resolvedOutputPath = $this->resolvePlaceholders($outputPath, $placeholders);
        $resolvedFilePath = $this->resolvePlaceholders($filePath, $placeholders);
        
        // Combine output path and file path
        $fullPath = $resolvedOutputPath;
        if (!empty($resolvedFilePath)) {
            // If file_path includes directories, we need to handle them
            $fileName = basename($resolvedFilePath);
            $fileDir = dirname($resolvedFilePath);
            
            if ($fileDir !== '.' && $fileDir !== '/') {
                // Add file directory to output path
                $fullPath = rtrim($fullPath, '/') . '/' . ltrim($fileDir, '/');
            }
            
            // Add filename
            $fullPath = rtrim($fullPath, '/') . '/' . $fileName;
        }
        
        // Always ensure we have a valid path
        if (empty($fullPath)) {
            $fullPath = $templateFile->file_name;
            Log::warning("🧪 [TREE-GEN] Resolved path is empty for TemplateFile ID {$templateFile->id}, using file_name: '{$fullPath}'");
        }

        return [
            'id' => 'gen-file-' . $templateFile->id . '-table-' . ($tableData['id'] ?? 0) . '-lang-' . ($languageData['id'] ?? 0),
            'name' => basename($fullPath),
            'type' => 'generated-file',
            'path' => $fullPath,
            'templateId' => $template->id,
            'fileId' => $templateFile->id,
            'tableId' => $tableData['id'] ?? 0,
            'tableName' => $tableName,
            'languageId' => $languageData['id'] ?? 0,
            'languageCode' => $languageCode,
            'fileType' => 'db_table_file_languages',
        ];
    }

    /**
     * Build a node for a table file (without language)
     */
    protected function buildTableFileNode($templateFile, $template, $table, Project $project): array
    {
        // Convert to array if it's an object
        $tableData = is_array($table) ? $table : (array)$table;

        $tableName = $tableData['table_name'] ?? '';
        $versionNumber = $tableData['schema_version_number'] ?? '';

        $placeholders = [
            '%1' => $tableName,                      // Table name
            '%2' => '',                              // No language code
            '%3' => '',                              // No language name
            '%4' => '',                              // No language localization
            '%5' => $template->name ?? '',           // Template name
            '%6' => date('Y-m-d'),                   // Date (UNC friendly)
            '%7' => date('H-i-s'),                   // Time (UNC friendly)
            '%8' => date('Y-m-d_H-i-s'),            // DateTime (UNC friendly)
            '%9' => $versionNumber,                  // Database version number
        ];

        // Use output_path for directory structure, file_path for the actual file
        $outputPath = $templateFile->output_path ?? '';
        $filePath = $templateFile->file_path ?? $templateFile->file_name ?? '';
        
        // Resolve placeholders in both paths
        $resolvedOutputPath = $this->resolvePlaceholders($outputPath, $placeholders);
        $resolvedFilePath = $this->resolvePlaceholders($filePath, $placeholders);
        
        // Combine output path and file path
        $fullPath = $resolvedOutputPath;
        if (!empty($resolvedFilePath)) {
            // If file_path includes directories, we need to handle them
            $fileName = basename($resolvedFilePath);
            $fileDir = dirname($resolvedFilePath);
            
            if ($fileDir !== '.' && $fileDir !== '/') {
                // Add file directory to output path
                $fullPath = rtrim($fullPath, '/') . '/' . ltrim($fileDir, '/');
            }
            
            // Add filename
            $fullPath = rtrim($fullPath, '/') . '/' . $fileName;
        }
        
        // Always ensure we have a valid path
        if (empty($fullPath)) {
            $fullPath = $templateFile->file_name;
            Log::warning("🧪 [TREE-GEN] Resolved path is empty for TemplateFile ID {$templateFile->id}, using file_name: '{$fullPath}'");
        }

        return [
            'id' => 'gen-file-' . $templateFile->id . '-table-' . ($tableData['id'] ?? 0),
            'name' => basename($fullPath),
            'type' => 'generated-file',
            'path' => $fullPath,
            'templateId' => $template->id,
            'fileId' => $templateFile->id,
            'tableId' => $tableData['id'] ?? 0,
            'tableName' => $tableName,
            'fileType' => 'db_table_file',
        ];
    }

    /**
     * Resolve placeholders in a path
     */
    protected function resolvePlaceholders(string $path, array $placeholders): string
    {
        foreach ($placeholders as $placeholder => $value) {
            $path = str_replace($placeholder, $value, $path);
        }

        return $path;
    }

    /**
     * Insert a file node into the tree, creating directory nodes as needed
     */
    protected function insertIntoTree(array &$tree, array $fileNode): void
    {
        $path = $fileNode['path'];
        $parts = explode('/', trim($path, '/'));
        $fileName = array_pop($parts);

        // Navigate/create directory structure
        $currentLevel = &$tree;

        foreach ($parts as $index => $dirName) {
            // Skip empty parts
            if ($dirName === '') {
                continue;
            }

            // Find or create directory node
            $found = false;
            foreach ($currentLevel as &$node) {
                if ($node['type'] === 'directory' && $node['name'] === $dirName) {
                    $found = true;
                    $currentLevel = &$node['children'];
                    break;
                }
            }

            if (!$found) {
                $dirPath = implode('/', array_slice($parts, 0, $index + 1));
                $newDir = [
                    'id' => 'dir-' . md5($dirPath),
                    'name' => $dirName,
                    'type' => 'directory',
                    'path' => $dirPath,
                    'children' => [],
                ];
                $currentLevel[] = $newDir;
                $currentLevel = &$currentLevel[count($currentLevel) - 1]['children'];
            }
        }

        // Add the file node at the current level
        $currentLevel[] = $fileNode;
    }

    /**
     * Convert string to camelCase
     */
    protected function toCamelCase(string $str): string
    {
        $str = str_replace(['_', '-'], ' ', $str);
        $str = ucwords(strtolower($str));
        $str = str_replace(' ', '', $str);
        return lcfirst($str);
    }

    /**
     * Convert string to snake_case
     */
    protected function toSnakeCase(string $str): string
    {
        return strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $str));
    }

    /**
     * Sort tree nodes recursively by name (directories first, then files)
     */
    protected function sortTreeNodes(array &$nodes): void
    {
        // Separate directories and files
        $directories = [];
        $files = [];

        foreach ($nodes as &$node) {
            if ($node['type'] === 'directory') {
                // Recursively sort children of directories
                if (!empty($node['children'])) {
                    $this->sortTreeNodes($node['children']);
                }
                $directories[] = &$node;
            } else {
                $files[] = &$node;
            }
        }

        // Sort directories and files alphabetically
        usort($directories, function ($a, $b) {
            return strcasecmp($a['name'], $b['name']);
        });

        usort($files, function ($a, $b) {
            return strcasecmp($a['name'], $b['name']);
        });

        // Combine directories first, then files
        $nodes = array_merge($directories, $files);
    }

    /**
     * Get language localization from language code
     * Example: de -> de_DE, en -> en_US, fr -> fr_FR
     */
    protected function getLanguageLocalization(string $languageCode): string
    {
        $localizationMap = [
            'de' => 'de_DE',
            'en' => 'en_US',
            'fr' => 'fr_FR',
            'es' => 'es_ES',
            'it' => 'it_IT',
            'pt' => 'pt_PT',
            'nl' => 'nl_NL',
            'pl' => 'pl_PL',
            'ru' => 'ru_RU',
            'ja' => 'ja_JP',
            'zh' => 'zh_CN',
            'ko' => 'ko_KR',
            'ar' => 'ar_SA',
            'tr' => 'tr_TR',
        ];

        return $localizationMap[strtolower($languageCode)] ?? strtolower($languageCode) . '_' . strtoupper($languageCode);
    }
}
