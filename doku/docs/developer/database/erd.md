---
sidebar_position: 2
---

# Entity Relationship Diagrams

This document contains Entity Relationship Diagrams for different domains of the Scoriet database. Each diagram focuses on a specific functional area to provide clarity and easy comprehension.

![Database Designer](/img/screenshots/database-designer.png)
*Visual Database Designer showing the schema tables and their relationships*

## Core Domain - Users, Projects, Teams

The core domain manages user accounts, project organization, and team structures.

```mermaid
erDiagram
    USERS ||--o{ PROJECTS : owns
    USERS ||--o{ SCHEMAS : owns
    USERS ||--o{ TEMPLATES : creates
    USERS ||--o{ TEAMS : manages
    USERS {
        bigint id PK
        string name
        string email UK
        string username UK
        enum user_type
        enum theme
        boolean is_active
        int credits
        timestamp last_login_at
    }
    
    PROJECTS ||--o{ PROJECT_MEMBERS : has
    PROJECTS ||--o{ PROJECT_SCHEMAS : uses
    PROJECTS ||--o{ PROJECT_TEMPLATE_USAGE : uses
    PROJECTS ||--o{ PROJECT_GENERATIONS : contains
    PROJECTS {
        bigint id PK
        string name
        bigint owner_id FK
        string database_name
        string database_type
        boolean is_active
        boolean is_public
        json settings
    }
    
    TEAMS ||--o{ TEAM_MEMBERS : contains
    TEAMS ||--o{ TEAM_ROLES : defines
    TEAMS {
        bigint id PK
        string name
        bigint project_owner_id FK
        boolean is_active
    }
    
    TEAM_MEMBERS }o--|| USERS : references
    TEAM_MEMBERS }o--|| TEAMS : joins
    TEAM_MEMBERS }o--|| TEAM_ROLES : has
    TEAM_MEMBERS {
        bigint id PK
        bigint team_id FK
        bigint user_id FK
        bigint team_role_id FK
        enum role
    }
    
    TEAM_ROLES ||--o{ TEAM_ROLE_PERMISSIONS : grants
    TEAM_ROLES }o--|| TEAMS : belongs_to
    TEAM_ROLES {
        bigint id PK
        bigint team_id FK
        string name
        string slug
        boolean is_system
    }
    
    TEAM_ROLE_PERMISSIONS }o--|| PERMISSIONS : references
    TEAM_ROLE_PERMISSIONS {
        bigint id PK
        bigint team_role_id FK
        bigint permission_id FK
    }
    
    PROJECT_MEMBERS }o--|| USERS : references
    PROJECT_MEMBERS }o--|| PROJECTS : joins
    PROJECT_MEMBERS {
        bigint id PK
        bigint project_id FK
        bigint user_id FK
        enum role
        timestamp joined_at
    }
    
    PERMISSIONS {
        bigint id PK
        string name UK
        string display_name
        string category
    }
    
    USER_GIT_PROVIDERS }o--|| USERS : belongs_to
    USER_GIT_PROVIDERS {
        bigint id PK
        bigint user_id FK
        enum provider
        string provider_username
        text access_token
    }
```

## Schema Domain - Database Schema Modeling

The schema domain manages database schema definitions, versioning, and structure modeling.

