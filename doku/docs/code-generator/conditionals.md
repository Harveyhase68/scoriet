---
sidebar_position: 4
title: Conditionals
---

# Conditionals

Conditionals enable logic-based code generation. Instead of generating the same code for every field, you can generate *different* code based on field properties — varchar fields get different validation than integer fields, for example.

## Conditional Syntax

### Basic If Statement

```
{:if condition:}
  Code here executes if condition is true
{:endif:}
```

### If/Else Statement

```
{:if condition:}
  Code here if true
{:else:}
  Code here if false
{:endif:}
```

### If/Else-If/Else Chain

```
{:if condition1:}
  Code if condition1 is true
{:elseif condition2:}
  Code if condition2 is true
{:elseif condition3:}
  Code if condition3 is true
{:else:}
  Code if all conditions are false
{:endif:}
```

:::tip
Use `{:elseif:}` (not `{:else if:}`) to avoid parsing issues.
:::

## Comparison Operators

Conditions use comparison operators to test values:

| Operator | Meaning | Example | True If |
|----------|---------|---------|---------|
| `==` | Equals | `{:if item.type=="varchar":}` | type is exactly "varchar" |
| `!=` | Not equals | `{:if item.type!="int":}` | type is anything except "int" |
| `<` | Less than | `{:if item.length < 50:}` | length is less than 50 |
| `>` | Greater than | `{:if item.length > 100:}` | length is greater than 100 |
| `<=` | Less or equal | `{:if item.length <= 20:}` | length is 20 or less |
| `>=` | Greater or equal | `{:if item.length >= 255:}` | length is 255 or more |

### Equality Examples

```
{:if item.isprimarykey==true:}
  This field is a primary key
{:endif:}

{:if item.isnullable==false:}
  This field is required (not nullable)
{:endif:}

{:if item.type=="varchar":}
  This field is a string
{:endif:}

{:if item.type!="datetime":}
  This field is not a date/time
{:endif:}
```

### Numeric Comparison Examples

```
{:if item.length > 255:}
  Extra long field (use TEXT instead of VARCHAR)
{:endif:}

{:if item.length <= 50:}
  Short field (suitable for quick display)
{:endif:}

{:if nCount == 1:}
  This is the first field
{:endif:}

{:if i == 0:}
  This is the first item (0-indexed)
{:endif:}
```

## Logical Operators

Combine multiple conditions using logical operators:

| Operator | Meaning | Syntax | Example |
|----------|---------|--------|---------|
| `&&` | AND (both true) | `condition1 && condition2` | `{:if item.type=="varchar" && item.length > 100:}` |
| `\|\|` | OR (either true) | `condition1 \|\| condition2` | `{:if item.type=="int" \|\| item.type=="bigint":}` |
| `!` | NOT (opposite) | `!condition` | `{:if !item.isnullable:}` |

### Logical Operator Examples

#### AND: Both Conditions Must Be True

```
{:if item.type=="varchar" && item.isnullable==false:}
  Required varchar field
{:endif:}
```

This generates code **only** for varchar fields that don't allow NULL.

#### OR: Either Condition Can Be True

```
{:if item.type=="int" || item.type=="bigint":}
  This is an integer type
{:endif:}
```

This generates code for any integer field, whether `int` or `bigint`.

#### NOT: Opposite of Condition

```
{:if !item.isnullable:}
  Field is required (not nullable)
{:endif:}
```

This is equivalent to `{:if item.isnullable==false:}`.

### Complex Logical Conditions

```
{:if (item.type=="varchar" || item.type=="text") && item.length > 100:}
  Large string field - use TEXT type
{:endif:}
```

## String Functions in Conditions

Use string functions to test properties of field names and types:

| Function | Meaning | Example |
|----------|---------|---------|
| `contains` | String contains substring | `{:if item.name.contains("user"):}` |
| `startswith` | String starts with prefix | `{:if item.name.startswith("is_"):}` |
| `endswith` | String ends with suffix | `{:if item.name.endswith("_at"):}` |

### String Function Examples

