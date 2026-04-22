---
sidebar_position: 8
---

# Generation and Support Tables

## Overview

This document covers the generation system tables (tracking code generation, generation logs, and code adjustments) as well as support tables (system settings, subscriptions, credits, deployments, messaging, and more).

---

# Generation Domain

## project_generations

Tracks code generation records for projects.

### Purpose
- Record each code generation execution
- Track generation history and metadata
- Store generation output information
- Track template and schema versions used

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **project_id** | unsignedBigInteger(FK) | NO | - | FK: projects.id (CASCADE) |
| **schema_version_id** | unsignedBigInteger(FK) | YES | NULL | FK: schema_versions.id - Schema version used |
| **user_id** | unsignedBigInteger(FK) | NO | - | FK: users.id - User who generated |
| **template_id** | unsignedBigInteger(FK) | YES | NULL | FK: templates.id - Template used |
| **generation_number** | integer | NO | - | Sequential generation number |
| **filename** | string(255) | NO | - | Generated file/archive name |
| **file_path** | string(500) | NO | - | Storage path to generated files |
| **archive_type** | string(20) | YES | NULL | Archive type (zip, tar.gz, tar.xz) |
| **file_size** | integer | NO | - | Generated file size in bytes |
| **languages** | json | YES | NULL | Languages included in generation |
| **tables** | json | YES | NULL | Tables included in generation |
| **tables_count** | integer | NO | - | Number of tables generated |
| **files_count** | integer | NO | - | Number of files generated |
| **template_name** | string(255) | YES | NULL | Template name at generation time |
| **status** | enum | NO | completed | Status (completed, failed, partial) |
| **notes** | text | YES | NULL | Generation notes or error messages |
| **created_at** | timestamp | NO | - | Generation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Composite: `(project_id, created_at)`, `(user_id, created_at)`, `(template_id, created_at)`
- Foreign Keys: `project_id`, `schema_version_id`, `user_id`, `template_id`

### Relationships
- Belongs To → Projects
- Belongs To → Schema Versions
- Belongs To → Users
- Belongs To → Templates

---

## project_generation_trees

Stores dependency trees for schema generation.

### Purpose
- Store table dependency information
- Detect circular dependencies
- Optimize generation order
- Track staleness of generated code

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **project_id** | unsignedBigInteger(FK) | NO | - | FK: projects.id (CASCADE) |
| **tree_data** | longText | NO | - | Dependency tree structure (JSON/serialized) |
| **is_stale** | boolean | NO | false | Whether tree needs regeneration |
| **generated_at** | timestamp | NO | CURRENT | Tree generation timestamp |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Foreign Key: `project_id`

### Relationships
- Belongs To → Projects

### Tree Structure
The tree_data typically contains:
- Table nodes with their properties
- Foreign key relationships
- Dependency chain for generation order
- Circular dependency markers

---

## generation_logs

Detailed logs of all generation events.

### Purpose
- Audit trail for generation activities
- Change detection via hashing
- Performance monitoring
- Debugging and troubleshooting

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **project_id** | unsignedBigInteger(FK) | YES | NULL | FK: projects.id - Project context |
| **template_id** | unsignedBigInteger(FK) | YES | NULL | FK: templates.id - Template context |
| **schema_ids** | json | YES | NULL | Schemas involved (JSON array) |
| **template_version** | string(20) | YES | NULL | Template version used |
| **files_version_sum** | string(64) | YES | NULL | Hash of template files |
| **schema_version** | integer | YES | NULL | Schema version used |
| **hash_timestamp** | timestamp | YES | NULL | When hash was computed |
| **hash_full** | char(64) | YES | NULL | Full SHA-256 hash of all content |
| **hash_short** | char(8) | YES | NULL | Short hash for quick reference |
| **filename** | string(255) | NO | - | Generated filename |
| **created_at** | timestamp | NO | - | Log timestamp |

### Indexes
- Primary Key: `id`
- Composite: `(project_id, created_at)`, `(template_id, created_at)`, `(hash_full, hash_short)`
- Foreign Keys: `project_id`, `template_id`

