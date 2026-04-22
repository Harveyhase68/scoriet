---
sidebar_position: 4
title: Eloquent Models
description: Data models and relationships in Scoriet
---

# Eloquent Models

Scoriet uses Laravel Eloquent ORM for database interactions. Models represent database tables and provide an object-oriented interface for data manipulation.

## Directory Structure

```
app/Models/
├── User.php                          # User accounts
├── Project.php                       # Code generation projects
├── Team.php                          # Team organizations
├── TeamMember.php                    # Team membership
├── TeamRole.php                      # Team roles and permissions
├── TeamInvitation.php                # Team invitations
├── ProjectInvitation.php             # Project share invitations
├── ProjectApplication.php            # Join requests for public projects
├── RegistrationInvite.php            # Invitation-only registration
│
├── Schema*.php                       # Database schema models
│   ├── Schema.php
│   ├── SchemaVersion.php
│   ├── SchemaTable.php
│   ├── SchemaField.php
│   ├── SchemaConstraint.php
│   ├── SchemaIndex.php
│   ├── SchemaTranslation.php
│   └── SchemaDiff.php
│
├── Template*.php                     # Code template models
│   ├── Template.php
│   ├── TemplateFile.php
│   ├── TemplateVariable.php
│   ├── TemplateMediaFile.php
│   ├── TemplateReview.php
│   └── TemplateStore.php
│
├── Form*.php                         # Form builder models
│   ├── FormSet.php
│   ├── FormWindow.php
│   ├── FormElement.php
│   ├── FormItemPlacement.php
│   ├── FormLayout.php
│   └── FormDesigner.php
│
├── Report*.php                       # Report generation models
│   ├── ReportLayout.php
│   ├── ReportPattern.php
│   ├── ReportImage.php
│   └── ReportGroup.php
│
├── Kanban*.php                       # Kanban/task management models
│   ├── KanbanBoard.php
│   ├── KanbanColumn.php
│   ├── KanbanCard.php
│   ├── KanbanCardActivity.php
│   ├── KanbanCardAssignee.php
│   ├── KanbanCardComment.php
│   ├── KanbanLabel.php
│   └── KanbanCardDependency.php
│
├── Message*.php                      # Messaging models
│   ├── Message.php
│   ├── MessageThread.php
│   ├── MessageThreadParticipant.php
│   ├── MessageAttachment.php
│   └── MessageNotification.php
│
├── Subscription*.php                 # Billing models
│   ├── Subscription.php
│   ├── SubscriptionPlan.php
│   ├── CreditPackage.php
│   ├── CreditTransaction.php
│   ├── Payout.php
│   └── PayoutItem.php
│
├── Cli*.php                          # CLI models
│   ├── CliTask.php
│   ├── CliDevice.php
│   └── CliSubscription.php
│
├── Code*.php                         # Code models
│   ├── CodeAdjustment.php
│   ├── CodeAdjustmentInsertion.php
│   └── DeploymentLog.php
│
├── FloatingSchema.php                # Floating (temporary) schemas
├── GenerationLog.php                 # Generation history
├── Language.php                      # Available languages
├── Page.php                          # CMS pages
├── Settings.php                      # Application settings
└── [Other models]
```

## Core User & Team Models

### User
**File**: `app/Models/User.php`

Represents a user account in the system.

**Key Properties**:
```php
$user->id                           // Unique identifier
$user->name                         // Full name
$user->username                     // Unique username
$user->email                        // Email address
$user->password                     // Hashed password
$user->language                     // Preferred language (en, de, fr, es, it)
$user->theme                        // Theme preference (dark, light, green, auto)
$user->email_verified_at            // Email verification timestamp
$user->is_seller                    // Seller account status
$user->pending_project_invitation_id// Pending invitation
$user->last_monthly_credits_at      // Last monthly credit claim
```

**Key Methods**:
```php
$user->projects()                   // User's own projects
$user->teams()                      // Teams user is member of
$user->tokens()                     // API tokens for authentication
$user->hasPendingInvitation()       // Check pending invite
$user->claimMonthlyCredits()        // Award monthly credits
$user->recordLogin()                // Log user login
$user->updateSellerType()           // Auto-determine seller type
$user->isDeviceTrusted($deviceId)   // Check if device is trusted
$user->trustDevice($id, $browser)   // Mark device as trusted
$user->hasTwoFactorEnabled()        // Check 2FA status
$user->needsTwoFactorReVerification()// Check if 2FA re-verification needed
```

