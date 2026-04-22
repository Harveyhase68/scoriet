---
sidebar_position: 4
---

# Keyboard Shortcuts

Master these keyboard shortcuts to dramatically speed up your Scoriet workflow. Shortcuts are designed to be memorable and follow common application patterns.

## Quick Reference Table

### Panel Management

| Shortcut | Action | When to Use |
|----------|--------|------------|
| **Alt + P** | Update/refresh current panel | After making changes, to sync with database |
| **Alt + M** | Maximize/restore current panel | Focus on one task, then restore to see full workspace |
| **Alt + N** | Open in new tab | Open another item without replacing current one |
| **Alt + C** | Close current panel | Remove unused panels to declutter workspace |
| **Alt + F** | Float/dock current panel | Convert floating window to docked, or vice versa |

### Navigation

| Shortcut | Action | When to Use |
|----------|--------|------------|
| **Ctrl + Home** | Go to Projects home | Quickly return to project dashboard |
| **Ctrl + Tab** | Switch to next panel/tab | Navigate between open items |
| **Ctrl + Shift + Tab** | Switch to previous panel/tab | Navigate backwards through items |
| **Ctrl + E** | Focus sidebar search | Jump to search and find items quickly |
| **Ctrl + F** | Find within current panel | Search text in template code or field names |

### Editing

| Shortcut | Action | When to Use |
|----------|--------|------------|
| **Ctrl + S** | Save current item | Save schema, template, or settings changes |
| **Ctrl + Z** | Undo last change | Reverse unintended edits |
| **Ctrl + Y** | Redo change | Redo after undo |
| **Ctrl + A** | Select all | Select all text in field or form |
| **Ctrl + C** | Copy | Copy selected text or items |
| **Ctrl + X** | Cut | Cut selected text |
| **Ctrl + V** | Paste | Paste copied content |

### Creation and Deletion

| Shortcut | Action | When to Use |
|----------|--------|------------|
| **Ctrl + N** | Create new item | New project, schema, template (context-aware) |
| **Ctrl + D** | Duplicate item | Clone schema or template to save time |
| **Delete** | Delete selected item | Remove unwanted schemas, tables, or templates |

### Code Generation and Preview

| Shortcut | Action | When to Use |
|----------|--------|------------|
| **Ctrl + G** | Generate code | Run template code generation |
| **Ctrl + ,** | Show preview | See generated output before committing |
| **Ctrl + Shift + C** | Copy generated code | Copy full generated code to clipboard |

### Settings and Help

| Shortcut | Action | When to Use |
|----------|--------|------------|
| **F1** | Open help/documentation | Get quick help on current feature |
| **Ctrl + ,** | Open settings | Configure application preferences |
| **Ctrl + Shift + ?** | Show shortcuts reference | Quick reference card within the app |

:::info
Shortcuts are shown next to menu items for easy discovery. Look for the shortcut text (e.g., "Alt+P") in menus and buttons.
:::

## Platform-Specific Notes

### Windows/Linux Users

All shortcuts use **Ctrl** for multi-key combinations and **Alt** for panel control:
- Panel control: **Alt** + letter (e.g., Alt+P for update)
- General editing: **Ctrl** + letter (e.g., Ctrl+S for save)

### Mac Users

Shortcuts automatically adapt:
- **Cmd** replaces **Ctrl** (e.g., Cmd+S for save)
- **Alt** remains for panel control (same as Windows)

## Productivity Tips with Shortcuts

### Speed Up Your Workflow

**Scenario: Editing multiple schemas**

