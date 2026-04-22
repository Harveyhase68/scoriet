---
sidebar_position: 3
title: Loops and Iteration
---

# Loops and Iteration

Loops are the foundation of code generation. They iterate over database elements — fields, tables, constraints — and repeat a block of template code for each element. Without loops, you couldn't generate models for multiple fields or handle databases with dozens of tables.

## Loop Types Overview

Scoriet provides seven loop types, each iterating over a different collection:

| Loop | Iterates Over | Use Case | Count |
|------|---------------|----------|-------|
| `{:for nmaxitems:}` | All fields in current table | Model properties, form inputs | Variable per table |
| `{:for nmaxfiles:}` | All tables in database | Multiple model classes, DB setup | Total table count |
| `{:for keys:}` | Primary/unique key fields only | Key validation, unique constraints | Usually 1 |
| `{:for foreign:}` | Foreign key fields only | Relationship models, JOINs | Variable |
| `{:for fieldsnokey:}` | Non-key fields | Regular properties | Variable |
| `{:for fieldsnoblob:}` | Non-BLOB fields | Searchable/indexable fields | Variable |
| `{:for constraints:}` | All constraints | Constraint definitions | Variable |

## Loop Syntax

All loops follow the same basic structure:

```
{:for COLLECTION:}
  Content here — repeats for each item
  Access current item via {:item.*:}
{:endfor:}
```

The loop starts with `{:for` and the collection name, and ends with `{:endfor:}`. Everything between executes once per item.

## Loop Variables

Inside a loop, you have access to three special variables:

| Variable | Type | Starts At | Increments | Use Case |
|----------|------|-----------|------------|----------|
| `{:nCount:}` | integer | 1 | +1 per iteration | 1st item, 2nd item, 3rd item |
| `{:i:}` | integer | 0 | +1 per iteration | Array indexing (array[0], array[1]) |
| `{:item.*:}` | object | — | — | Access current item's properties |

### Counter vs Index

- **`{:nCount:}`** is 1-based: first iteration = 1, second = 2, third = 3
- **`{:i:}`** is 0-based: first iteration = 0, second = 1, third = 2

**When to use which:**
- Display purposes: `Item #{:nCount:}` → "Item #1", "Item #2"
- Array indexing: `$array[{:i:}]` → `$array[0]`, `$array[1]`
- Skip last item (comma-separated lists): Use `{:nCount:}` to detect last

### Loop Variable Example

```
{:for nmaxitems:}
  Iteration {:nCount:}: Index {:i:} = {:item.name:}
{:endfor:}
```

**Output:**
```
  Iteration 1: Index 0 = id
  Iteration 2: Index 1 = username
  Iteration 3: Index 2 = email
```

## Loop Type 1: {:for nmaxitems:} — All Fields

Iterate over every field in the current table. This is the most common loop type.

### Syntax

```
{:for nmaxitems:}
  Code here repeats for each field
  Current field: {:item.name:}
{:endfor:}
```

### Examples

#### Example 1: Class Properties

```php
class User {
{:for nmaxitems:}
    public \${:item.name:};
{:endfor:}
}
```

**Output (assuming 5 fields):**
```php
class User {
    public $id;
    public $username;
    public $email;
    public $created_at;
    public $updated_at;
}
```

#### Example 2: SQL INSERT Fields

```sql
INSERT INTO {:tablename:} (
{:for nmaxitems:}
    {:item.name:}{:if nCount != nmaxitems:},{:endif:}
{:endfor:}
) VALUES (...)
```

**Output:**
```sql
INSERT INTO users (
    id,
    username,
    email,
    created_at,
    updated_at
) VALUES (...)
```

#### Example 3: Function Parameters with Commas

```
function create({:for nmaxitems:}${:item.name:}{:if nCount != nmaxitems:}, {:endif:}{:endfor:}) {
}
```

**Output:**
```
function create($id, $username, $email, $created_at, $updated_at) {
}
```

## Loop Type 2: {:for nmaxfiles:} — All Tables

Iterate over every table in the database. Use this to generate models, controllers, or documentation for multiple tables.

### Syntax

```
{:for nmaxfiles:}
  Code here repeats for each table
  Current table: {:item.name:}
{:endfor:}
```

:::info
**Within `{:for nmaxfiles:}`, the context changes.** System variables like `{:nmaxitems:}` now refer to the *current table's* field count, not the global count. This enables nested loops.
:::

### Examples

#### Example 1: Multiple Model Classes

```php
{:for nmaxfiles:}
class {:pascalcase(item.name):} {
{:for nmaxitems:}
    public \${:item.name:};
{:endfor:}
}

{:endfor:}
```

**Output:**
```php
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

class Orders {
    public $id;
    public $user_id;
    public $product_id;
}
```

#### Example 2: Database Migration Files

```php
{:for nmaxfiles:}
// Migration for table: {:item.name:}
public function up() {
    Schema::create('{:item.name:}', function (Blueprint $table) {
{:for nmaxitems:}
        $table->column('{:item.name:}', '{:item.type:}');
{:endfor:}
    });
}
{:endfor:}
```

