---
sidebar_position: 6
title: JavaScript Code Blocks
---

# JavaScript Code Blocks

JavaScript code blocks unlock unlimited generation possibilities. When loops, conditionals, and built-in functions aren't enough, you can write custom JavaScript that has full access to your database schema and can generate any output you need.

## Overview

A JavaScript code block is a section of your template that contains actual JavaScript code instead of template syntax. The code executes during generation and returns a string that becomes part of your output.

```
{:code:}
  // Your JavaScript code here
  // Build and return a string
{:codeend:}
```

The returned string is inserted into the output exactly where the code block appears.

## Code Block Basics

### Syntax

```
{:code:}
var result = "";
// Build result with JavaScript
result += "Some generated text";
return result;
{:codeend:}
```

**Key points:**
- Code blocks start with `{:code:}` and end with `{:codeend:}`
- Write valid JavaScript code inside
- Must explicitly `return` a string
- The returned string becomes output
- Whitespace is preserved (be careful with newlines)

### Execution Context

When your code block runs:
- You have access to a global object called `gtree` (the database schema)
- You have access to a global variable called `loop` (current loop context)
- All standard JavaScript is available (loops, conditionals, string manipulation)
- External functions and modules are NOT available (security)

### Simple Example

```
{:code:}
var result = "Hello, " + gtree.projectname + "!";
return result;
{:codeend:}
```

**Output:**
```
Hello, MyEcommerceApp!
```

## The gtree Object

The `gtree` object contains your entire database schema. Access it to read table and field information.

### gtree Structure

```javascript
gtree = {
  projectname: "MyEcommerceApp",
  projectid: "proj_abc123",
  projectdatabase: "ecommerce_prod",
  defaultlanguage: "PHP",
  
  tables: [
    {
      name: "users",
      caption: "Users",
      fields: [
        {
          name: "id",
          type: "bigint",
          isprimarykey: true,
          isnullable: false,
          length: 11,
          // ... more properties
        },
        {
          name: "username",
          type: "varchar",
          isprimarykey: false,
          isnullable: false,
          length: 255,
          // ... more properties
        }
        // ... more fields
      ],
      keys: [ { name: "id", ... } ],
      foreign: [ { ... } ],
      constraints: [ { ... } ]
    },
    // ... more tables
  ]
}
```

### Key gtree Properties

| Property | Type | Description |
|----------|------|-------------|
| `gtree.projectname` | string | Project name |
| `gtree.projectdatabase` | string | Connected database |
| `gtree.tables` | array | Array of table objects |
| `gtree.tables[i].name` | string | Table name |
| `gtree.tables[i].fields` | array | Array of field objects in table |
| `gtree.tables[i].keys` | array | Primary/unique key fields |
| `gtree.tables[i].foreign` | array | Foreign key fields |

### Field Object Properties

Each field object has:
- `name` — Field name
- `type` — Database type (varchar, int, datetime, etc.)
- `caption` — Display label
- `isprimarykey` — Boolean
- `isnullable` — Boolean
- `length` — Character length or precision
- `default` — Default value
- `linktable` — Foreign key target table (if foreign key)
- `linkfield` — Foreign key target field (if foreign key)

## Iterating with JavaScript

### Loop Over All Tables

```javascript
{:code:}
var result = "";
for (var i = 0; i < gtree.tables.length; i++) {
  var table = gtree.tables[i];
  result += "Table: " + table.name + "\n";
  result += "  Fields: " + table.fields.length + "\n";
}
return result;
{:codeend:}
```

**Output:**
```
Table: users
  Fields: 5
Table: products
  Fields: 4
Table: orders
  Fields: 6
```

### Nested Loop: Tables and Fields

```javascript
{:code:}
var result = "";
for (var i = 0; i < gtree.tables.length; i++) {
  var table = gtree.tables[i];
  result += "class " + pascalcase(table.name) + " {\n";
  
  for (var j = 0; j < table.fields.length; j++) {
    var field = table.fields[j];
    result += "  public $" + field.name + ";\n";
  }
  
  result += "}\n\n";
}
return result;
{:codeend:}
```

