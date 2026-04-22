---
sidebar_position: 6
title: "Language and Translation Data"
---

# Language and Translation Data

Scoriet supports **multi-language projects**. You can configure multiple languages for your project, and Gtree provides complete language metadata and selection information. This enables templates to generate language-aware code, documentation, and configurations.

## Language Support in Gtree

Gtree contains language information at two levels:

### Project-Level Language Data

```javascript
{
  project: {
    lang: [
      { code: "en", name: "English", ... },
      { code: "de", name: "German", ... },
      { code: "fr", name: "French", ... }
    ],
    selectedlanguage: "en",
    selectedlanguageindex: 0
  }
}
```

## Language Properties

### lang Array

**Type**: `array` of language objects  
**Description**: Contains all languages configured for the project.

**Structure**:
```javascript
{
  code: "en",           // Language code
  name: "English",      // Display name
  nativename: "English", // Native language name
  locale: "en_US",      // Locale identifier
  // Additional language properties...
}
```

**Access in JavaScript**:
```javascript
{:code:}
const languages = gtree.project.lang;
for (const lang of languages) {
  console.log(`${lang.name} (${lang.code})`);
}
{:codeend:}
```

**Example Values**:
```javascript
[
  { code: "en", name: "English", nativename: "English" },
  { code: "de", name: "German", nativename: "Deutsch" },
  { code: "fr", name: "French", nativename: "Français" },
  { code: "es", name: "Spanish", nativename: "Español" }
]
```

**Use Cases**:
- Displaying supported languages in documentation
- Generating localization configuration files
- Creating translation setup scripts
- Building language switcher UI

---

### selectedlanguage

**Type**: `string`  
**Description**: The code of the currently selected language for template generation.

**Access in Templates**:
```
Current Language: {:selectedlanguage:}
```

**Access in JavaScript**:
```javascript
{:code:}
const currentLang = gtree.project.selectedlanguage;
if (currentLang === "de") {
  return "Deutsche Ausgabe";
} else if (currentLang === "en") {
  return "English Version";
}
{:codeend:}
```

**Example Values**: `"en"`, `"de"`, `"fr"`, `"es"`, `"it"`

**Use Cases**:
- Generating language-specific documentation
- Creating localized error messages
- Generating code comments in different languages
- Building language-specific help text

---

### selectedlanguageindex

**Type**: `number`  
**Description**: Zero-based index of the selected language in the `lang` array.

**Access in JavaScript**:
```javascript
{:code:}
const langIndex = gtree.project.selectedlanguageindex;
const selectedLang = gtree.project.lang[langIndex];
return `Language: ${selectedLang.name} (${selectedLang.code})`;
{:codeend:}
```

**Example Values**: `0`, `1`, `2`, `3`

**Use Cases**:
- Direct array access without searching
- Building language-specific option lists
- Creating ordered language configurations

---

## Working with Multiple Languages

### Get All Supported Languages

```javascript
{:code:}
const languages = gtree.project.lang;
const languageCodes = languages.map(l => l.code);
const languageNames = languages.map(l => l.name);

return JSON.stringify({
  codes: languageCodes,
  names: languageNames,
  count: languages.length
});
{:codeend:}
```

### Create Language-Specific Output

```javascript
{:code:}
const currentLang = gtree.project.selectedlanguage;

const messages = {
  en: {
    welcome: "Welcome!",
    description: "This is a description"
  },
  de: {
    welcome: "Willkommen!",
    description: "Dies ist eine Beschreibung"
  },
  fr: {
    welcome: "Bienvenue!",
    description: "Ceci est une description"
  }
};

const message = messages[currentLang] || messages.en;
return message;
{:codeend:}
```

### Iterate Over All Languages

```javascript
{:code:}
let output = "# Supported Languages\n\n";

for (const lang of gtree.project.lang) {
  output += `- **${lang.name}** (\`${lang.code}\`)\n`;
}

return output;
{:codeend:}
```

## Practical Examples

### Example 1: Generate Multi-Language README

```javascript
{:code:}
const project = gtree.project;
const currentLang = project.selectedlanguage;

const titles = {
  en: "Project README",
  de: "Projekt-Dokumentation",
  fr: "Documentation du Projet"
};

const descriptions = {
  en: "This project provides a comprehensive solution...",
  de: "Dieses Projekt bietet eine umfassende Lösung...",
  fr: "Ce projet fournit une solution complète..."
};

