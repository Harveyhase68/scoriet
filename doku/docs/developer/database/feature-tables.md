---
sidebar_position: 7
---

# Feature Tables

## Overview

The feature tables manage specialized designer systems within Scoriet: the form designer, report designer, kanban boards, and messaging system. Each feature domain has its own table structure to support complex design and workflow requirements.

---

# Forms Domain

## form_sets

Stores collections of related form window definitions.

### Purpose
- Organize related forms into sets
- Store form styling and color scheme
- Support form cloning and reuse
- Manage form visibility and access

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **name** | string(100) | NO | - | Form set name |
| **description** | text | YES | NULL | Form set description |
| **creator_user_id** | unsignedBigInteger(FK) | NO | - | FK: users.id (CASCADE) - Creator |
| **visibility** | enum | NO | private | Visibility (system, private, team, public) |
| **cloned_from_id** | unsignedBigInteger(FK) | YES | NULL | FK: form_sets.id - Original if cloned |
| **background_color** | string(7) | YES | NULL | Default background color (hex) |
| **window_color** | string(7) | YES | NULL | Default window color (hex) |
| **text_color** | string(7) | YES | NULL | Default text color (hex) |
| **button_color** | string(7) | YES | NULL | Default button color (hex) |
| **is_active** | boolean | NO | true | Form set active status |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Foreign Keys: `creator_user_id`, `cloned_from_id`

### Relationships
- Belongs To → Users (creator)
- Has Many → Form Windows
- Has Many → Project Form Set Associations (through project_form_set)

---

## form_windows

Defines form windows (screens) within form sets.

### Purpose
- Define different form types (create, edit, list, report)
- Store window metadata and sizing
- Manage window layout

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **form_set_id** | unsignedBigInteger(FK) | NO | - | FK: form_sets.id (CASCADE) |
| **name** | string(100) | NO | - | Window internal name |
| **display_name** | string(100) | NO | - | User-visible window name |
| **window_type** | enum | NO | - | Window type (main_menu, create_edit, data_table, report_single, report_list) |
| **min_width** | integer | YES | NULL | Minimum window width |
| **default_width** | integer | YES | NULL | Default window width |
| **default_height** | integer | YES | NULL | Default window height |
| **background_color** | string(7) | YES | NULL | Override background color |
| **window_color** | string(7) | YES | NULL | Override window color |
| **text_color** | string(7) | YES | NULL | Override text color |
| **button_color** | string(7) | YES | NULL | Override button color |
| **is_active** | boolean | NO | true | Window active status |
| **sort_order** | integer | NO | 0 | Display order |
| **paper_config** | json | YES | NULL | Paper settings for reports (size, orientation, margins) |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Unique: `(form_set_id, window_type)` - One per window type
- Foreign Key: `form_set_id`

### Relationships
- Belongs To → Form Sets
- Has Many → Form Elements
- Has Many → Form Item Placements

### Window Types
- **main_menu**: Application main menu/dashboard
- **create_edit**: Create/edit single record form
- **data_table**: List/grid view of records
- **report_single**: Single-record report
- **report_list**: List-style report

---

## form_elements

Defines UI container elements within forms.

### Purpose
- Create form layout structure
- Define containers, tabs, buttons, etc.
- Support hierarchical element composition
- Manage element visibility and positioning

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **form_window_id** | unsignedBigInteger(FK) | NO | - | FK: form_windows.id (CASCADE) |
| **element_type** | enum | NO | - | Element type (container, tab_container, tab_panel, menu_container, buttons, separator, spacer) |
| **x_position** | integer | NO | - | X position on form |
| **y_position** | integer | NO | - | Y position on form |
| **width** | integer | NO | - | Element width |
| **height** | integer | NO | - | Element height |
| **container_orientation** | enum | YES | NULL | Orientation (horizontal, vertical) |
| **gap** | integer | YES | NULL | Gap between child elements |
| **columns** | integer | YES | NULL | Grid columns for container |
| **max_fields** | integer | YES | NULL | Maximum fields in container |
| **button_label** | string(100) | YES | NULL | Button label (for button elements) |
| **button_icon** | string(50) | YES | NULL | Button icon (for button elements) |
| **button_action** | string(100) | YES | NULL | Button action/handler |
| **button_colors** | json | YES | NULL | Button color configuration |
| **tab_label** | string(100) | YES | NULL | Tab label (for tabs) |
| **parent_tab_container_id** | unsignedBigInteger(FK) | YES | NULL | FK: form_elements.id - Parent tab container |
| **custom_style** | json | YES | NULL | Custom CSS styling (JSON) |
| **sort_order** | integer | NO | 0 | Display order |
| **is_visible** | boolean | NO | true | Element visibility |
| **tab_order** | integer | YES | NULL | Tab navigation order |
| **default_control_height** | integer | YES | NULL | Default child control height |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Foreign Keys: `form_window_id`, `parent_tab_container_id`

