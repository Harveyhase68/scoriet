---
sidebar_position: 3
title: Service Classes
description: Business logic services in Scoriet
---

# Service Classes

Services in Scoriet contain reusable business logic that can be shared across multiple controllers and commands. They encapsulate complex operations, database interactions, and third-party integrations.

## Directory Structure

```
app/Services/
├── SQL/
│   ├── MySQLParser.php
│   ├── PostgreSQLParser.php
│   ├── MSSQLParser.php
│   ├── SQLiteParser.php
│   ├── FirebirdParser.php
│   ├── SQLParser.php (core)
│   ├── SQLTokenizer.php
│   ├── SQLToken.php
│   └── [Database-specific tokenizers]
├── Template/
│   ├── UltimateTemplateEngine.php
│   ├── SimpleFixedTemplateEngine.php
│   ├── SimpleTemplateEngine.php
│   ├── StepByStepTemplateEngine.php
│   ├── TemplateCacheService.php
│   ├── TemplateFingerprintService.php
│   ├── TemplateFixService.php
│   ├── TemplateIncludeResolver.php
│   └── TemplateStoreService.php
├── Schema/
│   ├── SchemaStorageService.php
│   ├── SchemaDiffService.php
│   └── MigrationSqlGenerator.php
├── Code/
│   ├── CodeAdjustmentService.php
│   └── CodeScannerService.php
├── Project/
│   ├── ProjectExportService.php
│   ├── ProjectImportService.php
│   └── ProjectFileTreeGenerator.php
├── Billing/
│   ├── CreditService.php
│   ├── StripeService.php
│   └── PayPalService.php
└── [Other services...]
```

## SQL Parser Services

### MySQLParser
**File**: `app/Services/MySQLParser.php`

Parses MySQL-specific SQL syntax.

**Usage**:
```php
$parser = new MySQLParser();
$tables = $parser->parseSQL($sqlText);

// Returns array of table structures with fields and constraints
$tables = [
    [
        'name' => 'users',
        'fields' => [
            ['name' => 'id', 'type' => 'INT', 'autoIncrement' => true],
            ['name' => 'email', 'type' => 'VARCHAR', 'length' => 255],
        ],
        'primaryKey' => 'id',
    ]
];
```

**Key Methods**:
- `parseSQL($sqlText)` - Parse SQL string and return table definitions

**Supported Features**:
- CREATE TABLE statements
- Columns with types, lengths, constraints
- Primary keys and unique constraints
- Foreign key relationships
- Indexes and keys

### SQLParser (Core)
**File**: `app/Services/SQLParser.php`

Core SQL parsing logic shared across database dialects.

**Key Features**:
- Token-based parsing
- Multi-database support
- Schema extraction

### SQLTokenizer
**File**: `app/Services/SQLTokenizer.php`

Tokenizes SQL strings into individual tokens for parsing.

**Purpose**:
- Splits SQL into meaningful tokens
- Handles keywords, identifiers, operators
- Preserves whitespace and structure information

**Usage**:
```php
$tokenizer = new SQLTokenizer($sqlText);
$tokens = $tokenizer->tokenize();

// Tokens are SQLToken objects with type and value
// ['type' => 'KEYWORD', 'value' => 'CREATE']
// ['type' => 'KEYWORD', 'value' => 'TABLE']
// ['type' => 'IDENTIFIER', 'value' => 'users']
```

### PostgreSQL/MS-SQL/SQLite/Firebird Parsers
Dialect-specific parser implementations:
- `PostgreSQLParser.php` - PostgreSQL syntax
- `MSSQLParser.php` - Microsoft SQL Server syntax
- `SQLiteParser.php` - SQLite syntax
- `FirebirdParser.php` - Firebird/InterBase syntax

**Common Interface**:
```php
$parser = new PostgreSQLParser();
$tables = $parser->parseSQL($sqlText);
```

## Template Engine Services

### UltimateTemplateEngine
**File**: `app/Services/UltimateTemplateEngine.php`

Advanced template engine with full feature support.

**Supported Template Syntax**:

**Placeholders**:
```
{:projectname:}        // Project name
{:item.field:}         // Object property access
{:currentdate:}        // Current date
```

**Loops**:
```
{:for items:}
  Item: {:item.name:}
{:endfor:}

{:for nmaxitems:}
  Max: {:item.name:}
{:endfor:}
```

**Conditionals**:
```
{:if item.type=="int":}
  Integer field
{:else:}
  Other type
{:endif:}
```

