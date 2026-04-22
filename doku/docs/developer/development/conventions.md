---
sidebar_position: 7
---

# Code Conventions & Standards

Coding standards and best practices for Scoriet development. Ensure all code follows these conventions.

## Language: English Only

**All documentation, comments, code, and commit messages MUST be in English.**

```php
// ✅ GOOD - English
function calculateUserAge() {
    // Compute age from birthdate
}

// ❌ BAD - German/Other languages
function calculateAlter() {
    // Alter aus Geburtsdatum berechnen
}
```

**Exception**: User-facing UI text may include other languages for localization.

## Database Development

### Foreign Key Strategy

Always use BIGINT AUTO_INCREMENT for foreign keys in master tables:

```sql
-- ✅ GOOD: Master table
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    ...
);

-- ✅ GOOD: Detail table with FK to master
CREATE TABLE user_profiles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    ...
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ❌ BAD: Using text keys for foreign keys
CREATE TABLE users (
    email VARCHAR(255) PRIMARY KEY,  -- Don't use text as PK
    ...
);
```

**Benefits**:
- Better performance (numeric keys faster than text)
- Referential integrity
- Easier migration
- Standard practice

### Table Relationships

Ensure all related tables have explicit foreign key constraints:

```sql
-- ✅ GOOD: Explicit relationships
CREATE TABLE projects (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ✅ GOOD: Cascade delete for data cleanup
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
```

## Problem Solving Approach

### Academic Problem Analysis

When code doesn't work, solve it academically, not with hacks:

```php
// ❌ BAD: Hack solution (quick fix, causes future bugs)
public function parseField($field) {
    if (strpos($field, 'INT') !== false) {
        return 'INT';  // This breaks for BIGINT, MEDIUMINT!
    }
}

// ✅ GOOD: Proper solution (works for all cases)
public function parseField($field) {
    $pattern = '/^(TINY|SMALL|MEDIUM)?INT(\(\d+\))?(UNSIGNED)?(ZEROFILL)?$/i';
    if (preg_match($pattern, $field, $matches)) {
        return strtoupper($matches[0]);
    }
    return null;
}
```

**Principles**:
1. Understand the root cause, not just the symptom
2. Solve for all cases, not just current problem
3. Design for 10-year longevity (stable code)
4. Avoid quick hacks that cause future issues
5. Test edge cases thoroughly

### Avoid Regular Expressions

Prefer explicit parsing over regex unless specifically needed:

```php
// ❌ AVOID: Regex (hard to debug, fragile)
if (preg_match('/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/', $ip)) {
    // ... validate IP
}

// ✅ PREFER: Explicit logic (clear intent, easier to maintain)
public function validateIPAddress($ip) {
    $parts = explode('.', $ip);
    if (count($parts) !== 4) {
        return false;
    }
    foreach ($parts as $part) {
        if (!is_numeric($part) || $part < 0 || $part > 255) {
            return false;
        }
    }
    return true;
}
```

**Regex exceptions** (acceptable uses):
- Pattern validation where alternative is too complex
- High-performance string searching
- Standard library functions (filter_var, preg_match_all)
- Data extraction where structure is well-defined

## Template Development

### Use Existing Panels as Templates

Create new panels by copying existing working panels:

```
✅ GOOD WORKFLOW:
1. Find existing panel (e.g., PanelT1.tsx)
2. Copy entire file to new name (PanelT6.tsx)
3. Modify specific parts
4. Register in dock layout
5. Test

✅ BENEFITS:
- Consistent styling
- Consistent behavior
- Same tooling
- No reinventing wheels
- Better UX continuity
```

### Don't Reinvent the Wheel

Leverage existing components and patterns:

```tsx
// ❌ BAD: Custom implementation
function MyButton() {
  return <button style={{...lots of custom css...}}>Click</button>
}

// ✅ GOOD: Use existing UI library
import { Button } from 'antd';

function MyButton() {
  return <Button type="primary">Click</Button>
}
```

## Code Quality

### ESLint & Prettier

All JavaScript/TypeScript code must pass linting:

```bash
npm run lint -- --fix
npm run format
npm run types
```

**Before committing**:
1. Fix all lint errors: `npm run lint -- --fix`
2. Format code: `npm run format`
3. Check types: `npm run types`
4. Verify no errors remain

### PHP Code Quality

Laravel projects use Pint for code formatting:

```bash
composer run lint
```

### Type Safety

Always use TypeScript for React components:

```tsx
// ❌ BAD: No types (JavaScript)
function UserList({ users, onSelect }) {
  return users.map(u => <div onClick={() => onSelect(u)}>{u.name}</div>)
}

// ✅ GOOD: Full types (TypeScript)
interface User {
  id: number;
  name: string;
  email: string;
}

interface UserListProps {
  users: User[];
  onSelect: (user: User) => void;
}

function UserList({ users, onSelect }: UserListProps) {
  return users.map(u => (
    <div key={u.id} onClick={() => onSelect(u)}>
      {u.name}
    </div>
  ))
}
```

