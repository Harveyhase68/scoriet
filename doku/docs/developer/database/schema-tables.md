---
sidebar_position: 4
---

# Schema Tables

## Overview

The schema tables form the core of Scoriet's database modeling capability. They store database schema definitions, including tables, columns, constraints, and relationships. This comprehensive structure allows Scoriet to parse, import, and generate code based on existing database schemas.

---

## schemas

Stores top-level schema definitions with versioning and visibility controls.

### Purpose
- Store database schema definitions
- Manage schema ownership and visibility
- Track schema versioning
- Support system-provided template schemas

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **name** | string(100) | NO | - | Schema name (e.g., 'Customer Database') |
| **description** | text | YES | NULL | Schema description and purpose |
| **owner_id** | unsignedBigInteger(FK) | NO | - | FK: users.id (CASCADE) - Schema owner |
| **visibility** | enum | NO | private | Visibility level (private, public, deleted) |
| **is_system_schema** | boolean(indexed) | NO | false | System-provided schema flag |
| **last_version** | integer | NO | 0 | Latest version number |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Unique: `(owner_id, name)` - User cannot have duplicate schema names
- Regular: `is_system_schema`
- Composite: `(owner_id, visibility)` - For user schema listing

### Relationships
- Belongs To → Users (owner)
- Has Many → Schema Versions
- Has Many → Schema Tables (through versions)
- Has Many → Schema Designer Layouts
- Has Many → Project Schemas (associations)

### Visibility Levels
- **private**: Only accessible to owner
- **public**: Visible to all users, read-only for non-owners
- **deleted**: Soft-deleted, hidden from normal queries

---

## schema_versions

Stores version history of schemas, allowing rollback and comparison.

### Purpose
- Track schema changes over time
- Allow schema versions to be imported separately
- Store version metadata and naming

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **schema_id** | unsignedBigInteger(FK) | NO | - | FK: schemas.id (CASCADE) |
| **version_number** | integer | NO | - | Sequential version number (1, 2, 3...) |
| **version_name** | string | YES | NULL | User-friendly version name (e.g., 'Initial Import') |
| **description** | text | YES | NULL | Changes in this version |
| **has_unsaved_changes** | boolean | NO | false | Indicates uncommitted changes |
| **imported_at** | timestamp | YES | NULL | When this version was imported |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Foreign Key: `schema_id`
- Composite: `(schema_id, version_number)` - Ensure unique versions per schema

### Relationships
- Belongs To → Schemas
- Has Many → Schema Tables

---

## schema_tables

Stores table definitions within schema versions.

### Purpose
- Define tables within a database schema
- Store table metadata and generation settings
- Link to table fields

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **schema_id** | unsignedBigInteger(FK) | NO | - | FK: schemas.id (CASCADE) |
| **schema_version_id** | unsignedBigInteger(FK) | NO | - | FK: schema_versions.id (CASCADE) |
| **table_name** | string(64) | NO | - | Database table name |
| **primarykeyfield** | string(64) | YES | NULL | Primary key field name |
| **filekeyname** | string(100) | YES | NULL | File-related key field |
| **file_name_renamed** | string(100) | YES | NULL | Renamed file name field |
| **file_name_short** | string(100) | YES | NULL | Short file name field |
| **singular_name** | string(100) | YES | NULL | Singular form of table name |
| **form_set_report_pattern** | string | YES | NULL | Associated form pattern |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Unique: `(schema_version_id, table_name)` - Table names must be unique within a version
- Foreign Keys: `schema_id`, `schema_version_id`

### Relationships
- Belongs To → Schemas
- Belongs To → Schema Versions
- Has Many → Schema Fields
- Has Many → Schema Constraints
- Has One → Primary Key Field (relationship via schema_fields)

### Usage
Tables store references to their primary key and various naming conventions used in code generation, allowing templates to adapt generated code based on table structure.

---

## schema_fields

Stores field/column definitions for tables.