const installations = {
  en: "To install: npm install && composer install",
  de: "Zur Installation: npm install && composer install",
  fr: "Pour installer: npm install && composer install"
};

const readme = `# ${titles[currentLang]}

${descriptions[currentLang]}

## Installation

${installations[currentLang]}

## Supported Languages

${project.lang.map(l => `- ${l.name} (\`${l.code}\`)`).join('\n')}
`;

return readme;
{:codeend:}
```

### Example 2: Generate i18n Configuration

```javascript
{:code:}
const languages = gtree.project.lang;
const config = {};

for (const lang of languages) {
  config[lang.code] = {
    name: lang.name,
    nativeName: lang.nativename,
    locale: lang.locale || lang.code,
    direction: "ltr" // Add RTL for Arabic, Hebrew, etc.
  };
}

return `export const i18nConfig = ${JSON.stringify(config, null, 2)};`;
{:codeend:}
```

### Example 3: Generate Translation Keys File

```javascript
{:code:}
const currentLang = gtree.project.selectedlanguage;

const translations = {
  en: {
    "app.title": "My Application",
    "app.description": "Application Description",
    "menu.home": "Home",
    "menu.about": "About",
    "menu.contact": "Contact",
    "errors.required": "This field is required",
    "errors.email": "Please enter a valid email"
  },
  de: {
    "app.title": "Meine Anwendung",
    "app.description": "Anwendungsbeschreibung",
    "menu.home": "Startseite",
    "menu.about": "Über uns",
    "menu.contact": "Kontakt",
    "errors.required": "Dieses Feld ist erforderlich",
    "errors.email": "Bitte geben Sie eine gültige E-Mail ein"
  },
  fr: {
    "app.title": "Mon Application",
    "app.description": "Description de l'Application",
    "menu.home": "Accueil",
    "menu.about": "À Propos",
    "menu.contact": "Contact",
    "errors.required": "Ce champ est requis",
    "errors.email": "Veuillez entrer un email valide"
  }
};

const langTranslations = translations[currentLang] || translations.en;
return `export const translations = ${JSON.stringify(langTranslations, null, 2)};`;
{:codeend:}
```

### Example 4: Generate Language-Specific Routes

```javascript
{:code:}
const currentLang = gtree.project.selectedlanguage;

const routeLabels = {
  en: {
    users: "Users",
    products: "Products",
    orders: "Orders",
    settings: "Settings"
  },
  de: {
    users: "Benutzer",
    products: "Produkte",
    orders: "Bestellungen",
    settings: "Einstellungen"
  },
  fr: {
    users: "Utilisateurs",
    products: "Produits",
    orders: "Commandes",
    settings: "Paramètres"
  }
};

const labels = routeLabels[currentLang] || routeLabels.en;

let routes = `const routes = {\n`;
for (const [key, label] of Object.entries(labels)) {
  routes += `  ${key}: { path: '/${currentLang}/${key}', label: '${label}' },\n`;
}
routes += `};\n`;

return routes;
{:codeend:}
```

### Example 5: Generate Language Switcher Component

```javascript
{:code:}
const languages = gtree.project.lang;
const currentLang = gtree.project.selectedlanguage;

let component = `import React from 'react';\n\n`;
component += `const LanguageSwitcher = () => {\n`;
component += `  const languages = [\n`;

for (const lang of languages) {
  component += `    { code: '${lang.code}', name: '${lang.name}', native: '${lang.nativename}' },\n`;
}

component += `  ];\n\n`;
component += `  const handleChange = (langCode) => {\n`;
component += `    localStorage.setItem('language', langCode);\n`;
component += `    window.location.reload();\n`;
component += `  };\n\n`;
component += `  return (\n`;
component += `    <select value="${currentLang}" onChange={(e) => handleChange(e.target.value)}>\n`;

for (const lang of languages) {
  component += `      <option value="${lang.code}">${lang.nativename}</option>\n`;
}

component += `    </select>\n`;
component += `  );\n`;
component += `};\n\n`;
component += `export default LanguageSwitcher;\n`;

return component;
{:codeend:}
```

### Example 6: Generate Language-Aware Validation Messages

