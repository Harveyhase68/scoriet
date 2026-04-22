---
sidebar_position: 5
title: "Constraints and Relationships"
---

# Constraints and Relationships

Constraints define the rules, relationships, and structural integrity of your database. Each table in Gtree contains a `constraints` array that describes primary keys, foreign keys, unique constraints, and indexes. Understanding constraints is crucial for generating proper database migrations, ORM configurations, and relationship handling.

Constraints are stored in `gtree.project.tables[i].constraints`.

## What Are Constraints?

Constraints are database-level rules that:
- **Ensure data integrity**: Primary keys, unique constraints prevent invalid data
- **Define relationships**: Foreign keys link tables together
- **Optimize performance**: Indexes speed up queries
- **Maintain referential integrity**: Cascade rules handle related data

## Constraint Types

### Primary Key Constraints

**Type**: `"primary"`  
**Description**: Uniquely identifies each record in the table.

**Structure**:
```javascript
{
  type: "primary",
  fields: ["id"]
}
```

**Characteristics**:
- Every table should have exactly one primary key
- Primary key fields are NOT NULL and UNIQUE by default
- Often named `id` and auto-incrementing
- Multiple fields can form a composite primary key

**Access**:
```javascript
{:code:}
const table = gtree.project.tables[0];
const pkConstraint = table.constraints.find(c => c.type === "primary");
if (pkConstraint) {
  return `Primary key: ${pkConstraint.fields.join(", ")}`;
}
{:codeend:}
```

**Example Use Cases**:
- Generating `@Id` annotations (Laravel, Java)
- Setting up ORM primary key configuration
- Creating migration `$table->id()` statements

---

### Foreign Key Constraints

**Type**: `"foreign"`  
**Description**: Links a field in this table to a primary key in another table.

**Structure**:
```javascript
{
  type: "foreign",
  fields: ["user_id"],
  referencedTable: "users",
  referencedFields: ["id"],
  onDelete: "CASCADE",  // or "RESTRICT", "SET NULL"
  onUpdate: "CASCADE"   // or "RESTRICT", "SET NULL"
}
```

**Characteristics**:
- Define relationships between tables (one-to-many, many-to-one)
- Maintain referential integrity
- Support cascade actions (delete related records, etc.)
- Usually named with pattern `{field}_references_{referencedTable}_{referencedFields}`

**Access**:
```javascript
{:code:}
const table = gtree.project.tables[0];
for (const constraint of table.constraints) {
  if (constraint.type === "foreign") {
    console.log(`${constraint.fields[0]} → ${constraint.referencedTable}(${constraint.referencedFields[0]})`);
  }
}
{:codeend:}
```

**Example Use Cases**:
- Generating Eloquent relationships (hasMany, belongsTo)
- Creating ORM foreign key mappings
- Building REST API endpoint relationships
- Generating cascade delete logic

:::tip Relationship Naming
Scoriet automatically detects foreign key relationships. For each foreign key field, the `field.linktable` and `field.linkfield` properties are populated. You can access relationship data directly from the field instead of parsing constraints.
:::

---

### Unique Constraints

**Type**: `"unique"`  
**Description**: Ensures all values in the field(s) are unique.

**Structure**:
```javascript
{
  type: "unique",
  fields: ["email"],
  name: "unique_email"
}
```

**Characteristics**:
- Can be applied to single or multiple fields (composite unique)
- Different from primary key: allows NULL values, multiple fields
- Prevents duplicate entries (e.g., email addresses, usernames)

**Access**:
```javascript
{:code:}
const table = gtree.project.tables[0];
const uniqueConstraints = table.constraints.filter(c => c.type === "unique");
for (const uc of uniqueConstraints) {
  console.log(`Unique: ${uc.fields.join(", ")}`);
}
{:codeend:}
```

**Example Use Cases**:
- Form validation (check uniqueness before save)
- Database constraint generation in migrations
- Adding unique index to ORM models

---

### Index Constraints

**Type**: `"index"`  
**Description**: Creates an index for fast lookup on field(s).

**Structure**:
```javascript
{
  type: "index",
  fields: ["email"],
  name: "idx_email",
  unique: false  // true for unique indexes
}
```

**Characteristics**:
- Speed up queries filtering on those fields
- Can be single-field or composite (multi-field)
- More flexible than unique constraints
- Used for performance optimization

**Access**:
```javascript
{:code:}
const table = gtree.project.tables[0];
const indexes = table.constraints.filter(c => c.type === "index");
for (const idx of indexes) {
  console.log(`Index on ${idx.fields.join(", ")}`);
}
{:codeend:}
```

**Example Use Cases**:
- Generating migration index statements: `$table->index(['email'])`
- Performance tuning documentation
- Database optimization scripts

---

## Accessing Constraint Data

### Method 1: Filter by Constraint Type

```javascript
const foreignKeys = table.constraints.filter(c => c.type === "foreign");
const uniqueConstraints = table.constraints.filter(c => c.type === "unique");
const indexes = table.constraints.filter(c => c.type === "index");
```

### Method 2: Find Specific Constraint

