---
sidebar_position: 7
title: "Practical Gtree Examples"
---

# Practical Gtree Examples

This section contains **real-world, production-ready examples** of code generation using Gtree. Each example demonstrates complete, working templates that generate functional code for modern frameworks and languages.

All examples assume you have a database table in your Gtree. For demonstration, we'll use a `users` table with fields like `id`, `email`, `first_name`, `last_name`, `password`, `created_at`.

---

## Example 1: Laravel Eloquent Model

Generate a complete, fully-featured Laravel Eloquent model from your table definition.

```javascript
{:code:}
const table = gtree.project.tables[0];
const modelName = table.tablename
  .split('_')
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join('');

const fillableFields = table.fields
  .filter(f => !f.isprimarykey && f.controltype !== 'hidden')
  .map(f => `'${f.name}'`);

const casts = {};
for (const field of table.fields) {
  if (field.type === 'BOOLEAN') {
    casts[field.name] = 'boolean';
  } else if (field.type === 'DATETIME' || field.type === 'DATE') {
    casts[field.name] = 'datetime';
  } else if (field.type === 'INT' || field.type === 'BIGINT') {
    casts[field.name] = 'integer';
  } else if (field.type === 'DECIMAL') {
    casts[field.name] = 'float';
  }
}

const castString = Object.entries(casts)
  .map(([key, value]) => `'${key}' => '${value}'`)
  .join(",\n            ");

let model = `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Casts\\Attribute;

class ${modelName} extends Model
{
    protected $table = '${table.tablename}';

    protected $fillable = [
        ${fillableFields.join(",\n        ")}
    ];

    protected $casts = [
        ${castString}
    ];

    protected $hidden = [
        'password'
    ];

    // Add custom relationships
    // public function otherModel()
    // {
    //     return $this->hasMany(OtherModel::class);
    // }
}
`;

return model;
{:codeend:}
```

**Generated Output**:
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    protected $table = 'users';

    protected $fillable = [
        'email',
        'first_name',
        'last_name',
        'password',
        'created_at'
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'password' => 'string'
    ];

    protected $hidden = [
        'password'
    ];
}
```

---

## Example 2: React Form Component with Validation

Generate a fully-functional React form component with Formik validation.

```javascript
{:code:}
const table = gtree.project.tables[0];

// Convert table name to component name
const componentName = table.tablename
  .split('_')
  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
  .join('');

// Fields to include (exclude id and timestamps)
const formFields = table.fields.filter(f =>
  !f.isprimarykey && 
  !f.name.includes('_at') && 
  f.controltype !== 'hidden'
);

// Build initial values
const initialValues = {};
for (const field of formFields) {
  initialValues[field.camelcase] = field.type === 'BOOLEAN' ? false : '';
}

const initialValuesStr = Object.entries(initialValues)
  .map(([key, value]) => `${key}: ${typeof value === 'boolean' ? value : "''"}`)
  .join(',\n      ');

// Build validation schema
const validationRules = [];
for (const field of formFields) {
  let rules = [];
  
  if (!field.isnullable) {
    rules.push('Yup.string().required("This field is required")');
  } else {
    rules.push('Yup.string().optional()');
  }
  
  if (field.length > 0) {
    rules.push(`.max(${field.length})`);
  }
  
  if (field.controltype === 'email') {
    rules = ['Yup.string().email("Invalid email").required()'];
  } else if (field.controltype === 'number') {
    rules = ['Yup.number().required()'];
  }
  
  validationRules.push(`    ${field.camelcase}: ${rules.join('.')}`);
}

// Build form fields JSX
const fieldElements = formFields.map(field => {
  const label = field.caption;
  const inputType = field.controltype === 'email' ? 'email' : 
                   field.controltype === 'password' ? 'password' :
                   field.controltype === 'number' ? 'number' : 'text';
  
  return `      <div className="form-group">
        <label htmlFor="${field.camelcase}">${label}</label>
        <input
          type="${inputType}"
          id="${field.camelcase}"
          name="${field.camelcase}"
          className="form-control"
          placeholder="Enter ${label.toLowerCase()}"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.${field.camelcase}}
          ${!field.isnullable ? 'required' : ''}
        />
        {formik.touched.${field.camelcase} && formik.errors.${field.camelcase} && (
          <div className="error">{formik.errors.${field.camelcase}}</div>
        )}
      </div>`;
}).join('\n\n');

