---
sidebar_position: 1
title: Form Designer
---

# Form Designer

The Form Designer is Scoriet's visual interface builder for creating data entry and display forms. It provides a drag-and-drop interface for laying out form fields, organizing them logically, and previewing how they'll look to end users. Forms created here automatically generate code for your chosen platform.

## Opening the Form Designer

To open the Form Designer:

1. **Click the Form Designer icon** in the dock or sidebar
2. **Create a new form** or open an existing one
3. **The designer panel opens** with a canvas and component palette

<div class="screenshot-placeholder">Screenshot: Form Designer interface with components palette and canvas — <code>form-designer-main.png</code></div>

## Understanding the Interface

The Form Designer interface consists of several key areas:

```
┌─────────────────────────────────────────────┐
│  [File] [Edit] [View] [Template] [Deploy]  │
├─────────────────────────────────────────────┤
│ Components │           Canvas              │ Properties
│  Palette   │                                │  Panel
│            │  [Visual Form Preview]        │
│  ┌──────┐  │  ┌────────────────────────┐   │
│  │Input │  │  │ ┌ First Name ┐         │   │
│  │──────│  │  │ │ _________ │         │   │
│  │Button│  │  │ └───────────┘         │   │
│  │──────│  │  │                        │   │
│  │Label │  │  │ ┌ Email ┐             │   │
│  │──────│  │  │ │ _________ │         │   │
│  │Grid  │  │  │ └───────────┘         │   │
│  │──────│  │  │                        │   │
│  │Tab   │  │  │ [Submit] [Cancel]     │   │
│  │──────│  │  │                        │   │
│  │Panel │  │  └────────────────────────┘   │
│  └──────┘  │                                │
└─────────────────────────────────────────────┘
```

### Components Palette
The left side contains available components:
- **Input Fields**: Text, Email, Password, Number, Date, etc.
- **Selection**: Dropdown, Radio, Checkbox, Multi-select
- **Layout**: Panels, Tab sets, Groupings, Spacers
- **Display**: Labels, Images, Titles, Descriptions
- **Actions**: Buttons, Links, Toolbars

### Canvas
The center area shows your form layout. Drag components here to build your form.

### Properties Panel
The right side shows detailed properties for selected components:
- General properties (name, label, caption)
- Validation rules
- Styling and appearance
- Binding to database fields
- Event handlers

## Creating a Form

### Step 1: Set Up the Form

1. **Click "New Form"** to create a form
2. **Enter a form name** (e.g., "User Registration")
3. **Select a table** from your database schema
4. **Choose form type**:
   - **Create/Insert**: For adding new records
   - **Edit/Update**: For modifying existing records
   - **View/Read**: For displaying data (read-only)
   - **Search/Filter**: For finding records

### Step 2: Drag Components

1. **Select a component** from the palette (e.g., Text Input)
2. **Drag it to the canvas**
3. **Drop it in the desired location**
4. **The component appears** on your form

:::tip
Components snap to a grid to maintain alignment. Hold Shift while dragging to bypass grid snap for fine positioning.
:::

### Step 3: Bind to Database Fields

Each input component should bind to a database field:

1. **Click the input component**
2. **In Properties panel, find "Bind To"**
3. **Select a database field** from the dropdown
4. **The field's properties** (caption, type, validation) auto-populate

Example bindings:
```
Text Input → users.first_name
Email Input → users.email_address
Date Picker → users.birth_date
Dropdown → users.country_id (Foreign Key)
```

<div class="screenshot-placeholder">Screenshot: Form designer showing field binding configuration — <code>field-binding.png</code></div>

### Step 4: Configure Component Properties

Each component has properties you can customize:

#### For Text Inputs
- **Label**: "First Name"
- **Placeholder**: "John"
- **Required**: Yes/No
- **Min/Max Length**: Character limits
- **Pattern**: Validation regex
- **Mask**: Input formatting (phone: (555) 123-4567)

#### For Selectors (Dropdown, Radio)
- **Options**: Static list or database query
- **Multi-select**: Allow multiple choices
- **Searchable**: Add search box for long lists
- **Option Format**: What to display vs. store

#### For Date/Time
- **Format**: Display format (YYYY-MM-DD, MM/DD/YYYY, etc.)
- **Min/Max Date**: Restrict selectable date range
- **Time Included**: Date only or date + time
- **Default**: Today, empty, specific date

#### For File Upload
- **Accepted Types**: pdf, images, all files
- **Max File Size**: Upload limit (10MB, 100MB, etc.)
- **Multiple Files**: Allow multiple uploads
- **Storage Location**: Where to save files

### Step 5: Arrange Layout

#### Groups and Panels
Group related fields together:

```
┌─ Personal Information ─────┐
│ ├─ First Name              │
│ └─ Last Name               │
└───────────────────────────┘

┌─ Contact Information ──────┐
│ ├─ Email                   │
│ └─ Phone                   │
└───────────────────────────┘
```

#### Tabs
Organize into tabs for complex forms:

```
[Personal] [Contact] [Address] [Preferences]
```

#### Columns
Display fields side-by-side:

```
[First Name]          [Last Name]
[Email]               [Phone]
```

#### Responsive Design
Set column widths for different screen sizes:

```
Desktop: 2 columns
Tablet: 1 column
Mobile: 1 column
```

