---
sidebar_position: 1
---

# Form Designer

## Overview

The Form Designer is a visual WYSIWYG (What You See Is What You Get) form layout editor that allows users to create professional forms and windows for database applications. It combines visual design with property-based configuration to generate responsive, feature-rich forms.

![Form Designer](/img/screenshots/form_designer.png)
*The visual Form Designer with drag-and-drop element placement, property panel, and live preview*

## Key Features

- **Visual Form Builder** - Drag-and-drop interface for form design
- **Multi-Window Support** - Create multiple window types (main menu, create/edit, data table)
- **Element Types** - Containers, tabs, buttons, separators, and field placements
- **Grid Snapping** - Precise positioning with optional grid alignment
- **Responsive Design** - Anchor-based responsive layouts
- **Custom Colors** - Per-window and per-element color customization
- **Tab Ordering** - Define keyboard navigation order
- **Live Preview** - See changes in real-time

## Architecture

### FormDesignerPanel Component

**Location:** `resources/js/Components/Panels/FormDesignerPanel.tsx`

The main designer panel handles:
- Form set management (collections of related forms/windows)
- Window type management (main_menu, create_edit, data_table)
- Visual element placement using ReactFlow
- Property editing for selected elements
- Access control (feature locked behind credits/patron status)

```typescript
interface FormSet {
  id: number;
  name: string;
  description?: string;
  creator_user_id: number;
  visibility: 'private' | 'team' | 'public';
  cloned_from_id?: number;
  default_background_color: string;
  default_window_color: string;
  default_text_color: string;
  default_button_color: string;
  default_button_text_color: string;
  is_active: boolean;
  windows?: FormWindow[];
  windows_count?: number;
}

interface FormWindow {
  id: number;
  form_set_id: number;
  name: string;
  display_name?: string;
  window_type: 'main_menu' | 'create_edit' | 'data_table';
  min_width: number;
  min_height: number;
  default_width: number;
  default_height: number;
  background_color?: string;
  window_color?: string;
  text_color?: string;
  is_active: boolean;
  sort_order: number;
  elements?: FormElement[];
}
```

## Window Types

### main_menu
Primary application menu window. Typically shows:
- Navigation buttons
- Application options
- Main entry point

**Default Dimensions:**
- Width: 800px
- Height: 600px
- Min Width: 400px
- Min Height: 300px

### create_edit
Form for creating and editing records. Displays:
- Input fields linked to database columns
- Containers for field grouping
- Save/Cancel buttons
- Validation feedback

**Default Dimensions:**
- Width: 600px
- Height: 500px
- Min Width: 300px
- Min Height: 250px

### data_table
Tabular data display with inline editing. Features:
- Column headers
- Row data
- Edit/Delete buttons
- Sorting and filtering

**Default Dimensions:**
- Width: 900px
- Height: 600px
- Min Width: 500px
- Min Height: 400px

## Form Elements

### Element Types

```typescript
interface FormElement {
  id?: number;
  form_window_id: number;
  element_type: string;  // See Element Type Reference
  x_position: number;
  y_position: number;
  width: number;
  height: number;
  sort_order: number;
  is_visible: boolean;
  
  // Element-specific properties (see below)
  ...
}
```

### Container Elements

#### container_simple
Basic container for grouping elements.

```typescript
{
  element_type: 'container_simple',
  container_orientation: 'vertical' | 'horizontal',
  container_gap: 10,  // Spacing between children
  container_columns?: 2  // Number of columns (if horizontal)
}
```

#### container_tab
Tab container allowing multiple grouped views within one window.

```typescript
{
  element_type: 'container_tab',
  max_fields: 5,  // Max fields per tab
  default_control_height: 25
}
```

#### container_grid
Grid layout container for complex arrangements.

```typescript
{
  element_type: 'container_grid',
  container_columns: 3,
  container_gap: 10,
  max_fields: 20
}
```

### Button Elements

