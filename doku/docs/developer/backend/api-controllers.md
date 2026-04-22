---
sidebar_position: 2
title: API Controllers Reference
description: Detailed documentation of all API controllers and endpoints
---

# API Controllers Reference

The `Api/` directory contains RESTful API endpoint handlers that follow standard REST conventions. All API controllers require authentication via JWT token (except for public endpoints).

## API Controller Categories

### Project Management

#### ProjectController
**File**: `app/Http/Controllers/Api/ProjectController.php`

Manages project CRUD operations and project-related data.

**Methods**:
- `index(Request $request): JsonResponse` - List projects visible to user
  - Supports `public` parameter to show public project gallery
  - Returns project counts and subscription information
  - Applies soft-lock status from subscriptions
  
- `show($id): JsonResponse` - Get single project with full details
  - Includes teams, schemas, templates, forms, reports, kanban boards
  - Checks user has access (owner or team member)
  
- `store(Request $request): JsonResponse` - Create new project
  - Validates project name and description
  - Creates subscription record with default credits
  - Returns newly created project
  
- `update($id, Request $request): JsonResponse` - Update project
  - Validates ownership or team membership
  - Updates name, description, settings
  - Emits ProjectUpdated event
  
- `destroy($id): JsonResponse` - Delete project
  - Validates ownership
  - Soft-deletes project record
  
- `lock($id): JsonResponse` - Lock project (prevent modifications)
  - Emits ProjectLocked event
  
- `unlock($id): JsonResponse` - Unlock project
  - Emits ProjectUnlocked event

**Example**:
```php
// Create new project
POST /api/projects
{
    "name": "Mobile App Backend",
    "description": "REST API for mobile application",
    "is_public": false
}

// Response
{
    "message": "Project created successfully",
    "project": {
        "id": 1,
        "name": "Mobile App Backend",
        "owner_id": 123,
        "subscription": { ... }
    }
}
```

#### SchemaController (Api)
**File**: `app/Http/Controllers/Api/SchemaController.php`

Database schema management including parsing, storage, and retrieval.

**Methods**:
- `index($projectId)` - List all schemas in a project
- `show($projectId, $schemaId)` - Get schema with all tables and fields
- `store($projectId, Request $request)` - Create new schema from SQL
- `update($projectId, $schemaId, Request $request)` - Update schema
- `destroy($projectId, $schemaId)` - Delete schema
- `parse(Request $request)` - Parse SQL and return table structure
- `export($projectId, $schemaId)` - Export schema as SQL

**Key Features**:
- SQL parser support for MySQL, PostgreSQL, SQLite, MS-SQL, Firebird
- Schema versioning for tracking changes
- Field and constraint storage with relationships

#### SchemaDiffController
**File**: `app/Http/Controllers/Api/SchemaDiffController.php`

Compares schemas to detect changes and migrations.

**Methods**:
- `compare($schemaId1, $schemaId2)` - Show differences between schemas
- `migration($schemaId1, $schemaId2)` - Generate migration SQL

### Template Management

#### TemplateController (Api)
**File**: `app/Http/Controllers/Api/TemplateController.php`

Code template CRUD and management.

**Methods**:
- `index($projectId)` - List project templates
- `show($projectId, $templateId)` - Get template details
- `store($projectId, Request $request)` - Create new template
- `update($projectId, $templateId, Request $request)` - Update template
- `destroy($projectId, $templateId)` - Delete template
- `duplicate($projectId, $templateId)` - Clone template
- `getFileStructure($projectId, $templateId)` - Get generated file structure

**Template Features**:
- Placeholder system: `{:projectname:}`, `{:item.name:}`
- Loop constructs: `{:for items:}{:item.name:}{:endfor:}`
- Conditionals: `{:if condition:}...{:else:}...{:endif:}`
- Code blocks: `{:code:}...{:codeend:}`
- Include system: `{:include: path/file.ext:}`

#### UltimateTemplateController
**File**: `app/Http/Controllers/Api/UltimateTemplateController.php`

Advanced template functionality and execution.

**Methods**:
- `execute(Request $request)` - Execute template with context data
- `preview(Request $request)` - Preview template output without saving
- `compile(Request $request)` - Compile template to check for errors

#### TemplateVariableController
**File**: `app/Http/Controllers/Api/TemplateVariableController.php`

Manages template input variables and placeholders.

**Methods**:
- `index($templateId)` - List template variables
- `store($templateId, Request $request)` - Add new variable
- `update($templateId, $variableId, Request $request)` - Update variable
- `destroy($templateId, $variableId)` - Remove variable

#### TemplateMediaController
**File**: `app/Http/Controllers/Api/TemplateMediaController.php`

Manages media files (images, documents) within templates.

**Methods**:
- `serve($mediaId)` - Serve media file (public endpoint)
- `store($templateId, Request $request)` - Upload media
- `destroy($mediaId)` - Delete media

### Form & Report Management

#### FormDesignerController
**File**: `app/Http/Controllers/Api/FormDesignerController.php`

Form creation and configuration.