```mermaid
erDiagram
    SCHEMAS ||--o{ SCHEMA_VERSIONS : has
    SCHEMAS ||--o{ SCHEMA_DESIGNER_LAYOUTS : stores
    SCHEMAS }o--|| USERS : owned_by
    SCHEMAS {
        bigint id PK
        string name
        bigint owner_id FK
        enum visibility
        boolean is_system_schema
        int last_version
        timestamp created_at
    }
    
    SCHEMA_VERSIONS ||--o{ SCHEMA_TABLES : contains
    SCHEMA_VERSIONS {
        bigint id PK
        bigint schema_id FK
        int version_number
        string version_name
        boolean has_unsaved_changes
        timestamp imported_at
    }
    
    SCHEMA_TABLES ||--o{ SCHEMA_FIELDS : defines
    SCHEMA_TABLES ||--o{ SCHEMA_CONSTRAINTS : has
    SCHEMA_TABLES }o--|| SCHEMA_VERSIONS : belongs_to
    SCHEMA_TABLES {
        bigint id PK
        bigint schema_id FK
        bigint schema_version_id FK
        string table_name
        string primarykeyfield
        string singular_name
        string form_set_report_pattern
    }
    
    SCHEMA_FIELDS }o--|| SCHEMA_TABLES : belongs_to
    SCHEMA_FIELDS {
        bigint id PK
        bigint table_id FK
        string field_name
        string field_type
        boolean is_nullable
        boolean is_primary_key
        boolean is_auto_increment
        string control_type
        string default_value
    }
    
    SCHEMA_CONSTRAINTS ||--o{ SCHEMA_CONSTRAINT_COLUMNS : includes
    SCHEMA_CONSTRAINTS ||--o{ SCHEMA_FOREIGN_KEY_REFERENCES : defines
    SCHEMA_CONSTRAINTS }o--|| SCHEMA_TABLES : belongs_to
    SCHEMA_CONSTRAINTS {
        bigint id PK
        bigint table_id FK
        string constraint_name
        enum constraint_type
    }
    
    SCHEMA_CONSTRAINT_COLUMNS }o--|| SCHEMA_FIELDS : references
    SCHEMA_CONSTRAINT_COLUMNS {
        bigint id PK
        bigint constraint_id FK
        bigint field_id FK
        int column_order
    }
    
    SCHEMA_FOREIGN_KEY_REFERENCES }o--|| SCHEMA_TABLES : references
    SCHEMA_FOREIGN_KEY_REFERENCES {
        bigint id PK
        bigint constraint_id FK UK
        bigint referenced_table_id FK
        enum on_delete
        enum on_update
    }
    
    SCHEMA_FOREIGN_KEY_REFERENCE_COLUMNS }o--|| SCHEMA_FIELDS : references
    SCHEMA_FOREIGN_KEY_REFERENCE_COLUMNS {
        bigint id PK
        bigint reference_id FK
        bigint referenced_field_id FK
        int column_order
    }
    
    SCHEMA_DESIGNER_LAYOUTS }o--|| SCHEMAS : belongs_to
    SCHEMA_DESIGNER_LAYOUTS {
        bigint id PK
        bigint schema_id FK
        int version_number
        json layout_data
    }
    
    SCHEMA_TRANSLATIONS {
        bigint id PK
        string item_name
        string code
        text translated_text
        boolean is_active
    }
```

## Template Domain - Code Templates

The template domain manages code templates, templates files, and template content.

