---
sidebar_position: 4
---

# Template Syntax Reference

Complete syntax reference for Scoriet template engine. All template syntax uses the `{:...}` marker syntax.

## Basic Syntax

### General Pattern

All template tags follow this pattern:

```
{:tag_name:}              # Simple tag
{:tag_name parameter:}    # Tag with parameter
{:tag_name param1 param2:} # Tag with multiple parameters
```

Key points:
- Tags use curly braces with colons: `{:`...`:}`
- No spaces between braces and colons: `{: invalid :}` ❌
- Content between tags is literal text

## Variables & Placeholders

### Basic Variable Substitution

```
{:variable_name:}
```

**System Variables** (always available):

```
{:projectname:}           # Project name
{:projectid:}             # Project ID
{:projectdescription:}    # Project description
{:projectdatabase:}       # Database name
{:projecturl:}            # Project URL
{:projectdirectory:}      # Project directory path
{:startpage:}             # Start page

{:tablename:}             # Current table filename
{:tableindex:}            # Current table index (0-based)

{:filename:}              # Current output filename
{:filenameshort:}         # Short filename
{:filecamelcase:}         # filename in camelCase
{:filepascalcase:}        # filename in PascalCase

{:defaultlanguage:}       # Default language code (e.g., 'en')
{:languageid:}            # Current language ID
{:languagename:}          # Language name
{:selectedlanguage:}      # Selected language code

{:templatename:}          # Template name
{:templateid:}            # Template ID
{:templatedescription:}   # Template description

{:nmaxitems:}             # Number of items in loop
{:nmaxfiles:}             # Total number of tables/files
{:nmaxlanguages:}         # Number of configured languages
```

### Field/Item Variables (in loops)

```
{:item.name:}             # Field name
{:item.type:}             # Field data type (INT, VARCHAR, etc.)
{:item.controltype:}      # UI control type
{:item.caption:}          # Field display name
{:item.isprimarykey:}     # Is primary key? (true/false)
{:item.isunique:}         # Is unique? (true/false)
{:item.isnullable:}       # Is nullable? (true/false)

{:field.name:}            # Same as item.name
{:field.pascalcase:}      # Field name in PascalCase
{:field.camelcase:}       # Field name in camelCase

{:item.linktable:}        # Referenced table (foreign key)
{:item.linkfield:}        # Referenced field (foreign key)
{:item.linkdisplayfield:} # Display field from linked table
```

### Constraint Variables (in constraints loop)

```
{:constraint.name:}              # Constraint name
{:constraint.type:}              # FOREIGN KEY, UNIQUE, CHECK, etc.
{:constraint.local_column:}      # Column in current table
{:constraint.referenced_table:}  # Referenced table
{:constraint.referenced_column:} # Referenced column
{:constraint.on_delete:}         # ON DELETE action (CASCADE, etc.)
{:constraint.on_update:}         # ON UPDATE action
```

## Built-in Functions

Functions transform variable values. Syntax: `{:functionname(parameter):}`

### Text Case Functions

```
{:upper(item.name):}              # UPPERCASE
{:lower(item.name):}              # lowercase
{:capitalize(item.name):}         # Capitalize
{:camelcase(item.name):}          # camelCase
{:pascalcase(item.name):}         # PascalCase
{:snakecase(item.name):}          # snake_case
{:kebabcase(item.name):}          # kebab-case
```

### Pluralization Functions

```
{:plural(item.name):}             # Pluralize word
{:singular(item.name):}           # Singularize word
```

Examples:
- `{:plural("user"):}` → "users"
- `{:plural("child"):}` → "children"
- `{:singular("users"):}` → "user"

### String Functions

```
{:length(item.name):}             # String length
{:strlen(item.name):}             # Same as length
{:substr(item.name,0,3):}         # Substring: start,length
{:replace(item.name,old,new):}    # Replace all occurrences
```

### Nesting Functions

Functions can be nested:

```
{:upper(pascalcase(item.name)):}  # Convert to PascalCase, then uppercase
{:capitalize(plural(item.name)):} # Pluralize, then capitalize
```

## Loops

### for Loop

Iterate over a collection:

```
{:for nmaxitems:}
  Body content here
  Current item: {:item.name:}
{:endfor:}
```

**Loop Contexts** (what to iterate over):

| Context | Iterates Over | Notes |
|---------|---------------|-------|
| `fields` | All fields | Default |
| `fieldsnokey` | Non-key fields | Excludes primary/foreign keys |
| `fieldsnokeyall` | Non-key fields | Extended version |
| `fieldsnoblob` | Non-BLOB fields | Excludes TEXT, BLOB types |
| `fieldsnobloball` | Non-BLOB fields | Extended version |
| `fieldsnobinaryblob` | Non-binary BLOB | Excludes binary types |
| `fieldsnobinarybloball` | Non-binary BLOB | Extended version |
| `keys` | Key fields only | Primary and unique keys |
| `foreign` | Foreign key fields | Join references |
| `constraints` | All constraints | Constraint definitions |
| `foreignkeys` | Foreign key constraints | Join constraints |
| `nmaxfiles` | All tables | For multi-table generation |

