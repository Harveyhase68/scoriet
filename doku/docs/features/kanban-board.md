---
sidebar_position: 3
title: Kanban Board
---

# Kanban Board

The Kanban Board is Scoriet's visual task management tool, perfect for organizing work into columns representing different stages of a process. Drag tasks between columns, assign team members, set priorities, and track progress at a glance.

## What is a Kanban Board?

A Kanban board uses columns to represent workflow stages and cards to represent individual tasks or items:

```
┌──────────────┬──────────────┬──────────────┬──────────────┐
│   Backlog    │   In Progress │   Review     │    Done      │
├──────────────┼──────────────┼──────────────┼──────────────┤
│ [Task 1]     │ [Task 4]     │ [Task 7]     │ [Task 10]    │
│              │              │              │              │
│ [Task 2]     │ [Task 5]     │ [Task 8]     │ [Task 11]    │
│              │              │              │              │
│ [Task 3]     │ [Task 6]     │ [Task 9]     │ [Task 12]    │
│              │              │              │              │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

This visual workflow helps teams:
- See work status at a glance
- Identify bottlenecks (columns with too many tasks)
- Collaborate effectively
- Prioritize work
- Track progress

## Opening the Kanban Board

To create or view a Kanban board:

1. **Click the Kanban Board icon** in the dock
2. **Select or create a board**
3. **Choose a database table** as your data source
4. **Configure columns** representing your workflow

<div class="screenshot-placeholder">Screenshot: Kanban board showing tasks across workflow columns — <code>kanban-board-main.png</code></div>

## Setting Up a Board

### Step 1: Create the Board

1. **Click "New Board"**
2. **Enter board name** (e.g., "Development Tasks", "Sales Pipeline")
3. **Select data source** (database table containing your items)
4. **Click Create**

### Step 2: Configure Columns

Define the workflow stages that represent your process:

```
Example: Software Development
Backlog → Planning → In Progress → Review → Testing → Done

Example: Sales Pipeline
Prospects → Qualified → Proposal → Negotiation → Closed

