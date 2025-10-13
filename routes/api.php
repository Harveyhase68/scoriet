<?php

use App\Http\Controllers\SqlParserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\QueueTestController;
use App\Http\Controllers\Api\TemplateController;
use App\Http\Controllers\DbSchemaController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\TeamInvitationController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\SchemaController;
use App\Http\Controllers\ProjectApplicationController;
use App\Http\Controllers\ProjectInvitationController;
use App\Http\Controllers\SchemaExportController;
use App\Http\Controllers\Api\UltimateTemplateController;
use App\Http\Controllers\Api\TranslationExportController;
use App\Http\Controllers\Api\AutoTranslateController;
use App\Services\SimpleFixedTemplateEngine;
use Illuminate\Http\Request;
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
    Route::get('/templates/check-name', [TemplateController::class, 'checkTemplateName']); // Check if name exists (MUST be before apiResource)
    Route::apiResource('templates', TemplateController::class);
    Route::delete('/templates/{template}/force', [TemplateController::class, 'forceDestroy']); // Hard delete
    Route::patch('/templates/{template}/toggle', [TemplateController::class, 'toggleActive']); // Toggle active status
    Route::post('/templates/{template}/clone', [TemplateController::class, 'cloneTemplate']); // Clone template
    Route::get('/templates/{id}/files', [TemplateController::class, 'getTemplateFiles']);
    Route::post('/templates/{id}/files', [TemplateController::class, 'addTemplateFile']);
    Route::put('/templates/{templateId}/files/{fileId}', [TemplateController::class, 'updateTemplateFile']);
    Route::delete('/templates/{templateId}/files/{fileId}', [TemplateController::class, 'deleteTemplateFile']);
    Route::get('/templates/{id}/export', [TemplateController::class, 'exportTemplate']);
    Route::post('/templates/import', [TemplateController::class, 'importTemplate']);

    // Templates API (for Project Assignment)
    Route::get('/project-templates', [App\Http\Controllers\Api\TemplateController::class, 'index']);

    // 🚀 ULTIMATE TEMPLATE ENGINE - Enhanced template processing with 50+ variables
    Route::get('/ultimate-template/{templateId}', [UltimateTemplateController::class, 'processTemplate'])
        ->name('api.ultimate-template.process');
    Route::get('/ultimate-template/{templateId}/export/{format}', [UltimateTemplateController::class, 'processTemplate'])
        ->where('format', 'json|js|javascript|php')
        ->name('api.ultimate-template.export');

    // 🔧 TEMPLATE FIX DEMO - Show corrected template processing
    Route::get('/template-fix-demo', function () {
        return response()->json([
            'fixed_template' => \App\Services\TemplateFixService::demoFixedTemplate(),
            'message' => 'This shows how the template should be processed correctly',
            'original_issue' => 'The loop was not properly closed and variables not replaced',
            'fixed_issues' => [
                'Loop properly processes all items',
                'Variables are correctly replaced',
                'Syntax is clean and valid PHP'
            ]
        ]);
    });

    // 🎯 SIMPLE TEMPLATE ENGINE DEMO - Löst dein SQL-Problem
    Route::get('/simple-template-demo', function () {
        return response()->json([
            'generated_javascript' => \App\Services\SimpleTemplateEngine::fixYourSqlProblem(),
            'message' => 'Simple Template Engine - KEINE REGEX, wartbar und stabil',
            'your_problem_solved' => [
                '{filekeyname} wird korrekt zu accl_id',
                'Keine verschachtelten Konstrukte in einer Zeile',
                'Loops werden sauber geschlossen',
                'Kein Regex - nur einfache string operations'
            ],
            'features' => [
                'Zeile-für-Zeile Verarbeitung',
                'Einfache Variable-Replacement',
                'Wartbarer Code ohne Regex',
                'Sichere JavaScript-Escaping'
            ]
        ]);
    });

    // 🔧 STEP-BY-STEP ENGINE DEMO - Löst dein Geister-} Problem
    Route::get('/step-by-step-demo', function () {
        return response()->json(\App\Services\StepByStepTemplateEngine::solveSqlProblemStepByStep());
    });

    // 🎯 SIMPLE FIXED ENGINE - Folgt GENAU deinem Vorschlag
    Route::get('/simple-fixed-demo', function () {
        return response()->json(\App\Services\SimpleFixedTemplateEngine::solvYourExactProblem());
    });

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
        Route::get('/templates/{template}/dependencies', [TemplateController::class, 'getTemplateDependencies']);
        Route::post('/templates/{template}/add-db-schema', [TemplateController::class, 'addDbSchemaDependency']);
        Route::put('/templates/{templateId}/db-schemas/{schemaId}', [TemplateController::class, 'updateDbSchemaDependency']);
        Route::delete('/templates/{template}/db-schemas/{schemaId}', [TemplateController::class, 'removeDbSchemaDependency']);

        // Cross-reference queries
        Route::get('/templates/by-db-schema/{schemaId}', [TemplateController::class, 'getTemplatesByDbSchema']);
    });
    
    // 🧪 Queue Testing Routes
    Route::prefix('queue-test')->group(function () {
        Route::get('/test', [QueueTestController::class, 'testQueueSystem']);
        Route::get('/logs', [QueueTestController::class, 'showQueueLogs']);
        Route::post('/dispatch/{projectId}', [QueueTestController::class, 'dispatchJobForProject']);
    });
    
    // Optimized Projects with Teams route (use different path to avoid conflicts)
    Route::get('/projects-with-teams', [ProjectController::class, 'getProjectsWithTeams']);

    // Projects Management
    Route::apiResource('projects', ProjectController::class);
    Route::post('/projects/{project}/restore', [ProjectController::class, 'restore']);
    Route::delete('/projects/{project}/force', [ProjectController::class, 'forceDestroy']);

    // User Projects (including team access)
    Route::get('/user/projects', [ProjectController::class, 'getUserProjects']);

    // Project Generation Tree
    Route::get('/projects/{project}/generation-tree', [ProjectController::class, 'getGenerationTree']);
    Route::post('/projects/{project}/generation-tree/regenerate', [ProjectController::class, 'regenerateTree']);
    
    // Project Team Management
    Route::get('/projects/{project}/teams/available', [ProjectController::class, 'getAvailableTeams']);
    Route::get('/projects/{project}/teams/assigned', [ProjectController::class, 'getAssignedTeams']);
    Route::post('/projects/{project}/teams/assign', [ProjectController::class, 'assignTeams']);
    Route::delete('/projects/{project}/teams/{team}', [ProjectController::class, 'removeTeam']);

    // Project Member Management
    Route::get('/projects/{project}/members', [ProjectController::class, 'getProjectMembers']);
    Route::delete('/projects/{project}/members', [ProjectController::class, 'removeProjectMember']);
    Route::put('/projects/{project}/members/role', [ProjectController::class, 'updateProjectMemberRole']);

    // Project Settings
    Route::get('/projects/{project}/settings', [ProjectController::class, 'getSettings']);
    Route::put('/projects/{project}/settings', [ProjectController::class, 'updateSettings']);

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
    Route::get('/teams/{team}/members', [TeamController::class, 'getMembers']);
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

    // Schema Export API - NEW! Uses real table data from schema_tables + schema_fields
    Route::get('/schemas/{schema}/export', [SchemaExportController::class, 'exportSchema']);
    Route::get('/schemas/{schema}/export/mysql', [SchemaExportController::class, 'exportAsMySQL']);
    Route::get('/schemas/{schema}/table-count', [SchemaExportController::class, 'getTableCount']);


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

    // Language Management (System Admin Only)
    Route::apiResource('languages', \App\Http\Controllers\Api\LanguageController::class);
    Route::patch('/languages/{language}/toggle-active', [\App\Http\Controllers\Api\LanguageController::class, 'toggleActive']);
    Route::patch('/languages/{language}/set-default', [\App\Http\Controllers\Api\LanguageController::class, 'setDefault']);

    // Public endpoint for active languages (available to all users)
    Route::get('/active-languages', [\App\Http\Controllers\Api\LanguageController::class, 'getActiveLanguages']);

    // System Settings (System Admin Only)
    Route::get('/settings', [\App\Http\Controllers\Api\SettingsController::class, 'show']);
    Route::put('/settings', [\App\Http\Controllers\Api\SettingsController::class, 'update']);

    // Schema Translation Management
    Route::apiResource('schema-translations', \App\Http\Controllers\Api\SchemaTranslationController::class);
    Route::patch('/schema-translations/{schemaTranslation}/toggle-active', [\App\Http\Controllers\Api\SchemaTranslationController::class, 'toggleActive']);
    Route::get('/schema-available-items', [\App\Http\Controllers\Api\SchemaTranslationController::class, 'getAvailableItems']);
    Route::get('/schema-translation', [\App\Http\Controllers\Api\SchemaTranslationController::class, 'getTranslation']);
    Route::get('/schema-translations/item/{itemName}', [\App\Http\Controllers\Api\SchemaTranslationController::class, 'getItemTranslations']);
    Route::post('/schema-translations/bulk-update', [\App\Http\Controllers\Api\SchemaTranslationController::class, 'bulkUpdate']);

    // Translation Export/Import
    Route::get('/translations/export', [\App\Http\Controllers\Api\TranslationExportController::class, 'export']);
    Route::post('/translations/import', [\App\Http\Controllers\Api\TranslationExportController::class, 'import']);

    // Auto-Translate
    Route::post('/translations/auto-translate', [\App\Http\Controllers\Api\AutoTranslateController::class, 'translate']);
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

