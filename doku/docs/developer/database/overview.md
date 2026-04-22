---
sidebar_position: 1
---

# Database Overview

## Introduction

The Scoriet database is a comprehensive relational database system designed to support the Enterprise Code Generator platform. It manages users, projects, database schemas, code templates, forms, reports, kanban boards, messaging, and a complete marketplace ecosystem for templates.

![Database Management](/img/screenshots/database-management.png)
*Database Management panel showing parsed schemas with status, visibility, and action buttons*

The database architecture is built around several key domains:

- **Core Domain**: User management, authentication, projects, and teams
- **Schema Domain**: Database schema modeling, versioning, and storage
- **Template Domain**: Code template storage, versioning, and marketplace
- **Generation Domain**: Code generation tracking, logs, and code adjustments
- **Form Domain**: Form designer, layout, and element management
- **Report Domain**: Report patterns, layouts, and design elements
- **Kanban Domain**: Project kanban boards, cards, columns, and workflows
- **Messaging Domain**: User-to-user and broadcast messaging system
- **Support Domain**: Languages, permissions, settings, credit system, and more

## Database Technology

- **Database Management System**: MySQL (primary), with support for PostgreSQL, SQLite, and MS-SQL
- **ORM Framework**: Laravel Eloquent
- **Migrations**: Laravel Database Migrations for version control
- **Total Tables**: 93 tables
- **Key Relationships**: 180+ foreign key relationships

## Core Architecture Principles

### Multi-Tenancy & Ownership
- Most tables include an `owner_id` foreign key to the `users` table
- Project-level data is isolated through `project_id` foreign keys
- Team-based access control via `teams` and `team_members` tables

### Soft Deletes & Visibility
- Schema visibility levels: `private`, `public`, `deleted`
- Template visibility: `private`, `public`, `store`
- Many entities support soft delete through status/visibility fields

### Versioning & History
- Schemas support multiple versions via `schema_versions` table
- Templates track template type: `original`, `cloned`, `linked`
- Form sets can be cloned to support variations
- Generation logs maintain complete history of code generation

### JSON for Flexible Data
- Complex configuration stored as JSON: `settings`, `tags`, `layout_data`
- Template variables and project configurations use JSON columns
- Form and report design elements stored as JSON structures

### Credit & Monetization System
- User credit balance tracking in `users` table
- Template pricing in credits or euros
- Credit transactions audit trail via `credit_transactions`
- Template purchase tracking and payout system

### Security & Authentication
- Two-factor authentication fields in `users` table
- Passport OAuth2 tokens for API authentication
- User inactivity tracking and warnings
- Git provider credential management

## Table Categories

### Core Tables (8)
- `users` - User accounts with authentication and profile
- `projects` - Project definitions with deployment configuration
- `teams` - Team organizational structure
- `team_members` - Team membership and roles
- `team_roles` - Custom team roles
- `team_role_permissions` - Role-based access control
- `permissions` - System permissions registry
- `user_git_providers` - Git repository integration

### Schema Tables (8)
- `schemas` - Database schema definitions
- `schema_versions` - Schema version history
- `schema_tables` - Table definitions within schemas
- `schema_fields` - Column/field definitions
- `schema_constraints` - Database constraints
- `schema_constraint_columns` - Constraint column mappings
- `schema_foreign_key_references` - Foreign key definitions
- `schema_foreign_key_reference_columns` - FK column mappings

### Template Tables (7)
- `templates` - Template definitions
- `template_files` - Template file content
- `template_variables` - Template input variables
- `template_fingerprints` - Content hashing for change detection
- `template_media` - Template marketing media (logos, images, videos)
- `template_purchases` - Marketplace purchase tracking
- `template_reviews` - User reviews and ratings

### Template Associations (3)
- `template_schema_dependencies` - Schema requirements for templates
- `template_file_field_assignments` - Form field visibility in template files

### Project Relationship Tables (9)
- `project_members` - Project team membership
- `project_schemas` - Linked/cloned schemas in projects
- `project_template_usage` - Template usage in projects
- `project_template_variable_values` - Template variable configuration
- `project_applications` - Project join requests
- `project_invitations` - Project invitations
- `project_attachments` - File attachments for projects
- `project_form_set` - Form set associations
- `project_kanban_roles` - Kanban board roles

### Generation Tables (4)
- `project_generations` - Code generation records
- `project_generation_trees` - Dependency trees for generations
- `generation_logs` - Detailed generation logs
- `code_adjustments` - Code adjustment rules

### Form Tables (4)
- `form_sets` - Form set definitions
- `form_windows` - Form window types (create, edit, list, report)
- `form_elements` - UI containers and layout elements
- `form_item_placements` - Field placements within forms

### Report Tables (5)
- `report_patterns` - Report pattern definitions
- `report_pattern_forms` - Report form configurations
- `report_pattern_elements` - Report layout sections
- `report_layout_elements` - Report content elements
- `report_images` - Report images/media

### Kanban Tables (7)
- `kanban_boards` - Kanban board per project
- `kanban_columns` - Board columns/swimlanes
- `kanban_cards` - Task cards
- `kanban_card_activities` - Card activity log
- `kanban_card_assignees` - Card assignments
- `kanban_card_comments` - Card comments
- `kanban_labels` - Label definitions