```typescript
{
  element_type: 'button_save',
  button_label: 'Save',
  button_icon: 'pi-save',
  button_action: 'save',
  button_background_color: '#10b981',
  button_text_color: '#ffffff'
}
```

**Common Buttons:**
- button_save - Save data
- button_cancel - Cancel edit
- button_new - Create new record
- button_delete - Delete record
- button_nav_first - Navigate to first
- button_nav_prev - Navigate previous
- button_nav_next - Navigate next
- button_nav_last - Navigate to last

### Separator Elements

```typescript
{
  element_type: 'separator_horizontal' | 'separator_vertical',
  width: 100,
  height: 1,
  background_color: '#e5e7eb'
}
```

### Field Placement

Links database schema fields to form inputs:

```typescript
{
  element_type: 'field_textinput' | 'field_number' | 'field_date' | etc,
  field_name: 'user_email',  // Links to schema field
  control_type: 'text' | 'number' | 'date' | 'dropdown',
  link_table?: 'users',  // For dropdown: lookup table
  link_field?: 'id',     // For dropdown: lookup field
  link_display_field?: 'name'  // For dropdown: display field
}
```

## Grid Snapping

Grid-based positioning ensures aligned layouts:

```typescript
// Project settings control grid behavior
interface Project {
  form_designer_snap_to_grid: boolean;
  form_designer_grid_size: number;  // e.g., 10px
}

// Snap element position to grid
const snapToGrid = (position: number, gridSize: number) => {
  return Math.round(position / gridSize) * gridSize;
};
```

## Anchoring (Responsive Layout)

Anchor values define how elements resize when window size changes:

```typescript
interface FormElement {
  // Anchor positions relative to right and bottom
  anchor_right?: number | null;      // Distance from right edge
  anchor_bottom?: number | null;     // Distance from bottom edge
  anchor_width?: number | null;      // Fixed or proportional width
  anchor_height?: number | null;     // Fixed or proportional height
}

// Anchor types:
// null = use position (left/top anchoring)
// number = distance from right/bottom edge
```

**Common Anchor Patterns:**

```typescript
// Stretch horizontally
{
  x_position: 0,
  anchor_right: 0,  // Stick to right
  width: 100
}

// Fixed position, stretches right
{
  x_position: 10,
  anchor_right: null  // Ignore right, use position
}

// Bottom-right button
{
  x_position: undefined,
  y_position: undefined,
  anchor_right: 10,
  anchor_bottom: 10
}
```

## Custom Styling

### Form Set Colors

```typescript
const formSet = {
  default_background_color: '#f8fafc',  // Page background
  default_window_color: '#ffffff',       // Window background
  default_text_color: '#1e293b',         // Text color
  default_button_color: '#2563eb',       // Button background
  default_button_text_color: '#ffffff'   // Button text
};
```

### Per-Element Colors

```typescript
const element = {
  button_background_color: '#10b981',
  button_text_color: '#ffffff',
  background_color: '#f3f4f6',
  border_width: 1,
  border_color: '#d1d5db'
};
```

## Tab Ordering

![Form Designer Tab Order](/img/screenshots/form_designer_tab_order.png)
*Setting the tab navigation order for form elements*

Defines keyboard navigation sequence (Tab key):

```typescript
const element = {
  tab_order: 1  // Order in tab sequence (1-based)
};

// Usage: User presses Tab → moves to next element by tab_order
```

## Visibility Rules

Control element visibility based on conditions:

```typescript
const element = {
  is_visible: true,  // Can be toggled by JavaScript
  custom_style: {
    display: element.is_visible ? 'block' : 'none'
  }
};
```

## Design Workflow

### 1. Create Form Set

```
Dashboard → New Form Set → Name: "Customer Forms"
```

### 2. Create Window

```
Form Set → New Window → Select Type: "create_edit"
Configure: Name, dimensions, colors
```

### 3. Add Elements

