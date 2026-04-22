---
sidebar_position: 3
title: Schema Explorer
---

# Schema Explorer

The Schema Explorer is your visual window into your database structure. It displays all tables, fields, relationships, and constraints in an easy-to-navigate hierarchical tree view, allowing you to inspect, configure, and use your database schema for code generation.

## Opening the Schema Explorer

The Schema Explorer is typically open by default in Scoriet's left sidebar. If it's not visible:

1. **Look for the database tree icon** in the dock/sidebar
2. **Click it to open** the Schema Explorer panel
3. The tree will show your connected database and all its objects

<div class="screenshot-placeholder">Screenshot: Schema Explorer showing database tree with tables and fields — <code>schema-explorer-main.png</code></div>

## Understanding the Tree Structure

The Schema Explorer organizes your database hierarchically:

```
📁 [Database Name]
  📊 Tables
    ├─ 📋 users
    │  ├─ 🔑 id (Primary Key)
    │  ├─ 📝 name
    │  ├─ 📧 email
    │  └─ 🔗 department_id (Foreign Key)
    ├─ 📋 orders
    │  ├─ 🔑 id
    │  ├─ 🔗 user_id
    │  └─ 💰 total_amount
    └─ 📋 departments
       ├─ 🔑 id
       └─ 📝 name
```

### Icons and Symbols

| Icon | Meaning |
|------|---------|
| 🔑 | Primary Key - uniquely identifies each row |
| 🔗 | Foreign Key - links to another table |
| ⭐ | Unique Constraint - values must be unique |
| 📝 | Text/String Field |
| 🔢 | Numeric Field |
| 📅 | Date/Timestamp Field |
| ✓ | Boolean/Flag Field |
| 📋 | Table Name |

## Navigating Tables

### Expanding and Collapsing

- **Click the arrow** next to a table name to expand and see its fields
- **Double-click** a table name to expand/collapse it
- **Click the arrow** next to a field to see additional properties

### Searching the Tree

Most Schema Explorer implementations include a search box:

1. **Type a table or field name** in the search box
2. **Results highlight** matching items
3. **Press Enter** to navigate to the first result
4. **Use arrow keys** to jump between matches

:::tip
Use search to quickly find tables in large databases with hundreds of tables. For example, searching "user" will find "users", "user_roles", "user_preferences" etc.
:::

## Viewing Field Properties

Click on any field to view or edit its properties:

### Basic Properties
- **Name**: Field name in the database
- **Data Type**: MySQL BIGINT, VARCHAR(255), DATETIME, etc.
- **Nullable**: Whether the field can contain NULL values
- **Default Value**: Auto-increment IDs, current timestamps, etc.

### Extended Properties
- **Control Type**: How this field appears in forms (text input, dropdown, checkbox, date picker, etc.)
- **Caption**: Human-readable label for forms (e.g., "Email Address" for `email_address` field)
- **Validation Rules**: Required, email format, length constraints, etc.
- **Display Format**: How values appear (currency, percentage, date format, etc.)

### Relationship Properties
- **Primary Key**: Uniquely identifies rows in this table
- **Foreign Key**: Links to parent table (e.g., `user_id` links to `users` table)
- **Unique Constraint**: Field value must be unique across all rows
- **Index**: Optimized for fast lookups

<div class="screenshot-placeholder">Screenshot: Field properties panel showing all field details — <code>field-properties-panel.png</code></div>

## Working with Constraints

### Primary Keys

Every table should have a primary key—a field that uniquely identifies each row:

- **Auto-increment**: Usually an `id` field with BIGINT AUTO_INCREMENT
- **Composite**: Multiple fields together form the unique identifier
- **UUID**: Some systems use UUID instead of numeric IDs

The Schema Explorer highlights primary keys with a key icon (🔑).

### Foreign Keys

Foreign keys establish relationships between tables:

```
orders.user_id → users.id
```

This means each order belongs to exactly one user. In the Schema Explorer:

1. **Hover over a foreign key field** to see what table it references
2. **Click the foreign key** to jump to the referenced table
3. **Right-click** to see options like "Show Related Records"

### Unique Constraints

Fields marked with a unique constraint (⭐) must have different values in each row. Common examples:

- `users.email` - each user must have a unique email
- `products.sku` - each product has a unique stock keeping unit

### Indexes

Indexes speed up database queries. The Schema Explorer may show indexed fields with special notation. Scoriet uses index information to generate optimized queries.

## Refreshing the Schema

If you've recently modified your database structure (added tables, changed field names, etc.):

1. **Right-click on the database name** at the top
2. **Select "Refresh Schema"**
3. **Wait for the update** - the tree will reload
4. **New tables/fields appear** in the explorer

:::info
Refreshing fetches the latest schema from your database connection. This doesn't modify anything—it just updates what Scoriet displays.
:::

## Filtering and Display Options

Most Schema Explorers offer filters to reduce clutter:

- **Show/Hide System Tables**: Hide internal database tables
- **Show/Hide Views**: Toggle visibility of database views
- **Filter by Type**: Show only tables, only views, etc.
- **Search by Prefix**: Find tables starting with specific letters

Look for a filter icon (⚙️) or view options menu in the Schema Explorer header.

## Using Schema Information in Code Generation

The schema you see in the Explorer drives your code generation:

### Templates Reference Schema
Your generation templates can reference:
- Table names and structure
- Field names and types
- Relationship information
- Field properties like caption and control type

### Example Template Usage
```
{:for Tables:}
// Generate class for table {:Table.name:}
public class {:Table.name:}Entity {
  {:for Table.Fields:}
  private {:Field.PhpType:} $:{Field.name:};
  {:endfor:}
}
{:endfor:}
```

## Tips and Best Practices

:::tip
**Organize Your Schema**: Use clear, consistent naming conventions (e.g., plural table names, snake_case for fields). This makes the tree easier to navigate and code easier to read.
:::

:::tip
**Set Field Properties**: Take time to configure captions and control types. Your templates will generate much better code with this metadata.
:::

:::tip
**Document Relationships**: Ensure foreign keys are properly defined. Scoriet uses these to generate smart API endpoints and form validations.
:::

## What's Next?

- Learn about [Importing SQL Schemas](./sql-import.md) to load schemas from SQL files
- Explore [Field Properties](./field-properties.md) in detail to understand all configuration options
- Start generating code using your schema with templates and the Form Designer

