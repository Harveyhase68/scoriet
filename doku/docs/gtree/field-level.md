---
sidebar_position: 4
title: "Field-Level Data"
---

# Field-Level Data

The **field level** is the most detailed layer of Gtree. Each field represents a column in a table and contains 50+ properties that describe its characteristics, behavior, type, constraints, and relationships. This is the richest source of information for intelligent code generation.

Fields are stored in `gtree.project.tables[i].fields`.

## Complete Field Properties Reference

### Basic Properties

#### name

**Type**: `string`  
**Description**: The database column name.

**Example Values**: `"id"`, `"email"`, `"first_name"`, `"created_at"`

**Access**:
```
{:item.name:}
```

```javascript
const field = table.fields[0];
return field.name;
```

**Use Case**: Generating column names in SQL, property names in code models, form field identifiers.

---

#### caption

**Type**: `string`  
**Description**: Human-readable display name for the field.

**Example Values**: `"ID"`, `"Email Address"`, `"First Name"`, `"Created Date"`

**Access**:
```
{:item.caption:}
```

```javascript
return field.caption;
```

**Use Case**: Form labels, table headers, UI display text, documentation.

---

### Type Information

#### type

**Type**: `string`  
**Description**: The database data type of the field.

**Example Values**: `"BIGINT"`, `"VARCHAR"`, `"TEXT"`, `"DATETIME"`, `"BOOLEAN"`, `"DECIMAL"`, `"JSON"`, `"ENUM"`

**Access**:
```
{:item.type:}
```

```javascript
return field.type;
```

**Use Case**: Type declarations in generated code, validation, SQL generation, TypeScript interface generation.

---

#### pascalcase

**Type**: `string`  
**Description**: The field name converted to PascalCase (UpperCamelCase).

**Example Values**: 
- `first_name` → `"FirstName"`
- `email` → `"Email"`
- `user_id` → `"UserId"`

**Access**:
```
{:item.pascalcase:}
```

```javascript
return field.pascalcase;
```

**Use Case**: Class property names, type interface property names, enum names.

:::tip
This property is pre-calculated by Scoriet, so you don't need to convert it in your template. Always use it for consistency.
:::

---

#### camelcase

**Type**: `string`  
**Description**: The field name converted to camelCase (lowerCamelCase).

**Example Values**:
- `first_name` → `"firstName"`
- `email` → `"email"`
- `user_id` → `"userId"`

**Access**:
```
{:item.camelcase:}
```

```javascript
return field.camelcase;
```

**Use Case**: JavaScript variable names, method parameter names, JSON property names, API query parameters.

---

### Constraint Properties

#### isprimarykey

**Type**: `boolean`  
**Description**: Whether this field is the primary key of the table.

**Example Values**: `true`, `false`

**Access**:
```
{:item.isprimarykey:}
```

```javascript
if (field.isprimarykey) {
  // Generate primary key handling
}
```

**Use Case**: Special handling for ID fields, migration definitions, ORM annotations.

---

#### isunique

**Type**: `boolean`  
**Description**: Whether this field has a unique constraint.

**Example Values**: `true`, `false`

**Access**:
```
{:item.isunique:}
```

```javascript
if (field.isunique) {
  // Add unique validation
}
```

**Use Case**: Validation rules, database constraints, duplicate checking.

:::note
Unique constraints can exist on non-primary-key fields (e.g., email addresses, usernames).
:::

---

#### isnullable

**Type**: `boolean`  
**Description**: Whether this field allows NULL values.

**Example Values**: `true`, `false`

**Access**:
```
{:item.isnullable:}
```

```javascript
const required = !field.isnullable;
```

**Use Case**: Form validation (required/optional fields), nullable annotations, database constraints.

---

#### isautoinc

**Type**: `boolean`  
**Description**: Whether this field is auto-incrementing (typically used with BIGINT primary keys).

**Example Values**: `true`, `false`

**Access**:
```
{:item.isautoinc:}
```

```javascript
if (field.isautoinc) {
  // Handle auto-increment in migration
}
```

**Use Case**: Laravel migration generation (`$table->id()`), SQL CREATE TABLE, ORM configuration.

---

### Relationship Properties

#### linktable

**Type**: `string`  
**Description**: The name of the table this field references (for foreign key relationships).

**Example Values**: `"users"`, `"departments"`, `"products"`, `""` (empty if no relationship)