### Step 6: Add Action Buttons

Add buttons to control form behavior:

1. **Drag a Button** component to the form
2. **Set button properties**:
   - **Text**: "Submit", "Save", "Cancel", "Reset"
   - **Type**: Primary (blue), Secondary (gray), Danger (red)
   - **Action**: Submit form, Close, Clear, Custom code

Common button layouts:

```
[Submit] [Cancel]       (Left-aligned)
                [Save]  (Right-aligned)
[Save] [Save As] [Close] (Multiple actions)
```

:::tip
Always provide a Cancel button alongside Save—users appreciate being able to exit without changes.
:::

## Form Sets and Tabs

For complex data entry, organize forms into sets:

### Creating Form Sets

1. **Create first form** (e.g., "User Details")
2. **Create second form** (e.g., "User Preferences")
3. **Create third form** (e.g., "User Permissions")
4. **Link them together** as a Form Set
5. **Define navigation order** and transitions

### Example Form Set
```
Form Set: "User Management"
├─ Tab 1: Basic Information
│  ├─ Name
│  ├─ Email
│  └─ Status
├─ Tab 2: Contact Information
│  ├─ Phone
│  ├─ Address
│  └─ City
└─ Tab 3: Permissions
   ├─ Admin
   ├─ Editor
   └─ Viewer
```

## Validation Rules

Forms should validate data before submission. Configure validation rules:

### Field-Level Validation

For each field, set:
- **Required**: Must contain a value
- **Min/Max Length**: Text length constraints
- **Email Format**: Valid email required
- **Number Range**: Min/max numeric values
- **Date Range**: Future/past date constraints
- **Pattern**: Regular expression matching
- **Custom Rule**: JavaScript code for complex validation

### Form-Level Validation

Rules that check across multiple fields:

```javascript
// Password must match password confirmation
if (password !== confirm_password) {
  showError("Passwords do not match");
}

// At least one contact method required
if (!email && !phone && !address) {
  showError("Please provide at least one contact method");
}

// End date must be after start date
if (end_date <= start_date) {
  showError("End date must be after start date");
}
```

## Live Preview

See how your form looks to users:

1. **Click "Preview"** button or toggle preview mode
2. **The canvas shows** how the form renders
3. **Try entering data** to see validation in action
4. **Test buttons** to verify they work
5. **Check responsive design** by resizing

<div class="screenshot-placeholder">Screenshot: Form designer preview showing rendered form with sample data — <code>form-preview.png</code></div>

:::tip
Preview mode lets you test your form before generating code. Try entering invalid data to see validation messages.
:::

## Theme and Styling

Customize the form's appearance:

### Form-Level Styling
- **Background color**: Light, dark, custom
- **Layout width**: Fixed (800px), fluid (100%), responsive
- **Padding/spacing**: Inner and outer margins
- **Border style**: Outline, shadow, none

### Field Styling
- **Label position**: Above, left side, inline
- **Label width**: Fixed pixels or percentage
- **Required indicator**: Show asterisk or text
- **Help text position**: Below field, tooltip, inline

### Button Styling
- **Button size**: Small, medium, large
- **Button style**: Solid, outline, text
- **Button placement**: Left, center, right, spread

## Code Generation

Once your form is complete:

1. **Click "Generate Code"**
2. **Select your template** (HTML/CSS, React, Vue, Angular, etc.)
3. **Choose options**:
   - Include validation code
   - Include API integration
   - Include styling (inline, CSS file, Tailwind)
   - Include internationalization
4. **Review the code** in preview
5. **Export or copy** the generated code

The generated form includes:
- HTML/JSX markup
- CSS styling
- Validation logic
- API integration
- Error handling
- Accessibility attributes

## Form Analytics and Testing

### Testing Checklist
- [ ] All required fields are marked
- [ ] Field labels are clear and professional
- [ ] Validation messages are helpful
- [ ] Form works on mobile devices
- [ ] Buttons are properly positioned
- [ ] Tab order flows logically (keyboard navigation)
- [ ] Color contrast is sufficient (accessibility)

### Common Issues
| Issue | Solution |
|-------|----------|
| Form too long | Split into multiple tabs or pages |
| Fields unclear | Add Help Text explaining each field |
| Validation confusing | Show inline error messages |
| Mobile layout breaks | Test at different widths |
| Missing fields | Compare with database schema |

## Tips and Best Practices

:::tip
**Use the database schema**: Bind fields to your database—properties like captions and validation rules transfer automatically.
:::

:::tip
**Group related fields**: Users find forms easier to understand when related fields are grouped together.
:::

:::tip
**Minimize required fields**: Only mark fields as required if truly necessary. Optional fields give users flexibility.
:::

:::tip
**Consistent layout**: Align labels, inputs, and buttons consistently throughout the form.
:::

:::tip
**Mobile-first design**: Test your forms on mobile devices. Many users access apps on phones.
:::

:::tip
**Clear error messages**: When validation fails, tell users exactly what's wrong: "Email must be valid format (user@example.com)" instead of just "Invalid email".
:::

## What's Next?

- Explore [Report Designer](./report-designer.md) for displaying data in tables and charts
- Learn about [Deployment](./deployment.md) to publish your forms
- Set up [Templates](../templates/getting-started.md) for code generation

