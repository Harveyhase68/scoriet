---
sidebar_position: 2
---

# Report Designer

## Overview

The Report Designer enables creation of professional, data-driven reports with precise layout control. It features pattern-based design, paper configuration, and supports multiple report types for single-record and list-based reporting.

![Report Designer](/img/screenshots/report_designer.png)
*Report Designer with pattern-based layout, section editing, and paper configuration*

## Key Features

- **Pattern-Based Design** - Reusable report templates
- **Paper Configuration** - Size, orientation, margins control
- **Multiple Report Types** - Single-record and list reports
- **Section Layout** - Header, detail, footer sections
- **Layout Elements** - Fields, text, images, lines, boxes, page numbers
- **Font Styling** - Complete typography control
- **Multi-Language Labels** - Translatable field labels
- **Unit Selection** - Millimeters, inches, or points
- **Visual Designer** - ReactFlow-based visual layout

## Report Types

### report_single
Single-record report for detailed information (invoices, certificates, details).

### report_list
Multi-record report with repeating row data (lists, transactions, directories).

## Core Interfaces

```typescript
interface ReportPattern {
  id: number;
  name: string;
  description?: string;
  visibility: string;
  forms?: ReportPatternForm[];
}

interface ReportPatternForm {
  form_type: 'report_single' | 'report_list';
  paper_size: string;
  paper_orientation: string;
  paper_unit: string;
  margin_top: number;
  margin_right: number;
  margin_bottom: number;
  margin_left: number;
  elements?: ReportPatternElement[];
}
```

## Element Types

- **report_field** - Link to database field
- **report_text** - Static text label
- **report_heading** - Section heading
- **report_line** - Horizontal/vertical separator
- **report_box** - Rectangle container
- **report_image** - Embedded image/logo
- **report_page_number** - Dynamic page number
- **report_container** - Grouped elements

## Supported Paper Sizes

A0, A1, A2, A3, A4 (most common), A5, A6, letter, legal, tabloid

## Typography Control

Font configuration includes font_family, font_size, font_weight, font_style, text_decoration, text_align, and text_color.

## Multi-Language Support

Each field can have translated labels in multiple languages via content_labels property.

## Design Workflow

1. Create Report Pattern
2. Configure Paper settings
3. Create Report Form
4. Design Layout
5. Configure Fields
6. Preview and Adjust
7. Activate

## Best Practices

1. Use standard paper sizes
2. Leave adequate margins
3. Test with real data
4. Group related elements
5. Limit font families
6. Ensure color contrast
7. Plan for translations
8. Test orientations

## Common Templates

- **Invoice** - Header, items detail, footer with total
- **Certificate** - Centered design with name and date
- **Mailing Label** - Compact A6 layout

## API Endpoints

Standard REST endpoints for patterns, forms, elements, and images.

## Code Generation Integration

Reports integrate with code generator for PDF export and rendering.

## Next Steps

- [Form Designer](form-designer.md) - Design input forms
- [Deployment](deployment.md) - Deploy reports
- [Translations](translations.md) - Multi-language support