#### Example 3: API Endpoint List

```
# API Endpoints

{:for nmaxfiles:}
## {:pascalcase(item.name):} Resource

- GET /api/{:snakecase(item.name):} - List all
- POST /api/{:snakecase(item.name):} - Create
- GET /api/{:snakecase(item.name):}/{:id:} - Get one
- PUT /api/{:snakecase(item.name):}/{:id:} - Update
- DELETE /api/{:snakecase(item.name):}/{:id:} - Delete

{:endfor:}
```

## Loop Type 3: {:for keys:} — Key Fields Only

Iterate only over fields that are primary keys or unique keys.

### Syntax

```
{:for keys:}
  Code here repeats only for key fields
  Key field: {:item.name:}
{:endfor:}
```

### Examples

#### Example 1: Primary Key Validation

```
public function validatePrimaryKey($data) {
{:for keys:}
    if (!isset($data['{:item.name:}'])) {
        throw new Exception('Missing primary key: {:item.name:}');
    }
{:endfor:}
}
```

**Output (if id is the only key):**
```
public function validatePrimaryKey($data) {
    if (!isset($data['id'])) {
        throw new Exception('Missing primary key: id');
    }
}
```

#### Example 2: Unique Constraint Enforcement

```sql
CREATE TABLE {:tablename:} (
{:for keys:}
    {:item.name:} {:item.type:} PRIMARY KEY,
{:endfor:}
)
```

## Loop Type 4: {:for foreign:} — Foreign Key Fields

Iterate only over foreign key fields (fields that reference other tables).

### Syntax

```
{:for foreign:}
  Code here repeats for each foreign key
  FK: {:item.name:} → {:item.linktable:}({:item.linkfield:})
{:endfor:}
```

### Examples

#### Example 1: Relationship Models

```php
class Order {
{:for foreign:}
    public ${:snakecase(item.linktable):};  // Relationship to {:item.linktable:}
{:endfor:}
}
```

**Output:**
```php
class Order {
    public $user;  // Relationship to users
    public $product;  // Relationship to products
}
```

#### Example 2: Foreign Key Constraints in SQL

```sql
ALTER TABLE {:tablename:} ADD CONSTRAINT (
{:for foreign:}
  FOREIGN KEY ({:item.name:}) REFERENCES {:item.linktable:}({:item.linkfield:})
{:endfor:}
);
```

## Loop Type 5: {:for fieldsnokey:} — Non-Key Fields

Iterate over fields that are NOT primary or unique keys.

### Syntax

```
{:for fieldsnokey:}
  Regular fields (excludes keys)
  Field: {:item.name:}
{:endfor:}
```

### Examples

#### Example 1: Form Input Fields

```html
<form>
{:for fieldsnokey:}
  <input type="text" name="{:item.name:}" placeholder="{:item.caption:}" />
{:endfor:}
  <button type="submit">Save</button>
</form>
```

## Loop Type 6: {:for fieldsnoblob:} — Non-BLOB Fields

Iterate over fields that are NOT BLOB/TEXT types. Use for searchable or indexable fields.

### Syntax

```
{:for fieldsnoblob:}
  Searchable fields (excludes TEXT, BLOB)
  Field: {:item.name:}
{:endfor:}
```

### Examples

#### Example 1: Database Indexes

```sql
CREATE TABLE {:tablename:} (
{:for fieldsnoblob:}
  INDEX idx_{:item.name:} ({:item.name:}),
{:endfor:}
);
```

## Loop Type 7: {:for constraints:} — Constraints

Iterate over all constraints defined on the table.

### Syntax

```
{:for constraints:}
  Constraint: {:item.name:}
{:endfor:}
```

## Nested Loops

You can nest loops to handle multi-level iteration. A common pattern: iterate tables, then iterate fields within each table.

### Nested Loop Pattern

```
{:for nmaxfiles:}
  Processing table: {:tablename:}
  
  Fields in this table:
{:for nmaxitems:}
    - {:item.name:}
{:endfor:}

{:endfor:}
```

**How it works:**
1. Outer loop iterates each table
2. For each table, context changes: `{:nmaxitems:}` now = field count of current table
3. Inner loop iterates fields of current table
4. After inner loop completes, outer loop moves to next table

### Nested Loop Example: Multi-File Generation

```
{:for nmaxfiles:}
// File: {:pascalcase(item.name):}Model.php
class {:pascalcase(item.name):} {
{:for nmaxitems:}
    public \${:item.name:};
{:endfor:}
}

{:endfor:}
```

**Output:**
```
// File: UsersModel.php
class Users {
    public $id;
    public $username;
    public $email;
}

// File: ProductsModel.php
class Products {
    public $id;
    public $name;
    public $price;
}
```

### Advanced Nested Example: Full ORM Generation