1. **Alt + N** - Open schema in new tab (don't replace current)
2. **Ctrl + Tab** - Switch between schema tabs
3. **Alt + M** - Maximize for detailed editing
4. **Alt + M** - Restore to see full workspace
5. **Ctrl + S** - Save changes
6. **Alt + P** - Update if database changed

**Time saved**: Switch between items without using mouse

### Rapid Template Development

**Scenario: Writing and testing a new code generation template**

1. **Ctrl + N** - Create new template
2. Start typing template code
3. **Ctrl + G** - Generate code from template
4. **Ctrl + ,** - Show preview of output
5. **Ctrl + Z** - Undo template edits to try different approach
6. **Ctrl + Y** - Redo to get back to previous version
7. **Ctrl + S** - Save final template

**Time saved**: Test and iterate without leaving keyboard

### Database Schema Comparison

**Scenario: Comparing two database schemas side-by-side**

1. Open first schema (in left panel)
2. **Alt + N** - Open second schema in new tab
3. **Alt + F** - Float first schema panel
4. Drag floating window to secondary monitor or side of screen
5. Click second schema tab to view in original window
6. Both schemas now visible simultaneously

**Time saved**: Visual comparison without switching views

### Batch Operations on Multiple Items

**Scenario: Creating multiple similar templates**

1. Open base template
2. **Ctrl + D** - Duplicate template
3. Rename duplicated template
4. **Ctrl + S** - Save
5. Make small modifications
6. **Ctrl + D** - Duplicate again for next variation
7. Repeat until all variations created

**Time saved**: Template duplication is faster than creating from scratch

## Customizing Shortcuts

### Check Current Shortcuts

To see all available shortcuts in your Scoriet instance:

1. **Click Settings** in top navigation
2. **Go to Keyboard Shortcuts**
3. See all shortcuts, their functions, and descriptions
4. Search for shortcuts by action (e.g., "save")

### Learning Shortcuts Progressively

Don't try to learn all shortcuts at once:

1. **Day 1**: Learn **Alt+P**, **Alt+M**, **Ctrl+S**, **Ctrl+Tab**
2. **Day 2**: Add **Alt+N**, **Ctrl+Z**, **Ctrl+Y**
3. **Day 3**: Add **Ctrl+C**, **Ctrl+V**, **Ctrl+G**
4. **Ongoing**: Add specialized shortcuts as needed

### Memory Aids

**Shortcuts use standard mnemonics**:
- **P** = update (**P**anel content)
- **M** = **M**aximize
- **N** = **N**ew
- **S** = **S**ave
- **Z** = **Z** is used for undo historically
- **Y** = **Y**es (redo)
- **G** = **G**enerate

## Shortcut Reference Card

Print or bookmark this quick reference:

```
┌─────────────────────────────────────────┐
│         SCORIET QUICK SHORTCUTS         │
├─────────────────────────────────────────┤
│ PANEL CONTROL:                          │
│   Alt+P = Update panel                  │
│   Alt+M = Maximize/Restore              │
│   Alt+N = New tab                       │
│   Alt+C = Close panel                   │
│   Alt+F = Float/Dock                    │
├─────────────────────────────────────────┤
│ NAVIGATION:                             │
│   Ctrl+Home = Projects home             │
│   Ctrl+Tab = Next panel                 │
│   Ctrl+Shift+Tab = Prev panel           │
│   Ctrl+E = Search sidebar               │
├─────────────────────────────────────────┤
│ EDITING:                                │
│   Ctrl+S = Save                         │
│   Ctrl+Z = Undo                         │
│   Ctrl+Y = Redo                         │
│   Ctrl+A = Select all                   │
├─────────────────────────────────────────┤
│ GENERATION:                             │
│   Ctrl+N = New item                     │
│   Ctrl+G = Generate code                │
│   Ctrl+, = Show preview                 │
└─────────────────────────────────────────┘
```

## Accessibility

### Keyboard-Only Navigation

Scoriet fully supports keyboard-only users:

- **Tab key** navigates between UI elements
- **Arrow keys** expand/collapse tree nodes
- **Enter** activates buttons and links
- **Space** toggles checkboxes
- **Escape** closes panels and dialogs

### Screen Reader Support

- All buttons and controls have descriptive labels
- Form fields include accessible labels
- Shortcuts are announced by screen readers
- Navigation structure is semantic HTML

## Troubleshooting Shortcuts

### Shortcut Not Working?

**Check these**:
1. Is the correct panel focused? (Some shortcuts require focus on editor)
2. Operating system might override shortcut (e.g., Alt+Tab switches windows)
3. Browser security extensions might intercept shortcuts
4. Check Settings > Keyboard Shortcuts to verify shortcut is enabled

### Conflict with Browser/OS Shortcuts

If Scoriet shortcuts conflict with your browser or OS:

1. **Go to Settings > Keyboard Shortcuts**
2. **Find the conflicting shortcut**
3. **Click to edit** and assign a different key combination
4. Choose a key combo that doesn't conflict with your system

### Can't Remember a Shortcut?

**Use the menus instead**:
1. Shortcuts are shown next to menu items
2. Use the mouse to perform the action
3. The tooltip shows the shortcut—you'll learn it naturally over time

:::tip
Keep Settings > Keyboard Shortcuts page open in a floating panel while learning new shortcuts. Refer to it without losing context of your work.
:::

## Advanced Shortcut Usage

### Creating Custom Macros

For power users, Scoriet supports recording action sequences:

1. **Settings > Advanced > Record Macro**
2. **Perform your common action sequence**
3. **Assign a custom shortcut**
4. **Use the macro anytime** with the custom shortcut

:::caution
Macros are user-specific and project-specific. Export macros if sharing layouts with team members.
:::

### Exporting Shortcut Configurations

To share your shortcut setup with team members:

1. **Settings > Keyboard Shortcuts > Export**
2. **Save to a file**
3. **Share file** with teammates
4. They can import: **Settings > Keyboard Shortcuts > Import**

---

**Related Topics:**
- [Working with Panels](dock-panels.md) - Panel operations you can control with shortcuts
- [Navigation](navigation.md) - Additional navigation methods beyond shortcuts