**Seller Profile Properties**:
```php
$user->company_name                 // Company name
$user->company_address              // Business address
$user->company_country              // Country code
$user->vat_id                       // VAT/Tax ID
$user->business_registration        // Business registration number
$user->tax_id                       // Tax identification
$user->payout_method                // bank_transfer or paypal
$user->paypal_payout_email          // PayPal email
$user->bank_iban                    // IBAN for bank transfers
$user->bank_bic                     // BIC for bank transfers
$user->bank_account_holder          // Account holder name
```

**Relationships**:
```php
$user->projects()                   // HasMany: Projects they own
$user->teams()                      // BelongsToMany: Teams they're in
$user->teamMembers()                // HasMany: TeamMember records
$user->tokens()                     // HasMany: API tokens
$user->subscriptions()              // HasMany: Active subscriptions
$user->creditTransactions()         // HasMany: Credit history
$user->payouts()                    // HasMany: Payout requests
$user->messages()                   // HasMany: Sent messages
$user->trustedDevices()             // HasMany: Trusted devices
```

### Project
**File**: `app/Models/Project.php`

Core project entity for code generation.

**Key Properties**:
```php
$project->id                        // Unique identifier
$project->name                      // Project name
$project->description               // Project description
$project->owner_id                  // Owner user ID (BIGINT)
$project->is_public                 // Public visibility flag
$project->allow_join_requests       // Allow public join requests
$project->join_code                 // Code for joining project
$project->is_locked                 // Locked from modifications
$project->is_archived               // Archived project
$project->created_at                // Creation date
$project->updated_at                // Last modification
$project->deleted_at                // Soft delete (null = active)
```

**Key Methods**:
```php
$project->getCounts()               // Get schemas, templates counts
$project->owner()                   // Get owner user
$project->teams()                   // Get associated teams
$project->schemas()                 // Get all schemas
$project->templates()               // Get all templates
$project->forms()                   // Get all forms
$project->reports()                 // Get all reports
$project->kanbanBoards()            // Get kanban boards
$project->subscription()            // Get subscription
$project->generateCode()            // Execute code generation
```

**Relationships**:
```php
$project->owner()                   // BelongsTo: User who owns project
$project->teams()                   // BelongsToMany: Associated teams
$project->schemas()                 // HasMany: Database schemas
$project->templates()               // HasMany: Code templates
$project->forms()                   // HasMany: Form definitions
$project->reports()                 // HasMany: Report layouts
$project->kanbanBoards()            // HasMany: Kanban boards
$project->subscription()            // HasOne: Subscription info
$project->invitations()             // HasMany: Pending invitations
$project->applicationRequests()     // HasMany: Join requests
```

### Team
**File**: `app/Models/Team.php`

Represents a team for project collaboration.

**Key Properties**:
```php
$team->id                           // Unique identifier
$team->name                         // Team name
$team->owner_id                     // Team owner user ID
$team->description                  // Team description
$team->created_at                   // Creation date
```

**Relationships**:
```php
$team->owner()                      // BelongsTo: Team owner
$team->members()                    // BelongsToMany: Team members
$team->projects()                   // BelongsToMany: Team projects
$team->invitations()                // HasMany: Pending invitations
$team->roles()                      // HasMany: Custom roles
```

### TeamMember
**File**: `app/Models/TeamMember.php`

Represents a user's membership in a team.

**Key Properties**:
```php
$member->user_id                    // User ID
$member->team_id                    // Team ID
$member->role_id                    // Role ID (nullable)
$member->joined_at                  // Join date
```

**Relationships**:
```php
$member->user()                     // BelongsTo: User
$member->team()                     // BelongsTo: Team
$member->role()                     // BelongsTo: TeamRole
```

### TeamRole
**File**: `app/Models/TeamRole.php`

Defines roles and permissions within a team.

**Key Properties**:
```php
$role->id                           // Unique identifier
$role->team_id                      // Team ID
$role->name                         // Role name (e.g., "Editor", "Viewer")
$role->permissions                  // JSON array of permissions
```

**Standard Roles**:
- `owner` - Full access
- `editor` - Modify projects and templates
- `viewer` - Read-only access
- `developer` - Code generation and deployment

