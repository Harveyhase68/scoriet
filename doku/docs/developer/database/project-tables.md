---
sidebar_position: 6
---

# Project Relationship Tables

## Overview

Project relationship tables manage associations between projects and other entities (members, schemas, templates, forms, reports, kanban boards), as well as project-level configuration and invitations.

---

## project_members

Stores project team membership and role assignments.

### Purpose
- Manage project team members
- Assign member roles within projects
- Track membership and permissions

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **project_id** | unsignedBigInteger(FK) | NO | - | FK: projects.id (CASCADE) |
| **user_id** | unsignedBigInteger(FK) | NO | - | FK: users.id (CASCADE) |
| **role** | enum | NO | member | Built-in role (member, admin, owner) |
| **joined_at** | timestamp | NO | CURRENT | Join timestamp |
| **invited_by** | unsignedBigInteger(FK) | YES | NULL | FK: users.id - Who invited this member |
| **notes** | text | YES | NULL | Member notes/assignment notes |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Unique: `(project_id, user_id)` - User cannot be member twice
- Composite: `(project_id, role)`, `(user_id, role)`
- Foreign Keys: `project_id`, `user_id`, `invited_by`

### Relationships
- Belongs To → Projects
- Belongs To → Users (member)
- Belongs To → Users (inviter)

### Roles
- **member**: Standard team member (read/write access)
- **admin**: Project administrator (all access except delete)
- **owner**: Project owner (full control including delete)

---

## project_schemas

Manages schema associations with projects (linked/cloned/imported).

### Purpose
- Link database schemas to projects
- Track association type (linked vs cloned)
- Store schema alias for project context

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **project_id** | unsignedBigInteger(FK) | NO | - | FK: projects.id (CASCADE) |
| **schema_id** | unsignedBigInteger(FK) | NO | - | FK: schemas.id (CASCADE) |
| **association_type** | enum | NO | linked | Type (linked, cloned, imported) |
| **alias** | string(100) | YES | NULL | Schema alias in project context |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Unique: `(project_id, schema_id)` - Each schema once per project
- Foreign Keys: `project_id`, `schema_id`

### Relationships
- Belongs To → Projects
- Belongs To → Schemas

### Association Types
- **linked**: Reference to original schema (changes sync)
- **cloned**: Copy of schema (independent)
- **imported**: Imported from database (read-only reference)

---

## project_template_usage

Tracks template usage within projects.

### Purpose
- Record which templates are used in projects
- Store template usage configuration
- Track multiple template usage in same project

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **project_id** | unsignedBigInteger(FK) | NO | - | FK: projects.id (CASCADE) |
| **template_id** | unsignedBigInteger(FK) | NO | - | FK: templates.id (CASCADE) |
| **usage_type** | enum | NO | linked | Type (linked, cloned) |
| **alias** | string(100) | YES | NULL | Template alias in project |
| **config** | json | YES | NULL | Template-specific configuration |
| **is_active** | boolean | NO | true | Usage active status |
| **used_at** | timestamp | NO | CURRENT | First usage timestamp |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Unique: `(project_id, template_id)` - Each template once per project
- Composite: `(project_id, is_active)`, `(template_id, is_active)`
- Foreign Keys: `project_id`, `template_id`

### Relationships
- Belongs To → Projects
- Belongs To → Templates
- Has Many → Project Template Variable Values

### Usage Types
- **linked**: Reference to original template
- **cloned**: Copy of template (independent)

---

## project_template_variable_values

Stores template variable assignments for projects.

### Purpose
- Store project-specific template variable values
- Support per-language variable overrides
- Enable template customization per project

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **project_id** | unsignedBigInteger(FK) | NO | - | FK: projects.id (CASCADE) |
| **template_id** | unsignedBigInteger(FK) | NO | - | FK: templates.id (CASCADE) |
| **variable_name** | string(100) | NO | - | Template variable name |
| **language** | string(10) | NO | en | Language code for this value |
| **value** | text | NO | - | Variable value for project/language |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Unique: `(project_id, template_id, variable_name, language)` - Unique per context
- Composite: `(project_id, template_id)`, `(template_id, variable_name)`
- Foreign Keys: `project_id`, `template_id`

