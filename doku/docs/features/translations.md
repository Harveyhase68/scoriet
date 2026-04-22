---
sidebar_position: 6
title: Multi-Language Support
---

# Multi-Language Support

Scoriet's translation system enables you to create applications that support multiple languages. Whether you're building for global markets, diverse user bases, or simply want to provide accessibility in multiple languages, Scoriet's translation features make it straightforward to manage and deploy multilingual applications.

## Understanding Translation in Scoriet

Translation in Scoriet works at multiple levels:

1. **Interface Strings**: Form labels, button text, validation messages
2. **Database Schema**: Table and field captions (multi-language)
3. **Content**: User-facing text that varies by language
4. **Localization**: Formatting dates, numbers, currencies by region

All of these can be managed and generated as part of your code.

## Opening the Translation Manager

To manage translations:

1. **Click Translation icon** in the dock
2. **Or go to Tools > Translations**
3. **Translation Manager opens**
4. **See all configurable text** ready for translation

<div class="screenshot-placeholder">Screenshot: Translation Manager showing languages, strings, and translation editor — <code>translation-manager-main.png</code></div>

## Setting Up Languages

### Adding Languages

1. **Click "Add Language"**
2. **Select language** from dropdown:
   ```
   English (en)
   Spanish (es)
   French (fr)
   German (de)
   Chinese Simplified (zh-CN)
   Japanese (ja)
   ...and 100+ more
   ```
3. **Language added** to your project
4. **Appears as column** in translation table

### Language Configuration

For each language, configure:

- **Language code**: en, es, fr, de (used in code)
- **Display name**: "English", "Español", "Français"
- **Direction**: Left-to-right (LTR) or right-to-left (RTL)
- **Default locale**: For formatting (en-US, en-GB, es-ES, etc.)
- **Currency**: What currency to use (USD, EUR, GBP, etc.)
- **Date format**: How dates display (MM/DD/YYYY vs DD/MM/YYYY)
- **Time format**: 12-hour (am/pm) vs 24-hour

### Example Setup

```
Project Languages:
├─ English (en-US)
│  ├─ Display: English
│  ├─ Currency: USD
│  └─ Date: MM/DD/YYYY
├─ Spanish (es-ES)
│  ├─ Display: Español
│  ├─ Currency: EUR
│  └─ Date: DD/MM/YYYY
├─ French (fr-FR)
│  ├─ Display: Français
│  ├─ Currency: EUR
│  └─ Date: DD/MM/YYYY
└─ German (de-DE)
   ├─ Display: Deutsch
   ├─ Currency: EUR
   └─ Date: DD/MM/YYYY
```

## Managing Translation Strings

### Translation Table

The main interface shows all translatable strings:

```
┌─────────────────┬──────────────┬──────────────┬──────────────┐
│ String Key      │ English      │ Spanish      │ French       │
├─────────────────┼──────────────┼──────────────┼──────────────┤
│ button.submit   │ Submit       │ Enviar       │ Soumettre    │
│ button.cancel   │ Cancel       │ Cancelar     │ Annuler      │
│ label.email     │ Email        │ Correo       │ Courriel     │
│ label.password  │ Password     │ Contraseña   │ Mot de passe │
│ error.required  │ Required     │ Requerido    │ Requis       │
└─────────────────┴──────────────┴──────────────┴──────────────┘
```

### Adding Translation Strings

1. **Click "New String"**
2. **Enter key** (button.submit, label.email, etc.)
3. **Enter English** translation (default language)
4. **Click "Add"**
5. **String appears** in table

:::tip
Use dot notation for string keys to organize them: button.*, label.*, error.*, message.*, etc.
:::

### Automatic String Collection

Scoriet auto-detects strings needing translation:

1. **When you create forms**, field labels become strings
2. **Button labels** become strings
3. **Validation messages** become strings
4. **Custom text** you add becomes strings

Check "Untranslated" filter to see strings needing translation.

## Translating Strings

### Direct Translation

Edit translations in the table:

1. **Click a cell** in language column
2. **Type translation**
3. **Press Tab** to move to next
4. **Auto-saves** as you type

### Translation Editor

For longer text, use the dedicated editor:

1. **Click string key** or "..." menu
2. **Select "Edit"**
3. **Detailed editor opens**

```
String Key: error.invalid_email
English: Please enter a valid email address
├─ Spanish: Por favor, ingrese una dirección de correo válida
├─ French: Veuillez entrer une adresse e-mail valide
├─ German: Bitte geben Sie eine gültige E-Mail-Adresse ein
└─ Japanese: 有効なメールアドレスを入力してください
```

Each translation shown separately for clarity.

### Bulk Import/Export

Import translations from CSV or JSON files:

1. **Click "Import"**
2. **Choose file** (CSV or JSON)
3. **Map columns** to languages
4. **Preview** before importing
5. **Import** translations

Export for external translation:

1. **Click "Export"**
2. **Choose format** (CSV, JSON, XLIFF)
3. **Select languages** to include
4. **Save file**
5. **Send to translator**

CSV Example:
```csv
key,en,es,fr,de
button.submit,Submit,Enviar,Soumettre,Einreichen
button.cancel,Cancel,Cancelar,Annuler,Abbrechen
label.email,Email,Correo,Courriel,E-Mail
```

## Schema Translations

### Translating Database Schema

Your database fields also have captions that can be translated:

1. **Open Schema Explorer**
2. **Click field**
3. **Look for "Translations"** section
4. **Enter caption in each language**

```
Field: first_name
├─ English: First Name
├─ Spanish: Nombre
├─ French: Prénom
└─ German: Vorname
```