```
Window → Add Container → Add Fields → Add Buttons
Arrange visually on canvas
```

### 4. Configure Properties

```
Click Element → Edit Properties Panel → Update styling
Set field links → Save
```

### 5. Preview

```
Live Preview Mode → Test responsiveness → Adjust as needed
```

### 6. Publish

```
Activate Form Set → Generate → Ready for application
```

## API Endpoints

### Form Sets

```
POST   /api/form-sets                    # Create new form set
GET    /api/form-sets                    # List form sets
GET    /api/form-sets/{id}              # Get form set details
PUT    /api/form-sets/{id}              # Update form set
DELETE /api/form-sets/{id}              # Delete form set
POST   /api/form-sets/{id}/clone        # Clone form set
```

### Windows

```
POST   /api/form-windows                 # Create window
GET    /api/form-windows/{id}           # Get window
PUT    /api/form-windows/{id}           # Update window
DELETE /api/form-windows/{id}           # Delete window
```

### Elements

```
POST   /api/form-elements                # Create element
GET    /api/form-elements/{id}          # Get element
PUT    /api/form-elements/{id}          # Update element
DELETE /api/form-elements/{id}          # Delete element
```

## Access Control

The Form Designer is a premium feature:

```typescript
interface AccessStatus {
  has_access: boolean;
  access_type?: 'credits' | 'patron';
  patron_level?: string;
  credits_paid?: number;
  granted_at?: string;
  expires_at?: string;
  days_remaining?: number;
  is_patron?: boolean;
  is_expired?: boolean;
  can_renew?: boolean;
  unlock_cost?: number;
  user_credits?: number;
}
```

**Access Methods:**
1. **Patron Membership** - Grants lifetime access
2. **Credit Purchase** - One-time fee
3. **Trial** - Limited-time access

## Integration with Code Generation

Forms are integrated into the code generation pipeline:

1. **Design Form** → Form Designer
2. **Generate Template** → Code Generator
3. **Deploy Code** → Generated application includes the form

```typescript
// Generated code references form configuration
const form = await loadForm('CustomerForm');
const ui = generateUI(form.elements, form.window_type);
```

## Best Practices

1. **Use Consistent Naming** - Clear, descriptive window and element names
2. **Plan Responsive** - Design for mobile first, then expand
3. **Group Logically** - Use containers to organize related fields
4. **Color Consistency** - Use form set default colors
5. **Test Responsiveness** - Try different window sizes
6. **Version Control** - Clone forms before major changes
7. **Document Fields** - Add descriptions for field purposes

## Common Patterns

### CRUD Form (Create/Edit/Delete)

```
Window Type: create_edit
Elements:
  - Container (vertical)
    - Field: Name (textinput)
    - Field: Email (textinput)
    - Field: Status (dropdown)
    - Separator
    - Container (horizontal)
      - Button: Save
      - Button: Cancel
```

### Data Table

```
Window Type: data_table
Elements:
  - DataTable with columns:
    - Name
    - Email
    - Status
    - Actions (Edit/Delete buttons)
```

### Multi-Tab Form

```
Window Type: create_edit
Elements:
  - TabContainer
    - Tab 1: General Info
      - Field: Name
      - Field: Email
    - Tab 2: Settings
      - Field: Preferences
      - Field: Notifications
```

## Troubleshooting

### Elements Not Appearing
- Check `is_visible` property
- Verify z-index/layer ordering
- Check color contrast (may be invisible on background)

### Layout Breaking on Resize
- Review anchor configuration
- Ensure responsive units (%, relative sizes)
- Test with different viewport sizes

### Fields Not Linking
- Verify field names match schema
- Check link_table and link_field configuration
- Ensure database connection is active

## Next Steps

- [Report Designer](report-designer.md) - Create professional reports
- [Form Sets](../frontend/panels.md) - Manage form collections
- [Code Generation](../features/deployment.md) - Generate applications from forms