### Relationships
- Belongs To → Form Windows
- Has Many → Form Item Placements (contains items)
- Has Many → Form Elements (parent for tab containers)

---

## form_item_placements

Maps schema fields to specific form locations.

### Purpose
- Place schema fields on form windows
- Control field visibility and properties per form
- Configure lookups and validations
- Store localized field labels

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **form_window_id** | unsignedBigInteger(FK) | NO | - | FK: form_windows.id (CASCADE) |
| **item_type** | enum | NO | - | Item type (field, button, menu_item, print_field) |
| **container_element_id** | unsignedBigInteger(FK) | NO | - | FK: form_elements.id (CASCADE) - Container |
| **tab_panel_id** | unsignedBigInteger(FK) | YES | NULL | FK: form_elements.id - Tab panel |
| **x_position** | integer | NO | - | X position within container |
| **y_position** | integer | NO | - | Y position within container |
| **width** | integer | NO | - | Field width |
| **height** | integer | NO | - | Field height |
| **sort_order** | integer | NO | 0 | Display order |
| **is_visible** | boolean | NO | true | Field visibility |
| **schema_table_id** | unsignedBigInteger(FK) | YES | NULL | FK: schema_tables.id - Referenced table |
| **field_id** | unsignedBigInteger(FK) | YES | NULL | FK: schema_fields.id - Referenced field |
| **caption_override** | string(255) | YES | NULL | Custom label override |
| **control_type** | string(50) | YES | NULL | UI control type override |
| **lookup_table_id** | unsignedBigInteger(FK) | YES | NULL | FK: schema_tables.id - Lookup table |
| **lookup_value_field** | string(64) | YES | NULL | Lookup value field |
| **lookup_display_field** | string(64) | YES | NULL | Lookup display field |
| **lookup_sort_field** | string(64) | YES | NULL | Lookup sort field |
| **form_element_id** | unsignedBigInteger(FK) | YES | NULL | FK: form_elements.id - Custom element |
| **button_type** | string(50) | YES | NULL | Button type (submit, cancel, custom) |
| **button_label** | string(100) | YES | NULL | Button label |
| **button_icon** | string(50) | YES | NULL | Button icon |
| **button_action** | string(100) | YES | NULL | Button action |
| **button_colors** | json | YES | NULL | Button colors (JSON) |
| **localized_labels** | json | YES | NULL | Labels in multiple languages |
| **label_config** | json | YES | NULL | Label positioning and styling |
| **style_config** | json | YES | NULL | Custom styling (JSON) |
| **menu_item_label** | string(100) | YES | NULL | Menu item label |
| **menu_item_action** | string(100) | YES | NULL | Menu item action |
| **tab_order** | integer | YES | NULL | Tab navigation order |
| **edit_mask** | string(50) | YES | NULL | Input mask (e.g., phone, SSN) |
| **target_language** | string(10) | YES | NULL | Target language override |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Composite: `(form_window_id, item_type)`, `(schema_table_id, field_id)`
- Foreign Keys: `form_window_id`, `container_element_id`, `field_id`, `schema_table_id`

### Relationships
- Belongs To → Form Windows
- Belongs To → Schema Fields
- Belongs To → Schema Tables

---

# Reports Domain

## report_patterns

Stores report design definitions.