### Relationships
- Belongs To → Projects
- Belongs To → Templates

### Hashing Purpose
- Detect duplicate generations
- Identify unchanged code
- Track which generation is current
- Support incremental updates

---

## code_adjustments

Defines rules for automated code adjustments/transformations.

### Purpose
- Store code adjustment/transformation rules
- Define patterns and conditions
- Support automated code modifications
- Manage execution order

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **project_id** | unsignedBigInteger(FK) | NO | - | FK: projects.id (CASCADE) |
| **name** | string(255) | NO | - | Adjustment name |
| **description** | text | YES | NULL | Adjustment description |
| **file_pattern** | string(500) | NO | - | File pattern to match (glob pattern) |
| **min_confidence** | decimal(3,2) | NO | - | Minimum confidence threshold (0-1) |
| **is_active** | boolean | NO | true | Adjustment active status |
| **execution_order** | integer | NO | 0 | Execution order (lower first) |
| **created_by_user_id** | unsignedBigInteger(FK) | YES | NULL | FK: users.id - Creator |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Foreign Keys: `project_id`, `created_by_user_id`
- Composite: `(project_id, is_active, execution_order)`

### Relationships
- Belongs To → Projects
- Belongs To → Users (creator)
- Has Many → Code Adjustment Insertions

---

## code_adjustment_insertions

Defines specific code insertions within code adjustments.

### Purpose
- Store insertion rules and anchor points
- Define multiple insertion points per adjustment
- Support code injection at specific locations

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **code_adjustment_id** | unsignedBigInteger(FK) | NO | - | FK: code_adjustments.id (CASCADE) |
| **insertion_type** | enum | NO | - | Type (beginning, end, middle) |
| **anchor_text** | string(500) | YES | NULL | Text pattern to anchor insertion (for middle) |
| **insertion_content** | mediumText | NO | - | Code to insert |
| **line_offset** | integer | YES | NULL | Line offset from anchor |
| **insertion_order** | integer | NO | 0 | Order of multiple insertions |
| **description** | string(255) | YES | NULL | Insertion purpose |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Foreign Key: `code_adjustment_id`
- Composite: `(code_adjustment_id, insertion_order)`

### Relationships
- Belongs To → Code Adjustments

### Insertion Types
- **beginning**: Insert at file start
- **end**: Insert at file end
- **middle**: Insert at anchor point

---

# Support Tables

## languages

Stores supported languages for the system.

### Purpose
- Define available languages
- Store language metadata
- Manage language display order
- Support language-specific resources

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **code** | string(5, unique) | NO | - | Language code (en, de, fr, etc.) |
| **name** | string(100) | NO | - | English language name |
| **native_name** | string(100) | YES | NULL | Native language name |
| **flag** | string(10) | YES | NULL | Flag emoji or icon |
| **is_active** | boolean | NO | true | Language active status |
| **is_default** | boolean | NO | false | Default language flag |
| **sort_order** | integer | NO | 0 | Display order |
| **description** | text | YES | NULL | Language description |
| **created_by** | unsignedBigInteger(FK) | YES | NULL | FK: users.id - Creator |
| **created_at** | timestamp | NO | - | Creation timestamp |

### Indexes
- Primary Key: `id`
- Unique: `code`
- Regular: `is_active`, `sort_order`

### Relationships
- Belongs To → Users (creator, optional)

---

## settings

Global system configuration settings.