### Method Naming Conventions

| Pattern | Example | Usage |
|---------|---------|-------|
| verb + Noun | `parseSQL`, `validateTemplate` | Methods that perform actions |
| is + Adjective | `isActive`, `isNullable` | Boolean properties/methods |
| get + Noun | `getProjectName` | Accessor methods |
| set + Noun | `setProjectName` | Mutator methods |
| handle + Event | `handleClick`, `handleSubmit` | Event handlers |

```php
// ✅ GOOD: Clear intent
public function parseSQL($sqlText) { }
public function validateTemplate($content) { }
public function isActive() { }
public function getProjectName() { }

// ❌ BAD: Unclear
public function process($x) { }
public function check($y) { }
public function active() { }  // Ambiguous - property or method?
public function name() { }     // Is this get or set?
```

### Class Organization

Structure classes logically:

```php
class MyService {
    // 1. Properties
    private string $name;
    private array $config;
    
    // 2. Constructor
    public function __construct($name) {
        $this->name = $name;
    }
    
    // 3. Public methods (interface)
    public function process($data) {
        // ...
    }
    
    // 4. Protected/private methods (implementation)
    protected function validate($data) {
        // ...
    }
    
    private function transform($data) {
        // ...
    }
}
```

## Comment Standards

### Document Intent, Not Code

```php
// ❌ BAD: Comments state the obvious
$user_count = 0;        // Initialize counter
$user_count++;          // Increment counter
echo $user_count;       // Print the count

// ✅ GOOD: Comments explain why and complex logic
$user_count = 0;
foreach ($users as $user) {
    // Only count active users (deleted users are soft-deleted)
    if (!$user->deleted_at) {
        $user_count++;
    }
}
echo $user_count;
```

### Use Block Comments for Complex Sections

```php
/**
 * Parse SQL schema and extract table structures
 * 
 * This method handles multiple SQL dialects (MySQL, PostgreSQL, etc)
 * and creates SchemaTable models with relationships intact.
 * 
 * @param string $sqlText Raw SQL DDL statements
 * @return array Collection of SchemaTable models
 * @throws ParseException if SQL syntax is invalid
 */
public function parseSQL(string $sqlText): array {
    // Implementation
}
```

## Development Tools

### Do NOT Run Builds During Development

```bash
# ❌ DO NOT run this during development
npm run build

# ✅ USE this instead (Vite handles compilation automatically)
npm run dev
```

Vite provides hot reload. Building is only for production release.

### GIT Usage

Use git as a local version control backup, NOT for pushing to remote:

```bash
# ✅ GOOD: Use git locally
git checkout -b feature/my-feature
git add .
git commit -m "Implement feature X"
git log --oneline

# ❌ DO NOT: Push to remote
git push origin feature/my-feature  # ❌ DON'T DO THIS

# ✅ Project owner handles pushing to GitHub
# (You: feature-branch → Developer reviews → Owner: pushes to main)
```

## Windows Development Notes

### Use Correct Localhost

For curl and API calls, use `10.0.0.8` instead of `localhost`:

```bash
# ❌ On Windows, localhost often doesn't work
curl http://localhost:8000/api/projects

# ✅ USE THIS instead
curl http://10.0.0.8:8000/api/projects
```

### Development is on Windows

Remember Windows-specific considerations:

```php
// ✅ Path handling works on both Windows and Linux
$path = storage_path('app/file.txt');

// ✅ Use forward slashes (PHP converts automatically)
$path = 'storage/app/file.txt';

// ⚠️ AVOID: Hardcoded paths
$path = 'C:\Users\Developer\project\storage';  // Not portable
```

## Testing Standards

### Write Tests for Complex Logic

```php
// ✅ GOOD: Test-driven development for core services
test('template engine handles nested loops', function () {
    $template = '{:for nmaxitems:}{:for fields:}...{:endfor:}{:endfor:}';
    $engine = new UltimateTemplateEngine($gtree);
    $result = $engine->processTemplate($template);
    
    expect($result)->toContain('for (let item of');
    expect(substr_count($result, 'for (let item of'))->toBe(2);  // 2 nested loops
});
```

### Test Edge Cases

```php
test('sql parser handles empty table', function () {
    $sql = 'CREATE TABLE empty_table ();';
    $tables = (new MySQLParser())->parseSQL($sql);
    
    expect($tables)->toHaveCount(1);
    expect($tables[0]->fields)->toBeEmpty();
});

test('template validation catches unclosed if', function () {
    $template = '{:if item.type == "INT":}Body{:endif:}Content{:if false:}';
    $engine = new UltimateTemplateEngine([]);
    $validation = $engine->validateTemplateSyntax($template);
    
    expect($validation['valid'])->toBeFalse();
    expect($validation['errors'])->toContain('unclosed');
});
```