### Purpose
- Define database columns and their properties
- Store field metadata (type, nullable, constraints)
- Map fields to form controls
- Manage field linking and relationships

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **table_id** | unsignedBigInteger(FK) | NO | - | FK: schema_tables.id (CASCADE) |
| **field_name** | string(64) | NO | - | Column name |
| **field_type** | string(100) | NO | - | SQL field type (INT, VARCHAR(255), DATETIME, etc.) |
| **is_unsigned** | boolean | NO | false | Unsigned numeric flag |
| **is_nullable** | boolean | NO | false | NULL allowed flag |
| **default_value** | string | YES | NULL | Default value for field |
| **is_auto_increment** | boolean | NO | false | Auto-increment flag (identity columns) |
| **is_primary_key** | boolean | NO | false | Primary key flag |
| **is_index** | boolean | NO | false | Index flag |
| **is_unique** | boolean | NO | false | Unique constraint flag |
| **control_type** | string(50) | NO | TEXT | Form control type for UI generation (TEXT, TEXTAREA, SELECT, DATE, etc.) |
| **link_table** | string(64) | YES | NULL | Related table name (for foreign keys) |
| **link_field** | string(64) | YES | NULL | Related table field (for foreign keys) |
| **link_display_field** | string(64) | YES | NULL | Display field in related table |
| **link_order_field** | string(64) | YES | NULL | Sort field in related table |
| **link_order_direction** | string(4) | YES | asc | Sort direction (asc/desc) |
| **field_order** | integer | NO | 0 | Column display order |
| **comment** | text | YES | NULL | Column comment/description |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Unique: `(table_id, field_name)` - Field names unique within a table
- Foreign Key: `table_id`

### Relationships
- Belongs To → Schema Tables
- Has Many → Schema Constraint Columns (if used in constraints)
- Has Many → Template Field Assignments

### Field Types
Common field types: `INT`, `BIGINT`, `VARCHAR(255)`, `TEXT`, `LONGTEXT`, `DATETIME`, `TIMESTAMP`, `DATE`, `TIME`, `DECIMAL(10,2)`, `BOOLEAN`, `JSON`, etc.

### Control Types
- `TEXT`: Single-line text input
- `TEXTAREA`: Multi-line text area
- `SELECT`: Dropdown selection
- `MULTISELECT`: Multiple choice selection
- `CHECKBOX`: Boolean checkbox
- `RADIO`: Radio button group
- `DATE`: Date picker
- `TIME`: Time picker
- `DATETIME`: Date and time picker
- `FILE`: File upload
- `CURRENCY`: Currency input
- `PERCENTAGE`: Percentage input
- `EMAIL`: Email validation input
- `URL`: URL validation input

---

## schema_constraints

Stores constraint definitions for tables.

### Purpose
- Define database constraints (PRIMARY KEY, UNIQUE, FOREIGN KEY, INDEX)
- Store constraint metadata
- Support constraint validation

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **table_id** | unsignedBigInteger(FK) | NO | - | FK: schema_tables.id (CASCADE) |
| **constraint_name** | string(64) | NO | - | Constraint name/identifier |
| **constraint_type** | enum | NO | - | Type of constraint (PRIMARY KEY, UNIQUE, KEY, FOREIGN KEY, INDEX) |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Foreign Key: `table_id`
- Composite: `(table_id, constraint_name)`

### Relationships
- Belongs To → Schema Tables
- Has Many → Schema Constraint Columns
- Has Many → Schema Foreign Key References (if FK constraint)

### Constraint Types
- **PRIMARY KEY**: Table's primary key constraint
- **UNIQUE**: Unique value constraint
- **KEY**: Regular index
- **FOREIGN KEY**: Referential integrity constraint
- **INDEX**: Database index

---

## schema_constraint_columns

Maps columns to constraints (many-to-many relationship).

### Purpose
- Associate multiple columns with composite constraints
- Define column order in multi-column constraints

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **constraint_id** | unsignedBigInteger(FK) | NO | - | FK: schema_constraints.id (CASCADE) |
| **field_id** | unsignedBigInteger(FK) | NO | - | FK: schema_fields.id (CASCADE) |
| **column_order** | integer | NO | - | Column order in constraint (1, 2, 3...) |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Unique: `(constraint_id, field_id)` - Each field appears once per constraint
- Foreign Keys: `constraint_id`, `field_id`

### Relationships
- Belongs To → Schema Constraints
- Belongs To → Schema Fields

---

## schema_foreign_key_references

Stores foreign key definition details.

### Purpose
- Define which table a foreign key references
- Store referential action rules (ON DELETE, ON UPDATE)

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **constraint_id** | unsignedBigInteger(unique FK) | NO | - | FK: schema_constraints.id (CASCADE) - Must be FK constraint |
| **referenced_table_id** | unsignedBigInteger(FK) | NO | - | FK: schema_tables.id - Referenced table |
| **on_delete** | enum | YES | NULL | Delete action (CASCADE, SET NULL, RESTRICT, NO ACTION) |
| **on_update** | enum | YES | NULL | Update action (CASCADE, SET NULL, RESTRICT, NO ACTION) |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Unique: `constraint_id` - One reference per FK constraint
- Foreign Keys: `constraint_id`, `referenced_table_id`

