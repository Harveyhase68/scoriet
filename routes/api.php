<?php

use App\Http\Controllers\SqlParserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TemplateController;
use App\Http\Controllers\DbSchemaController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\TeamInvitationController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\SchemaController;
use App\Http\Controllers\ProjectApplicationController;
use App\Http\Controllers\ProjectInvitationController;
use Illuminate\Support\Facades\Route;

// Manual OAuth token route for API with email verification check
use App\Http\Controllers\CustomTokenController;
Route::post('/oauth/token', [CustomTokenController::class, 'issueToken'])->name('api.oauth.token');

// Authentication Routes (public)
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    
    // Email Verification Routes
    Route::post('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])->name('api.verification.verify');
    Route::post('/email/resend', [AuthController::class, 'resendVerificationEmail'])->middleware('auth:api');
    
    // Token validation endpoint for Reset Password Modal
    Route::post('/validate-reset-token', function (\Illuminate\Http\Request $request) {
        $request->validate([
            'token' => 'required|string',
            'email' => 'required|email',
        ]);

        // Use Laravel's Password Broker to validate the token
        $status = \Illuminate\Support\Facades\Password::getRepository()->exists(
            \App\Models\User::where('email', $request->email)->first(),
            $request->token
        );

        if ($status) {
            return response()->json(['valid' => true]);
        } else {
            return response()->json(['valid' => false, 'message' => 'This password reset token is invalid.'], 400);
        }
    });
});

// Public Project Invitation Routes (token-based, no auth required)
Route::prefix('project-invitations')->name('api.project-invitations.')->group(function () {
    Route::get('/info/{token}', [ProjectInvitationController::class, 'getInvitationInfo'])->name('info');
    Route::post('/accept/{token}', [ProjectInvitationController::class, 'acceptInvitation'])->name('accept');
    Route::post('/decline/{token}', [ProjectInvitationController::class, 'declineInvitation'])->name('decline');
});