Example: Content Creation
Ideas → Drafting → Editing → Review → Published
```

To add columns:

1. **Click "Add Column"** button
2. **Enter column name**
3. **Optionally set WIP limit** (Work In Progress limit—max cards allowed)
4. **Repeat for each stage**

### Step 3: Map Fields to Board Elements

Connect your database fields to board elements:

#### Status Field
Select which database field maps to column position:

```
Database Field: status
Values: "backlog", "in_progress", "review", "done"
Maps to: Backlog, In Progress, Review, Done columns
```

#### Title/Name
Which field to display as the card title:

```
Card Title: task_name (e.g., "Build user login API")
```

#### Description
Optional additional text on cards:

```
Card Description: description (shows below title)
```

#### Priority
Highlight cards by priority:

```
Field: priority
High: red background
Medium: yellow background
Low: blue background
```

#### Assignee
Show who's responsible:

```
Field: assigned_to
Display: Team member name
Avatar: Profile picture if available
```

<div class="screenshot-placeholder">Screenshot: Kanban board field mapping configuration — <code>kanban-field-mapping.png</code></div>

## Working with Cards

### Creating New Cards

1. **Click in any column**
2. **Click "Add Card"** or "+"
3. **Enter card details** (title, description, assignee, priority)
4. **Click Save**

The new card appears in the appropriate column based on the status field value.

### Moving Cards

**Drag between columns** to change status:

1. **Click and hold** a card
2. **Drag to new column**
3. **Release to drop**
4. **The database updates** automatically with new status

:::tip
Dragging a card updates the database field immediately. There's no need to save separately.
:::

### Card Details

Click a card to see or edit full details:

```
┌─────────────────────────────┐
│ Build user login API        │
│                             │
│ Description:                │
│ Create authentication       │
│ endpoint with JWT tokens    │
│                             │
│ Assigned: John Smith        │
│ Priority: High              │
│ Due Date: 2026-04-20        │
│ Label: Backend              │
│ Estimate: 8 hours           │
│                             │
│ [Edit] [Delete] [Comment]   │
└─────────────────────────────┘
```

Edit fields directly in the detail view.

## Advanced Features

### Filtering

Show only relevant cards:

1. **Click "Filter"** button
2. **Add filter criteria**:
   - By assignee (show only my tasks)
   - By priority (show only high-priority)
   - By label/tag
   - By due date (overdue, due soon, etc.)

### Searching

Find specific cards:

1. **Click search box**
2. **Type task name** or description
3. **Matching cards highlight**
4. **Escaped search clears** results

### Sorting

Organize cards within columns:

1. **Click column menu** (three dots)
2. **Select sort option**:
   - By due date (earliest first)
   - By priority (high to low)
   - By assignee (alphabetical)
   - By creation date (newest or oldest)

### WIP Limits

Prevent bottlenecks by limiting cards per column:

```
In Progress column:
├─ WIP Limit: 5 cards maximum
├─ Current: 4 cards (OK)
│
Review column:
├─ WIP Limit: 3 cards maximum
├─ Current: 5 cards (OVER LIMIT - highlighted red)
```

When a column hits its WIP limit:
- The column header turns red
- No new cards can be added until one is moved
- Helps prevent work piling up at bottlenecks

### Labels and Tags

Categorize cards with labels:

1. **Click label area** on card
2. **Add or select labels** (Backend, Frontend, Bug, Feature, etc.)
3. **Color-code labels** for quick identification
4. **Filter by label** to see related work

### Due Dates

Set and track deadlines:

1. **Click "Due Date"** field
2. **Select a date**
3. **Card shows visual indicator**:
   - Green: Due later
   - Yellow: Due soon (within 3 days)
   - Red: Overdue

### Time Tracking

Track hours spent on tasks:

1. **Click "Time"** on card
2. **Enter hours spent**
3. **Board can show** total time per column or person
4. **Reports show** time allocation across the team

## Collaboration

### Assigning Tasks

1. **Click "Assign"** field
2. **Select team member** from dropdown
3. **Avatar appears** on card
4. **Assignee notified** (if enabled)

### Comments

Add discussion to tasks:

1. **Click card**
2. **Click "Comments"** tab
3. **Type comment**
4. **@mention teammates** with @ symbol
5. **Comment notifications** sent to mentions

### Activity Log

See what changed and when:

```
2026-04-13 10:30 - John moved task to "In Progress"
2026-04-13 11:15 - Jane added comment "Started initial work"
2026-04-13 14:45 - John updated Priority to "High"
2026-04-13 15:20 - Jane completed task, moved to "Review"
```

## Board Views

### Different Perspectives

Scoriet boards support multiple views of the same data:

#### By Status (Default)
Columns represent workflow stages:
```
Backlog | Planning | Doing | Review | Done
```

#### By Assignee
Columns represent team members:
```
John | Jane | Bob | Unassigned
(cards show status or priority)
```

#### By Priority
Columns represent importance:
```
Urgent | High | Medium | Low | Wishlist
```

#### By Team/Project
Columns represent teams:
```
Frontend | Backend | QA | DevOps | Design
```

Switch views using the **View** dropdown without changing the underlying data.

## Reporting

Get insights into your work:

### Metrics
- **Cards per column**: How many items in each stage
- **Cycle time**: How long items take to complete
- **Throughput**: How many items completed per week
- **Team velocity**: How much work team completes

### Charts
- **Burndown**: Work remaining over time
- **Cumulative flow**: How work moves through stages
- **Velocity trend**: Team productivity over sprints
- **Assignee workload**: Tasks per team member

<div class="screenshot-placeholder">Screenshot: Kanban board with analytics showing cycle time and throughput metrics — <code>kanban-analytics.png</code></div>

## Best Practices

:::tip
**Keep columns focused**: Each column should represent one clear stage. Too many columns confuses the team.
:::

:::tip
**Set realistic WIP limits**: Use WIP limits to prevent bottlenecks. Start with team size and adjust based on experience.
:::

:::tip
**Review regularly**: Have daily standup or regular reviews of the board to discuss blockers and priorities.
:::

:::tip
**Use labels consistently**: Establish label standards so everyone uses them the same way.
:::

:::tip
**Archive completed work**: Move very old completed items to archive so the board stays current.
:::

## Integrations

Kanban boards can integrate with your code generation:

1. **Generate code from board structure**: Create API endpoints for your task management
2. **Embed board in generated app**: Include Kanban view in your generated application
3. **Link to forms**: Use Kanban card data to populate or update related forms

## What's Next?

- Explore [Messaging](./messaging.md) to communicate within Scoriet
- Learn about [Deployment](./deployment.md) to publish Kanban boards
- Set up [Templates](../templates/getting-started.md) for advanced features