### Purpose
- Define report templates and layouts
- Store report metadata
- Support report cloning

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **name** | string(100) | NO | - | Report pattern name |
| **description** | text | YES | NULL | Report description |
| **creator_user_id** | unsignedBigInteger(FK) | NO | - | FK: users.id (CASCADE) - Creator |
| **visibility** | enum | NO | private | Visibility (private, team, public) |
| **cloned_from_id** | unsignedBigInteger(FK) | YES | NULL | FK: report_patterns.id - Original if cloned |
| **is_active** | boolean | NO | true | Report active status |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Foreign Keys: `creator_user_id`, `cloned_from_id`

### Relationships
- Belongs To → Users (creator)
- Has Many → Report Pattern Forms

---

## report_pattern_forms

Defines report form configurations (single vs list).

### Purpose
- Configure different report formats
- Store paper/page settings
- Manage form type specifics

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **report_pattern_id** | unsignedBigInteger(FK) | NO | - | FK: report_patterns.id (CASCADE) |
| **form_type** | enum | NO | - | Report type (report_single, report_list) |
| **paper_size** | string(20) | YES | A4 | Paper size (A4, Letter, Legal, etc.) |
| **orientation** | string(20) | YES | portrait | Orientation (portrait, landscape) |
| **unit** | string(2) | YES | mm | Unit (mm, cm, in) |
| **width** | decimal(10,2) | YES | NULL | Page width |
| **height** | decimal(10,2) | YES | NULL | Page height |
| **margins** | json | YES | NULL | Page margins (top, right, bottom, left) |
| **row_height** | integer | YES | NULL | Row height in list reports |
| **max_columns** | integer | YES | NULL | Maximum columns in report |
| **header_height** | integer | YES | NULL | Header section height |
| **footer_height** | integer | YES | NULL | Footer section height |
| **list_style_config** | json | YES | NULL | List report styling (JSON) |
| **table_header_config** | json | YES | NULL | Table header configuration (JSON) |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Unique: `(report_pattern_id, form_type)` - One per type
- Foreign Key: `report_pattern_id`

### Relationships
- Belongs To → Report Patterns
- Has Many → Report Pattern Elements
- Has Many → Report Layout Elements

---

## report_pattern_elements

Defines report layout sections (header, detail, footer).

### Purpose
- Define report structure
- Create section containers
- Manage section sizing and styling

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **report_pattern_form_id** | unsignedBigInteger(FK) | NO | - | FK: report_pattern_forms.id (CASCADE) |
| **element_type** | enum | NO | - | Section type (container, header_section, detail_section, footer_section) |
| **x_position** | integer | NO | - | X position on page |
| **y_position** | integer | NO | - | Y position on page |
| **width** | integer | NO | - | Section width |
| **height** | integer | NO | - | Section height |
| **container_columns** | integer | YES | NULL | Grid columns |
| **max_fields** | integer | YES | NULL | Maximum fields |
| **label** | string(100) | YES | NULL | Section label |
| **report_controls** | json | YES | NULL | Report controls configuration (JSON) |
| **content_labels** | json | YES | NULL | Content labels (JSON) |
| **sort_order** | integer | NO | 0 | Display order |
| **is_visible** | boolean | NO | true | Section visibility |
| **font_family** | string(50) | YES | NULL | Default font family |
| **font_size** | integer | YES | NULL | Default font size |
| **font_weight** | string(20) | YES | NULL | Font weight (bold, normal) |
| **font_style** | string(20) | YES | NULL | Font style (italic, normal) |
| **text_decoration** | string(50) | YES | NULL | Text decoration |
| **text_align** | string(20) | YES | NULL | Text alignment (left, center, right) |
| **text_color** | string(7) | YES | NULL | Text color (hex) |
| **border_width** | integer | YES | NULL | Border width |
| **border_color** | string(7) | YES | NULL | Border color (hex) |
| **background_color** | string(7) | YES | NULL | Background color (hex) |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Foreign Key: `report_pattern_form_id`

### Relationships
- Belongs To → Report Pattern Forms
- Has Many → Report Layout Elements

---

## report_layout_elements

Defines individual report content elements (fields, text, images).