### Relationships
- Belongs To → Projects
- Belongs To → Templates

### Usage
When generating code from templates, Scoriet uses these project-specific variable values instead of defaults.

---

## project_applications

Manages join requests and applications to projects.

### Purpose
- Store project join requests from users
- Track application status and approvals
- Support invite/apply workflow

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **project_id** | unsignedBigInteger(FK) | NO | - | FK: projects.id (CASCADE) |
| **user_id** | unsignedBigInteger(FK) | NO | - | FK: users.id (CASCADE) - Applicant |
| **join_code** | string(20) | YES | NULL | Join code used (if applicable) |
| **message** | text | YES | NULL | Applicant's request message |
| **status** | enum | NO | pending | Status (pending, approved, rejected) |
| **reviewed_by** | unsignedBigInteger(FK) | YES | NULL | FK: users.id - Who reviewed |
| **reviewed_at** | timestamp | YES | NULL | Review timestamp |
| **review_notes** | text | YES | NULL | Reviewer's notes |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Composite: `(project_id, user_id, status)`, `(project_id, status, created_at)`
- Foreign Keys: `project_id`, `user_id`, `reviewed_by`

### Relationships
- Belongs To → Projects
- Belongs To → Users (applicant)
- Belongs To → Users (reviewer)

### Statuses
- **pending**: Awaiting review
- **approved**: Request approved, member added
- **rejected**: Request denied

---

## project_invitations

Manages email-based project invitations.

### Purpose
- Send project invitations via email
- Track invitation status and expiration
- Support external user invitations

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **project_id** | unsignedBigInteger(FK) | NO | - | FK: projects.id (CASCADE) |
| **invited_by** | unsignedBigInteger(FK) | NO | - | FK: users.id - Inviter |
| **invited_user_id** | unsignedBigInteger(FK) | YES | NULL | FK: users.id - Invited user (if exists) |
| **invited_email** | string(255) | NO | - | Email address invitation target |
| **role** | enum | NO | member | Invited role (member, admin) |
| **status** | enum | NO | pending | Status (pending, accepted, declined, expired) |
| **message** | text | YES | NULL | Invitation message from inviter |
| **token** | string(100, unique) | NO | - | Secure invitation token |
| **expires_at** | timestamp | NO | - | Token expiration (14 days) |
| **responded_at** | timestamp | YES | NULL | Response timestamp |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Unique: `token`
- Composite: `(project_id, invited_email, status)`, `(invited_email, status)`
- Foreign Keys: `project_id`, `invited_by`, `invited_user_id`

### Relationships
- Belongs To → Projects
- Belongs To → Users (inviter)
- Belongs To → Users (invited user, optional)

### Statuses
- **pending**: Invitation sent, awaiting response
- **accepted**: Invitation accepted, member added
- **declined**: Invitation declined by user
- **expired**: Invitation token expired

---

## project_attachments

Stores project-level file attachments and documentation.

### Purpose
- Store project-related files (documentation, resources)
- Track attachment metadata and access
- Support file categorization and pinning

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **project_id** | unsignedBigInteger(FK) | NO | - | FK: projects.id (CASCADE) |
| **uploaded_by** | unsignedBigInteger(FK) | NO | - | FK: users.id - Uploader |
| **filename** | string(255) | NO | - | Stored filename (hashed) |
| **original_filename** | string(255) | NO | - | Original filename |
| **mime_type** | string(100) | YES | NULL | File MIME type |
| **size** | integer | NO | - | File size in bytes |
| **path** | string(500) | NO | - | Storage path |
| **description** | text | YES | NULL | File description |
| **category** | string(50) | YES | NULL | File category (doc, resource, spec, etc.) |
| **is_pinned** | boolean | NO | false | Pinned to top flag |
| **download_count** | integer | NO | 0 | Download count |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Composite: `(project_id, category)`, `(project_id, is_pinned)`
- Foreign Keys: `project_id`, `uploaded_by`

### Relationships
- Belongs To → Projects
- Belongs To → Users (uploader)

---

## project_form_set

Associates form sets with projects.

