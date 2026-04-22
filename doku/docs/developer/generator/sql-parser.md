---
sidebar_position: 2
---

# SQL Parser

The SQL Parser is the foundation of Scoriet's code generation system. It analyzes database schemas written in SQL and extracts table structures, fields, constraints, and relationships into a machine-readable format called the **Generation Tree (gtree)**.

## Overview

The SQL Parser supports multiple database types and converts SQL DDL (Data Definition Language) statements into schema objects that templates can access.

**Supported Databases**:
- MySQL / MariaDB
- PostgreSQL
- Microsoft SQL Server (MSSQL)
- SQLite
- Firebird

## Architecture

### Parsing Pipeline

```
SQL Text
   ↓
Tokenizer (Database-Specific)
   ↓
Tokens (KEYWORD, IDENTIFIER, etc.)
   ↓
Parser (Database-Specific)
   ↓
SchemaTable Models
   ↓
Database Storage
   ↓
Generation Tree (gtree)
```

### Core Components

1. **SQLTokenizer** - Converts SQL text into tokens
2. **SQLParser** - Parses tokens into schema objects
3. **Database-Specific Parsers** - Handle dialect differences
4. **Schema Models** - Store parsed data (SchemaTable, SchemaField, etc.)
5. **Schema Storage Service** - Persist and retrieve schemas

## Tokenizer

The tokenizer breaks SQL text into recognizable tokens.

### Token Types

```php
class SQLToken {
    string $type;      // Token type: KEYWORD, IDENTIFIER, LPAREN, COMMA, etc.
    string $value;     // Token value
    int $position;     // Position in original SQL
}
```

**Common Token Types**:

| Type | Example | Usage |
|------|---------|-------|
| KEYWORD | CREATE, TABLE, INT, VARCHAR | SQL keywords |
| IDENTIFIER | users, email, user_id | Table/column names |
| LPAREN | ( | Group start |
| RPAREN | ) | Group end |
| COMMA | , | Item separator |
| SEMICOLON | ; | Statement terminator |
| EQUALS | = | Default value assignment |
| STRING | 'value' | String literals |
| NUMBER | 123, 45.67 | Numeric values |

### MySQL Tokenization Example

```php
$tokenizer = new SQLTokenizer($sqlText);
$tokens = $tokenizer->tokenize();

// Input:
// CREATE TABLE users (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   email VARCHAR(255) NOT NULL
// );

// Output tokens:
// Token(KEYWORD, 'CREATE')
// Token(KEYWORD, 'TABLE')
// Token(IDENTIFIER, 'users')
// Token(LPAREN, '(')
// Token(IDENTIFIER, 'id')
// Token(KEYWORD, 'INT')
// Token(KEYWORD, 'AUTO_INCREMENT')
// Token(KEYWORD, 'PRIMARY')
// Token(KEYWORD, 'KEY')
// ... etc
```

## Parser

The parser takes tokens and builds schema objects.

### MySQL Parser

```php
$parser = new MySQLParser();
$tables = $parser->parseSQL($sqlText);

// Returns array of SchemaTable objects
foreach ($tables as $table) {
    echo $table->table_name;
    foreach ($table->fields as $field) {
        echo "  - " . $field->field_name . ": " . $field->field_type;
    }
}
```

### Parsing CREATE TABLE

```sql
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_department FOREIGN KEY (department_id) 
        REFERENCES departments(id) ON DELETE CASCADE
);
```

**Extracted Data**:

```php
SchemaTable {
    table_name: "users"
    fields: [
        SchemaField {
            field_name: "id"
            field_type: "BIGINT"
            is_primary_key: true
            is_auto_increment: true
            is_nullable: false
        },
        SchemaField {
            field_name: "email"
            field_type: "VARCHAR"
            field_length: "255"
            is_nullable: false
            is_unique: true
        },
        SchemaField {
            field_name: "created_at"
            field_type: "TIMESTAMP"
            default_value: "CURRENT_TIMESTAMP"
        }
    ]
    constraints: [
        SchemaConstraint {
            constraint_type: "FOREIGN KEY"
            constraint_name: "fk_department"
            local_column: "department_id"
            referenced_table: "departments"
            referenced_column: "id"
            on_delete: "CASCADE"
        }
    ]
}
```