### Purpose
- Place content in report sections
- Configure field display and formatting
- Store labels and styling

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **report_pattern_form_id** | unsignedBigInteger(FK) | NO | - | FK: report_pattern_forms.id (CASCADE) |
| **container_element_id** | unsignedBigInteger(FK) | YES | NULL | FK: report_pattern_elements.id - Container |
| **element_type** | enum | NO | - | Element type (field, static_text, heading, lines, box, page_number, page_date, page_total, image_placeholder) |
| **schema_table_id** | unsignedBigInteger(FK) | YES | NULL | FK: schema_tables.id - Referenced table |
| **field_id** | unsignedBigInteger(FK) | YES | NULL | FK: schema_fields.id - Referenced field |
| **x_position** | integer | NO | - | X position in container |
| **y_position** | integer | NO | - | Y position in container |
| **width** | integer | NO | - | Element width |
| **height** | integer | NO | - | Element height |
| **content** | text | YES | NULL | Static content (for text elements) |
| **font_family** | string(50) | YES | NULL | Font family |
| **font_size** | integer | YES | NULL | Font size |
| **font_weight** | string(20) | YES | NULL | Font weight |
| **font_style** | string(20) | YES | NULL | Font style |
| **text_decoration** | string(50) | YES | NULL | Text decoration |
| **text_align** | string(20) | YES | NULL | Text alignment |
| **text_color** | string(7) | YES | NULL | Text color (hex) |
| **border_width** | integer | YES | NULL | Border width |
| **border_color** | string(7) | YES | NULL | Border color (hex) |
| **background_color** | string(7) | YES | NULL | Background color (hex) |
| **caption_override** | string(255) | YES | NULL | Label override |
| **caption_labels** | json | YES | NULL | Labels in multiple languages |
| **label** | string(100) | YES | NULL | Field label |
| **label_position** | string(20) | YES | NULL | Label position (top, left, right) |
| **label_offset** | integer | YES | NULL | Label offset from element |
| **sort_order** | integer | NO | 0 | Display order |
| **is_visible** | boolean | NO | true | Element visibility |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Foreign Keys: `report_pattern_form_id`, `field_id`, `schema_table_id`

### Relationships
- Belongs To → Report Pattern Forms
- Belongs To → Schema Fields
- Belongs To → Schema Tables

---

## report_images

Stores images embedded in reports.

### Purpose
- Store report images (logos, watermarks, backgrounds)
- Support multiple languages for images

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **report_pattern_id** | unsignedBigInteger(FK) | NO | - | FK: report_patterns.id (CASCADE) |
| **name** | string(100) | NO | - | Image name/identifier |
| **language** | string(10) | YES | NULL | Language code for localized images |
| **mime_type** | string(100) | NO | - | Image MIME type (image/png, image/jpeg) |
| **filename** | string(255) | NO | - | Stored filename |
| **file_size** | integer | NO | - | File size in bytes |
| **width** | integer | YES | NULL | Image width in pixels |
| **height** | integer | YES | NULL | Image height in pixels |
| **image_data** | binary | NO | - | Binary image data |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Composite: `(report_pattern_id, language)`, `(report_pattern_id, name)`
- Foreign Key: `report_pattern_id`

### Relationships
- Belongs To → Report Patterns

---

# Kanban Domain

## kanban_boards

Stores kanban board definitions per project.

### Purpose
- Define project kanban board
- Store board metadata and settings
- Manage board active status

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **project_id** | unsignedBigInteger(unique FK) | NO | - | FK: projects.id (CASCADE) - One board per project |
| **name** | string(100) | NO | Project Board | Board name |
| **description** | text | YES | NULL | Board description |
| **is_active** | boolean | NO | true | Board active status |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Unique: `project_id` - One board per project
- Foreign Key: `project_id`

### Relationships
- Belongs To → Projects
- Has Many → Kanban Columns
- Has Many → Kanban Labels

---

## kanban_columns

Defines columns/swimlanes on kanban boards.

### Purpose
- Define board workflow stages/columns
- Store column configuration
- Manage WIP limits

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **board_id** | unsignedBigInteger(FK) | NO | - | FK: kanban_boards.id (CASCADE) |
| **name** | string(100) | NO | - | Column name (To Do, In Progress, Done, etc.) |
| **color** | string(7) | NO | #3b82f6 | Column color (hex) |
| **position** | integer | NO | - | Column display order |
| **wip_limit** | integer | YES | NULL | Work in progress limit (optional) |
| **is_done_column** | boolean | NO | false | Whether this marks completion |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Foreign Key: `board_id`
- Composite: `(board_id, position)`