### Loop Variables

```
{:for nmaxitems:}
  {:nCount:}        # Current count (1-based)
  {:i:}             # Current index (0-based)
  {:nmaxitems:}     # Total items (readonly inside loop)
{:endfor:}
```

### Nested Loops

```
{:for nmaxfiles:}
  Table: {:tablename:}
  
  {:for nmaxitems:}
    Field: {:item.name:}
  {:endfor:}
{:endfor:}
```

### While Loop

```
{:while condition:}
  Body
{:endwhile:}
```

### Foreach Loop

```
{:foreach collection:}
  Current item: {:item:}
{:endforeach:}
```

## Conditionals

### if Statement

```
{:if condition:}
  Body when true
{:endif:}
```

### if-else Statement

```
{:if condition:}
  Body when true
{:else:}
  Body when false
{:endif:}
```

### if-elseif-else Statement

```
{:if item.type == "VARCHAR":}
  String field
{:elseif item.type == "INT":}
  Integer field
{:elseif item.type == "TIMESTAMP":}
  Date/time field
{:else:}
  Other type
{:endif:}
```

### Condition Operators

```
item.type == "INT"        # Equality
item.type != "VARCHAR"    # Inequality
item.isprimarykey == true # Boolean comparison
item.isnullable == false

field.length > 100        # Greater than
field.length < 50         # Less than
field.length >= 100       # Greater or equal
field.length <= 50        # Less or equal

field.type == "INT" && item.isprimarykey == true  # AND
field.type == "VARCHAR" || field.type == "TEXT"  # OR
!item.isnullable                                   # NOT

item.name contains "id"           # String contains
item.type startswith "VARCHAR"    # String starts with
item.type endswith "INT"          # String ends with
```

### unless Statement (NOT if)

```
{:unless item.isnullable:}
  Field is required (NOT nullable)
{:endunless:}
```

## Switch/Case

### Basic Switch

```
{:switch item.controltype:}
  {:case "text":}
    <input type="text" />
  {:case "number":}
    <input type="number" />
  {:default:}
    <input type="text" />
{:endswitch:}
```

### With Multiple Cases

```
{:switch item.type:}
  {:case "INT":}
  {:case "BIGINT":}
  {:case "DECIMAL":}
    Numeric field
  {:case "VARCHAR":}
  {:case "TEXT":}
    Text field
  {:default:}
    Other type
{:endswitch:}
```

### Auto-Break Behavior

Breaks are automatically inserted between cases unless you manage them yourself:

```
{:switch item.type:}
  {:case "INT":}
    Integer
    <!-- Auto-break inserted here -->
  {:case "VARCHAR":}
    String
    <!-- Auto-break inserted here -->
{:endswitch:}
```

To manage your own breaks:

```
{:switch item.type:}
  {:case "INT":}
    Integer
    {:break:}           <!-- Manual break -->
  {:case "VARCHAR":}
    String
    <!-- No auto-break because you used {:break:} -->
{:endswitch:}
```

## Code Blocks

### Inline JavaScript

```
{:code:}
  const fieldName = item.name.toUpperCase();
  return fieldName + '_ID';
{:codeend:}
```

**Features**:
- Execute custom JavaScript
- Access gtree data structure
- Use template functions and helpers
- Return computed values
- Full JavaScript syntax support

### Code Block Example

```
{:for nmaxitems:}
  Field type: {:item.type:}
  
  {: Generate control type based on field type :}
  {:code:}
    if (item.type === 'INT' || item.type === 'BIGINT') {
      return 'number';
    } else if (item.type === 'VARCHAR') {
      return 'text';
    } else if (item.type === 'BOOLEAN') {
      return 'checkbox';
    } else {
      return 'text';
    }
  {:codeend:}
{:endfor:}
```

### Important Notes

- Code blocks cannot be nested
- Must be properly closed with `{:codeend:}`
- Common typo: `{:codend:}` ❌ (use `{:codeend:}` ✅)

## Macros

### Define a Macro

```
{:macro renderField fieldType fieldName:}
  {:if fieldType == "INT":}
    <input type="number" name="{:fieldName:}" />
  {:elseif fieldType == "VARCHAR":}
    <input type="text" name="{:fieldName:}" />
  {:else:}
    <input type="text" name="{:fieldName:}" />
  {:endif:}
{:endmacro:}
```

### Use a Macro

```
{:call renderField "VARCHAR" "email":}
```

**Multiple Parameters**:

```
{:macro renderForm tableName, primaryKey, maxFields:}
  <form method="POST" action="/save/{:tableName:}">
    {:code:}
      return item.name === primaryKey ? 'hidden' : 'visible';
    {:codeend:}
  </form>
{:endmacro:}

{:call renderForm "users" "id" 10:}
```

## Include Directive

### Include External Template

```
{:include: common/header.template:}
```

### Include from Different Paths

