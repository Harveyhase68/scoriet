---
sidebar_position: 3
---

# Core Tables

## Overview

The core tables form the foundation of the Scoriet database, managing user accounts, authentication, projects, and team organization. All other database entities ultimately relate back to these core tables.

---

## users

Stores user account information, authentication credentials, profile data, and subscription details.

### Purpose
- User authentication and authorization
- User profile and preference management
- Seller/patron account management
- Two-factor authentication setup
- Credit tracking and subscription management

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **name** | string | NO | - | User's full name |
| **email** | string(unique) | NO | - | Unique email address |
| **password** | string | NO | - | Hashed password |
| **theme** | string(20) | NO | dark | UI theme preference (light/dark) |
| **email_verified_at** | timestamp | YES | NULL | Email verification timestamp |
| **is_inner_core** | boolean | NO | false | Internal team flag |
| **is_seller** | boolean | NO | false | Whether user is a template seller |
| **company_name** | string | YES | NULL | Business name (for sellers) |
| **company_address** | text | YES | NULL | Business address (for sellers) |
| **company_country** | string(2) | YES | NULL | Country code (ISO 3166-1 alpha-2) |
| **vat_id** | string(50) | YES | NULL | VAT identification number |
| **business_registration** | string | YES | NULL | Business registration number |
| **tax_id** | string(50) | YES | NULL | Tax identification number |
| **seller_type** | enum | YES | NULL | Type of seller (at_business, eu_vat, eu_private, non_eu_business, non_eu_private) |
| **payout_method** | enum | YES | NULL | Preferred payout method (bank_transfer, paypal) |
| **paypal_payout_email** | string | YES | NULL | PayPal email for payouts |
| **bank_iban** | string(34) | YES | NULL | IBAN for bank transfers |
| **bank_bic** | string(11) | YES | NULL | BIC/SWIFT code |
| **bank_account_holder** | string | YES | NULL | Account holder name |
| **seller_verified** | boolean | NO | false | Seller verification status |
| **seller_verified_at** | timestamp | YES | NULL | Seller verification timestamp |
| **pending_earnings** | decimal(10) | NO | 0 | Unprocessed earnings |
| **total_earnings** | decimal(10) | NO | 0 | Total lifetime earnings |
| **two_factor_secret** | string | YES | NULL | Two-factor authentication secret |
| **two_factor_enabled** | boolean | NO | false | 2FA enabled flag |
| **two_factor_confirmed_at** | timestamp | YES | NULL | 2FA confirmation timestamp |
| **two_factor_recovery_codes** | text | YES | NULL | 2FA recovery codes (JSON) |
| **two_factor_trusted_devices** | text | YES | NULL | Trusted device list (JSON) |
| **two_factor_last_verified_at** | timestamp | YES | NULL | Last 2FA verification time |
| **username** | string(unique) | YES | NULL | Unique username handle |
| **user_type** | enum | NO | free | Account type (free, patron, system) |
| **is_active** | boolean | NO | true | Account active status |
| **language** | string(5) | NO | en | Preferred language (ISO 639-1 + country) |
| **kanban_initials** | string(3) | YES | NULL | User initials for kanban cards |
| **kanban_color** | string(7) | YES | NULL | Color code for kanban cards (hex) |
| **credits** | integer | NO | 50 | Current credit balance |
| **last_monthly_credits_at** | timestamp | YES | NULL | Last monthly credit grant timestamp |
| **stripe_customer_id** | string | YES | NULL | Stripe customer identifier |
| **stripe_subscription_id** | string | YES | NULL | Stripe subscription identifier |
| **paypal_subscription_id** | string | YES | NULL | PayPal subscription identifier |
| **patron_type** | enum | YES | NULL | Patron subscription type (annual, monthly) |
| **pending_project_invitation_id** | unsignedBigInteger(FK) | YES | NULL | FK: projects.id - Pending project invitation |
| **remember_token** | string | YES | NULL | Remember me token |
| **email_system_notifications** | boolean | NO | true | System notification email preference |
| **email_user_notifications** | boolean | NO | true | User message email preference |
| **last_login_at** | timestamp | YES | NULL | Last login timestamp |
| **inactivity_warning_1_sent_at** | timestamp | YES | NULL | First inactivity warning sent |
| **inactivity_warning_2_sent_at** | timestamp | YES | NULL | Second inactivity warning sent |
| **inactivity_warning_final_sent_at** | timestamp | YES | NULL | Final inactivity warning sent |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Unique: `email`, `username`
- Foreign Key: `pending_project_invitation_id`
- Composite: `(last_login_at, user_type, is_active)` - For inactivity queries

### Relationships
- Has Many → Projects (creator)
- Has Many → Schemas (owner)
- Has Many → Templates (creator)
- Has Many → Teams (manager)
- Has One → User Git Providers

---

## projects

Stores project definitions including deployment configuration, database connection details, and UI settings.

