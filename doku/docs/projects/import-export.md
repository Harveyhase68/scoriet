---
sidebar_position: 5
---

# Import and Export

Scoriet's import and export features allow you to share projects, templates, and schemas with teammates, transfer between teams, or create backups. Export and import are powerful tools for collaboration and disaster recovery.

## Why Import and Export?

### Export Use Cases

- **Share templates** with other projects or teams
- **Backup projects** before major changes
- **Distribute** project configurations to team members
- **Migrate** projects between Scoriet instances
- **Archive** completed projects for reference

### Import Use Cases

- **Reuse templates** from other projects
- **Restore** from backup after accidental deletion
- **Merge** projects from different teams
- **Migrate** from external tools or systems
- **Duplicate** entire projects for variations

## Exporting Projects

### Export Full Project

Export everything: schemas, templates, settings, and team configuration.

**Steps**:

1. **Open project** you want to export
2. **Click Settings** in navigation
3. **Go to Advanced > Export Project**
4. **Choose export format**:
   - **ZIP** - Compressed, for file sharing
   - **JSON** - Plain text, for version control
5. **Select what to include**:
   - ✓ Schemas and tables
   - ✓ Templates
   - ✓ Languages
   - ✓ Team members list
   - ✓ Settings
6. **Click Export**
7. **File downloads** to your computer

<div class="screenshot-placeholder">Screenshot: Export Project dialog with options — <code>export-project-dialog.png</code></div>

### Export Templates Only

Share templates without exposing schemas or settings.

**Steps**:

1. **Open project**
2. **Settings > Templates > Export Templates**
3. **Select specific templates** to export
4. **Choose format** (ZIP or JSON)
5. **Click Export**

**Template export includes**:
- Template code
- Template name and description
- Assigned language
- Configuration variables

**Not included**:
- Database schemas
- Generated code
- Team information
- Project settings

:::tip
Export templates to share with other projects or teams. Templates are portable and don't depend on specific schemas.
:::

### Export Schemas Only

Share database structure without code generation templates.

**Steps**:

1. **Settings > Database > Export Schema**
2. **Select specific schemas** to export
3. **Choose format**:
   - **SQL** - Native database creation script
   - **JSON** - Scoriet schema format
   - **CSV** - Table structure for import elsewhere
4. **Click Export**

**Use cases**:
- Share database design with database administrators
- Migrate schema to another database
- Archive database structure
- Import into documentation tools

:::info
Exporting schemas as SQL lets you create actual databases in any SQL system.
:::

### Export Settings Only

Export configuration without data.

**Steps**:

1. **Settings > Advanced > Export Settings**
2. **Choose what to export**:
   - Language configurations
   - Code style preferences
   - Environment variables
   - Webhook configurations
3. **File is saved** as JSON

**Use case**: Create standard configurations for your team. Import these settings into new projects.

## Importing Projects

### Import Full Project

Import a previously exported project.

**Steps**:

1. **Go to Projects dashboard**
2. **Click Import Project** button
3. **Select exported file** (ZIP or JSON)
4. **Choose import mode**:
   - **New Project** - Create new project from import
   - **Merge to Existing** - Combine with current project
5. **If merging**, choose conflict resolution:
   - **Replace** - Imported items overwrite existing
   - **Keep Both** - Keep both versions (with numbering)
   - **Skip** - Import only items not already present
6. **Click Import**
7. **Wait for import** to complete (usually 5-10 seconds)

<div class="screenshot-placeholder">Screenshot: Import Project dialog — <code>import-project-dialog.png</code></div>

### Import Templates

Add templates from another project.

**Steps**:

1. **Open target project** (where you want templates)
2. **Settings > Templates > Import Templates**
3. **Select source** (exported file or another project)
4. **Select specific templates** to import
5. **Choose conflict resolution**:
   - Replace existing templates with same name
   - Keep both and rename imported ones
   - Skip if template already exists