## Documentation Standards

### README in English

All documentation files in English:

```markdown
# Scoriet Code Generator

## Overview
[English description]

## Installation
[English instructions]
```

**Not German or other languages in documentation.**

### API Documentation

Document API endpoints:

```php
/**
 * Generate code from template
 * 
 * @post /api/generate
 * @param {int} project_id Project to generate code for
 * @param {int} template_id Template to use
 * @param {string} language Language code (en, de, etc)
 * @return {json} Generated files in archive
 * @throw {ValidationException} Missing required parameters
 * @throw {ParseException} Schema parsing failed
 */
public function generate(GenerateCodeRequest $request) {
    // ...
}
```

## Git Commit Messages

Write clear, descriptive commit messages:

```bash
# ✅ GOOD: Descriptive and specific
git commit -m "Add validation to template engine"
git commit -m "Fix SQL parser handling of BIGINT UNSIGNED"
git commit -m "Implement foreign key constraint parsing"

# ❌ BAD: Too vague
git commit -m "Fix bug"
git commit -m "Update code"
git commit -m "Changes"
```

### Commit Message Format

```
<type>: <description>

<optional detailed explanation>

- Specific changes made
- Why this change was needed
```

**Types**:
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code reorganization
- `test:` - Add/update tests
- `docs:` - Documentation
- `perf:` - Performance improvement

**Examples**:

```
feat: Add PostgreSQL parser support

Implements PostgreSQL-specific SQL parsing for:
- Serial/BigSerial auto-increment
- TEXT type support
- Schema namespaces

- Added PostgreSQLTokenizer and PostgreSQLParser
- Added schema.table_name handling
- Tests for PostgreSQL DDL syntax

fix: Prevent stack overflow in nested loops

Template engine max loop depth check was missing.
Now limits nesting to 10 levels with clear error.

refactor: Extract template variable resolution to helper

Split processVariable() into:
- resolveVariable() - find variable value
- formatVariable() - apply formatting
- validateVariable() - check availability

Improves testability and readability.
```

## Performance Standards

### Query Optimization

```php
// ❌ BAD: N+1 queries
$projects = Project::all();
foreach ($projects as $project) {
    $schema = $project->schema();  // Query per project!
}

// ✅ GOOD: Eager loading
$projects = Project::with('schema', 'templates').get();
foreach ($projects as $project) {
    $schema = $project->schema;  // Already loaded
}
```

### Cache Appropriate Data

```php
// ✅ Cache schemas (frequently accessed, rarely changed)
$schema = Cache::remember("schema:{$schemaId}", 24*60*60, function() {
    return FloatingSchema::with('tables.fields').find($schemaId);
});

// ✅ Cache template functions (compiled once)
$jsFunction = Cache::remember("template:{$templateId}", 24*60*60, function() {
    return $engine->processTemplate($content);
});

// ❌ Don't cache transient data
// (user input, page state, temporary calculations)
```

## Error Handling

### Provide Context in Errors

```php
// ❌ BAD: No context
throw new Exception('Parse failed');

// ✅ GOOD: Full context
throw new ParseException(
    message: "SQL syntax error at line {$lineNum}: {$error}",
    code: 1001,
    context: [
        'sql_snippet' => substr($sql, $position - 50, 100),
        'token' => $currentToken,
        'line_number' => $lineNum,
        'expected' => 'LPAREN',
        'actual' => $token->type
    ]
);
```

### Use Specific Exception Classes

```php
// ✅ Use specific exceptions
class ParseException extends Exception {}
class ValidationException extends Exception {}
class GenerationException extends Exception {}

// ✅ In code
throw new ParseException('Invalid SQL syntax');
throw new ValidationException('Required field missing');
throw new GenerationException('Template processing failed');

// ❌ Avoid generic exceptions
throw new Exception('Something went wrong');
```

## Summary Checklist

Before committing code:

- [ ] Code is in English
- [ ] All database FKs use BIGINT auto-increment
- [ ] No hack solutions (academic problem solving)
- [ ] Minimal regex use (prefer explicit logic)
- [ ] New panels copied from existing templates
- [ ] ESLint passing: `npm run lint -- --fix`
- [ ] Prettier formatted: `npm run format`
- [ ] TypeScript types valid: `npm run types`
- [ ] Tests written for complex logic: `composer run test`
- [ ] No `npm run build` during development
- [ ] Git commits are descriptive
- [ ] API/function documentation present
- [ ] Error handling with context
- [ ] Performance considered (queries, caching)
- [ ] Windows development practices followed

These standards ensure code quality, maintainability, and team consistency.
