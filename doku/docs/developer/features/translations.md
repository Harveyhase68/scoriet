---
sidebar_position: 7
---

# Multi-Language Support & Translations

## Overview

Scoriet supports multi-language applications with comprehensive translation management. Projects can have default and target languages, schema field translations, form labels, report field names, and dynamic language switching via the UI.

## Key Features

- **Project Language Configuration** - Set default and target languages
- **Schema Translations** - Translate table and field names
- **Form & Report Labels** - Multi-language form/report element names
- **Language Management** - Add/enable/disable languages globally
- **Auto-Translation** - Google Translate API integration
- **Translation Export** - Export all strings for external translation
- **Language Switching** - Users can change UI language
- **Internationalization (i18n)** - Full app UI translation support

## Language Management

### Supported Languages

Add languages to the system via LanguageManagementPanel:

```typescript
interface Language {
  id: number;
  code: string;              // 'en', 'de', 'fr', 'es', 'it'
  name: string;              // English name
  native_name: string;       // Native name: 'Deutsch', 'Français'
  flag?: string;             // Flag emoji or code
  is_active: boolean;        // Is available for selection
  is_default: boolean;       // Default for new projects
  sort_order: number;        // Display order
  description?: string;
  created_by?: number;
}

// Create language
const createLanguage = async (language: Language) => {
  const response = await fetch('/api/languages', {
    method: 'POST',
    body: JSON.stringify(language),
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
};
```

### Project Language Settings

```typescript
interface Project {
  default_language: string;      // 'en'
  target_language: string;       // 'de' (for translations)
  enabled_languages: string[];   // ['en', 'de', 'fr']
}

// Update project languages
const updateProjectLanguages = async (projectId: number, languages: {
  default_language: string;
  target_language: string;
  enabled_languages: string[];
}) => {
  await fetch(`/api/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify(languages),
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};
```

## Schema Translations

### Translate Database Fields

```typescript
interface SchemaTranslation {
  id: number;
  schema_id: number;
  language_code: string;
  table_name: string;
  translations: {
    [fieldName: string]: string;  // field_name => translated_name
  };
}