### Relationships
- Belongs To → Kanban Boards
- Has Many → Kanban Cards

---

## kanban_cards

Stores individual kanban cards (tasks/issues).

### Purpose
- Store card/task information
- Track card status and metadata
- Manage card lifecycle

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **column_id** | unsignedBigInteger(FK) | NO | - | FK: kanban_columns.id (CASCADE) |
| **created_by** | unsignedBigInteger(FK) | NO | - | FK: users.id - Card creator |
| **assigned_to** | unsignedBigInteger(FK) | YES | NULL | FK: users.id - Assignee |
| **title** | string(255) | NO | - | Card title |
| **description** | text | YES | NULL | Card description |
| **color** | string(7) | YES | NULL | Card color (hex) |
| **position** | integer | NO | - | Position in column |
| **priority** | enum | NO | medium | Priority (low, medium, high, urgent) |
| **due_date** | date | YES | NULL | Due date |
| **estimated_hours** | decimal(5,1) | YES | NULL | Estimated time |
| **actual_hours** | decimal(5,1) | YES | NULL | Actual time spent |
| **completed_at** | timestamp | YES | NULL | Completion timestamp |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Composite: `(column_id, position)`, `(assigned_to, created_at)`, `(created_by, created_at)`
- Foreign Keys: `column_id`, `created_by`, `assigned_to`

### Relationships
- Belongs To → Kanban Columns
- Belongs To → Users (creator)
- Belongs To → Users (assignee)
- Has Many → Kanban Card Comments
- Has Many → Kanban Card Activities
- Has Many → Kanban Card Assignees
- Has Many → Kanban Card Labels (through kanban_card_label)

---

## kanban_card_activities

Logs all changes to kanban cards.

### Purpose
- Track card activity history
- Monitor status changes
- Provide audit trail

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **card_id** | unsignedBigInteger(FK) | NO | - | FK: kanban_cards.id (CASCADE) |
| **user_id** | unsignedBigInteger(FK) | NO | - | FK: users.id - Who made the change |
| **action** | string(50) | NO | - | Action type (created, moved, assigned, commented, etc.) |
| **old_value** | json | YES | NULL | Previous value (JSON) |
| **new_value** | json | YES | NULL | New value (JSON) |
| **created_at** | timestamp | NO | - | Activity timestamp |

### Indexes
- Primary Key: `id`
- Composite: `(card_id, created_at)`, `(user_id, created_at)`
- Foreign Keys: `card_id`, `user_id`

### Relationships
- Belongs To → Kanban Cards
- Belongs To → Users

---

## kanban_card_assignees

Manages multiple assignees per card.

### Purpose
- Support multiple assignees per card
- Track assignment history
- Record who assigned

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **card_id** | unsignedBigInteger(FK) | NO | - | FK: kanban_cards.id (CASCADE) |
| **user_id** | unsignedBigInteger(FK) | NO | - | FK: users.id - Assigned user |
| **assigned_by** | unsignedBigInteger(FK) | NO | - | FK: users.id - Who assigned |
| **assigned_at** | timestamp | NO | CURRENT | Assignment timestamp |

### Indexes
- Primary Key: `id`
- Unique: `(card_id, user_id)` - One assignment per user per card
- Foreign Keys: `card_id`, `user_id`, `assigned_by`

### Relationships
- Belongs To → Kanban Cards
- Belongs To → Users (assignee)
- Belongs To → Users (assigner)

---

## kanban_card_comments

Stores comments on kanban cards.

### Purpose
- Allow team discussion on cards
- Track comment history

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **card_id** | unsignedBigInteger(FK) | NO | - | FK: kanban_cards.id (CASCADE) |
| **user_id** | unsignedBigInteger(FK) | NO | - | FK: users.id - Comment author |
| **content** | text | NO | - | Comment content |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Composite: `(card_id, created_at)`, `(user_id, created_at)`
- Foreign Keys: `card_id`, `user_id`

### Relationships
- Belongs To → Kanban Cards
- Belongs To → Users