```
{:include: ../shared/footer.template:}
{:include: /absolute/path/template.inc:}
{:include: ./relative/path/template.inc:}
```

## Comments

### Single-Line Comment

```
{: This is a comment - not included in output :}
```

### Multi-Line Comment

```
{:
  This is a multi-line comment
  that explains the template logic
  and is not included in the output
:}
```

## Smart Injection Markers

Markers for post-processing code injection:

### Section Definition

```
{:section database_schema:}
  // Database schema will be inserted here
{:sectionend:}
```

### Injection Point

```
{:inject before_database_connection:}
{:inject after_validation;custom_validation:}
```

## Template Control Keywords

These keywords control template flow but are not variables:

```
{:for:}           # Start loop
{:endfor:}        # End loop
{:while:}         # Start while loop
{:endwhile:}      # End while loop
{:foreach:}       # Start foreach loop
{:endforeach:}    # End foreach loop

{:if:}            # Start conditional
{:endif:}         # End conditional
{:else:}          # Else branch
{:elseif:}        # Else-if branch
{:unless:}        # Unless conditional (NOT)
{:endunless:}     # End unless

{:switch:}        # Start switch
{:endswitch:}     # End switch
{:case:}          # Case branch
{:default:}       # Default case
{:othercase:}     # Alternative case syntax
{:break:}         # Break statement

{:code:}          # Start code block
{:codeend:}       # End code block
{:macro:}         # Define macro
{:endmacro:}      # End macro
{:call:}          # Call macro

{:include:}       # Include file
{:extends:}       # Extend template
{:block:}         # Define block
{:endblock:}      # End block

{:section:}       # Section definition
{:sectionend:}    # End section
{:inject:}        # Injection point
```

## Escaping & Special Cases

### Escaping Braces

If you need literal braces in output:

```
Print a brace: \{
Print: \}
Double braces: \{\}
```

### Newlines & Whitespace

**Important**: Template engine preserves whitespace:

```
{:for nmaxitems:}
  Field: {:item.name:}

{:endfor:}
```

Output includes blank line between iterations. To avoid:

```
{:for nmaxitems:}Field: {:item.name:}{:endfor:}
```

### String Literals

```
{:if item.type == "VARCHAR":}    # Quoted string
{:if item.name == item.type:}    # Variable comparison
```

## Common Patterns

### Generate Properties for All Fields

```
{:for nmaxitems:}
public ${:item.name:}: {:item.type:}{{ };

{:endfor:}
```

### Skip Primary Keys

```
{:for fieldsnokey:}
  {:item.name:}: {:item.type:}
{:endfor:}
```

### Conditional Type Casting

```
{:for nmaxitems:}
  {:if item.type == "INT":}
    (int)${:item.name:}
  {:elseif item.type == "VARCHAR":}
    (string)${:item.name:}
  {:else:}
    ${:item.name:}
  {:endif:}
{:endfor:}
```

### Generate SQL with Field Comments

```
CREATE TABLE {:tablename:} (
{:for nmaxitems:}
  {:item.name:} {:item.type:}{:if nCount < nmaxitems:},{:endif:} {: Field: {:item.caption:} :}
{:endfor:}
);
```

### Handle Foreign Keys

```
{:for constraints:}
  {:if constraint.type == "FOREIGN KEY":}
    CONSTRAINT {:constraint.name:}
    FOREIGN KEY ({{constraint.local_column:}})
    REFERENCES {:constraint.referenced_table:}({{constraint.referenced_column:}})
    ON DELETE {:constraint.on_delete:}
  {:endif:}
{:endfor:}
```

## Validation & Error Messages

### Valid Syntax Check

```
{:if item.type == "INT":}      ✅ Valid
{:if item.type=="INT":}        ✅ Valid (no spaces)
{:if item.type == 'INT':}      ✅ Valid (single quotes ok)
{:if item.type == "INT" }      ❌ Invalid (missing closing :)
{:if item.type == "INT"}       ❌ Invalid (invalid closing })
```

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Unclosed {:if:} block` | Missing `{:endif:}` | Add `{:endif:}` |
| `{:endif:} without matching {:if:}` | Extra endif | Remove extra |
| `Unknown variable: xyz` | Variable not recognized | Check variable name |
| `{:for:} requires loop variable` | No context specified | Use `{:for nmaxitems:}` |
| `Nested {:code:} blocks` | Code block inside code | Extract to separate block |
| `Invalid {:codend:}` | Typo in closing tag | Use `{:codeend:}` |

## Best Practices

1. **Use Descriptive Macros** - Extract repeated blocks into macros
2. **Comment Complex Logic** - Document non-obvious template sections
3. **Validate Before Generation** - Check template syntax before running
4. **Test with Sample Data** - Generate once manually to verify output
5. **Use Specific Loop Contexts** - `fieldsnokey` instead of looping all fields
6. **Keep Code Blocks Simple** - Complex logic in separate functions
7. **Document Custom Variables** - Explain what custom variables do
8. **Follow Naming Conventions** - Use consistent naming for variables