```javascript
{:code:}
const currentLang = gtree.project.selectedlanguage;

const validationMessages = {
  en: {
    required: "This field is required",
    minLength: "Must be at least {min} characters",
    maxLength: "Must not exceed {max} characters",
    email: "Must be a valid email address",
    number: "Must be a number",
    url: "Must be a valid URL"
  },
  de: {
    required: "Dieses Feld ist erforderlich",
    minLength: "Muss mindestens {min} Zeichen lang sein",
    maxLength: "Darf {max} Zeichen nicht überschreiten",
    email: "Muss eine gültige E-Mail-Adresse sein",
    number: "Muss eine Zahl sein",
    url: "Muss eine gültige URL sein"
  },
  fr: {
    required: "Ce champ est requis",
    minLength: "Doit contenir au moins {min} caractères",
    maxLength: "Ne doit pas dépasser {max} caractères",
    email: "Doit être une adresse e-mail valide",
    number: "Doit être un nombre",
    url: "Doit être une URL valide"
  }
};

const messages = validationMessages[currentLang] || validationMessages.en;
return `export const validationMessages = ${JSON.stringify(messages, null, 2)};`;
{:codeend:}
```

### Example 7: Generate Language-Specific Documentation Index

```javascript
{:code:}
const project = gtree.project;
const allLanguages = project.lang;

let docIndex = `# Documentation Index\n\n`;
docIndex += `This project supports the following languages:\n\n`;

for (const lang of allLanguages) {
  docIndex += `- [${lang.name}](./docs/${lang.code}/README.md)\n`;
}

docIndex += `\n## Available Documentations\n\n`;
docIndex += `${allLanguages.map(lang => `### ${lang.name}\n- [Getting Started](./docs/${lang.code}/getting-started.md)\n- [Installation](./docs/${lang.code}/installation.md)\n- [API Reference](./docs/${lang.code}/api.md)`).join('\n\n')}`;

return docIndex;
{:codeend:}
```

## Language Code Standards

Common ISO 639-1 language codes:

| Code | Language | Native Name |
|------|----------|-------------|
| `en` | English | English |
| `de` | German | Deutsch |
| `fr` | French | Français |
| `es` | Spanish | Español |
| `it` | Italian | Italiano |
| `pt` | Portuguese | Português |
| `nl` | Dutch | Nederlands |
| `ru` | Russian | Русский |
| `ja` | Japanese | 日本語 |
| `zh` | Chinese | 中文 |
| `ar` | Arabic | العربية |
| `ko` | Korean | 한국어 |

## Locale Standards

Locale codes combine language and region:

| Locale | Description |
|--------|-------------|
| `en_US` | English (United States) |
| `en_GB` | English (United Kingdom) |
| `de_DE` | German (Germany) |
| `de_AT` | German (Austria) |
| `fr_FR` | French (France) |
| `es_ES` | Spanish (Spain) |
| `pt_BR` | Portuguese (Brazil) |
| `zh_CN` | Chinese (Simplified) |
| `zh_TW` | Chinese (Traditional) |

## Tips & Best Practices

:::tip Default Language Fallback
Always provide a fallback language (typically English) when accessing language-specific content:

```javascript
const messages = messagesByLanguage[currentLang] || messagesByLanguage.en;
```
:::

:::info Language-Specific Code Comments
Use `selectedlanguage` to generate code comments in the project's primary language:

```javascript
{:code:}
const comments = {
  en: "// This is an automatically generated file",
  de: "// Dies ist eine automatisch generierte Datei",
  fr: "// Ceci est un fichier généré automatiquement"
};
return comments[gtree.project.selectedlanguage] || comments.en;
{:codeend:}
```
:::

:::caution Language Code Consistency
Always use the language codes from Gtree (`gtree.project.lang[].code`) rather than hardcoding them. This ensures consistency with your project configuration.
:::

:::tip i18n Library Integration
When generating translation files, follow the naming conventions of popular i18n libraries:
- **i18next**: `{language}/translation.json`
- **vue-i18n**: `{language}.json`
- **react-intl**: Messages in format `{ "namespace.key": "value" }`
:::

---

## Common Use Cases

### Multi-Language Documentation
Generate README files, API docs, and guides in multiple languages.

### Localized Error Messages
Create validation and error messages in the project's language.

### Language-Aware Comments
Add code comments and docstrings in the appropriate language.

### Translation Configuration
Generate i18n setup and configuration files automatically.

### Locale-Specific Formatting
Generate locale-aware date, time, and number formatting rules.

---

## Next Steps

- **[Practical Examples](./practical-examples.md)** — Full end-to-end generation scenarios
- **[Project-Level Data](./project-level.md)** — Complete project configuration
- **[Field-Level Data](./field-level.md)** — Detailed field properties

