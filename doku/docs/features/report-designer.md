---
sidebar_position: 2
title: Report Designer
---

# Report Designer

The Report Designer is Scoriet's tool for creating data reports, dashboards, and display layouts. Whether you need simple lists, complex multi-section reports, or visual dashboards with charts, the Report Designer lets you design professionally formatted output that showcases your data.

## Opening the Report Designer

To create or edit reports:

1. **Click the Report Designer icon** in the dock
2. **Create new report** or select existing
3. **Choose data source** (a database table or query)
4. **Start designing** with the visual builder

<div class="screenshot-placeholder">Screenshot: Report Designer interface with layout builder and component palette — <code>report-designer-main.png</code></div>

## Understanding Report Types

Choose the report type that matches your needs:

### Tabular Report
Classic column-based layout showing records as rows:

```
┌─────────────┬─────────────┬──────────────┐
│ Name        │ Email       │ Created      │
├─────────────┼─────────────┼──────────────┤
│ John Smith  │ john@ex.com │ 2026-01-15   │
│ Jane Doe    │ jane@ex.com │ 2026-02-20   │
│ Bob Wilson  │ bob@ex.com  │ 2026-03-10   │
└─────────────┴─────────────┴──────────────┘
```

Best for: Lists, inventories, transaction logs

### Grouped Report
Data organized into groups with subtotals:

```
Department: Engineering
├─ John Smith    $85,000
├─ Jane Doe      $92,000
├─ Bob Wilson    $78,000
└─ Subtotal: $255,000

Department: Sales
├─ Alice Brown   $75,000
├─ Charlie Davis $68,000
└─ Subtotal: $143,000

TOTAL: $398,000
```

Best for: Sales by region, inventory by category, data rolled up by groups

### Cross-Tab Report
Matrix format with dimensions and values:

```
           Q1      Q2      Q3      Q4      Total
Product A  $10K    $12K    $15K    $18K    $55K
Product B  $8K     $9K     $11K    $13K    $41K
Product C  $12K    $11K    $10K    $9K     $42K
Total      $30K    $32K    $36K    $40K    $138K
```

Best for: Financial analysis, performance metrics, comparative data

### Free-Form Report
Custom layout with flexible positioning:

```
┌──────────────────────────────────┐
│ Sales Report - Q1 2026           │
│                                  │
│ Total Sales: $250,000            │
│ % Growth: +15%                   │
│                                  │
│ [Chart: Sales Trend]             │
│                                  │
│ Top 5 Products:                  │
│ 1. Product A - $45,000           │
│ 2. Product B - $38,000           │
│ ... more details ...             │
└──────────────────────────────────┘
```

Best for: Executive summaries, marketing materials, custom layouts

## Designing a Report

### Step 1: Set Basic Properties

1. **Enter Report Name** (e.g., "Monthly Sales Report")
2. **Select Report Type** (Tabular, Grouped, Cross-Tab, Free-Form)
3. **Choose Data Source** (database table or custom query)
4. **Configure Filters** (optional—show only certain records)

### Step 2: Arrange Columns

For tabular and grouped reports, select which fields to display:

```
Available Fields          Selected Columns
┌──────────────────┐    ┌──────────────────┐
│ id               │    │ first_name ↑↓    │
│ first_name   ✓   │←→  │ email ↑↓          │
│ email        ✓   │    │ created_at ↑↓    │
│ phone            │    │ [Remove]          │
│ address          │    └──────────────────┘
│ created_at   ✓   │
│ status           │
└──────────────────┘
```

1. **Check fields** you want to include
2. **Drag to reorder** columns (left column = leftmost in report)
3. **Remove unwanted** fields
4. **Set column width** (auto, percentage, pixels)
5. **Set column alignment** (left, center, right)

### Step 3: Configure Column Properties

For each column, customize:

#### Header
- **Header Text**: Display name (e.g., "First Name" for first_name field)
- **Header Background**: Color
- **Header Font**: Bold, size, color
- **Alignment**: Left, center, right

#### Data Cells
- **Format**: How to display values
  - Text: as-is
  - Currency: $1,234.56
  - Percentage: 42%
  - Date: 2026-04-13
  - Number: With thousands separator
- **Alignment**: Left, center, right
- **Font Style**: Regular, bold, italic
- **Conditional Formatting**: Color based on value

Example conditional formatting:
```
Status field:
  if value == "active" → green background
  if value == "inactive" → gray background
  if value == "pending" → yellow background
```

### Step 4: Add Grouping (Grouped Reports)

For grouped reports, define how to organize data:

1. **Select grouping field** (e.g., Department)
2. **Set sort order** (ascending, descending)
3. **Configure group header** (what to show)
4. **Define group footer** (subtotals, counts)

Example grouping:

```
Group By: department
├─ Department Header: "Department: {department}"
├─ Detail rows for each employee
└─ Department Footer: "Count: {COUNT()}, Total Salary: {SUM(salary)}"
```

### Step 5: Add Charts and Visualizations

Enhance reports with charts:

1. **Select chart type**:
   - Bar chart (horizontal or vertical)
   - Line chart (trends over time)
   - Pie chart (proportions)
   - Area chart (stacked values)
   - Scatter plot (correlation)
   - Gauge (single metric)