// DEBUG: Test SchemaExportController without auth - REAL DATA (keep for debugging)
Route::get('/debug-schema-export/{schema}', [SchemaExportController::class, 'debug']);

// TEMPORARY: Debug specific export issue
Route::get('/debug-export-error/{schema}', function($schema) {
    try {
        $version = request()->input('version', 1);

        // Mirror the exact production logic
        $schemaModel = \App\Models\FloatingSchema::findOrFail($schema);

        // Find the correct schema_version_id
        $schemaVersion = \Illuminate\Support\Facades\DB::table('schema_versions')
            ->where('schema_id', $schema)
            ->where('version_number', $version)
            ->first();

        if (!$schemaVersion) {
            return response()->json([
                'error' => 'Schema version not found',
                'schema_id' => $schema,
                'requested_version' => $version,
                'available_versions' => \Illuminate\Support\Facades\DB::table('schema_versions')
                    ->where('schema_id', $schema)
                    ->select('id', 'version_number', 'version_name')
                    ->get()
            ], 404);
        }

        // Get tables with full debugging info
        $tables = \App\Models\SchemaTable::with([
            'fields' => function($query) {
                $query->orderBy('field_order');
            },
            'constraints.constraintColumns.field',
            'constraints.foreignKeyReference.referenceColumns.referencedField'
        ])
        ->where(function($query) use ($schema, $schemaVersion) {
            $query->where('schema_id', $schema)
                  ->orWhere('schema_version_id', $schemaVersion->id);
        })
        ->orderBy('table_name')
        ->get();

        // Try to generate SQL to see where it fails
        try {
            $controller = app(\App\Http\Controllers\SchemaExportController::class);
            $reflection = new ReflectionClass($controller);
            $method = $reflection->getMethod('generateMySQLScript');
            $method->setAccessible(true);
            $sql = $method->invoke($controller, $schemaModel, $tables, $schemaVersion->version_number);

            return response()->json([
                'success' => true,
                'schema' => $schemaModel,
                'schema_version' => $schemaVersion,
                'tables_count' => $tables->count(),
                'table_names' => $tables->pluck('table_name')->take(10),
                'sql_generation' => 'SUCCESS',
                'sql_length' => strlen($sql),
                'sql_preview' => substr($sql, 0, 500) . '...'
            ]);

        } catch (\Exception $sqlError) {
            return response()->json([
                'success' => false,
                'schema' => $schemaModel,
                'schema_version' => $schemaVersion,
                'tables_count' => $tables->count(),
                'sql_generation_error' => $sqlError->getMessage(),
                'sql_trace' => $sqlError->getTraceAsString()
            ], 500);
        }

    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Debug failed: ' . $e->getMessage(),
            'trace' => $e->getTraceAsString(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ], 500);
    }
});

// DEBUG: Raw SQL constraint column test
Route::get('/debug-raw-constraints/{schema}', function($schema) {
    try {
        // Get first constraint from primaPOS
        $constraint = \Illuminate\Support\Facades\DB::table('schema_constraints')
            ->join('schema_tables', 'schema_constraints.table_id', '=', 'schema_tables.id')
            ->where('schema_tables.schema_version_id', 3)
            ->select('schema_constraints.*', 'schema_tables.table_name')
            ->first();

        if (!$constraint) {
            return response()->json(['error' => 'No constraints found']);
        }

        // Try the RAW SQL approach
        $constraintColumns = \Illuminate\Support\Facades\DB::table('schema_constraint_columns')
            ->join('schema_fields', 'schema_constraint_columns.field_id', '=', 'schema_fields.id')
            ->where('schema_constraint_columns.constraint_id', $constraint->id)
            ->orderBy('schema_constraint_columns.column_order')
            ->get(['schema_fields.field_name', 'schema_constraint_columns.*']);

        return response()->json([
            'constraint' => $constraint,
            'raw_sql_columns' => $constraintColumns,
            'column_names' => $constraintColumns->pluck('field_name')->toArray(),
            'raw_sql_works' => $constraintColumns->count() > 0
        ]);

    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()]);
    }
});

