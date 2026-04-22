---
sidebar_position: 5
title: Built-in Functions
---

# Built-in Functions

Scoriet provides a set of built-in functions for text transformation and manipulation. These functions enable you to convert database field names into idiomatic code for different languages and purposes.

## Function Syntax

All functions use the same syntax:

```
{:functionname(argument):}
{:functionname(arg1, arg2):}
{:functionname(arg1, arg2, arg3):}
```

Functions are called within `{:...:}` markers, just like variables. Arguments can be literal text, system variables, or item properties.

## Case Conversion Functions

Case conversion is the most common function use. Convert field names like `user_profile_name` to match the conventions of your target language.

### PascalCase: {:pascalcase(...):}

**Description:** Convert to PascalCase (words capitalized, no separators)

**Syntax:** `{:pascalcase(text):}`

**Input → Output:**

| Input | Output |
|-------|--------|
| `user_profile_name` | `UserProfileName` |
| `first_name` | `FirstName` |
| `id` | `Id` |
| `userID` | `UserId` |
| `users` | `Users` |

**Use Cases:**
- C# class names: `class {:pascalcase(tablename):} {}`
- JavaScript class names: `class {:pascalcase(tablename):} {}`
- Method names: `public void {:pascalcase(item.name):}() {}`
- Property names in C#/TypeScript

**Example:**

```csharp
class {:pascalcase(tablename):} {
    public void Create{:pascalcase(tablename):}() {
        // Implementation
    }
}
```

**Output:**
```csharp
class Users {
    public void CreateUsers() {
        // Implementation
    }
}
```

### camelCase: {:camelcase(...):}

**Description:** Convert to camelCase (first word lowercase, subsequent words capitalized)

**Syntax:** `{:camelcase(text):}`

**Input → Output:**

| Input | Output |
|-------|--------|
| `user_profile_name` | `userProfileName` |
| `first_name` | `firstName` |
| `id` | `id` |
| `user_id` | `userId` |
| `created_at` | `createdAt` |

**Use Cases:**
- JavaScript object properties
- Java variable names
- JSON keys
- PHP variable names

**Example:**

```javascript
{:for nmaxitems:}
this.{:camelcase(item.name):} = params.{:camelcase(item.name):};
{:endfor:}
```

**Output:**
```javascript
this.userId = params.userId;
this.firstName = params.firstName;
this.createdAt = params.createdAt;
```

### snake_case: {:snakecase(...):}

**Description:** Convert to snake_case (all lowercase, underscores between words)

**Syntax:** `{:snakecase(text):}`

**Input → Output:**

| Input | Output |
|-------|--------|
| `UserProfileName` | `user_profile_name` |
| `firstName` | `first_name` |
| `ID` | `id` |
| `userId` | `user_id` |
| `createdAt` | `created_at` |

**Use Cases:**
- Database field names (already snake_case)
- Python variable names
- Configuration keys
- SQL column names

**Example:**

```sql
SELECT
{:for nmaxitems:}
  {:snakecase(item.name):}{:if nCount != nmaxitems:},{:endif:}
{:endfor:}
FROM {:snakecase(tablename):}
```

**Output:**
```sql
SELECT
  user_id,
  first_name,
  email
FROM users
```

### kebab-case: {:kebabcase(...):}

**Description:** Convert to kebab-case (all lowercase, hyphens between words)

**Syntax:** `{:kebabcase(text):}`

**Input → Output:**

| Input | Output |
|-------|--------|
| `user_profile_name` | `user-profile-name` |
| `firstName` | `first-name` |
| `userId` | `user-id` |
| `createdAt` | `created-at` |

**Use Cases:**
- HTML class names: `<div class="user-profile-name">`
- URL paths: `/api/user-profiles`
- CSS class names
- YAML keys with hyphens

**Example:**

```html
<form class="form-{:kebabcase(tablename):}">
{:for nmaxitems:}
  <input class="field-{:kebabcase(item.name):}" type="text" />
{:endfor:}
</form>
```

**Output:**
```html
<form class="form-users">
  <input class="field-user-id" type="text" />
  <input class="field-first-name" type="text" />
  <input class="field-email" type="text" />
</form>
```

## String Case Functions

Modify the case of strings without changing word structure.

### UPPERCASE: {:uppercase(...):} or {:upper(...):}

**Description:** Convert entire string to uppercase

**Syntax:** `{:uppercase(text):}` or `{:upper(text):}`

**Input → Output:**

| Input | Output |
|-------|--------|
| `user_id` | `USER_ID` |
| `hello world` | `HELLO WORLD` |
| `UserId` | `USERID` |

**Use Cases:**
- SQL constants: `UPDATE users SET active = 1`
- Environment variables: `DATABASE_URL`
- Constants in code: `const MAX_LENGTH = 255`

**Example:**

```c
#define {:uppercase(item.name):}_MAX_LENGTH {:item.length:}
```

**Output:**
```c
#define USER_ID_MAX_LENGTH 11
#define USERNAME_MAX_LENGTH 255
```

