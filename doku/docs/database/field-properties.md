---
sidebar_position: 5
title: Field Properties
---

# Field Properties

Field properties are the extended metadata that Scoriet associates with each database field. Beyond the basic data type from your database, field properties tell Scoriet how to treat the field in forms, API responses, validation rules, and code generation. Understanding and configuring these properties is essential for generating high-quality code.

## Where to Edit Field Properties

To edit a field's properties:

1. **Open the Schema Explorer**
2. **Expand your database and table**
3. **Click on a field name**
4. **The Properties panel opens** on the right side
5. **Edit any property** and changes save automatically

<div class="screenshot-placeholder">Screenshot: Field properties panel showing all editable properties — <code>field-properties-edit.png</code></div>

## Core Field Properties

### Name
- **Database field name** (e.g., `first_name`, `user_email`)
- **Read-only** - comes from database
- **Used in**: Generated code, API responses, queries

### Data Type
- **The database column type** (VARCHAR, INT, DATETIME, etc.)
- **Read-only** - determined by database schema
- **Affects**: Validation, input control selection, default values

## Display Properties

These properties control how the field appears to end users.

### Caption
The human-readable label for this field:

```
Database Field: first_name
Caption: First Name

Database Field: email_address
Caption: Email Address

Database Field: birthdate
Caption: Date of Birth
```

**When Used:**
- Form labels
- Report column headers
- API documentation
- Export column names
- Validation error messages

:::tip
Use proper sentence case for captions. "Email Address" is better than "email address" or "EMAIL ADDRESS".
:::

### Help Text
Additional guidance displayed below or near the field:

```
Help Text: "We'll use this to contact you about your account."
Help Text: "Must be at least 8 characters long"
Help Text: "Format: YYYY-MM-DD"
```

This text is shown in forms to guide users on what to enter.

### Placeholder Text
Hint text that appears inside empty input fields:

```
Placeholder: "you@example.com"
Placeholder: "John Doe"
Placeholder: "Choose a category..."
```

The placeholder disappears when the user starts typing.

## Control Type

The **Control Type** determines what kind of form input element is generated:

| Control Type | Use Case | Example |
|---|---|---|
| **Text Input** | Short text, names, email | Name, Address |
| **Email** | Email addresses with validation | Email Address, Support Email |
| **Password** | Sensitive text (masked) | Password, API Key |
| **Text Area** | Longer text content | Description, Bio, Comments |
| **Number** | Numeric values | Age, Quantity, Price |
| **Decimal** | Decimal numbers | Price, Rating, Percentage |
| **Date** | Calendar date selection | Birth Date, Invoice Date |
| **DateTime** | Date and time | Created At, Last Modified |
| **Time** | Time only | Start Time, Appointment Time |
| **Checkbox** | Boolean true/false | Active, Verified, Is Admin |
| **Toggle** | On/off switch | Enabled, Public/Private |
| **Select Dropdown** | Choose from list | Country, Status, Category |
| **Multi-Select** | Choose multiple | Roles, Permissions, Tags |
| **Radio Button** | Exclusive choice (few options) | Gender, Rating |
| **File Upload** | Upload files | Avatar, Document, Photo |
| **Textarea HTML** | Rich HTML editor | Bio, Description, Content |
| **Color Picker** | Color selection | Brand Color, Highlight Color |
| **JSON Editor** | JSON data input | Configuration, Settings |
| **Lookup/Foreign Key** | Select from related table | User ID, Department, Category |

### Selecting Control Type

When you select a **Lookup/Foreign Key** control:

1. **Choose the related table** (where the foreign key points to)
2. **Select display field** (what to show user: e.g., `name` instead of `id`)
3. **Optionally add search** to find records in large tables

Example: A `user_id` field with control type "Lookup" might show:
- List of all users' names
- User can search by name
- Selected user's ID is saved

<div class="screenshot-placeholder">Screenshot: Control type selector dropdown with all available options — <code>control-type-selector.png</code></div>

## Validation Properties

Validation properties define rules that must be satisfied when users enter data.

### Required
- **Values**: Yes, No, Optional
- **Effect**: Field must contain a value before form submission
- **Generated**: Required validators in form code, database NOT NULL constraint check

### Unique
- **Values**: Yes, No
- **Effect**: This field's value must be different for each record
- **Generated**: Uniqueness validation in API layer, duplicate-check logic

:::info
Some fields are marked as Unique at the database level. These properties should match your database constraints.
:::

### Minimum Length
For text fields, the minimum number of characters required:

```
Username: minimum 3 characters
Password: minimum 8 characters
```

### Maximum Length
For text fields, the maximum number of characters allowed:

```
Username: maximum 50 characters
Email: maximum 255 characters
```

:::tip
Set max length to match your database field width (e.g., VARCHAR(50) = max 50 characters).
:::

### Email Validation
For email fields, generate validation that ensures valid email format:

```
Format validation: user@example.com
Reject: user@example (missing domain)
Reject: user.example.com (missing @)
```

### Custom Regex Pattern
For advanced validation with regular expressions:

```
Phone: ^[0-9]{10}$
Postal Code: ^[0-9]{5}(-[0-9]{4})?$
```

:::caution
Regular expressions are powerful but can be complex to maintain. Use built-in validators (email, phone) when available before resorting to regex.
:::

## Data Properties

