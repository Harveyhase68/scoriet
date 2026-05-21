<?php

/**
 * Scoriet CLI API Routes
 *
 * These routes are specifically for the Scoriet CLI client (RUST)
 * and have additional security measures compared to web API routes.
 *
 * Base URL: /cli/*
 */

use App\Http\Controllers\Cli\AuthController;
use App\Http\Controllers\Cli\ProjectController;
use App\Http\Controllers\Cli\DatabaseController;
use App\Http\Controllers\Cli\TemplateController;
use App\Http\Controllers\Cli\TemplateFileController;
use App\Http\Controllers\Cli\GenerateController;
use App\Http\Controllers\Api\SvcController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| CLI Authentication Routes
|--------------------------------------------------------------------------
*/

// Public routes (no authentication required)
Route::prefix('auth')->group(function () {
    // Initial authorization - generates Personal Access Token (or 2FA challenge)
    Route::post('/authorize', [AuthController::class, 'authorize'])
        ->middleware('throttle:10,1'); // 10 attempts per minute per IP
    // Verify 2FA code from a /authorize 'two_factor_required' response.
    // Lower limit because the per-session counter (5) is the primary defence;
    // the IP-throttle is a second line that catches attackers cycling sessions.
    Route::post('/verify-2fa', [AuthController::class, 'verifyTwoFactor'])
        ->middleware('throttle:30,1'); // 30 attempts per minute per IP
});