### Purpose
- Store system-wide configuration
- Manage pricing and feature flags
- Store API keys and credentials

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **global_google_translate_key** | string(500) | YES | NULL | Google Translate API key |
| **price_patron_annual** | decimal(10,2) | YES | NULL | Annual patron subscription price |
| **price_patron_monthly** | decimal(10,2) | YES | NULL | Monthly patron subscription price |
| **price_credits_500** | decimal(10,2) | YES | NULL | Price for 500 credits |
| **price_credits_1000** | decimal(10,2) | YES | NULL | Price for 1000 credits |
| **price_credits_2500** | decimal(10,2) | YES | NULL | Price for 2500 credits |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`

---

## subscriptions

Tracks user subscription information.

### Purpose
- Manage user subscription status
- Track billing periods
- Support multiple payment methods
- Handle subscription states

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **user_id** | unsignedBigInteger(FK) | NO | - | FK: users.id (CASCADE) |
| **type** | string(50) | NO | - | Subscription type (patron, enterprise, etc.) |
| **plan_name** | string(100) | NO | - | Plan name |
| **status** | enum | NO | active | Status (active, cancelled, expired, past_due, trialing, paused) |
| **payment_method** | enum | NO | - | Payment method (stripe, paypal, credits) |
| **stripe_subscription_id** | string(255) | YES | NULL | Stripe subscription ID |
| **stripe_customer_id** | string(255) | YES | NULL | Stripe customer ID |
| **paypal_subscription_id** | string(255) | YES | NULL | PayPal subscription ID |
| **paypal_plan_id** | string(255) | YES | NULL | PayPal plan ID |
| **starts_at** | timestamp | NO | - | Subscription start date |
| **ends_at** | timestamp | YES | NULL | Subscription end date |
| **renews_at** | timestamp | YES | NULL | Next renewal date |
| **cancelled_at** | timestamp | YES | NULL | Cancellation timestamp |
| **cancellation_reason** | text | YES | NULL | Reason for cancellation |
| **monthly_credits** | integer | YES | NULL | Credits per month |
| **credits_used_this_period** | integer | NO | 0 | Credits used in current period |
| **trial_ends_at** | timestamp | YES | NULL | Trial period end date |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Composite: `(user_id, status)`, `(status, renews_at)`
- Foreign Key: `user_id`

### Relationships
- Belongs To → Users

---

## credit_transactions

Audit trail for all credit movements.

### Purpose
- Track credit balance changes
- Maintain complete transaction history
- Support credit system accounting
- Detect fraud

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **user_id** | unsignedBigInteger(FK) | NO | - | FK: users.id (CASCADE) |
| **amount** | integer | NO | - | Credit amount (positive or negative) |
| **balance_after** | integer | NO | - | Balance after transaction |
| **type** | enum | NO | - | Type (monthly_grant, generation, purchase, sale_earning, refund, admin_adjustment, signup_bonus, template_purchase, template_sale) |
| **description** | string(255) | YES | NULL | Transaction description |
| **reference_type** | string(100) | YES | NULL | Reference entity type (project, template, user, etc.) |
| **reference_id** | unsignedBigInteger | YES | NULL | Reference entity ID |
| **ip_address** | string(45) | YES | NULL | User IP address |
| **user_agent** | string(500) | YES | NULL | User agent string |
| **created_at** | timestamp | NO | - | Creation timestamp |

### Indexes
- Primary Key: `id`
- Composite: `(user_id, created_at)`, `(user_id, type)`, `(type, created_at)`
- Foreign Key: `user_id`

### Relationships
- Belongs To → Users

### Transaction Types
- **monthly_grant**: Monthly subscription credits
- **generation**: Credits used for code generation
- **purchase**: Credits purchased by user
- **sale_earning**: Credits earned from template sale
- **refund**: Refund transaction
- **admin_adjustment**: Admin manual adjustment
- **signup_bonus**: New user signup bonus
- **template_purchase**: Template purchase cost
- **template_sale**: Template sale earnings

---

## deployment_logs

Tracks all deployment operations.

### Purpose
- Log deployment activities
- Track deployment status
- Store deployment results and errors
- Monitor deployment history

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **project_id** | unsignedBigInteger(FK) | YES | NULL | FK: projects.id (SET NULL) |
| **user_id** | unsignedBigInteger(FK) | NO | - | FK: users.id - Who deployed |
| **generation_id** | unsignedBigInteger(FK) | YES | NULL | FK: project_generations.id (SET NULL) |
| **deployment_type** | string(50) | NO | - | Type (git, ftp, local, api) |
| **status** | enum | NO | - | Status (pending, running, completed, failed) |
| **target_path** | string(500) | NO | - | Deployment target |
| **error_message** | text | YES | NULL | Error details if failed |
| **file_count** | integer | YES | NULL | Files deployed |
| **total_size** | integer | YES | NULL | Total data deployed |
| **started_at** | timestamp | NO | - | Deployment start time |
| **completed_at** | timestamp | YES | NULL | Deployment completion time |
| **metadata** | json | YES | NULL | Additional deployment info |
| **created_at** | timestamp | NO | - | Creation timestamp |

### Indexes
- Primary Key: `id`
- Composite: `(project_id, status, created_at)`, `(user_id, created_at)`
- Foreign Keys: `project_id`, `user_id`, `generation_id`

### Relationships
- Belongs To → Projects
- Belongs To → Users
- Belongs To → Project Generations

---

## performance_metrics

System performance monitoring data.

### Purpose
- Track system performance
- Monitor action duration
- Identify bottlenecks
- Support performance analysis

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **user_id** | unsignedBigInteger(FK) | YES | NULL | FK: users.id - User context |
| **action_type** | string(50) | NO | - | Action (generation, deploy, parse, import, etc.) |
| **duration_ms** | integer | NO | - | Duration in milliseconds |
| **payload_size** | integer | YES | NULL | Payload size in bytes |
| **metadata** | json | YES | NULL | Additional metrics (JSON) |
| **measured_at** | timestamp | NO | - | Measurement timestamp |

### Indexes
- Primary Key: `id`
- Composite: `(action_type, measured_at)`, `(user_id, measured_at)`
- Foreign Key: `user_id`

### Relationships
- Belongs To → Users (optional)

---

## tickets

Support ticket management system.

### Purpose
- Track support requests
- Store issue reports
- Manage resolutions

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **creator_user_id** | unsignedBigInteger(FK) | NO | - | FK: users.id - Who created |
| **title** | string(255) | NO | - | Ticket title |
| **description** | text | NO | - | Ticket description |
| **type** | enum | NO | - | Type (bug, feature, support, documentation) |
| **priority** | enum | NO | - | Priority (low, medium, high, critical) |
| **status** | enum | NO | open | Status (open, in_progress, resolved, closed) |
| **admin_response** | text | YES | NULL | Admin response |
| **resolved_at** | timestamp | YES | NULL | Resolution timestamp |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Composite: `(status, priority)`, `(creator_user_id, created_at)`
- Foreign Key: `creator_user_id`

### Relationships
- Belongs To → Users (creator)

---

## visitor_logs

Website visitor analytics.

### Purpose
- Track website visits
- Gather analytics data
- Support usage reporting

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **ip_address** | string(45) | NO | - | Visitor IP address |
| **path** | string(500) | NO | - | Visited path |
| **user_agent** | string(500) | YES | NULL | Browser user agent |
| **referrer** | string(500) | YES | NULL | Referrer URL |
| **country** | string(100) | YES | NULL | Country name |
| **city** | string(100) | YES | NULL | City name |
| **device_type** | string(50) | YES | NULL | Device type (mobile, tablet, desktop) |
| **browser** | string(100) | YES | NULL | Browser name |
| **os** | string(100) | YES | NULL | Operating system |
| **visit_count** | integer | NO | 1 | Total visits from this IP |
| **first_visit_at** | timestamp | NO | - | First visit timestamp |
| **last_visit_at** | timestamp | NO | - | Last visit timestamp |

### Indexes
- Primary Key: `id`
- Composite: `(ip_address, last_visit_at)`, `(country, city)`, `(device_type, browser, os)`

---

## pages

CMS pages for static content and pop-ups.

### Purpose
- Store static pages and content
- Manage popups and notifications
- Support multi-language content

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **title** | string(255) | NO | - | Page title |
| **slug** | string(255, unique) | NO | - | URL slug |
| **content** | longText | YES | NULL | Page content (HTML) |
| **locale** | string(5) | NO | en | Language/locale code |
| **page_type** | enum | NO | cms | Page type (help, impressum, contact, cms, privacy, about, terms) |
| **is_active** | boolean | NO | true | Page active status |
| **meta_title** | string(255) | YES | NULL | SEO title |
| **meta_description** | string(500) | YES | NULL | SEO description |
| **meta_keywords** | string(500) | YES | NULL | SEO keywords |
| **is_popup** | boolean | NO | false | Display as popup flag |
| **popup_display** | enum | YES | NULL | Popup display rule (always, once, on_exit) |
| **popup_start_date** | date | YES | NULL | Popup start date |
| **popup_end_date** | date | YES | NULL | Popup end date |
| **popup_priority** | integer | YES | NULL | Popup display priority |
| **popup_dismissible** | boolean | NO | true | Popup can be closed |
| **popup_max_width** | integer | YES | NULL | Popup max width (px) |
| **popup_animation** | enum | YES | NULL | Animation (fade, slide, bounce) |
| **popup_icon** | string(50) | YES | NULL | Popup icon |
| **sort_order** | integer | NO | 0 | Display order |
| **created_by** | unsignedBigInteger(FK) | YES | NULL | FK: users.id - Creator |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Unique: `slug`
- Composite: `(page_type, locale, is_active)`, `(is_popup, popup_priority)`
- Foreign Key: `created_by`

### Relationships
- Belongs To → Users (creator)

---

## payouts

Seller payout tracking and processing.

### Purpose
- Track seller earnings payouts
- Manage payout status
- Store payout details

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **requested_by_user_id** | unsignedBigInteger(FK) | NO | - | FK: users.id - Seller requesting payout |
| **processed_by_user_id** | unsignedBigInteger(FK) | YES | NULL | FK: users.id - Admin who processed |
| **status** | enum | NO | pending | Status (pending, processing, completed, failed, cancelled) |
| **total_amount** | decimal(12,2) | NO | - | Total payout amount |
| **platform_fee** | decimal(12,2) | YES | NULL | Platform fee deducted |
| **net_amount** | decimal(12,2) | YES | NULL | Amount to be paid to seller |
| **payout_method** | enum | NO | - | Method (bank_transfer, paypal) |
| **paypal_payout_email** | string(255) | YES | NULL | PayPal email |
| **paypal_batch_id** | string(255) | YES | NULL | PayPal batch ID |
| **bank_iban** | string(34) | YES | NULL | Bank IBAN |
| **bank_bic** | string(11) | YES | NULL | Bank BIC/SWIFT |
| **bank_account_holder** | string(255) | YES | NULL | Account holder name |
| **reference_number** | string(100) | YES | NULL | Reference/invoice number |
| **notes** | text | YES | NULL | Payout notes |
| **items_count** | integer | NO | - | Number of sales included |
| **processed_at** | timestamp | YES | NULL | Processing timestamp |
| **failed_reason** | text | YES | NULL | Reason for failure |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Composite: `(requested_by_user_id, status)`, `(status, created_at)`
- Foreign Keys: `requested_by_user_id`, `processed_by_user_id`

### Relationships
- Belongs To → Users (requester)
- Belongs To → Users (processor)
- Has Many → Payout Items

---

## payout_items

Line items for payouts.

### Purpose
- Track individual sales in payouts
- Detail payout composition
- Support payout reconciliation

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **payout_id** | unsignedBigInteger(FK) | NO | - | FK: payouts.id (CASCADE) |
| **template_purchase_id** | unsignedBigInteger(FK) | YES | NULL | FK: template_purchases.id - Purchase reference |
| **seller_earnings** | decimal(10,2) | NO | - | Seller earnings amount |
| **platform_fee** | decimal(10,2) | NO | - | Platform fee amount |
| **created_at** | timestamp | NO | - | Creation timestamp |

### Indexes
- Primary Key: `id`
- Foreign Keys: `payout_id`, `template_purchase_id`

### Relationships
- Belongs To → Payouts
- Belongs To → Template Purchases

---

## cli_tasks

Tracks CLI command executions.

### Purpose
- Log CLI operations
- Track task status
- Store command results

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **user_id** | unsignedBigInteger(FK) | NO | - | FK: users.id (CASCADE) |
| **project_id** | unsignedBigInteger(FK) | NO | - | FK: projects.id (CASCADE) |
| **command_type** | string(50) | NO | - | Command type |
| **payload** | json | NO | - | Command parameters (JSON) |
| **status** | enum | NO | pending | Status (pending, running, completed, failed) |
| **result** | json | YES | NULL | Command result (JSON) |
| **started_at** | timestamp | YES | NULL | Start timestamp |
| **completed_at** | timestamp | YES | NULL | Completion timestamp |
| **error_message** | text | YES | NULL | Error details if failed |
| **created_at** | timestamp | NO | - | Creation timestamp |

### Indexes
- Primary Key: `id`
- Composite: `(user_id, status)`, `(project_id, created_at)`
- Foreign Keys: `user_id`, `project_id`

### Relationships
- Belongs To → Users
- Belongs To → Projects

---

## cli_devices

Registered CLI devices for a user.

### Purpose
- Track CLI device access
- Support device authentication
- Manage device sessions

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **user_id** | unsignedBigInteger(FK) | NO | - | FK: users.id (CASCADE) |
| **device_name** | string(255) | NO | - | Human-friendly device name |
| **device_id** | string(255, unique) | NO | - | Unique device identifier |
| **last_seen_at** | timestamp | YES | NULL | Last activity timestamp |
| **is_active** | boolean | NO | true | Device active status |
| **created_at** | timestamp | NO | - | Creation timestamp |

### Indexes
- Primary Key: `id`
- Unique: `device_id`
- Foreign Key: `user_id`

### Relationships
- Belongs To → Users

---

## push_subscriptions

Web push notification subscriptions.

### Purpose
- Store push notification subscriptions
- Support browser push notifications
- Manage subscriber list

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **user_id** | unsignedBigInteger(FK) | NO | - | FK: users.id (CASCADE) |
| **endpoint** | text(unique) | NO | - | Push service endpoint URL |
| **p256dh_key** | text | NO | - | ECDH public key |
| **auth_token** | string(255) | NO | - | Authentication token |
| **expires_at** | timestamp | YES | NULL | Subscription expiration |
| **created_at** | timestamp | NO | - | Creation timestamp |

### Indexes
- Primary Key: `id`
- Unique: `endpoint`
- Foreign Key: `user_id`

### Relationships
- Belongs To → Users

---

## registration_invites

Registration invite codes for controlled signups.

### Purpose
- Control user registration
- Track invite usage
- Manage signup flow

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **email** | string(255, unique) | NO | - | Invited email address |
| **invite_code** | string(100, unique) | NO | - | Unique invite code |
| **is_active** | boolean | NO | true | Invite active status |
| **invited_by** | unsignedBigInteger(FK) | YES | NULL | FK: users.id - Who sent invite |
| **used_by** | unsignedBigInteger(FK) | YES | NULL | FK: users.id - Who used invite |
| **used_at** | timestamp | YES | NULL | Usage timestamp |
| **notes** | text | YES | NULL | Invite notes |
| **created_at** | timestamp | NO | - | Creation timestamp |

### Indexes
- Primary Key: `id`
- Unique: `email`, `invite_code`
- Foreign Keys: `invited_by`, `used_by`

### Relationships
- Belongs To → Users (inviter)
- Belongs To → Users (user who registered)

---

## Key Concepts

### Generation Workflow
1. User initiates generation from template
2. System records `project_generations` entry
3. Generation produces files in storage
4. `generation_logs` entry created for audit
5. `code_adjustments` applied if configured

### Credit System
- All credit transactions logged in `credit_transactions`
- Balance maintained in `users.credits`
- Types support various earning/spending scenarios
- Audit trail for compliance

### Deployment Process
- Generation produces archive
- `deployment_logs` tracks deployment execution
- Supports multiple deployment targets (git, ftp, local)
- Error tracking for troubleshooting

---

## Related Documentation

- See **Core Tables** for user and project information
- See **Template Tables** for template details
- See **Schema Tables** for schema information
- See **Project Tables** for project associations