**Output:**
```
class Users {
  public $id;
  public $username;
  public $email;
}

class Products {
  public $id;
  public $name;
  public $price;
}
```

## String Manipulation in Code Blocks

### String Concatenation

```javascript
{:code:}
var tableName = gtree.tables[0].name;
var className = tableName.charAt(0).toUpperCase() + tableName.slice(1);
return "class " + className + " {}";
{:codeend:}
```

### Template Literals (Modern JavaScript)

```javascript
{:code:}
var result = "";
for (var i = 0; i < gtree.tables.length; i++) {
  var table = gtree.tables[i];
  result += `Processing table: ${table.name}\n`;
}
return result;
{:codeend:}
```

### Array Joining

```javascript
{:code:}
var table = gtree.tables[0];
var fieldNames = [];
for (var i = 0; i < table.fields.length; i++) {
  fieldNames.push(table.fields[i].name);
}
return "INSERT INTO " + table.name + " (" + fieldNames.join(", ") + ") VALUES ...";
{:codeend:}
```

## Built-in Helper Functions

Scoriet provides helper functions you can use inside code blocks:

- `pascalcase(text)` — Convert to PascalCase
- `camelcase(text)` — Convert to camelCase
- `snakecase(text)` — Convert to snake_case
- `kebabcase(text)` — Convert to kebab-case
- `uppercase(text)` — Convert to UPPERCASE
- `lowercase(text)` — Convert to lowercase
- `capitalize(text)` — Capitalize first letter
- `plural(word)` — Pluralize word
- `singular(word)` — Singularize word

### Using Helper Functions

```javascript
{:code:}
var result = "";
for (var i = 0; i < gtree.tables.length; i++) {
  var table = gtree.tables[i];
  result += "class " + pascalcase(table.name) + " {\n";
  
  for (var j = 0; j < table.fields.length; j++) {
    var field = table.fields[j];
    result += "  public $" + camelcase(field.name) + ";\n";
  }
  
  result += "}\n\n";
}
return result;
{:codeend:}
```

## Real-World Examples

### Example 1: Generate Switch Statement for Field Types

```javascript
{:code:}
var table = gtree.tables[0];
var result = "switch (fieldName) {\n";

for (var i = 0; i < table.fields.length; i++) {
  var field = table.fields[i];
  var type = field.type;
  
  if (type === "varchar" || type === "text") {
    result += "  case '" + field.name + "': return STRING;\n";
  } else if (type === "int" || type === "bigint") {
    result += "  case '" + field.name + "': return INTEGER;\n";
  } else if (type === "datetime") {
    result += "  case '" + field.name + "': return DATETIME;\n";
  }
}

result += "  default: return UNKNOWN;\n";
result += "}";
return result;
{:codeend:}
```

**Output:**
```
switch (fieldName) {
  case 'id': return INTEGER;
  case 'username': return STRING;
  case 'email': return STRING;
  case 'created_at': return DATETIME;
  default: return UNKNOWN;
}
```

### Example 2: Generate SQL Create Table Statement

```javascript
{:code:}
var table = gtree.tables[0];
var result = "CREATE TABLE " + table.name + " (\n";

for (var i = 0; i < table.fields.length; i++) {
  var field = table.fields[i];
  result += "  " + field.name + " " + field.type;
  
  if (field.length && field.type === "varchar") {
    result += "(" + field.length + ")";
  }
  
  if (!field.isnullable) {
    result += " NOT NULL";
  }
  
  if (field.isprimarykey) {
    result += " PRIMARY KEY";
  }
  
  if (i < table.fields.length - 1) {
    result += ",";
  }
  
  result += "\n";
}

result += ");";
return result;
{:codeend:}
```

**Output:**
```
CREATE TABLE users (
  id bigint(11) NOT NULL PRIMARY KEY,
  username varchar(255) NOT NULL,
  email varchar(255) NOT NULL,
  created_at datetime,
  updated_at datetime
);
```

### Example 3: Generate ORM Relationship Methods