**Access**:
```
{:item.linktable:}
```

```javascript
if (field.linktable) {
  console.log(`References table: ${field.linktable}`);
}
```

**Use Case**: Generating foreign key constraints, relationship definitions, eager loading configuration.

:::note When linktable is Empty
Not all fields have relationships. If a field doesn't reference another table, `linktable` will be an empty string. Always check before using.
:::

---

#### linkfield

**Type**: `string`  
**Description**: The specific field in the linked table that this field references.

**Example Values**: `"id"`, `"user_id"`, `"department_code"`, `""` (empty if no relationship)

**Access**:
```
{:item.linkfield:}
```

```javascript
if (field.linktable && field.linkfield) {
  const ref = `${field.linktable}(${field.linkfield})`;
}
```

**Use Case**: Foreign key constraint definitions, relationship configuration, data integrity rules.

---

#### isforeignkey

**Type**: `boolean`  
**Description**: Whether this field is a foreign key.

**Example Values**: `true`, `false`

**Access**:
```
{:item.isforeignkey:}
```

```javascript
if (field.isforeignkey) {
  // Generate foreign key handling
}
```

**Use Case**: Relationship detection, lazy loading configuration, join clause generation.

---

### UI/Control Properties

#### controltype

**Type**: `string`  
**Description**: The type of UI control to use when displaying this field in forms.

**Example Values**:
- `"text"` — Single-line text input
- `"hidden"` — Hidden field (typically for IDs)
- `"textarea"` — Multi-line text area
- `"password"` — Password input
- `"email"` — Email input
- `"number"` — Numeric input
- `"date"` — Date picker
- `"datetime"` — Date and time picker
- `"checkbox"` — Boolean checkbox
- `"radio"` — Radio button
- `"select"` — Dropdown select
- `"multiselect"` — Multi-select dropdown
- `"richtext"` — Rich text editor
- `"file"` — File upload
- `"color"` — Color picker

**Access**:
```
{:item.controltype:}
```

```javascript
const control = field.controltype;
if (control === "hidden") {
  // Don't generate visible form element
}
```

**Use Case**: Form generation, UI component selection, input validation rules.

---

### Length and Constraints

#### length

**Type**: `number`  
**Description**: Maximum length for VARCHAR fields.

**Example Values**: `255`, `50`, `1000`, `0` (no limit)

**Access**:
```
{:item.length:}
```

```javascript
if (field.type === "VARCHAR" && field.length > 0) {
  return `maxlength="${field.length}"`;
}
```

**Use Case**: HTML input length validation, VARCHAR column definitions, string validation rules.

---

#### decimals

**Type**: `number`  
**Description**: Number of decimal places for DECIMAL fields.

**Example Values**: `2`, `4`, `6`, `0`

**Access**:
```
{:item.decimals:}
```

```javascript
if (field.type === "DECIMAL") {
  return `precision: ${field.decimals}`;
}
```

**Use Case**: Decimal type definitions, monetary value handling, precision specifications.

---

#### unsigned

**Type**: `boolean`  
**Description**: Whether numeric fields are unsigned (non-negative).

**Example Values**: `true`, `false`

**Access**:
```
{:item.unsigned:}
```

```javascript
if (field.unsigned) {
  // Validate non-negative values
}
```

**Use Case**: Numeric validation, database constraint generation, type checking.

---

### Additional Metadata Properties

Scoriet fields contain additional properties for advanced scenarios:

| Property | Type | Description |
|----------|------|-------------|
| `description` | string | Field description/comment |
| `defaultvalue` | string | Default value for the field |
| `collation` | string | Character collation (e.g., `utf8mb4_unicode_ci`) |
| `validation` | string | Custom validation rules |
| `regex` | string | Regex pattern for validation |
| `label` | string | Form label text |
| `placeholder` | string | Form input placeholder |
| `helptext` | string | Form field help text |
| `tooltip` | string | UI tooltip text |
| `cssclass` | string | CSS class for styling |
| `order` | number | Display order in forms |
| `visible` | boolean | Whether field is visible in UI |
| `editable` | boolean | Whether field can be edited |
| `readonly` | boolean | Whether field is read-only |
| `required` | boolean | Whether field is required |
| `indexed` | boolean | Whether field has an index |

---

## Field Access Patterns

### Pattern 1: Direct Access to Single Field