### How Schema Translations Are Used

When you generate forms:

- Labels automatically use translated field captions
- Validation messages use translated strings
- Help text uses translations
- Placeholders use translations

This means your generated forms automatically adapt to user language.

## Plural Forms and Context

### Handling Plurals

Some languages have complex plural rules:

```
English: "You have {count} messages"
  1 message
  2 messages
  5 messages

Spanish: "Tienes {count} mensajes"
  1 mensaje
  2 mensajes
  5 mensajes

Polish: "Masz {count} wiadomości"
  1 wiadomość
  2 wiadomości
  5 wiadomości (complex rules)

Irish: Has da chúirt agat chun..."
  1 message
  2 messages
  3-6 messages
  7-10 messages
  11+ messages
```

Scoriet's translation system handles these automatically:

1. **Define plural** rule for string
2. **Provide translations** for each form
3. **At runtime**, correct form selected based on number

### Context-Based Translations

Same word, different translations depending on context:

```
"Bank" as financial institution: "Banco" (Spanish)
"Bank" as river bank: "Orilla" (Spanish)

"Record" as noun (database record): "Registro"
"Record" as verb (to record): "Grabar"
```

Use context keys:

```
string.key: generic.bank
string.key: financial.bank (financial context)
string.key: geography.bank (geography context)
```

## Translation Management Workflow

### Typical Workflow

```
1. Developer creates new feature
   ↓
2. New strings added to Translation Manager
   ↓
3. Strings marked as "Untranslated"
   ↓
4. Export strings for translator
   ↓
5. Translator returns translations
   ↓
6. Import translations back
   ↓
7. QA tests in each language
   ↓
8. Deploy multilingual app
```

### Assigning Translators

1. **Click language** header
2. **Select "Assign Translator"**
3. **Add team member** email
4. **Translator gets link** to translation interface
5. **They translate** their assigned language
6. **Changes sync** to main project

### Translation Status

Monitor translation progress:

```
English (en):      100% Complete ✓
Spanish (es):      94% Complete (2 strings pending)
French (fr):       87% Complete (5 strings pending)
German (de):       100% Complete ✓
Japanese (ja):     45% Complete (11 strings pending)
```

Use filters to show only untranslated or incomplete translations.

## Using Translations in Code

### In Your Templates

Reference translations using translation keys:

```
{:text translate="button.submit":}
{:text translate="error.required":}
{:field.caption:} (auto-translated from schema)
```

Generated code includes translation function calls.

### In Generated Code

Scoriet generates code with translation support:

```javascript
// React example
import { useTranslation } from 'react-i18next';

export function LoginForm() {
  const { t } = useTranslation();
  
  return (
    <form>
      <label>{t('label.email')}</label>
      <input type="email" />
      
      <button type="submit">{t('button.submit')}</button>
      <button type="cancel">{t('button.cancel')}</button>
    </form>
  );
}
```

### Language Switcher

Generated apps include language switcher:

```
┌──────────────────────────┐
│ EN ▼ | ES | FR | DE      │
└──────────────────────────┘

English (selected)
Español
Français
Deutsch
```

Click any language to change entire app language instantly.

## Localization Features

Beyond translation, localize formats:

### Date Formatting

```
Date: 2026-04-13

English (US):    April 13, 2026
Spanish (Spain): 13 de abril de 2026
French (France): 13 avril 2026
German (Germany): 13. April 2026
```

### Number Formatting

```
Number: 1234567.89

English (US):    1,234,567.89
Spanish (Spain): 1.234.567,89
German (Germany): 1.234.567,89
French (France): 1 234 567,89
```

### Currency Formatting

```
Amount: 99.99
USD (United States):     $99.99
EUR (European Union):    99,99 €
GBP (United Kingdom):    £99.99
JPY (Japan):             ¥9,999
```

Configure automatically based on language/locale setting.

## Quality Assurance

### Translation Testing

1. **Change app language** to each supported language
2. **Test all forms** and pages
3. **Check for**:
   - Missing translations
   - Text overflow in narrow spaces
   - RTL layout if applicable
   - Special characters rendering
   - Currency/date/number formatting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Missing text | String not translated | Add translation |
| Text overflow | Long translation for narrow field | Shorten translation or resize field |
| Wrong encoding | Character set issue | Ensure UTF-8 encoding |
| Missing punctuation | Different punctuation in language | Check and add punctuation |
| Wrong context | Same word, different meaning | Use context-specific keys |

### Translation Validation

Scoriet can check for common issues:

1. **Click "Validate"**
2. **Checks for**:
   - Missing translations
   - Untranslated placeholders
   - Encoding issues
   - Length warnings
3. **Shows results**
4. **Fix issues** before deployment

## Tips and Best Practices

:::tip
**Keep strings atomic**: Don't combine strings. "First Name" and "Last Name" should be separate from "Full Name".
:::

:::tip
**Use context**: Include context information for translators so they translate accurately.
:::

:::tip
**Test thoroughly**: Always test each language with real data to catch issues early.
:::

:::tip
**Get professional help**: For important projects, hire professional translators, not just auto-translation.
:::

:::tip
**Plan for growth**: Design schema captions and strings that can be easily translated from the start.
:::

:::tip
**Keep translations updated**: When strings change, update all language versions, not just English.
:::

## What's Next?

- Learn about [Deployment](./deployment.md) to publish multilingual apps
- Explore the [Template Store](./template-store.md) for translation templates
- Review schema setup in [Database Overview](../database/overview.md)