#### Contains: Check if Name Includes Text

```
{:if item.name.contains("password"):}
  // This is a password field - hash it!
  $password = password_hash(${:item.name:}, PASSWORD_BCRYPT);
{:endif:}
```

#### Starts With: Detect Boolean Fields

```
{:if item.name.startswith("is_"):}
  // Boolean field detected by "is_" prefix
  public \$${:item.name:} = false;
{:endif:}
```

#### Ends With: Detect Timestamp Fields

```
{:if item.name.endswith("_at"):}
  // Timestamp field detected by "_at" suffix
  public \$${:item.name:} = null; // Will be set by database
{:endif:}
```

## Real-World Examples: Type-Specific Generation

### Example 1: Language-Specific Types

Generate different type declarations based on database type:

```csharp
{:for nmaxitems:}
{:if item.type=="int" || item.type=="bigint":}
public int {:pascalcase(item.name):} { get; set; }
{:elseif item.type=="varchar" || item.type=="text":}
public string {:pascalcase(item.name):} { get; set; }
{:elseif item.type=="datetime":}
public DateTime {:pascalcase(item.name):} { get; set; }
{:elseif item.type=="decimal" || item.type=="float":}
public decimal {:pascalcase(item.name):} { get; set; }
{:else:}
public object {:pascalcase(item.name):} { get; set; }
{:endif:}
{:endfor:}
```

**Output:**
```csharp
public int Id { get; set; }
public string Username { get; set; }
public DateTime CreatedAt { get; set; }
public decimal Price { get; set; }
public object Metadata { get; set; }
```

### Example 2: Validation Rules by Type

```javascript
{:for nmaxitems:}
{:if item.type=="varchar":}
new Rules.StringRule('{:item.name:}', {:item.length:})
{:elseif item.type=="int" || item.type=="bigint":}
new Rules.IntegerRule('{:item.name:}')
{:elseif item.type=="datetime":}
new Rules.DateTimeRule('{:item.name:}')
{:endif:}
{:endfor:}
```

### Example 3: Null-Safety in Null Checks

```java
{:for nmaxitems:}
{:if item.isnullable==false:}
if ({:item.name:} == null) {
    throw new IllegalArgumentException("{:item.name:} cannot be null");
}
{:endif:}
{:endfor:}
```

**Output:**
```java
if (id == null) {
    throw new IllegalArgumentException("id cannot be null");
}
if (username == null) {
    throw new IllegalArgumentException("username cannot be null");
}
```

### Example 4: Skip Primary Keys in Generators

Generate constructors that accept only non-primary-key fields:

```csharp
public {:pascalcase(tablename):}({:for fieldsnokey:}
  {:if item.type=="varchar":}string{:elseif item.type=="int":}int{:else:}object{:endif:} {:camelcase(item.name):}{:if nCount != nmaxitems:},{:endif:}
{:endfor:}) {
{:for fieldsnokey:}
  this.{:pascalcase(item.name):} = {:camelcase(item.name):};
{:endfor:}
}
```

### Example 5: Foreign Key Relationship Detection

```
{:for nmaxitems:}
{:if item.linktable!="":}
// This field references table: {:item.linktable:}
public {@pascalcase(item.linktable):}() {
    return $this->belongsTo({:pascalcase(item.linktable):}::class);
}
{:endif:}
{:endfor:}
```

## Conditional Best Practices

:::tip
**1. Use the right property for the right check**

Don't do:
```
{:if item.type.contains("int"):}
```

Instead:
```
{:if item.type=="int" || item.type=="bigint":}
```

The second is clearer and more reliable.

**2. Combine conditionals with loops smartly**

Loop → iterate items
Conditional → filter/customize items

```
{:for nmaxitems:}
{:if item.isprimarykey!=true:}
  Only process non-primary-key fields
{:endif:}
{:endfor:}
```

Instead of using `{:for fieldsnokey:}` (which is built in), this shows the pattern.

**3. Order conditions from most specific to most general**

