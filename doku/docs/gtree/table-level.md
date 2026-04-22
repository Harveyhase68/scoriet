---
sidebar_position: 3
title: "Table-Level Data"
---

# Table-Level Data

The **table level** represents individual tables in your database schema. Each table contains metadata, a list of fields, and constraints. Table-level data is stored in `gtree.project.tables`, which is an array of table objects.

## Table Properties Reference

### tablename

**Type**: `string`  
**Description**: The name of the database table.

**Access in Templates**:
```
Table: {:tablename:}
```

**Access in JavaScript**:
```
{:code:}
const table = gtree.project.tables[0];
return `Table name: ${table.tablename}`;
{:codeend:}
```

**Example Values**:
- `"users"`
- `"products"`
- `"orders"`
- `"customer_profiles"`

**Use Case**: Generating table names in SQL statements, class names, file names, migration files.

:::note Table Naming Convention
Table names typically follow database conventions (lowercase, underscore-separated). Use case conversion utilities in your templates to generate appropriate names for different languages (e.g., PascalCase for class names).
:::

---

### tableid

**Type**: `number`  
**Description**: Unique numeric identifier for the table within the project.

**Access in JavaScript**:
```
{:code:}
const table = gtree.project.tables[0];
return `Table ID: ${table.tableid}`;
{:codeend:}
```

**Example Values**: `1`, `2`, `45`, `100`

**Use Case**: Internal references, database lookups, relationship mapping.

:::note
Like `projectid`, template syntax does not provide direct access to `tableid`. Use JavaScript code blocks to access it.
:::

---

### nmaxitems

**Type**: `number`  
**Description**: The count of fields in this table.

**Access in Templates**:
```
Fields in table: {:nmaxitems:}
```

**Access in JavaScript**:
```
{:code:}
const table = gtree.project.tables[0];
return `Field count: ${table.nmaxitems}`;
{:codeend:}
```

**Example Values**: `5`, `12`, `25`, `1`

**Use Case**: Conditional logic based on table complexity, loop iteration, code generation optimization.

:::info Loop Control
The `nmaxitems` property is used as the loop counter in template loops: `{:for nmaxitems:}` iterates over each field in the current table.
:::

---

### fields

**Type**: `array` of field objects  
**Description**: Array of all fields defined in this table.

**Structure**:
```javascript
[
  {
    name: "id",
    type: "BIGINT",
    controltype: "hidden",
    // ... 50+ more properties
  },
  {
    name: "email",
    type: "VARCHAR",
    controltype: "text",
    // ... 50+ more properties
  }
  // ... more fields
]
```

**Access in JavaScript**:
```
{:code:}
const table = gtree.project.tables[0];
for (const field of table.fields) {
  console.log(`${field.name}: ${field.type}`);
}
{:codeend:}
```

**Use Case**: Iterating over fields to generate code, accessing field properties, building relationships.

---

### constraints

**Type**: `array` of constraint objects  
**Description**: Array of all constraints defined on this table (foreign keys, unique constraints, indexes).

**Structure**:
```javascript
[
  {
    type: "primary",
    fields: ["id"]
  },
  {
    type: "foreign",
    fields: ["user_id"],
    referencedTable: "users",
    referencedFields: ["id"]
  }
]
```

**Access in JavaScript**:
```
{:code:}
const table = gtree.project.tables[0];
for (const constraint of table.constraints) {
  console.log(`Constraint: ${constraint.type}`);
}
{:codeend:}
```

**Use Case**: Generating constraint definitions, creating migrations, documenting relationships.

:::tip Deep Dive
For comprehensive information about constraints, see the **[Constraints and Relationships](./constraint-level.md)** section.
:::

---

## Iterating Over Tables

### Using Template Loops

The most common pattern is to loop over all tables in the project using `{:for nmaxfiles:}`:

```
{:for nmaxfiles:}
Table: {:tablename:}
  Fields: {:nmaxitems:}
  ID: {:tableid:}
{:endfor:}
```

Inside this loop, the template has access to:
- `{:tablename:}` — Current table name (updated for each iteration)
- `{:nmaxitems:}` — Field count for current table (updated for each iteration)
- `{:tableid:}` — Table ID (updated for each iteration)

### Using JavaScript to Iterate

For more control, use JavaScript to iterate tables:

```
{:code:}
let output = "";
for (const table of gtree.project.tables) {
  output += `Table: ${table.tablename} (${table.fields.length} fields)\n`;
}
return output;
{:codeend:}
```

Or with array methods:

```
{:code:}
const tableNames = gtree.project.tables
  .map(t => t.tablename)
  .join(", ");
return `Tables: ${tableNames}`;
{:codeend:}
```

---

## Accessing Nested Fields

Once you're inside a table, you can access its fields in several ways:

### Method 1: Nested Template Loops

Outer loop iterates tables, inner loop iterates fields:

```
{:for nmaxfiles:}
Table: {:tablename:}
  {:for nmaxitems:}
  - {:item.name:} ({:item.type:})
  {:endfor:}
{:endfor:}
```

### Method 2: JavaScript Nested Loops

```
{:code:}
let output = "";
for (const table of gtree.project.tables) {
  output += `Table: ${table.tablename}\n`;
  for (const field of table.fields) {
    output += `  - ${field.name} (${field.type})\n`;
  }
}
return output;
{:codeend:}
```

### Method 3: Finding Specific Tables

```
{:code:}
const usersTable = gtree.project.tables.find(t => t.tablename === "users");
if (usersTable) {
  const idField = usersTable.fields.find(f => f.isprimarykey);
  return `Users table primary key: ${idField.name}`;
}
return "Users table not found";
{:codeend:}
```

---

## Practical Examples

### Example 1: Generate Table List