### lowercase: {:lowercase(...):} or {:lower(...):}

**Description:** Convert entire string to lowercase

**Syntax:** `{:lowercase(text):}` or `{:lower(text):}`

**Input → Output:**

| Input | Output |
|-------|--------|
| `UserProfile` | `userprofile` |
| `HELLO` | `hello` |
| `MyClass` | `myclass` |

**Use Cases:**
- File names (web): `{:lowercase(tablename):}.html`
- URL slugs
- Database identifiers

**Example:**

```
Template filename: {:lowercase(tablename):}_list.html
```

**Output:**
```
Template filename: users_list.html
```

### Capitalize: {:capitalize(...):}

**Description:** Capitalize first letter, leave rest as-is

**Syntax:** `{:capitalize(text):}`

**Input → Output:**

| Input | Output |
|-------|--------|
| `hello` | `Hello` |
| `HELLO` | `HELLO` |
| `firstName` | `FirstName` |

**Use Cases:**
- Display labels: `{:capitalize(item.name):}` → "User_id"
- Start of sentences

**Note:** Less common than PascalCase or camelCase. Use PascalCase for proper identifiers.

**Example:**

```html
<label>{:capitalize(item.name):}</label>
```

**Output:**
```html
<label>user_id</label>
<label>firstName</label>
```

## String Manipulation Functions

Functions for modifying and analyzing strings.

### Length: {:length(text):}

**Description:** Get the character length of a string (returns integer)

**Syntax:** `{:length(text):}`

**Input → Output:**

| Input | Output |
|-------|--------|
| `hello` | `5` |
| `user_id` | `7` |
| `` (empty) | `0` |

**Use Cases:**
- Validation rules
- Display limits
- Comments

**Example:**

```
Field: {:item.name:} (length: {:length(item.name):})
```

**Output:**
```
Field: user_id (length: 7)
Field: username (length: 8)
```

### Substring: {:substr(text, start, length):}

**Description:** Extract part of a string

**Syntax:** `{:substr(text, start, length):}`

- `text`: The source string
- `start`: 0-based starting position
- `length`: Number of characters to extract

**Input → Output:**

| Input | Start | Length | Output |
|-------|-------|--------|--------|
| `hello` | 0 | 3 | `hel` |
| `hello` | 1 | 3 | `ell` |
| `user_id` | 0 | 4 | `user` |

**Use Cases:**
- Abbreviations: `{:substr(tablename, 0, 3):}` for "use" from "users"
- Prefixes: Extract first N characters
- Display truncation

**Example:**

```
Abbreviation: {:substr(tablename, 0, 3):} (from {:tablename:})
```

**Output:**
```
Abbreviation: use (from users)
Abbreviation: pro (from products)
```

### Replace: {:replace(text, old, new):}

**Description:** Replace all occurrences of a substring

**Syntax:** `{:replace(text, old, new):}`

- `text`: Source string
- `old`: Text to find
- `new`: Replacement text

**Input → Output:**

| Input | Old | New | Output |
|-------|-----|-----|--------|
| `hello_world` | `_` | ` ` | `hello world` |
| `user_id` | `_` | `` | `userid` |
| `firstName` | `Name` | `Field` | `firstField` |

**Use Cases:**
- Converting separators: underscores to spaces
- Removing prefixes: `is_` to ``
- Generic replacements

**Example:**

```
{:replace(item.name, "is_", ""):}
```

**Output (for field "is_active"):**
```
active
```

## Word Functions

Functions for linguistic transformations.

### Plural: {:plural(word):}

**Description:** Convert word to plural form

**Syntax:** `{:plural(word):}`

**Input → Output:**

| Input | Output |
|-------|--------|
| `user` | `users` |
| `product` | `products` |
| `person` | `people` |
| `child` | `children` |
| `status` | `statuses` |

**Irregular Plurals Supported:**
- `man` → `men`
- `woman` → `women`
- `child` → `children`
- `person` → `people`
- `tooth` → `teeth`
- And many others

**Use Cases:**
- API endpoint names: `/api/{:plural(tablename):}`
- Variable names: `List<{:pascalcase(tablename):}> {:plural(tablename):}`
- Collection properties: `public List {:plural(item.name):};`

**Example:**

```
// Get all items
GET /api/{:plural(tablename):}

// Get single item
GET /api/{:plural(tablename):}/{:id:}
```

**Output (for "user" table):**
```
// Get all items
GET /api/users

// Get single item
GET /api/users/{id}
```

### Singular: {:singular(word):}

**Description:** Convert word to singular form

**Syntax:** `{:singular(word):}`

**Input → Output:**

| Input | Output |
|-------|--------|
| `users` | `user` |
| `products` | `product` |
| `people` | `person` |
| `children` | `child` |

**Use Cases:**
- Model class names: `class {:pascalcase(singular(tablename)):} {}`
- Variable names: `$item = $collection->first();`

**Example:**

```java
public class {@pascalcase(singular(tablename)):} {
    // Single item model
}

List<{:pascalcase(singular(tablename)):}> items = repository.findAll();
```