```javascript
const emailUnique = table.constraints.find(c => 
  c.type === "unique" && c.fields.includes("email")
);
```

### Method 3: Check Field Relationships

Instead of parsing constraints, use field properties:

```javascript
const userIdField = table.fields.find(f => f.name === "user_id");
if (userIdField.isforeignkey) {
  console.log(`References ${userIdField.linktable}(${userIdField.linkfield})`);
}
```

---

## Practical Examples

### Example 1: Generate Laravel Migration with All Constraints

```javascript
{:code:}
const table = gtree.project.tables[0];

let migration = `Schema::create('${table.tablename}', function (Blueprint $table) {\n`;

// Add fields
for (const field of table.fields) {
  if (field.type === 'BIGINT' && field.isprimarykey) {
    migration += `    $table->id('${field.name}');\n`;
  } else if (field.type === 'VARCHAR') {
    migration += `    $table->string('${field.name}'${field.length ? `, ${field.length}` : ''})`;
  } else if (field.type === 'INT') {
    migration += `    $table->integer('${field.name}')`;
  } else if (field.type === 'DATETIME') {
    migration += `    $table->dateTime('${field.name}')`;
  } else if (field.type === 'BOOLEAN') {
    migration += `    $table->boolean('${field.name}')`;
  } else {
    continue;
  }
  
  if (!field.isnullable) migration += `->nullable(false)`;
  migration += `;\n`;
}

// Add constraints
for (const constraint of table.constraints) {
  if (constraint.type === "foreign") {
    migration += `    $table->foreign('${constraint.fields[0]}')`;
    migration += `\n        ->references('${constraint.referencedFields[0]}')`;
    migration += `\n        ->on('${constraint.referencedTable}')`;
    if (constraint.onDelete) migration += `\n        ->onDelete('${constraint.onDelete.toLowerCase()}')`;
    migration += `;\n`;
  } else if (constraint.type === "unique") {
    migration += `    $table->unique([${constraint.fields.map(f => `'${f}'`).join(', ')}]);\n`;
  } else if (constraint.type === "index") {
    migration += `    $table->index([${constraint.fields.map(f => `'${f}'`).join(', ')}]);\n`;
  }
}

migration += `});\n`;
return migration;
{:codeend:}
```

### Example 2: Generate Eloquent Relationships

```javascript
{:code:}
const table = gtree.project.tables[0];
let relationships = "";

for (const field of table.fields) {
  if (field.isforeignkey) {
    // Convert field name to relationship method
    const relationName = field.name.replace(/_id$/, '').replace(/_/g, ' ')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join('')
      .charAt(0).toLowerCase() + 
      field.name.replace(/_id$/, '').replace(/_/g, ' ')
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join('')
      .slice(1);
    
    const relatedModel = field.linktable.split('_')
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join('');

    relationships += `
    public function ${relationName}()
    {
        return $this->belongsTo(${relatedModel}::class, '${field.name}', '${field.linkfield}');
    }
    `;
  }
}

return relationships;
{:codeend:}
```

### Example 3: Generate TypeScript Type with Relationship Information

```javascript
{:code:}
const table = gtree.project.tables[0];

let typedef = `export interface I${table.tablename.charAt(0).toUpperCase() + table.tablename.slice(1)} {\n`;

for (const field of table.fields) {
  const typeMap = {
    'BIGINT': 'number',
    'INT': 'number',
    'VARCHAR': 'string',
    'BOOLEAN': 'boolean',
    'DATETIME': 'string',
    'DECIMAL': 'number'
  };
  
  const type = typeMap[field.type] || 'string';
  const optional = field.isnullable ? '?' : '';
  
  typedef += `  ${field.camelcase}${optional}: ${type};\n`;
}

// Add relationship interfaces
for (const constraint of table.constraints) {
  if (constraint.type === "foreign") {
    const relTableName = constraint.referencedTable.charAt(0).toUpperCase() + constraint.referencedTable.slice(1);
    typedef += `  ${constraint.referencedTable}?: I${relTableName};\n`;
  }
}

typedef += `}\n`;
return typedef;
{:codeend:}
```

### Example 4: Generate Database Constraint Report

```javascript
{:code:}
const table = gtree.project.tables[0];

let report = `## Table: ${table.tablename}\n\n`;

// Primary Keys
const pk = table.constraints.find(c => c.type === "primary");
if (pk) {
  report += `### Primary Key\n- Fields: ${pk.fields.join(", ")}\n\n`;
}

// Foreign Keys
const fks = table.constraints.filter(c => c.type === "foreign");
if (fks.length > 0) {
  report += `### Foreign Keys\n`;
  for (const fk of fks) {
    report += `- ${fk.fields[0]} → ${fk.referencedTable}(${fk.referencedFields[0]})\n`;
    if (fk.onDelete) report += `  - On Delete: ${fk.onDelete}\n`;
  }
  report += `\n`;
}

// Unique Constraints
const uniqs = table.constraints.filter(c => c.type === "unique");
if (uniqs.length > 0) {
  report += `### Unique Constraints\n`;
  for (const u of uniqs) {
    report += `- ${u.fields.join(", ")}\n`;
  }
  report += `\n`;
}