// Debug specific constraint column data
Route::get('/debug-specific-constraint/{constraintId}', function($constraintId) {
    try {
        $constraint = \App\Models\SchemaConstraint::findOrFail($constraintId);

        // Raw SQL check for constraint columns
        $rawColumns = \Illuminate\Support\Facades\DB::table('schema_constraint_columns')
            ->join('schema_fields', 'schema_constraint_columns.field_id', '=', 'schema_fields.id')
            ->where('schema_constraint_columns.constraint_id', $constraintId)
            ->select('schema_constraint_columns.*', 'schema_fields.field_name')
            ->get();

        return response()->json([
            'constraint_id' => $constraintId,
            'constraint_name' => $constraint->constraint_name,
            'constraint_type' => $constraint->constraint_type,
            'table_id' => $constraint->table_id,
            'raw_column_count' => $rawColumns->count(),
            'raw_columns' => $rawColumns->toArray()
        ]);

    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
});

// Debug project join codes
Route::get('/debug-projects-join-codes', function() {
    try {
        $projects = \App\Models\Project::select('id', 'name', 'join_code', 'allow_join_requests', 'is_public', 'is_active')
            ->where('is_active', true)
            ->get();

        return response()->json([
            'projects' => $projects->map(function($project) {
                return [
                    'id' => $project->id,
                    'name' => $project->name,
                    'join_code' => $project->join_code,
                    'allow_join_requests' => $project->allow_join_requests,
                    'is_public' => $project->is_public,
                    'is_active' => $project->is_active,
                    'should_be_findable' => $project->join_code && $project->allow_join_requests
                ];
            })
        ]);
    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
});

// Debug constraint column data for both versions
Route::get('/debug-constraint-columns/{schema}', function($schema) {
    try {
        // Get Version 1 data
        $version1 = \App\Models\SchemaVersion::where('schema_id', $schema)
            ->where('version_number', 1)
            ->first();

        // Get Version 2 data
        $version2 = \App\Models\SchemaVersion::where('schema_id', $schema)
            ->where('version_number', 2)
            ->first();

        // Get Version 3 data
        $version3 = \App\Models\SchemaVersion::where('schema_id', $schema)
            ->where('version_number', 3)
            ->first();

        $debug = [
            'schema_id' => $schema,
            'version1' => null,
            'version2' => null,
            'version3' => null
        ];

        if ($version1) {
            $v1Tables = \App\Models\SchemaTable::where('schema_version_id', $version1->id)->count();
            $v1Constraints = \App\Models\SchemaConstraint::whereIn('table_id',
                \App\Models\SchemaTable::where('schema_version_id', $version1->id)->pluck('id')
            )->count();

            // Sample a few constraints to check column data
            $sampleConstraints = \App\Models\SchemaConstraint::whereIn('table_id',
                \App\Models\SchemaTable::where('schema_version_id', $version1->id)->pluck('id')
            )->take(5)->get();

            $constraintSamples = [];
            foreach ($sampleConstraints as $constraint) {
                $columnCount = \Illuminate\Support\Facades\DB::table('schema_constraint_columns')
                    ->where('constraint_id', $constraint->id)
                    ->count();
                $constraintSamples[] = [
                    'id' => $constraint->id,
                    'name' => $constraint->constraint_name,
                    'type' => $constraint->constraint_type,
                    'column_count' => $columnCount
                ];
            }

            $debug['version1'] = [
                'schema_version_id' => $version1->id,
                'table_count' => $v1Tables,
                'constraint_count' => $v1Constraints,
                'constraint_samples' => $constraintSamples
            ];
        }

        if ($version2) {
            $v2Tables = \App\Models\SchemaTable::where('schema_version_id', $version2->id)->count();
            $v2Constraints = \App\Models\SchemaConstraint::whereIn('table_id',
                \App\Models\SchemaTable::where('schema_version_id', $version2->id)->pluck('id')
            )->count();

            // Sample a few constraints to check column data
            $sampleConstraints = \App\Models\SchemaConstraint::whereIn('table_id',
                \App\Models\SchemaTable::where('schema_version_id', $version2->id)->pluck('id')
            )->take(5)->get();

            $constraintSamples = [];
            foreach ($sampleConstraints as $constraint) {
                $columnCount = \Illuminate\Support\Facades\DB::table('schema_constraint_columns')
                    ->where('constraint_id', $constraint->id)
                    ->count();
                $constraintSamples[] = [
                    'id' => $constraint->id,
                    'name' => $constraint->constraint_name,
                    'type' => $constraint->constraint_type,
                    'column_count' => $columnCount
                ];
            }

            $debug['version2'] = [
                'schema_version_id' => $version2->id,
                'table_count' => $v2Tables,
                'constraint_count' => $v2Constraints,
                'constraint_samples' => $constraintSamples
            ];
        }

        if ($version3) {
            $v3Tables = \App\Models\SchemaTable::where('schema_version_id', $version3->id)->count();
            $v3Constraints = \App\Models\SchemaConstraint::whereIn('table_id',
                \App\Models\SchemaTable::where('schema_version_id', $version3->id)->pluck('id')
            )->count();

            // Sample a few constraints to check column data
            $sampleConstraints = \App\Models\SchemaConstraint::whereIn('table_id',
                \App\Models\SchemaTable::where('schema_version_id', $version3->id)->pluck('id')
            )->take(5)->get();

            $constraintSamples = [];
            foreach ($sampleConstraints as $constraint) {
                $columnCount = \Illuminate\Support\Facades\DB::table('schema_constraint_columns')
                    ->where('constraint_id', $constraint->id)
                    ->count();
                $constraintSamples[] = [
                    'id' => $constraint->id,
                    'name' => $constraint->constraint_name,
                    'type' => $constraint->constraint_type,
                    'column_count' => $columnCount
                ];
            }

            $debug['version3'] = [
                'schema_version_id' => $version3->id,
                'table_count' => $v3Tables,
                'constraint_count' => $v3Constraints,
                'constraint_samples' => $constraintSamples
            ];
        }

        return response()->json($debug);

    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()], 500);
    }
});