**Code Blocks**:
```
{:code:}
  // JavaScript code - has access to context
  let total = items.length;
  return total;
{:codeend:}
```

**Includes**:
```
{:include: /path/to/template.txt:}
```

**Key Methods**:
- `execute($template, $context)` - Execute template with data
- `compile($template)` - Compile and validate template
- `preview($template, $context)` - Preview output without saving

**Example**:
```php
$engine = new UltimateTemplateEngine();

$template = <<<'TEMPLATE'
Class {:classname:} {
{:for properties:}
  private ${:item.name:};
{:endfor:}
}
TEMPLATE;

$context = [
    'classname' => 'User',
    'properties' => [
        ['name' => 'id'],
        ['name' => 'email'],
    ]
];

$output = $engine->execute($template, $context);
```

### SimpleTemplateEngine
**File**: `app/Services/SimpleTemplateEngine.php`

Lightweight template engine for basic placeholder substitution.

**Features**:
- Simple placeholder replacement
- No advanced syntax
- Fast execution

### StepByStepTemplateEngine
**File**: `app/Services/StepByStepTemplateEngine.php`

Template engine with step-by-step processing for debugging.

### TemplateCacheService
**File**: `app/Services/TemplateCacheService.php`

Caches compiled templates for performance.

**Methods**:
- `get($templateId)` - Retrieve cached template
- `store($templateId, $compiled)` - Cache compiled template
- `invalidate($templateId)` - Clear cache

### TemplateIncludeResolver
**File**: `app/Services/TemplateIncludeResolver.php`

Resolves and includes external template files.

**Purpose**:
- Handles `{:include:}` directives
- Prevents circular includes
- Resolves relative paths

### TemplateStoreService
**File**: `app/Services/TemplateStoreService.php`

Template marketplace and library management.

**Methods**:
- `getPublicTemplates()` - List public templates
- `install($templateId, $projectId)` - Install template
- `publish($templateId)` - Publish template to marketplace

## Schema Services

### SchemaStorageService
**File**: `app/Services/SchemaStorageService.php`

Stores parsed schemas in database.

**Methods**:
- `store($schema, $project)` - Save schema to database
- `createVersion($schema)` - Create schema version for history
- `getLatestVersion($schema)` - Get current schema version

**Key Features**:
- Schema versioning
- Change tracking
- Field and constraint storage

### SchemaDiffService
**File**: `app/Services/SchemaDiffService.php`

Compares schemas to identify changes.

**Methods**:
- `diff($schema1, $schema2)` - Compare schemas
- `getChanges($schema1, $schema2)` - List specific changes

**Change Types**:
- Added tables
- Removed tables
- Added columns
- Removed columns
- Modified columns (type, length, constraints)
- Added/removed indexes

**Example**:
```php
$diffService = new SchemaDiffService();
$changes = $diffService->getChanges($oldSchema, $newSchema);

// Returns changes like:
[
    'added_tables' => ['new_table'],
    'removed_tables' => [],
    'modified_tables' => [
        'users' => [
            'added_columns' => ['username'],
            'removed_columns' => [],
            'modified_columns' => ['email']
        ]
    ]
]
```

### MigrationSqlGenerator
**File**: `app/Services/MigrationSqlGenerator.php`

Generates migration SQL from schema differences.

**Methods**:
- `generate($changes)` - Create migration SQL statements

**Generated Statements**:
```sql
ALTER TABLE users ADD COLUMN username VARCHAR(255);
ALTER TABLE users DROP COLUMN deprecated_field;
CREATE TABLE new_table (...);
```

## Code Services

### CodeAdjustmentService
**File**: `app/Services/CodeAdjustmentService.php`

Applies post-generation code modifications.

**Methods**:
- `apply($code, $adjustment)` - Apply adjustment to code
- `validate($adjustment)` - Validate adjustment rules

**Adjustment Types**:
- String replacements
- Code insertions (before/after patterns)
- Line modifications

### CodeScannerService
**File**: `app/Services/CodeScannerService.php`

Analyzes generated code for issues.

**Methods**:
- `scan($code)` - Scan for issues
- `validate($code)` - Validate against standards

## Project Services

### ProjectExportService
**File**: `app/Services/ProjectExportService.php`

Exports projects to shareable formats.

**Methods**:
- `export($project)` - Create exportable project file
- `toJson($project)` - Convert to JSON format
- `toZip($project)` - Create ZIP archive

