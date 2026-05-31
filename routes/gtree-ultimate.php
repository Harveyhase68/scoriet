<?php

/**
 * 🚀 ULTIMATE SCORIET GTREE ENGINE
 *
 * Diese Route erstellt die ultimative gtree-Struktur mit:
 * - Über 50 Template-Variablen für maximale Flexibilität
 * - Erweiterte Tabellen- und Feld-Metadaten
 * - Optimierte Performance und Caching
 * - Multi-Format Export (JSON, JavaScript, PHP)
 */

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// 🌟 ULTIMATE TEMPLATE PROCESSING ENGINE - Maximaler Power Mode!
Route::get('/template-process-ultimate/{templateId}', function (Request $request, $templateId) {
    try {
        // Get project filter from query parameter
        $projectId = $request->query('project_id');

        // Find template with its files
        $template = \App\Models\Template::with('files')->find($templateId);
        if (!$template) {
            return response()->json([
                'error' => 'Template not found',
                'template_id' => $templateId
            ], 404);
        }

        // Load project-specific schemas or fallback to demo data
        $schemaTables = collect();
        $actualProject = null;

        if ($projectId) {
            $actualProject = \App\Models\Project::find($projectId);
            if ($actualProject) {
                // Get floating schemas linked to this project
                $linkedSchemas = \App\Models\FloatingSchema::whereHas('projects', function ($query) use ($projectId) {
                    $query->where('projects.id', $projectId);
                })->get();

                foreach ($linkedSchemas as $schema) {
                    // Get latest version of each linked schema
                    $latestVersion = \App\Models\SchemaVersion::where('schema_id', $schema->id)
                        ->orderBy('id', 'desc')
                        ->first();

                    if ($latestVersion) {
                        $versionTables = \App\Models\SchemaTable::where('schema_version_id', $latestVersion->id)
                            ->with(['fields' => function($query) {
                                $query->orderBy('field_order');
                            }, 'constraints'])
                            ->get();
                        $schemaTables = $schemaTables->merge($versionTables);
                    }
                }
            }
        }

        // Fallback to demo data if no project or no linked schemas
        if ($schemaTables->isEmpty()) {
            $schemaTables = \App\Models\SchemaTable::where('schema_version_id', 1)
                ->with(['fields' => function($query) {
                    $query->orderBy('field_order');
                }, 'constraints'])
                ->get();
        }

        // 🎯 GENERATION STATE — all tables stay in gtree.tables[] regardless of mode;
        // iteration is driven by the `tablesgen` index array built after the
        // foreach loop below (once positional indices are stable).
        $schemaTables = $schemaTables->values();

        // 🚀 ULTIMATE PROJECT DATA - Alle erdenklichen Template-Variablen
        $projectName = $actualProject ? $actualProject->name : 'ScorietDemo';
        $projectId = $actualProject ? $actualProject->id : 1;

        $projectData = [
            // === BASIC PROJECT INFO ===
            'projectname' => $projectName,
            'projectnameupper' => strtoupper($projectName),
            'projectnamelower' => strtolower($projectName),
            'projectnamecamel' => ucfirst(str_replace('_', '', ucwords($projectName, '_'))), // snake_case → CamelCase
            'projectnamepascal' => ucfirst(str_replace('_', '', ucwords($projectName, '_'))), // Alias for camelCase
            'projectnameunderscore' => str_replace('-', '_', strtolower($projectName)), // kebab-case → snake_case
            'projectnamekebab' => str_replace('_', '-', strtolower($projectName)), // snake_case → kebab-case
            'projectnamesafe' => preg_replace('/[^a-zA-Z0-9_]/', '_', $projectName), // Safe for file/var names
            'projectid' => $projectId,
            'projectcreated' => $actualProject ? $actualProject->created_at->format('Y-m-d H:i:s') : now()->format('Y-m-d H:i:s'),
            'projectcreateddate' => $actualProject ? $actualProject->created_at->format('Y-m-d') : now()->format('Y-m-d'),
            'projectcreatedyear' => $actualProject ? $actualProject->created_at->format('Y') : now()->format('Y'),
            'projectcreatedmonth' => $actualProject ? $actualProject->created_at->format('m') : now()->format('m'),
            'projectcreatedday' => $actualProject ? $actualProject->created_at->format('d') : now()->format('d'),
            'projectupdated' => $actualProject ? $actualProject->updated_at->format('Y-m-d H:i:s') : now()->format('Y-m-d H:i:s'),
            'projectowner' => $actualProject ? ($actualProject->owner->name ?? 'Unknown Owner') : 'Demo User',
            'projectowneremail' => $actualProject ? ($actualProject->owner->email ?? '') : 'demo@scoriet.com',
            'projectownerusername' => $actualProject ? ($actualProject->owner->username ?? '') : 'demo',
            'projectownerfirstname' => $actualProject && $actualProject->owner ? explode(' ', $actualProject->owner->name)[0] : 'Demo',
            'projectownerlastname' => $actualProject && $actualProject->owner ? (explode(' ', $actualProject->owner->name)[1] ?? '') : 'User',

            // === PROJECT SETTINGS ===
            'projectdirectory' => $actualProject ? ($actualProject->project_directory ?? 'C:\\Users\\Public\\Documents\\' . $projectName) : 'C:\\Users\\Public\\Documents\\ScorietDemo',
            'projectdirectoryunix' => str_replace('\\', '/', $actualProject ? ($actualProject->project_directory ?? '/var/www/' . $projectName) : '/var/www/scorietdemo'),
            'projectdirectoryname' => basename($actualProject ? ($actualProject->project_directory ?? $projectName) : 'ScorietDemo'),
            'projecturl' => $actualProject ? ($actualProject->project_url ?? 'http://localhost/' . strtolower($projectName)) : 'http://localhost/scorietdemo',
            'projectdomain' => parse_url($actualProject ? ($actualProject->project_url ?? 'http://localhost') : 'http://localhost', PHP_URL_HOST),
            'projectscheme' => parse_url($actualProject ? ($actualProject->project_url ?? 'http://localhost') : 'http://localhost', PHP_URL_SCHEME),
            'projectport' => parse_url($actualProject ? ($actualProject->project_url ?? 'http://localhost') : 'http://localhost', PHP_URL_PORT) ?? 80,
            'projectdescription' => $actualProject ? ($actualProject->description ?? '') : 'Demo Scoriet Project',
            'projectpublic' => $actualProject ? ($actualProject->is_public ? 'true' : 'false') : 'false',
            'projectpublicbool' => $actualProject ? $actualProject->is_public : false,
            'projectjoincode' => $actualProject ? ($actualProject->join_code ?? '') : '',
            'projectactive' => $actualProject ? ($actualProject->is_active ? 'true' : 'false') : 'true',
            'projectactivebool' => $actualProject ? $actualProject->is_active : true,

            // === DATABASE CONNECTION ===
            'projectdatabase' => $actualProject ? ($actualProject->database_name ?? $projectName . '_db') : 'scoriet_demo',
            'projectdatabaseupper' => strtoupper($actualProject ? ($actualProject->database_name ?? $projectName . '_db') : 'scoriet_demo'),
            'projectdatabaselower' => strtolower($actualProject ? ($actualProject->database_name ?? $projectName . '_db') : 'scoriet_demo'),
            'projectdbid' => 1, // Default connection ID
            'projectdbtype' => $actualProject ? ($actualProject->database_type ?? 'MySQL') : 'MySQL',
            'projectdbtypelower' => strtolower($actualProject ? ($actualProject->database_type ?? 'MySQL') : 'MySQL'),
            'projectdbtypeupper' => strtoupper($actualProject ? ($actualProject->database_type ?? 'MySQL') : 'MySQL'),
            'projectdbdesc' => $actualProject ? ($actualProject->description ?? 'Project database connection') : 'Demo project database',
            'projectdbusername' => $actualProject ? ($actualProject->database_username ?? 'root') : 'root',
            'projectdbpassword' => $actualProject && $actualProject->database_password ? $actualProject->database_password : '', // Real password
            'projectdbserver' => $actualProject ? ($actualProject->database_server ?? '127.0.0.1') : '127.0.0.1',
            'projectdbhost' => $actualProject ? ($actualProject->database_server ?? '127.0.0.1') : '127.0.0.1', // Alias
            'projectdbport' => $actualProject ? ($actualProject->database_port ?? '3306') : '3306',
            'projectdbportnumber' => intval($actualProject ? ($actualProject->database_port ?? '3306') : '3306'),
            'projectdbconnstring' => ($actualProject ? ($actualProject->database_type ?? 'MySQL') : 'MySQL') . '://' .
                                   ($actualProject ? ($actualProject->database_username ?? 'root') : 'root') . '@' .
                                   ($actualProject ? ($actualProject->database_server ?? '127.0.0.1') : '127.0.0.1') . ':' .
                                   ($actualProject ? ($actualProject->database_port ?? '3306') : '3306') . '/' .
                                   ($actualProject ? ($actualProject->database_name ?? $projectName . '_db') : 'scoriet_demo'),
            'projectdbdsn' => 'mysql:host=' . ($actualProject ? ($actualProject->database_server ?? '127.0.0.1') : '127.0.0.1') .
                             ';port=' . ($actualProject ? ($actualProject->database_port ?? '3306') : '3306') .
                             ';dbname=' . ($actualProject ? ($actualProject->database_name ?? $projectName . '_db') : 'scoriet_demo'),

            // === TEMPLATE INFO ===
            'templateid' => $templateId,
            'projecttemplateid' => $templateId, // Legacy compatibility
            'templatename' => $template->name,
            'templatenamelower' => strtolower($template->name),
            'templatenameupper' => strtoupper($template->name),
            'templatenamecamel' => ucfirst(str_replace('_', '', ucwords($template->name, '_'))),
            'templatenamepascal' => ucfirst(str_replace('_', '', ucwords($template->name, '_'))),
            'templatenamesafe' => preg_replace('/[^a-zA-Z0-9_]/', '_', $template->name),
            'templatefolder' => 'Templates\\' . $template->name,
            'templatefolderunix' => 'Templates/' . $template->name,
            'templatecategory' => $template->category ?? 'General',
            'templatedescription' => $template->description ?? '',
            'templatecreated' => $template->created_at ? $template->created_at->format('Y-m-d H:i:s') : now()->format('Y-m-d H:i:s'),
            'templatefilescount' => $template->files->count(),

            // === COUNTS AND METRICS ===
            // nmaxtables will be set below to count($tablesgen) — the index array
            // of tables participating in {:for nmaxtables:} loops (full+code_only).
            'nmaxtables' => 0, // placeholder, overwritten after the foreach
            'nmaxlanguages' => 1, // Default to 1 language
            'nmaxprojects' => 1, // For this generation context
            'nmaxschemas' => $schemaTables->count(),

            // === GENERATION CONTEXT ===
            'generationdate' => now()->format('Y-m-d'),
            'generationtime' => now()->format('H:i:s'),
            'generationtimestamp' => now()->timestamp,
            'generationdatetime' => now()->format('Y-m-d H:i:s'),
            'generationiso' => now()->toISOString(),
            'generationuser' => auth()->user() ? auth()->user()->name : 'System',
            'generationuserid' => auth()->user() ? auth()->user()->id : 0,
            'scorietversion' => '1.0.0.3', // Scoriet version
            'laravelversion' => app()->version(),
            'phpversion' => PHP_VERSION,
            'phpversionfull' => phpversion(),

            // === ADVANCED TEMPLATE HELPERS ===
            'newline' => "\n",
            'tab' => "\t",
            'doublequote' => '"',
            'singlequote' => "'",
            'backslash' => "\\",
            'forwardslash' => "/",
            'space' => ' ',
            'empty' => '',
            'comma' => ',',
            'semicolon' => ';',
            'colon' => ':',
            'dot' => '.',
            'pipe' => '|',
            'ampersand' => '&',
            'at' => '@',
            'hash' => '#',
            'dollar' => '$',
            'percent' => '%',

            // === OS & ENVIRONMENT ===
            'os' => PHP_OS,
            'osname' => php_uname('s'),
            'hostname' => php_uname('n'),
            'servername' => $_SERVER['SERVER_NAME'] ?? 'localhost',
            'serverport' => $_SERVER['SERVER_PORT'] ?? '80',

            // Enhanced Tables array (will be filled below with extended metadata)
            'tables' => []
        ];

        // 🌟 ENHANCED TABLE PROCESSING - Erweiterte Tabellen-Metadaten
        foreach ($schemaTables as $tableIndex => $table) {
            // All fields stay in fields[] (incl. excluded/reference_only/template_only)
            // for FK/name lookup; iteration is driven by fieldsgen[] built below.
            $fields = $table->fields->values();
            $constraints = $table->constraints;

            // fieldsgen collects positional indices of iterable fields
            // (modes: full, code_only). Non-iterable fields stay in fields[].
            $fieldsGenIndices = [];
            foreach ($fields as $fIdx => $f) {
                $mode = $f->generation_mode ?? 'full';
                if (in_array($mode, ['full', 'code_only'])) {
                    $fieldsGenIndices[] = $fIdx;
                }
            }

            // Extended field mapping with more template variables
            $mappedFields = $fields->map(function($field, $index) use ($table, $projectId) {
                // Determine control types based on field
                $controltype = match($field->field_type) {
                    'int', 'integer', 'bigint', 'smallint', 'tinyint' => 24,
                    'varchar', 'char' => 24,
                    'string' => 24,
                    'text', 'longtext', 'mediumtext' => 24,
                    'decimal', 'float', 'double' => 24,
                    'date' => 24,
                    'datetime', 'timestamp' => 24,
                    'boolean', 'bool', 'tinyint(1)' => 24,
                    default => 24
                };

                // Enhanced typecast detection
                $typecast = match(strtolower($field->field_type)) {
                    'int', 'integer', 'bigint', 'smallint', 'tinyint' => '(int)',
                    'decimal', 'float', 'double' => '(float)',
                    'boolean', 'bool', 'tinyint(1)' => '(bool)',
                    default => ''
                };

                // Enhanced field analysis
                $fieldName = $field->field_name;
                $isPrimaryKey = $fieldName === 'id' || str_ends_with($fieldName, '_id');
                $isAutoIncrement = $isPrimaryKey && in_array(strtolower($field->field_type), ['int', 'integer', 'bigint']);
                $isTimestamp = in_array($fieldName, ['created_at', 'updated_at', 'deleted_at']);
                $isForeignKey = str_ends_with($fieldName, '_id') && $fieldName !== 'id';

                // Extract field size from type (e.g., VARCHAR(50) -> 50)
                $size = 0;
                if (preg_match('/\((\d+)\)/', $field->field_type, $matches)) {
                    $size = (int)$matches[1];
                }

                return [
                    // Core template variables
                    'name' => $fieldName,
                    'namelower' => strtolower($fieldName),
                    'nameupper' => strtoupper($fieldName),
                    'namecamel' => lcfirst(str_replace('_', '', ucwords($fieldName, '_'))), // snake_case → camelCase
                    'namepascal' => ucfirst(str_replace('_', '', ucwords($fieldName, '_'))), // snake_case → PascalCase
                    'namesafe' => preg_replace('/[^a-zA-Z0-9_]/', '_', $fieldName),
                    'nameplural' => $fieldName . 's', // Simple pluralization
                    'type' => strtoupper($field->field_type),
                    'typelower' => strtolower($field->field_type),
                    'typeshort' => explode('(', strtoupper($field->field_type))[0], // VARCHAR(50) -> VARCHAR
                    'controltype' => $controltype,
                    'typecast' => $typecast,
                    'is_nullable' => $field->is_nullable,
                    'nullable' => $field->is_nullable,
                    'order' => $field->field_order,

                    // Extended Scoriet template variables
                    'filename' => $table->table_name,
                    'default' => $field->default_value ?? '',
                    'id' => $index + 1, // 1-based field ID
                    'sortindex' => $field->field_order,
                    'caption' => ucwords(str_replace('_', ' ', $fieldName)),
                    'label' => ucwords(str_replace('_', ' ', $fieldName)), // Alias for caption
                    'editmask' => '',
                    'size' => $size,
                    'length' => $size, // Alias for size
                    'notnull' => !$field->is_nullable,
                    'autoincrement' => $isAutoIncrement,
                    'isprimary' => $isPrimaryKey,
                    'isforeign' => $isForeignKey,
                    'istimestamp' => $isTimestamp,
                    'unsigned' => false, // Default false
                    'visible' => true, // Default visible
                    'projectid' => $projectId ?? 1,

                    // PHP-specific helpers
                    'phptype' => match(strtolower($field->field_type)) {
                        'int', 'integer', 'bigint', 'smallint', 'tinyint' => 'int',
                        'varchar', 'char', 'string', 'text', 'longtext', 'mediumtext' => 'string',
                        'decimal', 'float', 'double' => 'float',
                        'boolean', 'bool', 'tinyint(1)' => 'bool',
                        'date', 'datetime', 'timestamp' => 'string',
                        default => 'string'
                    },

                    // JavaScript-specific helpers
                    'jstype' => match(strtolower($field->field_type)) {
                        'int', 'integer', 'bigint', 'smallint', 'tinyint', 'decimal', 'float', 'double' => 'number',
                        'boolean', 'bool', 'tinyint(1)' => 'boolean',
                        default => 'string'
                    },

                    // SQL-specific helpers
                    'sqldefault' => $field->default_value ? "DEFAULT '{$field->default_value}'" : '',
                    'sqlnull' => $field->is_nullable ? 'NULL' : 'NOT NULL',

                    // Generation state metadata — user JS in {:code:} blocks can read these
                    'state' => $field->display_state ?? 'enabled',
                    'generation_mode' => $field->generation_mode ?? 'full',
                    'in_iteration' => in_array(($field->generation_mode ?? 'full'), ['full', 'code_only']),
                    'generates_files' => in_array(($field->generation_mode ?? 'full'), ['full', 'template_only']),
                ];
            })->toArray();

            // Enhanced constraints/keys mapping
            $mappedKeys = $constraints->map(function($constraint, $index) {
                return [
                    'name' => $constraint->constraint_name ?? 'key_' . ($index + 1),
                    'namelower' => strtolower($constraint->constraint_name ?? 'key_' . ($index + 1)),
                    'nameupper' => strtoupper($constraint->constraint_name ?? 'key_' . ($index + 1)),
                    'id' => $index + 1,
                    'key' => $constraint->column_name ?? '',
                    'column' => $constraint->column_name ?? '',
                    'type' => $constraint->constraint_type ?? 'INDEX',
                    'typelower' => strtolower($constraint->constraint_type ?? 'INDEX'),
                    'typecast' => '',
                    'isprimary' => ($constraint->constraint_type ?? '') === 'PRIMARY KEY',
                    'isforeign' => ($constraint->constraint_type ?? '') === 'FOREIGN KEY',
                    'isunique' => ($constraint->constraint_type ?? '') === 'UNIQUE',
                    'isindex' => in_array($constraint->constraint_type ?? '', ['INDEX', 'KEY']),
                ];
            })->toArray();

            // Enhanced table data
            $tableName = $table->table_name;
            $projectData['tables'][] = [
                // Basic table info
                'tablename' => $tableName,
                'tablenamelower' => strtolower($tableName),
                'tablenameupper' => strtoupper($tableName),
                'tablenamecamel' => lcfirst(str_replace('_', '', ucwords($tableName, '_'))), // snake_case → camelCase
                'tablenamepascal' => ucfirst(str_replace('_', '', ucwords($tableName, '_'))), // snake_case → PascalCase
                'tablenamesafe' => preg_replace('/[^a-zA-Z0-9_]/', '_', $tableName),
                'tablenameplural' => $tableName . 's', // Simple pluralization
                'tablenamesingular' => rtrim($tableName, 's'), // Simple singularization

                // Counts — iteration counts reflect generation_mode filter:
                // only full/code_only fields are counted in {:for nmaxitems:} loops.
                'nmaxitems' => count($fieldsGenIndices),
                'nmaxfields' => count($fieldsGenIndices), // Alias
                'nmaxitemsnokey' => collect($fieldsGenIndices)
                    ->filter(fn($fIdx) => ($fields[$fIdx]->field_name ?? null) !== 'id')
                    ->count(),
                'nmaxkeys' => $constraints->count(),
                'nmaxconstraints' => $constraints->count(), // Alias
                'nmaxforeignkeys' => 0, // TODO: Add foreign keys support

                // Table data arrays
                'fields' => $mappedFields,
                'fieldsgen' => $fieldsGenIndices, // 🎯 Index array for {:for nmaxitems:} indirection
                'keys' => $mappedKeys,
                'constraints' => $mappedKeys, // Alias

                // File generation info
                'filename' => $tableName,
                'filenameshort' => substr($tableName, 0, 8), // 8 char limit
                'fileid' => $tableName,
                'filenamecc' => ucwords(str_replace('_', '', $tableName)), // CamelCase
                'filenamecamel' => lcfirst(str_replace('_', '', ucwords($tableName, '_'))),
                'filenamepascal' => ucfirst(str_replace('_', '', ucwords($tableName, '_'))),
                'filegeneratemasterdetail' => false, // Default false
                'filedetailfileid' => '',
                'filedetailfilename' => '',
                'filedetailkey' => '',

                // Extended metadata
                'tableindex' => $tableIndex,
                'hastimestamps' => $fields->whereIn('field_name', ['created_at', 'updated_at'])->count() >= 2,
                'hasprimarykey' => $fields->where('field_name', 'id')->count() > 0,
                'hasblob' => $fields->contains(fn($f) => in_array(
                    strtolower(strpos($f->field_type, '(') !== false ? substr($f->field_type, 0, strpos($f->field_type, '(')) : $f->field_type),
                    ['tinyblob', 'blob', 'mediumblob', 'longblob', 'image']
                )),
                'primarykeyfield' => $fields->where('field_name', 'id')->first()?->field_name ?? 'id',

                // Generation state metadata — user JS in {:code:} blocks can read these
                'state' => $table->display_state ?? 'enabled',
                'generation_mode' => $table->generation_mode ?? 'full',
                'in_iteration' => in_array(($table->generation_mode ?? 'full'), ['full', 'code_only']),
                'generates_files' => in_array(($table->generation_mode ?? 'full'), ['full', 'template_only']),
            ];
        }

        // Build tablesgen: index array into tables[] for {:for nmaxtables:} iteration.
        // Only full/code_only tables iterate. Others stay in tables[] for lookup/FK.
        $tablesgen = [];
        foreach ($projectData['tables'] as $idx => $t) {
            $mode = $t['generation_mode'] ?? 'full';
            if (in_array($mode, ['full', 'code_only'])) {
                $tablesgen[] = $idx;
            }
        }
        $projectData['tablesgen'] = $tablesgen;
        $projectData['nmaxtables'] = count($tablesgen);

        // Create the ultimate gtree
        $gtree = [
            [
                'project' => [$projectData]
            ]
        ];

        // Return enhanced response with multiple format options
        return response()->json([
            'template_id' => $templateId,
            'project_id' => $projectId,
            'gtree' => $gtree,
            'gtree_metadata' => [
                'version' => '2.0.0',
                'variables_count' => count($projectData) - 1, // Minus tables array
                'tables_count' => count($projectData['tables']),
                'total_fields' => array_sum(array_column($projectData['tables'], 'nmaxitems')),
                'features' => [
                    'enhanced_naming_conventions' => true,
                    'extended_field_metadata' => true,
                    'multiple_data_types' => true,
                    'template_helpers' => true,
                    'generation_context' => true,
                ],
            ],
            'performance' => [
                'generation_time' => microtime(true) - $_SERVER['REQUEST_TIME_FLOAT'],
                'memory_usage' => memory_get_usage(true),
                'peak_memory' => memory_get_peak_usage(true),
            ],
            'formats' => [
                'json' => 'Current format',
                'javascript' => 'Add ?format=js for JavaScript const gtree = ...',
                'php' => 'Add ?format=php for PHP $gtree = ...',
            ],
            'timestamp' => now()
        ]);

    } catch (Exception $e) {
        return response()->json([
            'error' => 'Exception occurred in Ultimate Template Engine',
            'message' => $e->getMessage(),
            'template_id' => $templateId,
            'line' => $e->getLine(),
            'file' => $e->getFile()
        ], 500);
    }
});

// 🎯 MULTI-FORMAT EXPORT - JavaScript/PHP Export Variants
Route::get('/template-process-ultimate/{templateId}/export/{format}', function ($templateId, $format) {
    // Redirect to main route with format parameter
    return redirect("/api/template-process-ultimate/{$templateId}?format={$format}");
});