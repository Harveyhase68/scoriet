---
sidebar_position: 3
---

# Working with Panels

Scoriet's panel system gives you complete control over your workspace layout. Whether you prefer a traditional docked interface or floating windows for side-by-side comparison, Scoriet adapts to your workflow.

## What Are Panels?

Panels are the primary UI containers in Scoriet. Each panel displays:
- A schema editor
- A template editor
- A preview view
- A settings form
- The tree navigator
- The database explorer

Panels can be:
- **Docked** to the left, right, top, or bottom of the window
- **Floating** as independent windows anywhere on screen
- **Tabbed** together in a single container with multiple items
- **Maximized** to fill the entire workspace

## Opening Panels

### From the Sidebar

The most common way to open a panel:

1. **Click any item** in the sidebar tree (schema, table, template, etc.)
2. A panel automatically opens showing that item's editor or details
3. If a panel already shows that item, it's brought to focus

### From the Create Menu

To open a new empty panel:

1. Click **Create +** in the top navigation
2. Select "New Schema", "New Template", etc.
3. A new panel opens with a blank form ready for input

### Opening in New Panels vs. Tabs

By default:
- **Same type items** open in existing panels (reusing the space)
- **Different types** (schema vs. template) open in new tabs or panels
- **Keyboard shortcut Alt+N** forces opening in a new tab

## Moving and Docking Panels

### Dragging Panels

To move a panel:

1. **Click and hold** the panel title bar or tab
2. **Drag to your target location**
3. Release to dock

### Visual Drop Indicators

As you drag a panel, visual guides show where it will dock:

- **Left/Right arrows** - Dock to sides
- **Top/Bottom arrows** - Dock to top/bottom
- **Center square** - Create a tab group
- **Gray zone** - Float as independent window

:::tip
Drag a panel to the far edge of the screen (past all drop indicators) to float it as an independent window. You'll see a ghost outline showing the floating position.
:::

### Common Docking Layouts

**Side-by-Side Comparison** (Schema editing with preview):
1. Open schema editor in main panel
2. Open template in secondary panel
3. Dock secondary panel to the right

**Vertical Stack** (Navigator above, editor below):
1. Place tree navigator at top
2. Place schema editor below
3. Dock vertically using top/bottom arrows

**Floating Panels** (Multiple monitors):
1. Drag panels away from the main window
2. Move floating windows to secondary monitor
3. Arrange as needed for your workspace

## Tabbed Panels

Panels can group multiple items into tabs for organized navigation.

### Creating Tab Groups

1. **Open two panels** with related items (e.g., two schemas)
2. **Drag one panel onto another**
3. **Release on the center drop indicator**
4. Panels become tabs in a single container

### Managing Tabs