```mermaid
erDiagram
    USERS ||--o{ TEMPLATES : creates
    PROJECTS ||--o{ TEMPLATES : contains
    TEMPLATES ||--o{ TEMPLATE_FILES : contains
    TEMPLATES ||--o{ TEMPLATE_VARIABLES : defines
    TEMPLATES ||--o{ TEMPLATE_FINGERPRINTS : has
    TEMPLATES ||--o{ TEMPLATE_MEDIA : has
    TEMPLATES ||--o{ TEMPLATE_REVIEWS : receives
    TEMPLATES ||--o{ TEMPLATE_PURCHASES : tracked_by
    TEMPLATES ||--o{ TEMPLATE_SCHEMA_DEPENDENCIES : requires
    TEMPLATES {
        bigint id PK
        string name
        string full_name
        bigint creator_user_id FK
        bigint project_id FK
        string category
        string language
        enum visibility
        enum template_type
        boolean is_system_template
        enum price_type
        int price_credits
        decimal price_euros
        int sales_count
    }
    
    TEMPLATE_FILES }o--|| TEMPLATES : belongs_to
    TEMPLATE_FILES {
        bigint id PK
        bigint template_id FK
        string file_name
        string file_path
        mediumtext file_content
        enum file_type
        int file_order
        boolean is_include_only
    }
    
    TEMPLATE_VARIABLES }o--|| TEMPLATES : belongs_to
    TEMPLATE_VARIABLES {
        bigint id PK
        bigint template_id FK
        string variable_name
        string description
        string default_value
        boolean is_required
    }
    
    TEMPLATE_FINGERPRINTS }o--|| TEMPLATE_FILES : references
    TEMPLATE_FINGERPRINTS {
        bigint id PK
        bigint template_id FK
        bigint template_file_id FK
        string file_hash
        int content_length
    }
    
    TEMPLATE_MEDIA }o--|| TEMPLATES : belongs_to
    TEMPLATE_MEDIA {
        bigint id PK
        bigint template_id FK
        enum media_type
        string file_path
        string mime_type
        string video_url
        int sort_order
    }
    
    TEMPLATE_REVIEWS }o--|| TEMPLATES : for
    TEMPLATE_REVIEWS }o--|| USERS : by
    TEMPLATE_REVIEWS {
        bigint id PK
        bigint template_id FK
        bigint reviewer_user_id FK
        tinyint vote
        text comment
    }
    
    TEMPLATE_PURCHASES }o--|| USERS : buyer
    TEMPLATE_PURCHASES }o--|| USERS : seller
    TEMPLATE_PURCHASES }o--|| TEMPLATES : purchases
    TEMPLATE_PURCHASES {
        bigint id PK
        bigint buyer_user_id FK
        bigint seller_user_id FK
        bigint template_id FK
        enum payment_type
        int price_credits
        decimal price_euros
        boolean is_paid_out
    }
    
    TEMPLATE_SCHEMA_DEPENDENCIES }o--|| TEMPLATES : belongs_to
    TEMPLATE_SCHEMA_DEPENDENCIES }o--|| SCHEMAS : requires
    TEMPLATE_SCHEMA_DEPENDENCIES {
        bigint id PK
        bigint template_id FK
        bigint schema_id FK
        boolean is_required
        string alias
    }
    
    TEMPLATE_FILE_FIELD_ASSIGNMENTS }o--|| TEMPLATE_FILES : references
    TEMPLATE_FILE_FIELD_ASSIGNMENTS }o--|| SCHEMA_FIELDS : assigns
    TEMPLATE_FILE_FIELD_ASSIGNMENTS {
        bigint id PK
        bigint template_file_id FK
        bigint schema_field_id FK
        enum visibility_state
        int sort_order
    }
```

## Generation Domain - Code Generation

The generation domain tracks code generation records, logs, and code adjustments.

```mermaid
erDiagram
    PROJECTS ||--o{ PROJECT_GENERATIONS : contains
    PROJECTS ||--o{ PROJECT_GENERATION_TREES : has
    PROJECTS ||--o{ GENERATION_LOGS : tracks
    PROJECTS ||--o{ CODE_ADJUSTMENTS : defines
    TEMPLATES ||--o{ PROJECT_GENERATIONS : used_in
    USERS ||--o{ PROJECT_GENERATIONS : performs
    USERS ||--o{ CODE_ADJUSTMENTS : creates
    
    PROJECT_GENERATIONS }o--|| SCHEMA_VERSIONS : uses
    PROJECT_GENERATIONS {
        bigint id PK
        bigint project_id FK
        bigint schema_version_id FK
        bigint user_id FK
        bigint template_id FK
        int generation_number
        string filename
        enum status
        json languages
        json tables
        timestamp created_at
    }
    
    PROJECT_GENERATION_TREES }o--|| PROJECTS : belongs_to
    PROJECT_GENERATION_TREES {
        bigint id PK
        bigint project_id FK
        longtext tree_data
        boolean is_stale
        timestamp generated_at
    }
    
    GENERATION_LOGS }o--|| PROJECTS : for
    GENERATION_LOGS }o--|| TEMPLATES : for
    GENERATION_LOGS {
        bigint id PK
        bigint project_id FK
        bigint template_id FK
        json schema_ids
        string template_version
        char64 hash_full
        char8 hash_short
        timestamp created_at
    }
    
    CODE_ADJUSTMENTS }o--|| PROJECTS : defines
    CODE_ADJUSTMENTS ||--o{ CODE_ADJUSTMENT_INSERTIONS : contains
    CODE_ADJUSTMENTS {
        bigint id PK
        bigint project_id FK
        string name
        string file_pattern
        decimal min_confidence
        boolean is_active
        int execution_order
    }
    
    CODE_ADJUSTMENT_INSERTIONS }o--|| CODE_ADJUSTMENTS : belongs_to
    CODE_ADJUSTMENT_INSERTIONS {
        bigint id PK
        bigint code_adjustment_id FK
        enum insertion_type
        string anchor_text
        mediumtext insertion_content
        int insertion_order
    }
```