**Exported Data**:
- Project metadata
- All schemas
- All templates
- Configuration

### ProjectImportService
**File**: `app/Services/ProjectImportService.php`

Imports project files.

**Methods**:
- `import($file, $user)` - Import project file
- `validate($file)` - Validate import file

### ProjectFileTreeGenerator
**File**: `app/Services/ProjectFileTreeGenerator.php`

Generates file tree structure of generated output.

**Methods**:
- `generate($project)` - Create file tree
- `getStructure($project)` - Get nested structure

**Output Format**:
```
[
    'name' => 'src/',
    'type' => 'folder',
    'children' => [
        ['name' => 'Models/', 'type' => 'folder', 'children' => [...]],
        ['name' => 'User.php', 'type' => 'file', 'size' => 2048],
    ]
]
```

## Registration Services

### RegistrationValidationService
**File**: `app/Services/RegistrationValidationService.php`

Validates user registration for security.

**Validations**:
- Tor IP detection
- Disposable email checking
- MX record verification
- Special email filtering
- Rate limiting

**Methods**:
- `validate($request)` - Check registration validity

**Example**:
```php
$validator = new RegistrationValidationService();
$result = $validator->validate($request);

if (!$result['valid']) {
    $errors = $result['errors']; // ['email' => 'Disposable email not allowed']
}
```

## FTP/SSH Services

### FtpSshUploadService
**File**: `app/Services/FtpSshUploadService.php`

Handles FTP and SSH deployments.

**Methods**:
- `testConnection($credentials)` - Test connection
- `upload($project, $credentials)` - Deploy files
- `validateCredentials($credentials)` - Validate credentials

## Git Integration

### GitProviderService
**File**: `app/Services/GitProviderService.php`

GitHub/GitLab integration.

**Methods**:
- `authorize($provider, $code)` - OAuth callback
- `commit($project, $message)` - Create commit
- `push($project)` - Push to remote
- `createPullRequest($project, $branch)` - Create PR

## Performance Services

![Performance Metrics](/img/screenshots/performance.png)
*System Admin Performance Metrics dashboard with tracking and analytics*

### PerformanceTrackingService
**File**: `app/Services/PerformanceTrackingService.php`

Tracks application performance metrics.

**Methods**:
- `record($metric, $value)` - Record metric
- `getMetrics($filter)` - Retrieve metrics

### CacheProgressService
**File**: `app/Services/CacheProgressService.php`

Tracks long-running operation progress.

**Methods**:
- `start($key)` - Start tracking
- `update($key, $progress)` - Update progress
- `complete($key)` - Mark complete

## Billing Services

### CreditService
**File**: `app/Services/CreditService.php`

Manages user credit balance and usage.

**Methods**:
- `getBalance($user)` - Get available credits
- `deduct($user, $amount)` - Use credits
- `award($user, $amount)` - Award credits
- `refund($user, $amount)` - Refund credits

**Credit Tracking**:
- Monthly credit allowance
- Purchased credits
- Code generation cost
- Template execution cost

### Stripe Integration
Stripe payment processing and webhook handling.

### PayPal Integration
PayPal payment and refund handling.

## Web Push Services

### WebPushService
**File**: `app/Services/WebPushService.php`

Sends web push notifications.

**Methods**:
- `sendNotification($user, $data)` - Send to user
- `broadcast($data)` - Broadcast to all

## Service Architecture Pattern

Services follow dependency injection and SOLID principles:

```php
// Service definition
class MyService
{
    private $userRepository;
    private $cache;

    public function __construct(
        UserRepository $userRepository,
        CacheService $cache
    ) {
        $this->userRepository = $userRepository;
        $this->cache = $cache;
    }

    public function execute($data)
    {
        // Business logic
    }
}

// Controller usage
public function __construct(MyService $myService)
{
    $this->myService = $myService;
}

public function handle(Request $request)
{
    $result = $this->myService->execute($request->all());
    return response()->json($result);
}
```

## Best Practices

1. **Single Responsibility** - Each service handles one concern
2. **Dependency Injection** - Inject dependencies in constructor
3. **Testability** - Services should be mockable
4. **Reusability** - Share logic across controllers
5. **Documentation** - Document complex operations
6. **Error Handling** - Throw meaningful exceptions
7. **Logging** - Log important operations

## Next Steps

- Read [Models](./models.md) for data layer
- Read [Controllers](./controllers.md) for usage examples
- Read [API Routes](./api-routes.md) for endpoint documentation
