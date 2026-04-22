---
sidebar_position: 2
---

# Navigation

Scoriet provides multiple ways to navigate through your projects, schemas, templates, and generated code. Whether you prefer clicking through menus or using the sidebar tree, you'll find a navigation method that matches your workflow.

## Top Navigation Bar

The top navigation bar is always visible and provides quick access to major features and settings.

### Navigation Items

| Item | Purpose | Opens |
|------|---------|-------|
| **Scoriet Logo/Home** | Return to project dashboard | Projects list and recent items |
| **Projects** | View all projects | Projects overview page |
| **Create +** | Quick create menu | New project, schema, or template |
| **Settings** | Application preferences | Theme, language, account settings |
| **Profile Menu** | User account options | Profile, logout, preferences |

:::tip
Use the **Create +** button as a shortcut. It intelligently shows create options based on your current context:
- At project level → Create new project
- Inside a project → Create new schema or template
- Inside a schema → Create new table
:::

## Sidebar Tree View (ClassicTreeView)

The left sidebar organizes all your project resources in a hierarchical tree structure. This is your primary navigation tool for exploring project contents.

### Tree Structure Hierarchy

```
Projects (Root)
├── Team A
│   ├── Project: E-Commerce App
│   │   ├── Schemas
│   │   │   ├── Database: mysql_main
│   │   │   │   ├── customers
│   │   │   │   ├── orders
│   │   │   │   └── products
│   │   │   └── Database: mysql_cache
│   │   │       └── cache_entries
│   │   ├── Templates
│   │   │   ├── PHP API
│   │   │   ├── React Components
│   │   │   └── Database Migrations
│   │   └── Languages
│   │       ├── PHP
│   │       └── JavaScript
│   └── Project: Admin Dashboard
└── Team B
    └── Project: Mobile App
```

### Expanding and Collapsing

- **Click the arrow icon** (▶) next to any item to expand/collapse its children
- **Double-click** an item to expand all descendants
- Items with no children show no arrow

### Context Menus (Right-Click)

Right-click any item in the tree to see available actions:

| Item Type | Context Menu Options |
|-----------|----------------------|
| **Project** | Edit, Delete, Export, Open in new tab, Settings |
| **Schema** | Edit, Delete, Add table, Refresh from database, Export |
| **Table** | Edit fields, View indexes, Delete, Refresh |
| **Template** | Edit, Duplicate, Delete, Preview, Assign to tables |
| **Language** | Edit settings, Delete, Set as default |

:::info
Context menus are context-aware. They only show relevant actions for the selected item type. Disabled items (grayed out) indicate actions that aren't available for the current item state.
:::

## Navigation Patterns

### Breadcrumb Navigation

When you open an item for editing, a breadcrumb trail appears showing your current location:

```
Projects > E-Commerce App > Schemas > mysql_main > customers
```

Click any breadcrumb element to jump back to that level. This helps orient you within deeply nested structures.

### Panel Navigation

Scoriet uses panel-based navigation:

1. **Click an item** in the sidebar → Opens in the main content panel
2. **Click tabs** at the top of panels to switch between open items
3. **Use keyboard shortcuts** to navigate (see [Keyboard Shortcuts](keyboard-shortcuts.md))

### Search and Filter

Most tree views include a search box at the top:

1. **Type to search** - Filters tree items by name
2. **Results update in real-time** as you type
3. **Click results** to navigate to matched items

:::tip
Use search to quickly jump to specific schemas, tables, or templates without scrolling through the tree.
:::

## Smart Navigation Features

### Automatic Panel Opening

When you open an item:
- **Existing open panels** showing that item are brought to focus
- **New items** open in a new panel or new tab
- **Double-clicking** typically maximizes the panel for focused editing

### Related Items Quick Access

When editing a table or template, related items appear as quick-link buttons:

- **From a table** → View related templates, see dependent schemas
- **From a template** → See which tables it's assigned to, view usage statistics
- **From a schema** → View all tables, see field usage across templates

### Recent Items

The **Home/Projects** view shows:
- Recently opened projects
- Recently edited schemas and templates
- Quick access to frequently used items
- Star/favorite items for quick return

:::info
Favorite items by clicking the star icon. Favorited items appear at the top of the tree and in the recent items list.
:::

## Team and Organizational Navigation

### Team Switching

If you belong to multiple teams:

1. **Click on a different team** in the tree
2. The sidebar switches to show that team's projects
3. Your current project selection is remembered per team

### Project Switching

To switch between projects in the same team:

1. **Click the project name** in the tree or breadcrumb
2. The entire workspace updates to show the new project's resources
3. Your custom layout is preserved when switching projects

## Navigation Tips & Tricks

### Speed Up Navigation

- **Pin frequently used items** in the sidebar for quick access
- **Use keyboard shortcuts** (Alt+P, Alt+M, Alt+N) to navigate panels quickly
- **Keep related panels open** in tabs to reduce switching between items
- **Use floating panels** to compare multiple items side-by-side

### Organize Your Tree

- **Rename projects and schemas** to make tree navigation intuitive
- **Group templates** by function (APIs, Reports, Migrations)
- **Use consistent naming** across team projects for easier scanning

### Deep Navigation

For complex projects with many schemas and tables:

1. **Use the search box** to jump directly to your target
2. **Expand only necessary** tree nodes to reduce visual clutter
3. **Keep sidebar width** wide enough to read full names (drag to resize)

:::caution
If you're lost in a deeply nested tree structure, click **Home** in the top navigation to return to the projects overview.
:::

## Accessibility Features

Scoriet's navigation supports keyboard-only users:

- **Tab through tree items** to select different items
- **Arrow keys** expand/collapse items
- **Enter** opens the selected item
- **Esc** closes expanded panels
- See [Keyboard Shortcuts](keyboard-shortcuts.md) for complete reference

---

**Related Topics:**
- [Understanding the Workspace](overview.md)
- [Working with Panels](dock-panels.md)
- [Keyboard Shortcuts](keyboard-shortcuts.md)