## Schema Models

### Schema
**File**: `app/Models/Schema.php`

Represents a database schema (structure).

**Key Properties**:
```php
$schema->id                         // Unique identifier
$schema->project_id                 // Parent project
$schema->name                       // Schema name
$schema->database_type              // MySQL, PostgreSQL, SQLite, MSSQL, Firebird
$schema->original_sql               // Uploaded SQL text
$schema->created_at                 // Creation date
```

**Relationships**:
```php
$schema->project()                  // BelongsTo: Project
$schema->versions()                 // HasMany: SchemaVersion (history)
$schema->tables()                   // HasMany: SchemaTable
$schema->translations()             // HasMany: SchemaTranslation
```

### SchemaVersion
**File**: `app/Models/SchemaVersion.php`

Tracks schema changes over time.

**Key Properties**:
```php
$version->schema_id                 // Parent schema
$version->version_number            // Version number
$version->created_at                // Creation timestamp
```

**Relationships**:
```php
$version->schema()                  // BelongsTo: Schema
$version->tables()                  // HasMany: SchemaTable
```

### SchemaTable
**File**: `app/Models/SchemaTable.php`

Represents a table within a schema.

**Key Properties**:
```php
$table->schema_id                   // Parent schema ID
$table->table_name                  // Table name
$table->description                 // Table documentation
$table->row_count                   // Estimated rows
```

**Relationships**:
```php
$table->schema()                    // BelongsTo: Schema
$table->fields()                    // HasMany: SchemaField
$table->constraints()               // HasMany: SchemaConstraint
$table->indexes()                   // HasMany: SchemaIndex
```

### SchemaField
**File**: `app/Models/SchemaField.php`

Represents a column/field in a table.

**Key Properties**:
```php
$field->table_id                    // Parent table ID
$field->field_name                  // Column name
$field->field_type                  // Data type (INT, VARCHAR, TEXT, etc)
$field->length                      // Field length for VARCHAR, etc
$field->is_nullable                 // NULL allowed
$field->is_auto_increment           // AUTO_INCREMENT
$field->default_value               // Default value
$field->comment                     // Column documentation
```

**Relationships**:
```php
$field->table()                     // BelongsTo: SchemaTable
$field->constraint()                // HasOne: SchemaConstraint (foreign key)
```

### SchemaConstraint
**File**: `app/Models/SchemaConstraint.php`

Represents constraints (primary key, foreign key, unique).

**Key Properties**:
```php
$constraint->field_id               // SchemaField ID
$constraint->type                   // primary, foreign, unique
$constraint->referenced_table       // For foreign keys
$constraint->referenced_field       // For foreign keys
```

## Template Models

### Template
**File**: `app/Models/Template.php`

Code generation template definition.

**Key Properties**:
```php
$template->id                       // Unique identifier
$template->project_id               // Parent project
$template->name                     // Template name
$template->description              // Template description
$template->content                  // Template source code
$template->engine_type              // Template engine (ultimate, simple)
$template->is_published             // Published to marketplace
$template->download_count           // Number of downloads
```

**Relationships**:
```php
$template->project()                // BelongsTo: Project
$template->variables()              // HasMany: TemplateVariable
$template->files()                  // HasMany: TemplateFile
$template->mediaFiles()             // HasMany: TemplateMediaFile
$template->reviews()                // HasMany: TemplateReview
```

**Key Methods**:
```php
$template->execute($context)        // Run template with data
$template->compile()                // Validate template syntax
$template->publish()                // Publish to marketplace
```

### TemplateVariable
**File**: `app/Models/TemplateVariable.php`

Input variable for template execution.

**Key Properties**:
```php
$var->template_id                   // Parent template
$var->name                          // Variable name
$var->description                   // Variable description
$var->type                          // Data type (string, number, array)
$var->required                      // Required or optional
$var->default_value                 // Default value
```

### TemplateFile
**File**: `app/Models/TemplateFile.php`

Generated file definition within template.

**Key Properties**:
```php
$file->template_id                  // Parent template
$file->file_name                    // Output file path
$file->content                      // File content (with placeholders)
$file->order                        // Generation order
```

## Kanban Models

### KanbanBoard
**File**: `app/Models/KanbanBoard.php`

Kanban board for task management.

