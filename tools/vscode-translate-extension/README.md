# Scoriet Translate Extension

VS Code Extension zum Senden von markiertem Text an das WinDev Translation Tool.

## Features

- **CTRL+M** drücken wenn Text markiert ist
- Sendet automatisch an WinDev REST API:
  - `selectedText` - Der markierte Text
  - `filePath` - Vollständiger Dateipfad
  - `fileName` - Dateiname
  - `lineNumber` - Zeilennummer
  - `columnNumber` - Spaltennummer
  - `language` - Erkannte Sprache (de, en, etc.)

## Installation

### Option 1: Direkt kopieren (einfachste Methode)

1. Kopiere den gesamten `vscode-translate-extension` Ordner nach:
   ```
   %USERPROFILE%\.vscode\extensions\scoriet-translate
   ```

   Also z.B.: `C:\Users\messe\.vscode\extensions\scoriet-translate`

2. VS Code neu starten

### Option 2: Als VSIX packen

1. Installiere vsce: `npm install -g @vscode/vsce`
2. Im Extension-Ordner: `vsce package`
3. In VS Code: Extensions → "..." → "Install from VSIX..."

## Konfiguration

In VS Code Settings (`Ctrl+,`):

```json
{
  "scorietTranslate.apiUrl": "http://localhost:8080/translate"
}
```

## WinDev REST API

Dein WinDev Programm sollte POST requests auf `/translate` akzeptieren:

```json
{
  "selectedText": "Der markierte Text",
  "filePath": "C:\\wamp\\www\\scoriet\\resources\\js\\i18n\\locales\\de.ts",
  "fileName": "de.ts",
  "lineNumber": 42,
  "columnNumber": 5,
  "language": "de"
}
```

## Benutzung

1. Text in VS Code markieren
2. **CTRL+M** drücken
3. WinDev empfängt die Daten und öffnet den Übersetzer