### Purpose
- Link form designers to projects
- Track active form sets per project

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **project_id** | unsignedBigInteger(FK) | NO | - | FK: projects.id (CASCADE) |
| **form_set_id** | unsignedBigInteger(FK) | NO | - | FK: form_sets.id (CASCADE) |
| **is_active** | boolean | NO | true | Association active status |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Unique: `(project_id, form_set_id)` - Each form set once per project
- Foreign Keys: `project_id`, `form_set_id`

### Relationships
- Belongs To → Projects
- Belongs To → Form Sets

---

## project_kanban_roles

Tracks special kanban board roles for users in projects.

### Purpose
- Assign kanban-specific roles (SRM, SDM, Flow Manager)
- Track role assignments and delegation

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **project_id** | unsignedBigInteger(FK) | NO | - | FK: projects.id (CASCADE) |
| **user_id** | unsignedBigInteger(FK) | NO | - | FK: users.id (CASCADE) |
| **role** | enum | NO | - | Kanban role (srm, sdm, flow_manager) |
| **assigned_by** | unsignedBigInteger(FK) | NO | - | FK: users.id - Who assigned |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Unique: `(project_id, user_id)` - One role per user per project
- Composite: `(project_id, role)`, `(user_id, role)`
- Foreign Keys: `project_id`, `user_id`, `assigned_by`

### Relationships
- Belongs To → Projects
- Belongs To → Users (role holder)
- Belongs To → Users (assigner)

### Kanban Roles
- **srm**: Scrum Master (process facilitator)
- **sdm**: Senior Development Manager (technical lead)
- **flow_manager**: Flow Manager (workflow optimizer)

---

## project_translations

Stores project-level localization and formatting settings.

### Purpose
- Store project translations and localized content
- Define locale-specific number/date formatting
- Support multi-language projects

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **project_id** | unsignedBigInteger(FK) | NO | - | FK: projects.id (CASCADE) |
| **language_code** | string(10) | NO | - | Language code (en, de, fr, etc.) |
| **caption** | string(255) | YES | NULL | Language display name |
| **description** | text | YES | NULL | Language description |
| **decimal_separator** | string(1) | YES | NULL | Number decimal separator |
| **thousands_separator** | string(1) | YES | NULL | Number thousands separator |
| **date_format** | string(20) | YES | NULL | Date display format |
| **time_format** | string(20) | YES | NULL | Time display format |
| **currency_symbol** | string(5) | YES | NULL | Currency symbol |
| **timezone** | string(50) | YES | NULL | Timezone identifier |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Unique: `(project_id, language_code)` - One per language
- Foreign Key: `project_id`

### Relationships
- Belongs To → Projects

---

## project_report_patterns

Associates report patterns with projects.

### Purpose
- Link report designers to projects
- Track active report patterns

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **project_id** | unsignedBigInteger(FK) | NO | - | FK: projects.id (CASCADE) |
| **report_pattern_id** | unsignedBigInteger(FK) | NO | - | FK: report_patterns.id (CASCADE) |
| **is_active** | boolean | NO | true | Association active status |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Unique: `(project_id, report_pattern_id)` - Each pattern once per project
- Foreign Keys: `project_id`, `report_pattern_id`

### Relationships
- Belongs To → Projects
- Belongs To → Report Patterns

---

## Key Concepts

### Project Access Control
- **Owner**: Creator of project, full control
- **Admin**: Delegated administrator, manage members/invitations
- **Member**: Regular member, can use project resources

### Invitation Workflow
1. Owner invites via email or generates join code
2. Link/code sent to user
3. User accepts or declines
4. If accepted, user added as member

### Schema Management in Projects
- Schemas can be linked (live reference) or cloned (independent copy)
- Multiple schemas per project supported
- Schema alias allows context-specific naming

### Template Usage
- Project can use multiple templates
- Each template has configuration stored separately
- Variable values overrideable per project/language

---

## Related Documentation

- See **Core Tables** for project and user information
- See **Schema Tables** for schema details
- See **Template Tables** for template information
- See **Form Tables** for form set details
- See **Report Tables** for report pattern details
- See **Kanban Tables** for kanban board structure