- **Click tabs** to switch between items
- **Right-click a tab** for close/detach options
- **Drag a tab** to reorder or move to different panels
- **Close a tab** with the X button (doesn't close the item)

:::info
Tabs are a visual grouping only. Closing a tab doesn't delete the item or prevent reopening it.
:::

## Maximizing Panels

### Maximize for Focus

When you need to focus on a single panel:

1. **Click the maximize button** (usually a square icon in the panel header)
2. The panel expands to fill the workspace
3. Other panels become hidden but are not closed

### Restoring Normal View

1. **Click the maximize button again** (becomes a restore button)
2. Or press **Alt+M** keyboard shortcut
3. All panels return to their previous layout

:::tip
Use maximize mode for detailed editing tasks or when working with complex templates that need full screen space.
:::

## Panel Groups

Scoriet organizes panels into logical groups with different behaviors:

| Group | Description | Floatable | Closable | Always Visible |
|-------|-------------|-----------|----------|----------------|
| **Top Navigation** | Home, Projects, Settings | No | No | Yes |
| **Sidebar** | Tree navigator and search | Yes | No | Yes |
| **Main Content** | Schema/template editors | Yes | Yes | No |
| **Database Explorer** | Schema and table browser | Yes | Yes | No |
| **Status Bar** | Messages and info | No | No | Yes |

:::caution
Closing all main content panels doesn't close Scoriet—it just hides working areas. Click **Create +** or item in sidebar to open panels again.
:::

## Resizing Panels

### Dragging Panel Borders

Most panels have resizable borders:

1. **Position cursor** on the border between panels
2. **Cursor changes** to a resize handle (↔ or ↕)
3. **Click and drag** to resize

### Sidebar Width

The left sidebar is particularly important to size correctly:

1. **Drag the right edge** of the sidebar to adjust width
2. **Wider sidebar** shows full item names and nested structure
3. **Narrower sidebar** gives more space to main editor panel

### Panel Splitter Positioning

For vertically stacked panels:

1. **Find the horizontal splitter** between panels
2. **Drag up or down** to adjust the split
3. **Double-click** the splitter to collapse one panel

## Saving and Restoring Layouts

### Automatic Layout Saving

Scoriet automatically saves your layout:

- **When you close Scoriet** - Current layout is saved
- **When you move/resize panels** - Changes are saved after a short delay
- **Per project** - Each project remembers its layout separately
- **Per user** - Different team members have independent layouts

### Manual Layout Export

To save a specific layout:

1. **Customize panels** to your preferred arrangement
2. **Click Settings** in top navigation
3. **Go to Workspace > Save Layout**
4. **Name your layout** (e.g., "Schema Review Setup")
5. Click **Save**

### Loading a Saved Layout

1. **Click Settings**
2. **Go to Workspace > Manage Layouts**
3. **Click a saved layout** to load it
4. Your workspace instantly rearranges

:::info
Saved layouts help teams share common workspace configurations. A "Code Review Layout" might show schema and template side-by-side, while a "Template Writing Layout" might maximize the template editor.
:::

## Panel Context Menus

Right-click any panel header or tab for quick actions:

| Action | Purpose |
|--------|---------|
| **Close** | Close this panel (item remains in tree) |
| **Detach** | Float as independent window |
| **Maximize** | Expand to fill workspace |
| **New Tab** | Open another item in this panel |
| **Lock** | Prevent accidental closing |
| **Duplicate** | Open same item in new panel |

## Advanced Panel Features

### Panel Search and Filtering

Some panels (database explorer, template list) include search:

1. **Look for search box** in panel header
2. **Type keywords** to filter contents
3. **Results update live** as you type
4. **Press Esc** to clear search

### Panel Preview Mode

For some items (generated code, templates):

1. **Click Preview tab** in the panel
2. **See generated output** without editing
3. **Click through** to see different generation options

### Panel History

Panels remember what items you've recently viewed:

1. **Click history button** (back/forward arrows in header)
2. **Navigate through** recently viewed items
3. **Useful for switching** between related items frequently

## Troubleshooting Panel Issues

### Panel Appears to Be Missing

**Solution**: It might be floating off-screen.
1. Click **Settings > Workspace > Reset Layout**
2. All panels return to default positions

### Can't Resize Panel

**Solution**: Some panels have fixed sizes. Try:
1. **Float the panel** first (easier to resize floating)
2. **Check settings** for panel size constraints

### Too Many Tabs, Hard to Find Panels

**Solution**: Close unused panels or use floating windows:
1. Right-click tabs and select **Close** on unused items
2. Or drag frequently-used panels to separate floating windows

## Panel Best Practices

### Organize by Task

Create different layouts for different work types:

- **Schema Design** - Sidebar, schema editor, database explorer
- **Template Writing** - Sidebar, template editor, code preview
- **Code Review** - Schema and generated code side-by-side
- **Project Setup** - Project settings, multiple tables open in tabs

### Keep Related Items Together

- **Put schemas in tabs** when comparing database designs
- **Float templates** when writing new template logic
- **Tab different languages** when managing multilingual projects

### Use Maximize Strategically

- **Maximize** when writing complex template code
- **Maximize** when editing detailed table field definitions
- **Return to normal** view after focused editing task

### Monitor Performance

If you have many panels open:
- **Close unused panels** to free memory
- **Close floating windows** you're not actively using
- **Use tabs** instead of floating windows when possible

---

**Related Topics:**
- [Understanding the Workspace](overview.md)
- [Keyboard Shortcuts](keyboard-shortcuts.md) for faster panel control
- [Navigation](navigation.md) for finding panels
