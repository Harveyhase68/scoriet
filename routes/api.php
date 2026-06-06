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
use App\Http\Controllers\Api\SchemaDiffController;
use App\Http\Controllers\ProjectApplicationController;
use App\Http\Controllers\ProjectInvitationController;
use App\Http\Controllers\SchemaExportController;
use App\Http\Controllers\Api\UltimateTemplateController;
use App\Http\Controllers\Api\TranslationExportController;
use App\Http\Controllers\Api\AutoTranslateController;
use App\Http\Controllers\Api\TemplateVariableController;
use App\Http\Controllers\Api\ProjectTemplateVariableValueController;
use App\Http\Controllers\Api\CliSubscriptionController;
use App\Http\Controllers\Api\FormDesignerController;
use App\Http\Controllers\Api\StripeController;
use App\Http\Controllers\Api\PayPalController;
use App\Http\Controllers\TwoFactorController;
use App\Services\SimpleFixedTemplateEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DiagramLayoutController;
use App\Http\Controllers\Api\PushSubscriptionController;

// Manual OAuth token route for API with email verification check
use App\Http\Controllers\CustomTokenController;
Route::post('/oauth/token', [CustomTokenController::class, 'issueToken'])->name('api.oauth.token');

// Stripe Webhook (public - called by Stripe servers)
Route::post('/stripe/webhook', [StripeController::class, 'handleWebhook'])->name('api.stripe.webhook');

// PayPal Webhook (public - called by PayPal servers)
Route::post('/paypal/webhook', [PayPalController::class, 'handleWebhook'])->name('api.paypal.webhook');

// CMS Popups (public - for landing page and app)
Route::get('/popups/landingpage', [\App\Http\Controllers\PageController::class, 'getLandingPagePopups'])->name('api.popups.landingpage');
Route::get('/popups/app', [\App\Http\Controllers\PageController::class, 'getAppPopups'])->name('api.popups.app');

// Template Media - Serve blob images (public access for display, no auth required)
Route::get('/media/{media}/serve', [\App\Http\Controllers\Api\TemplateMediaController::class, 'serve'])->name('api.template-media.serve.public');

// Demo reset countdown (public - polled by frontend to show warnings before daily reset)
Route::get('/demo/countdown', function () {
    $resetAt = \Illuminate\Support\Facades\Cache::get('demo_reset_at');

    if (!$resetAt) {
        return response()->json(['active' => false]);
    }

    $resetTime = \Carbon\Carbon::parse($resetAt);
    $minutesRemaining = (int) now()->diffInMinutes($resetTime, false); // negative = past

    return response()->json([
        'active' => true,
        'reset_at' => $resetAt,
        'minutes_remaining' => max($minutesRemaining, 0),
    ]);
});

// Message Attachment Download via Signed URL (public - no auth, but signature validated)
Route::get('/messages/attachments/{attachment}/download-signed', [\App\Http\Controllers\Api\MessageController::class, 'downloadSigned'])
    ->name('api.messages.attachments.download-signed')
    ->middleware('signed');