```javascript
const firstField = gtree.project.tables[0].fields[0];
return `Name: ${firstField.name}, Type: ${firstField.type}`;
```

### Pattern 2: Loop Over Fields (Template Syntax)

```
Table: {:tablename:}
{:for nmaxitems:}
- {:item.name:} ({:item.type:}) [{:item.caption:}]
{:endfor:}
```

### Pattern 3: Loop Over Fields (JavaScript)

```javascript
{:code:}
const table = gtree.project.tables[0];
let output = "";
for (const field of table.fields) {
  output += `${field.name}: ${field.type}\n`;
}
return output;
{:codeend:}
```

### Pattern 4: Find Specific Field

```javascript
const emailField = table.fields.find(f => f.name === "email");
if (emailField) {
  return emailField.type;
}
```

### Pattern 5: Filter Fields by Criteria

```javascript
// Get all non-hidden, non-primary-key fields
const editableFields = table.fields.filter(f => 
  f.controltype !== "hidden" && !f.isprimarykey
);
```

---

## Practical Examples

### Example 1: Generate HTML Form

```javascript
{:code:}
const table = gtree.project.tables[0];
let html = `<form method="POST">\n`;

for (const field of table.fields) {
  if (field.controltype === "hidden") continue;
  
  html += `  <div class="form-group">\n`;
  html += `    <label for="${field.name}">${field.caption}</label>\n`;
  
  const required = !field.isnullable ? 'required' : '';
  const maxlength = field.length > 0 ? `maxlength="${field.length}"` : '';
  
  if (field.controltype === "textarea") {
    html += `    <textarea id="${field.name}" name="${field.name}" ${required}></textarea>\n`;
  } else if (field.controltype === "checkbox") {
    html += `    <input type="checkbox" id="${field.name}" name="${field.name}" />\n`;
  } else {
    html += `    <input type="${field.controltype}" id="${field.name}" name="${field.name}" ${required} ${maxlength} />\n`;
  }
  
  html += `  </div>\n`;
}

html += `  <button type="submit">Save</button>\n`;
html += `</form>\n`;

return html;
{:codeend:}
```

### Example 2: Generate TypeScript Interface

```javascript
{:code:}
const table = gtree.project.tables[0];
const interfaceName = table.tablename
  .split('_')
  .map(p => p.charAt(0).toUpperCase() + p.slice(1))
  .join('');

const typeMap = {
  'BIGINT': 'number',
  'INT': 'number',
  'DECIMAL': 'number',
  'VARCHAR': 'string',
  'TEXT': 'string',
  'BOOLEAN': 'boolean',
  'DATETIME': 'Date',
  'DATE': 'Date',
  'JSON': 'Record<string, any>'
};

let output = `export interface I${interfaceName} {\n`;

for (const field of table.fields) {
  const tsType = typeMap[field.type] || 'string';
  const optional = field.isnullable ? '?' : '';
  output += `  ${field.camelcase}${optional}: ${tsType};\n`;
}

output += `}\n`;
return output;
{:codeend:}
```

### Example 3: Generate Laravel Validation Rules

```javascript
{:code:}
const table = gtree.project.tables[0];
let rules = "";

for (const field of table.fields) {
  if (field.controltype === "hidden" || field.isprimarykey) continue;
  
  let fieldRules = [];
  
  if (!field.isnullable) {
    fieldRules.push('required');
  }
  
  if (field.type === "VARCHAR") {
    fieldRules.push(`string|max:${field.length}`);
  } else if (field.type === "INT" || field.type === "BIGINT") {
    fieldRules.push('integer');
  } else if (field.type === "DECIMAL") {
    fieldRules.push('numeric');
  }
  
  if (field.isunique) {
    fieldRules.push('unique');
  }
  
  rules += `'${field.name}' => '${fieldRules.join('|')}',\n`;
}

return rules;
{:codeend:}
```

### Example 4: Generate GraphQL Schema

```javascript
{:code:}
const table = gtree.project.tables[0];
const typeName = table.tablename
  .split('_')
  .map(p => p.charAt(0).toUpperCase() + p.slice(1))
  .join('');

const graphqlTypeMap = {
  'BIGINT': 'Int!',
  'VARCHAR': 'String!',
  'TEXT': 'String!',
  'BOOLEAN': 'Boolean!',
  'DATETIME': 'String!',
  'DECIMAL': 'Float!'
};

let schema = `type ${typeName} {\n`;

for (const field of table.fields) {
  const type = graphqlTypeMap[field.type] || 'String!';
  const actualType = field.isnullable ? type.replace('!', '') : type;
  schema += `  ${field.camelcase}: ${actualType}\n`;
}

schema += `}\n`;
return schema;
{:codeend:}
```

