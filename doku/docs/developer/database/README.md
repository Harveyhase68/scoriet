# Scoriet Database Documentation

This directory contains comprehensive documentation of the Scoriet database schema, architecture, and design.

## Documentation Files

### 1. **overview.md** (12 KB)
- Database introduction and architecture overview
- 93 total tables organized into 9 domains
- Core architecture principles (multi-tenancy, versioning, JSON storage)
- Table categories and relationships
- Key concepts and performance considerations

### 2. **erd.md** (20 KB)
- Entity Relationship Diagrams using Mermaid syntax
- Organized into 8 separate domain diagrams:
  1. **Core Domain**: Users, Projects, Teams (5 tables)
  2. **Schema Domain**: Database schema modeling (8 tables)
  3. **Template Domain**: Code templates and marketplace (7 tables)
  4. **Generation Domain**: Code generation tracking (4 tables)
  5. **Form Domain**: Form designer system (4 tables)
  6. **Report Domain**: Report designer system (5 tables)
  7. **Kanban Domain**: Project management boards (7 tables)
  8. **Messaging Domain**: User communication (4 tables)

### 3. **core-tables.md** (18 KB)
Core foundational tables:
- **users**: User accounts, authentication, profiles, subscriptions
- **projects**: Project definitions and configurations
- **teams**: Team organizational structures
- **team_members**: Team membership and roles
- **team_roles**: Custom role definitions
- **team_role_permissions**: Permission assignments
- **permissions**: System permissions registry
- **user_git_providers**: Git repository integration

### 4. **schema-tables.md** (17 KB)
Database schema modeling tables:
- **schemas**: Top-level schema definitions
- **schema_versions**: Version history and tracking
- **schema_tables**: Table definitions within schemas
- **schema_fields**: Column/field definitions
- **schema_constraints**: Constraint definitions (PK, FK, UNIQUE, INDEX)
- **schema_constraint_columns**: Column-constraint mappings
- **schema_foreign_key_references**: Foreign key details
- **schema_foreign_key_reference_columns**: FK column mappings
- **schema_designer_layouts**: Diagram layout data
- **schema_translations**: Multi-language support

### 5. **template-tables.md** (19 KB)
Code template and marketplace tables:
- **templates**: Master template definitions with metadata
- **template_files**: Individual template file content
- **template_variables**: Template input variables/parameters
- **template_fingerprints**: Content hashing for change detection
- **template_media**: Marketing media (logos, images, videos)
- **template_purchases**: Marketplace purchase tracking
- **template_reviews**: User reviews and ratings
- **template_schema_dependencies**: Schema requirements
- **template_file_field_assignments**: Field visibility control

### 6. **project-tables.md** (16 KB)
Project relationship and association tables:
- **project_members**: Project team membership
- **project_schemas**: Schema associations (linked/cloned/imported)
- **project_template_usage**: Template usage tracking
- **project_template_variable_values**: Template variable configuration
- **project_applications**: Project join requests
- **project_invitations**: Email-based project invitations
- **project_attachments**: Project file attachments
- **project_form_set**: Form set associations
- **project_kanban_roles**: Kanban-specific role assignments
- **project_translations**: Project localization settings
- **project_report_patterns**: Report pattern associations

### 7. **feature-tables.md** (30 KB)
Specialized feature designer tables:

#### Forms (4 tables)
- **form_sets**: Form collections and styling
- **form_windows**: Form screens and types
- **form_elements**: UI containers and layout
- **form_item_placements**: Field placements and properties

#### Reports (5 tables)
- **report_patterns**: Report template definitions
- **report_pattern_forms**: Report form configurations
- **report_pattern_elements**: Report layout sections
- **report_layout_elements**: Report content elements
- **report_images**: Embedded report images

#### Kanban (8 tables)
- **kanban_boards**: Project kanban boards
- **kanban_columns**: Board columns/swimlanes
- **kanban_cards**: Task cards
- **kanban_card_activities**: Card activity logs
- **kanban_card_assignees**: Multiple assignee support
- **kanban_card_comments**: Card discussion
- **kanban_labels**: Reusable labels/tags
- **kanban_card_label**: Card-label associations

#### Messaging (4 tables)
- **message_threads**: Message conversations
- **messages**: Individual message content
- **message_thread_participants**: Thread participation
- **message_attachments**: File attachments

### 8. **generation-support-tables.md** (28 KB)
Code generation and system support tables:

#### Generation (4 tables)
- **project_generations**: Generation records and tracking
- **project_generation_trees**: Dependency tree structures
- **generation_logs**: Detailed generation audit trail
- **code_adjustments**: Code transformation rules
- **code_adjustment_insertions**: Specific code insertions

#### Support Tables (14+ tables)
- **languages**: Supported languages
- **settings**: Global system configuration
- **subscriptions**: User subscription management
- **credit_transactions**: Credit audit trail
- **deployment_logs**: Deployment tracking
- **performance_metrics**: System performance data
- **tickets**: Support ticket management
- **visitor_logs**: Website analytics
- **pages**: CMS pages and popups
- **payouts**: Seller earnings payouts
- **payout_items**: Payout line items
- **cli_tasks**: CLI command tracking
- **cli_devices**: CLI device registration
- **push_subscriptions**: Web push subscriptions
- **registration_invites**: Registration invite codes

## Key Statistics

- **Total Tables**: 93
- **Total Fields**: 1000+
- **Primary Keys**: All use `bigIncrements`
- **Foreign Key Relationships**: 180+
- **Unique Constraints**: 60+
- **Composite Indexes**: 100+
- **JSON Columns**: 30+

## Architecture Highlights

### Multi-Tenancy & Ownership
- User-level ownership via `owner_id` foreign keys
- Project-level isolation
- Team-based access control

### Versioning & History
- Schema versioning system
- Template type hierarchy (original/cloned/linked)
- Complete generation audit trail
- Credit transaction history

### JSON Support
- Flexible configuration storage
- Complex design data (form layouts, report designs)
- Support for semi-structured data
- Language-specific overrides

### Security & Compliance
- Two-factor authentication support
- OAuth2 Git provider integration
- Credit transaction audit trail
- Seller verification and earnings tracking
- User inactivity monitoring

### Marketplace Features
- Template visibility and pricing
- Purchase and review tracking
- Seller earnings and payout system
- Community ratings and feedback

## Navigation Guide

1. **Getting Started**: Start with `overview.md` for architecture overview
2. **Visual Understanding**: Review `erd.md` for entity relationships
3. **Core Functionality**: Study `core-tables.md` for user/project foundation
4. **Feature Deep-Dives**: 
   - Schema modeling → `schema-tables.md`
   - Code templates → `template-tables.md`
   - Project management → `project-tables.md`
   - Forms, Reports, Kanban, Messaging → `feature-tables.md`
5. **Generation & Support**: `generation-support-tables.md` for code generation and system tables

## Table Organization by Domain

### Core Domain (8 tables)
Users, Projects, Teams, Permissions

### Schema Domain (10 tables)
Database schema modeling, versioning, constraints

### Template Domain (9 tables)
Templates, files, variables, marketplace

### Project Domain (11 tables)
Project associations, members, invitations

### Feature Domains (21 tables)
- Forms: 4 tables
- Reports: 5 tables
- Kanban: 8 tables
- Messaging: 4 tables

### Generation Domain (5 tables)
Code generation, logs, adjustments

### Support Domain (14+ tables)
Languages, settings, credits, deployments, etc.

---

**Last Updated**: April 13, 2026
**All Documentation**: English only
**Format**: Markdown with Mermaid diagrams