// Get translations for schema
const getSchemaTranslations = async (schemaId: number, languageCode: string) => {
  const response = await fetch(
    `/api/schemas/${schemaId}/translations?language=${languageCode}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  
  return await response.json();
};

// Save schema translations
const saveSchemaTranslations = async (schemaId: number, translations: SchemaTranslation) => {
  await fetch(`/api/schemas/${schemaId}/translations`, {
    method: 'POST',
    body: JSON.stringify(translations),
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};

// Example translation
{
  users: {
    user_email: 'E-Mail-Adresse',      // English => German
    user_name: 'Benutzername',
    created_at: 'Erstellt am'
  }
}
```

### Translation Workflow

1. **Identify Translatable Fields** - FieldAssignmentPanel
2. **Configure Translations** - SchemaTranslationPanel
3. **Auto-Translate Option** - Google Translate API (optional)
4. **Review & Edit** - Manual review by translator
5. **Export** - Download all translations
6. **Deploy** - Include in generated code

## Form & Report Translations

### Form Element Labels

```typescript
interface FormElement {
  label?: string;
  content_labels?: Record<string, string>;
  
  // Example:
  content_labels: {
    'en': 'Customer Name',
    'de': 'Kundenname',
    'fr': 'Nom du client'
  }
}

// Set translations when designing form
const updateElementLabel = async (elementId: number, labels: Record<string, string>) => {
  await fetch(`/api/form-elements/${elementId}`, {
    method: 'PUT',
    body: JSON.stringify({ content_labels: labels }),
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
};
```

### Report Element Labels

```typescript
interface ReportElement {
  content?: string;
  content_labels?: Record<string, string>;
  
  // Example for field display
  content_labels: {
    'en': 'Invoice Number',
    'de': 'Rechnungsnummer',
    'fr': 'Numéro de facture'
  }
}
```

## UI Translation (i18n)

### Application UI Language

Managed via i18n configuration:

```typescript
import { useTranslation, getStoredLanguage } from '@/i18n';

export function MyComponent() {
  const [currentLanguage] = React.useState(getStoredLanguage());
  const { t } = useTranslation(currentLanguage);
  
  return <button>{t.common_save}</button>;  // Translated button
}
```

### Available Translations

Translation keys organized by component:

```typescript
// resources/js/i18n/translations
{
  common_save: 'Save',
  common_cancel: 'Cancel',
  common_delete: 'Delete',
  common_edit: 'Edit',
  
  formdesigner_title: 'Form Designer',
  formdesigner_new_window: 'New Window',
  
  kanban_column: 'Column',
  kanban_wip_limit: 'WIP Limit',
  
  // ... more keys
}
```

### Language Switching

```typescript
// In LanguageSelector component
const handleLanguageChange = (language: SupportedLanguage) => {
  localStorage.setItem('user_language', language);
  // Refresh app to apply language
  window.location.reload();
};
```

## Auto-Translation

Integration with Google Translate API:

```typescript
interface AutoTranslateRequest {
  source_language: string;
  target_language: string;
  texts: string[];
}

// Auto-translate schema fields
const autoTranslateFields = async (schemaId: number, sourceLanguage: string, targetLanguage: string) => {
  const response = await fetch(`/api/schemas/${schemaId}/auto-translate`, {
    method: 'POST',
    body: JSON.stringify({
      source_language: sourceLanguage,
      target_language: targetLanguage
    }),
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
};

// Result: Automatically translated field names
// Note: May require review for accuracy
```

## Translation Export

### Export All Translations

```typescript
const exportTranslations = async (projectId: number, format: 'json' | 'csv' | 'excel') => {
  const response = await fetch(
    `/api/projects/${projectId}/translations/export?format=${format}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `translations.${format === 'excel' ? 'xlsx' : format}`;
  a.click();
};
```

### Export Format (JSON)

```json
{
  "en": {
    "users": {
      "user_email": "Email",
      "user_name": "Username"
    },
    "forms": {
      "loginform_title": "Login"
    }
  },
  "de": {
    "users": {
      "user_email": "E-Mail",
      "user_name": "Benutzername"
    }
  }
}
```

## Translation in Code Generation

### Generated Form Rendering

```typescript
// Generated form respects language settings
const getFieldLabel = (field: Field, language: string) => {
  return field.content_labels?.[language] || field.content_labels?.['en'] || field.label;
};

// Render field with correct label
<label>{getFieldLabel(field, userLanguage)}</label>
```

### Generated Report Rendering

```typescript
// Generated report includes multi-language labels
const renderReportHeader = (report: Report, language: string) => {
  const elements = report.elements.map(e => ({
    ...e,
    content: e.content_labels?.[language] || e.content
  }));
  
  return renderElements(elements);
};
```

## API Endpoints

```
# Languages
POST   /api/languages                     # Create language
GET    /api/languages                     # List all languages
PUT    /api/languages/{id}                # Update language
DELETE /api/languages/{id}                # Delete language

# Schema Translations
GET    /api/schemas/{id}/translations     # Get translations
POST   /api/schemas/{id}/translations     # Save translations
POST   /api/schemas/{id}/auto-translate   # Auto-translate
GET    /api/schemas/{id}/translation-status  # Status

# Project Languages
PUT    /api/projects/{id}/languages       # Update project languages
GET    /api/projects/{id}/translation-progress  # Progress

# Translation Export
GET    /api/projects/{id}/translations/export  # Export translations
POST   /api/projects/{id}/translations/import  # Import translations
```

## Best Practices

1. **Translate Early** - Build translation into design phase
2. **Use Translation Keys** - Don't hardcode strings
3. **Provide Context** - Include field descriptions
4. **Review Translations** - Native speakers should verify
5. **Test All Languages** - Check all supported languages work
6. **Plan for RTL** - Consider right-to-left languages
7. **Format Consistency** - Use same terminology
8. **Version Control** - Track translation changes

## Language-Specific Considerations

### English (en)
- Default language
- Full feature support
- Most templates available

### German (de)
- Common in DACH region
- Compound words need care
- Umlaut handling required

### French (fr)
- Common in Europe
- Gendered nouns affect grammar
- Accent marks important

### Spanish (es)
- Growing support
- Multiple regional variants
- Formal/informal distinctions

### Italian (it)
- European support
- Similar challenges to French
- Accent mark handling

## Troubleshooting

### Missing Translations
- Check language is enabled
- Verify translation record exists
- Fall back to English

### Auto-Translate Inaccurate
- Review and edit manually
- Note technical terms need care
- Some context lost in translation

### RTL Layout Issues
- Currently optimized for LTR
- Plan for future RTL support

### Character Encoding
- Ensure UTF-8 handling
- Test special characters
- Verify database collation

## Next Steps

- [Form Designer](form-designer.md) - Design translated forms
- [Report Designer](report-designer.md) - Create translated reports
- [Language Management](../frontend/panels.md#languagemanagementpanel) - Manage languages