2. **Configure chart**:
   - **Data Series**: Which field to visualize (e.g., sales amount)
   - **Categories**: How to group (e.g., by product)
   - **Title**: Chart heading
   - **Colors**: Custom color scheme
   - **Legend**: Show/hide legend
   - **Labels**: Show values on chart

<div class="screenshot-placeholder">Screenshot: Report with embedded bar chart showing sales by product — <code>report-with-chart.png</code></div>

### Step 6: Add Summary Sections

Add calculated summaries to your report:

#### Total Row
```
Subtotal: $1,234.56
Total Items: 42
Average: $29.40
```

#### Key Metrics
```
Highest Sale: $456.78
Lowest Sale: $12.34
Count: 87
```

Configure with:
- **Function**: SUM, COUNT, AVERAGE, MIN, MAX
- **Field**: Which field to calculate on
- **Label**: Display text
- **Format**: Currency, number, percentage
- **Placement**: Bottom, separate section, header

## Report Filtering and Parameters

Make reports interactive with user parameters:

### Adding Filters

1. **Click "Add Filter"**
2. **Select filter field** (e.g., Status, Date Range)
3. **Configure filter type**:
   - **Equals**: Status = "Active"
   - **Contains**: Name contains "Smith"
   - **Range**: Created between dates
   - **List**: Status in ("Active", "Pending")
   - **Custom**: Custom expression

### Example Filters

```
Report: Sales by Region
Filters:
├─ Region (dropdown: All, North, South, East, West)
├─ Date Range (from date, to date)
└─ Minimum Sale Amount (number input)
```

When users run the report:
1. **See filter controls** at the top
2. **Set filter values**
3. **Click "Run Report"**
4. **See filtered results**

## Styling and Formatting

Control the appearance of your reports:

### Report-Level Styling
- **Title**: Size, color, alignment
- **Subtitle**: Optional subtitle text
- **Paper size**: Letter, A4, Legal
- **Orientation**: Portrait, landscape
- **Margins**: Top, bottom, left, right
- **Background**: Color or image
- **Font**: Default font family and size

### Conditional Formatting

Apply styles based on data values:

```
Sales Amount column:
  if value > 10000 → bold green
  if value < 1000 → italic red
  else → normal black

Status column:
  if value == "completed" → ✓ green checkmark
  if value == "pending" → ⏳ yellow clock
  if value == "failed" → ✗ red X
```

### Page Breaks

Control where reports break into new pages:

```
Group By: Department
├─ Department 1 (Engineering)
│  ├─ Employee records
│  └─ [PAGE BREAK]
├─ Department 2 (Sales)
│  ├─ Employee records
│  └─ [PAGE BREAK]
└─ Department 3 (Finance)
   └─ Employee records
```

## Preview and Testing

Before finalizing your report:

1. **Click "Preview"** to see sample data
2. **Verify layout** - columns aligned, visible text
3. **Test filters** - try different filter combinations
4. **Check pagination** - test with large datasets
5. **Validate totals** - ensure calculations are correct

## Exporting Reports

Once designed, export in multiple formats:

- **PDF**: Print-ready document
- **Excel**: Data in spreadsheet with formatting
- **CSV**: Plain text for import elsewhere
- **HTML**: Web-viewable report
- **JSON**: For APIs and data interchange

Configure export options:
- **Include headers**: Yes/No
- **Include footer**: Report parameters, date generated, page numbers
- **Color**: Full color, grayscale, black & white
- **Page size**: Letter, A4, etc.

## Report Scheduling

Generate reports automatically on a schedule:

1. **Click "Schedule Report"**
2. **Set frequency**: Daily, weekly, monthly
3. **Set time**: When to generate
4. **Set recipients**: Email addresses
5. **Configure delivery**: PDF attachment, link, web page

Example:
```
Generate: Monthly Sales Report
Frequency: First Monday of each month
Time: 9:00 AM
Email to: management@company.com
Format: PDF
```

## Code Generation

Generate report-display code:

1. **Click "Generate Code"**
2. **Select template**: HTML table, React component, Vue, Angular
3. **Configure options**:
   - Include filtering UI
   - Include export buttons
   - Include printing
   - Include pagination
4. **Review generated** code
5. **Copy or export**

Generated code includes:
- HTML/JSX markup
- CSS styling
- Sorting functionality
- Pagination logic
- Export functionality
- Responsive design

## Tips and Best Practices

:::tip
**Keep it simple**: Don't overload reports with too many columns. Focus on key information.
:::

:::tip
**Use meaningful headers**: Column headers should be clear to non-technical users.
:::

:::tip
**Add context**: Include dates, filters applied, and total row counts.
:::

:::tip
**Test with real data**: Preview with actual database records to catch formatting issues.
:::

:::tip
**Consider mobile**: If reports will be viewed on phones, simplify layout for narrow screens.
:::

:::tip
**Include instructions**: For complex reports, add a brief description of what the report shows.
:::

## What's Next?

- Learn about [Kanban Board](./kanban-board.md) for task management views
- Explore [Deployment](./deployment.md) to publish reports
- Set up [Templates](../templates/getting-started.md) for advanced code generation
