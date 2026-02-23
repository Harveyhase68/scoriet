# i18n Inline Preview

See your translations inline while coding. No more guessing what `t.filemodal334` or `__('authcontrollerphp199')` means.

![Demo](https://raw.githubusercontent.com/scoriet/i18n-inline-preview/main/demo.png)

## Features

- **Inline previews** - translated text appears next to every translation key
- **Language cycling** - press `Ctrl+Shift+L` to cycle through your languages, then OFF
- **Hover card** - hover over any key to see all translations at once
- **Status bar** - shows current language, click to cycle
- **Auto-reload** - detects changes to locale files and refreshes instantly
- **Fully configurable** - works with any i18n setup: custom paths, languages, patterns

## How It Works

```
// Your code shows:
const label = t.filemodal334              -> Cancel
const msg = __('authcontrollerphp199')    -> Validation error

// Press Ctrl+Shift+L to cycle:
const label = t.filemodal334              -> Abbrechen        (DE)
const label = t.filemodal334              -> Annuler           (FR)
const label = t.filemodal334              -> Cancelar          (ES)
const label = t.filemodal334              -> Annulla            (IT)
const label = t.filemodal334              (OFF - no preview)
const label = t.filemodal334              -> Cancel             (EN - back to start)
```

## Supported Patterns

| Pattern | Example | Common In |
|---------|---------|-----------|
| `t.key` | `t.loginButton` | Custom TS/React setups |
| `data.t.key` | `data.t.topbar71` | React custom nodes |
| `__('key')` | `__('auth.login')` | Laravel / PHP |
| `$t('key')` | `$t('welcome')` | Vue.js |

All patterns are configurable. Add your own via settings.

## Installation

### From .vsix file

1. Download the `.vsix` file
2. In VS Code: `Ctrl+Shift+P` -> "Extensions: Install from VSIX..."
3. Select the file and restart VS Code

### Manual (development)

```bash
# Copy to VS Code extensions folder
# Windows:
xcopy /s /y . "%USERPROFILE%\.vscode\extensions\i18n-inline-preview\"

# macOS/Linux:
cp -r . ~/.vscode/extensions/i18n-inline-preview/
```

## Configuration

### Quick Start

The extension auto-detects locale files in common locations. If your files are elsewhere, configure in VS Code settings:

```jsonc
// .vscode/settings.json
{
  "i18nInlinePreview.localeFiles": [
    { "pattern": "src/locales/{lang}.json", "format": "json" },
    { "pattern": "lang/{lang}.json", "format": "json" }
  ]
}
```

### All Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `i18nInlinePreview.enabled` | `true` | Enable inline translation previews |
| `i18nInlinePreview.defaultLanguage` | `"en"` | Starting language for previews |
| `i18nInlinePreview.maxPreviewLength` | `60` | Max characters in inline preview (0 = unlimited) |
| `i18nInlinePreview.languages` | EN, DE, FR, ES, IT | Languages to cycle through |
| `i18nInlinePreview.localeFiles` | *(see below)* | Where to find translation files |
| `i18nInlinePreview.dotPatterns` | `["t"]` | Property access patterns (e.g. `t.key`) |
| `i18nInlinePreview.functionPatterns` | `["__", "$t"]` | Function call patterns (e.g. `__('key')`) |

### Locale File Paths

Use `{lang}` as placeholder for the language code. Non-existent paths are silently skipped.

```jsonc
"i18nInlinePreview.localeFiles": [
  // JSON files (flat or nested - nested keys are auto-flattened with dots)
  { "pattern": "src/locales/{lang}.json", "format": "json" },
  { "pattern": "lang/{lang}.json", "format": "json" },

  // TypeScript/JavaScript files (key: 'value' format)
  { "pattern": "src/i18n/locales/{lang}.ts", "format": "ts" },
  { "pattern": "locales/{lang}.js", "format": "js" }
]
```

### Custom Languages

```jsonc
"i18nInlinePreview.languages": [
  { "code": "en", "label": "EN" },
  { "code": "ja", "label": "JA" },
  { "code": "zh", "label": "ZH" },
  { "code": "ko", "label": "KO" }
]
```

### Custom Patterns

```jsonc
// Match i18n.key pattern
"i18nInlinePreview.dotPatterns": ["t", "i18n"]

// Match custom function calls
"i18nInlinePreview.functionPatterns": ["__", "$t", "i18next.t"]
```

## Commands

| Command | Keybinding | Description |
|---------|------------|-------------|
| i18n Inline Preview: Cycle Language | `Ctrl+Shift+L` | Cycle through languages, then OFF |
| i18n Inline Preview: Toggle On/Off | — | Toggle previews via command palette |

## Supported File Formats

### JSON (flat)
```json
{ "loginButton": "Log In", "logoutButton": "Log Out" }
```

### JSON (nested - auto-flattened)
```json
{ "auth": { "login": "Log In", "logout": "Log Out" } }
```
Keys become `auth.login`, `auth.logout`.

### TypeScript / JavaScript
```typescript
export default {
  loginButton: 'Log In',
  logoutButton: 'Log Out',
};
```

## Notes

- Locale definition files are automatically excluded from decoration
- Decorations update with a 300ms debounce for smooth typing
- The hover card marks the current preview language with an arrow
- Zero dependencies - uses only VS Code API and Node.js built-ins

## License

MIT