## Form Domain - Form Designer

The form domain manages form sets, windows, elements, and field placements.

```mermaid
erDiagram
    USERS ||--o{ FORM_SETS : creates
    FORM_SETS ||--o{ FORM_WINDOWS : defines
    FORM_WINDOWS ||--o{ FORM_ELEMENTS : contains
    FORM_WINDOWS ||--o{ FORM_ITEM_PLACEMENTS : places
    FORM_ELEMENTS ||--o{ FORM_ELEMENTS : contains_tabs
    FORM_ELEMENTS ||--o{ FORM_ITEM_PLACEMENTS : references
    
    FORM_SETS {
        bigint id PK
        string name
        bigint creator_user_id FK
        enum visibility
        bigint cloned_from_id FK
        boolean is_active
        json colors
    }
    
    FORM_WINDOWS }o--|| FORM_SETS : belongs_to
    FORM_WINDOWS {
        bigint id PK
        bigint form_set_id FK
        string name
        enum window_type
        int min_width
        int default_width
        int default_height
        boolean is_active
        int sort_order
    }
    
    FORM_ELEMENTS }o--|| FORM_WINDOWS : belongs_to
    FORM_ELEMENTS }o--|| FORM_ELEMENTS : "parent_tab"
    FORM_ELEMENTS {
        bigint id PK
        bigint form_window_id FK
        enum element_type
        int x_position
        int y_position
        int width
        int height
        string container_orientation
        int sort_order
        boolean is_visible
    }
    
    FORM_ITEM_PLACEMENTS }o--|| FORM_WINDOWS : references
    FORM_ITEM_PLACEMENTS }o--|| SCHEMA_TABLES : places
    FORM_ITEM_PLACEMENTS }o--|| SCHEMA_FIELDS : places
    FORM_ITEM_PLACEMENTS }o--|| FORM_ELEMENTS : in
    FORM_ITEM_PLACEMENTS {
        bigint id PK
        bigint form_window_id FK
        bigint container_element_id FK
        bigint schema_table_id FK
        bigint field_id FK
        enum item_type
        int x_position
        int y_position
        int width
        int height
        string caption_override
        json localized_labels
    }
    
    PROJECT_FORM_SET }o--|| PROJECTS : references
    PROJECT_FORM_SET }o--|| FORM_SETS : uses
    PROJECT_FORM_SET {
        bigint id PK
        bigint project_id FK
        bigint form_set_id FK
        boolean is_active
    }
```

## Report Domain - Report Designer

The report domain manages report patterns, forms, elements, and layouts.

