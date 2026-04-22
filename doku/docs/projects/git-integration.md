---
sidebar_position: 4
---

# Git Integration

Scoriet integrates with GitHub and GitLab, allowing you to automatically commit generated code to your repository. This enables version control and team collaboration on generated code.

## Why Use Git Integration?

Git integration provides several benefits:

- **Version Control** - Track changes to generated code over time
- **Collaboration** - Team members see generation changes via Git history
- **Automation** - Commit generated code without manual Git operations
- **Rollback** - Revert to previous generated code if needed
- **Code Review** - Review generated code changes in pull requests
- **Audit Trail** - Complete history of what was generated and when

## Supported Platforms

### GitHub

- Public repositories
- Private repositories
- GitHub Enterprise
- GitHub.com and self-hosted GitHub

### GitLab

- GitLab.com
- Self-hosted GitLab instances
- Public and private projects

## Setting Up Git Integration

### Step 1: Connect Your Account

1. **Open project Settings**
2. **Go to Repository > Version Control**
3. **Click Connect Repository** button
4. **Choose GitHub or GitLab**
5. **You're redirected to provider** for authentication
6. **Grant permissions** - Allow Scoriet to access repositories
7. **Confirm connection** - Returns to Scoriet

<div class="screenshot-placeholder">Screenshot: Connect Repository button in settings — <code>git-connect-button.png</code></div>

### Step 2: Select Repository

After authentication:

1. **See list of your repositories**
2. **Search for your repository** by name
3. **Select the repository** where generated code lives
4. **Choose branch**:
   - **main/master** - Primary branch
   - **develop** - Development branch
   - **custom branch** - Your specified branch
5. **Click Select Repository**

### Step 3: Configure Generation Settings

1. **Choose commit options**:
   - **Auto-commit on generate** - Automatically commit when code is generated
   - **Manual commits** - Generate code without committing, commit manually
   - **Commit on schedule** - Commit generated changes at specific times

2. **Set commit message template**:
   ```
   [Scoriet] Generated code from {:schema.name:} using {:template.name:}
   ```
   
   Available variables:
   - `{:schema.name:}` - Name of database schema
   - `{:template.name:}` - Name of template used
   - `{:timestamp:}` - Date/time of generation
   - `{:user.name:}` - Person who generated
   - Custom text

3. **Set commit author**:
   - Use Scoriet bot account
   - Use your Git account
   - Use team account

:::info
Use auto-commit during development to keep generated code synchronized. Disable during testing to avoid cluttering Git history.
:::

### Step 4: Configure File Paths

Specify where generated files are committed:

```
Base Directory: /app/generated/
Structure:
  /api/ - API code
  /models/ - Database models
  /migrations/ - Database migrations
  /tests/ - Test files
```

**Pattern matching**:
- `*.php` - Only PHP files
- `app/**/*.js` - JavaScript in app directory
- `-!config/**` - Exclude config files

1. **Define directory structure**
2. **Set which files to commit**
3. **Exclude sensitive files** (configs, credentials)
4. **Test patterns** before committing

:::caution
Never commit `.env` files, API keys, or passwords. Use pattern exclusions to prevent accidental credential commits.
:::

## Using Git Integration

### Auto-Generating and Committing

When auto-commit is enabled:

1. **Generate code** (click Generate or run template)
2. **Review generated output** in preview
3. **Click Confirm Generate**
4. **Files are committed automatically** to selected branch
5. **See confirmation** - "Committed to main on GitHub"

### Manual Generation and Commits

When auto-commit is disabled:

1. **Generate code** same as normal
2. **Files are saved locally**
3. **Click Git > Commit Generated Code**
4. **Review changes** in commit dialog
5. **Enter commit message** (or use template)
6. **Click Commit**

### Viewing Git History

See commit history from Scoriet:

1. **Go to project Settings**
2. **Repository > Git History**
3. **See recent commits** from Scoriet
4. **Click commit** to view files changed
5. **Inspect diffs** between versions

<div class="screenshot-placeholder">Screenshot: Git history panel showing recent commits — <code>git-history.png</code></div>

### Pull and Sync

Keep your local and remote in sync:

1. **Settings > Repository > Sync**
2. **Pull latest** - Get remote changes
3. **Push pending** - Send local commits
4. **Resolve conflicts** - If changes conflict

:::info
Sync regularly when multiple people are generating code, especially if generating to the same branch.
:::

## Branch Management

### Generating to Different Branches

Create separate branches for different purposes:

**Development Branch**:
- For testing new templates
- Frequent commits as you experiment
- No impact on main branch

**Production Branch**:
- For stable, released code
- Less frequent generation
- Careful review before committing

### Switching Branches

1. **Settings > Repository > Select Branch**
2. **Choose different branch**
3. **Next generation commits to new branch**

### Creating New Branches

1. **Settings > Repository**
2. **Click Create Branch**
3. **Name new branch** (e.g., "feature/new-api")
4. **Creates branch from current** (usually main)
5. **Automatically switches to new branch**

:::tip
Use descriptive branch names: `feature/customer-api`, `feature/admin-templates`, `fix/migration-bug`
:::

## Merge Requests and Pull Requests

### Automatic PR Creation

When generating to a feature branch:

1. **Generate code** to feature branch
2. **Click Create Pull Request**
3. **Set PR details**:
   - Title: "Generated code for customer API"
   - Description: Auto-populated with generation details
   - Reviewers: Assign team members
