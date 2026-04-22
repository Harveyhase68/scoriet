---
sidebar_position: 3
---

# Project Settings

Project Settings let you configure every aspect of your Scoriet project: database connections, file output locations, team access, default languages, and more. Access settings anytime to fine-tune your project.

## Accessing Settings

1. **Open your project** in Scoriet
2. **Click Settings** in top navigation bar
3. **Project settings panel opens** on the right or in a new panel

<div class="screenshot-placeholder">Screenshot: Project settings panel — <code>project-settings-panel.png</code></div>

Alternatively:

- **Right-click project** in sidebar → Select "Settings"
- **Click Settings icon** next to project name in breadcrumb

## General Settings

These are the foundational project details.

### Project Name

- **Current name** shown and editable
- **Used everywhere** - Sidebar, navigation, team views
- **Rename anytime** - No impact on data or generated code
- **Special characters OK** - Use symbols like hyphens, underscores, dots

:::info
Changing the project name doesn't affect any generated code, schemas, or templates. It's purely cosmetic.
:::

### Project Description

- **Optional field** describing project purpose
- **Visible in project list** to team members
- **Helps team understand** what the project generates
- **Update whenever needs change** - Keep current for new team members

### Project Status

Mark project status for team visibility:

| Status | Meaning | Shows |
|--------|---------|-------|
| **Active** | Currently in development | Full visibility, available for work |
| **Archived** | No longer in use | Grayed out in lists, read-only |
| **On Hold** | Temporarily paused | Still visible but marked as paused |
| **Completed** | Project finished | Archived state, reference only |

:::tip
Archive projects that are no longer active. This keeps your project list clean while preserving project data for reference.
:::

### Project Visibility

Control who can see and access this project:

| Setting | Access Level | Who Sees It |
|---------|--------------|------------|
| **Private** | Owner + assigned members only | Only explicit team members |
| **Internal** | Entire organization | All organization members |
| **Public** | Anyone with link | Anyone, no login required |

:::caution
Keep projects Private by default. Only make Internal or Public if explicitly needed.
:::

## Database Settings

Configure database connections for schema parsing and code generation.

### Connected Databases

List shows all databases connected to this project:

- **Database Name** - Identifier for this connection
- **Type** - MySQL, PostgreSQL, SQLite, or SQL Server
- **Server** - Host address and port
- **Status** - Connected, Disconnected, or Error

### Adding a Database

1. **Click Add Database** button
2. **Choose database type**
3. **Enter connection details**:
   ```
   Server: 10.0.0.8 (use IP, not localhost)
   Port: 3306 (MySQL), 5432 (PostgreSQL), etc.
   Username: root
   Password: ****
   Database: schema_name
   ```
4. **Test Connection** - Ensures credentials work
5. **Click Save**

### Managing Databases

For each database, you can:

- **Test Connection** - Verify it's still reachable
- **Update Credentials** - Change username, password, or connection details
- **Refresh Schema** - Re-scan tables and fields from live database
- **Remove** - Disconnect this database from project

:::tip
For production databases, use read-only credentials. This prevents accidental modifications and improves security.
:::

### Default Database

When multiple databases exist:

- **Mark one as default** - Used when templates don't specify which database
- **Templates can override** - Specify which database for specific generation tasks
- **Change anytime** - Default database selection is flexible

:::info
On Windows, use IP address `10.0.0.8` instead of `localhost` for local MySQL connections.
:::

## Languages and Frameworks

Configure which programming languages your project uses.

### Available Languages

Select one or more languages:

- **PHP** (5.7, 8.0, 8.1, 8.2)
- **JavaScript/TypeScript** (ES6, ES2020, ES2022, TypeScript 4.x/5.x)
- **Python** (3.7, 3.8, 3.9, 3.10, 3.11)
- **Java** (11, 17, 21)
- **C#** (.NET 6, .NET 7, .NET 8)
- **Go** (1.13, 1.20+)
- **Rust** (1.56+)
- Plus others...

### Selecting Languages

1. **Go to Languages** section in settings
2. **Check languages** you use in this project
3. **Choose version** for each language
4. **Select default framework** (if applicable)

### Default Language

Choose primary language for this project:

- **Used when template doesn't specify language**
- **Influences code style** in generated output
- **Typical choices**: 
  - Backend projects: PHP, Python, Java
  - Frontend projects: JavaScript, TypeScript
  - Full-stack: Choose backend as default

### Framework Configuration

For each language, specify frameworks:

| Language | Framework Options |
|----------|-------------------|
| **PHP** | Laravel, Symfony, Slim, Zend, CakePHP |
| **JavaScript** | Express, NestJS, Hapi, Fastify |
| **Python** | Django, Flask, FastAPI, Tornado |
| **Java** | Spring Boot, Quarkus, Micronaut, Jakarta EE |
| **C#** | ASP.NET Core, NancyFx, ServiceStack |

Selected frameworks influence:
- Generated code structure
- Import statements
- Naming conventions
- Configuration patterns

### Code Style Settings

Configure code formatting preferences:

| Setting | Options | Affects |
|---------|---------|---------|
| **Indentation** | Spaces (2/4/8) or Tabs | Generated code formatting |
| **Line Length** | 80, 100, 120, 140 characters | Code line wrapping |
| **Naming Convention** | camelCase, snake_case, PascalCase | Variable and function names |
| **Quotes** | Single or double quotes | String literals in code |

:::tip
Align code style settings with your team's existing style guide. Consistency makes code reviews easier.
:::

## Output Directory

Configure where generated code is saved.

### Local Output Directory

Path where code is generated on your computer:

```
Windows: C:\Projects\MyApp\generated\
Linux:   /home/user/projects/myapp/generated/
Mac:     /Users/user/projects/myapp/generated/
```

**Features**:
- Generate code directly to project folder
- Version control generated code
- Configure per-environment (dev, staging, production)

### Remote Output Directory (Enterprise)

For team collaboration:

- **Cloud storage** - AWS S3, Google Cloud Storage
- **Network share** - NFS, SMB shares
- **FTP/SFTP** - Remote server access

Setup remote output:
1. **Click Remote Output**
2. **Choose storage type**
3. **Enter credentials**
4. **Test connection**
5. **Set as default or per-environment**

:::info
Use local output for development, remote output for shared team environments.
:::

### Environment-Specific Output

Configure different output directories per environment:

**Development**:
```
Output: ./generated/dev/
```

**Staging**:
```
Output: ./generated/staging/
```

**Production**:
```
Output: ./generated/production/
```

When generating code, choose environment to use correct output directory.

## Template Settings

Manage code generation templates in this project.

### Assigned Templates

See all templates currently in this project:

- **Template Name** - Identifier and description
- **Language** - Which language it generates
- **Status** - Active, Inactive, or Draft
- **Last Modified** - When template was last edited
- **Assigned To** - Which tables or schemas it applies to

### Enable/Disable Templates

- **Check box** to enable template for generation
- **Uncheck** to disable without deleting
- **Disabled templates** don't appear in generation menu

### Template Assignment

Assign templates to specific tables:

1. **Click template name**
2. **See assignment options**:
   - "All Tables" - Applies to every table
   - "Specific Tables" - Choose individual tables
   - "None" - Template is available but not auto-assigned
3. **Update assignment** - Changes take effect immediately

:::info
When generating code, Scoriet uses assigned templates automatically. Unassigned templates are available but must be selected manually.
:::

### Template Import/Export

**Import templates from other projects**:
1. **Click Import Template**
2. **Choose another project's template**
3. **Template is copied to this project**

**Export templates for sharing**:
1. **Click Export**
2. **Select templates to export**
3. **Download file**
4. **Share with team or other projects**

## Team and Access

Manage who can access and work on this project.

### Team Members

See all people with access:

| Member | Role | Permissions | Status |
|--------|------|-------------|--------|
| Your Name | Owner | Full control | Active |
| Jane Doe | Editor | Create/edit, can't delete | Active |
| John Smith | Viewer | View only | Pending |

### Adding Team Members

1. **Click Add Member**
2. **Search for user** by name or email
3. **Select their role**:
   - **Owner** - Full control (delete, archive, settings)
   - **Editor** - Can create and modify content
   - **Viewer** - View only, can't modify
4. **Click Invite**

### Member Roles Explained

| Role | Can View | Can Create | Can Edit | Can Delete | Can Configure |
|------|----------|-----------|----------|-----------|---------------|
| **Owner** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Editor** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Viewer** | ✅ | ❌ | ❌ | ❌ | ❌ |

