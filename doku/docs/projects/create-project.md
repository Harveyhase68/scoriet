---
sidebar_position: 2
---

# Creating a Project

This guide walks you through creating a new project in Scoriet step-by-step. A project is where you organize schemas, templates, and settings for code generation.

## Before You Start

Gather this information:

- **Project name** - What you'll call this project (e.g., "E-Commerce API")
- **Team** - Which team owns this project (or "Personal" if solo)
- **Description** - Brief description of what the project builds
- **Database type** - MySQL, PostgreSQL, SQLite, or SQL Server
- **Database credentials** - Server, username, password (if using existing database)

:::tip
Don't worry if you don't have everything ready yet. Most settings can be changed after project creation.
:::

## Step-by-Step Creation

### Method 1: From Projects Dashboard

1. **Click Projects** in the top navigation bar
2. **Click Create New Project** button (usually top-right)
3. Continue to [Project Details](#project-details) below

### Method 2: From Home Page

1. **Click Home** to go to dashboard
2. **Click New Project** in the welcome area
3. Continue to [Project Details](#project-details) below

### Method 3: Using Quick Create

1. **Click Create +** in top navigation
2. **Select New Project** from dropdown
3. Continue to [Project Details](#project-details) below

<div class="screenshot-placeholder">Screenshot: Create Project button in projects dashboard — <code>create-project-button.png</code></div>

## Project Details

This is the first section of the creation form. Fill in basic project information.

### Project Name

- **What it is** - The name users will see for this project
- **Format** - Any name, typically: "[AppName] [Environment]"
- **Examples**:
  - "E-Commerce Platform - API"
  - "Customer Portal"
  - "Admin Dashboard"
  - "Mobile App Backend"

:::info
Project names should be descriptive enough that you recognize them in a list of projects.
:::

### Team Assignment

- **What it is** - Which team owns this project
- **Options**:
  - Select existing team from dropdown
  - Create new team (click "New Team")
  - "Personal" for solo projects

:::tip
Teams help organize projects by department or product group. If you're the only person working on this, use your personal team.
:::

### Description

- **What it is** - Purpose and scope of the project
- **Optional** - You can add/edit this later
- **Examples**:
  - "REST API for e-commerce platform with product, order, and customer management"
  - "React admin interface for managing users and permissions"
  - "Code generation for our microservices architecture"

### Visibility

- **Private** - Only you and assigned team members can see it
- **Internal** - Visible to entire organization
- **Public** - Anyone with the link can view it (but not edit)

:::caution
Always keep projects Private unless you have a specific reason to make them visible to others. This protects sensitive database schemas and templates.
:::

## Database Configuration

This section connects your project to a database.

### Step 1: Choose Database Type

Select the database system you're using:

| Type | When to Use | Versions |
|------|------------|----------|
| **MySQL** | Most common, well-supported | 5.7, 8.0, 8.1 |
| **PostgreSQL** | Advanced features, JSON support | 10.0 - 15.0+ |
| **SQLite** | Local testing, mobile apps | 3.37+ |
| **SQL Server** | Enterprise environments | 2019, 2022 |

### Step 2: Connection Details

Fill in how to connect to your database:

#### For MySQL/PostgreSQL/SQL Server:

```
Server Address: 127.0.0.1 (or your server IP/hostname)
Port: 3306 (MySQL), 5432 (PostgreSQL), 1433 (SQL Server)
Username: root or your username
Password: your_password
Database Name: myapp (optional, specify which database)
```

#### For SQLite:

```
File Path: /path/to/database.db
```

:::tip
On Windows with local MySQL, use `10.0.0.8` instead of `localhost`. Scoriet works better with IP addresses than hostnames.
:::

### Step 3: Test Connection

After filling credentials:

1. **Click Test Connection** button
2. **Wait for result** - Usually completes in 1-2 seconds
3. **See confirmation** - "Connection successful!" message appears

:::caution
If connection fails, check:
- Server is running and accessible
- Username and password are correct
- Database name is spelled correctly
- Firewall isn't blocking the port
- Server address is correct (not localhost, try IP address)
:::

### Step 4: Import Database (Optional)

After successful connection:

- **Import existing schema** - Scoriet scans your database and imports tables, fields, constraints
- **Start with empty schema** - Create tables manually later

:::info
You can import the schema now or skip it and import later from project settings. Both work equally well.
:::

## Template Selection

Choose which code generation templates to include in your new project.

### Available Template Categories

| Category | Templates | Use When |
|----------|-----------|----------|
| **API Templates** | REST API, GraphQL, SOAP | Building APIs |
| **Web Templates** | React, Vue, Angular components | Web frontend |
| **Mobile Templates** | React Native, Flutter models | Mobile apps |
| **Documentation** | API docs, schema docs | Need documentation |
| **Database** | Migrations, schema dumps | Database management |
| **Full Stack** | Complete API + Frontend | Full-stack projects |

### Selecting Templates

1. **See available templates** organized by category
2. **Check templates you want** to include
3. **Deselect others** to keep project clean
4. **View template preview** (click template name) to see what it does

:::tip
Start with just a few templates. You can add more later without recreating the project. It's better to start minimal than to have unused templates cluttering your project.
:::

### Template Assignment

After selecting templates, choose which table types they apply to:

- **Assign to "All Tables"** - Template generates for every table
- **Assign to specific tables** - Choose which tables use this template
- **Skip for now** - Assign templates later in project settings

:::info
Template assignments can be changed anytime in project settings without affecting the project itself.
:::

## Language Configuration

Configure programming languages your project will use.

### Available Languages

Select which languages you'll generate code for:

- PHP (5.7 - 8.2)
- JavaScript/TypeScript
- Python (3.7 - 3.11)
- Java (11 - 21)
- C# (.NET 6+)
- Go (1.13+)
- Rust (1.56+)
- Others...

### Default Language

Choose one language as the default:

- Used when no specific language is requested
- Applies to templates that don't specify language
- Can be changed later in settings

:::tip
If building a full-stack project, set your primary language (e.g., PHP for backend) as default.
:::

### Framework and Libraries

For each language, specify frameworks:

| Language | Framework Options |
|----------|-------------------|
| **PHP** | Laravel, Symfony, Slim, CodeIgniter |
| **JavaScript** | Express, NestJS, FastAPI alternatives |
| **Python** | Django, Flask, FastAPI |
| **Java** | Spring Boot, Quarkus, Micronaut |

These influence code generation style and output structure.

## Review and Create

Before creating, review all settings:

| Section | Check |
|---------|-------|
| **Project Details** | Name, team, description correct? |
| **Database** | Connection working? Right database? |
| **Templates** | Selected appropriate templates? |
| **Languages** | Correct languages for your project? |

### Creating the Project

1. **Review settings one more time**
2. **Click Create Project** button
3. **Wait for creation** (usually 5-10 seconds)

<div class="screenshot-placeholder">Screenshot: Create Project confirmation dialog — <code>create-project-confirm.png</code></div>

### After Creation

The project is created and ready to use:

- ✅ Project appears in your Projects list
- ✅ You're automatically taken to the new project workspace
- ✅ Sidebar shows project structure (schemas, templates, languages)
- ✅ You can immediately start working

## Next Steps After Creation

### 1. Import Database Schema (if not already done)

1. **Settings > Database > Manage Schemas**
2. **Click Import Schema**
3. **Select tables to import**
4. **Review imported tables and fields**

### 2. Create Your First Template

1. **Click Create + > New Template**
2. **Name your template** (e.g., "Laravel Migration")
3. **Choose template type** (code generation template)
4. **Write template code** with placeholders like `{:table.name:}`
5. **Test with a table** to see generated output

See [Creating Templates](../templates/create-template.md) for detailed guide.

### 3. Configure Team Access

1. **Settings > Team > Members**
2. **Invite team members** who should access this project
3. **Set their roles** (Owner, Editor, Viewer)

### 4. Set Up Git Integration (Optional)

1. **Settings > Repository**
2. **Connect GitHub or GitLab**
3. **Enable auto-commit** for generated code

See [Git Integration](git-integration.md) for detailed setup.

## Troubleshooting Creation

### Can't See Create Button

**Solution**: 
- Make sure you're logged in
- Check that you have project creation permissions
- Try accessing from Projects dashboard instead

### Database Connection Fails

**Solutions**:
- Use IP address instead of `localhost` (try `10.0.0.8` on Windows)
- Check database server is running
- Verify username, password, and database name
- Confirm firewall allows connection to database port
- Try connecting from another tool (MySQL Workbench, pgAdmin) to confirm credentials

### Templates Not Loading

**Solution**:
- Skip template selection for now
- Create project without templates
- Add templates later from project settings

### Project Creation Hangs

**Solution**:
- Wait up to 30 seconds (database import can take time)
- If it doesn't complete, refresh the page
- Try creating a project without importing database schema first

## Best Practices

### Project Naming

```
✅ "E-Commerce API - Production"
✅ "Customer Portal - React"
✅ "Admin Dashboard - Internal"

❌ "Project1"
❌ "Code"
❌ "Test"
```

### Initial Setup

1. **Create with minimal templates first** - Add more later
2. **Test database connection carefully** - Ensures smooth start
3. **Use clear language selections** - Aligns template generation
4. **Document purpose in description** - Helps team understand project scope

### Team Organization

- Create separate projects for different environments (dev, staging, prod)
- Use team names matching your organizational structure
- Assign projects to appropriate teams during creation

---

**Next Steps:**
- [Configure Project Settings](project-settings.md)
- [Import Database Schemas](../databases/import-schema.md)
- [Create Code Templates](../templates/create-template.md)
- [Set Up Team Collaboration](../../collaboration/teams.md)