```javascript
{:code:}
var table = gtree.tables[0];
var result = "";

for (var i = 0; i < table.foreign.length; i++) {
  var fk = table.foreign[i];
  var methodName = fk.linktable.replace("s", ""); // Simple singularize
  
  result += "public function " + methodName + "() {\n";
  result += "  return $this->belongsTo(" + pascalcase(fk.linktable) + "::class);\n";
  result += "}\n\n";
}

return result;
{:codeend:}
```

### Example 4: Generate Validation Rules

```javascript
{:code:}
var table = gtree.tables[0];
var rules = {};

for (var i = 0; i < table.fields.length; i++) {
  var field = table.fields[i];
  var fieldRules = [];
  
  if (!field.isnullable) {
    fieldRules.push("required");
  }
  
  if (field.type === "varchar" || field.type === "text") {
    fieldRules.push("string");
    if (field.length) {
      fieldRules.push("max:" + field.length);
    }
  }
  
  if (field.type === "int" || field.type === "bigint") {
    fieldRules.push("integer");
  }
  
  if (field.type === "datetime") {
    fieldRules.push("date");
  }
  
  if (fieldRules.length > 0) {
    rules[field.name] = fieldRules.join("|");
  }
}

var result = "'rules' => [\n";
for (var key in rules) {
  result += "  '" + key + "' => '" + rules[key] + "',\n";
}
result += "],";

return result;
{:codeend:}
```

**Output:**
```
'rules' => [
  'id' => 'required|integer',
  'username' => 'required|string|max:255',
  'email' => 'required|string|max:255',
  'created_at' => 'date',
],
```

### Example 5: Generate API Documentation

```javascript
{:code:}
var result = "";

for (var t = 0; t < gtree.tables.length; t++) {
  var table = gtree.tables[t];
  var tableSingular = singular(table.name);
  var tablePlural = plural(table.name);
  
  result += "## " + pascalcase(tablePlural) + "\n\n";
  
  result += "### List all " + tablePlural + "\n";
  result += "```\nGET /api/" + snakecase(tablePlural) + "\n```\n\n";
  
  result += "### Get single " + tableSingular + "\n";
  result += "```\nGET /api/" + snakecase(tablePlural) + "/{id}\n```\n\n";
  
  result += "### Create " + tableSingular + "\n";
  result += "```\nPOST /api/" + snakecase(tablePlural) + "\n```\n\n";
  
  result += "#### Request Body\n";
  result += "```json\n{\n";
  
  for (var i = 0; i < table.fields.length; i++) {
    var field = table.fields[i];
    if (!field.isprimarykey) {
      result += "  \"" + camelcase(field.name) + "\": " + 
                (field.type === "int" || field.type === "bigint" ? "0" : "\"\"") + 
                (i < table.fields.length - 2 ? "," : "") + "\n";
    }
  }
  
  result += "}\n```\n\n";
}

return result;
{:codeend:}
```

## Advanced Patterns

### Pattern 1: Conditional Logic Based on Field Properties

```javascript
{:code:}
var table = gtree.tables[0];
var result = "";

// Separate fields by type
var stringFields = [];
var intFields = [];
var dateFields = [];

for (var i = 0; i < table.fields.length; i++) {
  var field = table.fields[i];
  if (field.type === "varchar" || field.type === "text") {
    stringFields.push(field);
  } else if (field.type === "int" || field.type === "bigint") {
    intFields.push(field);
  } else if (field.type === "datetime") {
    dateFields.push(field);
  }
}

result += "// String fields\n";
for (var i = 0; i < stringFields.length; i++) {
  result += "public $" + stringFields[i].name + ";\n";
}

result += "\n// Integer fields\n";
for (var i = 0; i < intFields.length; i++) {
  result += "public $" + intFields[i].name + ";\n";
}

result += "\n// Date fields\n";
for (var i = 0; i < dateFields.length; i++) {
  result += "public $" + dateFields[i].name + ";\n";
}

return result;
{:codeend:}
```

### Pattern 2: Build Complex Objects

```javascript
{:code:}
var result = "";

