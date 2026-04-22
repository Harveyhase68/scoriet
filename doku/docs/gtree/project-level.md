---
sidebar_position: 2
title: "Project-Level Data"
---

# Project-Level Data

The **project level** is the top layer of Gtree, containing all metadata about your Scoriet project. This includes the project name, identifier, database configuration, deployment settings, description, and language configuration.

All project-level data is stored in `gtree.project`.

## Project Properties Reference

### projectname

**Type**: `string`  
**Description**: The human-readable name of your project.

**Access in Templates**:
```
Project Name: {:projectname:}
```

**Access in JavaScript**:
```
{:code:}
const name = gtree.project.projectname;
return `Project: ${name}`;
{:codeend:}
```

**Example Values**:
- `"MyApp"`
- `"E-Commerce Platform"`
- `"Internal CRM System"`

**Use Case**: Perfect for generating project headers, README files, documentation, package names.

---

### projectid

**Type**: `number`  
**Description**: Unique numeric identifier for the project within Scoriet.

**Access in JavaScript**:
```
{:code:}
const projectId = gtree.project.projectid;
return `Project ID: ${projectId}`;
{:codeend:}
```

**Example Values**: `123`, `45678`, `1`

**Use Case**: Used internally for database references, API endpoints, file organization.

:::note
Template syntax does not provide direct access to `projectid`. Use JavaScript code blocks to access it.
:::

---

### projectdatabase

**Type**: `string`  
**Description**: The name of the primary database associated with this project.

**Access in Templates**:
```
Database: {:projectdatabase:}
```

**Access in JavaScript**:
```
{:code:}
const dbName = gtree.project.projectdatabase;
return `CREATE DATABASE ${dbName}`;
{:codeend:}
```

**Example Values**:
- `"myapp_db"`
- `"production_crm"`
- `"ecommerce_v2"`

**Use Case**: Generating database creation scripts, connection strings, Docker compose files, migration headers.

**Important**: This is the name of the database, not the connection string or credentials.

---

### projecturl

**Type**: `string`  
**Description**: The URL where the project is deployed or accessible.

**Access in Templates**:
```
Website: {:projecturl:}
```

**Access in JavaScript**:
```
{:code:}
const url = gtree.project.projecturl;
const apiBase = `${url}/api`;
return `API Base: ${apiBase}`;
{:codeend:}
```

**Example Values**:
- `"https://myapp.com"`
- `"https://staging.myapp.com"`
- `"http://localhost:8000"` (development)
- `"https://api.example.com"`

**Use Case**: Generating API documentation, environment configuration, deployment scripts, frontend API client configuration.

:::tip Including Protocol
Always include the protocol (`https://` or `http://`) in `projecturl`. This makes it ready for direct use in code generation.
:::

---

### projectdirectory

**Type**: `string`  
**Description**: The file system path where the project code is or will be located.

**Access in Templates**:
```
Project Directory: {:projectdirectory:}
```

**Access in JavaScript**:
```
{:code:}
const dir = gtree.project.projectdirectory;
const configPath = `${dir}/config/database.php`;
return configPath;
{:codeend:}
```

**Example Values**:
- `"/var/www/myapp"`
- `"C:\\Projects\\MyApp"` (Windows)
- `"/home/user/projects/myapp"`
- `"/opt/applications/crm"`

**Use Case**: Generating file paths, Docker volume mounts, deployment scripts, CI/CD pipeline configurations.

:::tip Path Format
The path format depends on your operating system. Windows paths use backslashes, Unix paths use forward slashes. Always use appropriate path separators in generated code.
:::

---

### projectdescription

**Type**: `string`  
**Description**: A longer description of what the project does.

**Access in Templates**:
```
Description: {:projectdescription:}
```

**Access in JavaScript**:
```
{:code:}
const desc = gtree.project.projectdescription;
return `/**\n * ${desc}\n */`;
{:codeend:}
```

**Example Values**:
- `"Customer relationship management system for small businesses"`
- `"Real-time inventory management platform with mobile app"`
- `"Internal HR and payroll management system"`

**Use Case**: Generating README files, documentation headers, code comments, application descriptions.

---

## Language Configuration

### lang

**Type**: `array` of language objects  
**Description**: Array of all languages configured for the project.

**Structure**:
```javascript
[
  {
    code: "en",
    name: "English",
    // Additional language properties...
  },
  {
    code: "de",
    name: "German",
    // Additional language properties...
  }
]
```

**Access in JavaScript**:
```
{:code:}
const languages = gtree.project.lang;
let output = "Supported Languages:\n";
for (const lang of languages) {
  output += `- ${lang.name} (${lang.code})\n`;
}
return output;
{:codeend:}
```

**Example Values**:
- Language with `code: "en"` and `name: "English"`
- Language with `code: "de"` and `name: "German"`
- Language with `code: "fr"` and `name: "French"`

**Use Case**: Generating multi-language configuration files, translation system setup, language-specific documentation.

---

### selectedlanguage

**Type**: `string`  
**Description**: The code of the currently selected language for template generation.

**Access in Templates**:
```
Current Language: {:selectedlanguage:}
```

**Access in JavaScript**:
```
{:code:}
const lang = gtree.project.selectedlanguage;
if (lang === "de") {
  return "Willkommen!";
} else if (lang === "en") {
  return "Welcome!";
}
{:codeend:}
```