// Protected Routes (require authentication)
Route::middleware('auth:api')->group(function () {
    // User Management
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/profile/update', [AuthController::class, 'updateProfile']);
    Route::put('/profile/password', [AuthController::class, 'updatePassword']);
    Route::put('/profile/language', [AuthController::class, 'updateLanguage']);
    Route::delete('/profile/delete', [AuthController::class, 'deleteAccount']);
    Route::post('/logout', [AuthController::class, 'logout']);
    
    // User Activity
    Route::get('/user-update', [SqlParserController::class, 'parse']);
    
    // SQL Parser API
    Route::post('/sql-parse', [SqlParserController::class, 'parse']);
    Route::post('/sql-parse-and-store', [SqlParserController::class, 'parseAndStore']);
    Route::post('/sql-debug', [SqlParserController::class, 'debugParse']);
    Route::get('/schema-debug/{versionId}', [SchemaController::class, 'debugSchemaVersion']);
    Route::get('/schema-versions', [SqlParserController::class, 'getAllSchemaVersions']);
    Route::get('/schema-versions/{id}', [SqlParserController::class, 'getSchemaVersion']);
    Route::get('/schema-versions/by-name/{name}', [SqlParserController::class, 'getSchemaVersionByName']);
    
    // Template Management (for Template Management Panel)
    Route::apiResource('templates', TemplateController::class);
    Route::get('/templates/{id}/files', [TemplateController::class, 'getTemplateFiles']);
    Route::post('/templates/{id}/files', [TemplateController::class, 'addTemplateFile']);
    Route::put('/templates/{templateId}/files/{fileId}', [TemplateController::class, 'updateTemplateFile']);
    Route::delete('/templates/{templateId}/files/{fileId}', [TemplateController::class, 'deleteTemplateFile']);
    Route::get('/templates/{id}/export', [TemplateController::class, 'exportTemplate']);
    Route::post('/templates/import', [TemplateController::class, 'importTemplate']);

    // Templates API (for Project Assignment)
    Route::get('/project-templates', [App\Http\Controllers\Api\TemplateController::class, 'index']);
    Route::post('/templates/link', [App\Http\Controllers\Api\TemplateController::class, 'linkToProject']);
    Route::post('/templates/clone', [App\Http\Controllers\Api\TemplateController::class, 'cloneToProject']);
    Route::get('/projects/{project}/template-usages', [App\Http\Controllers\Api\TemplateController::class, 'projectUsages']);
    Route::delete('/template-usage', [App\Http\Controllers\Api\TemplateController::class, 'removeUsage']);
    
    // Project Template Assignments
    Route::get('/schema-versions/{id}/templates', [TemplateController::class, 'getProjectTemplates']);
    Route::post('/schema-versions/{id}/templates', [TemplateController::class, 'assignToProject']);
    Route::delete('/schema-versions/{schemaId}/templates/{templateId}', [TemplateController::class, 'removeFromProject']);

    // Template-DB Schema Dependencies Management
    Route::prefix('template-db-schema')->group(function () {
        // Global DB Schemas (public schemas from system)
        Route::get('/global-schemas', [DbSchemaController::class, 'getGlobalSchemas']);

        // DB Schema Management
        Route::get('/schemas', [DbSchemaController::class, 'index']);
        Route::get('/schemas/{id}', [DbSchemaController::class, 'show']);

        // DB Schema Dependencies
        Route::get('/schemas/{id}/templates', [DbSchemaController::class, 'getDependentTemplates']);
        Route::post('/schemas/{id}/link-template', [DbSchemaController::class, 'linkTemplate']);
        Route::delete('/schemas/{id}/templates/{templateId}', [DbSchemaController::class, 'unlinkTemplate']);

        // Template Dependencies
        Route::get('/templates/{id}/dependencies', [TemplateController::class, 'getTemplateDependencies']);
        Route::post('/templates/{id}/add-db-schema', [TemplateController::class, 'addDbSchemaDependency']);
        Route::put('/templates/{templateId}/db-schemas/{schemaId}', [TemplateController::class, 'updateDbSchemaDependency']);
        Route::delete('/templates/{templateId}/db-schemas/{schemaId}', [TemplateController::class, 'removeDbSchemaDependency']);

        // Cross-reference queries
        Route::get('/templates/by-db-schema/{schemaId}', [TemplateController::class, 'getTemplatesByDbSchema']);
    });
    
    // Projects Management
    Route::apiResource('projects', ProjectController::class);
    Route::post('/projects/{project}/restore', [ProjectController::class, 'restore']);
    Route::delete('/projects/{project}/force', [ProjectController::class, 'forceDestroy']);
    
    // Project Team Management
    Route::get('/projects/{project}/teams/available', [ProjectController::class, 'getAvailableTeams']);
    Route::get('/projects/{project}/teams/assigned', [ProjectController::class, 'getAssignedTeams']);
    Route::post('/projects/{project}/teams/assign', [ProjectController::class, 'assignTeams']);
    Route::delete('/projects/{project}/teams/{team}', [ProjectController::class, 'removeTeam']);

    // Project Member Management
    Route::get('/projects/{project}/members', [ProjectController::class, 'getProjectMembers']);
    Route::delete('/projects/{project}/members', [ProjectController::class, 'removeProjectMember']);
    Route::put('/projects/{project}/members/role', [ProjectController::class, 'updateProjectMemberRole']);

    // Teams Management - Debug Route
    Route::get('/teams-debug', function() {
        $user = Auth::user();
        return response()->json([
            'message' => 'Teams debug endpoint works',
            'user_id' => $user->id,
            'user_name' => $user->name,
            'timestamp' => now()
        ]);
    });

    
    Route::resource('teams', TeamController::class);
    Route::post('/teams/{team}/members', [TeamController::class, 'addMember']);
    Route::delete('/teams/{team}/members/{userId}', [TeamController::class, 'removeMember']);
    Route::put('/teams/{team}/members/{userId}/role', [TeamController::class, 'updateMemberRole']);
    
    // Project Schema Management
    Route::post('/projects/{project}/schemas', [ProjectController::class, 'associateSchema']);
    Route::delete('/projects/{project}/schemas/{schema}', [ProjectController::class, 'dissociateSchema']);
    Route::get('/projects/{project}/schemas', [ProjectController::class, 'getProjectSchemas']);
    Route::get('/projects/{project}/editable-schemas', [ProjectController::class, 'getEditableSchemas']);
    
    // Schema Management
    Route::apiResource('schemas', SchemaController::class);
    Route::get('/projects/{project}/available-schemas', [SchemaController::class, 'getAvailableForProject']);
    
    // Floating Schema Version Management
    Route::get('/floating-schemas/{schema}/versions', [SchemaController::class, 'getSchemaVersions']);
    Route::post('/floating-schemas/{schema}/versions', [SchemaController::class, 'createNewVersion']);
    Route::post('/floating-schemas/{schema}/create-version-and-table', [SchemaController::class, 'createVersionAndTable']);
    Route::get('/schema-versions/{version}/tables', [SchemaController::class, 'getVersionTables']);
    Route::post('/schema-versions/{version}/tables', [SchemaController::class, 'createTable']);
    Route::put('/schema-versions/{version}/tables/{table}', [SchemaController::class, 'updateTable']);
    Route::delete('/schema-versions/{version}/tables/{table}', [SchemaController::class, 'deleteTable']);
    Route::post('/schema-versions/{version}/tables/{table}/delete-with-copy', [SchemaController::class, 'deleteTableWithVersionCopy']);
    Route::put('/schema-versions/{version}/unsaved-changes', [SchemaController::class, 'markUnsavedChanges']);
    
    // Schema Designer Layout Management
    Route::post('/floating-schemas/{schema}/layouts/{versionNumber}', [SchemaController::class, 'saveLayout']);
    Route::get('/floating-schemas/{schema}/layouts/{versionNumber}', [SchemaController::class, 'getLayout']);
    
    // Team Invitations
    Route::post('/teams/{team}/invitations', [TeamInvitationController::class, 'store']);
    Route::get('/teams/{team}/invitations', [TeamInvitationController::class, 'teamInvitations']);
    Route::get('/invitations/received', [TeamInvitationController::class, 'received']);
    Route::post('/invitations/{token}/accept', [TeamInvitationController::class, 'accept']);
    Route::post('/invitations/{token}/decline', [TeamInvitationController::class, 'decline']);
    Route::delete('/teams/{team}/invitations/{invitation}', [TeamInvitationController::class, 'cancel']);
    Route::post('/teams/{team}/invitations/{invitation}/resend', [TeamInvitationController::class, 'resend']);
    
    // Project Applications & Join Codes
    Route::get('/join-code/{joinCode}', [ProjectApplicationController::class, 'getProjectByJoinCode']);
    Route::post('/project-applications', [ProjectApplicationController::class, 'apply']);
    Route::get('/projects/{project}/applications', [ProjectApplicationController::class, 'getProjectApplications']);
    Route::post('/applications/{application}/review', [ProjectApplicationController::class, 'reviewApplication']);
    Route::get('/my-applications', [ProjectApplicationController::class, 'getMyApplications']);
    
    // Project Invitations
    Route::post('/projects/{project}/invitations', [ProjectInvitationController::class, 'sendInvitation']);
    Route::get('/projects/{project}/invitations', [ProjectInvitationController::class, 'getProjectInvitations']);
    Route::delete('/projects/{project}/invitations/{invitation}', [ProjectInvitationController::class, 'cancelInvitation']);
    Route::get('/my-invitations', [ProjectInvitationController::class, 'getMyInvitations']);

    // Pending Invitation Management
    Route::get('/my-pending-invitation', [ProjectInvitationController::class, 'getMyPendingInvitation']);
    Route::post('/my-pending-invitation/accept', [ProjectInvitationController::class, 'acceptMyPendingInvitation']);
    Route::post('/my-pending-invitation/decline', [ProjectInvitationController::class, 'declineMyPendingInvitation']);
});

