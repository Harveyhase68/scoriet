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
    
    // Templates API
    Route::get('/templates', [App\Http\Controllers\Api\TemplateController::class, 'index']);
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