### Messaging Tables (4)
- `message_threads` - Message conversations
- `messages` - Message content
- `message_thread_participants` - Thread participants
- `message_attachments` - Message attachments

### Support Tables (14)
- `languages` - Supported languages
- `schema_translations` - Schema text translations
- `project_translations` - Project localization
- `project_report_patterns` - Report pattern associations
- `settings` - System-wide settings
- `subscriptions` - User subscription management
- `credit_transactions` - Credit audit trail
- `deployment_logs` - Deployment history
- `performance_metrics` - System metrics
- `tickets` - Support tickets
- `payouts` - Seller payouts
- `payout_items` - Payout line items
- `pages` - CMS pages
- `visitor_logs` - Website visitor tracking
- `registration_invites` - User registration invites
- `cli_tasks` - CLI command tasks
- `cli_devices` - CLI device registration
- `push_subscriptions` - Web push notifications

## Key Relationships

### One-to-Many Relationships
- User owns many Projects, Schemas, Templates, Forms, Reports, etc.
- Project has many Members, Generations, Attachments, Kanban Boards
- Schema has many Versions, Tables
- Schema Table has many Fields
- Template has many Files, Variables, Reviews

### Many-to-Many Relationships
- Projects ↔ Schemas (via `project_schemas`)
- Projects ↔ Templates (via `project_template_usage`)
- Teams ↔ Roles ↔ Permissions (via join tables)
- Kanban Cards ↔ Labels (via `kanban_card_label`)
- Templates ↔ Schema Dependencies (via `template_schema_dependencies`)

### Polymorphic Associations
- Code adjustments can reference projects or templates
- Credit transactions support multiple transaction types
- Performance metrics track various action types

## Database Constraints

### Primary Keys
All tables use `bigIncrements('id')` for auto-incrementing primary keys.

### Foreign Key Actions
- **Cascade Delete**: Used for dependent records (template files when template deleted)
- **Set Null**: Used when relationship is optional (nullable foreign keys)
- **Restrict**: Default for critical relationships

### Unique Constraints
- Email addresses (`users.email`, `registration_invites.email`)
- Git provider credentials per user
- Schema name per owner
- Template variable name per template
- Join codes in projects

### Indexes
- Owner/visibility composite indexes for efficient filtering
- Project/user composite indexes for queries
- Foreign key indexes for relationship lookups
- Timestamp indexes for date-range queries

## Data Types

### Integer Fields
- **bigIncrements**: Primary keys, user references
- **unsignedBigInteger**: Foreign keys
- **unsignedSmallInteger**: Diagram sizing parameters
- **unsignedTinyInteger**: Short values
- **integer**: Counts, versions, credits

### String Fields
- **string(100+)**: Names, slugs, codes
- **text/longText**: Descriptions, content, JSON
- **enum**: Status fields, types, roles

### Decimal/Currency
- **decimal(10,2)** or **decimal(12,2)**: Pricing, earnings, amounts

### Date/Time
- **timestamp**: All CRUD operations use timestamps
- **nullable**: For optional dates (deletions, verifications)

## Design Patterns

### Soft Deletes
Implemented through `visibility` or `status` enums rather than Laravel's soft delete trait, allowing for "deleted" visibility levels in schemas while maintaining referential integrity.

### Audit Trails
- `credit_transactions` table maintains complete audit trail
- `kanban_card_activities` logs all card changes
- `generation_logs` tracks all code generation
- Timestamp fields on all tables for change tracking

### Configuration Management
- JSON columns store complex configuration
- `settings` table for global configuration
- Project-level settings override defaults
- Form/report design data stored as JSON

### Polymorphic Data
Template variables support multiple languages via `project_template_variable_values` with `language` field allowing per-language overrides.

## Performance Considerations

### Indexing Strategy
- Foreign key columns indexed automatically
- Composite indexes on commonly filtered column pairs
- Separate index on `last_login_at` for inactivity queries

### Query Optimization
- Avoid N+1 queries through eager loading relationships
- Use composite indexes for where clauses
- Pagination required for large result sets

### JSON Column Queries
- Avoid querying inside JSON columns when possible
- Store structured data that benefits from relational queries in separate tables
- Use JSON for semi-structured or configuration data

## Database Migrations

All database changes are managed through Laravel migrations in `/database/migrations/`. The migration naming convention is:

```
YYYY_MM_DD_HHMMSS_description_of_change.php
```

Migrations are organized into:
1. Initial table creation (2026_02_01 batch)
2. Foreign key additions (2026_02_01_094852 batch)
3. Schema extensions and modifications (2026_03_xx)

## Related Documentation

- See **Entity Relationship Diagrams** for visual schema relationships
- See **Core Tables** documentation for user and project structure
- See **Schema Tables** documentation for database schema modeling
- See **Template Tables** documentation for code template system
- See **Generation Tables** documentation for code generation workflow
- See **Form Tables** documentation for form designer system
- See **Report Tables** documentation for report designer system
- See **Kanban Tables** documentation for project management boards
- See **Messaging Tables** documentation for communication system
