---
sidebar_position: 1
title: "Scoriet CLI"
---

# Scoriet CLI

The **Scoriet Command Line Interface (CLI)** is a powerful tool for automation, batch operations, and integrating Scoriet code generation into your development workflow. It allows you to generate code directly from the command line, integrate with CI/CD pipelines, and automate repetitive tasks.

## What is the Scoriet CLI?

The Scoriet CLI is a standalone command-line application that allows you to:

- **Generate code programmatically** — Run templates without the web UI
- **Batch operations** — Generate code for multiple projects at once
- **CI/CD integration** — Automate code generation in build pipelines
- **Script automation** — Use in shell scripts and automation tools
- **Local execution** — Generate code locally on your machine
- **Offline usage** — Works with cached projects (with appropriate configuration)

:::info Perfect For
- **DevOps teams** automating code generation in pipelines
- **Microservices** requiring consistent code generation
- **CI/CD workflows** integrating code generation as build steps
- **Local development** faster iteration without web UI
- **Batch operations** generating for many projects at once
:::

## Installation

### Prerequisites

- Node.js 18+ or Python 3.8+
- Internet connection (for initial authentication)
- Valid Scoriet account

### Install via npm (Recommended)

```bash
npm install -g @scoriet/cli
```

Verify installation:
```bash
scoriet --version
```

### Install via Homebrew (macOS)

```bash
brew install scoriet/cli/scoriet
```

### Install via pip (Python)

```bash
pip install scoriet-cli
```

### Build from Source

```bash
git clone https://github.com/scoriet/cli.git
cd cli
npm install
npm run build
npm link
```

## Initial Setup

### Step 1: Authenticate

```bash
scoriet auth login
```

This opens your browser to authenticate with Scoriet. After successful login, your credentials are saved locally.

### Step 2: Verify Authentication

```bash
scoriet auth status
```

Shows your logged-in user and available teams.

### Step 3: List Projects

```bash
scoriet project list
```

Shows all projects you have access to.

## Core Commands

### Authentication

#### `scoriet auth login`
Authenticate with Scoriet using OAuth.

```bash
scoriet auth login
# Opens browser for authentication
# Saves credentials to ~/.scoriet/config.json
```

#### `scoriet auth logout`
Remove stored credentials.

```bash
scoriet auth logout
```

#### `scoriet auth status`
Check current authentication status.

```bash
scoriet auth status
# Output:
# User: john@example.com
# Teams: Backend Team, Frontend Team
# Authenticated: true
```

---

### Projects

#### `scoriet project list`
List all projects you can access.

```bash
scoriet project list
scoriet project list --team "Backend Team"
scoriet project list --format json
```

**Options**:
- `--team <name>` — Filter by team name
- `--format <format>` — Output format: json, table (default: table)
- `--limit <n>` — Limit number of results
- `--search <query>` — Search by project name

**Output**:
```
Project Name          Team              Created      Status
─────────────────────────────────────────────────────────────
API Service           Backend Team      2024-01-15   Active
Mobile App            Frontend Team     2024-01-10   Active
Admin Dashboard       Ops Team          2024-01-20   Active
```

#### `scoriet project get <project-id>`
Get detailed information about a project.

```bash
scoriet project get api-service-123
```

**Output**:
```json
{
  "id": "api-service-123",
  "name": "API Service",
  "team": "Backend Team",
  "tables": 12,
  "fields": 156,
  "templates": 5,
  "created": "2024-01-15T10:30:00Z"
}
```

---

### Generation

#### `scoriet generate <project-id> <template-name>`
Generate code using a template.

```bash
scoriet generate api-service-123 laravel-model
```

**Required Arguments**:
- `<project-id>` — ID of the project (from `project list`)
- `<template-name>` — Name of the template

**Output**:
```
Generating code...
✓ Generated laravel-model template
Output saved to: ./generated/UserModel.php
```

#### Generate to File

```bash
scoriet generate api-service-123 laravel-model --output ./models/User.php
```

**Options**:
- `--output <path>` — Save to specific file
- `--format <format>` — Output format: code, json, raw
- `--language <lang>` — Generate for specific language

#### Generate All Templates

```bash
scoriet generate api-service-123 --all
```

Generates code for all templates in the project.

#### Batch Generation

```bash
scoriet generate api-service-123 --template "*.php"
```

Generate multiple templates matching pattern.

---

### Configuration

#### `scoriet config show`
Display current configuration.

```bash
scoriet config show
```

**Output**:
```
Config file: ~/.scoriet/config.json

api_endpoint: https://api.scoriet.com
cache_dir: ~/.scoriet/cache
log_level: info
timeout: 30
```

#### `scoriet config set <key> <value>`
Set configuration value.

```bash
scoriet config set log_level debug
scoriet config set timeout 60
```

---

### Validation

#### `scoriet validate <project-id>`
Validate project configuration.

```bash
scoriet validate api-service-123
```

**Checks**:
- All tables are properly defined
- Fields have valid types
- Templates are syntactically correct
- Relationships are valid

**Output**:
```
Validating api-service-123...
✓ 12 tables validated
✓ 156 fields validated
✓ 5 templates validated
✓ All relationships valid

Validation passed!
```

---

## Common Workflows

### Workflow 1: Generate Model Class

```bash
#!/bin/bash
PROJECT_ID="api-service-123"
TEMPLATE="laravel-model"
OUTPUT_DIR="./app/Models"

scoriet generate $PROJECT_ID $TEMPLATE --output $OUTPUT_DIR/User.php
```

