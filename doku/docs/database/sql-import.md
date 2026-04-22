---
sidebar_position: 4
title: Importing SQL Schemas
---

# Importing SQL Schemas

The SQL Import feature allows you to quickly load database schema definitions into Scoriet by pasting SQL CREATE statements or uploading `.sql` files. This is one of the fastest ways to get your database structure into Scoriet for code generation.

## Why Import SQL?

There are many scenarios where SQL import is useful:

- **Existing Projects**: You have SQL CREATE statements from a production database
- **Version Control**: SQL schemas are stored in your Git repository
- **Database Migrations**: You have migration files with CREATE TABLE statements
- **Database Dumps**: You've exported schemas from phpMyAdmin, MySQL Workbench, or other tools
- **Quick Setup**: Faster than manually creating tables in the Schema Explorer

:::info
SQL Import parses the schema structure without actually executing the SQL on your database. Scoriet safely analyzes the CREATE statements to understand your schema.
:::

## Opening SQL Import

To access the SQL Import feature:

1. **Open the Database panel** in Scoriet
2. **Click "Import SQL"** or the import icon
3. **Choose your input method** (paste text or upload file)
4. **Follow the wizard** to complete import

<div class="screenshot-placeholder">Screenshot: SQL Import dialog with text area and file upload options — <code>sql-import-dialog.png</code></div>

## Method 1: Pasting SQL Statements

This is the most flexible approach:

### Steps

1. **Open SQL Import** dialog
2. **Select "Paste SQL Statements"** tab
3. **Copy your SQL** from your source (MySQL Workbench, DBeaver, etc.)
4. **Paste into the text area**
5. **Click "Preview"** to see what will be imported
6. **Click "Import"** to add to your schema

### Example SQL

```sql
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE posts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content LONGTEXT,
  published_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE comments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  post_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_post (post_id),
  INDEX idx_user (user_id)
);
```

:::tip
You can paste multiple CREATE TABLE statements at once. Scoriet will parse all of them in a single import operation.
:::

## Method 2: Uploading SQL Files

For larger schemas or organized imports:

### Steps

1. **Open SQL Import** dialog
2. **Select "Upload .sql File"** tab
3. **Click "Choose File"** or drag-and-drop a `.sql` file
4. **Review the preview**
5. **Click "Import"**

### Supported File Formats

- **`.sql`** - Standard SQL files (most common)
- **`.sql.gz`** - Compressed SQL files (automatically decompressed)
- **SQL Dumps** - From `mysqldump`, `pg_dump`, etc.

:::info
File uploads are limited to 10MB. For larger schemas, consider breaking them into multiple files or using direct database connections.
:::

## What Gets Parsed?

Scoriet's SQL parser recognizes and imports:

### Tables
- **CREATE TABLE** statements
- Table names and structure
- Auto-increment specifications

### Fields
- **Column names** and data types
- **Constraints**: NOT NULL, UNIQUE, DEFAULT values
- **Data Types**: INT, VARCHAR, TEXT, DATETIME, BOOLEAN, JSON, ENUM, etc.
- **Collations**: UTF-8, specific character sets

### Keys and Constraints
- **Primary Keys**: Single and composite
- **Foreign Keys**: References between tables
- **Unique Constraints**: Single and multi-column
- **Check Constraints**: Data validation rules
- **Default Values**: Constants and functions

### Indexes
- **Single-column indexes**
- **Composite indexes** (multiple columns)
- **Full-text indexes**
- **Index hints** for optimization

### Relationships
- **ON DELETE behavior**: CASCADE, SET NULL, RESTRICT, NO ACTION
- **ON UPDATE behavior**: Same options
- **Cross-database references**: If supported by your database

### Advanced Features
- **Triggers** (parsed but not executed)
- **Views** (structural information extracted)
- **Stored Procedures** (metadata captured)
- **Comments** (preserved in schema documentation)

### NOT Parsed (and why)

The following are intentionally not imported as they're not needed for code generation:

- **GRANT/REVOKE statements** (user permissions)
- **INSERT/UPDATE/DELETE statements** (data, not schema)
- **CREATE DATABASE** (focus is single database schema)
- **Database-specific syntax** that doesn't affect generation

## Import Preview and Review

Before importing, always review the preview:

1. **The preview shows** what tables and fields will be created
2. **Check for issues**: Are all tables recognized? Are relationships correct?
3. **Review column count**: Each table should show the correct number of fields
4. **Verify data types**: Complex types should be recognized

<div class="screenshot-placeholder">Screenshot: SQL Import preview showing parsed tables and fields — <code>import-preview.png</code></div>

### Common Preview Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Fields not recognized | Complex syntax not understood | Simplify SQL; use standard syntax |
| Foreign keys missing | Incomplete relationship definitions | Ensure FOREIGN KEY clause is complete |
| Wrong data types | Database-specific syntax | Use standard SQL types (INT, VARCHAR, etc.) |
| Comments not imported | Intentional by design | Comments are documentation, not schema |

## Handling Import Conflicts

If you're importing and tables already exist:

1. **Skip Existing**: Don't overwrite tables that already exist in your schema
2. **Merge**: Add new fields to existing tables
3. **Replace**: Overwrite existing tables completely
4. **Map Manually**: Choose field-by-field what to import

Choose your conflict resolution strategy before importing large schemas.

:::caution
If you choose "Replace", existing field properties (like control types and captions) will be lost. Back up your schema first if it has important customizations.
:::

## Exporting Your Schema

After importing (or creating), you can export your schema back to SQL:

1. **Right-click your schema** in the Schema Explorer
2. **Select "Export as SQL"**
3. **Choose format**: CREATE TABLE statements, full dump, etc.
4. **Save the .sql file**

This is useful for:
- Version control integration
- Sharing with team members
- Backup and archival
- Creating new databases from your schema

## SQL Syntax Compatibility

Scoriet's SQL parser supports:

### MySQL
```sql
CREATE TABLE `users` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE KEY,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### PostgreSQL
```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### SQLite
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### MS-SQL Server
```sql
CREATE TABLE users (
  id BIGINT IDENTITY(1,1) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at DATETIME DEFAULT GETDATE()
);
```

## Tips for Successful Imports

:::tip
**Clean Your SQL**: Remove comments, database-specific syntax, and unnecessary statements before importing for best results.
:::

:::tip
**Import in Order**: If you have circular foreign key relationships, import tables in dependency order (parent tables first).
:::

:::tip
**Use Consistent Naming**: Table and field names should follow consistent conventions (snake_case, CamelCase, etc.) for better template generation.
:::

:::tip
**Set Properties After Import**: After importing your schema, add field properties like captions and control types for better code generation.
:::

## What's Next?

- Learn about [Field Properties](./field-properties.md) to customize how fields are used in code generation
- Use your imported schema with [Form Designer](../features/form-designer.md) to create interfaces
- Set up templates to generate code based on your schema