let component = `import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const validationSchema = Yup.object().shape({
${validationRules.join(',\n')}
});

const ${componentName}Form = ({ onSubmit }) => {
  const formik = useFormik({
    initialValues: {
      ${initialValuesStr}
    },
    validationSchema,
    onSubmit: (values) => {
      onSubmit(values);
    }
  });

  return (
    <form onSubmit={formik.handleSubmit} className="form-container">
      <h2>${componentName} Form</h2>

${fieldElements}

      <button type="submit" className="btn-primary">
        Submit
      </button>
    </form>
  );
};

export default ${componentName}Form;
`;

return component;
{:codeend:}
```

**Generated Output**:
```jsx
import React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';

const validationSchema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required(),
  firstName: Yup.string().required("This field is required").max(255),
  lastName: Yup.string().required("This field is required").max(255),
  password: Yup.string().required("This field is required")
});

const UserForm = ({ onSubmit }) => {
  const formik = useFormik({
    initialValues: {
      email: '',
      firstName: '',
      lastName: '',
      password: ''
    },
    validationSchema,
    onSubmit: (values) => {
      onSubmit(values);
    }
  });

  return (
    <form onSubmit={formik.handleSubmit} className="form-container">
      <h2>User Form</h2>
      {/* Form fields */}
      <button type="submit" className="btn-primary">Submit</button>
    </form>
  );
};

export default UserForm;
```

---

## Example 3: RESTful API Routes (Express.js)

Generate complete Express.js API routes with CRUD operations.

```javascript
{:code:}
const table = gtree.project.tables[0];
const modelName = table.tablename
  .split('_')
  .map(w => w.charAt(0).toUpperCase() + w.slice(1))
  .join('');
const routePath = table.tablename;
const variableName = table.tablename.charAt(0).toLowerCase() + table.tablename.slice(1);

const primaryKeyField = table.fields.find(f => f.isprimarykey);
const pkName = primaryKeyField ? primaryKeyField.name : 'id';

let routes = `const express = require('express');
const router = express.Router();
const ${modelName} = require('../models/${modelName}');

// GET all ${routePath}
router.get('/${routePath}', async (req, res) => {
  try {
    const items = await ${modelName}.findAll();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single ${routePath}
router.get('/${routePath}/:id', async (req, res) => {
  try {
    const item = await ${modelName}.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ error: '${modelName} not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE ${routePath}
router.post('/${routePath}', async (req, res) => {
  try {
    const ${variableName} = await ${modelName}.create(req.body);
    res.status(201).json(${variableName});
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// UPDATE ${routePath}
router.put('/${routePath}/:id', async (req, res) => {
  try {
    const ${variableName} = await ${modelName}.findByPk(req.params.id);
    if (!${variableName}) {
      return res.status(404).json({ error: '${modelName} not found' });
    }
    await ${variableName}.update(req.body);
    res.json(${variableName});
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE ${routePath}
router.delete('/${routePath}/:id', async (req, res) => {
  try {
    const ${variableName} = await ${modelName}.findByPk(req.params.id);
    if (!${variableName}) {
      return res.status(404).json({ error: '${modelName} not found' });
    }
    await ${variableName}.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
`;

return routes;
{:codeend:}
```

---

## Example 4: SQL Migration File

Generate a complete Laravel migration with all fields and constraints.

```javascript
{:code:}
const table = gtree.project.tables[0];
const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
const migrationName = `Create${table.tablename.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}Table`;

const typeMap = {
  'BIGINT': 'bigInteger',
  'INT': 'integer',
  'VARCHAR': 'string',
  'TEXT': 'text',
  'BOOLEAN': 'boolean',
  'DATETIME': 'dateTime',
  'DATE': 'date',
  'DECIMAL': 'decimal',
  'JSON': 'json',
  'ENUM': 'enum'
};

// Group fields by type for organization
const columnDefs = [];
for (const field of table.fields) {
  let definition = '';
  const methodName = typeMap[field.type] || 'string';
  
  if (field.isprimarykey && field.type === 'BIGINT') {
    definition = `$table->id('${field.name}')`;
  } else if (methodName === 'string' || methodName === 'enum') {
    const params = field.length > 0 ? `, ${field.length}` : '';
    definition = `$table->${methodName}('${field.name}'${params})`;
  } else if (methodName === 'decimal') {
    definition = `$table->${methodName}('${field.name}', ${field.length || 8}, ${field.decimals || 2})`;
  } else {
    definition = `$table->${methodName}('${field.name}')`;
  }
  
  if (!field.isnullable && !field.isprimarykey) {
    definition += '->nullable(false)';
  } else if (field.isnullable && !field.isprimarykey) {
    definition += '->nullable()';
  }
  
  if (field.isunique) {
    definition += '->unique()';
  }
  
  if (field.defaultvalue) {
    definition += `->default('${field.defaultvalue}')`;
  }
  
  columnDefs.push(definition + ';');
}