```
{:code:}
let output = "# Database Tables\n\n";
for (const table of gtree.project.tables) {
  output += `## ${table.tablename}\n`;
  output += `- Fields: ${table.nmaxitems}\n`;
  output += `- Fields: `;
  const fieldNames = table.fields.map(f => f.name).join(", ");
  output += fieldNames + "\n\n";
}
return output;
{:codeend:}
```

### Example 2: Generate Laravel Migration

```
{:code:}
const table = gtree.project.tables[0];
const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');

return `
<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('${table.tablename}', function (Blueprint $table) {
            // Fields will be added here
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('${table.tablename}');
    }
};
`;
{:codeend:}
```

### Example 3: Generate TypeScript Interface

```
{:code:}
const table = gtree.project.tables[0];

// Convert table name to PascalCase
const interfaceName = table.tablename
  .split('_')
  .map(part => part.charAt(0).toUpperCase() + part.slice(1))
  .join('');

let output = `export interface I${interfaceName} {\n`;

for (const field of table.fields) {
  const tsType = field.type === "BIGINT" ? "number" : "string";
  const optional = field.isnullable ? "?" : "";
  output += `  ${field.name}${optional}: ${tsType};\n`;
}

output += "}\n";
return output;
{:codeend:}
```

### Example 4: Generate SQL CREATE Statement

```
{:code:}
const table = gtree.project.tables[0];
let sql = `CREATE TABLE ${table.tablename} (\n`;

const fieldDefs = table.fields.map(field => {
  let def = `  ${field.name} ${field.type}`;
  if (!field.isnullable) def += " NOT NULL";
  if (field.isprimarykey) def += " PRIMARY KEY";
  if (field.isunique) def += " UNIQUE";
  return def;
}).join(",\n");

sql += fieldDefs + "\n);\n";
return sql;
{:codeend:}
```

### Example 5: Generate React Component Skeleton

```
{:code:}
const table = gtree.project.tables[0];

// PascalCase component name
const componentName = table.tablename
  .split('_')
  .map(p => p.charAt(0).toUpperCase() + p.slice(1))
  .join('');

return `
import React from 'react';

interface ${componentName}Props {
  // Component props
}

const ${componentName}: React.FC<${componentName}Props> = () => {
  const fields = ${JSON.stringify(table.fields.map(f => f.name))};

  return (
    <div className="${table.tablename}-component">
      <h1>${table.tablename} Management</h1>
      {/* Component content */}
    </div>
  );
};

export default ${componentName};
`;
{:codeend:}
```

### Example 6: Generate Database Statistics

```
{:code:}
const tables = gtree.project.tables;
const totalFields = tables.reduce((sum, t) => sum + t.nmaxitems, 0);
const avgFieldsPerTable = (totalFields / tables.length).toFixed(2);

return `
Database Statistics:
- Total Tables: ${tables.length}
- Total Fields: ${totalFields}
- Average Fields per Table: ${avgFieldsPerTable}

Tables:
${tables.map(t => `- ${t.tablename}: ${t.nmaxitems} fields`).join('\n')}
`;
{:codeend:}
```

---

## Access Patterns Summary

| Access Method | Syntax | Use Case |
|---------------|--------|----------|
| Single table by index | `gtree.project.tables[0]` | Direct access to first table |
| All tables | `gtree.project.tables` | Looping, mapping, filtering |
| Find table | `gtree.project.tables.find(t => t.tablename === "users")` | Conditional access |
| Table field count | `{:nmaxitems:}` (template) or `table.nmaxitems` (JS) | Iteration control |
| Table fields array | `gtree.project.tables[0].fields` | Accessing field data |
| Table constraints | `gtree.project.tables[0].constraints` | Relationship data |

---

## Tips & Best Practices

:::tip Table Ordering
Tables are stored in the order they appear in your database schema. Consider this when using index-based access. For dynamic access, use `find()` with predicates.
:::

:::info Nested Loops Best Practices
When using nested loops (tables within tables, fields within tables):
- Use template syntax for simple, readability-focused generation
- Use JavaScript for complex logic, transformations, or filtering
- Combine both: template for structure, JS for content
:::

:::caution Empty Tables
Some tables might have no fields or constraints. Always check array lengths before iterating, or use optional chaining in JavaScript.
:::

:::tip String Conversion for Naming
Database names often need conversion for use in different contexts:
- **Database table names**: lowercase, underscores (`user_profiles`)
- **Class names**: PascalCase (`UserProfile`)
- **Variable names**: camelCase (`userProfile`)
- **Constants**: UPPER_SNAKE_CASE (`USER_PROFILE`)

Consider creating a utility function in your templates to handle these conversions.
:::

---

## Common Patterns

### Pattern 1: Iterate All Tables and Count Fields

```
Total tables: {:for nmaxfiles:}1{:endfor:}
```

### Pattern 2: Generate Code for Each Table

```
{:code:}
let code = "";
for (const table of gtree.project.tables) {
  code += `// Table: ${table.tablename}\n`;
  code += `export const ${table.tablename}Fields = [\n`;
  code += table.fields
    .map(f => `  '${f.name}'`)
    .join(",\n");
  code += "\n];\n\n";
}
return code;
{:codeend:}
```

### Pattern 3: Filter Tables by Criteria

```
{:code:}
const largeTableCount = gtree.project.tables
  .filter(t => t.nmaxitems > 10)
  .length;
return `Tables with more than 10 fields: ${largeTableCount}`;
{:codeend:}
```

---

## Next Steps

- **[Field-Level Data](./field-level.md)** — Deep dive into all 50+ field properties
- **[Constraints and Relationships](./constraint-level.md)** — Understanding foreign keys and indexes
- **[Practical Examples](./practical-examples.md)** — Full real-world generation examples