### Default Value
The value automatically assigned if user doesn't enter anything:

```
Status: "active" (new records default to active)
Created At: CURRENT_TIMESTAMP (auto-set to now)
Views: 0 (start at zero)
```

### Read-Only
- **Values**: Yes, No
- **Effect**: User cannot edit this field
- **Use Case**: System-generated fields, audit fields, calculated values

Read-only fields are common for:
- `id` (auto-generated primary key)
- `created_at` (timestamp set by system)
- `calculated_total` (computed from other fields)

:::tip
Setting a field as read-only prevents accidental user modification while still allowing viewing.
:::

### Hidden
- **Values**: Yes, No
- **Effect**: Field is not displayed in forms but may be stored and used in code
- **Use Case**: System fields, legacy data, backend-only values

Hidden fields are useful for:
- Technical IDs that users don't need to see
- Fields populated by code (not user input)
- Fields being phased out

## Format Properties

### Display Format
Controls how field values are displayed (read-only context):

```
Currency: $1,234.56 (for price fields)
Percentage: 42% (for rate fields)
Date: 2026-04-13 (format YYYY-MM-DD)
Date: April 13, 2026 (format MMMM DD, YYYY)
Time: 14:30:00 (24-hour format)
Phone: +1 (555) 123-4567 (US format)
```

### Number Decimals
For numeric fields, how many decimal places to display:

```
Price: 2 decimals (19.99)
Percentage: 1 decimal (85.5%)
Measurement: 3 decimals (12.345 meters)
Whole numbers: 0 decimals (42)
```

## Relationship Properties

These properties identify relationships between tables.

### Primary Key
- **Read-only** - automatically detected from database
- **Values**: Yes, No
- **Meaning**: This field uniquely identifies each row in the table
- **Generated**: ID fields in models, unique database constraints

Every table should have exactly one primary key:

```
users table → PRIMARY KEY: id
products table → PRIMARY KEY: product_code
junction_table → PRIMARY KEY: (user_id, role_id) [composite]
```

### Foreign Key
- **Read-only** - automatically detected from database
- **Referenced Table**: Which table this field links to
- **Referenced Field**: Which field in that table (usually the PK)
- **Cascade Options**: ON DELETE behavior

Example foreign key configuration:

```
Field: user_id
Referenced Table: users
Referenced Field: id
On Delete: CASCADE (delete orders if user is deleted)
On Update: CASCADE (update if user id changes)
```

:::caution
Foreign key constraints maintain referential integrity—you cannot delete a user if orders still reference them (unless ON DELETE CASCADE is set).
:::

### Lookup Field
For fields with lookup control type, specify what to display:

```
user_id (Foreign Key) →
  Show Field: name (display user's name)
  Search Fields: name, email (can search by name or email)
```

## Business Logic Properties

### Calculated
- **Values**: Yes, No
- **Formula/Expression**: How to compute the value
- **Generated**: Automatically computed in queries and API responses

Example calculated fields:

```
full_name = CONCAT(first_name, ' ', last_name)
total_price = quantity * unit_price
status_text = IF(is_active, 'Active', 'Inactive')
```

### Sortable
- **Values**: Yes, No
- **Effect**: Users can click column header to sort by this field
- **Used in**: List views, reports, data exports

Some fields don't make sense to sort:

```
Sortable: YES - name, created_at, status, price
Sortable: NO - photo, description, JSON data, file uploads
```

### Searchable
- **Values**: Yes, No
- **Effect**: This field can be searched/filtered in list views
- **Used in**: Search functionality, filters, quick find

## Property Template Example

Here's what a complete field might look like:

```
Field: user_id
├─ Display
│  ├─ Caption: User
│  ├─ Help Text: Select the user this order belongs to
│  └─ Control Type: Lookup (Foreign Key)
├─ Validation
│  ├─ Required: Yes
│  ├─ Unique: No
│  └─ Foreign Key Validation: Yes
├─ Database
│  ├─ Data Type: BIGINT
│  ├─ Nullable: No
│  ├─ Primary Key: No
│  └─ Foreign Key: REFERENCES users(id)
└─ Behavior
   ├─ Read-only: No
   ├─ Hidden: No
   └─ Sortable: Yes
```

## Best Practices

:::tip
**Set all captions**: Every field should have a clear, user-friendly caption.
:::

:::tip
**Choose appropriate control types**: Let the field's purpose guide your choice—email fields should use Email control, dates should use Date picker, etc.
:::

:::tip
**Validate early**: Set proper validation (required, min/max length) to catch errors before they reach your database.
:::

:::tip
**Document complex fields**: Use Help Text to explain fields that might confuse users.
:::

:::tip
**Review before generating**: Before generating code with templates, review your field properties to ensure they're correct—they directly impact the generated code quality.
:::

## Exporting Field Properties

You can export field configurations for backup or sharing:

1. **Right-click on a table** in Schema Explorer
2. **Select "Export Field Properties"**
3. **File includes**: All captions, control types, validation rules
4. **Format**: JSON or CSV

This is useful for:
- Backing up field customizations
- Sharing configurations with teammates
- Version control (track property changes)
- Reusing properties across similar projects

## What's Next?

With field properties configured, you're ready to:
- Use the [Form Designer](../features/form-designer.md) to create interfaces
- Build [Templates](../templates/getting-started.md) that generate code
- Deploy your generated applications