// DEBUG: Test route to check if ProjectApplicationController is accessible
Route::get('/test-join-code/{joinCode}', function ($joinCode) {
    return response()->json([
        'message' => 'Test route works',
        'joinCode' => $joinCode,
        'timestamp' => now()
    ]);
});

// DEBUG: Show all projects and their join codes
Route::get('/debug-projects', function () {
    $projects = \App\Models\Project::select('id', 'name', 'join_code', 'allow_join_requests', 'is_public')
                                   ->get();
    return response()->json([
        'message' => 'All projects in database',
        'projects' => $projects,
        'count' => $projects->count()
    ]);
});

// GTREE GLOBAL CACHE - Working version
Route::get('/gtree-test/{schemaVersionId}', function ($schemaVersionId) {
    try {
        $schemaTables = \App\Models\SchemaTable::where('schema_version_id', $schemaVersionId)
            ->with(['fields' => function($query) {
                $query->orderBy('field_order');
            }, 'constraints'])
            ->get();

        $projectData = [
            'projectname' => 'GlobalProject',
            'nmaxfiles' => $schemaTables->count(),
            'tables' => []
        ];

        foreach ($schemaTables as $table) {
            $fields = $table->fields;
            $constraints = $table->constraints;

            $mappedFields = $fields->map(function($field) {
                $controltype = match($field->field_type) {
                    'int', 'integer', 'bigint', 'smallint', 'tinyint' => 14,
                    'varchar', 'char' => 24,
                    'string' => 25,
                    'text', 'longtext', 'mediumtext' => 26,
                    'decimal', 'float', 'double' => 27,
                    'date' => 28,
                    'datetime', 'timestamp' => 29,
                    'boolean', 'bool', 'tinyint(1)' => 30,
                    default => 24
                };

                // Determine typecast based on field type
                $typecast = match($field->field_type) {
                    'int', 'integer', 'bigint', 'smallint', 'tinyint' => '(int)',
                    'decimal', 'float', 'double' => '(float)',
                    'boolean', 'bool', 'tinyint(1)' => '(bool)',
                    default => '' // No cast for strings, dates, etc.
                };

                return [
                    'name' => $field->field_name,
                    'type' => $field->field_type,
                    'controltype' => $controltype,
                    'typecast' => $typecast,
                    'is_nullable' => $field->is_nullable,
                    'order' => $field->field_order
                ];
            })->toArray();

            $projectData['tables'][] = [
                'tablename' => $table->table_name,
                'nmaxitems' => $fields->count(),
                'items' => $mappedFields,
                'nmaxkeys' => $constraints->count(),
                'keys' => []
            ];
        }

        $gtree = [
            [
                'project' => [$projectData]
            ]
        ];

        return response()->json([
            'schema_version_id' => $schemaVersionId,
            'gtree' => $gtree,
            'cache_info' => [
                'purpose' => 'Global gtree[] for client-side caching',
                'tables_count' => $schemaTables->count(),
                'cache_key' => "gtree_global_schema_{$schemaVersionId}"
            ],
            'timestamp' => now()
        ]);

    } catch (Exception $e) {
        return response()->json([
            'error' => 'Exception occurred',
            'message' => $e->getMessage(),
            'schema_version_id' => $schemaVersionId
        ], 500);
    }
});