const migration = `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('${table.tablename}', function (Blueprint $table) {
            ${columnDefs.join('\n            ')}
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('${table.tablename}');
    }
};
`;

return migration;
{:codeend:}
```

---

## Example 5: TypeScript Interface and Types

Generate TypeScript interfaces with proper typing for your API responses and frontend models.

```javascript
{:code:}
const table = gtree.project.tables[0];
const interfaceName = 'I' + table.tablename
  .split('_')
  .map(w => w.charAt(0).toUpperCase() + w.slice(1))
  .join('');

const typeMap = {
  'BIGINT': 'number',
  'INT': 'number',
  'VARCHAR': 'string',
  'TEXT': 'string',
  'BOOLEAN': 'boolean',
  'DATETIME': 'Date | string',
  'DATE': 'Date | string',
  'DECIMAL': 'number',
  'JSON': 'Record<string, any>',
  'ENUM': 'string'
};

// Build interface properties
const properties = [];
for (const field of table.fields) {
  const tsType = typeMap[field.type] || 'unknown';
  const optional = field.isnullable ? '?' : '';
  const comment = field.caption ? `/** ${field.caption} */\n  ` : '';
  
  properties.push(`${comment}${field.camelcase}${optional}: ${tsType};`);
}

// Build type for create (exclude id, timestamps)
const createFields = table.fields.filter(f =>
  !f.isprimarykey && 
  !f.name.includes('_at')
);

const createProperties = [];
for (const field of createFields) {
  const tsType = typeMap[field.type] || 'unknown';
  const optional = field.isnullable ? '?' : '';
  createProperties.push(`  ${field.camelcase}${optional}: ${tsType};`);
}

let types = `// Auto-generated types

/**
 * ${interfaceName}
 * ${table.tablename} table model
 */
export interface ${interfaceName} {
  ${properties.join('\n  ')}
}

/**
 * ${interfaceName}Create
 * Request payload for creating a new ${table.tablename}
 */
export interface ${interfaceName}Create {
${createProperties.join('\n')}
}

/**
 * ${interfaceName}Update
 * Request payload for updating a ${table.tablename}
 */
export interface ${interfaceName}Update extends Partial<${interfaceName}Create> {}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  timestamp: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
`;

return types;
{:codeend:}
```

---

## Example 6: Database Seeder

Generate a Laravel seeder with realistic sample data.

```javascript
{:code:}
const table = gtree.project.tables[0];
const modelName = table.tablename
  .split('_')
  .map(w => w.charAt(0).toUpperCase() + w.slice(1))
  .join('');

// Determine sample data based on field type
const getSampleValue = (field, index) => {
  if (field.name === 'email') return `'user${index}@example.com'`;
  if (field.name.includes('name')) return `'Sample ${field.caption} ${index}'`;
  if (field.type === 'BOOLEAN') return 'true';
  if (field.type === 'INT' || field.type === 'BIGINT') return index.toString();
  if (field.type === 'DATETIME') return `now()`;
  if (field.type === 'DECIMAL') return '99.99';
  return `'Sample ${field.caption}'`;
};

const seedData = [];
for (let i = 1; i <= 5; i++) {
  const record = [];
  for (const field of table.fields) {
    if (field.isprimarykey && field.isautoinc) continue;
    record.push(`'${field.name}' => ${getSampleValue(field, i)}`);
  }
  seedData.push(`[\n                ${record.join(',\n                ')}\n            ]`);
}

const seeder = `<?php

namespace Database\\Seeders;

use Illuminate\\Database\\Seeder;
use Illuminate\\Support\\Facades\\DB;

class ${modelName}Seeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('${table.tablename}')->insert([
            ${seedData.join(',\n            ')}
        ]);
    }
}
`;

return seeder;
{:codeend:}
```

---

## Example 7: GraphQL Schema Definition

Generate a GraphQL schema (SDL) for your table.

```javascript
{:code:}
const table = gtree.project.tables[0];
const typeName = table.tablename
  .split('_')
  .map(w => w.charAt(0).toUpperCase() + w.slice(1))
  .join('');