---

## kanban_labels

Defines labels/tags for cards.

### Purpose
- Create reusable card labels
- Categorize cards
- Color-code work items

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **board_id** | unsignedBigInteger(FK) | NO | - | FK: kanban_boards.id (CASCADE) |
| **name** | string(50) | NO | - | Label name (bug, feature, docs, etc.) |
| **color** | string(7) | NO | - | Label color (hex) |
| **created_at** | timestamp | NO | - | Creation timestamp |

### Indexes
- Primary Key: `id`
- Foreign Key: `board_id`

### Relationships
- Belongs To → Kanban Boards
- Has Many → Kanban Card Labels (through kanban_card_label)

---

## kanban_card_label

Associative table for card-label relationships.

### Purpose
- Many-to-many relationship between cards and labels

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **card_id** | unsignedBigInteger(FK) | NO | - | FK: kanban_cards.id (CASCADE) |
| **label_id** | unsignedBigInteger(FK) | NO | - | FK: kanban_labels.id (CASCADE) |

### Indexes
- Composite Primary Key: `(card_id, label_id)`
- Foreign Keys: `card_id`, `label_id`

### Relationships
- Belongs To → Kanban Cards
- Belongs To → Kanban Labels

---

# Messaging Domain

## message_threads

Stores message conversation threads.

### Purpose
- Create message conversations
- Support broadcast messages

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **subject** | string(255) | NO | - | Thread subject |
| **is_broadcast** | boolean | NO | false | Broadcast message flag |
| **created_at** | timestamp | NO | - | Creation timestamp |

### Indexes
- Primary Key: `id`

### Relationships
- Has Many → Messages
- Has Many → Message Thread Participants

---

## messages

Stores individual messages in threads.

### Purpose
- Store message content
- Track message history
- Support threaded conversations

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **thread_id** | unsignedBigInteger(FK) | NO | - | FK: message_threads.id (CASCADE) |
| **sender_id** | unsignedBigInteger(FK) | NO | - | FK: users.id - Message author |
| **body** | text | NO | - | Message content |
| **created_at** | timestamp | NO | - | Creation timestamp |

### Indexes
- Primary Key: `id`
- Composite: `(thread_id, created_at)`, `(sender_id, created_at)`
- Foreign Keys: `thread_id`, `sender_id`

### Relationships
- Belongs To → Message Threads
- Belongs To → Users
- Has Many → Message Attachments

---

## message_thread_participants

Tracks message thread participants and read status.

### Purpose
- Manage thread membership
- Track read/unread status
- Support soft delete of threads for users

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **thread_id** | unsignedBigInteger(FK) | NO | - | FK: message_threads.id (CASCADE) |
| **user_id** | unsignedBigInteger(FK) | NO | - | FK: users.id - Participant |
| **last_read_at** | timestamp | YES | NULL | Last message read timestamp |
| **deleted_at** | timestamp | YES | NULL | When user deleted thread (soft delete) |
| **created_at** | timestamp | NO | - | Creation timestamp |

### Indexes
- Primary Key: `id`
- Unique: `(thread_id, user_id)` - One per participant
- Composite: `(user_id, last_read_at)`, `(thread_id, deleted_at)`
- Foreign Keys: `thread_id`, `user_id`

### Relationships
- Belongs To → Message Threads
- Belongs To → Users

---

## message_attachments

Stores file attachments in messages.

### Purpose
- Support file sharing in messages
- Track attachment metadata

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **message_id** | unsignedBigInteger(FK) | NO | - | FK: messages.id (CASCADE) |
| **filename** | string(255) | NO | - | Stored filename |
| **original_filename** | string(255) | NO | - | Original filename |
| **mime_type** | string(100) | YES | NULL | File MIME type |
| **size** | integer | NO | - | File size in bytes |
| **path** | string(500) | NO | - | Storage path |
| **created_at** | timestamp | NO | - | Creation timestamp |

### Indexes
- Primary Key: `id`
- Foreign Key: `message_id`

### Relationships
- Belongs To → Messages

---

## Related Documentation

- See **Core Tables** for user information
- See **Schema Tables** for field references in forms/reports
- See **Project Tables** for form/report associations