**Example Values**: `"en"`, `"de"`, `"fr"`, etc.

**Use Case**: Making templates output language-specific text, comments, or documentation. Perfect for generating localized code comments or multi-language validation messages.

---

### selectedlanguageindex

**Type**: `number`  
**Description**: The zero-based index of the selected language in the `lang` array.

**Access in JavaScript**:
```
{:code:}
const langIndex = gtree.project.selectedlanguageindex;
const selectedLang = gtree.project.lang[langIndex];
return selectedLang.name;
{:codeend:}
```

**Example Values**: `0` (first language), `1` (second language), etc.

**Use Case**: Efficiently accessing language metadata without searching through the `lang` array.

:::note
This is useful when you need to retrieve other properties of the selected language beyond just the code.
:::

---

## Practical Examples

### Example 1: Generate a README Header

```
# {:projectname:}

{:projectdescription:}

**Website**: {:projecturl:}  
**Database**: {:projectdatabase:}  
**Installation Directory**: {:projectdirectory:}
```

### Example 2: Generate a Docker Compose Configuration

```
{:code:}
const project = gtree.project;
return `
version: '3.8'
services:
  app:
    image: myapp:latest
    environment:
      APP_NAME: ${project.projectname}
      DATABASE_NAME: ${project.projectdatabase}
      APP_URL: ${project.projecturl}
    volumes:
      - ${project.projectdirectory}:/app
`;
{:codeend:}
```

### Example 3: Generate Environment Configuration

```
{:code:}
const project = gtree.project;
return `
APP_NAME=${project.projectname}
APP_URL=${project.projecturl}
DB_DATABASE=${project.projectdatabase}
PROJECT_PATH=${project.projectdirectory}
ENVIRONMENT=development
`;
{:codeend:}
```

### Example 4: Language-Aware Code Comments

```
{:code:}
const lang = gtree.project.selectedlanguage;
const comments = {
  de: "// Dies ist eine automatisch generierte Datei",
  en: "// This is an automatically generated file",
  fr: "// Ceci est un fichier généré automatiquement"
};
const comment = comments[lang] || comments.en;
return comment;
{:codeend:}
```

### Example 5: Generate API Base Configuration

```
{:code:}
const baseUrl = gtree.project.projecturl;
const dbName = gtree.project.projectdatabase;
const projectName = gtree.project.projectname;

return `
const API_CONFIG = {
  baseUrl: '${baseUrl}',
  version: 'v1',
  database: '${dbName}',
  projectName: '${projectName}',
  headers: {
    'Content-Type': 'application/json',
    'X-Project': '${projectName}'
  }
};

export default API_CONFIG;
`;
{:codeend:}
```

### Example 6: Generate Installation Script

```
{:code:}
const project = gtree.project;
return `
#!/bin/bash

PROJECT_NAME="${project.projectname}"
PROJECT_DIR="${project.projectdirectory}"
DATABASE="${project.projectdatabase}"
APP_URL="${project.projecturl}"

echo "Installing $PROJECT_NAME..."
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

# Create database
mysql -u root -ppassword -e "CREATE DATABASE IF NOT EXISTS $DATABASE;"

# Initialize app
composer install
npm install
cp .env.example .env

echo "Installation complete!"
`;
{:codeend:}
```

---

## Access Patterns Summary

| Property | Type | Template Access | JS Access | Best For |
|----------|------|-----------------|-----------|----------|
| `projectname` | string | Yes (`{:projectname:}`) | `gtree.project.projectname` | Titles, headers, README |
| `projectid` | number | No | `gtree.project.projectid` | Internal references |
| `projectdatabase` | string | Yes (`{:projectdatabase:}`) | `gtree.project.projectdatabase` | DB scripts, connections |
| `projecturl` | string | Yes (`{:projecturl:}`) | `gtree.project.projecturl` | API configs, docs |
| `projectdirectory` | string | Yes (`{:projectdirectory:}`) | `gtree.project.projectdirectory` | File paths, deployment |
| `projectdescription` | string | Yes (`{:projectdescription:}`) | `gtree.project.projectdescription` | Documentation, comments |
| `lang` | array | No | `gtree.project.lang` | Iterating languages |
| `selectedlanguage` | string | Yes (`{:selectedlanguage:}`) | `gtree.project.selectedlanguage` | Conditional logic |
| `selectedlanguageindex` | number | No | `gtree.project.selectedlanguageindex` | Direct indexing |

---

## Tips & Best Practices

:::tip Use Project Data for Configuration
Project-level data is perfect for generating configuration files that apply to your entire project. Keep templates flexible by referencing this data instead of hardcoding values.
:::

:::info Language-Specific Generation
Use `selectedlanguage` to generate different output for different languages. This is especially useful for:
- Code comments
- Documentation
- Validation messages
- Error messages
- UI labels
:::

:::caution Empty Values
While most project properties are mandatory, always check that values are populated before using them. Some fields might be empty strings if not configured.
:::

## Next Steps

- **[Table-Level Data](./table-level.md)** — Learn about tables and their properties
- **[Field-Level Data](./field-level.md)** — Complete reference for field properties
- **[Practical Examples](./practical-examples.md)** — Real-world generation examples