// DEBUG: Test the exact same join-code logic without auth
Route::get('/debug-join-code/{joinCode}', function ($joinCode) {
    $project = \App\Models\Project::where('join_code', $joinCode)
                      ->where('allow_join_requests', true)
                      ->with(['owner', 'teams'])
                      ->first();

    return response()->json([
        'message' => 'Debug join code lookup',
        'joinCode' => $joinCode,
        'project_found' => !!$project,
        'project_id' => $project?->id,
        'project_name' => $project?->name,
        'allow_join_requests' => $project?->allow_join_requests,
        'all_projects_with_this_code' => \App\Models\Project::where('join_code', $joinCode)->get(['id', 'name', 'join_code', 'allow_join_requests'])
    ]);
});

// JavaScript-Datei ausliefern
Route::get('/js/scoriet-test.js', function () {
    $jsContent = file_get_contents(resource_path('js/scoriet-test.js'));

    return response($jsContent, 200, [
        'Content-Type' => 'application/javascript',
        'Access-Control-Allow-Origin' => '*',
        'Access-Control-Allow-Methods' => 'GET',
        'Access-Control-Allow-Headers' => 'Content-Type',
    ]);
});

// SIMPLE TEMPLATE OUTPUT - No Auth for Testing
Route::get('/template-output/{templateId}', function ($templateId) {
    try {
        // Find template with its files
        $template = \App\Models\Template::with('files')->find($templateId);

        if (!$template) {
            return response()->json([
                'error' => 'Template not found',
                'template_id' => $templateId
            ], 404);
        }

        // Output template files as-is without processing
        $output = [];
        foreach ($template->files as $file) {
            $output[] = [
                'filename' => $file->file_name,
                'content' => $file->file_content,
                'type' => $file->file_type,
                'order' => $file->file_order
            ];
        }

        return response()->json([
            'template_id' => $template->id,
            'template_name' => $template->name,
            'template_description' => $template->description,
            'files_count' => count($output),
            'files' => $output,
            'timestamp' => now()
        ]);

    } catch (Exception $e) {
        return response()->json([
            'error' => 'Exception occurred',
            'message' => $e->getMessage(),
            'template_id' => $templateId
        ], 500);
    }
});

