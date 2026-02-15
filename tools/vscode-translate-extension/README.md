# Scoriet Translate Extension

VS Code Extension for sending selected text to the WinDev Translation Tool.

## Features

- Press **CTRL+M** when text is selected
- Automatically sends to WinDev REST API:
  - `selectedText` - The selected text
  - `filePath` - Full file path
  - `fileName` - File name
  - `lineNumber` - Line number
  - `columnNumber` - Column number
  - `language` - Detected language (de, en, etc.)

## Installation

### Option 1: Copy directly (easiest method)

1. Copy the entire `vscode-translate-extension` folder to:
   ```
   %USERPROFILE%\.vscode\extensions\scoriet-translate
   ```

   For example: `C:\Users\messe\.vscode\extensions\scoriet-translate`

2. Restart VS Code

### Option 2: Package as VSIX

1. Install vsce: `npm install -g @vscode/vsce`
2. In the extension folder: `vsce package`
3. In VS Code: Extensions → "..." → "Install from VSIX..."

## Configuration

In VS Code Settings (`Ctrl+,`):

```json
{
  "scorietTranslate.apiUrl": "http://localhost:8080/translate"
}
```

## WinDev REST API

Your WinDev application should accept POST requests on `/translate`:

```json
{
  "selectedText": "The selected text",
  "filePath": "C:\\wamp\\www\\scoriet\\resources\\js\\i18n\\locales\\de.ts",
  "fileName": "de.ts",
  "lineNumber": 42,
  "columnNumber": 5,
  "language": "de"
}
```

## Usage

1. Select text in VS Code
2. Press **CTRL+M**
3. WinDev receives the data and opens the translator