```
{:if item.type=="varchar" && item.length > 255:}
  // Most specific: varchar with large length
{:elseif item.type=="varchar":}
  // More general: any varchar
{:else:}
  // General: everything else
{:endif:}
```

**4. Comment your conditionals for clarity**

```
{:if item.isnullable==false:}
  // Required field - add to validation
{:endif:}
```

**5. Test edge cases**

What happens with a field that's both a primary key AND has a foreign key? Does your conditional handle it?
:::

## Nested Conditionals

You can nest conditionals inside each other and inside loops:

```
{:for nmaxitems:}
{:if item.isprimarykey==true:}
  // Primary key field
  {:if item.type=="int":}
    int id field
  {:else:}
    non-int primary key
  {:endif:}
{:else:}
  // Not a primary key
  {:if item.isnullable==true:}
    Optional field
  {:else:}
    Required field
  {:endif:}
{:endif:}
{:endfor:}
```

:::caution
**Deep nesting can become hard to read.** If you're nesting more than 3 levels, consider using JavaScript code blocks instead. See [JavaScript Code Blocks](./javascript-code-blocks.md).
:::

## Common Conditional Patterns

### Pattern 1: Skip the Last Item

Useful when generating comma-separated lists:

```
{:for nmaxitems:}
{:if nCount != nmaxitems:}
{:item.name:},
{:else:}
{:item.name:}
{:endif:}
{:endfor:}
```

### Pattern 2: Skip the First Item

Useful when the first item needs different handling:

```
{:for nmaxitems:}
{:if nCount > 1:}
{:item.name:}
{:endif:}
{:endfor:}
```

### Pattern 3: Alternate Formatting (Striped)

```html
{:for nmaxitems:}
{:if i % 2 == 0:}
<tr class="even">
{:else:}
<tr class="odd">
{:endif:}
  <td>{:item.name:}</td>
</tr>
{:endfor:}
```

### Pattern 4: Group by Type

```
// Integer fields
{:for nmaxitems:}
{:if item.type=="int" || item.type=="bigint":}
public {:item.type:} {:item.name:};
{:endif:}
{:endfor:}

// String fields
{:for nmaxitems:}
{:if item.type=="varchar" || item.type=="text":}
public string {:item.name:};
{:endif:}
{:endfor:}
```

## Troubleshooting Conditionals

### Issue: Condition Never Evaluates to True

**Check:**
1. Is the property name correct? (e.g., `isprimarykey`, not `is_primary_key`)
2. Is the value format correct? (strings in quotes: `=="varchar"`, booleans: `==true`)
3. Are you inside the right context? (e.g., inside a loop to access `item`)

### Issue: Syntax Error in Condition

**Common mistakes:**
- Missing quotes: `{:if item.type==varchar:}` → should be `item.type=="varchar"`
- Wrong operator: `{:if item.type=int:}` → should be `item.type=="int"`
- Unmatched braces: `{:if item.type=="varchar":` → missing `:}`

### Issue: Logic Not Working as Expected

**Solution:** Test step-by-step. Start with a simple condition, verify it works, then add complexity.

```
// Test 1: Does this property exist?
Testing: {:item.type:}
Result: varchar (yes, it works)

// Test 2: Does equality work?
{:if item.type=="varchar":}
  Type is varchar
{:endif:}

// Test 3: Add more conditions
{:if item.type=="varchar" && item.isnullable==false:}
  Required varchar
{:endif:}
```

## Conditional vs Filtering with Loops

You have two ways to generate code for specific fields:

**Option 1: Conditional in Loop**
```
{:for nmaxitems:}
{:if item.type=="varchar":}
  Generate code for varchar only
{:endif:}
{:endfor:}
```

**Option 2: Specialized Loop**
```
{:for fieldsnokey:}
  Generate code for non-key fields
{:endfor:}
```

**Use specialized loops when available** — they're clearer. But for complex conditions (e.g., "varchar AND length > 100"), conditionals are necessary.

---

**Next:** Explore [Built-in Functions](./functions.md) to transform text in your templates, or dive into [JavaScript Code Blocks](./javascript-code-blocks.md) for advanced logic.