**Key Properties**:
```php
$board->project_id                  // Parent project
$board->name                        // Board name
$board->description                 // Board description
```

**Relationships**:
```php
$board->project()                   // BelongsTo: Project
$board->columns()                   // HasMany: KanbanColumn
$board->cards()                     // HasMany: KanbanCard
```

### KanbanColumn
**File**: `app/Models/KanbanColumn.php`

Column within a kanban board.

**Key Properties**:
```php
$column->board_id                   // Parent board
$column->name                       // Column name
$column->order                      // Display order
```

### KanbanCard
**File**: `app/Models/KanbanCard.php`

Task card in kanban column.

**Key Properties**:
```php
$card->column_id                    // Parent column
$card->title                        // Card title
$card->description                  // Card description
$card->order                        // Position in column
$card->priority                     // Priority level
$card->due_date                     // Due date
$card->assignee_id                  // Assigned user
```

**Relationships**:
```php
$card->column()                     // BelongsTo: KanbanColumn
$card->assignees()                  // BelongsToMany: Users
$card->comments()                   // HasMany: KanbanCardComment
$card->activities()                 // HasMany: KanbanCardActivity
```

## Message Models

### Message
**File**: `app/Models/Message.php`

Team message within thread.

**Key Properties**:
```php
$message->thread_id                 // Parent thread
$message->user_id                   // Sender
$message->body                      // Message text
$message->edited_at                 // Last edit timestamp
```

**Relationships**:
```php
$message->thread()                  // BelongsTo: MessageThread
$message->user()                    // BelongsTo: User
$message->attachments()             // HasMany: MessageAttachment
```

### MessageThread
**File**: `app/Models/MessageThread.php`

Discussion thread.

**Key Properties**:
```php
$thread->project_id                 // Associated project
$thread->subject                    // Thread subject
$thread->created_by                 // Creator user ID
```

**Relationships**:
```php
$thread->project()                  // BelongsTo: Project
$thread->messages()                 // HasMany: Message
$thread->participants()             // BelongsToMany: User
```

## Subscription & Billing Models

### Subscription
**File**: `app/Models/Subscription.php`

Project subscription and credit allocation.

**Key Properties**:
```php
$subscription->project_id           // Project ID
$subscription->plan_id              // Subscription plan
$subscription->started_at           // Start date
$subscription->expires_at           // Expiration date
$subscription->is_soft_locked       // Locked due to expiration
$subscription->credits_allocated    // Monthly credits
$subscription->credits_used         // Used this month
```

**Key Methods**:
```php
$subscription->isExpired()          // Check if expired
$subscription->getDaysUntilExpiry()// Days remaining
$subscription->checkAndApplySoftLock() // Auto-lock if expired
```

### CreditTransaction
**File**: `app/Models/CreditTransaction.php`

Records credit usage.

**Key Properties**:
```php
$transaction->user_id               // User
$transaction->amount                // Credits (+/-)
$transaction->type                  // award, deduct, refund
$transaction->reason                // Description
$transaction->related_model_id      // Optional: related entity
```

## Model Query Scopes

Many models include query scopes for common filters:

```php
// Active projects (not deleted)
$projects = Project::active()->get();

// Public projects
$public = Project::public()->get();

// Recent (last 30 days)
$recent = Template::recent()->get();

// User's resources
$myProjects = Project::where('owner_id', Auth::id())->get();
```

## Key Relationships Summary

**Ownership Chain**:
```
User (owner_id) -> Project -> Schema/Template/Form
User -> Team -> TeamMember -> User
```

**Subscription Chain**:
```
Project -> Subscription -> Plan
User -> Subscription -> Plan
User -> CreditTransaction
```

**Collaboration Chain**:
```
Project -> ProjectInvitation -> User
Project -> Team -> TeamMember -> User
```

## Model Best Practices

1. **Use Relationships** - Use `->relation()` instead of manual queries
2. **Eager Load** - Use `with()` to avoid N+1 queries
3. **Mass Assignment** - Protect sensitive fields with `$guarded`
4. **Scopes** - Create reusable query filters
5. **Accessors/Mutators** - Transform data on get/set
6. **Events** - Use model events for side effects

## Next Steps

- Read [Services](./services.md) for business logic
- Read [Controllers](./controllers.md) for API layer
- Read [API Routes](./api-routes.md) for endpoint documentation