### Example 5: Generate Prisma Schema

```javascript
{:code:}
const table = gtree.project.tables[0];

const prismaTypeMap = {
  'BIGINT': 'BigInt',
  'INT': 'Int',
  'VARCHAR': 'String',
  'TEXT': 'String',
  'BOOLEAN': 'Boolean',
  'DATETIME': 'DateTime',
  'DECIMAL': 'Decimal'
};

let schema = `model ${table.tablename.charAt(0).toUpperCase() + table.tablename.slice(1)} {\n`;

for (const field of table.fields) {
  const prismaType = prismaTypeMap[field.type] || 'String';
  let modifiers = [];
  
  if (field.isprimarykey) modifiers.push('@id');
  if (field.isautoinc) modifiers.push('@default(autoincrement())');
  if (field.isunique) modifiers.push('@unique');
  
  const nullable = field.isnullable ? '?' : '';
  const attributes = modifiers.length > 0 ? ` ${modifiers.join(' ')}` : '';
  
  schema += `  ${field.camelcase} ${prismaType}${nullable}${attributes}\n`;
}

schema += `}\n`;
return schema;
{:codeend:}
```

### Example 6: Generate Database Migration

```javascript
{:code:}
const table = gtree.project.tables[0];

let migration = `Schema::create('${table.tablename}', function (Blueprint $table) {\n`;

for (const field of table.fields) {
  let method = '';
  
  if (field.type === 'BIGINT' && field.isprimarykey) {
    method = `$table->id()`;
  } else if (field.type === 'VARCHAR') {
    method = `$table->string('${field.name}'${field.length ? `, ${field.length}` : ''})`;
  } else if (field.type === 'TEXT') {
    method = `$table->text('${field.name}')`;
  } else if (field.type === 'INT') {
    method = `$table->integer('${field.name}')`;
  } else if (field.type === 'DATETIME') {
    method = `$table->dateTime('${field.name}')`;
  } else if (field.type === 'BOOLEAN') {
    method = `$table->boolean('${field.name}')`;
  }
  
  if (method) {
    if (!field.isnullable) method += `->nullable(false)`;
    if (field.isforeignkey) method += `->references('${field.linkfield}')->on('${field.linktable}')`;
    
    migration += `    ${method};\n`;
  }
}

migration += `});\n`;
return migration;
{:codeend:}
```

---

## Type Mapping Reference

| Database Type | TypeScript | PHP | GraphQL | Prisma |
|---------------|-----------|-----|---------|--------|
| BIGINT | number | int | Int | BigInt |
| INT | number | int | Int | Int |
| VARCHAR | string | string | String | String |
| TEXT | string | string | String | String |
| BOOLEAN | boolean | bool | Boolean | Boolean |
| DATETIME | Date | DateTime | String | DateTime |
| DECIMAL | number | float | Float | Decimal |
| JSON | Record<any,any> | array | JSON | Json |

---

## Tips & Best Practices

:::tip Always Check for Relationships
Before accessing `linktable` or `linkfield`, check if they exist using `field.isforeignkey` or by checking if the values are empty strings.
:::

:::info Use Pre-converted Case Properties
Always use `pascalcase` and `camelcase` properties instead of converting names in your template. This ensures consistency with Scoriet's naming conventions.
:::

:::caution Handle NULL and Empty Values
Not all fields will have values for all properties. Always check for existence and handle empty strings/null values gracefully:

```javascript
const length = field.length > 0 ? field.length : undefined;
const defaultValue = field.defaultvalue || null;
```
:::

:::tip Organize Complex Conditions
For fields with multiple properties, create helper functions:

```javascript
const isEditable = (field) => 
  !field.isprimarykey && field.controltype !== "hidden" && field.editable !== false;

const editableFields = table.fields.filter(isEditable);
```
:::

---

## Next Steps

- **[Constraints and Relationships](./constraint-level.md)** — Understanding complex field relationships
- **[Practical Examples](./practical-examples.md)** — Full real-world generation scenarios
- **[Language Data](./language-data.md)** — Multi-language support in fields

