---
sidebar_position: 4
title: Quick Interface Tour
---

# A Quick Tour of Scoriet

The Scoriet interface is designed to be intuitive and powerful. This 5-minute tour will familiarize you with the main workspace and what each area does.

## The Main Workspace

When you open a Scoriet project, you'll see a multi-panel interface called an **MDI (Multi-Document Interface)**. Think of it like a customizable desktop where different tools are docked in panels.

<div class="screenshot-placeholder">Screenshot: Full Scoriet workspace with numbered annotations — <code>workspace-overview.png</code></div>

Here's what you're looking at:

```
┌─────────────────────────────────────────────────────────────┐
│                                ① Top Bar: Project, messages │
├────────────────┬───────────────┬────────────────────────────┤
│                │               │                            │
│② MENU BAR      │③ NAVIGATION   │④  CONTENT PANEL            │
│    PANEL       │ PANEL         │  (Main Work Area)          │
│                │               │                            │
│• Menu          │• Projects     │  • Code Editor             │
│• Credits       │• Teams        │  • Template Manager        │
│• User Menu     │• Templates    │  • Generator               │
│                │• Databases    │  • 57 Panels atm.          │
│                │               │                            │  
└────────────────┴───────────────┴────────────────────────────┘
```

Let's explore each section:

## ① Navigation Bar (Top)

The top navigation bar contains global controls and information.

<div class="screenshot-placeholder">Screenshot: Navigation bar highlighting all elements — <code>navbar.png</code></div>

**Left Side:**
- 🏠 **Scoriet Logo** – Click to go home or see quick links
- 📋 **Menu** – Main navigation dropdown (Projects, Settings, Help)
- 🔍 **Search** – Find projects, templates, or documentation

**Center:**
- 📌 **Breadcrumbs** – Shows your current location (e.g., "Projects > Blog > Database")
- Project name and status

**Right Side:**
- 🔔 **Notifications** – Alerts and messages
- ⚙️ **Settings** – Account and application preferences
- 👤 **Profile** – Your account menu (View profile, Settings, Logout)

:::tip **Quick Navigation**
Use the breadcrumb trail to jump back to any previous section. Click any part of the path to go there instantly.
:::

## ③ Left Sidebar (Project Navigation)

The left panel is your project explorer. It's organized into tabs:

<div class="screenshot-placeholder">Screenshot: Left sidebar showing all tabs — <code>left-sidebar.png</code></div>

### 📁 Projects Tab
Lists all your projects. Click any project to open it.

- **Favorites** ⭐ – Your starred projects for quick access
- **All Projects** – Complete list with search
- **Create New** ➕ – Start a new project

### 🗄️ Database Tab
Shows your database structure in a tree view:

```
📊 your_database
├─ 📋 Tables
│  ├─ posts
│  │  ├─ id (INT, Primary Key)
│  │  ├─ title (VARCHAR)
│  │  ├─ content (TEXT)
│  │  └─ created_at (TIMESTAMP)
│  └─ comments
│     ├─ id (INT)
│     ├─ post_id (INT, Foreign Key)
│     ├─ body (TEXT)
│     └─ created_at (TIMESTAMP)
├─ 🔑 Relationships
├─ 📈 Indexes
└─ ⚙️ Settings
```

**Click a table** to see its structure. Click any column to see its properties (type, constraints, default values).

### 📋 Templates Tab
Your collection of code templates:

- **Built-in Templates** – Templates provided by Scoriet (Laravel Models, API Controllers, etc.)
- **Custom Templates** – Templates you've created for your specific needs
- **Recent** – Templates you've used recently
- **Favorites** ⭐ – Your most-used templates

### 🎯 Current Project Tab
Specific tools for the current project:

- **Output Files** – Preview generated code
- **Generation History** – Redo previous generations
- **Project Settings** – Customize this project

## ④ Center Panel (Main Work Area)

This is where the magic happens. The center panel shows different content based on what you're doing.

<div class="screenshot-placeholder">Screenshot: Center panel in different modes — <code>center-panel.png</code></div>

### When Viewing a Template:
```
┌────────────────────────────────────────┐
│ Template: Laravel Model               │
├────────────────────────────────────────┤
│ [Name]  [Version]  [Tags]              │
│                                        │
│ Description: Generate Eloquent models  │
│                                        │
│ Template Code:                         │
│ ─────────────────────────────────────  │
│ namespace App\Models;                  │
│                                        │
│ class {:ModelName:} extends Model      │
│ {                                      │
│     // {:description:}                 │
│ }                                      │
└────────────────────────────────────────┘
```

### When Generating Code:
```
┌────────────────────────────────────────┐
│ Code Generator - Blog Project          │
├────────────────────────────────────────┤
│ Tables:  ☑ posts  ☑ comments           │
│ Templates: ☑ Model ☑ Controller        │
│                                        │
│ [Generate Code]  [Preview]             │
│                                        │
│ Progress:                              │
│ ██████████████░░░░ 70%                 │
└────────────────────────────────────────┘
```