// Protected routes (require Personal Access Token)
Route::middleware('auth:api')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | CLI Auth Info Routes (NO CLI access check - needed for status & unlock)
    |--------------------------------------------------------------------------
    */
    Route::prefix('auth')->group(function () {
        // Get current user info
        Route::get('/whoami', [AuthController::class, 'whoami']);

        // Refresh token (revoke old, create new)
        Route::post('/refresh', [AuthController::class, 'refresh']);

        // Logout / revoke token
        Route::post('/logout', [AuthController::class, 'logout']);

        // CLI/Service access check and purchase
        Route::get('/cli-access', [AuthController::class, 'cliAccess']);
        Route::post('/unlock-cli', [AuthController::class, 'unlockCli']);
        Route::post('/unlock-service', [AuthController::class, 'unlockService']);
        Route::post('/unlock-bundle', [AuthController::class, 'unlockBundle']);

        // Verify token validity
        Route::get('/verify', [AuthController::class, 'verify']);
    });

    /*
    |--------------------------------------------------------------------------
    | CLI Project Routes (requires CLI access)
    |--------------------------------------------------------------------------
    */
    Route::prefix('projects')->middleware('cli.access')->group(function () {
        // List all projects user has access to
        Route::get('/', [ProjectController::class, 'list']);

        // Create new project
        Route::post('/', [ProjectController::class, 'create']);

        // Get project details
        Route::get('/{id}', [ProjectController::class, 'show']);

        // Update project
        Route::put('/{id}', [ProjectController::class, 'update']);

        // Delete project (HARD delete - permanent!)
        Route::delete('/{id}', [ProjectController::class, 'delete']);

        // Get project settings
        Route::get('/{id}/settings', [ProjectController::class, 'settings']);

        // Get deployment settings (protected files + install/update scripts)
        Route::get('/{id}/deployment-settings', [ProjectController::class, 'deploymentSettings']);

        // FTP/SSH Deployment Routes (CLI uses getSettingsForCli which returns actual password)
        // Note: Using {id} for consistency with other routes, controller finds the Project
        Route::get('/{id}/ftp-settings', [\App\Http\Controllers\Api\FtpSshUploadController::class, 'getSettingsForCli']);
        Route::put('/{id}/ftp-settings', [\App\Http\Controllers\Api\FtpSshUploadController::class, 'updateSettings']);
        Route::post('/{id}/ftp-test', [\App\Http\Controllers\Api\FtpSshUploadController::class, 'testConnection']);
        Route::post('/{id}/ftp-upload', [\App\Http\Controllers\Api\FtpSshUploadController::class, 'upload']);
    });

    /*
    |--------------------------------------------------------------------------
    | CLI Database Routes (requires CLI access)
    |--------------------------------------------------------------------------
    */
    Route::prefix('database')->middleware('cli.access')->group(function () {
        // List databases/schemas for a project
        Route::get('/list', [DatabaseController::class, 'list']);

        // Create new database schema (empty)
        Route::post('/create', [DatabaseController::class, 'createSchema']);

        // Import SQL into existing schema (optionally into specific version)
        Route::post('/import-sql', [DatabaseController::class, 'importSql']);

        // Copy a version to create new version
        Route::post('/copy-version', [DatabaseController::class, 'copyVersion']);

        // Import database schema from local database (alias for backward compatibility)
        Route::post('/import', [DatabaseController::class, 'import']);

        // Export database schema
        Route::post('/export', [DatabaseController::class, 'export']);

        // Get database structure
        Route::get('/{schemaId}/structure', [DatabaseController::class, 'structure']);

        // List all versions of a schema
        Route::get('/{schemaId}/versions', [DatabaseController::class, 'listVersions']);

        // Delete schema (HARD delete - permanent!)
        Route::delete('/{schemaId}', [DatabaseController::class, 'delete']);

        // Delete schema version (HARD delete - permanent!)
        Route::delete('/{schemaId}/versions/{versionId}', [DatabaseController::class, 'deleteVersion']);
    });

    /*
    |--------------------------------------------------------------------------
    | CLI Template Routes (requires CLI access)
    |--------------------------------------------------------------------------
    */
    Route::prefix('templates')->middleware('cli.access')->group(function () {
        // List all available templates
        Route::get('/', [TemplateController::class, 'list']);

        // Create new template
        Route::post('/', [TemplateController::class, 'create']);

        // Get template details
        Route::get('/{id}', [TemplateController::class, 'show']);

        // Delete template (HARD delete - permanent!)
        Route::delete('/{id}', [TemplateController::class, 'delete']);

        // Clone template (create editable copy with history)
        Route::post('/{id}/clone', [TemplateController::class, 'clone']);

        // Link template to project
        Route::post('/{id}/link', [TemplateController::class, 'link']);

        // Unlink template from project
        Route::post('/{id}/unlink', [TemplateController::class, 'unlink']);

        // Import template from file/zip
        Route::post('/import', [TemplateController::class, 'import']);

        // List templates linked to a project
        Route::get('/project/{projectId}', [TemplateController::class, 'projectTemplates']);

        // Template File Management
        // List files in a template
        Route::get('/{templateId}/files', [TemplateFileController::class, 'list']);

        // Add file to template
        Route::post('/{templateId}/files', [TemplateFileController::class, 'add']);

        // Delete file from template (HARD delete - permanent!)
        Route::delete('/{templateId}/files/{fileId}', [TemplateFileController::class, 'delete']);
    });

    /*
    |--------------------------------------------------------------------------
    | CLI Code Generation Routes (requires CLI access)
    |--------------------------------------------------------------------------
    */
    Route::prefix('generate')->middleware('cli.access')->group(function () {
        // Generate code (returns job ID for progress tracking)
        Route::post('/', [GenerateController::class, 'generate']);

        // Get generation progress
        Route::get('/progress/{jobId}', [GenerateController::class, 'progress']);

        // Download generated files as ZIP
        Route::get('/download/{jobId}', [GenerateController::class, 'download']);

        // Cancel generation job
        Route::post('/cancel/{jobId}', [GenerateController::class, 'cancel']);
    });

    /*
    |--------------------------------------------------------------------------
    | CLI System Info Routes
    |--------------------------------------------------------------------------
    */
    Route::prefix('system')->group(function () {
        // Get CLI API version
        Route::get('/version', function () {
            return response()->json([
                'version' => '1.0.0',
                'api_version' => '1.0',
                'scoriet_version' => config('app.version', '1.0.0'),
            ]);
        });

        // Health check
        Route::get('/health', function () {
            return response()->json([
                'status' => 'healthy',
                'timestamp' => now()->toIso8601String(),
            ]);
        });
    });

});