### Purpose
- Project organization and management
- Database connection configuration
- Git integration settings
- Code generation settings and preferences
- Form and diagram designer settings
- Deployment configuration (FTP)

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **name** | string(indexed) | NO | - | Project name |
| **description** | text | YES | NULL | Project description |
| **owner_id** | unsignedBigInteger(FK) | NO | - | FK: users.id (CASCADE) |
| **git_provider_id** | unsignedBigInteger(FK) | YES | NULL | FK: user_git_providers.id |
| **git_repository** | string | YES | NULL | Repository URL or path |
| **git_default_branch** | string | YES | NULL | Default working branch |
| **git_main_branch** | string | YES | NULL | Main/production branch |
| **git_target_directory** | string | YES | NULL | Target directory in repository |
| **git_workflow** | enum | NO | push_only | Workflow type (push_only, push_and_pr, push_pr_merge) |
| **git_pr_title_template** | string | YES | NULL | Pull request title template |
| **git_pr_description_template** | text | YES | NULL | Pull request description template |
| **git_auto_delete_branch** | boolean | NO | true | Auto-delete feature branches |
| **deployment_type** | string(10) | YES | NULL | Deployment type (ftp, git, local, etc) |
| **ftp_host** | string | YES | NULL | FTP server hostname |
| **ftp_port** | integer | YES | 21 | FTP port number |
| **ftp_username** | string | YES | NULL | FTP username |
| **ftp_password** | text | YES | NULL | FTP password (encrypted) |
| **ftp_directory** | string | YES | NULL | Target directory on FTP server |
| **ftp_passive** | boolean | NO | true | FTP passive mode |
| **ftp_ssl** | boolean | NO | false | FTP SSL/TLS connection |
| **is_active** | boolean | NO | true | Project active status |
| **is_public** | boolean | NO | true | Project visibility to other users |
| **join_code** | string(20, unique) | YES | NULL | Code for joining project |
| **allow_join_requests** | boolean | NO | false | Allow user join requests |
| **settings** | json | YES | NULL | Project-specific settings |
| **database_name** | string | YES | NULL | Database name for schema import |
| **database_type** | string | NO | MySQL | Database type (MySQL, PostgreSQL, SQLite, MS-SQL) |
| **database_server** | string | NO | 127.0.0.1 | Database server hostname/IP |
| **database_port** | string | NO | 3306 | Database port number |
| **database_username** | string | YES | NULL | Database username |
| **database_password** | string | YES | NULL | Database password (encrypted) |
| **diagram_max_tables_per_row** | unsignedSmallInteger | NO | 20 | Diagram layout setting |
| **diagram_table_width** | unsignedSmallInteger | NO | 280 | Diagram table width in pixels |
| **diagram_table_height** | unsignedSmallInteger | NO | 450 | Diagram table height in pixels |
| **diagram_horizontal_spacing** | unsignedSmallInteger | NO | 600 | Horizontal spacing between tables |
| **diagram_vertical_spacing** | unsignedSmallInteger | NO | 700 | Vertical spacing between tables |
| **form_designer_snap_to_grid** | boolean | NO | true | Form designer grid snap |
| **form_designer_grid_size** | integer | NO | 20 | Form designer grid size |
| **project_directory** | string | YES | NULL | Local project directory path |
| **project_url** | string | YES | NULL | Project deployment URL |
| **start_page** | string | YES | index.php | Default start page |
| **default_language** | string(10) | YES | en | Default UI language |
| **archive_format** | enum | NO | zip | Archive format (zip, tar.gz, tar.xz) |
| **filename_short_length** | unsignedTinyInteger | YES | 2 | Short filename format length |
| **decimal_separator** | string(1) | YES | , | Number decimal separator |
| **thousands_separator** | string(1) | YES | . | Number thousands separator |
| **date_format** | string(20) | YES | d.m.Y | Display date format |
| **time_format** | string(20) | YES | H:i:s | Display time format |
| **currency_symbol** | string(5) | YES | € | Currency symbol display |
| **timezone** | string(50) | YES | Europe/Vienna | Default timezone |
| **enabled_languages** | json | YES | NULL | List of enabled languages |
| **google_translate_api_key** | string(500) | YES | NULL | Google Translate API key |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |
| **protected_files** | json | YES | NULL | Files that should not be overwritten |
| **install_script** | json | YES | NULL | Project installation instructions |
| **update_script** | json | YES | NULL | Project update instructions |

### Indexes
- Primary Key: `id`
- Unique: `join_code`
- Regular: `name`
- Composite: `(git_provider_id, git_repository)`, `(owner_id, is_active)`

### Relationships
- Belongs To → Users (owner)
- Has Many → Project Members
- Has Many → Project Schemas
- Has Many → Project Template Usage
- Has Many → Project Generations
- Has Many → Project Attachments

---

## teams

Stores team organizational structures within projects.

### Purpose
- Team creation and management
- Team-based project organization
- Hierarchical user grouping

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **name** | string | NO | - | Team name |
| **description** | text | YES | NULL | Team description |
| **project_owner_id** | unsignedBigInteger(FK) | NO | - | FK: users.id (CASCADE) - Project/team owner |
| **is_active** | boolean | NO | true | Team active status |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Relationships
- Belongs To → Users (owner)
- Has Many → Team Members
- Has Many → Team Roles