const graphqlTypeMap = {
  'BIGINT': 'Int!',
  'INT': 'Int!',
  'VARCHAR': 'String!',
  'TEXT': 'String!',
  'BOOLEAN': 'Boolean!',
  'DATETIME': 'DateTime!',
  'DATE': 'Date!',
  'DECIMAL': 'Float!',
  'JSON': 'JSON!'
};

// Build type definition
const typeFields = [];
for (const field of table.fields) {
  const graphqlType = graphqlTypeMap[field.type] || 'String!';
  const actualType = field.isnullable ? graphqlType.replace('!', '') : graphqlType;
  typeFields.push(`  ${field.camelcase}: ${actualType}`);
}

const createInputFields = table.fields
  .filter(f => !f.isprimarykey && !f.name.includes('_at'))
  .map(f => {
    const graphqlType = graphqlTypeMap[f.type] || 'String!';
    const actualType = f.isnullable ? graphqlType.replace('!', '') : graphqlType;
    return `  ${f.camelcase}: ${actualType}`;
  });

const schema = `# Auto-generated GraphQL Schema

"""
${typeName} type
"""
type ${typeName} {
${typeFields.join('\n')}
}

"""
${typeName}Create input
"""
input ${typeName}CreateInput {
${createInputFields.join('\n')}
}

"""
${typeName}Update input
"""
input ${typeName}UpdateInput {
${createInputFields.map(f => f.replace(': ', ': ')).join('\n')}
}

type Query {
  ${table.tablename}(id: Int!): ${typeName}
  all${typeName}(limit: Int, offset: Int): [${typeName}!]!
}

type Mutation {
  create${typeName}(input: ${typeName}CreateInput!): ${typeName}!
  update${typeName}(id: Int!, input: ${typeName}UpdateInput!): ${typeName}!
  delete${typeName}(id: Int!): Boolean!
}
`;

return schema;
{:codeend:}
```

---

## Example 8: Prisma Schema

Generate Prisma ORM schema definition.

```javascript
{:code:}
const table = gtree.project.tables[0];
const modelName = table.tablename
  .split('_')
  .map(w => w.charAt(0).toUpperCase() + w.slice(1))
  .join('');

const prismaTypeMap = {
  'BIGINT': 'BigInt',
  'INT': 'Int',
  'VARCHAR': 'String',
  'TEXT': 'String',
  'BOOLEAN': 'Boolean',
  'DATETIME': 'DateTime',
  'DATE': 'DateTime',
  'DECIMAL': 'Decimal',
  'JSON': 'Json'
};

const fields = [];
for (const field of table.fields) {
  const prismaType = prismaTypeMap[field.type] || 'String';
  const optional = field.isnullable ? '?' : '';
  
  let attributes = [];
  if (field.isprimarykey) attributes.push('@id');
  if (field.isautoinc) attributes.push('@default(autoincrement())');
  if (field.isunique && !field.isprimarykey) attributes.push('@unique');
  
  const attrString = attributes.length > 0 ? ` ${attributes.join(' ')}` : '';
  
  fields.push(`  ${field.camelcase} ${prismaType}${optional}${attrString}`);
}

// Add relationships
for (const field of table.fields) {
  if (field.isforeignkey) {
    const relatedModel = field.linktable
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join('');
    
    const relationshipName = field.linktable;
    fields.push(`  ${relationshipName} ${relatedModel} @relation(fields: [${field.name}], references: [${field.linkfield}])`);
  }
}

// Add timestamps if not already present
const hasCreatedAt = table.fields.some(f => f.name === 'created_at');
const hasUpdatedAt = table.fields.some(f => f.name === 'updated_at');

if (!hasCreatedAt) fields.push(`  createdAt DateTime @default(now())`);
if (!hasUpdatedAt) fields.push(`  updatedAt DateTime @updatedAt`);

const schema = `model ${modelName} {
${fields.join('\n')}

  @@table("${table.tablename}")
}
`;

return schema;
{:codeend:}
```

---

## Example 9: Complete API Request/Response Documentation

Generate API documentation with request and response examples.

```javascript
{:code:}
const table = gtree.project.tables[0];
const resourceName = table.tablename;
const modelName = table.tablename
  .split('_')
  .map(w => w.charAt(0).toUpperCase() + w.slice(1))
  .join('');