### Changing Roles

1. **Click member name**
2. **Select new role** from dropdown
3. **Update saves immediately**

### Removing Members

1. **Click member name**
2. **Click Remove Member**
3. **Confirm removal** - They lose project access

:::caution
Removing members is permanent. Ensure you have backups if removing contributors.
:::

## Advanced Settings

Additional configuration for power users.

### Environment Variables

Set variables used during code generation:

```
APP_ENV=production
API_BASE_URL=https://api.example.com
DATABASE_HOST=db.example.com
```

**Usage in templates**:
- Reference as `{:env.APP_ENV:}` in template code
- Variables accessible to all templates in project
- Environment-specific values (dev, staging, prod)

### Code Generation Options

Fine-tune generation behavior:

| Option | Effect |
|--------|--------|
| **Auto-format generated code** | Apply code style rules to output |
| **Include comments** | Add documentation in generated code |
| **Create backup** | Keep previous version before overwriting |
| **Validate syntax** | Check generated code for errors |
| **Minify output** | Reduce file size for production |

### Hooks and Scripts

Run custom scripts during code generation:

- **Pre-generation hook** - Run before generating code
- **Post-generation hook** - Run after generation completes
- **Validation script** - Check generated code quality

:::info
Hooks are for advanced users. See [Advanced Configuration](../../advanced/custom-hooks.md) for examples.
:::

### API Keys and Secrets

Manage authentication for external services:

- **GitHub token** - For repository integration
- **API keys** - For third-party services
- **Credentials** - Encrypted and never exposed

**Security**:
- Stored encrypted
- Never shown in plaintext
- Only accessible to project members
- Rotated regularly

:::caution
Always use environment variables for secrets, never hardcode them in templates.
:::

## Backup and Export

Preserve project configuration and data.

### Export Project

Download complete project package:

1. **Click Export**
2. **Choose what to export**:
   - Schemas and tables
   - Templates only
   - Complete project
3. **Select format**: ZIP or JSON
4. **Download** - Ready to share or backup

### Import Project

Restore or merge another project:

1. **Click Import**
2. **Select file** (ZIP or JSON)
3. **Choose merge strategy**:
   - Replace - Overwrite existing items
   - Merge - Combine with current items
   - Skip conflicts - Keep both versions
4. **Review changes** and confirm

### Automatic Backups

Scoriet creates backups:
- **Daily** - Automatic backup of all projects
- **On major changes** - Before big operations
- **Retention** - Keep 30 days of backups

Access backups: **Settings > Backup > Manage Backups**

## Resetting Project

For troubleshooting or cleanup:

### Reset to Default Settings

1. **Settings > Advanced > Reset Settings**
2. **Choose what to reset**:
   - Database connections only
   - Code style settings only
   - Templates
   - All settings
3. **Confirm reset**

:::caution
Resetting cannot be undone. Export first if unsure.
:::

### Clear Generated Files

1. **Settings > Advanced > Clear Generated Files**
2. **This removes**:
   - Generated code files
   - Preview cache
   - Build artifacts
3. **Doesn't affect**: Schemas, templates, or settings

:::info
Safe to clear anytime. Generated code can be recreated.
:::

## Best Practices for Settings

### Regular Configuration Review

Monthly, check these settings:
- ✓ Database connection credentials (still valid?)
- ✓ Team members (up to date?)
- ✓ Output directories (correct paths?)
- ✓ Language versions (still supported?)

### Consistent Naming

Keep project names consistent across:
- Project name
- Repository name (if using Git)
- Output directory
- Team organization

Example:
```
Project: "e-commerce-api"
Repo: "e-commerce-api"
Output: ./generated/e-commerce-api/
Team: "Backend Team"
```

### Document Decisions

In project description, document:
- Why this project exists
- Which systems it generates code for
- Any special configuration notes
- Team contact person

### Security Best Practices

- Keep credentials in environment variables, never in templates
- Use read-only database accounts when possible
- Rotate API keys regularly
- Archive completed projects
- Remove team members when they leave

---

**Related Topics:**
- [Create a Project](create-project.md)
- [Git Integration](git-integration.md)
- [Team Collaboration](../../collaboration/teams.md)
- [Advanced Configuration](../../advanced/custom-hooks.md)