### Handling ALTER TABLE

```sql
ALTER TABLE users 
ADD COLUMN phone VARCHAR(20) AFTER email,
ADD INDEX idx_email (email);
```

The parser merges ALTER statements with previous CREATE TABLE definitions, building up the complete schema.

### Handling DROP TABLE

```sql
DROP TABLE IF EXISTS old_table;
```

Detected and removed from the schema.

## Schema Models

Parsed data is stored in database models for persistence and retrieval.

### SchemaTable

```php
class SchemaTable extends Model {
    public $fillable = [
        'schema_id',
        'table_name',
        'table_display_name',
        'table_comment',
        'row_count',
        'data_length',
        'index_length',
    ];
    
    public function fields() {
        return $this->hasMany(SchemaField::class, 'table_id');
    }
    
    public function constraints() {
        return $this->hasMany(SchemaConstraint::class, 'table_id');
    }
}
```

### SchemaField

```php
class SchemaField extends Model {
    public $fillable = [
        'table_id',
        'field_name',
        'field_type',          // INT, VARCHAR, TIMESTAMP, etc.
        'field_length',        // For VARCHAR(255)
        'field_precision',     // For DECIMAL(10,2)
        'field_scale',
        'is_nullable',
        'is_primary_key',
        'is_unique',
        'is_auto_increment',
        'default_value',
        'field_comment',
    ];
}
```

### SchemaConstraint

```php
class SchemaConstraint extends Model {
    public $fillable = [
        'table_id',
        'constraint_type',     // FOREIGN KEY, UNIQUE, CHECK, etc.
        'constraint_name',
        'local_column',
        'referenced_table',
        'referenced_column',
        'on_delete',           // CASCADE, RESTRICT, SET NULL, etc.
        'on_update',
        'check_clause',
    ];
}
```

## Database-Specific Parsers

### PostgreSQL

**Differences from MySQL**:
- Serial/BigSerial auto-increment
- TEXT instead of VARCHAR
- Schema namespace support
- Different constraint syntax

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### MSSQL

**Differences from MySQL**:
- INT IDENTITY auto-increment
- nvarchar for Unicode
- Square brackets for identifiers
- Different constraint syntax

```sql
CREATE TABLE users (
    id BIGINT IDENTITY PRIMARY KEY,
    email NVARCHAR(255) NOT NULL UNIQUE,
    created_at DATETIME DEFAULT GETDATE()
);
```

### SQLite

**Differences from MySQL**:
- Type affinity (INTEGER, TEXT, REAL, BLOB)
- AUTOINCREMENT keyword
- Limited constraint support

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Firebird

**Differences from MySQL**:
- BIGINT for auto-increment
- Single quotes only for strings
- Generator for sequences
- Character set support

```sql
CREATE TABLE users (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Usage: MySQLParser

The MySQLParser is the main entry point for parsing:

```php
use App\Services\MySQLParser;

$parser = new MySQLParser();