---

## team_members

Stores user membership in teams with assigned roles.

### Purpose
- Team membership tracking
- Role assignment within teams
- Member management

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **team_id** | unsignedBigInteger(FK) | NO | - | FK: teams.id (CASCADE) |
| **user_id** | unsignedBigInteger(FK) | NO | - | FK: users.id (CASCADE) |
| **role** | enum | NO | - | Built-in role (owner, admin, member) |
| **team_role_id** | unsignedBigInteger(FK) | YES | NULL | FK: team_roles.id (CASCADE) - Custom role |
| **joined_at** | timestamp | NO | CURRENT | Join timestamp |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Unique: `(team_id, user_id)`
- Foreign Keys: `team_id`, `user_id`, `team_role_id`

### Relationships
- Belongs To → Teams
- Belongs To → Users
- Belongs To → Team Roles (optional)

---

## team_roles

Stores custom role definitions for teams.

### Purpose
- Custom role creation
- Role-based access control per team
- Permission management

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **team_id** | unsignedBigInteger(FK) | NO | - | FK: teams.id (CASCADE) |
| **name** | string(100) | NO | - | Role display name |
| **slug** | string(100) | NO | - | Role identifier slug |
| **description** | text | YES | NULL | Role description |
| **is_system** | boolean | NO | false | System role flag |
| **sort_order** | integer | NO | 0 | Display order |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Unique: `(team_id, slug)`
- Foreign Key: `team_id`

### Relationships
- Belongs To → Teams
- Has Many → Team Role Permissions
- Has Many → Team Members

---

## team_role_permissions

Stores permission mappings for team roles.

### Purpose
- Permission assignment to roles
- RBAC implementation for teams

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **team_role_id** | unsignedBigInteger(FK) | NO | - | FK: team_roles.id (CASCADE) |
| **permission_id** | unsignedBigInteger(FK) | NO | - | FK: permissions.id (CASCADE) |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Unique: `(team_role_id, permission_id)`
- Foreign Keys: `team_role_id`, `permission_id`

### Relationships
- Belongs To → Team Roles
- Belongs To → Permissions

---

## permissions

Stores system-wide permissions that can be assigned to roles.

### Purpose
- Permission registry for RBAC
- Permission reference management

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **name** | string(unique) | NO | - | Permission identifier |
| **display_name** | string | YES | NULL | Human-readable name |
| **description** | text | YES | NULL | Permission description |
| **category** | string | YES | NULL | Permission category |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Unique: `name`

### Relationships
- Has Many → Team Role Permissions

---

## user_git_providers

Stores Git provider credentials for users.

### Purpose
- GitHub/GitLab/Bitbucket account linking
- OAuth token management
- Repository integration

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **user_id** | unsignedBigInteger(FK) | NO | - | FK: users.id (CASCADE) |
| **provider** | enum | NO | - | Provider type (github, gitlab, bitbucket) |
| **provider_username** | string | NO | - | Username on the provider |
| **access_token** | text | NO | - | OAuth access token (encrypted) |
| **refresh_token** | text | YES | NULL | OAuth refresh token (encrypted) |
| **token_expires_at** | timestamp | YES | NULL | Token expiration time |
| **scopes** | string | YES | NULL | Granted OAuth scopes |
| **is_active** | boolean | NO | true | Connection active status |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Unique: `(user_id, provider)`
- Foreign Key: `user_id`

### Relationships
- Belongs To → Users

---

## Key Concepts

### User Types
- **free**: Free tier users with limited credits
- **patron**: Paid subscription users (annual or monthly)
- **system**: Internal system administrators

### Seller Types
- **at_business**: Austrian businesses with VAT ID
- **eu_vat**: EU businesses with VAT ID
- **eu_private**: EU private persons
- **non_eu_business**: Non-EU business
- **non_eu_private**: Non-EU private person

### Payout Methods
- **bank_transfer**: Direct bank transfer (IBAN/BIC)
- **paypal**: PayPal payout

### Git Workflows
- **push_only**: Direct commits to main branch
- **push_and_pr**: Create pull requests (no auto-merge)
- **push_pr_merge**: Create and automatically merge pull requests

---

## Data Integrity Notes

1. **User Deletion**: When a user is deleted (owner_id CASCADE), all dependent projects, schemas, and templates are also deleted.

2. **Project Access**: Non-owners cannot modify projects unless they are added as `project_members` with appropriate roles.

3. **Team Structure**: Teams can only be created by project owners, maintaining clear ownership hierarchy.

4. **Credit System**: Credit balance is tracked at the user level for all transaction types (generation, purchase, sale, etc).

5. **Two-Factor Authentication**: Once 2FA is enabled, must be confirmed. Trusted devices bypass 2FA for a period.

---

## Related Documentation

- See **Project Relationship Tables** for project member and schema associations
- See **User Notification System** for email preference handling
- See **Subscription & Credit System** for monetization details