### Workflow 2: Batch Generate All PHP Templates

```bash
#!/bin/bash
PROJECT_ID="api-service-123"
OUTPUT_DIR="./generated"

# Generate all .php templates
scoriet generate $PROJECT_ID --template "*.php" --output $OUTPUT_DIR
```

### Workflow 3: Generate and Format Code

```bash
#!/bin/bash
PROJECT_ID="api-service-123"

# Generate code
scoriet generate $PROJECT_ID laravel-controller --output ./Controller.php

# Format with Prettier
prettier --write ./Controller.php

# Format with Laravel Pint (PHP)
./vendor/bin/pint ./Controller.php
```

### Workflow 4: Generate with Language Selection

```bash
#!/bin/bash
PROJECT_ID="api-service-123"

# Generate for English
scoriet generate $PROJECT_ID laravel-migration --language en --output ./migrations/en/

# Generate for German
scoriet generate $PROJECT_ID laravel-migration --language de --output ./migrations/de/
```

---

## Environment Variables

Configure CLI behavior with environment variables:

### Authentication

```bash
SCORIET_API_KEY=sk_test_xxxxx          # API key for authentication
SCORIET_API_ENDPOINT=https://api.scoriet.com  # Custom API endpoint
```

### Output

```bash
SCORIET_OUTPUT_DIR=./generated         # Default output directory
SCORIET_OUTPUT_FORMAT=json             # Default output format
```

### Logging

```bash
SCORIET_LOG_LEVEL=debug                # Log level: debug, info, warn, error
SCORIET_LOG_FILE=./scoriet.log         # Log file path
```

### Configuration

```bash
SCORIET_CONFIG_PATH=/etc/scoriet/config.json  # Config file location
SCORIET_CACHE_DIR=/var/cache/scoriet         # Cache directory
```

### Example: Setting Environment Variables

```bash
export SCORIET_API_KEY=sk_test_xxxxx
export SCORIET_OUTPUT_DIR=./generated
export SCORIET_LOG_LEVEL=info

scoriet generate my-project my-template
```

---

## Error Handling

### Common Errors

#### Authentication Error
```
Error: Authentication failed
Please run: scoriet auth login
```

**Solution**: Authenticate with `scoriet auth login`

#### Project Not Found
```
Error: Project 'my-project' not found
Available projects:
  - api-service-123
  - mobile-app-456
```

**Solution**: Use correct project ID from `scoriet project list`

#### Template Error
```
Error: Template 'laravel' not found
Available templates:
  - laravel-model
  - laravel-controller
  - laravel-migration
```

**Solution**: Use correct template name

#### Generation Error
```
Error: Failed to generate code
Details: Missing required field 'database'
```

**Solution**: Ensure project has all required configuration

### Getting Help

```bash
scoriet --help                    # General help
scoriet generate --help           # Command-specific help
scoriet auth login --help         # Option-specific help
```

---

## Advanced Usage

### JSON Output for Scripting

```bash
scoriet generate api-service-123 my-template --format json
```

Output:
```json
{
  "success": true,
  "template": "my-template",
  "output": "<?php class User { ... }",
  "duration_ms": 234,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

Parse and use in scripts:

```bash
OUTPUT=$(scoriet generate api-service-123 my-template --format json)
CODE=$(echo $OUTPUT | jq -r '.output')
echo "$CODE" > ./output.php
```

### Using with CI/CD

See the **[Automation & CI/CD](./automation.md)** section for integration guides with GitHub Actions, GitLab CI, Jenkins, etc.

---

## Version Management

### Check CLI Version

```bash
scoriet --version
```

### Update CLI

```bash
# npm
npm install -g @scoriet/cli@latest

# Homebrew
brew upgrade scoriet

# pip
pip install --upgrade scoriet-cli
```

### Compatibility

The CLI is compatible with:
- Node.js 18+, 20+, 22+
- Python 3.8, 3.9, 3.10, 3.11, 3.12
- macOS 12+, Windows 10+, Linux (most distributions)

---

## Performance Tips

:::tip Caching
The CLI caches project configurations. Force refresh:

```bash
scoriet project get my-project --no-cache
```
:::

:::info Parallel Generation
For batch operations, use shell parallelization:

```bash
scoriet generate proj1 template & \
scoriet generate proj2 template & \
scoriet generate proj3 template & \
wait
```
:::

:::tip Output Buffering
For large code generation, redirect to file:

```bash
scoriet generate my-project my-template > large_output.php 2>&1
```
:::

---

## Troubleshooting

### CLI Not Found After Installation

```bash
# Verify npm global installation
npm list -g @scoriet/cli

# Ensure node_modules/.bin is in PATH
echo $PATH | grep node_modules/.bin

# Try full path
/usr/local/bin/scoriet --version
```

### Authentication Issues

```bash
# Clear cached credentials
rm ~/.scoriet/config.json

# Re-authenticate
scoriet auth login

# Check status
scoriet auth status
```

### Permission Denied on Unix/Linux

```bash
# Fix permissions
chmod +x /usr/local/bin/scoriet

# Or use with node
npx @scoriet/cli generate ...
```

---

## Next Steps

- **[Local Service](./local-service.md)** — Background processing and service mode
- **[Automation & CI/CD](./automation.md)** — Integrate with pipelines
- **[Gtree Reference](../gtree/overview.md)** — Template data structure reference

