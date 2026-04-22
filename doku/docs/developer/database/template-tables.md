---
sidebar_position: 5
---

# Template Tables

## Overview

The template tables manage the complete lifecycle of code generation templates, including template content, metadata, marketplace features, purchases, and reviews. Templates are the core engine of Scoriet's code generation capability.

---

## templates

Stores master template definitions with metadata, pricing, and marketplace information.

### Purpose
- Store template definitions and metadata
- Manage template visibility and distribution (private/public/store)
- Track template versions, pricing, and sales
- Manage template cloning and inheritance
- Support template marketplace and monetization

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **name** | string(100) | NO | - | Template name |
| **full_name** | string(500, indexed) | YES | NULL | Full template name with branding |
| **description** | text | YES | NULL | Template description |
| **category** | string(100) | NO | Web | Template category (Web, Mobile, Desktop, API, Database, etc.) |
| **language** | string(50, indexed) | NO | - | Primary language (PHP, Python, Node.js, Java, C#, etc.) |
| **is_active** | boolean | NO | true | Template active status |
| **tags** | json | YES | NULL | Search tags (JSON array) |
| **file_count** | integer | NO | 0 | Number of template files |
| **creator_user_id** | unsignedBigInteger(FK) | YES | NULL | FK: users.id - Template creator |
| **project_id** | unsignedBigInteger(FK) | YES | NULL | FK: projects.id - Associated project |
| **visibility** | enum | YES | private | Visibility (private, public, store) |
| **visibility_locked** | boolean | NO | false | Lock template visibility from changes |
| **price_type** | enum | YES | NULL | Pricing model (credits, euros) |
| **price_credits** | integer | YES | NULL | Price in platform credits |
| **price_euros** | decimal | YES | NULL | Price in euros |
| **is_store_approved** | boolean | NO | false | Marketplace approval status |
| **fingerprints_generated** | boolean | NO | false | Content fingerprints generated |
| **fingerprints_generated_at** | timestamp | YES | NULL | Fingerprint generation timestamp |
| **sales_count** | unsignedBigInteger | NO | 0 | Total sales count |
| **total_revenue** | decimal(12) | NO | 0 | Total lifetime revenue |
| **review_status** | enum | NO | draft | Review status (draft, pending_review, approved, rejected) |
| **review_score** | integer | NO | 0 | Marketplace review score |
| **is_system_template** | boolean | NO | false | System/built-in template flag |
| **original_template_id** | unsignedBigInteger(FK, indexed) | YES | NULL | FK: templates.id - Original if this is a clone |
| **cloned_from_template_id** | unsignedBigInteger(FK, indexed) | YES | NULL | FK: templates.id - Parent if cloned from another |
| **is_from_store** | boolean | NO | false | Downloaded from store flag |
| **resale_allowed** | boolean | NO | false | Allow cloning and resale |
| **template_type** | enum(indexed) | NO | original | Type (original, cloned, linked) |
| **history** | json | YES | NULL | Fork and contribution history (JSON) |
| **community_rating** | json | YES | NULL | Community reviews and ratings (JSON) |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |
| **protected_files** | json | YES | NULL | Files protected from overwrite (JSON array) |
| **install_script** | json | YES | NULL | Installation instructions (JSON) |
| **update_script** | json | YES | NULL | Update instructions (JSON) |
| **compatibility_tag** | string(100) | YES | NULL | Compatibility marker (e.g., 'Laravel 12', 'React 19') |
| **generation_order** | integer | YES | NULL | Generation order in multi-template projects |
| **version** | string(20) | YES | NULL | Template version string (e.g., '1.0.0') |

### Indexes
- Primary Key: `id`
- Regular: `full_name`, `language`, `template_type`, `is_system_template`
- Composite: `(category, is_active)`, `(creator_user_id, visibility)`, `(is_system_template, visibility)`, `(project_id, visibility)`
- Foreign Keys: `original_template_id`, `cloned_from_template_id`, `creator_user_id`, `project_id`

### Relationships
- Belongs To → Users (creator)
- Belongs To → Projects (optional)
- Has Many → Template Files
- Has Many → Template Variables
- Has Many → Template Fingerprints
- Has Many → Template Media
- Has Many → Template Reviews
- Has Many → Template Purchases
- Has Many → Template Schema Dependencies
- Has One → Original Template (if cloned)

### Template Types
- **original**: User-created or system templates
- **cloned**: Copy of another template
- **linked**: Reference to another template (for inheritance)

### Visibility Levels
- **private**: Only accessible to creator
- **public**: Visible to all users, available for forking
- **store**: Listed in marketplace for purchase

### Review Status
- **draft**: Not yet submitted for review
- **pending_review**: Awaiting moderator review
- **approved**: Approved for marketplace
- **rejected**: Rejected (can be resubmitted)

---

## template_files

Stores individual template files with content and metadata.

### Purpose
- Store template file content
- Track file metadata and settings
- Support file-level include directives
- Map files to form windows for UI generation

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **template_id** | unsignedBigInteger(FK) | NO | - | FK: templates.id (CASCADE) |
| **file_name** | string(255) | NO | - | Filename (e.g., 'index.php', 'controller.php') |
| **file_path** | string(500) | NO | - | Output path relative to project root |
| **file_content** | mediumText | NO | - | File content with template variables/directives |
| **file_type** | string(50) | NO | template | File type (template, configuration, document, etc.) |
| **content_type** | enum | NO | text | Content type (text, zip) |
| **zip_filename** | string(255) | YES | NULL | If content_type=zip, the zip filename |
| **output_path** | string(500) | YES | NULL | Template output path variable |
| **file_order** | integer | NO | 0 | Generation order |
| **form_window_type** | integer(0-5) | YES | NULL | Associated form window type |
| **is_include_only** | boolean | NO | false | Only used via include directive |
| **inject_snippets** | json | YES | NULL | Snippet injection points (JSON) |
| **inject_separator** | json | YES | NULL | Separator between injected snippets |
| **language_override** | string(50) | YES | NULL | Override template language for this file |
| **version** | integer | NO | 1 | File version number |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Foreign Key: `template_id`
- Composite: `(template_id, file_name)` - Unique filenames per template

### Relationships
- Belongs To → Templates
- Has Many → Template Fingerprints
- Has Many → Template File Field Assignments

### Form Window Types
- **0**: Main menu
- **1**: Create/edit window
- **2**: Data table
- **3**: Report (single record)
- **4**: Report (list)
- **5**: Other/custom

### Content Types
- **text**: Plain text template file
- **zip**: Zipped file(s) to be extracted

---

## template_variables

Stores input variables/parameters for templates.

### Purpose
- Define template placeholders and parameters
- Specify variable requirements and defaults
- Document template inputs

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **template_id** | unsignedBigInteger(FK) | NO | - | FK: templates.id (CASCADE) |
| **variable_name** | string(100) | NO | - | Variable name (e.g., 'projectname', 'author') |
| **description** | text | YES | NULL | Variable description and usage |
| **default_value** | string(500) | YES | NULL | Default value if not provided |
| **is_required** | boolean | NO | false | Whether variable is required |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Unique: `(template_id, variable_name)` - Variable names unique per template
- Foreign Key: `template_id`

### Relationships
- Belongs To → Templates
- Has Many → Project Template Variable Values (for runtime values)

### Common Variables
- `projectname`: Project name
- `projectauthor`: Project author
- `namespace`: PHP namespace
- `package`: Java/Python package
- `author`: Template author name
- `copyright`: Copyright text
- `license`: Software license type

---

## template_fingerprints

Stores content hashes and signatures for change detection.

### Purpose
- Detect template file changes
- Track content modifications
- Support update detection for cloned templates

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **template_id** | unsignedBigInteger(FK) | NO | - | FK: templates.id (CASCADE) |
| **template_file_id** | unsignedBigInteger(FK) | YES | NULL | FK: template_files.id - Specific file |
| **file_hash** | string(64) | NO | - | SHA-256 hash of file content |
| **normalized_content** | text | YES | NULL | Normalized content for comparison |
| **content_length** | integer | NO | - | Content length in bytes |
| **token_signature** | json | YES | NULL | Tokenized signature for pattern matching |
| **file_type** | string(50) | NO | - | File type (code, doc, config, etc.) |
| **is_significant** | boolean | NO | true | Whether this is a significant change |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Foreign Keys: `template_id`, `template_file_id`
- Regular: `file_hash` - Quick hash lookups
- Composite: `(template_id, file_hash)` - Detect duplicates

### Relationships
- Belongs To → Templates
- Belongs To → Template Files (optional)

### Hashing Strategy
- Uses SHA-256 for content hashing
- Normalized content removes whitespace/formatting
- Token signature enables intelligent change detection
- Supports detection of renamed/moved files

---

## template_media

Stores marketing media (logos, images, videos) for templates.

### Purpose
- Store template marketing images and videos
- Support template showcase/preview
- Manage template branding

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **template_id** | unsignedBigInteger(FK) | NO | - | FK: templates.id (CASCADE) |
| **media_type** | enum | NO | - | Media type (logo, image, video) |
| **file_path** | string(500) | YES | NULL | Local file path (for stored media) |
| **file_data** | longBlob | YES | NULL | Binary media data (for inline storage) |
| **mime_type** | string(100) | YES | NULL | MIME type (image/png, video/mp4, etc.) |
| **file_size** | integer | YES | NULL | File size in bytes |
| **video_url** | string(500) | YES | NULL | External video URL (YouTube, etc.) |
| **title** | string(255) | YES | NULL | Media title/caption |
| **description** | text | YES | NULL | Media description |
| **sort_order** | integer | NO | 0 | Display order |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Foreign Key: `template_id`

### Relationships
- Belongs To → Templates

### Media Types
- **logo**: Template logo/icon
- **image**: Screenshot or promotional image
- **video**: Demo or preview video

---

## template_purchases

Tracks marketplace purchases and payment history.

### Purpose
- Record template purchases
- Track buyer/seller relationships
- Calculate earnings and payouts
- Support dispute resolution

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **buyer_user_id** | unsignedBigInteger(FK) | NO | - | FK: users.id - Buyer |
| **seller_user_id** | unsignedBigInteger(FK) | NO | - | FK: users.id - Seller/Creator |
| **template_id** | unsignedBigInteger(FK) | NO | - | FK: templates.id (CASCADE) |
| **payment_type** | enum | NO | - | Payment method (credits, euros) |
| **price_credits** | integer | YES | NULL | Price in credits (if paid in credits) |
| **price_euros** | decimal(10,2) | YES | NULL | Price in euros (if paid in euros) |
| **is_paid_out** | boolean | NO | false | Payout processed flag |
| **payout_id** | unsignedBigInteger(FK) | YES | NULL | FK: payouts.id - Associated payout |
| **paid_out_at** | timestamp | YES | NULL | Payout timestamp |
| **seller_earnings** | decimal(10,2) | YES | NULL | Seller's share of payment |
| **platform_fee** | decimal(10,2) | YES | NULL | Platform's share of payment |
| **transaction_reference** | string(100) | YES | NULL | External payment reference |
| **notes** | text | YES | NULL | Transaction notes |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Unique: `(buyer_user_id, template_id)` - User can only buy template once
- Composite: `(seller_user_id, is_paid_out)`, `(template_id, created_at)`
- Foreign Keys: `buyer_user_id`, `seller_user_id`, `template_id`, `payout_id`

### Relationships
- Belongs To → Users (buyer)
- Belongs To → Users (seller)
- Belongs To → Templates
- Belongs To → Payouts

---

## template_reviews

Stores user reviews and ratings for marketplace templates.

### Purpose
- Collect user feedback on templates
- Build community reputation
- Provide social proof for marketplace

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **template_id** | unsignedBigInteger(FK) | NO | - | FK: templates.id (CASCADE) |
| **reviewer_user_id** | unsignedBigInteger(FK) | NO | - | FK: users.id - Review author |
| **vote** | tinyInt | NO | - | Rating (1-5 stars) |
| **comment** | text | YES | NULL | Review comment/feedback |
| **is_verified_purchase** | boolean | NO | false | Verified purchase flag |
| **helpful_count** | integer | NO | 0 | Count of helpful votes |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Unique: `(template_id, reviewer_user_id)` - One review per user per template
- Composite: `(template_id, vote, created_at)` - For sorting reviews
- Foreign Keys: `template_id`, `reviewer_user_id`

### Relationships
- Belongs To → Templates
- Belongs To → Users (reviewer)

---

## template_schema_dependencies

Defines which database schemas are required for template functionality.

### Purpose
- Specify schema requirements for templates
- Support dependency management
- Enable compatibility checking

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **template_id** | unsignedBigInteger(FK) | NO | - | FK: templates.id (CASCADE) |
| **schema_id** | unsignedBigInteger(FK) | NO | - | FK: schemas.id (CASCADE) |
| **is_required** | boolean | NO | true | Required or optional dependency |
| **alias** | string(100) | YES | NULL | Alias for the schema in template |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Unique: `(template_id, schema_id)` - Each schema once per template
- Foreign Keys: `template_id`, `schema_id`

### Relationships
- Belongs To → Templates
- Belongs To → Schemas

### Usage
When generating code, Scoriet checks if all required schemas are available in the project before template generation.

---

## template_file_field_assignments

Maps form fields to template files for visibility control.

### Purpose
- Control field visibility in template-generated forms
- Map schema fields to specific template files
- Define field state (visible, grayed, inactive, invisible)

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **template_file_id** | unsignedBigInteger(FK) | NO | - | FK: template_files.id (CASCADE) |
| **schema_field_id** | unsignedBigInteger(FK) | NO | - | FK: schema_fields.id (CASCADE) |
| **visibility_state** | enum | NO | visible | Visibility (visible, grayed, inactive, invisible, not_available) |
| **sort_order** | integer | NO | 0 | Display order |
| **created_by** | unsignedBigInteger(FK) | YES | NULL | FK: users.id - Assignment creator |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Unique: `(template_file_id, schema_field_id)` - Each field once per file
- Foreign Keys: `template_file_id`, `schema_field_id`, `created_by`

### Relationships
- Belongs To → Template Files
- Belongs To → Schema Fields
- Belongs To → Users (creator)

### Visibility States
- **visible**: Field shown and editable
- **grayed**: Field shown but disabled
- **inactive**: Field hidden but data preserved
- **invisible**: Field completely hidden
- **not_available**: Field not applicable to this template

---

## Key Concepts

### Template Hierarchy
```
Templates (master definition)
  ├── Template Files (content to generate)
  ├── Template Variables (input parameters)
  ├── Template Fingerprints (change detection)
  ├── Template Media (marketing images)
  └── Template Dependencies (required schemas)
```

### Template Types and Versioning
- **Original**: Created from scratch
- **Cloned**: Copy from another template (independent)
- **Linked**: Reference/inheritance (changes propagate)

### Template Lifecycle
1. Creation (draft status)
2. Development (private visibility)
3. Testing with projects
4. Public release (optional)
5. Store submission → Review → Approval
6. Sales and earnings tracking

### Monetization
- **Free**: No pricing set, distributed for free
- **Credits**: Purchased with platform credits
- **Euros**: Purchased with real currency (Stripe/PayPal)
- **Hybrid**: Price in both currencies

### Marketplace Features
- Visibility control (private/public/store)
- Review system and ratings
- Sales tracking and revenue reports
- Verified purchase badges
- Template recommendations

---

## Related Documentation

- See **Core Tables** for user and creator information
- See **Project Tables** for template usage in projects
- See **Schema Tables** for template schema requirements
- See **Generation Domain** for template usage in code generation