### Relationships
- Belongs To → Schema Constraints (one-to-one)
- Belongs To → Schema Tables (referenced table)
- Has Many → Schema Foreign Key Reference Columns

### Referential Actions
- **CASCADE**: Delete/update child rows when parent is deleted/updated
- **SET NULL**: Set to NULL when parent is deleted/updated
- **RESTRICT**: Prevent deletion/update if child rows exist
- **NO ACTION**: Similar to RESTRICT, checked at statement end

---

## schema_foreign_key_reference_columns

Maps foreign key constraint columns to referenced columns.

### Purpose
- Link local FK columns to remote referenced columns
- Support multi-column foreign keys

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **reference_id** | unsignedBigInteger(FK) | NO | - | FK: schema_foreign_key_references.id (CASCADE) |
| **referenced_field_id** | unsignedBigInteger(FK) | NO | - | FK: schema_fields.id - The referenced column |
| **column_order** | integer | NO | - | Column order in foreign key (1, 2, 3...) |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Foreign Keys: `reference_id`, `referenced_field_id`

### Relationships
- Belongs To → Schema Foreign Key References
- Belongs To → Schema Fields (referenced column)

---

## schema_designer_layouts

Stores designer layout data for schema diagram visualization.

### Purpose
- Save diagram layout positions and configurations
- Support multiple layout versions
- Persist user customizations

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **schema_id** | unsignedBigInteger(FK) | NO | - | FK: schemas.id (CASCADE) |
| **version_number** | integer | NO | - | Layout version matching schema version |
| **layout_data** | json | NO | - | Diagram layout positions and settings (JSON) |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Unique: `(schema_id, version_number)`
- Foreign Key: `schema_id`

### Relationships
- Belongs To → Schemas

### Layout Data Structure
The `layout_data` JSON contains:
- Table positions (x, y coordinates)
- Table sizes and styling
- Connector/relationship visualization settings
- Zoom level and viewport settings

---

## schema_translations

Stores translated text for schema elements.

### Purpose
- Support multi-language schema documentation
- Store translations of table and field names/descriptions

### Fields

| Field | Type | Null | Default | Description |
|-------|------|------|---------|-------------|
| **id** | bigIncrements | NO | Auto | Primary key |
| **item_name** | string | NO | - | Item identifier (schema/table/field name) |
| **code** | string(5) | NO | - | Language code (en, de, fr, etc.) |
| **translated_text** | text | NO | - | Translated content |
| **description** | text | YES | NULL | Translation context/notes |
| **is_active** | boolean | NO | true | Translation active status |
| **created_by** | unsignedBigInteger(FK) | YES | NULL | FK: users.id - Translator |
| **created_at** | timestamp | NO | - | Creation timestamp |
| **updated_at** | timestamp | NO | - | Last update timestamp |

### Indexes
- Primary Key: `id`
- Composite: `(item_name, code)` - One translation per item/language
- Foreign Key: `created_by`

### Relationships
- Belongs To → Users (translator)

---

## Key Concepts

### Schema Versioning
- Each schema can have multiple versions
- Each version contains complete table and field definitions
- Users can compare or rollback to previous versions
- New versions are created on each import or manual change

### Constraint Hierarchy
```
Constraints (PRIMARY KEY, UNIQUE, FOREIGN KEY, INDEX)
    ↓
Constraint Columns (which fields are in the constraint)
    ↓
(If FOREIGN KEY) Foreign Key References (what table/action)
    ↓
(If FOREIGN KEY) FK Reference Columns (column mappings)
```

### Field Linking
Fields can reference other tables for code generation:
- `link_table`: The related table name
- `link_field`: The field in the current table that stores the FK
- `link_display_field`: What to display in dropdowns (e.g., `customer_name`)
- `link_order_field`: How to sort the dropdown options

### Multi-Column Keys
Constraints and foreign keys support multiple columns through the `column_order` field:
- Order 1, 2, 3... defines the column sequence
- Critical for composite keys and multi-column foreign keys

---

## Data Integrity Notes

1. **Cascading Deletes**: Deleting a schema cascades to all versions, tables, fields, and constraints.

2. **Version Immutability**: Once a version is created, tables/fields should not be modified; create a new version instead.

3. **Constraint Order**: `column_order` in constraint columns must start at 1 and be sequential.

4. **Foreign Key Consistency**: Referenced tables must exist in the same schema version.

5. **Field Types**: Field types are stored as strings to support various database systems (MySQL, PostgreSQL, etc.).

---

## Related Documentation

- See **Core Tables** for user and project ownership
- See **Template Schema Dependencies** for template requirements
- See **Form Tables** for field-to-form-control mapping
- See **Entity Relationship Diagrams** for visual schema relationships