6. **Click Import**

**Template compatibility**:
- ✓ Templates from same Scoriet version are compatible
- ✓ Templates use standard template syntax (version-independent)
- ⚠ Verify templates work after import (may reference different databases)

:::tip
After importing templates, test them with your schemas to ensure they work correctly in their new environment.
:::

### Import Schemas

Add database schemas from external source.

**Steps**:

1. **Open project**
2. **Settings > Database > Import Schema**
3. **Choose import source**:
   - Live database connection
   - Exported SQL file
   - Exported JSON schema
4. **If from file**, select and upload
5. **If from database**, enter connection details
6. **Select tables to import**
7. **Click Import**
8. **Review imported tables** for accuracy

### Import from Different Source

Import schemas from SQL files, even if not originally from Scoriet.

**Supported formats**:

- **MySQL/MariaDB** - `.sql` dump files
- **PostgreSQL** - `.sql` dump files  
- **SQLite** - `.db` files
- **SQL Server** - `.sql` scripts

**Steps**:

1. **Settings > Database > Import Schema > From File**
2. **Upload SQL or database file**
3. **Select database type**
4. **Scoriet parses structure**
5. **Select tables** to import
6. **Review and confirm**
7. **Tables imported** as Scoriet schemas

## Managing Imports and Exports

### Understanding File Formats

**ZIP Format**:
- Compressed file containing all project data
- Portable across systems and networks
- Smaller file size for sharing
- Can be opened like a folder on some systems
- Recommended for sharing

**JSON Format**:
- Human-readable plain text
- Can be version controlled in Git
- Larger file size than ZIP
- Editable directly (for advanced users)
- Recommended for archival

**SQL Format**:
- Native database creation scripts
- Can be executed in any SQL database
- Database-specific syntax
- Useful for database migration
- Works with any SQL tool

### Export History

Keep track of exports:

1. **Settings > Advanced > Export History**
2. **See recent exports** with timestamps
3. **Re-download export** if file lost
4. **Delete old exports** to save storage

:::info
Scoriet keeps exports for 30 days. Download important exports to your computer for long-term storage.
:::

### Scheduled Exports

Create automatic backups:

1. **Settings > Backup > Scheduled Exports**
2. **Create export schedule**:
   - Daily at specific time
   - Weekly on specific day
   - Monthly on specific date
3. **Choose what to export** (full project, templates, etc.)
4. **Store location**:
   - Cloud storage (Google Drive, Dropbox)
   - Email to backup address
   - FTP server
5. **Automatic exports** run on schedule

## Sharing Projects with Teams

### Sharing Exported Files

**Steps**:

1. **Export project** (see above)
2. **Share file** via:
   - Email attachment
   - Cloud storage (Google Drive, Dropbox, OneDrive)
   - File sharing service
   - Git repository
3. **Team member downloads** file
4. **They import** into their Scoriet instance

### Sharing via Git

Share projects through version control:

1. **Export project as JSON**
2. **Commit to Git repository**
3. **Team members pull** repository
4. **Import** JSON file into their projects

:::tip
Version controlling exported projects in Git gives you full history of project changes and makes collaboration easier.
:::

### Sharing Read-Only

Share for review only (no editing):

1. **Export project**
2. **Change project visibility** to "Public" 
3. **Generate shareable link**
4. **Team members view** via link
5. **They can't edit** (read-only access)

## Backup and Recovery

### Manual Backups

Create manual backups anytime:

1. **Export project**
2. **Save to reliable storage**:
   - External hard drive
   - Cloud storage (with versioning)
   - Network backup
3. **Label with date** (e.g., "Project_2024-04-13.zip")
4. **Keep multiple versions** (keep last 5 backups)

### Automatic Backups

Scoriet automatically creates backups:

- **Daily backups** - Every 24 hours
- **Before major operations** - Before deletion or major changes
- **30-day retention** - Backups kept for 30 days