// TEMPLATE PROCESSING ENGINE - Optimized gtree[] based on template type
Route::get('/template-process/{templateId}', function ($templateId) {
    try {
        // Find template with its files
        $template = \App\Models\Template::with('files')->find($templateId);

        if (!$template) {
            return response()->json([
                'error' => 'Template not found',
                'template_id' => $templateId
            ], 404);
        }

        // Analyze template files to determine optimization strategy
        $templateAnalysis = [
            'has_project_files' => false,
            'has_file_templates' => false,
            'has_helper_files' => false,
            'used_tables' => [],
            'file_types' => []
        ];

        foreach ($template->files as $file) {
            $templateAnalysis['file_types'][] = $file->file_type;

            // Detect template type based on content and file_type
            if (in_array($file->file_type, ['template', 'project_file'])) {
                $templateAnalysis['has_project_files'] = true;
            } elseif (in_array($file->file_type, ['model', 'controller', 'view'])) {
                $templateAnalysis['has_file_templates'] = true;
            } elseif (in_array($file->file_type, ['helper', 'config'])) {
                $templateAnalysis['has_helper_files'] = true;
            }

            // Extract specific table references (if any)
            if (preg_match_all('/\{tablename:([a-zA-Z_]+)\}/', $file->file_content, $matches)) {
                $templateAnalysis['used_tables'] = array_merge($templateAnalysis['used_tables'], $matches[1]);
            }
        }

        // Use global gtree structure from gtree-test route (optimized)
        $schemaVersionId = 1; // TODO: später dynamisch aus Project/Template-Dependencies

        // Load complete gtree for template processing (use same logic as gtree-test)
        $schemaTables = \App\Models\SchemaTable::where('schema_version_id', $schemaVersionId)
            ->with(['fields' => function($query) {
                $query->orderBy('field_order');
            }, 'constraints'])
            ->get();

        // Build gtree[] array structure (identical to gtree-test)
        $projectData = [
            'projectname' => 'TestProject',
            'nmaxfiles' => $schemaTables->count(),
            'tables' => []
        ];

        foreach ($schemaTables as $table) {
            $fields = $table->fields;
            $constraints = $table->constraints;

            $mappedFields = $fields->map(function($field) {
                $controltype = match($field->field_type) {
                    'int', 'integer', 'bigint', 'smallint', 'tinyint' => 14,
                    'varchar', 'char' => 24,
                    'string' => 25,
                    'text', 'longtext', 'mediumtext' => 26,
                    'decimal', 'float', 'double' => 27,
                    'date' => 28,
                    'datetime', 'timestamp' => 29,
                    'boolean', 'bool', 'tinyint(1)' => 30,
                    default => 24
                };

                // Determine typecast based on field type
                $typecast = match($field->field_type) {
                    'int', 'integer', 'bigint', 'smallint', 'tinyint' => '(int)',
                    'decimal', 'float', 'double' => '(float)',
                    'boolean', 'bool', 'tinyint(1)' => '(bool)',
                    default => '' // No cast for strings, dates, etc.
                };

                return [
                    'name' => $field->field_name,
                    'type' => $field->field_type,
                    'controltype' => $controltype,
                    'typecast' => $typecast,
                    'is_nullable' => $field->is_nullable,
                    'order' => $field->field_order
                ];
            })->toArray();

            $projectData['tables'][] = [
                'tablename' => $table->table_name,
                'nmaxitems' => $fields->count(),
                'items' => $mappedFields,
                'nmaxkeys' => $constraints->count(),
                'keys' => []
            ];
        }

        $gtree = [
            [
                'project' => [$projectData]
            ]
        ];

        // Generate JavaScript code per table for each template file
        $generatedFiles = [];
        $tablesCount = count($projectData['tables']);

        foreach ($template->files as $templateFile) {
            $content = $templateFile->file_content;


            // Check if template contains table-specific variables
            $hasTableSpecificContent = (
                strpos($content, '{tablename}') !== false ||
                strpos($content, '{for {nmaxitems}}') !== false ||
                strpos($content, '{item.name}') !== false ||
                strpos($content, '{item.type}') !== false ||
                strpos($content, '{item.controltype}') !== false
            );

            if ($hasTableSpecificContent) {
                // Generate one file per table
                foreach ($projectData['tables'] as $tableIndex => $table) {
                    // Simple template variable replacement for now
                    $generatedContent = $content;
                    $generatedContent = str_replace('{projectname}', $projectData['projectname'], $generatedContent);
                    $generatedContent = str_replace('{tablename}', $table['tablename'], $generatedContent);

                    // Convert template to JavaScript function that returns a string
                    $functionName = "generate" . ucfirst($templateFile->file_type) . "For" . ucfirst($table['tablename']);
                    $functionName = preg_replace('/[^a-zA-Z0-9]/', '', $functionName); // Clean function name

                    $jsFunction = "function {$functionName}() {\n";
                    $jsFunction .= "  var sContentResult = '';\n";
                    $jsFunction .= "  \n";

                    // Process template content line by line and convert to string concatenation
                    $lines = explode("\n", $generatedContent);
                    foreach ($lines as $lineIndex => $line) {
                        // Check if original line is empty or only whitespace before trimming
                        $originalLine = $line;
                        // Only trim trailing whitespace, preserve leading spaces for indentation
                        $line = rtrim($line);

                        // If original line was empty or only whitespace, treat as empty line
                        if (trim($originalLine) === '') {
                            $jsFunction .= "  sContentResult += '\\n';\n";
                            continue;
                        }

                        // Handle template loops
                        if (strpos($line, '{for %}') !== false) {
                            $jsFunction .= "  // Loop over fields\n";
                            $jsFunction .= "  for (let i = 0; i < gtree[0].project[0].tables[{$tableIndex}].nmaxitems; i++) {\n";
                            continue;
                        }

                        if (strpos($line, '{for {nmaxitems}}') !== false) {
                            $jsFunction .= "  // Loop over items\n";
                            $jsFunction .= "  for (let i = 0; i < gtree[0].project[0].tables[{$tableIndex}].nmaxitems; i++) {\n";
                            continue;
                        }

                        if (strpos($line, '{for {nmaxitemsnokey}}') !== false) {
                            $jsFunction .= "  // Loop over items (no key)\n";
                            $jsFunction .= "  for (let i = 0; i < gtree[0].project[0].tables[{$tableIndex}].nmaxitems; i++) {\n";
                            continue;
                        }

                        if (strpos($line, '{endfor}') !== false) {
                            $jsFunction .= "  }\n";
                            continue;
                        }

                        // Handle conditional statements (if/else/endif)
                        if (preg_match('/\{if\s+(.+?)\}/', $line, $matches)) {
                            $condition = trim($matches[1]);
                            // Convert template condition to JavaScript
                            $jsCondition = $condition;

                            // Replace template variables in condition
                            $jsCondition = str_replace('{item.typecast}', "gtree[0].project[0].tables[{$tableIndex}].items[i].typecast", $jsCondition);
                            $jsCondition = str_replace('{item.name}', "gtree[0].project[0].tables[{$tableIndex}].items[i].name", $jsCondition);
                            $jsCondition = str_replace('{item.type}', "gtree[0].project[0].tables[{$tableIndex}].items[i].type", $jsCondition);
                            $jsCondition = str_replace('{item.controltype}', "gtree[0].project[0].tables[{$tableIndex}].items[i].controltype", $jsCondition);

                            $jsFunction .= "  if ({$jsCondition}) {\n";
                            continue;
                        }

                        if (strpos($line, '{else}') !== false) {
                            $jsFunction .= "  } else {\n";
                            continue;
                        }

                        if (strpos($line, '{endif}') !== false) {
                            $jsFunction .= "  }\n";
                            continue;
                        }

                        // Handle switch statements
                        if (preg_match('/\{switch\s+(.+?)\}/', $line, $matches)) {
                            $switchVar = trim($matches[1]);
                            // Convert template variable to JavaScript
                            $jsSwitchVar = $switchVar;
                            $jsSwitchVar = str_replace('{item.typecast}', "gtree[0].project[0].tables[{$tableIndex}].items[i].typecast", $jsSwitchVar);
                            $jsSwitchVar = str_replace('{item.name}', "gtree[0].project[0].tables[{$tableIndex}].items[i].name", $jsSwitchVar);
                            $jsSwitchVar = str_replace('{item.type}', "gtree[0].project[0].tables[{$tableIndex}].items[i].type", $jsSwitchVar);
                            $jsSwitchVar = str_replace('{item.controltype}', "gtree[0].project[0].tables[{$tableIndex}].items[i].controltype", $jsSwitchVar);

                            $jsFunction .= "  switch ({$jsSwitchVar}) {\n";
                            continue;
                        }

                        if (preg_match('/\{case\s+(.+?)\}/', $line, $matches)) {
                            $caseValue = trim($matches[1]);
                            $jsFunction .= "    case {$caseValue}:\n";
                            continue;
                        }

                        if (strpos($line, '{break}') !== false) {
                            $jsFunction .= "      break;\n";
                            continue;
                        }

                        if (strpos($line, '{default}') !== false) {
                            $jsFunction .= "    default:\n";
                            continue;
                        }

                        if (strpos($line, '{endswitch}') !== false) {
                            $jsFunction .= "  }\n";
                            continue;
                        }

                        // Convert line to string concatenation
                        $escapedLine = addslashes($line);

                        // Handle template variables in the line
                        if (strpos($line, '{field.') !== false || strpos($line, '{item.') !== false) {
                            // This line contains field variables - needs to be inside a loop
                            $processedLine = $escapedLine;

                            // Replace field variables
                            $processedLine = str_replace('{field.name}', "' + gtree[0].project[0].tables[{$tableIndex}].items[i].name + '", $processedLine);
                            $processedLine = str_replace('{field.type}', "' + gtree[0].project[0].tables[{$tableIndex}].items[i].type + '", $processedLine);

                            // Replace item variables
                            $processedLine = str_replace('{item.name}', "' + gtree[0].project[0].tables[{$tableIndex}].items[i].name + '", $processedLine);
                            $processedLine = str_replace('{item.type}', "' + gtree[0].project[0].tables[{$tableIndex}].items[i].type + '", $processedLine);
                            $processedLine = str_replace('{item.controltype}', "' + gtree[0].project[0].tables[{$tableIndex}].items[i].controltype + '", $processedLine);
                            $processedLine = str_replace('{item.typecast}', "' + gtree[0].project[0].tables[{$tableIndex}].items[i].typecast + '", $processedLine);

                            $jsFunction .= "    sContentResult += '{$processedLine}\\n';\n";
                        } else {
                            // Static line
                            $jsFunction .= "  sContentResult += '{$escapedLine}\\n';\n";
                        }
                    }

                    $jsFunction .= "  \n";
                    $jsFunction .= "  return sContentResult;\n";
                    $jsFunction .= "}\n";

                    // Store the original content AND the JavaScript function
                    $generatedContent = $jsFunction;

                    // Clean content for better readability and replace escaped newlines with placeholders
                    $cleanContent = str_replace(['\n', '\r\n', '\r'], "\n", $generatedContent);
                    $cleanContent = preg_replace('/\n\s*\n/', "\n", $cleanContent); // Remove multiple empty lines

                    // Replace escaped \n in content with Unicode newlines to prevent JSON transmission issues
                    $generatedContent = str_replace('\\n', '\\u000A', $generatedContent);
                    $cleanContent = str_replace('\\n', '\\u000A', $cleanContent);

                    // Replace escaped \t in content with Unicode tabs to prevent JSON transmission issues
                    $generatedContent = str_replace('\\t', '\\u0009', $generatedContent);
                    $cleanContent = str_replace('\\t', '\\u0009', $cleanContent);

                    // Indent placeholder replacement is now handled in the frontend

                    $generatedFiles[] = [
                        'filename' => str_replace(['{tablename}', '{projectname}'], [$table['tablename'], $projectData['projectname']], $templateFile->file_name),
                        'output_path' => $templateFile->output_path ?? '/',
                        'content' => $generatedContent,
                        'content_clean' => $cleanContent,
                        'type' => $templateFile->file_type,
                        'table' => $table['tablename'],
                        'generated_from_template' => $templateFile->file_name,
                        'table_index' => $tableIndex,
                        'fields_count' => count($table['items']),
                        'template_variables_converted' => [
                            'projectname' => $projectData['projectname'],
                            'tablename' => $table['tablename'],
                            'loops_converted' => strpos($generatedContent, 'for (let i = 0;') !== false
                        ]
                    ];
                }
            } else {
                // Project-level file (no table-specific content)
                $generatedContent = str_replace('{projectname}', $projectData['projectname'], $content);

                // Replace escaped \n with Unicode newlines for project files too
                $generatedContent = str_replace('\\n', '\\u000A', $generatedContent);

                // Replace escaped \t with Unicode tabs for project files too
                $generatedContent = str_replace('\\t', '\\u0009', $generatedContent);

                // Indent placeholder replacement is now handled in the frontend

                $generatedFiles[] = [
                    'filename' => str_replace('{projectname}', $projectData['projectname'], $templateFile->file_name),
                    'output_path' => $templateFile->output_path ?? '/',
                    'content' => $generatedContent,
                    'type' => $templateFile->file_type,
                    'table' => null,
                    'generated_from_template' => $templateFile->file_name,
                    'is_project_file' => true
                ];
            }
        }

        return response()->json([
            'template_id' => $template->id,
            'template_name' => $template->name,
            'template_description' => $template->description,
            'generation_summary' => [
                'total_generated_files' => count($generatedFiles),
                'tables_processed' => $tablesCount,
                'project_files' => count(array_filter($generatedFiles, function($file) { return isset($file['is_project_file']); })),
                'table_specific_files' => count(array_filter($generatedFiles, function($file) { return isset($file['table']); }))
            ],
            'gtree' => $gtree,
            'generated_files' => $generatedFiles,
            'performance' => [
                'single_request' => 'All files in one JSON response',
                'no_tcp_overhead' => 'No multiple HTTP requests needed',
                'total_content_size' => array_sum(array_map(function($file) { return strlen($file['content']); }, $generatedFiles)) . ' characters'
            ],
            'client_instructions' => [
                'step1' => 'Receive complete gtree[] + all generated files in single request',
                'step2' => 'Store gtree[] in browser for future use',
                'step3' => 'Process generated files (download/display)',
                'step4' => 'Optional: Create ZIP from generated_files array'
            ],
            'timestamp' => now()
        ]);

    } catch (Exception $e) {
        return response()->json([
            'error' => 'Exception occurred',
            'message' => $e->getMessage(),
            'template_id' => $templateId
        ], 500);
    }
});
