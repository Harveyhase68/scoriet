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
    Route::get('/ultimate-template/{templateId}', [UltimateTemplateController::class, 'processTemplate'])
        ->name('api.ultimate-template.process');
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

    // Template-DB Schema Dependencies Management
    Route::prefix('template-db-schema')->group(function () {
        // Global DB Schemas (public schemas from system)
        Route::get('/global-schemas', [DbSchemaController::class, 'getGlobalSchemas']);

        // DB Schema Management
        Route::get('/schemas', [DbSchemaController::class, 'index']);
        Route::get('/schemas/{id}', [DbSchemaController::class, 'show']);
        Route::post('/schemas/{id}/copy', [DbSchemaController::class, 'copySchema']);

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

    // Project Git Integration Settings
    Route::get('/projects/{project}/git-settings', [ProjectController::class, 'getGitSettings']);
    Route::put('/projects/{project}/git-settings', [ProjectController::class, 'updateGitSettings']);
    Route::delete('/projects/{project}/git-settings', [ProjectController::class, 'removeGitIntegration']);

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

    // Translation Export/Import
    Route::get('/translations/export', [TranslationExportController::class, 'export']);
    Route::post('/translations/import', [TranslationExportController::class, 'import']);

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
            $controller = app(SchemaExportController::class);
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
                    'order' => $field->field_order
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
                'filegeneratemasterdetail' => false,
                'filedetailfileid' => '',
                'filedetailfilename' => '',
                'filedetailkey' => '',
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
    Route::post('/cache/clear', [App\Http\Controllers\Api\CacheController::class, 'clear']);
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

    // FormSet Windows
    Route::get('/form-sets/{id}/windows', [FormDesignerController::class, 'windows']);
    Route::get('/form-sets/{id}/linked-projects', [FormDesignerController::class, 'getLinkedProjects']);

    // FormWindows
    Route::put('/form-windows/{id}', [FormDesignerController::class, 'updateWindow']);

    // FormWindow Elements
    Route::get('/form-windows/{id}/elements', [FormDesignerController::class, 'elements']);
    Route::put('/form-windows/{id}/elements', [FormDesignerController::class, 'saveElements']);
    Route::post('/form-windows/{id}/elements', [FormDesignerController::class, 'addElement']);

    // FormElements
    Route::delete('/form-elements/{id}', [FormDesignerController::class, 'deleteElement']);

    // Project Integration
    Route::post('/projects/{projectId}/form-set', [FormDesignerController::class, 'activateForProject']);
    Route::get('/projects/{projectId}/form-set', [FormDesignerController::class, 'getProjectFormSet']);
});

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