// Create sample response object
const sampleResponse = {};
for (const field of table.fields) {
  if (field.type === 'BIGINT' || field.type === 'INT') {
    sampleResponse[field.camelcase] = 1;
  } else if (field.type === 'BOOLEAN') {
    sampleResponse[field.camelcase] = true;
  } else if (field.type === 'DATETIME' || field.type === 'DATE') {
    sampleResponse[field.camelcase] = '2024-01-15T10:30:00Z';
  } else {
    sampleResponse[field.camelcase] = `Sample ${field.caption}`;
  }
}

const doc = `# ${modelName} API Documentation

## Endpoints

### GET /${resourceName}
Get all ${resourceName}

**Query Parameters:**
- \`limit\`: Number of records (default: 20)
- \`offset\`: Starting position (default: 0)

**Response:**
\`\`\`json
{
  "data": [
    ${JSON.stringify(sampleResponse, null, 4)}
  ],
  "total": 100,
  "page": 1
}
\`\`\`

### GET /${resourceName}/:id
Get a single ${resourceName} by ID

**Response:**
\`\`\`json
{
  "data": ${JSON.stringify(sampleResponse, null, 2)}
}
\`\`\`

### POST /${resourceName}
Create a new ${resourceName}

**Request Body:**
\`\`\`json
{
  ${table.fields
    .filter(f => !f.isprimarykey && !f.name.includes('_at'))
    .map(f => `"${f.camelcase}": "${f.caption} value"`)
    .join(',\n  ')}
}
\`\`\`

**Response:**
\`\`\`json
{
  "data": ${JSON.stringify(sampleResponse, null, 2)}
}
\`\`\`

### PUT /${resourceName}/:id
Update an existing ${resourceName}

**Request Body:**
Same as POST (all fields optional)

**Response:**
\`\`\`json
{
  "data": ${JSON.stringify(sampleResponse, null, 2)}
}
\`\`\`

### DELETE /${resourceName}/:id
Delete a ${resourceName}

**Response:**
\`\`\`
204 No Content
\`\`\`

## Error Responses

\`\`\`json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-15T10:30:00Z"
}
\`\`\`

## Field Descriptions

${table.fields.map(f => `- **${f.camelcase}** (${f.type}): ${f.caption}${f.isnullable ? ' (optional)' : ' (required)'}`).join('\n')}
`;

return doc;
{:codeend:}
```

---

## Example 10: Complete Authentication Controller (Laravel)

Generate a complete auth controller with registration, login, and logout.

```javascript
{:code:}
const userTable = gtree.project.tables.find(t => t.tablename === 'users');
if (!userTable) return "// Users table not found";

const model = 'User';

const controller = `<?php

namespace App\\Http\\Controllers;

use App\\Models\\${model};
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Hash;
use Illuminate\\Support\\Facades\\Validator;

class AuthController extends Controller
{
    /**
     * User registration
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|unique:users',
            'password' => 'required|min:8|confirmed',
            'first_name' => 'required|string',
            'last_name' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = ${model}::create([
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'first_name' => $request->first_name,
            'last_name' => $request->last_name
        ]);

        return response()->json(['message' => 'User registered successfully', 'data' => $user], 201);
    }

    /**
     * User login
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = ${model}::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'token' => $token,
            'user' => $user
        ]);
    }

    /**
     * User logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    /**
     * Get authenticated user
     */
    public function profile(Request $request)
    {
        return response()->json(['user' => $request->user()]);
    }
}
`;

return controller;
{:codeend:}
```

---

## Tips for Writing Powerful Templates

:::tip Start Simple, Build Complex
Begin with accessing single properties, then nest loops, then add conditionals. Test each level before combining.
:::

:::info Use Helper Functions
Break repetitive logic into smaller functions for reusability:

```javascript
const toPascalCase = (str) =>
  str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
const toCamelCase = (str) =>
  str.charAt(0).toLowerCase() + toPascalCase(str).slice(1);
```
:::

:::tip Comment Your Code
When templates get complex, add comments explaining what each section does:

```javascript
{:code:}
// Get the first table
const table = gtree.project.tables[0];

// Filter non-primary-key fields
const fields = table.fields.filter(f => !f.isprimarykey);

// Generate field list
const fieldList = fields.map(f => f.name).join(', ');
{:codeend:}
```
:::

:::caution Handle Edge Cases
Always check for empty arrays and missing properties:

```javascript
const fields = table.fields || [];
if (fields.length === 0) return "// No fields found";
```
:::

---

## Next Steps

- **[Field-Level Data](./field-level.md)** — Complete field reference
- **[Constraints and Relationships](./constraint-level.md)** — Understanding relationships
- **[Overview](./overview.md)** — Gtree fundamentals