```php
{:for nmaxfiles:}
// Generated Model for table: {:tablename:}
class {:pascalcase(item.name):} {
    protected $table = '{:tablename:}';
    protected $fillable = [
{:for nmaxitems:}
        '{:item.name:}',
{:endfor:}
    ];

    // Relationships
{:for foreign:}
    public function {:camelcase(item.linktable):}() {
        return $this->belongsTo({:pascalcase(item.linktable):}::class, '{:item.name:}', '{:item.linkfield:}');
    }
{:endfor:}
}

{:endfor:}
```

**Output (3 tables, 2 with foreign keys):**
```php
// Generated Model for table: users
class Users {
    protected $table = 'users';
    protected $fillable = [
        'id',
        'username',
        'email',
    ];

    // Relationships
}

// Generated Model for table: products
class Products {
    protected $table = 'products';
    protected $fillable = [
        'id',
        'name',
        'price',
    ];

    // Relationships
}

// Generated Model for table: orders
class Orders {
    protected $table = 'orders';
    protected $fillable = [
        'id',
        'user_id',
        'product_id',
    ];

    // Relationships
    public function users() {
        return $this->belongsTo(Users::class, 'user_id', 'id');
    }
    public function products() {
        return $this->belongsTo(Products::class, 'product_id', 'id');
    }
}
```

## Comma-Separated Lists Pattern

A very common pattern: generate a comma-separated list of items, with commas between items but NOT after the last item.

### The Problem

```
{:for nmaxitems:}
{:item.name:},
{:endfor:}
```

**Output (wrong — trailing comma):**
```
id,
username,
email,
```

### The Solution: Use nCount

```
{:for nmaxitems:}
{:item.name:}{:if nCount != nmaxitems:},{:endif:}
{:endfor:}
```

**Output (correct — no trailing comma):**
```
id,username,email
```

Or with line breaks:

```
{:for nmaxitems:}
  {:item.name:}{:if nCount != nmaxitems:},{:endif:}
{:endfor:}
```

**Output:**
```
  id,
  username,
  email
```

### Real-World Example: SQL Column List

```sql
SELECT
  {:for nmaxitems:}
  {:item.name:}{:if nCount != nmaxitems:},{:endif:}
{:endfor:}
FROM {:tablename:}
```

**Output:**
```sql
SELECT
  id,
  username,
  email
FROM users
```

## Empty Loops

If a loop collection is empty (e.g., `{:for keys:}` on a table with no primary key), the loop body doesn't execute. This is safe — no output is generated.

```
{:for keys:}
Primary key: {:item.name:}
{:endfor:}
```

If there are no keys, this produces **no output**. This is the desired behavior — don't generate code that doesn't apply.

## Loop Performance Considerations

:::caution
**Nested loops are powerful but not infinite.** A template with 3 nested levels over a database with 50 tables and 100 fields per table would generate roughly 50 × 100 × 100 = 500,000 iterations. Keep nesting shallow for performance.

In practice:
- 2 levels deep: Always fine
- 3 levels deep: Fine for small databases (< 100 tables)
- 4+ levels: Consider JavaScript code blocks instead
:::

## Loop Best Practices

:::tip
**1. Start simple, add nesting gradually**
Test with one loop level first. Add nested loops once you confirm the outer loop works.

**2. Use the right loop type**
Use `{:for keys:}` instead of looping all fields and filtering with `{:if item.isprimarykey:}`. It's clearer and more efficient.

**3. Combine loops with conditionals**
Loops iterate; conditionals filter. Use both together:
```
{:for nmaxitems:}
{:if item.type=="varchar":}
  Generate code only for varchar fields
{:endif:}
{:endfor:}
```

**4. Test output incrementally**
Generate, review, refine. Don't write a massive template and hope it works.

**5. Document loop intent in comments**
```
{:for nmaxitems:}
  // Looping: Generate validators for all fields
  $this->validate...
{:endfor:}
```
:::

## Troubleshooting Loops

### Issue: No Output from Loop

**Possible causes:**
1. Loop collection is empty (e.g., no foreign keys)
2. Typo in loop marker: `{:for nmaxitem:}` instead of `{:for nmaxitems:}`
3. Using wrong loop type

**Solution:** Check that the collection exists. If generating multiple tables with different field counts, test with a table that has the expected fields.

### Issue: Wrong Item Properties in Nested Loop

**Problem:** Inside a nested loop, `{:item.name:}` shows the outer item, not the inner item.

**Cause:** Scoriet uses the same `item` variable for all nested loops. This is a known limitation.

**Workaround:** Use JavaScript code blocks for complex nested iteration. See [JavaScript Code Blocks](./javascript-code-blocks.md).

### Issue: Extra Blank Lines in Output

**Problem:** Loop produces extra blank lines.

**Cause:** Blank lines in the loop body template are preserved in output.

**Solution:** Remove blank lines from template if you don't want them in output. Or use a code block to handle formatting.

---

**Next:** Add logic to your loops with [Conditionals](./conditionals.md), or explore [Built-in Functions](./functions.md) for text transformation.