**Methods**:
- `index($projectId)` - List forms
- `show($projectId, $formId)` - Get form with fields
- `store($projectId, Request $request)` - Create form
- `update($projectId, $formId, Request $request)` - Update form
- `destroy($projectId, $formId)` - Delete form
- `addField($formId, Request $request)` - Add form field
- `removeField($fieldId)` - Remove field

#### FormLayoutController
**File**: `app/Http/Controllers/Api/FormLayoutController.php`

Form layout and positioning configuration.

#### ReportLayoutController
**File**: `app/Http/Controllers/Api/ReportLayoutController.php`

Report design and layout management.

#### ReportPatternController
**File**: `app/Http/Controllers/Api/ReportPatternController.php`

Predefined report patterns and templates.

#### ReportImageController
**File**: `app/Http/Controllers/Api/ReportImageController.php`

Report image generation and handling.

### Kanban Management

#### KanbanController
**File**: `app/Http/Controllers/Api/KanbanController.php`

Kanban board operations for task management.

**Methods**:
- `index($projectId)` - List kanban boards
- `show($boardId)` - Get board with columns and cards
- `store($projectId, Request $request)` - Create board
- `update($boardId, Request $request)` - Update board
- `destroy($boardId)` - Delete board
- `moveCard($cardId, Request $request)` - Move card between columns
- `updateCard($cardId, Request $request)` - Update card details

### Code & Deployment

#### CodeAdjustmentController
**File**: `app/Http/Controllers/Api/CodeAdjustmentController.php`

Post-generation code modifications and adjustments.

**Methods**:
- `index($projectId)` - List code adjustments
- `store($projectId, Request $request)` - Create adjustment
- `apply($adjustmentId)` - Apply adjustment to generated code

#### DeploymentLogController
**File**: `app/Http/Controllers/Api/DeploymentLogController.php`

Deployment history and logs.

**Methods**:
- `index($projectId)` - List deployment attempts
- `show($logId)` - Get deployment log details
- `retry($logId)` - Retry failed deployment

#### FtpSshUploadController
**File**: `app/Http/Controllers/Api/FtpSshUploadController.php`

FTP/SSH deployment functionality.

**Methods**:
- `upload($projectId, Request $request)` - Deploy via FTP/SSH
- `testConnection(Request $request)` - Test FTP/SSH credentials

#### GeneratedProjectUploadController
**File**: `app/Http/Controllers/Api/GeneratedProjectUploadController.php`

Handles generated project file uploads.

#### GitProviderController
**File**: `app/Http/Controllers/Api/GitProviderController.php`

GitHub/GitLab integration for code deployment.

**Methods**:
- `authorize(Request $request)` - OAuth flow
- `commit($projectId, Request $request)` - Commit to repository
- `push($projectId, Request $request)` - Push changes

### Messaging & Collaboration

#### MessageController
**File**: `app/Http/Controllers/Api/MessageController.php`

Team messaging and discussion threads.

**Methods**:
- `index($threadId)` - Get messages in thread
- `store($threadId, Request $request)` - Create message
- `update($messageId, Request $request)` - Edit message
- `destroy($messageId)` - Delete message
- `addAttachment($messageId, Request $request)` - Attach file
- `downloadSigned($attachmentId)` - Download attachment via signed URL

### Translation & Localization

#### LanguageController
**File**: `app/Http/Controllers/Api/LanguageController.php`

Multi-language support and management.

**Methods**:
- `index()` - List available languages
- `detect(Request $request)` - Detect user language

#### SchemaTranslationController
**File**: `app/Http/Controllers/Api/SchemaTranslationController.php`

Schema element translations (table names, column names).

**Methods**:
- `index($schemaId)` - Get schema translations
- `store($schemaId, Request $request)` - Add translation
- `update($translationId, Request $request)` - Update translation

#### TranslationExportController
**File**: `app/Http/Controllers/Api/TranslationExportController.php`

Export translations in various formats.

**Methods**:
- `export($projectId)` - Export as JSON, CSV, etc.

#### AutoTranslateController
**File**: `app/Http/Controllers/Api/AutoTranslateController.php`

Automatic translation using external services.

**Methods**:
- `translate($projectId, Request $request)` - Auto-translate content

### Billing & Subscriptions

#### SubscriptionController
**File**: `app/Http/Controllers/Api/SubscriptionController.php`

User subscription management.

**Methods**:
- `index()` - Get user's subscriptions
- `create(Request $request)` - Create new subscription
- `cancel($subscriptionId)` - Cancel subscription
- `renew($subscriptionId)` - Renew subscription

#### CliSubscriptionController
**File**: `app/Http/Controllers/Api/CliSubscriptionController.php`

CLI tool subscription management.

#### CreditPackageController
**File**: `app/Http/Controllers/Api/CreditPackageController.php`

Purchase credit packages for code generation.

**Methods**:
- `index()` - List available packages
- `purchase($packageId)` - Purchase credits

#### StripeController
**File**: `app/Http/Controllers/Api/StripeController.php`