**Access automatic backups**:
1. **Settings > Advanced > Manage Backups**
2. **See list** of available backups
3. **Click backup** to restore

### Disaster Recovery

If project is accidentally deleted:

1. **Go to Settings > Manage Backups**
2. **Find backup** before deletion occurred
3. **Click Restore**
4. **Confirm restoration**
5. **Project is restored** with all data

:::caution
Automatic backups only kept 30 days. For long-term backups, manually export and store externally.
:::

## Best Practices

### Regular Exports

Create regular backups:

- **Critical projects** - Weekly exports
- **Active projects** - Monthly exports
- **Completed projects** - At completion
- **Before major changes** - Always backup first

### Naming Conventions

Use clear naming for exported files:

```
✓ project_ecommerce_2024-04-13.zip
✓ templates_api_generation_v2.json
✓ schema_customers_database.sql
✓ backup_2024-04-13_daily.zip

✗ project.zip
✗ export.json
✗ backup.sql
✗ file.zip
```

### Organization

Keep exported files organized:

```
Exports/
├── Projects/
│   ├── ecommerce/
│   │   ├── 2024-03-01.zip
│   │   └── 2024-04-13.zip
│   └── admin-dashboard/
└── Templates/
    ├── laravel-templates.json
    └── react-components.json
```

### Version Control

Store exports in Git:

```bash
# Export project
# Commit to Git
git add exports/project_ecommerce.json
git commit -m "Backup: ecommerce project templates and settings"
git push

# Later, restore from Git
git checkout HEAD -- exports/project_ecommerce.json
# Import the file into Scoriet
```

:::info
Version controlling exports gives you full history and makes collaboration easier than email attachments.
:::

## Troubleshooting Import/Export

### Export File Not Creating

**Solutions**:
1. Check available disk space
2. Try smaller export (templates only, not full project)
3. Check file permissions
4. Try different format (ZIP vs JSON)

### Import Fails with Error

**Check these**:
1. **File compatibility** - Is it from Scoriet? (or compatible SQL)
2. **File corruption** - Try re-downloading export
3. **Version mismatch** - Exports from newer versions may not import to older
4. **Missing dependencies** - Import referenced databases first

### Templates Don't Work After Import

**Troubleshooting**:
1. **Check database references** - Does template reference right database?
2. **Test with sample data** - Try generating from imported template
3. **Review placeholders** - Are `{:table.name:}` etc. correct?
4. **Check languages** - Is language configured in project?

### Slow Import/Export

**Performance tips**:
1. **Export only needed items** (templates only, not full project)
2. **Use ZIP format** (compressed, faster transfer)
3. **Export to local storage** (not network drives)
4. **Close other applications** (free up memory)
5. **Try smaller exports** - Split large projects into parts

## Advanced Import/Export

### Scripted Import/Export

For automated workflows:

```bash
# Export using API
curl -X POST https://scoriet.api/projects/123/export \
  -H "Authorization: Bearer TOKEN" \
  -d '{"format":"zip","include":["templates","schemas"]}'

# Import using API
curl -X POST https://scoriet.api/projects/import \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@export.zip"
```

See [API Documentation](../../api/overview.md) for full API reference.

### Merge Multiple Exports

Combine multiple project exports:

1. **Import first project**
2. **Import second project** → Choose "Merge"
3. **Select conflict resolution**
4. **Repeat** for additional projects
5. **Result**: One project with items from all exports

### Transform on Import

Modify content during import (advanced):

1. **Download export**
2. **Edit JSON file** directly
3. **Modify schema names**, template code, settings
4. **Re-import modified** file
5. **Changes applied** during import

:::caution
Only edit JSON exports if you understand the format. Corrupted JSON imports will fail.
:::

---

**Related Topics:**
- [Project Settings](project-settings.md)
- [Team Collaboration](../../collaboration/teams.md)
- [Git Integration](git-integration.md)
- [API Documentation](../../api/overview.md)