/*
|--------------------------------------------------------------------------
| Service Routes (scoriet-svc)
| These routes are called by the internal scoriet-svc service and GUI
| Security: Service routes require Service access, GUI routes require CLI access
|--------------------------------------------------------------------------
*/
Route::prefix('svc')->group(function () {
    // =====================================================
    // SERVICE-ONLY ROUTES (called by Rust service, requires Service access)
    // =====================================================
    Route::middleware(['auth:api', 'service.access'])->group(function () {
        // Get next task from queue
        Route::get('/queue', [SvcController::class, 'getQueue']);

        // Mark task as completed
        Route::post('/tasks/{id}/complete', [SvcController::class, 'completeTask']);

        // Mark task as failed
        Route::post('/tasks/{id}/fail', [SvcController::class, 'failTask']);

        // Append log to task (for live logging)
        Route::post('/tasks/{id}/log', [SvcController::class, 'appendLog']);

        // Device registration (called by service on startup)
        Route::post('/devices/register', [SvcController::class, 'registerDevice']);

        // Import schema data from service
        Route::post('/schema-import', [SvcController::class, 'importSchema']);

        // Receive data query results from service
        Route::post('/data-query-result', [SvcController::class, 'submitDataQueryResult']);

        // Template upload from service
        Route::post('/template-upload', [SvcController::class, 'receiveTemplateUpload']);

        // File edit via service (service callbacks)
        Route::post('/file-edit/{sessionId}/status', [SvcController::class, 'updateFileEditStatus']);
        Route::post('/file-edit/{sessionId}/content', [SvcController::class, 'uploadFileContent']);
        Route::get('/file-edit/{sessionId}/should-stop', [SvcController::class, 'checkFileEditShouldStop']);
    });

    // =====================================================
    // USER ROUTES (called from GUI, requires CLI access)
    // =====================================================
    Route::middleware(['auth:api', 'cli.access'])->group(function () {
        // Get active task for current user (BEFORE {id} route!)
        Route::get('/tasks/active', [SvcController::class, 'getActiveTask']);

        // Get task status (authenticated users only)
        Route::get('/tasks/{id}', [SvcController::class, 'getTaskStatus']);

        // Cancel task
        Route::post('/tasks/{id}/cancel', [SvcController::class, 'cancelTask']);

        // Task creation routes (called from GUI)
        Route::post('/tasks/connection-test', [SvcController::class, 'createConnectionTestTask']);
        Route::post('/tasks/database-import', [SvcController::class, 'createDatabaseImportTask']);
        Route::post('/tasks/database-export', [SvcController::class, 'createDatabaseExportTask']);
        Route::post('/tasks/project-download', [SvcController::class, 'createProjectDownloadTask']);
        Route::post('/tasks/template-upload', [SvcController::class, 'createTemplateUploadTask']);
        Route::post('/tasks/file-edit', [SvcController::class, 'createFileEditTask']);
        Route::post('/tasks/data-query', [SvcController::class, 'createDataQueryTask']);

        // Device management (user-facing)
        Route::get('/devices', [SvcController::class, 'listDevices']);
        Route::delete('/devices/{deviceId}', [SvcController::class, 'removeDevice']);

        // Template upload status (user polling)
        Route::get('/template-upload/{sessionId}/status', [SvcController::class, 'getTemplateUploadStatus']);

        // File edit status/stop (user polling/control)
        Route::get('/file-edit/{sessionId}/status', [SvcController::class, 'getFileEditStatus']);
        Route::post('/file-edit/{sessionId}/stop', [SvcController::class, 'stopFileEdit']);
    });
});