// Build an object mapping field names to types
var fieldMap = {};
for (var t = 0; t < gtree.tables.length; t++) {
  var table = gtree.tables[t];
  fieldMap[table.name] = {};
  
  for (var f = 0; f < table.fields.length; f++) {
    var field = table.fields[f];
    fieldMap[table.name][field.name] = field.type;
  }
}

// Generate code that uses this map
result += "const FIELD_TYPES = {\n";
for (var tableName in fieldMap) {
  result += "  " + tableName + ": {\n";
  for (var fieldName in fieldMap[tableName]) {
    result += "    " + fieldName + ": '" + fieldMap[tableName][fieldName] + "',\n";
  }
  result += "  },\n";
}
result += "};\n";

return result;
{:codeend:}
```

## Error Handling

Code blocks should return a string. If an error occurs:

```javascript
{:code:}
try {
  var table = gtree.tables[0];
  var result = "";
  // Your code
  return result;
} catch (e) {
  return "Error: " + e.message;
}
{:codeend:}
```

:::caution
**Keep error handling simple.** Complex try-catch blocks in templates are hard to debug. If something fails repeatedly, move the logic to a simpler template pattern or consider breaking the code block into smaller pieces.
:::

## Code Block Best Practices

:::tip
**1. Start simple, then add complexity**

Test with a basic loop first, then add conditionals and helper functions.

**2. Use consistent variable naming**

```javascript
// Good
for (var tableIndex = 0; tableIndex < gtree.tables.length; tableIndex++) {
  var table = gtree.tables[tableIndex];
  
// Harder to follow
for (var i = 0; i < gtree.tables.length; i++) {
  var t = gtree.tables[i];
```

**3. Break into multiple smaller code blocks if needed**

Instead of one massive code block with 100 lines, use three smaller blocks that are easier to debug.

**4. Document your code**

```javascript
{:code:}
// This block generates validators for all string fields
// It checks length and nullability constraints
var table = gtree.tables[0];
// ... implementation
{:codeend:}
```

**5. Test with sample data**

If you have test tables with known structures, validate your code block against them first.

**6. Combine with template syntax when appropriate**

You don't need to do EVERYTHING in JavaScript. Mix simple template syntax with code blocks:

```
{:code:}
// Generate complex output
var result = ...
return result;
{:codeend:}

{:for nmaxitems:}
// Simple loop for fields
{:endfor:}
```

**7. Avoid deep nesting**

Nested loops over tables/fields/constraints can get hard to read. Use intermediate variables to make it clear:

```javascript
// Clearer
var validFields = [];
for (var i = 0; i < table.fields.length; i++) {
  if (!table.fields[i].isprimarykey) {
    validFields.push(table.fields[i]);
  }
}
for (var i = 0; i < validFields.length; i++) {
  // Use validFields[i]
}

// Harder to follow
for (var i = 0; i < table.fields.length; i++) {
  if (!table.fields[i].isprimarykey) {
    // Use table.fields[i] deep in nested logic
  }
}
```
:::

## Debugging Code Blocks

If your code block doesn't produce expected output:

1. **Check for errors:** Does the code have syntax errors?
2. **Verify gtree access:** Can you access `gtree.tables[0].name`?
3. **Test incrementally:** Start with a simple `return "test";` and build up
4. **Check return value:** Your code MUST `return result;`
5. **Watch whitespace:** Extra newlines in output often come from newlines in your string building

### Debug Template

Use this to verify your gtree object:

```javascript
{:code:}
var result = "Debug Info:\n";
result += "Project: " + gtree.projectname + "\n";
result += "Database: " + gtree.projectdatabase + "\n";
result += "Tables: " + gtree.tables.length + "\n";
result += "First table: " + (gtree.tables.length > 0 ? gtree.tables[0].name : "none") + "\n";
return result;
{:codeend:}
```

---

**Next:** Learn about organizing templates with [Include Files](./includes.md), or follow the complete [Generation Workflow](./generation-workflow.md).