```mermaid
erDiagram
    USERS ||--o{ REPORT_PATTERNS : creates
    REPORT_PATTERNS ||--o{ REPORT_PATTERN_FORMS : defines
    REPORT_PATTERN_FORMS ||--o{ REPORT_PATTERN_ELEMENTS : contains
    REPORT_PATTERN_FORMS ||--o{ REPORT_LAYOUT_ELEMENTS : contains
    REPORT_PATTERNS ||--o{ REPORT_IMAGES : stores
    
    REPORT_PATTERNS {
        bigint id PK
        string name
        bigint creator_user_id FK
        enum visibility
        bigint cloned_from_id FK
        boolean is_active
    }
    
    REPORT_PATTERN_FORMS }o--|| REPORT_PATTERNS : belongs_to
    REPORT_PATTERN_FORMS {
        bigint id PK
        bigint report_pattern_id FK
        enum form_type
        string paper_size
        string orientation
        int width
        int height
        int row_height
        int max_columns
        json table_header_config
    }
    
    REPORT_PATTERN_ELEMENTS }o--|| REPORT_PATTERN_FORMS : belongs_to
    REPORT_PATTERN_ELEMENTS {
        bigint id PK
        bigint report_pattern_form_id FK
        enum element_type
        int x_position
        int y_position
        int width
        int height
        int container_columns
        string label
        json report_controls
        int sort_order
        boolean is_visible
    }
    
    REPORT_LAYOUT_ELEMENTS }o--|| REPORT_PATTERN_FORMS : belongs_to
    REPORT_LAYOUT_ELEMENTS }o--|| SCHEMA_TABLES : references
    REPORT_LAYOUT_ELEMENTS }o--|| SCHEMA_FIELDS : references
    REPORT_LAYOUT_ELEMENTS {
        bigint id PK
        bigint report_pattern_form_id FK
        bigint container_element_id FK
        enum element_type
        bigint schema_table_id FK
        bigint field_id FK
        string font_family
        int font_size
        string text_color
        string background_color
        int sort_order
        boolean is_visible
    }
    
    REPORT_IMAGES }o--|| REPORT_PATTERNS : belongs_to
    REPORT_IMAGES {
        bigint id PK
        bigint report_pattern_id FK
        string name
        string mime_type
        binary image_data
        int width
        int height
    }
    
    PROJECT_REPORT_PATTERNS }o--|| PROJECTS : references
    PROJECT_REPORT_PATTERNS }o--|| REPORT_PATTERNS : uses
    PROJECT_REPORT_PATTERNS {
        bigint id PK
        bigint project_id FK
        bigint report_pattern_id FK
        boolean is_active
    }
```

## Kanban Domain - Project Management

The kanban domain manages kanban boards, columns, cards, and activities.