**Output (for "users" table):**
```java
public class User {
    // Single item model
}

List<User> items = repository.findAll();
```

## Function Combinations

Combine functions for powerful transformations:

### Case + Function Combination

```
{:pascalcase(plural(tablename)):}
```

**Processing:**
1. `tablename` = "user"
2. `plural(tablename)` = "users"
3. `pascalcase("users")` = "Users"

### Multiple Functions in One Template

```php
{:for nmaxitems:}
// Constant name
define('{:uppercase(tablename):}_{:uppercase(item.name):}', true);

// Property name
public \$_{:camelcase(item.name):};

// Method name
public function get{:pascalcase(item.name):}() {
    return $this->_{:camelcase(item.name):};
}
{:endfor:}
```

**Output:**
```php
// Constant name
define('USERS_ID', true);

// Property name
public $_id;

// Method name
public function getId() {
    return $this->_id;
}

// Constant name
define('USERS_USERNAME', true);

// Property name
public $_username;

// Method name
public function getUsername() {
    return $this->_username;
}
```

## Real-World Function Examples

### Example 1: Multi-Language Class Generation

```java
// Java
class {:pascalcase(tablename):} {
    {:for nmaxitems:}private {:item.type:} {:camelcase(item.name):};{:endfor:}
}

// C#
class {:pascalcase(tablename):} {
    {:for nmaxitems:}public string {:pascalcase(item.name):} { get; set; }{:endfor:}
}

// Python
class {:pascalcase(tablename):}:
    def __init__(self):
{:for nmaxitems:}
        self.{:snakecase(item.name):} = None
{:endfor:}
```

### Example 2: Validation Rules

```python
{:for nmaxitems:}
{:item.name:}_max_length = {:item.length:}  # {:capitalize(item.name):}
{:endfor:}
```

**Output:**
```python
id_max_length = 11
username_max_length = 255
email_max_length = 100
```

### Example 3: Documentation Table

```markdown
| Field | Type | Length | Notes |
|-------|------|--------|-------|
{:for nmaxitems:}
| `{:item.name:}` | `{:item.type:}` | {:item.length:} | {:item.caption:} |
{:endfor:}
```

### Example 4: REST API Endpoint List

```yaml
{:for nmaxfiles:}
paths:
  /{:plural(snakecase(tablename)):}:
    get:
      summary: List all {:plural(tablename):}
      operationId: list{:pascalcase(plural(tablename)):}
    post:
      summary: Create a new {:singular(tablename):}
      operationId: create{:pascalcase(singular(tablename)):}
  /{:plural(snakecase(tablename)):}/{:id:}:
    get:
      summary: Get a {:singular(tablename):}
      operationId: get{:pascalcase(singular(tablename)):}
{:endfor:}
```

### Example 5: ORM Model with Relationships

```php
{:for nmaxfiles:}
class {:pascalcase(tablename):} extends Model {
{:for foreign:}
    public function {:camelcase(singular(item.linktable)):}() {
        return $this->belongsTo({:pascalcase(singular(item.linktable)):}::class, '{:item.name:}', '{:item.linkfield:}');
    }
{:endfor:}
}

{:endfor:}
```

## Function Best Practices

:::tip
**1. Know which function to use for your language**

- **JavaScript/JSON**: `{:camelcase(...):}`
- **C#/.NET**: `{:pascalcase(...):}`
- **Python**: `{:snakecase(...):}`
- **SQL/Databases**: `{:snakecase(...):}`
- **HTML/CSS**: `{:kebabcase(...):}`

**2. Combine functions strategically**

Don't do: `{:pascalcase(item.name):}` and then manually adjust
Do: Use the right function for your target language

**3. Test edge cases**

What happens with:
- Single-letter fields: `id`, `x`
- Acronyms: `userID`, `XMLParser`
- Numbers: `field1`, `user2id`

**4. Document your naming conventions**

If you use custom pluralization or specific case conventions, document them in template comments.
:::

## Troubleshooting Functions

### Issue: Case Conversion Produces Unexpected Output

**Symptom:** `{:pascalcase(item.name):}` produces `UserID` instead of `UserId`

**Cause:** Database field names with acronyms are interpreted as separate words

**Workaround:** Use the output as-is (it's usually acceptable), or use a JavaScript code block for custom logic

### Issue: Plural/Singular Not Working for Your Word

**Cause:** Pluralization works for common English words. Proper nouns or technical terms may not pluralize correctly.

**Workaround:** Use a JavaScript code block to define custom plural mappings, or manually type the correct plural in your template

### Issue: Function Parameters Wrong

**Symptom:** `{:substr(item.name, 5):}` produces error

**Cause:** `substr` requires exactly 3 parameters (text, start, length). This only has 2.

**Solution:** `{:substr(item.name, 0, 5):}` (include all three)

---

**Next:** Explore [JavaScript Code Blocks](./javascript-code-blocks.md) for advanced scenarios where built-in functions aren't enough, or jump to [Generation Workflow](./generation-workflow.md) for step-by-step generation.