// Test Observer (outside auth middleware for testing)
Route::get('/test/observer', function () {
    try {
        // Create a new table using Eloquent to trigger the observer
        $schemaVersion = \Illuminate\Support\Facades\DB::table('schema_versions')
            ->where('schema_id', 1)
            ->orderBy('version_number', 'desc')
            ->first();
        
        if (!$schemaVersion) {
            return response()->json(['error' => 'No schema version found'], 404);
        }
        
        $table = new \App\Models\SchemaTable();
        $table->schema_version_id = $schemaVersion->id;
        $table->schema_id = $schemaVersion->schema_id;
        $table->table_name = 'test_observer_table_' . time();
        $table->save();
        
        return response()->json([
            'success' => true,
            'message' => 'Created test table with ID: ' . $table->id,
            'table_name' => $table->table_name
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 500);
    }
});

// Authentication Routes (public)
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/login-2fa', [AuthController::class, 'loginWith2FA']); // 2FA verification step
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    
    // Email Verification Routes
    Route::post('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])->name('api.verification.verify');
    Route::post('/email/resend', [AuthController::class, 'resendVerificationEmail'])->middleware('auth:api');
    
    // Token validation endpoint for Reset Password Modal
    Route::post('/validate-reset-token', function (Request $request) {
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

// Public Pricing API (no auth required)
Route::get('/pricing', function () {
    try {
        $settings = \App\Models\Settings::first();

        if (!$settings) {
            // Fallback to default prices if no settings exist
            $prices = [
                'patron_annual' => 34.90,
                'patron_monthly' => 49.90,
                'credits_500' => 9.90,
                'credits_1000' => 17.90,
                'credits_2500' => 29.90
            ];
        } else {
            $prices = [
                'patron_annual' => (float) $settings->price_patron_annual,
                'patron_monthly' => (float) $settings->price_patron_monthly,
                'credits_500' => (float) $settings->price_credits_500,
                'credits_1000' => (float) $settings->price_credits_1000,
                'credits_2500' => (float) $settings->price_credits_2500
            ];
        }

        return response()->json([
            'success' => true,
            'prices' => $prices,
            'currency' => 'EUR',
            'updated_at' => $settings ? $settings->updated_at : now()
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'error' => 'Failed to fetch pricing information'
        ], 500);
    }
});

// Code Adjustments - Public utility endpoints (no auth needed, just static variable list)
Route::get('/code-adjustments/variables', [\App\Http\Controllers\Api\CodeAdjustmentController::class, 'getVariables'])->name('api.code-adjustments.variables.public');

// Broadcasting auth endpoint (Passport token-based)
Route::middleware('auth:api')->post('/broadcasting/auth', function (\Illuminate\Http\Request $request) {
    return \Illuminate\Support\Facades\Broadcast::auth($request);
});

// Protected Routes (require authentication)
Route::middleware('auth:api')->group(function () {
    // Generated Project Upload/Download (for deployment)
    Route::post('/generated-projects/upload', [App\Http\Controllers\Api\GeneratedProjectUploadController::class, 'upload']);
    Route::get('/generated-projects/download/{filename}', [App\Http\Controllers\Api\GeneratedProjectUploadController::class, 'download']);

    // Deployment Logs
    Route::get('/projects/{projectId}/deployment-logs', [App\Http\Controllers\Api\DeploymentLogController::class, 'index']);
    Route::delete('/projects/{projectId}/deployment-logs', [App\Http\Controllers\Api\DeploymentLogController::class, 'clear']);
    Route::get('/deployment-logs/task/{taskId}', [App\Http\Controllers\Api\DeploymentLogController::class, 'byTask']);
    Route::post('/deployment-logs', [App\Http\Controllers\Api\DeploymentLogController::class, 'store']);

    // Archive Generation
    Route::post('/archives/create', [App\Http\Controllers\Api\ArchiveController::class, 'create'])
        ->name('api.archives.create');

    // User Management
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/profile/update', [AuthController::class, 'updateProfile']);
    Route::put('/profile/password', [AuthController::class, 'updatePassword']);
    Route::put('/profile/language', [AuthController::class, 'updateLanguage']);
    Route::put('/profile/theme', [AuthController::class, 'updateTheme']);
    Route::put('/profile/seller', [AuthController::class, 'updateSellerProfile']);
    Route::delete('/profile/delete', [AuthController::class, 'deleteAccount']);

    // Two-Factor Authentication
    Route::prefix('two-factor')->group(function () {
        Route::get('/status', [TwoFactorController::class, 'status']);
        Route::post('/enable', [TwoFactorController::class, 'enable']);
        Route::post('/confirm', [TwoFactorController::class, 'confirm']);
        Route::post('/verify', [TwoFactorController::class, 'verify']);
        Route::post('/check-device', [TwoFactorController::class, 'checkDevice']);
        Route::post('/disable', [TwoFactorController::class, 'disable']);
        Route::post('/cancel-setup', [TwoFactorController::class, 'cancelSetup']);
        Route::post('/regenerate-recovery-codes', [TwoFactorController::class, 'regenerateRecoveryCodes']);
        Route::get('/trusted-devices', [TwoFactorController::class, 'trustedDevices']);
        Route::delete('/trusted-devices/{deviceId}', [TwoFactorController::class, 'removeTrustedDevice']);
        Route::delete('/trusted-devices', [TwoFactorController::class, 'removeAllTrustedDevices']);
    });
    Route::post('/logout', [AuthController::class, 'logout']);

    // Git Provider Integration
    Route::prefix('git')->group(function () {
        Route::get('/providers', [\App\Http\Controllers\Api\GitProviderController::class, 'index']);
        Route::get('/authorize/{provider}', [\App\Http\Controllers\Api\GitProviderController::class, 'authorize']);
        Route::get('/callback/{provider}', [\App\Http\Controllers\Api\GitProviderController::class, 'callback']);
        Route::delete('/disconnect/{provider}', [\App\Http\Controllers\Api\GitProviderController::class, 'disconnect']);
        Route::get('/{provider}/repositories', [\App\Http\Controllers\Api\GitProviderController::class, 'repositories']);
        Route::get('/{provider}/branches', [\App\Http\Controllers\Api\GitProviderController::class, 'branches']);
        Route::post('/{provider}/repositories', [\App\Http\Controllers\Api\GitProviderController::class, 'createRepository']);
        Route::post('/{provider}/push', [\App\Http\Controllers\Api\GitProviderController::class, 'push']);
        Route::post('/{provider}/push-direct', [\App\Http\Controllers\Api\GitProviderController::class, 'pushDirect']);
    });

    // User Activity
    Route::get('/user-update', [SqlParserController::class, 'parse']);
    
    // SQL Parser API
    Route::post('/sql-parse', [SqlParserController::class, 'parse']);
    Route::post('/sql-parse-and-store', [SqlParserController::class, 'parseAndStore']);
    Route::post('/sql-validate-import', [SqlParserController::class, 'validateImport']);
    Route::post('/sql-debug', [SqlParserController::class, 'debugParse']);
    Route::get('/schema-debug/{versionId}', [SchemaController::class, 'debugSchemaVersion']);
    Route::get('/schema-versions', [SqlParserController::class, 'getAllSchemaVersions']);
    Route::get('/schema-versions/{id}', [SqlParserController::class, 'getSchemaVersion']);
    Route::get('/schema-versions/by-name/{name}', [SqlParserController::class, 'getSchemaVersionByName']);
    
    // Template Management (for Template Management Panel)
    Route::get('/templates/check-name', [TemplateController::class, 'checkTemplateName']); // Check if name exists (MUST be before apiResource)
    Route::get('/templates/my-templates', [TemplateController::class, 'getMyTemplates']); // Get user's own templates
    Route::get('/templates/community', [TemplateController::class, 'getCommunityTemplates']); // Get system/community templates
    Route::apiResource('templates', TemplateController::class);
    Route::delete('/templates/{template}/force', [TemplateController::class, 'forceDestroy']); // Hard delete
    Route::patch('/templates/{template}/toggle', [TemplateController::class, 'toggleActive']); // Toggle active status
    Route::patch('/templates/{template}/visibility', [TemplateController::class, 'updateVisibility']); // Update visibility only (for unlocking)
    Route::post('/templates/{id}/clone', [TemplateController::class, 'cloneTemplate']); // Clone template with history
    Route::post('/templates/{id}/link', [TemplateController::class, 'linkTemplate']); // Link template to projects
    Route::post('/templates/{id}/unlink', [TemplateController::class, 'unlinkTemplate']); // Unlink template from projects
    Route::get('/templates/{id}/linked-projects', [TemplateController::class, 'getLinkedProjects']); // Get linked project IDs
    Route::put('/templates/{id}/linked-projects', [TemplateController::class, 'updateLinkedProjects']); // Update linked projects
    Route::patch('/templates/{templateId}/projects/{projectId}/toggle-active', [TemplateController::class, 'toggleProjectLinkActive']); // Toggle project link active status
    Route::get('/templates/{id}/files', [TemplateController::class, 'getTemplateFiles']);
    Route::get('/templates/{templateId}/files/{fileId}/integrity', [TemplateController::class, 'checkFileIntegrity']);
    Route::post('/templates/{id}/files', [TemplateController::class, 'addTemplateFile']);
    Route::put('/templates/{templateId}/files/{fileId}', [TemplateController::class, 'updateTemplateFile']);
    Route::delete('/templates/{templateId}/files/{fileId}', [TemplateController::class, 'deleteTemplateFile']);
    Route::get('/templates/{id}/export', [TemplateController::class, 'exportTemplate']);
    Route::get('/templates/{id}/download-zip', [TemplateController::class, 'downloadTemplateZip']);
    Route::get('/templates/{id}/download-archive', [TemplateController::class, 'downloadTemplateArchive']);
    Route::post('/templates/import', [TemplateController::class, 'import']);

    // Template Import Wizard - Upload archive and create template step-by-step
    Route::prefix('template-import')->name('api.template-import.')->group(function () {
        Route::post('/upload', [\App\Http\Controllers\Api\TemplateImportController::class, 'upload'])->name('upload');
        Route::get('/{sessionId}/files', [\App\Http\Controllers\Api\TemplateImportController::class, 'getFiles'])->name('files');
        Route::post('/{sessionId}/preview', [\App\Http\Controllers\Api\TemplateImportController::class, 'previewFile'])->name('preview');
        Route::post('/{sessionId}/create', [\App\Http\Controllers\Api\TemplateImportController::class, 'createTemplate'])->name('create');
        Route::delete('/{sessionId}', [\App\Http\Controllers\Api\TemplateImportController::class, 'cancel'])->name('cancel');
    });

    // Template Subscriptions (for private templates)
    Route::get('/template-subscriptions/count', [TemplateController::class, 'getSubscriptionCount']);

    // CLI & Service Subscriptions
    Route::get('/cli-subscriptions/status', [CliSubscriptionController::class, 'status']);
    Route::post('/cli-subscriptions/unlock', [CliSubscriptionController::class, 'unlock']);
    Route::get('/cli-subscriptions/check-cli', [CliSubscriptionController::class, 'checkCliAccess']);
    Route::get('/cli-subscriptions/check-service', [CliSubscriptionController::class, 'checkServiceAccess']);

    // Git Integration Subscription
    Route::post('/subscriptions/unlock-git-integration', [\App\Http\Controllers\Api\GitProviderController::class, 'unlockGitIntegration']);

    // General Subscriptions Management
    Route::get('/subscriptions', [\App\Http\Controllers\Api\SubscriptionController::class, 'index']);
    Route::post('/subscriptions/{id}/renew', [\App\Http\Controllers\Api\SubscriptionController::class, 'renew']);

    // Code Adjustments Subscription
    Route::get('/subscriptions/code-adjustments/status', [\App\Http\Controllers\Api\SubscriptionController::class, 'getCodeAdjustmentsStatus']);
    Route::post('/subscriptions/unlock-code-adjustments', [\App\Http\Controllers\Api\SubscriptionController::class, 'unlockCodeAdjustments']);

    // Database Designer Subscription
    Route::get('/subscriptions/database-designer/status', [\App\Http\Controllers\Api\SubscriptionController::class, 'getDatabaseDesignerStatus']);
    Route::post('/subscriptions/unlock-database-designer', [\App\Http\Controllers\Api\SubscriptionController::class, 'unlockDatabaseDesigner']);

    // Schema Migration Subscription
    Route::get('/subscriptions/schema-migration/status', [\App\Http\Controllers\Api\SubscriptionController::class, 'getSchemaMigrationStatus']);
    Route::post('/subscriptions/unlock-schema-migration', [\App\Http\Controllers\Api\SubscriptionController::class, 'unlockSchemaMigration']);

    // All Features Overview (for Subscription page)
    Route::get('/subscriptions/all-features', [\App\Http\Controllers\Api\SubscriptionController::class, 'getAllFeatures']);
    Route::get('/subscriptions/bundle-discount', [\App\Http\Controllers\Api\SubscriptionController::class, 'getBundleDiscount']);

    // Teams Feature Unlock
    Route::post('/subscriptions/unlock-teams', [\App\Http\Controllers\Api\SubscriptionController::class, 'unlockTeams']);

    // Stripe Payment Routes
    Route::post('/stripe/checkout/credits', [StripeController::class, 'createCreditCheckout']);
    Route::post('/stripe/checkout/patron', [StripeController::class, 'createPatronCheckout']);
    Route::post('/stripe/checkout/template', [StripeController::class, 'createTemplateCheckout']);
    Route::get('/stripe/payment-status', [StripeController::class, 'getPaymentStatus']);

    // PayPal Payment Routes
    Route::post('/paypal/order/credits', [PayPalController::class, 'createCreditOrder']);
    Route::post('/paypal/order/patron', [PayPalController::class, 'createPatronSubscription']);
    Route::post('/paypal/order/template', [PayPalController::class, 'createTemplateOrder']);
    Route::post('/paypal/capture', [PayPalController::class, 'capturePayment']);

    // Subscription Management
    Route::post('/subscription/cancel', [App\Http\Controllers\Api\SubscriptionController::class, 'cancel']);

    // Template Variables (Template-Developer defines custom variables)
    Route::prefix('templates/{templateId}/variables')->name('api.template-variables.')->group(function () {
        Route::get('/', [TemplateVariableController::class, 'index'])->name('index');
        Route::post('/', [TemplateVariableController::class, 'store'])->name('store');
        Route::put('/{id}', [TemplateVariableController::class, 'update'])->name('update');
        Route::delete('/{id}', [TemplateVariableController::class, 'destroy'])->name('destroy');
    });

    // Project Template Variable Values (Project-User fills in values)
    Route::prefix('projects/{projectId}/templates/{templateId}/variable-values')->name('api.project-variable-values.')->group(function () {
        Route::get('/', [ProjectTemplateVariableValueController::class, 'index'])->name('index');
        Route::post('/', [ProjectTemplateVariableValueController::class, 'store'])->name('store');
        Route::post('/bulk', [ProjectTemplateVariableValueController::class, 'bulkUpdate'])->name('bulk');
        Route::delete('/{id}', [ProjectTemplateVariableValueController::class, 'destroy'])->name('destroy');
    });

    // Code Adjustments (Custom code insertions per project)
    Route::prefix('projects/{projectId}/code-adjustments')->name('api.code-adjustments.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\CodeAdjustmentController::class, 'index'])->name('index');
        Route::post('/', [\App\Http\Controllers\Api\CodeAdjustmentController::class, 'store'])->name('store');
        // Export / Import (must be before /{id} routes to avoid conflicts!)
        Route::get('/export', [\App\Http\Controllers\Api\CodeAdjustmentController::class, 'export'])->name('export');
        Route::post('/import', [\App\Http\Controllers\Api\CodeAdjustmentController::class, 'import'])->name('import');
        // Reverse Engineering (must be before /{id} routes!)
        Route::post('/from-analysis', [\App\Http\Controllers\Api\CodeAdjustmentController::class, 'createFromAnalysis'])->name('from-analysis');
        // Single adjustment routes (with {id} parameter)
        Route::get('/{id}', [\App\Http\Controllers\Api\CodeAdjustmentController::class, 'show'])->name('show');
        Route::put('/{id}', [\App\Http\Controllers\Api\CodeAdjustmentController::class, 'update'])->name('update');
        Route::delete('/{id}', [\App\Http\Controllers\Api\CodeAdjustmentController::class, 'destroy'])->name('destroy');
        Route::patch('/{id}/toggle', [\App\Http\Controllers\Api\CodeAdjustmentController::class, 'toggleActive'])->name('toggle');
        Route::post('/{id}/duplicate', [\App\Http\Controllers\Api\CodeAdjustmentController::class, 'duplicate'])->name('duplicate');
        // Insertions (nested)
        Route::post('/{adjustmentId}/insertions', [\App\Http\Controllers\Api\CodeAdjustmentController::class, 'storeInsertion'])->name('insertions.store');
        Route::put('/{adjustmentId}/insertions/{insertionId}', [\App\Http\Controllers\Api\CodeAdjustmentController::class, 'updateInsertion'])->name('insertions.update');
        Route::delete('/{adjustmentId}/insertions/{insertionId}', [\App\Http\Controllers\Api\CodeAdjustmentController::class, 'destroyInsertion'])->name('insertions.destroy');
    });

    // Code Adjustments - Utility endpoints (analyze/preview require auth, variables is public above)
    Route::post('/code-adjustments/analyze', [\App\Http\Controllers\Api\CodeAdjustmentController::class, 'analyze'])->name('api.code-adjustments.analyze');
    Route::post('/code-adjustments/preview', [\App\Http\Controllers\Api\CodeAdjustmentController::class, 'preview'])->name('api.code-adjustments.preview');
    Route::post('/code-adjustments/compare-directory', [\App\Http\Controllers\Api\CodeAdjustmentController::class, 'compareDirectory'])->name('api.code-adjustments.compare-directory');
    Route::post('/code-adjustments/compare-git', [\App\Http\Controllers\Api\CodeAdjustmentController::class, 'compareGit'])->name('api.code-adjustments.compare-git');

    // Project Generations (for code comparison)
    Route::get('/projects/{projectId}/generations', [\App\Http\Controllers\Api\CodeAdjustmentController::class, 'getGenerations'])->name('api.generations.index');
    Route::get('/projects/{projectId}/generations/{generationId}/files', [\App\Http\Controllers\Api\CodeAdjustmentController::class, 'getGenerationFiles'])->name('api.generations.files');
    Route::post('/projects/{projectId}/generations/{generationId}/fetch-file', [\App\Http\Controllers\Api\CodeAdjustmentController::class, 'fetchFileFromGeneration'])->name('api.generations.fetch-file');

    // Project Attachments (Documents, Images, PDFs etc.)
    Route::prefix('projects/{projectId}/attachments')->name('api.project-attachments.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\ProjectAttachmentController::class, 'index'])->name('index');
        Route::post('/', [\App\Http\Controllers\Api\ProjectAttachmentController::class, 'store'])->name('store');
        Route::get('/{attachmentId}', [\App\Http\Controllers\Api\ProjectAttachmentController::class, 'show'])->name('show');
        Route::put('/{attachmentId}', [\App\Http\Controllers\Api\ProjectAttachmentController::class, 'update'])->name('update');
        Route::delete('/{attachmentId}', [\App\Http\Controllers\Api\ProjectAttachmentController::class, 'destroy'])->name('destroy');
        Route::get('/{attachmentId}/download', [\App\Http\Controllers\Api\ProjectAttachmentController::class, 'download'])->name('download');
    });

    // Project Export/Import (Archive)
    Route::prefix('projects/{projectId}')->name('api.project-export.')->group(function () {
        Route::get('/export/preview', [\App\Http\Controllers\Api\ProjectExportController::class, 'preview'])->name('preview');
        Route::get('/export', [\App\Http\Controllers\Api\ProjectExportController::class, 'export'])->name('export');
    });

    // Project Import (Upload ZIP and import)
    Route::prefix('projects/import')->name('api.project-import.')->group(function () {
        Route::post('/analyze', [\App\Http\Controllers\Api\ProjectImportController::class, 'analyze'])->name('analyze');
        Route::post('/execute', [\App\Http\Controllers\Api\ProjectImportController::class, 'execute'])->name('execute');
        Route::post('/cancel', [\App\Http\Controllers\Api\ProjectImportController::class, 'cancel'])->name('cancel');
    });

    // Template Review System (Inner Core only)
    Route::prefix('template-reviews')->name('api.template-reviews.')->group(function () {
        Route::get('/pending', [\App\Http\Controllers\Api\TemplateReviewController::class, 'getPendingReviews'])->name('pending');
        Route::post('/templates/{template}/review', [\App\Http\Controllers\Api\TemplateReviewController::class, 'submitReview'])->name('submit');
        Route::post('/templates/{template}/admin-approve', [\App\Http\Controllers\Api\TemplateReviewController::class, 'adminApprove'])->name('admin-approve');
        Route::get('/templates/{template}/reviews', [\App\Http\Controllers\Api\TemplateReviewController::class, 'getTemplateReviews'])->name('get');
        Route::put('/reviews/{review}', [\App\Http\Controllers\Api\TemplateReviewController::class, 'updateReview'])->name('update');
        Route::delete('/reviews/{review}', [\App\Http\Controllers\Api\TemplateReviewController::class, 'deleteReview'])->name('delete');
    });

    // Template Store - Marketplace for selling templates
    Route::prefix('store')->name('api.store.')->group(function () {
        Route::get('/templates', [\App\Http\Controllers\Api\TemplateStoreController::class, 'index'])->name('templates.index');
        Route::get('/templates/{template}', [\App\Http\Controllers\Api\TemplateStoreController::class, 'show'])->name('templates.show');
        Route::post('/templates/{template}/purchase', [\App\Http\Controllers\Api\TemplateStoreController::class, 'purchase'])->name('templates.purchase');
        Route::get('/my-purchases', [\App\Http\Controllers\Api\TemplateStoreController::class, 'myPurchases'])->name('my-purchases');
        Route::get('/my-sales', [\App\Http\Controllers\Api\TemplateStoreController::class, 'mySales'])->name('my-sales');
        Route::get('/categories', [\App\Http\Controllers\Api\TemplateStoreController::class, 'categories'])->name('categories');
        Route::get('/languages', [\App\Http\Controllers\Api\TemplateStoreController::class, 'languages'])->name('languages');
        Route::post('/templates/{template}/submit', [\App\Http\Controllers\Api\TemplateStoreController::class, 'submitForApproval'])->name('templates.submit');
        Route::put('/templates/{template}/price', [\App\Http\Controllers\Api\TemplateStoreController::class, 'updatePrice'])->name('templates.update-price');
        Route::delete('/templates/{template}', [\App\Http\Controllers\Api\TemplateStoreController::class, 'removeFromStore'])->name('templates.remove');
    });

    // Template Media - Logo, Images, Videos for templates
    Route::prefix('templates/{template}/media')->name('api.template-media.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\TemplateMediaController::class, 'index'])->name('index');
        Route::post('/logo', [\App\Http\Controllers\Api\TemplateMediaController::class, 'uploadLogo'])->name('upload-logo');
        Route::post('/images', [\App\Http\Controllers\Api\TemplateMediaController::class, 'uploadImages'])->name('upload-images');
        Route::post('/videos', [\App\Http\Controllers\Api\TemplateMediaController::class, 'addVideo'])->name('add-video');
        Route::put('/{media}', [\App\Http\Controllers\Api\TemplateMediaController::class, 'update'])->name('update');
        Route::put('/{media}/order', [\App\Http\Controllers\Api\TemplateMediaController::class, 'updateOrder'])->name('update-order');
        Route::post('/reorder', [\App\Http\Controllers\Api\TemplateMediaController::class, 'reorder'])->name('reorder');
        Route::delete('/{media}', [\App\Http\Controllers\Api\TemplateMediaController::class, 'destroy'])->name('destroy');
    });


    // Templates API (for Project Assignment)
    Route::get('/project-templates', [App\Http\Controllers\Api\TemplateController::class, 'index']);

    // 💰 CREDIT CHARGE - Call before starting generation
    Route::post('/generation/charge', [UltimateTemplateController::class, 'chargeForGeneration'])
        ->name('api.generation.charge');

    // 🚀 ULTIMATE TEMPLATE ENGINE - Enhanced template processing with 50+ variables
    // GET: process the stored template files as-is (used everywhere).
    // POST: same processing, but allows overriding individual file contents
    // via body — used by the Debug Generator's "Code vorbereiten" so the user
    // can compile their in-editor edits WITHOUT a destructive DB write-back.
    Route::get('/ultimate-template/{templateId}', [UltimateTemplateController::class, 'processTemplate'])
        ->name('api.ultimate-template.process');
    Route::post('/ultimate-template/{templateId}', [UltimateTemplateController::class, 'processTemplate'])
        ->name('api.ultimate-template.process-with-override');
    Route::post('/ultimate-template/{templateId}/batch', [UltimateTemplateController::class, 'processTemplateBatch'])
        ->name('api.ultimate-template.process-batch');
    Route::get('/ultimate-template/{templateId}/export/{format}', [UltimateTemplateController::class, 'processTemplate'])
        ->where('format', 'json|js|javascript|php')
        ->name('api.ultimate-template.export');

    // 🚀 FULL PROJECT GENERATION - Generate all code for a project
    Route::post('/projects/{projectId}/generate-full-code', [UltimateTemplateController::class, 'generateFullProject'])
        ->name('api.projects.generate-full-code');

    Route::post('/diagram/layout', [DiagramLayoutController::class, 'generate']);

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
        return response()->json(SimpleFixedTemplateEngine::solvYourExactProblem());
    });

    Route::post('/templates/link', [App\Http\Controllers\Api\TemplateController::class, 'linkToProject']);
    Route::post('/templates/clone', [App\Http\Controllers\Api\TemplateController::class, 'cloneToProject']);
    Route::get('/projects/{project}/template-usages', [App\Http\Controllers\Api\TemplateController::class, 'projectUsages']);
    Route::delete('/template-usage', [App\Http\Controllers\Api\TemplateController::class, 'removeUsage']);
    
    // Project Template Assignments
    Route::get('/schema-versions/{id}/templates', [TemplateController::class, 'getProjectTemplates']);
    Route::post('/schema-versions/{id}/templates', [TemplateController::class, 'assignToProject']);
    Route::delete('/schema-versions/{schemaId}/templates/{templateId}', [TemplateController::class, 'removeFromProject']);

    // Template-Schema Dependencies Management
    Route::prefix('template-db-schema')->group(function () {
        // Global Schemas (public schemas from system)
        Route::get('/global-schemas', [DbSchemaController::class, 'getGlobalSchemas']);

        // Schema Management
        Route::get('/schemas', [DbSchemaController::class, 'index']);
        Route::get('/schemas/{id}', [DbSchemaController::class, 'show']);
        Route::post('/schemas/{id}/copy', [DbSchemaController::class, 'copySchema']);

        // Schema Dependencies
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
    
    // Project Generation Tree v2 - Enhanced with update checking
    Route::get('/projects/{project}/generation-tree/v2', [App\Http\Controllers\Api\ProjectGenerationTreeController::class, 'show']);
    Route::get('/projects/{project}/generation-tree/updates', [App\Http\Controllers\Api\ProjectGenerationTreeController::class, 'checkUpdates']);
    
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
    Route::get('/projects/{project}/templates-with-protected-files', [ProjectController::class, 'getTemplatesWithProtectedFiles']);

    // Project Translations
    Route::get('/projects/{project}/translations', [ProjectController::class, 'getTranslations']);
    Route::post('/projects/{project}/translations', [ProjectController::class, 'saveTranslation']);
    Route::get('/locale-defaults', [ProjectController::class, 'getLocaleDefaults']);

    // Edit Mask Presets
    Route::get('/editmask-presets', function (\Illuminate\Http\Request $request) {
        $language = $request->query('language', 'html');
        $presets = config("editmasks.presets.{$language}", []);
        $languages = config('editmasks.languages', []);
        return response()->json(['presets' => $presets, 'languages' => $languages]);
    });

    // Project Git Integration Settings
    Route::get('/projects/{project}/git-settings', [ProjectController::class, 'getGitSettings']);
    Route::put('/projects/{project}/git-settings', [ProjectController::class, 'updateGitSettings']);
    Route::delete('/projects/{project}/git-settings', [ProjectController::class, 'removeGitIntegration']);

    // Project Edit Locking (real-time collaboration)
    Route::post('/projects/{project}/lock', [ProjectController::class, 'lockProject']);
    Route::post('/projects/{project}/unlock', [ProjectController::class, 'unlockProject']);
    Route::post('/projects/{project}/heartbeat', [ProjectController::class, 'heartbeatLock']);

    // FTP/SSH Deployment
    Route::get('/projects/{project}/ftp-settings', [\App\Http\Controllers\Api\FtpSshUploadController::class, 'getSettings']);
    Route::put('/projects/{project}/ftp-settings', [\App\Http\Controllers\Api\FtpSshUploadController::class, 'updateSettings']);
    Route::delete('/projects/{project}/ftp-settings', [\App\Http\Controllers\Api\FtpSshUploadController::class, 'removeSettings']);
    Route::post('/projects/{project}/ftp-test', [\App\Http\Controllers\Api\FtpSshUploadController::class, 'testConnection']);
    Route::post('/projects/{project}/ftp-upload', [\App\Http\Controllers\Api\FtpSshUploadController::class, 'upload']);

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


    // Must be declared BEFORE Route::resource so /teams/check-name isn't matched
    // as /teams/{team} with team="check-name".
    Route::get('/teams/check-name', [TeamController::class, 'checkName']);
    Route::resource('teams', TeamController::class);
    Route::get('/teams/{team}/members', [TeamController::class, 'getMembers']);
    Route::post('/teams/{team}/members', [TeamController::class, 'addMember']);
    Route::delete('/teams/{team}/members/{userId}', [TeamController::class, 'removeMember']);
    Route::put('/teams/{team}/members/{userId}/role', [TeamController::class, 'updateMemberRole']);
    Route::put('/teams/{team}/projects', [TeamController::class, 'updateProjectLinks']); // Update team-project links

    // Team ownership transfer
    Route::post('/teams/{team}/check-transfer', [TeamController::class, 'checkTransferEligibility']);
    Route::post('/teams/{team}/transfer', [TeamController::class, 'transferOwnership']);

    // Team unlock (for slot-based system)
    Route::post('/teams/{team}/unlock', [TeamController::class, 'unlockTeam']);

    // Team Roles & Permissions
    Route::get('/team-roles/permissions', [App\Http\Controllers\Api\TeamRoleController::class, 'getPermissions']);
    Route::get('/team-roles/system-roles', [App\Http\Controllers\Api\TeamRoleController::class, 'getSystemRoles']);
    Route::get('/teams/{team}/roles', [App\Http\Controllers\Api\TeamRoleController::class, 'getTeamRoles']);
    Route::post('/teams/{team}/roles', [App\Http\Controllers\Api\TeamRoleController::class, 'createRole']);
    Route::put('/teams/{team}/roles/{role}', [App\Http\Controllers\Api\TeamRoleController::class, 'updateRole']);
    Route::delete('/teams/{team}/roles/{role}', [App\Http\Controllers\Api\TeamRoleController::class, 'deleteRole']);
    Route::post('/teams/{team}/roles/{role}/copy', [App\Http\Controllers\Api\TeamRoleController::class, 'copyRoleToTeam']);
    Route::get('/teams/{team}/members-with-roles', [App\Http\Controllers\Api\TeamRoleController::class, 'getMembersWithRoles']);
    Route::put('/teams/{team}/members/{member}/team-role', [App\Http\Controllers\Api\TeamRoleController::class, 'assignRoleToMember']);

    // Project Schema Management
    Route::post('/projects/{project}/schemas', [ProjectController::class, 'associateSchema']);
    Route::delete('/projects/{project}/schemas/{schema}', [ProjectController::class, 'dissociateSchema']);
    Route::get('/projects/{project}/schemas', [ProjectController::class, 'getProjectSchemas']);
    Route::get('/projects/{project}/editable-schemas', [ProjectController::class, 'getEditableSchemas']);
    
    // Schema Management
    Route::apiResource('schemas', SchemaController::class);
    Route::get('/projects/{project}/available-schemas', [SchemaController::class, 'getAvailableForProject']);
    Route::get('/schemas/{id}/linked-projects', [SchemaController::class, 'getLinkedProjects']); // Get linked project IDs
    Route::put('/schemas/{id}/linked-projects', [SchemaController::class, 'updateLinkedProjects']); // Update linked projects

    // Floating Schema Version Management
    Route::get('/floating-schemas/{schema}/versions', [SchemaController::class, 'getSchemaVersions']);
    Route::post('/floating-schemas/{schema}/versions', [SchemaController::class, 'createNewVersion']);
    Route::delete('/floating-schemas/{schema}/versions/{version}', [SchemaController::class, 'deleteVersion']);
    Route::post('/floating-schemas/{schema}/create-version-and-table', [SchemaController::class, 'createVersionAndTable']);
    Route::get('/schema-versions/{version}/tables', [SchemaController::class, 'getVersionTables']);
    Route::post('/schema-versions/{version}/tables', [SchemaController::class, 'createTable']);
    Route::put('/schema-versions/{version}/tables/{table}', [SchemaController::class, 'updateTable']);
    Route::delete('/schema-versions/{version}/tables/{table}', [SchemaController::class, 'deleteTable']);
    Route::post('/schema-versions/{version}/tables/{table}/delete-with-copy', [SchemaController::class, 'deleteTableWithVersionCopy']);
    Route::put('/schema-versions/{version}/unsaved-changes', [SchemaController::class, 'markUnsavedChanges']);

    // Foreign Key Management
    Route::delete('/constraints/{constraint}/foreign-key', [SchemaController::class, 'deleteForeignKey']);
    Route::put('/constraints/{constraint}/foreign-key', [SchemaController::class, 'updateForeignKey']);
    Route::post('/tables/{table}/foreign-key', [SchemaController::class, 'createForeignKey']);
    Route::get('/schema-versions/{version}/fk-suggestions', [SchemaController::class, 'getForeignKeySuggestions']);

    // FK Field Dependencies & Cascading Changes
    Route::get('/schema-versions/{version}/fields/{field}/fk-dependencies', [SchemaController::class, 'getFieldFKDependencies']);
    Route::post('/schema-versions/{version}/fields/{field}/cascade-changes', [SchemaController::class, 'applyCascadingFieldChanges']);

    // Schema Designer Layout Management
    Route::post('/floating-schemas/{schema}/layouts/{versionNumber}', [SchemaController::class, 'saveLayout']);
    Route::get('/floating-schemas/{schema}/layouts/{versionNumber}', [SchemaController::class, 'getLayout']);

    // Schema Export API - Uses real table data from schema_tables + schema_fields
    Route::get('/schemas/{schema}/export', [SchemaExportController::class, 'exportSchema']);
    Route::get('/schemas/{schema}/export/mysql', [SchemaExportController::class, 'exportAsMySQL']);
    Route::get('/schemas/{schema}/export/postgresql', [SchemaExportController::class, 'exportAsPostgreSQL']);
    Route::get('/schemas/{schema}/table-count', [SchemaExportController::class, 'getTableCount']);

    // Schema Diff & Migration Generator
    Route::post('/schema-diff/compare', [SchemaDiffController::class, 'compare']);


    // Push Notifications
    Route::get('/push/vapid-key', [PushSubscriptionController::class, 'vapidKey']);
    Route::post('/push/subscribe', [PushSubscriptionController::class, 'subscribe']);
    Route::delete('/push/unsubscribe', [PushSubscriptionController::class, 'unsubscribe']);

    // Team Invitations
    Route::post('/teams/{team}/invitations', [TeamInvitationController::class, 'store']);
    Route::get('/teams/{team}/invitations', [TeamInvitationController::class, 'teamInvitations']);
    Route::delete('/teams/{team}/invitations/{invitation}', [TeamInvitationController::class, 'cancel']);
    
    // Project Applications & Join Codes
    Route::get('/join-code/{joinCode}', [ProjectApplicationController::class, 'getProjectByJoinCode']);
    Route::post('/project-applications', [ProjectApplicationController::class, 'apply']);
    Route::get('/projects/{project}/applications', [ProjectApplicationController::class, 'getProjectApplications']);
    Route::post('/project-application-review', [ProjectApplicationController::class, 'reviewApplication']);
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

    // Template File Field Assignments
    Route::get('/template-file-field-assignments/matrix', [\App\Http\Controllers\Api\TemplateFileFieldAssignmentController::class, 'getMatrix']);
    Route::post('/template-file-field-assignments/bulk-update', [\App\Http\Controllers\Api\TemplateFileFieldAssignmentController::class, 'bulkUpdate']);
    Route::delete('/template-file-field-assignments/{id}', [\App\Http\Controllers\Api\TemplateFileFieldAssignmentController::class, 'destroy']);
    Route::post('/template-file-field-assignments/reset-table', [\App\Http\Controllers\Api\TemplateFileFieldAssignmentController::class, 'resetTable']);

    // Report Pattern Field Assignments (per-report-pattern visibility control)
    Route::get('/report-pattern-field-assignments/matrix', [\App\Http\Controllers\Api\ReportPatternFieldAssignmentController::class, 'getMatrix']);
    Route::post('/report-pattern-field-assignments/bulk-update', [\App\Http\Controllers\Api\ReportPatternFieldAssignmentController::class, 'bulkUpdate']);
    Route::delete('/report-pattern-field-assignments/{id}', [\App\Http\Controllers\Api\ReportPatternFieldAssignmentController::class, 'destroy']);
    Route::post('/report-pattern-field-assignments/reset-table', [\App\Http\Controllers\Api\ReportPatternFieldAssignmentController::class, 'resetTable']);

    // Translation Export/Import
    Route::get('/translations/export', [TranslationExportController::class, 'export']);
    Route::post('/translations/import', [TranslationExportController::class, 'import']);
    Route::post('/translations/import-preview', [TranslationExportController::class, 'importPreview']);

    // Auto-Translate
    Route::post('/translations/auto-translate', [AutoTranslateController::class, 'translate']);

    // CMS Admin (System Admin only)
    Route::middleware([\App\Http\Middleware\EnsureUserIsAdmin::class])->prefix('admin')->group(function () {
        Route::get('/pages', [\App\Http\Controllers\Admin\PageController::class, 'index']);
        Route::post('/pages', [\App\Http\Controllers\Admin\PageController::class, 'store']);
        Route::put('/pages/{page}', [\App\Http\Controllers\Admin\PageController::class, 'update']);
        Route::delete('/pages/{page}', [\App\Http\Controllers\Admin\PageController::class, 'destroy']);

        // User Management
        Route::get('/users', [\App\Http\Controllers\Admin\UserManagementController::class, 'index']);
        Route::post('/users/{user}/toggle-inner-core', [\App\Http\Controllers\Admin\UserManagementController::class, 'toggleInnerCore']);
        Route::get('/inner-core/stats', [\App\Http\Controllers\Admin\UserManagementController::class, 'getInnerCoreStats']);

        // Payout Management
        Route::get('/payouts/pending', [\App\Http\Controllers\Api\PayoutAdminController::class, 'getPendingPayouts']);
        Route::post('/payouts/process/{userId}', [\App\Http\Controllers\Api\PayoutAdminController::class, 'processSinglePayout']);
        Route::post('/payouts/process-paypal-batch', [\App\Http\Controllers\Api\PayoutAdminController::class, 'processPaypalBatch']);
        Route::get('/payouts/history', [\App\Http\Controllers\Api\PayoutAdminController::class, 'getPayoutHistory']);
        Route::get('/payouts/export-sepa', [\App\Http\Controllers\Api\PayoutAdminController::class, 'exportSepaXml']);
        Route::get('/payouts/export-csv', [\App\Http\Controllers\Api\PayoutAdminController::class, 'exportCsv']);

        // Performance Metrics
        Route::get('/performance/overview', [\App\Http\Controllers\Api\PerformanceMetricsController::class, 'overview']);
        Route::get('/performance/daily', [\App\Http\Controllers\Api\PerformanceMetricsController::class, 'daily']);
        Route::get('/performance/operations/{operation}', [\App\Http\Controllers\Api\PerformanceMetricsController::class, 'operation']);
        Route::get('/performance/slow', [\App\Http\Controllers\Api\PerformanceMetricsController::class, 'slow']);
        Route::get('/performance/hourly', [\App\Http\Controllers\Api\PerformanceMetricsController::class, 'hourly']);
        Route::get('/performance/by-subscription', [\App\Http\Controllers\Api\PerformanceMetricsController::class, 'bySubscription']);
        Route::post('/performance/cleanup', [\App\Http\Controllers\Api\PerformanceMetricsController::class, 'cleanup']);

        // Visitor Analytics
        Route::get('/visitors/stats', [\App\Http\Controllers\Api\VisitorController::class, 'stats']);
    });
});

// Debug/test routes were removed prior to public-API release.
// They returned schema and project data without authentication and are
// preserved in git history if you ever need them for diagnostics.


// GTREE BY SCHEMA ID - Get latest version automatically
Route::get('/schemas/{schemaId}/gtree', function ($schemaId) {
    try {
        // Get the latest version for this schema
        $latestVersion = \App\Models\SchemaVersion::where('schema_id', $schemaId)
            ->orderBy('version_number', 'desc')
            ->first();

        if (!$latestVersion) {
            return response()->json([
                'error' => 'No versions found for this schema',
                'schema_id' => $schemaId
            ], 404);
        }

        // Use the existing gtree-test logic
        $schemaTables = \App\Models\SchemaTable::where('schema_version_id', $latestVersion->id)
            ->with(['fields' => function($query) {
                $query->orderBy('field_order');
            }, 'constraints'])
            ->get();

        $projectData = [
            'projectname' => 'GlobalProject',
            'nmaxtables' => $schemaTables->count(),
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

                $typecast = match($field->field_type) {
                    'int', 'integer', 'bigint', 'smallint', 'tinyint' => '(int)',
                    'decimal', 'float', 'double' => '(float)',
                    'boolean', 'bool', 'tinyint(1)' => '(bool)',
                    default => ''
                };

                return [
                    'name' => $field->field_name,
                    'type' => $field->field_type,
                    'controltype' => $controltype,
                    'typecast' => $typecast,
                    'is_nullable' => $field->is_nullable,
                    'order' => $field->field_order,
                    'comment' => $field->comment ?? ''
                ];
            })->toArray();

            $mappedKeys = $constraints->map(function($constraint, $index) {
                return [
                    'name' => $constraint->constraint_name ?? 'key_' . ($index + 1),
                    'id' => $index + 1,
                    'key' => $constraint->column_name ?? '',
                    'type' => $constraint->constraint_type ?? 'INDEX',
                    'typecast' => ''
                ];
            })->toArray();

            $projectData['tables'][] = [
                'tablename' => $table->table_name,
                'nmaxitems' => $fields->count(),
                'nmaxsearchkeys' => $fields->count(),
                'nmaxitemsnokey' => $fields->where('field_name', '!=', 'id')->count(),
                'nmaxkeys' => $constraints->count(),
                'nmaxforeignkeys' => 0,
                'fields' => $mappedFields,
                'keys' => $mappedKeys,
                'filename' => $table->table_name,
                'filenameshort' => substr($table->table_name, 0, 8),
                'fileid' => $table->table_name,
                'filenamecc' => ucwords(str_replace('_', '', $table->table_name)),
                'filerenamed' => $table->file_name_renamed ?? '',
                'filegeneratemasterdetail' => false,
                'filedetailfileid' => '',
                'filedetailfilename' => '',
                'filedetailkey' => '',
                'hastimestamps' => $fields->whereIn('field_name', ['created_at', 'updated_at'])->count() >= 2,
                'hasprimarykey' => $fields->where('field_name', 'id')->count() > 0,
                'hasblob' => $fields->contains(fn($f) => in_array(
                    strtolower(strpos($f->field_type, '(') !== false ? substr($f->field_type, 0, strpos($f->field_type, '(')) : $f->field_type),
                    ['tinyblob', 'blob', 'mediumblob', 'longblob', 'image']
                )),
                'primarykeyfield' => $fields->where('field_name', 'id')->first()?->field_name
                                 ?? $fields->where('field_name', 'like', '%_id')->first()?->field_name
                                 ?? $fields->first()?->field_name
                                 ?? 'id',
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
            'schema_id' => $schemaId,
            'schema_version_id' => $latestVersion->id,
            'version_number' => $latestVersion->version_number,
            'gtree' => $gtree,
            'tables_count' => $schemaTables->count(),
            'timestamp' => now()
        ]);

    } catch (Exception $e) {
        return response()->json([
            'error' => 'Exception occurred',
            'message' => $e->getMessage(),
            'schema_id' => $schemaId
        ], 500);
    }
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
            'nmaxtables' => $schemaTables->count(),
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
                    'comment' => $field->comment ?? '',

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
                'filerenamed' => $table->file_name_renamed ?? '',
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
                    $simpleEngine = new SimpleFixedTemplateEngine($gtree, $tableIndex, $table['tablename']);
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
                $simpleEngine = new SimpleFixedTemplateEngine($gtree, 0); // Use table index 0 for project files
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

// Cache Management Routes
Route::middleware('auth:api')->group(function () {
    Route::get('/cache/stats', [App\Http\Controllers\Api\CacheController::class, 'stats']);
    Route::get('/cache/config', [App\Http\Controllers\Api\CacheController::class, 'config']);
    Route::post('/cache/clear', [App\Http\Controllers\Api\CacheController::class, 'clear']);
    // Per-project cache clear (available to project owners/team members,
    // not system-only). Used by the "Cache vor Generierung leeren" checkbox.
    Route::post('/projects/{projectId}/cache/clear', [App\Http\Controllers\Api\CacheController::class, 'clearProjectCache']);
    Route::post('/cache/cleanup', [App\Http\Controllers\Api\CacheController::class, 'cleanup']);
    Route::post('/cache/test-generation', [App\Http\Controllers\Api\CacheController::class, 'testGeneration']);

    // Cache Inspector
    Route::get('/cache/inspect', [App\Http\Controllers\Api\CacheController::class, 'inspect']);
    Route::post('/cache/get-content', [App\Http\Controllers\Api\CacheController::class, 'getContent']);

    // Cache Precompilation & Progress
    Route::post('/cache/precompile/start', [App\Http\Controllers\Api\CacheController::class, 'startPrecompilation']);
    Route::get('/cache/precompile/progress', [App\Http\Controllers\Api\CacheController::class, 'getProgress']);

    // User online status (heartbeat)
    Route::post('/user/heartbeat', [App\Http\Controllers\Api\CacheController::class, 'updateOnlineStatus']);
});

// Form Designer Routes
Route::middleware('auth:api')->group(function () {
    // Access Control
    Route::get('/form-designer/access', [FormDesignerController::class, 'checkAccess']);
    Route::post('/form-designer/unlock', [FormDesignerController::class, 'unlockFeature']);

    // FormSets CRUD
    Route::get('/form-sets', [FormDesignerController::class, 'index']);
    Route::get('/form-sets/{id}', [FormDesignerController::class, 'show']);
    Route::post('/form-sets', [FormDesignerController::class, 'store']);
    Route::put('/form-sets/{id}', [FormDesignerController::class, 'update']);
    Route::delete('/form-sets/{id}', [FormDesignerController::class, 'destroy']);
    Route::post('/form-sets/{id}/clone', [FormDesignerController::class, 'clone']);
    Route::post('/form-sets/import/preview-layouts', [FormDesignerController::class, 'previewImportLayouts']); // literal — before /import
    Route::post('/form-sets/import', [FormDesignerController::class, 'importFormSet']);
    Route::get('/form-sets/{id}/export', [FormDesignerController::class, 'exportFormSet']);

    // FormSet Windows
    Route::get('/form-sets/{id}/windows', [FormDesignerController::class, 'windows']);
    Route::get('/form-sets/{id}/linked-projects', [FormDesignerController::class, 'getLinkedProjects']);
    Route::get('/form-sets/{id}/usage', [FormDesignerController::class, 'usage']);

    // FormWindows
    Route::put('/form-windows/{id}', [FormDesignerController::class, 'updateWindow']);
    // Per-table layout dimension overrides (per [form_window × schema_table])
    Route::get('/form-windows/{windowId}/table-layouts/{tableId}', [FormDesignerController::class, 'getTableLayout']);
    Route::put('/form-windows/{windowId}/table-layouts/{tableId}', [FormDesignerController::class, 'saveTableLayout']);

    // FormWindow Elements
    Route::get('/form-windows/{id}/elements', [FormDesignerController::class, 'elements']);
    Route::put('/form-windows/{id}/elements', [FormDesignerController::class, 'saveElements']);
    Route::post('/form-windows/{id}/elements', [FormDesignerController::class, 'addElement']);

    // FormElements
    Route::delete('/form-elements/{id}', [FormDesignerController::class, 'deleteElement']);

    // Project Integration — FormSet defaults
    Route::post('/projects/{projectId}/form-set', [FormDesignerController::class, 'activateForProject']);
    Route::get('/projects/{projectId}/form-set', [FormDesignerController::class, 'getProjectFormSet']);
    Route::delete('/projects/{projectId}/form-set', [FormDesignerController::class, 'deactivateForProject']);

    // Project Integration — ReportPattern defaults
    Route::post('/projects/{projectId}/report-pattern', [\App\Http\Controllers\Api\ReportPatternController::class, 'activateForProject']);
    Route::get('/projects/{projectId}/report-pattern', [\App\Http\Controllers\Api\ReportPatternController::class, 'getProjectReportPattern']);
    Route::delete('/projects/{projectId}/report-pattern', [\App\Http\Controllers\Api\ReportPatternController::class, 'deactivateForProject']);

    // Form Layout Designer (field placements)
    Route::get('/form-layout/{windowId}/placements', [\App\Http\Controllers\Api\FormLayoutController::class, 'index']);
    Route::put('/form-layout/{windowId}/placements', [\App\Http\Controllers\Api\FormLayoutController::class, 'savePlacements']);
    Route::post('/form-layout/{windowId}/auto-place', [\App\Http\Controllers\Api\FormLayoutController::class, 'autoPlace']);
    Route::delete('/form-layout/placements/{id}', [\App\Http\Controllers\Api\FormLayoutController::class, 'destroy']);

    // Form Layout Designer (button placements)
    Route::get('/form-layout/{windowId}/buttons', [\App\Http\Controllers\Api\FormLayoutController::class, 'getButtonPlacements']);
    Route::put('/form-layout/{windowId}/buttons', [\App\Http\Controllers\Api\FormLayoutController::class, 'saveButtonPlacements']);
    Route::post('/form-layout/{windowId}/auto-place-buttons', [\App\Http\Controllers\Api\FormLayoutController::class, 'autoPlaceButtons']);

    // Form Layout Designer (menu item placements)
    Route::get('/form-layout/{windowId}/menu-items', [\App\Http\Controllers\Api\FormLayoutController::class, 'getMenuPlacements']);
    Route::put('/form-layout/{windowId}/menu-items', [\App\Http\Controllers\Api\FormLayoutController::class, 'saveMenuPlacements']);
    Route::post('/form-layout/{windowId}/auto-place-menu', [\App\Http\Controllers\Api\FormLayoutController::class, 'autoPlaceMenu']);

    // ===== FORM LAYOUT TABS (per window × table tab instances) =====
    Route::get('/form-windows/{windowId}/tables/{tableId}/tabs', [\App\Http\Controllers\Api\FormLayoutController::class, 'listTabs']);
    Route::post('/form-windows/{windowId}/tables/{tableId}/tabs', [\App\Http\Controllers\Api\FormLayoutController::class, 'addTab']);
    Route::patch('/form-layout-tabs/{id}', [\App\Http\Controllers\Api\FormLayoutController::class, 'updateTab']);
    Route::delete('/form-layout-tabs/{id}', [\App\Http\Controllers\Api\FormLayoutController::class, 'deleteTab']);

    // ===== REPORT PATTERNS =====
    Route::get('/report-patterns/access', [\App\Http\Controllers\Api\ReportPatternController::class, 'checkAccess']);
    Route::get('/report-patterns', [\App\Http\Controllers\Api\ReportPatternController::class, 'index']);
    Route::get('/report-patterns/{id}', [\App\Http\Controllers\Api\ReportPatternController::class, 'show']);
    Route::post('/report-patterns', [\App\Http\Controllers\Api\ReportPatternController::class, 'store']);
    Route::put('/report-patterns/{id}', [\App\Http\Controllers\Api\ReportPatternController::class, 'update']);
    Route::delete('/report-patterns/{id}', [\App\Http\Controllers\Api\ReportPatternController::class, 'destroy']);
    Route::get('/report-patterns/{id}/usage', [\App\Http\Controllers\Api\ReportPatternController::class, 'usage']);
    Route::get('/report-patterns/{id}/linked-projects', [\App\Http\Controllers\Api\ReportPatternController::class, 'getLinkedProjects']);
    Route::post('/report-patterns/{id}/clone', [\App\Http\Controllers\Api\ReportPatternController::class, 'clone']);
    Route::post('/report-patterns/import/preview-layouts', [\App\Http\Controllers\Api\ReportPatternController::class, 'previewImportLayouts']); // literal — before /import
    Route::post('/report-patterns/import', [\App\Http\Controllers\Api\ReportPatternController::class, 'importPattern']);
    Route::get('/report-patterns/{id}/export', [\App\Http\Controllers\Api\ReportPatternController::class, 'exportPattern']);

    // Report Pattern Forms
    Route::get('/report-patterns/{id}/forms', [\App\Http\Controllers\Api\ReportPatternController::class, 'forms']);
    Route::put('/report-pattern-forms/{id}', [\App\Http\Controllers\Api\ReportPatternController::class, 'updateForm']);

    // Report Pattern Elements (containers/sections on paper)
    Route::get('/report-pattern-forms/{id}/elements', [\App\Http\Controllers\Api\ReportPatternController::class, 'elements']);
    Route::put('/report-pattern-forms/{id}/elements', [\App\Http\Controllers\Api\ReportPatternController::class, 'saveElements']);
    Route::post('/report-pattern-forms/{id}/elements', [\App\Http\Controllers\Api\ReportPatternController::class, 'addElement']);
    Route::delete('/report-pattern-elements/{id}', [\App\Http\Controllers\Api\ReportPatternController::class, 'deleteElement']);

    // Report Layout Elements (placed fields/controls on paper)
    Route::get('/report-layout/{formId}/elements', [\App\Http\Controllers\Api\ReportLayoutController::class, 'index']);
    Route::put('/report-layout/{formId}/elements', [\App\Http\Controllers\Api\ReportLayoutController::class, 'savePlacements']);
    Route::post('/report-layout/{formId}/auto-place', [\App\Http\Controllers\Api\ReportLayoutController::class, 'autoPlace']);
    Route::post('/report-layout/{formId}/copy-pattern-controls', [\App\Http\Controllers\Api\ReportLayoutController::class, 'copyPatternControls']);
    Route::delete('/report-layout/elements/{id}', [\App\Http\Controllers\Api\ReportLayoutController::class, 'destroy']);

    // Report Images (auth-protected CRUD)
    Route::get('/report-patterns/{patternId}/images', [\App\Http\Controllers\Api\ReportImageController::class, 'index']);
    Route::post('/report-patterns/{patternId}/images', [\App\Http\Controllers\Api\ReportImageController::class, 'upload']);
    Route::get('/report-images/{id}', [\App\Http\Controllers\Api\ReportImageController::class, 'show']);
    Route::delete('/report-images/{id}', [\App\Http\Controllers\Api\ReportImageController::class, 'destroy']);
});

// Report Image serving (public — no auth required for <img src="..."> tags)
Route::get('/report-images/{id}/data', [\App\Http\Controllers\Api\ReportImageController::class, 'serveImage']);

// Service (scoriet-svc) Routes
Route::middleware('auth:api')->prefix('svc')->group(function () {
    // Queue polling (called by scoriet-svc)
    Route::get('/queue', [App\Http\Controllers\Api\SvcController::class, 'getQueue']);

    // Task status and completion
    Route::get('/tasks/{id}', [App\Http\Controllers\Api\SvcController::class, 'getTaskStatus']);
    Route::post('/tasks/{id}/complete', [App\Http\Controllers\Api\SvcController::class, 'completeTask']);
    Route::post('/tasks/{id}/fail', [App\Http\Controllers\Api\SvcController::class, 'failTask']);

    // Task creation (called from GUI)
    Route::post('/tasks/database-import', [App\Http\Controllers\Api\SvcController::class, 'createDatabaseImportTask']);
    Route::post('/tasks/project-download', [App\Http\Controllers\Api\SvcController::class, 'createProjectDownloadTask']);
});

// Messaging Routes
Route::middleware('auth:api')->prefix('messages')->group(function () {
    // Threads
    Route::get('/threads', [App\Http\Controllers\Api\MessageController::class, 'threads']);
    Route::get('/threads/{id}', [App\Http\Controllers\Api\MessageController::class, 'showThread']);
    Route::post('/threads', [App\Http\Controllers\Api\MessageController::class, 'createThread']);
    Route::post('/threads/{id}/reply', [App\Http\Controllers\Api\MessageController::class, 'reply']);
    Route::delete('/threads/{id}', [App\Http\Controllers\Api\MessageController::class, 'deleteThread']);
    Route::post('/threads/{id}/read', [App\Http\Controllers\Api\MessageController::class, 'markAsRead']);

    // Counts
    Route::get('/unread-count', [App\Http\Controllers\Api\MessageController::class, 'unreadCount']);

    // Users list for recipient selection
    Route::get('/users', [App\Http\Controllers\Api\MessageController::class, 'users']);

    // Recipient options (projects and teams)
    Route::get('/recipient-options', [App\Http\Controllers\Api\MessageController::class, 'recipientOptions']);

    // Send to project/team
    Route::post('/send-to-project', [App\Http\Controllers\Api\MessageController::class, 'sendToProject']);
    Route::post('/send-to-team', [App\Http\Controllers\Api\MessageController::class, 'sendToTeam']);

    // Attachments access
    Route::get('/attachments/access', [App\Http\Controllers\Api\MessageController::class, 'attachmentAccess']);
    Route::post('/attachments/unlock', [App\Http\Controllers\Api\MessageController::class, 'unlockAttachments']);
    Route::get('/attachments/{attachmentId}/download', [App\Http\Controllers\Api\MessageController::class, 'downloadAttachment']);

    // Admin broadcast
    Route::post('/broadcast', [App\Http\Controllers\Api\MessageController::class, 'broadcast']);
});

// Kanban Board Routes
Route::middleware('auth:api')->prefix('kanban')->group(function () {
    // Access Control
    Route::get('/access', [App\Http\Controllers\Api\KanbanController::class, 'checkAccess']);
    Route::post('/unlock', [App\Http\Controllers\Api\KanbanController::class, 'unlockFeature']);

    // Board
    Route::get('/project/{projectId}', [App\Http\Controllers\Api\KanbanController::class, 'getBoard']);
    Route::put('/board/{boardId}', [App\Http\Controllers\Api\KanbanController::class, 'updateBoard']);

    // Columns
    Route::post('/board/{boardId}/columns', [App\Http\Controllers\Api\KanbanController::class, 'createColumn']);
    Route::put('/columns/{columnId}', [App\Http\Controllers\Api\KanbanController::class, 'updateColumn']);
    Route::delete('/columns/{columnId}', [App\Http\Controllers\Api\KanbanController::class, 'deleteColumn']);
    Route::put('/board/{boardId}/columns/reorder', [App\Http\Controllers\Api\KanbanController::class, 'reorderColumns']);

    // Cards
    Route::post('/columns/{columnId}/cards', [App\Http\Controllers\Api\KanbanController::class, 'createCard']);
    Route::get('/cards/{cardId}', [App\Http\Controllers\Api\KanbanController::class, 'getCard']);
    Route::put('/cards/{cardId}', [App\Http\Controllers\Api\KanbanController::class, 'updateCard']);
    Route::put('/cards/{cardId}/move', [App\Http\Controllers\Api\KanbanController::class, 'moveCard']);
    Route::delete('/cards/{cardId}', [App\Http\Controllers\Api\KanbanController::class, 'deleteCard']);

    // Comments
    Route::post('/cards/{cardId}/comments', [App\Http\Controllers\Api\KanbanController::class, 'addComment']);

    // Labels
    Route::post('/board/{boardId}/labels', [App\Http\Controllers\Api\KanbanController::class, 'createLabel']);
    Route::put('/labels/{labelId}', [App\Http\Controllers\Api\KanbanController::class, 'updateLabel']);
    Route::delete('/labels/{labelId}', [App\Http\Controllers\Api\KanbanController::class, 'deleteLabel']);

    // Assignees
    Route::post('/cards/{cardId}/assign-me', [App\Http\Controllers\Api\KanbanController::class, 'assignMe']);
    Route::delete('/cards/{cardId}/unassign-me', [App\Http\Controllers\Api\KanbanController::class, 'unassignMe']);
    Route::post('/cards/{cardId}/assignees', [App\Http\Controllers\Api\KanbanController::class, 'addAssignee']);
    Route::delete('/cards/{cardId}/assignees/{userId}', [App\Http\Controllers\Api\KanbanController::class, 'removeAssignee']);

    // Team members (for assignee dropdown)
    Route::get('/board/{boardId}/team-members', [App\Http\Controllers\Api\KanbanController::class, 'getTeamMembers']);

    // Kanban Roles
    Route::get('/roles', [App\Http\Controllers\Api\KanbanController::class, 'getAvailableRoles']);
    Route::get('/board/{boardId}/roles', [App\Http\Controllers\Api\KanbanController::class, 'getProjectRoles']);
    Route::post('/board/{boardId}/roles', [App\Http\Controllers\Api\KanbanController::class, 'setUserRole']);
    Route::delete('/board/{boardId}/roles/{userId}', [App\Http\Controllers\Api\KanbanController::class, 'removeUserRole']);
});

// ============================================================================
// Registration Invites (Public Routes)
// ============================================================================
Route::prefix('registration')->group(function () {
    // Check if registration is open (public)
    Route::get('/status', [App\Http\Controllers\RegistrationInviteController::class, 'getStatus']);
    // Validate invite token (public)
    Route::post('/validate-token', [App\Http\Controllers\RegistrationInviteController::class, 'validateToken']);
});

// ============================================================================
// Registration Invites Management (Admin Only - requires auth)
// ============================================================================
Route::prefix('invites')->middleware('auth:api')->group(function () {
    Route::get('/', [App\Http\Controllers\RegistrationInviteController::class, 'index']);
    Route::post('/', [App\Http\Controllers\RegistrationInviteController::class, 'store']);
    Route::post('/{invite}/resend', [App\Http\Controllers\RegistrationInviteController::class, 'resend']);
    Route::delete('/{invite}', [App\Http\Controllers\RegistrationInviteController::class, 'destroy']);
});