try {
    $tables = $parser->parseSQL($sqlText);
    
    foreach ($tables as $table) {
        echo "Table: " . $table->table_name . "\n";
        echo "Fields: " . count($table->fields) . "\n";
        echo "Constraints: " . count($table->constraints) . "\n";
    }
} catch (Exception $e) {
    echo "Parse Error: " . $e->getMessage();
}
```

## Error Handling

The parser provides detailed error messages with context:

```
SQL Syntax Error: Expected 'LPAREN', but got 'IDENTIFIER' 'value'
near: TABLE >>>users<<< (
(SQL line: 2, character: 15, token position: 3/45)
```

**Error Information**:
- Error type
- Expected vs actual token
- Context tokens (3 before, 3 after)
- Approximate line and character position in original SQL
- Token position in token stream

## Schema Storage

### Storing Parsed Schemas

Parsed schemas are stored in the database for later retrieval:

```php
use App\Services\SchemaStorageService;

$storageService = new SchemaStorageService();

$schema = $storageService->store(
    projectId: $projectId,
    databaseType: 'mysql',
    sqlText: $sqlText,
    tables: $parsedTables
);

// Returns schema with ID for reference
```

### Schema Versioning

Multiple versions of a schema can be stored:

```php
$schema = SchemaVersion::where([
    'project_id' => $projectId,
    'version_number' => 1
])->with('tables.fields', 'tables.constraints')->first();
```

### Retrieving Schemas

```php
// Get latest schema
$schema = FloatingSchema::where('project_id', $projectId)
    ->with('tables.fields', 'tables.constraints')
    ->latest()
    ->first();

// Get specific version
$schema = SchemaVersion::where([
    'project_id' => $projectId,
    'version_number' => $versionNumber
])->first();
```

## Integration with Code Generation

The parsed schema becomes the **Generation Tree (gtree)** used by templates:

```javascript
// After parsing, schema becomes JavaScript object:
const gtree = {
    project: {
        projectname: "MyApp",
        tables: [
            {
                filename: "users",
                fields: [
                    { name: "id", type: "BIGINT", isPrimaryKey: true },
                    { name: "email", type: "VARCHAR", isUnique: true },
                    ...
                ]
            },
            ...
        ]
    }
};

// Templates access via:
{:for nmaxitems:}
  {:item.name:}  // Access field name
{:endfor:}
```

## Performance Considerations

### Large Schemas

For very large schemas (100+ tables, 1000+ fields):

1. **Parse in Background**
   ```php
   // Use queue instead of synchronous parsing
   ParseSchemaJob::dispatch($projectId, $sqlText);
   ```

2. **Batch Processing**
   ```php
   // Process multiple SQL files
   $parsedTables = [];
   foreach ($sqlFiles as $file) {
       $parsedTables = array_merge(
           $parsedTables,
           $parser->parseSQL(file_get_contents($file))
       );
   }
   ```

3. **Index Optimization**
   - Use index-based contexts in templates
   - Reduce field object duplication
   - Cache frequently accessed schemas

### Tokenization Optimization

The tokenizer avoids regex where possible:

```php
// Efficient character-by-character scanning
while ($position < strlen($sql)) {
    $char = $sql[$position];
    
    match ($char) {
        '(' => $tokens[] = new SQLToken('LPAREN', '('),
        ')' => $tokens[] = new SQLToken('RPAREN', ')'),
        ',' => $tokens[] = new SQLToken('COMMA', ','),
        default => $this->readIdentifierOrKeyword()
    }
}
```

## Debugging

### Enable Detailed Logging

```php
// In parsing code
if (config('app.debug')) {
    Log::debug('Parsing table: ' . $token->value);
    Log::debug('Field count: ' . count($table->fields));
}
```

### Validate Parsed Output

```php
// Check for common issues
foreach ($tables as $table) {
    if (!$table->fields()->where('is_primary_key', true)->exists()) {
        throw new Exception("Table {$table->table_name} has no primary key");
    }
}
```

## Best Practices

### SQL Input

1. **Use Standard DDL**
   ```sql
   -- Good: Standard syntax
   CREATE TABLE users (id INT PRIMARY KEY);
   
   -- Avoid: Database-specific syntax (unless targeting single DB)
   CREATE TABLE users (id INT PRIMARY KEY AUTO_INCREMENT);
   ```

2. **Include Constraints**
   ```sql
   -- Define relationships explicitly
   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
   ```

3. **Add Comments**
   ```sql
   -- Helps with documentation generation
   CREATE TABLE users (
       id INT PRIMARY KEY COMMENT 'Unique user identifier',
       email VARCHAR(255) NOT NULL COMMENT 'User email address'
   );
   ```

### Error Recovery

1. **Validate Before Parsing**
   - Check for common typos
   - Validate SQL syntax separately
   - Use online SQL validators

2. **Handle Parse Errors Gracefully**
   ```php
   try {
       $tables = $parser->parseSQL($sql);
   } catch (Exception $e) {
       return [
           'success' => false,
           'error' => $e->getMessage(),
           'tables' => []  // Return empty
       ];
   }
   ```

3. **Log Full Context**
   ```php
   Log::error('Parse failed', [
       'error' => $e->getMessage(),
       'sql_snippet' => substr($sql, 0, 500),
       'database_type' => $databaseType
   ]);
   ```