### When Viewing Generated Code:
```
┌────────────────────────────────────────┐
│ Post.php                    [Options ▼] │
├────────────────────────────────────────┤
│ namespace App\Models;                  │
│                                        │
│ class Post extends Model                │
│ {                                      │
│     protected $fillable = [            │
│         'title', 'content'             │
│     ];                                 │
│ }                                      │
│                                        │
│ [Copy]  [Download]  [★ Favorite]      │
└────────────────────────────────────────┘
```

:::tip **Panel Tabs**
If multiple items are open, you'll see tabs at the top of the center panel. Click any tab to switch between them, like browser tabs.
:::

## ⑤ Right Panel (Inspector & Settings)

The right panel shows context-sensitive information and controls.

<div class="screenshot-placeholder">Screenshot: Right panel showing different contexts — <code>right-panel.png</code></div>

### When a Table is Selected:
Shows table properties:
- Column count
- Row count (if accessible)
- Engine (InnoDB, MyISAM, etc.)
- Charset and collation
- Relationships diagram
- Indexes and constraints

### When a Template is Selected:
Shows template details:
- Template version
- Tags and categories
- Dependencies
- Configuration options
- Usage statistics

### When Generating Code:
Shows generation options:
- Output format
- Target framework
- Namespace configuration
- Special options per template
- Estimated file count

### Settings Mode:
Quick-access settings for the current context:
- Database settings
- Template preferences
- Project configuration
- Export/import options

## Keyboard Shortcuts & Hotkeys

Scoriet supports quick keyboard shortcuts for power users:

| Shortcut | Action |
|----------|--------|
| `Alt + P` | Refresh/update current panel |
| `Alt + M` | Maximize current panel (fullscreen) |
| `Alt + N` | Open new tab in current panel |
| `Alt + X` | Close current tab |
| `Ctrl + S` | Save current work |
| `Ctrl + Z` | Undo last action |
| `Ctrl + Y` | Redo last action |
| `Ctrl + F` | Find/search in current view |

:::info **Panel Maximization**
Press `Alt + M` to maximize any panel to fullscreen. Useful when you need full focus on code review or template editing.
:::

## Resizing & Customizing Panels

Scoriet panels are completely customizable:

**Resize Panels:**
- Hover your mouse on the dividing line between panels
- Cursor changes to a resize cursor ↔️
- Drag left/right to adjust widths

**Drag Panels:**
- Click and hold the panel header
- Drag to a new location on the workspace
- Panels snap to the grid for organized layouts

**Close Panels:**
- Click the X button on the panel header
- Or right-click the panel tab and select "Close"

**Restore Layout:**
- If you mess up your layout, go to **Settings → Layout → Reset to Default**

<div class="screenshot-placeholder">Screenshot: Resizing and customizing panels — <code>panel-customization.png</code></div>

## Typical Workflows

Here's how you'd typically use the interface:

### Workflow 1: Generate Code
```
1. ③ Click project in LEFT SIDEBAR
2. ③ Click Database tab → select table
3. ④ CENTER shows table structure
4. ③ Click Templates tab → select template
5. ④ Click "Generate"
6. ④ Review generated code
7. ④ Click "Download"
```

### Workflow 2: Create Custom Template
```
1. ③ Click Templates tab
2. ③ Click "Create New Template"
3. ④ Write template code with variables
4. ⑤ Configure options on RIGHT panel
5. ④ Click "Test/Preview"
6. ④ Click "Save Template"
```

### Workflow 3: Manage Projects
```
1. ③ Click Projects tab
2. ③ Search or browse your projects
3. ③ Right-click project → Edit, Share, Delete
4. ④ View project details
5. ⑤ Change settings on RIGHT panel
```

## Getting Help

Stuck? Here's how to find answers:

**In-App Help:**
- Click **?** icon (usually top right) for contextual help
- Hover over any icon for tooltip description
- Press `F1` for full help documentation

**Online Resources:**
- 📚 Documentation – Full user guides
- 💬 Community Forum – Ask other Scoriet users
- 🎥 Video Tutorials – Visual walkthroughs
- 📧 Support Email – Email our support team

<div class="screenshot-placeholder">Screenshot: Help menu and options — <code>help-menu.png</code></div>

## Quick Settings

Before you start working, you might want to adjust these common settings:

**Theme:**
- Go to ⚙️ **Settings** → **Appearance**
- Choose Light, Dark, or Auto theme

**Notifications:**
- ⚙️ **Settings** → **Notifications**
- Control when you're alerted about generation progress

**Editor Font Size:**
- ⚙️ **Settings** → **Editor**
- Adjust code font size for readability

**Auto-Save:**
- ⚙️ **Settings** → **General**
- Enable auto-save for templates and projects

---

## You're Ready!

Now that you know your way around the interface, you're prepared to tackle any project. The best way to learn is by doing—start with the [First Project Walkthrough](./first-project.md) and you'll become a Scoriet expert in no time.

:::success **Pro Tip**
Spend a few minutes dragging panels around and customizing your workspace to your preference. A comfortable layout makes you more productive!
:::