// Indexes
const idxs = table.constraints.filter(c => c.type === "index");
if (idxs.length > 0) {
  report += `### Indexes\n`;
  for (const idx of idxs) {
    report += `- ${idx.name}: ${idx.fields.join(", ")}\n`;
  }
  report += `\n`;
}

return report;
{:codeend:}
```

### Example 5: Generate Prisma Schema with Relationships

```javascript
{:code:}
const table = gtree.project.tables[0];
const modelName = table.tablename.split('_')
  .map(p => p.charAt(0).toUpperCase() + p.slice(1))
  .join('');

let schema = `model ${modelName} {\n`;

// Fields
for (const field of table.fields) {
  const typeMap = {
    'BIGINT': 'BigInt',
    'INT': 'Int',
    'VARCHAR': 'String',
    'TEXT': 'String',
    'BOOLEAN': 'Boolean',
    'DATETIME': 'DateTime'
  };
  
  const type = typeMap[field.type] || 'String';
  const nullable = field.isnullable ? '?' : '';
  
  let modifiers = [];
  if (field.isprimarykey) modifiers.push('@id');
  if (field.isautoinc) modifiers.push('@default(autoincrement())');
  
  const mods = modifiers.length > 0 ? ` ${modifiers.join(' ')}` : '';
  
  schema += `  ${field.camelcase} ${type}${nullable}${mods}\n`;
}

// Relationships from foreign keys
for (const constraint of table.constraints) {
  if (constraint.type === "foreign") {
    const relatedModel = constraint.referencedTable.split('_')
      .map(p => p.charAt(0).toUpperCase() + p.slice(1))
      .join('');
    
    const relationName = constraint.referencedTable;
    schema += `  ${relationName} ${relatedModel} @relation(fields: [${constraint.fields[0]}], references: [${constraint.referencedFields[0]}])\n`;
  }
}

schema += `}\n`;
return schema;
{:codeend:}
```

---

## Constraint Property Reference

| Property | Type | Description |
|----------|------|-------------|
| `type` | string | Type of constraint: "primary", "foreign", "unique", "index" |
| `fields` | string[] | Field names involved in the constraint |
| `name` | string | Name of the constraint (e.g., "idx_email") |
| `referencedTable` | string | Target table (foreign keys only) |
| `referencedFields` | string[] | Target fields (foreign keys only) |
| `onDelete` | string | Cascade action: "CASCADE", "RESTRICT", "SET NULL", "NO ACTION" |
| `onUpdate` | string | Update action: "CASCADE", "RESTRICT", "SET NULL", "NO ACTION" |
| `unique` | boolean | Whether index is unique (indexes only) |

---

## Cascade Actions Explained

When a foreign key has cascade actions, it defines what happens to related records:

| Action | Behavior |
|--------|----------|
| `CASCADE` | Delete/update related records automatically |
| `RESTRICT` | Prevent deletion/update if related records exist |
| `SET NULL` | Set related field to NULL (only if nullable) |
| `NO ACTION` | Similar to RESTRICT, checked at transaction end |

---

## Working with Relationships

### Detect All Relationships

```javascript
{:code:}
const table = gtree.project.tables[0];

// Method 1: Through fields
const relatedFields = table.fields.filter(f => f.isforeignkey);

// Method 2: Through constraints
const fkConstraints = table.constraints.filter(c => c.type === "foreign");

// Both methods give relationship information
for (const field of relatedFields) {
  console.log(`${field.name} references ${field.linktable}(${field.linkfield})`);
}
{:codeend:}
```

### Build Relationship Graph

```javascript
{:code:}
const allTables = gtree.project.tables;
const relationships = [];

for (const table of allTables) {
  for (const field of table.fields) {
    if (field.isforeignkey) {
      relationships.push({
        from: table.tablename,
        field: field.name,
        to: field.linktable,
        targetField: field.linkfield
      });
    }
  }
}

return JSON.stringify(relationships, null, 2);
{:codeend:}
```

---

## Tips & Best Practices

:::tip Field vs. Constraint Access
For foreign key information, prefer accessing field properties (`field.linktable`, `field.linkfield`) over parsing constraints. It's more direct and cleaner code.
:::

:::info Cascade Behavior Matters
When generating migrations or ORM code, always consider cascade actions. `CASCADE` can be dangerous (deleting a user deletes all their orders), while `RESTRICT` prevents accidental orphaned records.
:::

:::caution Composite Keys
Some constraints involve multiple fields (composite primary key, composite unique constraint). Always iterate over all fields in the constraint:

```javascript
for (const field of constraint.fields) {
  // Handle each field
}
```
:::

:::tip Performance Optimization
Indexes dramatically affect query performance. When generating migration files or performance documentation, highlight indexed fields:

```javascript
const indexedFields = table.constraints
  .filter(c => c.type === "index")
  .flatMap(c => c.fields);
```
:::

---

## Next Steps

- **[Language Data](./language-data.md)** — Multi-language support
- **[Practical Examples](./practical-examples.md)** — Full end-to-end code generation
- **[Field-Level Data](./field-level.md)** — Detailed field properties reference