```mermaid
erDiagram
    PROJECTS ||--|| KANBAN_BOARDS : has
    KANBAN_BOARDS ||--o{ KANBAN_COLUMNS : contains
    KANBAN_BOARDS ||--o{ KANBAN_LABELS : defines
    KANBAN_COLUMNS ||--o{ KANBAN_CARDS : contains
    KANBAN_CARDS ||--o{ KANBAN_CARD_COMMENTS : has
    KANBAN_CARDS ||--o{ KANBAN_CARD_ACTIVITIES : logs
    KANBAN_CARDS ||--o{ KANBAN_CARD_ASSIGNEES : has
    
    KANBAN_BOARDS }o--|| PROJECTS : belongs_to
    KANBAN_BOARDS {
        bigint id PK
        bigint project_id FK UK
        string name
        string description
        boolean is_active
    }
    
    KANBAN_COLUMNS }o--|| KANBAN_BOARDS : belongs_to
    KANBAN_COLUMNS {
        bigint id PK
        bigint board_id FK
        string name
        string color
        int position
        int wip_limit
        boolean is_done_column
    }
    
    KANBAN_CARDS }o--|| KANBAN_COLUMNS : belongs_to
    KANBAN_CARDS }o--|| USERS : created_by
    KANBAN_CARDS {
        bigint id PK
        bigint column_id FK
        bigint created_by FK
        string title
        text description
        string color
        int position
        enum priority
        date due_date
        int estimated_hours
        int actual_hours
        timestamp completed_at
    }
    
    KANBAN_CARD_COMMENTS }o--|| KANBAN_CARDS : belongs_to
    KANBAN_CARD_COMMENTS }o--|| USERS : authored_by
    KANBAN_CARD_COMMENTS {
        bigint id PK
        bigint card_id FK
        bigint user_id FK
        text content
        timestamp created_at
    }
    
    KANBAN_CARD_ACTIVITIES }o--|| KANBAN_CARDS : logs
    KANBAN_CARD_ACTIVITIES }o--|| USERS : by
    KANBAN_CARD_ACTIVITIES {
        bigint id PK
        bigint card_id FK
        bigint user_id FK
        string action
        json old_value
        json new_value
        timestamp created_at
    }
    
    KANBAN_CARD_ASSIGNEES }o--|| KANBAN_CARDS : belongs_to
    KANBAN_CARD_ASSIGNEES }o--|| USERS : assigned_to
    KANBAN_CARD_ASSIGNEES {
        bigint id PK
        bigint card_id FK
        bigint user_id FK
        bigint assigned_by FK
        timestamp assigned_at
    }
    
    KANBAN_LABELS ||--o{ KANBAN_CARD_LABEL : used_by
    KANBAN_LABELS }o--|| KANBAN_BOARDS : belongs_to
    KANBAN_LABELS {
        bigint id PK
        bigint board_id FK
        string name
        string color
    }
    
    KANBAN_CARD_LABEL }o--|| KANBAN_CARDS : references
    KANBAN_CARD_LABEL {
        bigint card_id FK
        bigint label_id FK
    }
    
    PROJECT_KANBAN_ROLES }o--|| PROJECTS : references
    PROJECT_KANBAN_ROLES }o--|| USERS : references
    PROJECT_KANBAN_ROLES {
        bigint id PK
        bigint project_id FK
        bigint user_id FK
        enum role
        bigint assigned_by FK
    }
```

## Messaging Domain - User Communication

The messaging domain manages user-to-user and broadcast messaging.

```mermaid
erDiagram
    MESSAGE_THREADS ||--o{ MESSAGES : contains
    MESSAGE_THREADS ||--o{ MESSAGE_THREAD_PARTICIPANTS : has
    MESSAGES }o--|| USERS : sent_by
    MESSAGES ||--o{ MESSAGE_ATTACHMENTS : has
    
    MESSAGE_THREADS {
        bigint id PK
        string subject
        boolean is_broadcast
        timestamp created_at
    }
    
    MESSAGES }o--|| MESSAGE_THREADS : belongs_to
    MESSAGES {
        bigint id PK
        bigint thread_id FK
        bigint sender_id FK
        text body
        timestamp created_at
    }
    
    MESSAGE_THREAD_PARTICIPANTS }o--|| MESSAGE_THREADS : belongs_to
    MESSAGE_THREAD_PARTICIPANTS }o--|| USERS : references
    MESSAGE_THREAD_PARTICIPANTS {
        bigint id PK
        bigint thread_id FK
        bigint user_id FK
        timestamp last_read_at
        timestamp deleted_at
    }
    
    MESSAGE_ATTACHMENTS }o--|| MESSAGES : belongs_to
    MESSAGE_ATTACHMENTS {
        bigint id PK
        bigint message_id FK
        string filename
        string original_filename
        string mime_type
        int size
        string path
    }
```

## Diagram Symbols Reference

- **||--o{**: One-to-Many relationship (one on the left, many on the right)
- **}o--||**: Many-to-One relationship (many on the left, one on the right)
- **||--||**: One-to-One relationship (exactly one on each side)
- **FK**: Foreign Key
- **PK**: Primary Key
- **UK**: Unique Key constraint

Each diagram can be viewed independently to understand relationships within a specific domain, or together as a comprehensive view of the entire database architecture.