4. **Create PR** - Ready for review

### Reviewing Generated Code

Team members review PRs:

1. **See generated changes** in Files Changed tab
2. **Comment on code** - Questions, suggestions
3. **Request changes** - If adjustments needed
4. **Approve** - When satisfied
5. **Merge to main** - After approval

:::info
This workflow ensures generated code is reviewed before reaching production.
:::

## Handling Conflicts

### When Conflicts Occur

If manual changes and generated code conflict:

1. **Scoriet detects conflict** when pulling
2. **Shows conflict resolution dialog**
3. **Choose resolution strategy**:
   - Keep generated (overwrite manual changes)
   - Keep manual (ignore generated changes)
   - Merge (combine both)

### Preventing Conflicts

Best practices to minimize conflicts:

1. **Separate generated and manual code**
   ```
   /generated/ - Only code from Scoriet
   /src/       - Manual code and overrides
   /config/    - Configuration (don't generate)
   ```

2. **Use include patterns** - Only commit specific files
3. **Exclude common conflict areas** - Don't generate config files
4. **Coordinate with team** - Who's generating when?
5. **Review before merging** - Catch conflicts early

:::caution
If conflicts occur frequently, review your file organization. Better separation of generated and manual code prevents conflicts.
:::

## Advanced Git Integration

### GitHub Actions Integration

Trigger GitHub Actions when code is generated:

1. **Settings > Repository > GitHub Actions**
2. **Select workflows** to trigger
3. **When generation occurs**, workflow runs automatically
4. **Example**: Run tests, build project, deploy

```yaml
name: On Scoriet Generation
on:
  push:
    paths:
      - 'generated/**'
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Tests
        run: npm test
```

### GitLab CI/CD Integration

Similar to GitHub Actions for GitLab:

1. **Settings > Repository > GitLab CI**
2. **Enable pipeline triggers**
3. **Configure .gitlab-ci.yml** for Scoriet commits
4. **Pipelines run automatically** on generation

### Webhook Notifications

Send notifications when code is generated:

1. **Settings > Repository > Webhooks**
2. **Add webhook URL** (Slack, Discord, etc.)
3. **Choose trigger events**:
   - Code generated
   - PR created
   - Merge completed
4. **Receive notifications** in your chat

Example Slack message:
```
John generated code from customers schema using Laravel Migration template
Branch: feature/customer-api
Files: 3 changed, 42 insertions, 5 deletions
```

## Troubleshooting Git Integration

### Authentication Failed

**Solutions**:
1. **Reconnect account** - Settings > Repository > Reconnect
2. **Check token expiration** - Some tokens expire after 30 days
3. **Verify permissions** - Does account have repo access?
4. **Try personal token** - Use Personal Access Token instead of OAuth

### Commits Not Appearing

**Check these**:
1. **Auto-commit enabled?** - Settings > Repository > Auto-commit
2. **Correct branch selected?** - Verify in Settings > Repository
3. **Files excluded?** - Check pattern exclusions
4. **Check Git history** - Settings > Repository > History

### Merge Conflicts

**Prevention**:
1. Keep generated and manual code separate
2. Use file pattern exclusions
3. Coordinate generation times with team
4. Pull changes before generating

**Resolution**:
1. Pull latest from remote
2. Manually resolve conflicts in editor
3. Test changes locally
4. Commit resolved state

### Permission Errors

**Ensure account has**:
- ✓ Write access to repository
- ✓ Ability to create branches
- ✓ Ability to create pull requests
- ✓ Admin access for webhook setup

Ask repository owner to grant permissions.

## Git Integration Best Practices

### Workflow Recommendations

**Recommended workflow**:

```
1. Create feature branch for generation task
2. Generate code to feature branch
3. Create pull request automatically
4. Team reviews generated code
5. Make adjustments if needed
6. Merge to develop after approval
7. Deploy develop to staging
8. Test and validate
9. Merge to main/production
```

### Commit Message Standards

Use clear, consistent commit messages:

```
✓ [Scoriet] Generated API models from customers schema
✓ Generated migration for product_reviews table
✓ Updated Laravel seeder from latest database

✗ update files
✗ fix
✗ changes
```

### Handling Generated Code

Treat generated code as **read-only**:

```
/generated/           ← Pure generated code, don't edit
/src/models/          ← Manual customizations of models
/overrides/           ← Overrides and extensions
```

### Coordination with Team

When generating in shared repository:

1. **Announce generation** - Let team know you're generating
2. **Use feature branches** - Don't commit to main
3. **Create PR first** - Let team review before merging
4. **Avoid conflicts** - Don't generate while others are working
5. **Update documentation** - Note what changed

### Regular Reviews

Periodically review Git integration:

- ✓ Are commits meaningful and clear?
- ✓ Is file structure still appropriate?
- ✓ Are excluded patterns still correct?
- ✓ Is auto-commit helping or causing issues?
- ✓ Do team members understand the workflow?

## Disconnecting Git Integration

If you want to stop using Git integration:

1. **Settings > Repository > Disconnect**
2. **Confirm disconnection**
3. **Generated code stays in repository**
4. **Scoriet stops making commits**
5. **Can reconnect anytime**

:::info
Disconnecting doesn't affect your repository. All previous commits remain in Git history.
:::

---

**Related Topics:**
- [Project Settings](project-settings.md)
- [Team Collaboration](../../collaboration/teams.md)
- [Code Generation](../templates/generate-code.md)