// NEW: Working MySQL export with constraints - FRESH ROUTE
Route::get('/temp-mysql-export-fixed/{schema}', function($schema) {
    try {
        $version = request()->input('version', 1);

        $schemaModel = \App\Models\FloatingSchema::findOrFail($schema);

        // Find the correct schema_version_id
        $schemaVersion = \Illuminate\Support\Facades\DB::table('schema_versions')
            ->where('schema_id', $schema)
            ->where('version_number', $version)
            ->first();

        if (!$schemaVersion) {
            return response()->json([
                'success' => false,
                'error' => 'No version found for this schema',
            ], 404);
        }

        // Get all tables with proper eager loading - FIXED: Use exact same logic as debug route
        $tables = \App\Models\SchemaTable::with([
            'fields' => function($query) {
                $query->orderBy('field_order');
            },
            'constraints'  // Simple constraint loading, we'll do raw SQL for columns
        ])
        ->where('schema_version_id', $schemaVersion->id)  // FIXED: Only use schema_version_id like debug route
        ->orderBy('table_name')
        ->get();

        // DEBUG: Log which constraints we're actually loading AND check constraint columns
        \Log::info("Loading tables for schema_version_id: {$schemaVersion->id} (version_number: {$schemaVersion->version_number})");
        $firstTable = $tables->first();
        if ($firstTable && $firstTable->constraints->first()) {
            $firstConstraint = $firstTable->constraints->first();
            \Log::info("First table: {$firstTable->table_name}, first constraint ID: {$firstConstraint->id}");

            // Test if this constraint has columns using our working raw SQL
            $testColumns = \Illuminate\Support\Facades\DB::table('schema_constraint_columns')
                ->where('constraint_id', $firstConstraint->id)
                ->count();
            \Log::info("First constraint has {$testColumns} columns in database");
        }

        if ($tables->isEmpty()) {
            return response()->json([
                'success' => false,
                'error' => 'No tables found in this schema',
            ], 404);
        }

        // Check for data integrity issues BEFORE generating SQL
        $totalConstraintsInSchema = 0;
        $brokenConstraints = 0;
        foreach ($tables as $table) {
            foreach ($table->constraints as $constraint) {
                $totalConstraintsInSchema++;
                $columnCount = \Illuminate\Support\Facades\DB::table('schema_constraint_columns')
                    ->where('constraint_id', $constraint->id)
                    ->count();
                if ($columnCount == 0) {
                    $brokenConstraints++;
                }
            }
        }

        $constraintIntegrityCheck = [
            'total_constraints' => $totalConstraintsInSchema,
            'total_broken' => $brokenConstraints
        ];

        // Generate MySQL SQL script with working constraints
        $lines = [];
        $lines[] = '-- MySQL Database Export';
        $lines[] = '-- Schema: ' . $schemaModel->name;
        $lines[] = '-- Version: ' . $schemaVersion->version_number . ($schemaVersion->version_name ? ' (' . $schemaVersion->version_name . ')' : '');
        $lines[] = '-- Generated: ' . now()->format('Y-m-d H:i:s');

        // Add data integrity warnings if found
        if ($constraintIntegrityCheck['total_broken'] > 0) {
            $lines[] = '-- WARNING: Data integrity issues detected!';
            $lines[] = '-- ' . $constraintIntegrityCheck['total_broken'] . ' constraints have missing column data';
            $lines[] = '-- These constraints will be skipped from export';
            $lines[] = '-- Consider re-parsing this schema version or contact support';
        }

        $lines[] = '';
        $lines[] = 'SET FOREIGN_KEY_CHECKS = 0;';
        $lines[] = '';

        $totalConstraints = 0;

        foreach ($tables as $table) {
            $lines[] = '-- Table structure for table `' . $table->table_name . '`';
            $lines[] = 'DROP TABLE IF EXISTS `' . $table->table_name . '`;';
            $lines[] = 'CREATE TABLE `' . $table->table_name . '` (';

            // Add field definitions
            $fieldLines = [];
            foreach ($table->fields as $field) {
                $fieldDef = '  `' . $field->field_name . '` ' . strtoupper($field->field_type);

                if ($field->field_length && !in_array(strtolower($field->field_type), ['text', 'longtext', 'mediumtext', 'tinytext'])) {
                    if ($field->field_scale && in_array(strtolower($field->field_type), ['decimal', 'numeric', 'float', 'double'])) {
                        $fieldDef .= '(' . $field->field_length . ',' . $field->field_scale . ')';
                    } else {
                        $fieldDef .= '(' . $field->field_length . ')';
                    }
                }

                if (!$field->is_nullable) {
                    $fieldDef .= ' NOT NULL';
                }

                if ($field->field_default !== null) {
                    if (in_array(strtolower($field->field_type), ['varchar', 'char', 'text', 'longtext', 'mediumtext', 'tinytext'])) {
                        $fieldDef .= ' DEFAULT \'' . addslashes($field->field_default) . '\'';
                    } else {
                        $fieldDef .= ' DEFAULT ' . $field->field_default;
                    }
                }

                $fieldLines[] = $fieldDef;
            }

            // Add constraint definitions using WORKING Raw SQL approach
            $constraintLines = [];

            foreach ($table->constraints as $constraint) {
                // DEBUG: Log each constraint processing
                \Log::info("Processing constraint ID {$constraint->id} for table {$table->table_name}");

                // Use the PROVEN working Raw SQL approach
                $constraintColumns = \Illuminate\Support\Facades\DB::table('schema_constraint_columns')
                    ->join('schema_fields', 'schema_constraint_columns.field_id', '=', 'schema_fields.id')
                    ->where('schema_constraint_columns.constraint_id', $constraint->id)
                    ->orderBy('schema_constraint_columns.column_order')
                    ->get(['schema_fields.field_name']);

                \Log::info("Found {$constraintColumns->count()} columns for constraint {$constraint->id}");

                if ($constraintColumns->isEmpty()) {
                    \Log::info("Skipping constraint {$constraint->id} - no columns found");
                    continue; // Skip constraints without columns
                }

                $columnNames = $constraintColumns->pluck('field_name')->toArray();
                $totalConstraints++;

                switch (strtoupper($constraint->constraint_type)) {
                    case 'PRIMARY':
                    case 'PRIMARY KEY':
                        $constraintLines[] = '  PRIMARY KEY (`' . implode('`, `', $columnNames) . '`)';
                        break;

                    case 'UNIQUE':
                        $constraintName = $constraint->constraint_name ?: 'unique_' . $table->table_name . '_' . implode('_', $columnNames);
                        $constraintLines[] = '  UNIQUE KEY `' . $constraintName . '` (`' . implode('`, `', $columnNames) . '`)';
                        break;

                    case 'INDEX':
                    case 'KEY':
                        $constraintName = $constraint->constraint_name ?: 'idx_' . $table->table_name . '_' . implode('_', $columnNames);
                        $constraintLines[] = '  KEY `' . $constraintName . '` (`' . implode('`, `', $columnNames) . '`)';
                        break;

                    case 'FOREIGN KEY':
                        // For now, simplified foreign key - we'll improve this later
                        $constraintName = $constraint->constraint_name ?: 'fk_' . $table->table_name . '_' . implode('_', $columnNames);
                        $constraintLines[] = '  CONSTRAINT `' . $constraintName . '` FOREIGN KEY (`' . implode('`, `', $columnNames) . '`) REFERENCES `referenced_table` (`referenced_column`)';
                        break;
                }
            }

            // Combine fields and constraints
            $allLines = array_merge($fieldLines, $constraintLines);
            $lines[] = implode(",\n", $allLines);
            $lines[] = ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;';
            $lines[] = '';
        }

        $lines[] = 'SET FOREIGN_KEY_CHECKS = 1;';
        $lines[] = '';
        $lines[] = '-- Export completed successfully';
        $lines[] = '-- Total tables exported: ' . $tables->count();
        $lines[] = '-- Total constraints exported: ' . $totalConstraints;

        $sql = implode("\n", $lines);

        return response()->json([
            'success' => true,
            'sql' => $sql,
            'schema_name' => $schemaModel->name,
            'version' => $schemaVersion->version_number,
            'version_name' => $schemaVersion->version_name,
            'table_count' => $tables->count(),
            'constraint_count' => $totalConstraints,
            'constraint_integrity' => [
                'total_constraints_in_schema' => $constraintIntegrityCheck['total_constraints'],
                'constraints_with_missing_columns' => $constraintIntegrityCheck['total_broken'],
                'constraints_exported' => $totalConstraints,
                'has_integrity_issues' => $constraintIntegrityCheck['total_broken'] > 0
            ],
            'generated_at' => now()->toISOString(),
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => 'Export failed: ' . $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
});

// DEBUG: Constraint relationship issue
Route::get('/debug-constraints/{schema}', function($schema) {
    try {
        // Find a specific constraint from primaPOS
        $constraint = \App\Models\SchemaConstraint::whereHas('table', function($query) use ($schema) {
            $query->where('schema_id', $schema)->orWhere('schema_version_id', 3);
        })->first();

        if (!$constraint) {
            return response()->json(['error' => 'No constraints found']);
        }

        // Check relationship
        $constraintColumns = $constraint->constraintColumns;
        $constraintColumnsCount = $constraintColumns->count();

        // Raw query check
        $rawConstraintColumns = \Illuminate\Support\Facades\DB::table('schema_constraint_columns')
            ->where('constraint_id', $constraint->id)
            ->get();

        return response()->json([
            'constraint_id' => $constraint->id,
            'constraint_name' => $constraint->constraint_name,
            'constraint_type' => $constraint->constraint_type,
            'eloquent_relationship_count' => $constraintColumnsCount,
            'raw_query_count' => $rawConstraintColumns->count(),
            'eloquent_columns' => $constraintColumns->take(3),
            'raw_columns' => $rawConstraintColumns->take(3),
            'relationship_issue' => $constraintColumnsCount !== $rawConstraintColumns->count()
        ]);

    } catch (\Exception $e) {
        return response()->json(['error' => $e->getMessage()]);
    }
});

// TEMPORARY: Full MySQL export without auth for testing
Route::get('/temp-mysql-export/{schema}', function($schema) {
    try {
        $version = request()->input('version', 1);

        $schemaModel = \App\Models\FloatingSchema::findOrFail($schema);

        // Find the correct schema_version_id
        $schemaVersion = \Illuminate\Support\Facades\DB::table('schema_versions')
            ->where('schema_id', $schema)
            ->where('version_number', $version)
            ->first();

        if (!$schemaVersion) {
            return response()->json([
                'success' => false,
                'error' => 'No version found for this schema',
            ], 404);
        }

        // Get all tables - FIXED: Load constraint columns properly
        $tables = \App\Models\SchemaTable::with([
            'fields' => function($query) {
                $query->orderBy('field_order');
            },
            'constraints' => function($query) {
                $query->with([
                    'constraintColumns' => function($query) {
                        $query->with('field')->orderBy('column_order');
                    },
                    'foreignKeyReference.referenceColumns.referencedField'
                ]);
            }
        ])
        ->where(function($query) use ($schema, $schemaVersion) {
            $query->where('schema_id', $schema)
                  ->orWhere('schema_version_id', $schemaVersion->id);
        })
        ->orderBy('table_name')
        ->get();

        if ($tables->isEmpty()) {
            return response()->json([
                'success' => false,
                'error' => 'No tables found in this schema',
            ], 404);
        }

        // DEBUG: Check constraints before SQL generation - ENHANCED
        $constraintDebug = [];
        foreach ($tables as $table) {
            $constraintDebug[$table->table_name] = [
                'constraint_count' => $table->constraints->count(),
                'constraints' => $table->constraints->map(function($constraint) {
                    // Force reload constraintColumns to check if relationship works
                    $constraint->load('constraintColumns.field');
                    return [
                        'name' => $constraint->constraint_name,
                        'type' => $constraint->constraint_type,
                        'columns_count' => $constraint->constraintColumns->count(),
                        'first_column' => $constraint->constraintColumns->first() ? $constraint->constraintColumns->first()->field?->field_name : 'NO_FIELD'
                    ];
                })
            ];
        }

        // Generate MySQL SQL script - DIRECT IMPLEMENTATION
        $lines = [];
        $lines[] = '-- MySQL Database Export';
        $lines[] = '-- Schema: ' . $schemaModel->name;
        $lines[] = '-- Version: ' . $schemaVersion->version_number . ($schemaVersion->version_name ? ' (' . $schemaVersion->version_name . ')' : '');
        $lines[] = '-- Generated: ' . now()->format('Y-m-d H:i:s');
        $lines[] = '';
        $lines[] = 'SET FOREIGN_KEY_CHECKS = 0;';
        $lines[] = '';

        foreach ($tables as $table) {
            $lines[] = '-- Table structure for table `' . $table->table_name . '`';
            $lines[] = 'DROP TABLE IF EXISTS `' . $table->table_name . '`;';
            $lines[] = 'CREATE TABLE `' . $table->table_name . '` (';

            // Add field definitions
            $fieldLines = [];
            foreach ($table->fields as $field) {
                $fieldDef = '  `' . $field->field_name . '` ' . strtoupper($field->field_type);

                if ($field->field_length && !in_array(strtolower($field->field_type), ['text', 'longtext', 'mediumtext', 'tinytext'])) {
                    if ($field->field_scale && in_array(strtolower($field->field_type), ['decimal', 'numeric', 'float', 'double'])) {
                        $fieldDef .= '(' . $field->field_length . ',' . $field->field_scale . ')';
                    } else {
                        $fieldDef .= '(' . $field->field_length . ')';
                    }
                }

                if (!$field->is_nullable) {
                    $fieldDef .= ' NOT NULL';
                }

                if ($field->field_default !== null) {
                    if (in_array(strtolower($field->field_type), ['varchar', 'char', 'text', 'longtext', 'mediumtext', 'tinytext'])) {
                        $fieldDef .= ' DEFAULT \'' . addslashes($field->field_default) . '\'';
                    } else {
                        $fieldDef .= ' DEFAULT ' . $field->field_default;
                    }
                }

                $fieldLines[] = $fieldDef;
            }

            // Add constraint definitions - SIMPLE DIRECT APPROACH
            $constraintLines = [];

            // Get constraint columns directly from database - bypass Eloquent
            foreach ($table->constraints as $constraint) {
                $constraintColumns = \Illuminate\Support\Facades\DB::table('schema_constraint_columns')
                    ->join('schema_fields', 'schema_constraint_columns.field_id', '=', 'schema_fields.id')
                    ->where('schema_constraint_columns.constraint_id', $constraint->id)
                    ->orderBy('schema_constraint_columns.column_order')
                    ->get(['schema_fields.field_name']);

                if ($constraintColumns->isEmpty()) {
                    continue; // Skip constraints without columns
                }

                $columnNames = $constraintColumns->pluck('field_name')->toArray();

                switch (strtoupper($constraint->constraint_type)) {
                    case 'PRIMARY':
                    case 'PRIMARY KEY':
                        $constraintLines[] = '  PRIMARY KEY (`' . implode('`, `', $columnNames) . '`)';
                        break;

                    case 'UNIQUE':
                        $constraintName = $constraint->constraint_name ?: 'unique_' . $table->table_name . '_' . implode('_', $columnNames);
                        $constraintLines[] = '  UNIQUE KEY `' . $constraintName . '` (`' . implode('`, `', $columnNames) . '`)';
                        break;

                    case 'INDEX':
                    case 'KEY':
                        $constraintName = $constraint->constraint_name ?: 'idx_' . $table->table_name . '_' . implode('_', $columnNames);
                        $constraintLines[] = '  KEY `' . $constraintName . '` (`' . implode('`, `', $columnNames) . '`)';
                        break;

                    case 'FOREIGN KEY':
                        // Handle foreign keys - simplified for now
                        $constraintName = $constraint->constraint_name ?: 'fk_' . $table->table_name . '_' . implode('_', $columnNames);
                        $constraintLines[] = '  CONSTRAINT `' . $constraintName . '` FOREIGN KEY (`' . implode('`, `', $columnNames) . '`) REFERENCES `referenced_table` (`referenced_column`)';
                        break;
                }
            }

            // Combine fields and constraints
            $allLines = array_merge($fieldLines, $constraintLines);
            $lines[] = implode(",\n", $allLines);
            $lines[] = ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;';
            $lines[] = '';
        }

        $lines[] = 'SET FOREIGN_KEY_CHECKS = 1;';
        $lines[] = '';
        $lines[] = '-- Export completed successfully';
        $lines[] = '-- Total tables exported: ' . $tables->count();

        $sql = implode("\n", $lines);

        return response()->json([
            'success' => true,
            'sql' => $sql,
            'schema_name' => $schemaModel->name,
            'version' => $schemaVersion->version_number,
            'version_name' => $schemaVersion->version_name,
            'table_count' => $tables->count(),
            'constraint_debug' => $constraintDebug,
            'generated_at' => now()->toISOString(),
        ]);

    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => 'Export failed: ' . $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
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

            // Map constraints/keys for template variables
            $mappedKeys = $constraints->map(function($constraint, $index) {
                return [
                    'name' => $constraint->constraint_name ?? 'key_' . ($index + 1),
                    'id' => $index + 1,
                    'key' => $constraint->column_name ?? '',
                    'type' => $constraint->constraint_type ?? 'INDEX',
                    'typecast' => '' // Default empty
                ];
            })->toArray();

            $projectData['tables'][] = [
                // Basic table info
                'tablename' => $table->table_name,
                'nmaxitems' => $fields->count(),
                'nmaxsearchkeys' => $fields->count(), // For now, all fields are searchable
                'nmaxitemsnokey' => $fields->where('field_name', '!=', 'id')->count(), // Items without primary key
                'nmaxkeys' => $constraints->count(),
                'nmaxforeignkeys' => 0, // TODO: Add foreign keys support

                // Table data arrays
                'fields' => $mappedFields,
                'keys' => $mappedKeys,

                // File generation info
                'filename' => $table->table_name,
                'filenameshort' => substr($table->table_name, 0, 8), // 8 char limit
                'fileid' => $table->table_name,
                'filenamecc' => ucwords(str_replace('_', '', $table->table_name)), // CamelCase
                'filegeneratemasterdetail' => false, // Default false
                'filedetailfileid' => '',
                'filedetailfilename' => '',
                'filedetailkey' => '',

                // Primary key info for template variables
                'primarykeyfield' => $fields->where('field_name', 'id')->first()?->field_name
                                 ?? $fields->where('field_name', 'like', '%_id')->first()?->field_name
                                 ?? $fields->first()?->field_name
                                 ?? 'id',

                // File key for templates - defaults to primary key for now
                'filekeyname' => $fields->where('field_name', 'id')->first()?->field_name
                             ?? $fields->where('field_name', 'like', '%_id')->first()?->field_name
                             ?? $fields->first()?->field_name
                             ?? 'id'
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
                'order' => $file->file_order,
                'id' => $file->id
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
Route::get('/template-process/{templateId}', function (Request $request, $templateId) {
    try {
        // Get project filter from query parameter
        $projectId = $request->query('project_id');

        // Get specific table filter from query parameter
        $tableName = $request->query('table_name');

        // Find template with its files
        $template = \App\Models\Template::with('files')->find($templateId);

        if (!$template) {
            return response()->json([
                'error' => 'Template not found',
                'template_id' => $templateId
            ], 404);
        }

        // Log project filtering
        if ($projectId) {
            \Log::info("Template processing with project filter: {$projectId}");
        } else {
            \Log::info("Template processing without project filter (demo mode)");
        }

        // Log table filtering
        if ($tableName) {
            \Log::info("Template processing with table filter: {$tableName}");
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

        // Load project-specific schemas or fallback to demo data
        $schemaTables = collect();

        if ($projectId) {
            // Get schemas linked to this project
            $project = \App\Models\Project::find($projectId);

            if ($project) {
                \Log::info("Loading schemas for project: {$project->name}");

                // Get floating schemas linked to this project through project_schemas table
                $linkedSchemas = \App\Models\FloatingSchema::whereHas('projects', function ($query) use ($projectId) {
                    $query->where('projects.id', $projectId);
                })->get();

                \Log::info("Found {$linkedSchemas->count()} linked schemas for project {$projectId}");

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
                        \Log::info("Added {$versionTables->count()} tables from schema '{$schema->name}' (version {$latestVersion->id})");
                    }
                }

                \Log::info("Total project-linked tables: {$schemaTables->count()}");
            }
        }

        // Fallback to demo data if no project or no linked schemas
        if ($schemaTables->isEmpty()) {
            if ($projectId) {
                \Log::warning("Project {$projectId} has no linked schemas - this is normal if no databases are connected to the project");

                // SPECIAL CASE: If table_name is specified but project has no schemas, create a dummy table
                if ($tableName) {
                    \Log::info("Creating dummy table '{$tableName}' for project {$projectId} because table_name was specified");

                    // Create a dummy table with basic fields for template processing
                    $dummyTable = new \App\Models\SchemaTable();
                    $dummyTable->table_name = $tableName;
                    $dummyTable->id = 999999; // Dummy ID

                    // Create basic dummy fields
                    $dummyFields = collect([
                        (object)[
                            'field_name' => 'id',
                            'field_type' => 'int',
                            'is_nullable' => false,
                            'field_order' => 1,
                            'default_value' => null
                        ],
                        (object)[
                            'field_name' => 'name',
                            'field_type' => 'varchar(255)',
                            'is_nullable' => false,
                            'field_order' => 2,
                            'default_value' => null
                        ]
                    ]);

                    $dummyTable->setRelation('fields', $dummyFields);
                    $dummyTable->setRelation('constraints', collect());

                    $schemaTables = collect([$dummyTable]);
                    \Log::info("Created dummy table with {$dummyFields->count()} fields");
                }
                // Return empty gtree for projects with no linked schemas (when no table_name specified)
            } else {
                \Log::info("No project specified, using demo data (schema_version_id=1)");

                $schemaTables = \App\Models\SchemaTable::where('schema_version_id', 1)
                    ->with(['fields' => function($query) {
                        $query->orderBy('field_order');
                    }, 'constraints'])
                    ->get();
            }
        }

        // Build gtree[] array structure with real project data
        $actualProject = null;
        if ($projectId) {
            $actualProject = \App\Models\Project::find($projectId);
        }

        // Get project information or fallback to demo values
        $projectName = $actualProject ? $actualProject->name : 'ScorietDemo';
        $projectId = $actualProject ? $actualProject->id : 1;

        $projectData = [
            // Basic project info
            'projectname' => $projectName,
            'projectdirectory' => $actualProject ? ($actualProject->project_directory ?? 'C:\\Users\\Public\\Documents\\' . $projectName) : 'C:\\Users\\Public\\Documents\\ScorietDemo',
            'projecturl' => $actualProject ? ($actualProject->project_url ?? 'http://localhost/' . strtolower($projectName)) : 'http://localhost/scorietdemo',
            'projectdatabase' => $actualProject ? ($actualProject->database_name ?? $projectName . '_db') : 'scoriet_demo',
            'projectid' => $projectId,
            'projecttemplateid' => $templateId,
            'projectdbid' => 1, // Default connection ID
            'projectdbtype' => $actualProject ? ($actualProject->database_type ?? 'MySQL') : 'MySQL',
            'projectdbdesc' => $actualProject ? ($actualProject->description ?? 'Project database') : 'Demo project database',
            'projectdbpassword' => $actualProject ? ($actualProject->database_password ?? '') : '', // Security: Don't expose real passwords if empty
            'projectdbusername' => $actualProject ? ($actualProject->database_username ?? 'root') : 'root',
            'projectdbserver' => $actualProject ? ($actualProject->database_server ?? '127.0.0.1') : '127.0.0.1',
            'projectdbport' => $actualProject ? ($actualProject->database_port ?? '3306') : '3306',

            // Counts and metrics
            'nmaxfiles' => $schemaTables->count(),
            'nmaxlanguages' => 1, // Default to 1 language

            // Template info
            'templatename' => $template->name,
            'templatefolder' => 'Templates\\' . $template->name,

            // Tables array (will be filled below)
            'tables' => []
        ];

        foreach ($schemaTables as $table) {
            $fields = $table->fields;
            $constraints = $table->constraints;

            $mappedFields = $fields->map(function($field, $index) use ($table, $projectId) {
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

                // Determine typecast based on field type
                $typecast = match($field->field_type) {
                    'int', 'integer', 'bigint', 'smallint', 'tinyint' => '(int)',
                    'decimal', 'float', 'double' => '(float)',
                    'boolean', 'bool', 'tinyint(1)' => '(bool)',
                    default => '' // No cast for strings, dates, etc.
                };

                // Check if field is auto increment (primary key with int type)
                $isAutoIncrement = ($field->field_name === 'id' || str_ends_with($field->field_name, '_id')) &&
                                   in_array($field->field_type, ['int', 'integer', 'bigint']);

                // Extract field size from type (e.g., VARCHAR(50) -> 50)
                $size = 0;
                if (preg_match('/\((\d+)\)/', $field->field_type, $matches)) {
                    $size = (int)$matches[1];
                }

                return [
                    // Core template variables
                    'name' => $field->field_name,
                    'type' => strtoupper($field->field_type),
                    'controltype' => $controltype,
                    'typecast' => $typecast,
                    'is_nullable' => $field->is_nullable,
                    'order' => $field->field_order,

                    // Extended Scoriet template variables
                    'filename' => $table->table_name, // Table name for file reference
                    'default' => $field->default_value ?? '',
                    'id' => $index + 1, // 1-based field ID
                    'sortindex' => $field->field_order,
                    'caption' => ucwords(str_replace('_', ' ', $field->field_name)),
                    'editmask' => '', // Default empty
                    'size' => $size,
                    'notnull' => !$field->is_nullable,
                    'autoincrement' => $isAutoIncrement,
                    'unsigned' => false, // Default false
                    'visible' => true, // Default visible
                    'projectid' => $projectId ?? 1
                ];
            })->toArray();

            // Map constraints/keys for template variables
            $mappedKeys = $constraints->map(function($constraint, $index) {
                return [
                    'name' => $constraint->constraint_name ?? 'key_' . ($index + 1),
                    'id' => $index + 1,
                    'key' => $constraint->column_name ?? '',
                    'type' => $constraint->constraint_type ?? 'INDEX',
                    'typecast' => '' // Default empty
                ];
            })->toArray();

            $projectData['tables'][] = [
                // Basic table info
                'tablename' => $table->table_name,
                'nmaxitems' => $fields->count(),
                'nmaxsearchkeys' => $fields->count(), // For now, all fields are searchable
                'nmaxitemsnokey' => $fields->where('field_name', '!=', 'id')->count(), // Items without primary key
                'nmaxkeys' => $constraints->count(),
                'nmaxforeignkeys' => 0, // TODO: Add foreign keys support

                // Table data arrays
                'fields' => $mappedFields,
                'keys' => $mappedKeys,

                // File generation info
                'filename' => $table->table_name,
                'filenameshort' => substr($table->table_name, 0, 8), // 8 char limit
                'fileid' => $table->table_name,
                'filenamecc' => ucwords(str_replace('_', '', $table->table_name)), // CamelCase
                'filegeneratemasterdetail' => false, // Default false
                'filedetailfileid' => '',
                'filedetailfilename' => '',
                'filedetailkey' => '',

                // Primary key info for template variables
                'primarykeyfield' => $fields->where('field_name', 'id')->first()?->field_name
                                 ?? $fields->where('field_name', 'like', '%_id')->first()?->field_name
                                 ?? $fields->first()?->field_name
                                 ?? 'id',

                // File key for templates - defaults to primary key for now
                'filekeyname' => $fields->where('field_name', 'id')->first()?->field_name
                             ?? $fields->where('field_name', 'like', '%_id')->first()?->field_name
                             ?? $fields->first()?->field_name
                             ?? 'id'
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


            // Check file type first - project_file should always be treated as project-level
            $isProjectFile = ($templateFile->file_type === 'project_file');

            // OVERRIDE: If table_name parameter is provided, force table-specific treatment for files with table placeholders
            \Log::info("🔍 Checking override for file '{$templateFile->file_name}': tableName={$tableName}, has_%1=" . (strpos($templateFile->file_name, '%1') !== false ? 'true' : 'false') . ", has_tablename=" . (strpos($content, '{tablename}') !== false ? 'true' : 'false') . ", isProjectFile={$isProjectFile}");

            $overrideTriggered = false;
            if ($tableName && (strpos($templateFile->file_name, '%1') !== false || strpos($content, '{tablename}') !== false)) {
                $isProjectFile = false; // Force it to be treated as table-specific
                $overrideTriggered = true;
                \Log::info("🔧 Override: Treating '{$templateFile->file_name}' as table-specific due to table_name parameter: {$tableName}");
            } else {
                \Log::info("❌ Override NOT triggered for '{$templateFile->file_name}'");
            }

            // Check for table-specific content OR if override was triggered
            $hasTableSpecificContent = $overrideTriggered || (!$isProjectFile && (
                strpos($content, '{tablename}') !== false ||
                strpos($content, '{for {nmaxitems}}') !== false ||
                strpos($content, '{item.name}') !== false ||
                strpos($content, '{item.type}') !== false ||
                strpos($content, '{item.controltype}') !== false
            ));

            if ($hasTableSpecificContent) {
                // Filter tables if specific table requested
                $tablesToProcess = $projectData['tables'];
                if ($tableName) {
                    $tablesToProcess = array_filter($projectData['tables'], function($table) use ($tableName) {
                        return $table['tablename'] === $tableName;
                    });

                    if (empty($tablesToProcess)) {
                        // Table not found, return error
                        return response()->json([
                            'error' => 'Table not found',
                            'table_name' => $tableName,
                            'available_tables' => array_column($projectData['tables'], 'tablename')
                        ], 404);
                    }
                }

                // Generate one file per filtered table
                foreach ($tablesToProcess as $originalIndex => $table) {
                    // Find the real table index in the original tables array for gtree access
                    $tableIndex = array_search($table, $projectData['tables'], true);
                    // Simple template variable replacement for now
                    $generatedContent = $content;
                    $generatedContent = str_replace('{projectname}', $projectData['projectname'], $generatedContent);
                    $generatedContent = str_replace('{tablename}', $table['tablename'], $generatedContent);

                    // 🎯 USE SIMPLE FIXED TEMPLATE ENGINE - Folgt GENAU deinem Vorschlag
                    $simpleEngine = new \App\Services\SimpleFixedTemplateEngine($gtree, $tableIndex, $table['tablename']);
                    $generatedContent = $simpleEngine->processTemplate($content);

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

                    $fileData = [
                        'filename' => str_replace(['{tablename}', '{projectname}'], [$table['tablename'], $projectData['projectname']], $templateFile->file_name),
                        'output_path' => $templateFile->output_path ?? '/',
                        'content' => $generatedContent,
                        'content_clean' => $cleanContent,
                        'type' => $templateFile->file_type,
                        'generation_type' => 'db_table_file', // Actual generation type based on content analysis
                        'table' => $table['tablename'],
                        'generated_from_template' => $templateFile->file_name,
                        'table_index' => $tableIndex,
                        'is_project_file' => false, // This is a table-specific file
                        'fields_count' => count($table['fields']),
                        'template_variables_converted' => [
                            'projectname' => $projectData['projectname'],
                            'tablename' => $table['tablename'],
                            'loops_converted' => strpos($generatedContent, 'for (let i = 0;') !== false
                        ]
                    ];

                    \Log::info("📝 Generated file data for table '{$table['tablename']}': table_index={$tableIndex}, filename='{$fileData['filename']}', generated_from_template='{$fileData['generated_from_template']}'");
                    $generatedFiles[] = $fileData;
                }
            } else {
                // Project-level file - Use SAME SimpleFixedTemplateEngine
                $simpleEngine = new \App\Services\SimpleFixedTemplateEngine($gtree, 0); // Use table index 0 for project files
                $generatedContent = $simpleEngine->processTemplate($content);

                // Clean content for better readability
                $cleanContent = str_replace(['\n', '\r\n', '\r'], "\n", $generatedContent);
                $cleanContent = preg_replace('/\n\s*\n/', "\n", $cleanContent);

                // Replace escaped \n and \t with Unicode (same as table files)
                $generatedContent = str_replace('\\n', '\\u000A', $generatedContent);
                $cleanContent = str_replace('\\n', '\\u000A', $cleanContent);
                $generatedContent = str_replace('\\t', '\\u0009', $generatedContent);
                $cleanContent = str_replace('\\t', '\\u0009', $cleanContent);

                $generatedFiles[] = [
                    'filename' => str_replace('{projectname}', $projectData['projectname'], $templateFile->file_name),
                    'output_path' => $templateFile->output_path ?? '/',
                    'content' => $generatedContent,
                    'content_clean' => $cleanContent,
                    'type' => $templateFile->file_type,
                    'generation_type' => 'project_file', // Actual generation type based on content analysis
                    'table' => null,
                    'generated_from_template' => $templateFile->file_name,
                    'is_project_file' => true,
                    'template_variables_converted' => [
                        'projectname' => $projectData['projectname'],
                        'uses_js_template_engine' => true
                    ]
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