Stripe payment processing.

**Methods**:
- `handleWebhook(Request $request)` - Process Stripe webhooks
- `createPaymentIntent(Request $request)` - Initiate payment

#### PayPalController
**File**: `app/Http/Controllers/Api/PayPalController.php`

PayPal payment integration.

**Methods**:
- `handleWebhook(Request $request)` - Process PayPal webhooks
- `createOrder(Request $request)` - Create PayPal order

#### PatronSubscriptionController
**File**: `app/Http/Controllers/Api/PatronSubscriptionController.php`

Patron/sponsor subscription tier management.

#### PayoutAdminController
**File**: `app/Http/Controllers/Api/PayoutAdminController.php`

Administrative payout management for sellers.

### Settings & Configuration

#### SettingsController
**File**: `app/Http/Controllers/Api/SettingsController.php`

Application and user settings.

**Methods**:
- `index()` - Get all user settings
- `update(Request $request)` - Update settings
- `getGlobalSettings()` - Get system-wide settings

#### CacheController
**File**: `app/Http/Controllers/Api/CacheController.php`

Cache management and clearing.

**Methods**:
- `clear(Request $request)` - Clear specified cache

#### PushSubscriptionController
**File**: `app/Http/Controllers/Api/PushSubscriptionController.php`

Web push notification subscriptions.

**Methods**:
- `store(Request $request)` - Subscribe to notifications
- `destroy($subscriptionId)` - Unsubscribe

### Admin & Monitoring

#### PerformanceMetricsController
**File**: `app/Http/Controllers/Api/PerformanceMetricsController.php`

Performance tracking and analytics.

**Methods**:
- `index()` - Get performance metrics
- `record(Request $request)` - Record metrics

#### VisitorController
**File**: `app/Http/Controllers/Api/VisitorController.php`

Visitor tracking and analytics.

#### TicketController
**File**: `app/Http/Controllers/Api/TicketController.php`

Support ticket management.

#### ArchiveController
**File**: `app/Http/Controllers/Api/ArchiveController.php`

Project and resource archival.

**Methods**:
- `archive($projectId)` - Archive project
- `unarchive($projectId)` - Restore archived project

### Project & Template Imports/Exports

#### ProjectImportController
**File**: `app/Http/Controllers/Api/ProjectImportController.php`

Import projects from files or templates.

**Methods**:
- `import(Request $request)` - Import project file
- `validate(Request $request)` - Validate import file

#### ProjectExportController
**File**: `app/Http/Controllers/Api/ProjectExportController.php`

Export projects to shareable formats.

**Methods**:
- `export($projectId)` - Generate export file

#### TemplateImportController
**File**: `app/Http/Controllers/Api/TemplateImportController.php`

Import template libraries.

#### TemplateStoreController
**File**: `app/Http/Controllers/Api/TemplateStoreController.php`

Template marketplace and public templates.

**Methods**:
- `index()` - Browse templates
- `show($templateId)` - View template
- `install($templateId)` - Install template to project

#### TemplateReviewController
**File**: `app/Http/Controllers/Api/TemplateReviewController.php`

User reviews and ratings for templates.

#### UltimateTemplateController
**File**: `app/Http/Controllers/Api/UltimateTemplateController.php`

Premium template functionality.

### Project Generation & Tree

#### ProjectGenerationTreeController
**File**: `app/Http/Controllers/Api/ProjectGenerationTreeController.php`

Displays file tree of generated project output.

**Methods**:
- `show($projectId)` - Get file tree structure

#### SvcController
**File**: `app/Http/Controllers/Api/SvcController.php`

Service controller for utility operations.

### Team Management

#### TeamRoleController
**File**: `app/Http/Controllers/Api/TeamRoleController.php`

Team member roles and permissions.

**Methods**:
- `index($teamId)` - List team roles
- `update($roleId, Request $request)` - Update role permissions

### Project Templates & Variables

#### ProjectTemplateVariableValueController
**File**: `app/Http/Controllers/Api/ProjectTemplateVariableValueController.php`

Template variable values per project.

**Methods**:
- `index($projectId)` - Get variable values
- `update($projectId, $variableId, Request $request)` - Set value

## Common API Response Patterns

### Success Response
```json
{
    "message": "Operation successful",
    "data": { /* resource data */ }
}
```

### Error Response
```json
{
    "message": "Error description",
    "errors": { /* field errors */ }
}
```

### Paginated Response
```json
{
    "data": [ /* resources */ ],
    "links": {
        "first": "...",
        "last": "...",
        "next": "...",
        "prev": "..."
    },
    "meta": {
        "current_page": 1,
        "total": 100,
        "per_page": 15
    }
}
```

## Authentication & Authorization

All protected API endpoints require:
1. `Authorization: Bearer {token}` header
2. Valid JWT token from login
3. User must have access to resource (owner or team member)

## Next Steps

- Read [Routes Reference](./api-routes.md) for complete endpoint listing
- Read [Services](./services.md) for business logic implementation
- Read [Models](./models.md) for data relationships
