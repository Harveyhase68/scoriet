const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * i18n Inline Preview
 *
 * Shows inline translation previews next to translation keys in the editor.
 * Fully configurable: languages, locale file paths, and match patterns.
 *
 * Ctrl+Shift+L  - Cycle preview language, then OFF, then back to first
 * Command Palette - Toggle preview on/off
 */

// ---- State ----
var translations = {};       // { en: { key: value }, de: { ... }, ... }
var currentLanguage = 'en';
var previewEnabled = true;
var languages = [];
var localeFiles = [];
var dotPatterns = [];
var functionPatterns = [];
var statusBarItem = null;
var decorationType = null;
var debounceTimer = null;
var workspaceRoot = '';

// ---- Activation ----

function activate(context) {
    console.log('i18n Inline Preview is now active');

    var folders = vscode.workspace.workspaceFolders;
    if (folders && folders.length > 0) {
        workspaceRoot = folders[0].uri.fsPath;
    }

    loadConfig();
    loadAllTranslations();

    // Create decoration type
    decorationType = vscode.window.createTextEditorDecorationType({
        after: {
            margin: '0 0 0 1.5em',
            fontStyle: 'italic'
        }
    });

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('i18n-inline-preview.togglePreview', togglePreview),
        vscode.commands.registerCommand('i18n-inline-preview.cycleLanguage', cycleLanguage)
    );

    // Register listeners
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(onDocumentChange),
        vscode.window.onDidChangeActiveTextEditor(onEditorSwitch),
        vscode.workspace.onDidChangeConfiguration(onConfigChange)
    );

    // Status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'i18n-inline-preview.cycleLanguage';
    statusBarItem.tooltip = 'Click to cycle i18n preview language (Ctrl+Shift+L)';
    updateStatusBar();
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // File watchers for auto-reload
    setupFileWatchers(context);

    // Hover provider for all file types
    context.subscriptions.push(
        vscode.languages.registerHoverProvider(
            { scheme: 'file' },
            { provideHover: provideTranslationHover }
        )
    );

    // Initial decoration
    if (vscode.window.activeTextEditor) {
        updateDecorations(vscode.window.activeTextEditor);
    }
}

// ---- Configuration ----

function loadConfig() {
    var config = vscode.workspace.getConfiguration('i18nInlinePreview');
    currentLanguage = config.get('defaultLanguage', 'en');
    previewEnabled = config.get('enabled', true);

    languages = config.get('languages', [
        { code: 'en', label: 'EN' },
        { code: 'de', label: 'DE' },
        { code: 'fr', label: 'FR' },
        { code: 'es', label: 'ES' },
        { code: 'it', label: 'IT' }
    ]);

    localeFiles = config.get('localeFiles', [
        { pattern: 'src/locales/{lang}.json', format: 'json' },
        { pattern: 'src/i18n/{lang}.json', format: 'json' },
        { pattern: 'locales/{lang}.json', format: 'json' },
        { pattern: 'lang/{lang}.json', format: 'json' },
        { pattern: 'resources/js/i18n/locales/{lang}.ts', format: 'ts' },
        { pattern: 'src/i18n/locales/{lang}.ts', format: 'ts' }
    ]);

    dotPatterns = config.get('dotPatterns', ['t']);
    functionPatterns = config.get('functionPatterns', ['__', '$t']);
}

// ---- Translation Loading ----

function loadAllTranslations() {
    if (!workspaceRoot) return;

    translations = {};

    for (var i = 0; i < languages.length; i++) {
        var lang = languages[i].code;
        translations[lang] = {};

        for (var j = 0; j < localeFiles.length; j++) {
            var fileDef = localeFiles[j];
            var relativePath = fileDef.pattern.replace('{lang}', lang);
            var fullPath = path.join(workspaceRoot, relativePath);

            var data = null;
            if (fileDef.format === 'json') {
                data = parseJsonFile(fullPath);
            } else if (fileDef.format === 'ts' || fileDef.format === 'js') {
                data = parseFlatObjectFile(fullPath);
            }

            if (data) {
                var keys = Object.keys(data);
                for (var k = 0; k < keys.length; k++) {
                    translations[lang][keys[k]] = data[keys[k]];
                }
            }
        }
    }

    var firstLang = languages.length > 0 ? languages[0].code : 'en';
    var count = Object.keys(translations[firstLang] || {}).length;
    console.log('i18n Inline Preview: Loaded ' + count + ' translation keys');
}

function parseJsonFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) return null;
        var content = fs.readFileSync(filePath, 'utf8');
        var parsed = JSON.parse(content);
        return flattenObject(parsed, '');
    } catch (e) {
        console.error('i18n Inline Preview: Error parsing ' + filePath + ': ' + e.message);
        return null;
    }
}

function flattenObject(obj, prefix) {
    var result = {};
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var fullKey = prefix ? prefix + '.' + key : key;
        var value = obj[key];
        if (typeof value === 'string') {
            result[fullKey] = value;
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            var nested = flattenObject(value, fullKey);
            var nestedKeys = Object.keys(nested);
            for (var j = 0; j < nestedKeys.length; j++) {
                result[nestedKeys[j]] = nested[nestedKeys[j]];
            }
        }
    }
    return result;
}

function parseFlatObjectFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) return null;

        var content = fs.readFileSync(filePath, 'utf8');
        var lines = content.split('\n');
        var result = {};

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();

            // Skip non-data lines
            if (line.length === 0) continue;
            if (line.indexOf('//') === 0) continue;
            if (line.indexOf('import ') === 0) continue;
            if (line.indexOf('export ') === 0) continue;
            if (line === '};' || line === '}') continue;

            // Find key: value separator
            var colonIndex = line.indexOf(':');
            if (colonIndex === -1) continue;

            var key = line.substring(0, colonIndex).trim();
            if (!isValidKey(key)) continue;

            var valueRaw = line.substring(colonIndex + 1).trim();

            // Remove trailing comma
            if (valueRaw.length > 0 && valueRaw.charAt(valueRaw.length - 1) === ',') {
                valueRaw = valueRaw.substring(0, valueRaw.length - 1).trim();
            }

            // Extract string between quotes (single or double)
            var quoteChar = valueRaw.charAt(0);
            if (quoteChar !== "'" && quoteChar !== '"') continue;
            if (valueRaw.charAt(valueRaw.length - 1) !== quoteChar) continue;

            var inner = valueRaw.substring(1, valueRaw.length - 1);

            // Unescape
            var value = '';
            for (var c = 0; c < inner.length; c++) {
                if (inner.charAt(c) === '\\' && c + 1 < inner.length) {
                    var nextChar = inner.charAt(c + 1);
                    if (nextChar === quoteChar) {
                        value += quoteChar;
                        c++;
                    } else if (nextChar === 'n') {
                        value += ' ';
                        c++;
                    } else {
                        value += inner.charAt(c);
                    }
                } else {
                    value += inner.charAt(c);
                }
            }

            result[key] = value;
        }

        return result;
    } catch (e) {
        console.error('i18n Inline Preview: Error parsing ' + filePath + ': ' + e.message);
        return null;
    }
}

function isValidKey(str) {
    if (str.length === 0) return false;
    for (var i = 0; i < str.length; i++) {
        var ch = str.charCodeAt(i);
        var isAlpha = (ch >= 97 && ch <= 122) || (ch >= 65 && ch <= 90);
        var isDigit = (ch >= 48 && ch <= 57);
        var isUnderscore = (ch === 95);
        if (!isAlpha && !isDigit && !isUnderscore) return false;
    }
    return true;
}

// ---- Decoration Engine ----

function updateDecorations(editor) {
    if (!editor || !decorationType) return;

    if (!previewEnabled) {
        editor.setDecorations(decorationType, []);
        return;
    }

    var document = editor.document;

    // Skip locale definition files
    if (isLocaleFile(document.fileName)) {
        editor.setDecorations(decorationType, []);
        return;
    }

    var langData = translations[currentLanguage] || {};
    var maxLen = vscode.workspace.getConfiguration('i18nInlinePreview').get('maxPreviewLength', 60);
    var decorations = [];

    var lineCount = document.lineCount;
    for (var lineNum = 0; lineNum < lineCount; lineNum++) {
        var lineText = document.lineAt(lineNum).text;
        findDotTranslationKeys(lineText, lineNum, langData, maxLen, decorations);
        findFunctionTranslationKeys(lineText, lineNum, langData, maxLen, decorations);
    }

    editor.setDecorations(decorationType, decorations);
}

function isLocaleFile(filePath) {
    var normalizedFile = filePath.split('\\').join('/').toLowerCase();
    for (var i = 0; i < languages.length; i++) {
        for (var j = 0; j < localeFiles.length; j++) {
            var pattern = localeFiles[j].pattern.replace('{lang}', languages[i].code);
            var fullPath = path.join(workspaceRoot, pattern).split('\\').join('/').toLowerCase();
            if (normalizedFile === fullPath) {
                return true;
            }
        }
    }
    return false;
}

// ---- Dot Pattern Matching (t.keyName, data.t.keyName) ----

function findDotTranslationKeys(lineText, lineNum, langData, maxLen, decorations) {
    for (var p = 0; p < dotPatterns.length; p++) {
        findDotPattern(lineText, lineNum, langData, maxLen, decorations, dotPatterns[p]);
    }
}

function findDotPattern(lineText, lineNum, langData, maxLen, decorations, pattern) {
    var searchStr = pattern + '.';
    var searchStart = 0;

    while (searchStart < lineText.length) {
        var idx = lineText.indexOf(searchStr, searchStart);
        if (idx === -1) break;

        // Validate: pattern must be preceded by non-identifier char or start of line
        if (idx > 0) {
            var prevChar = lineText.charAt(idx - 1);
            var validPrev = ' \t({[,!+=?:|&;>.';
            if (validPrev.indexOf(prevChar) === -1) {
                searchStart = idx + searchStr.length;
                continue;
            }
        }

        // Extract key name after the dot
        var keyStart = idx + searchStr.length;
        var keyEnd = keyStart;
        while (keyEnd < lineText.length) {
            var ch = lineText.charCodeAt(keyEnd);
            var isAlphaNum = (ch >= 97 && ch <= 122) || (ch >= 65 && ch <= 90) ||
                             (ch >= 48 && ch <= 57) || (ch === 95);
            if (!isAlphaNum) break;
            keyEnd++;
        }

        var keyName = lineText.substring(keyStart, keyEnd);
        if (keyName.length > 0 && langData.hasOwnProperty(keyName)) {
            var displayText = truncateText(langData[keyName], maxLen);
            var range = new vscode.Range(lineNum, keyEnd, lineNum, keyEnd);
            decorations.push({
                range: range,
                renderOptions: {
                    after: {
                        contentText: '\u2192 ' + displayText,
                        color: new vscode.ThemeColor('editorCodeLens.foreground'),
                        fontStyle: 'italic'
                    }
                }
            });
        }

        searchStart = keyEnd > idx + searchStr.length ? keyEnd : idx + searchStr.length;
    }
}

// ---- Function Pattern Matching (__('key'), $t('key')) ----

function findFunctionTranslationKeys(lineText, lineNum, langData, maxLen, decorations) {
    for (var p = 0; p < functionPatterns.length; p++) {
        findFunctionPattern(lineText, lineNum, langData, maxLen, decorations, functionPatterns[p]);
    }
}

function findFunctionPattern(lineText, lineNum, langData, maxLen, decorations, funcName) {
    var searchStart = 0;

    while (searchStart < lineText.length) {
        // Find funcName(' or funcName("
        var singleIdx = lineText.indexOf(funcName + "('", searchStart);
        var doubleIdx = lineText.indexOf(funcName + '("', searchStart);

        var funcIndex, quoteChar;
        if (singleIdx === -1 && doubleIdx === -1) break;
        if (singleIdx === -1) { funcIndex = doubleIdx; quoteChar = '"'; }
        else if (doubleIdx === -1) { funcIndex = singleIdx; quoteChar = "'"; }
        else if (singleIdx <= doubleIdx) { funcIndex = singleIdx; quoteChar = "'"; }
        else { funcIndex = doubleIdx; quoteChar = '"'; }

        // Validate: must not be part of a larger identifier
        if (funcIndex > 0) {
            var prevCh = lineText.charAt(funcIndex - 1);
            if (isIdentChar(prevCh)) {
                searchStart = funcIndex + funcName.length + 2;
                continue;
            }
        }

        // Extract key between quotes
        var keyStart = funcIndex + funcName.length + 2; // skip funcName('
        var keyEnd = lineText.indexOf(quoteChar, keyStart);
        if (keyEnd === -1) {
            searchStart = keyStart;
            continue;
        }

        var closeParen = lineText.indexOf(')', keyEnd);
        if (closeParen === -1) {
            searchStart = keyEnd;
            continue;
        }

        var keyName = lineText.substring(keyStart, keyEnd);
        if (keyName.length > 0 && langData.hasOwnProperty(keyName)) {
            var displayText = truncateText(langData[keyName], maxLen);

            // Place decoration after closing paren, skip blade {{ }} if present
            var decorEnd = closeParen + 1;
            if (decorEnd + 1 < lineText.length &&
                lineText.charAt(decorEnd) === '}' &&
                lineText.charAt(decorEnd + 1) === '}') {
                decorEnd += 2;
            }

            var range = new vscode.Range(lineNum, decorEnd, lineNum, decorEnd);
            decorations.push({
                range: range,
                renderOptions: {
                    after: {
                        contentText: '\u2192 ' + displayText,
                        color: new vscode.ThemeColor('editorCodeLens.foreground'),
                        fontStyle: 'italic'
                    }
                }
            });
        }

        searchStart = closeParen + 1;
    }
}

function isIdentChar(ch) {
    var code = ch.charCodeAt(0);
    return (code >= 97 && code <= 122) || (code >= 65 && code <= 90) ||
           (code >= 48 && code <= 57) || code === 95 || code === 36; // a-z A-Z 0-9 _ $
}

function truncateText(text, maxLen) {
    if (maxLen <= 0 || text.length <= maxLen) return text;
    return text.substring(0, maxLen) + '\u2026';
}

// ---- Hover Provider ----

function provideTranslationHover(document, position) {
    // Skip locale definition files
    if (isLocaleFile(document.fileName)) return null;

    var lineText = document.lineAt(position.line).text;
    var charPos = position.character;

    // Try dot patterns first, then function patterns
    var result = getDotKeyAtPosition(lineText, charPos);
    if (!result) {
        result = getFunctionKeyAtPosition(lineText, charPos);
    }

    if (!result) return null;

    var keyName = result.key;
    var keyRange = new vscode.Range(position.line, result.start, position.line, result.end);

    // Build hover card with all languages
    var md = new vscode.MarkdownString();
    md.isTrusted = true;
    md.appendMarkdown('**i18n Key:** `' + keyName + '`\n\n');
    md.appendMarkdown('| Lang | Translation |\n');
    md.appendMarkdown('|------|-------------|\n');

    for (var i = 0; i < languages.length; i++) {
        var lang = languages[i];
        var langTranslations = translations[lang.code] || {};
        var value = langTranslations[keyName];

        if (value !== undefined) {
            // Escape pipe and backtick for markdown table
            var escaped = value.split('|').join('\\|').split('`').join('\\`');
            var indicator = (lang.code === currentLanguage && previewEnabled) ? ' **\u25C0**' : '';
            md.appendMarkdown('| **' + lang.label + '** | ' + escaped + indicator + ' |\n');
        } else {
            md.appendMarkdown('| **' + lang.label + '** | *(missing)* |\n');
        }
    }

    return new vscode.Hover(md, keyRange);
}

function getDotKeyAtPosition(lineText, charPos) {
    for (var p = 0; p < dotPatterns.length; p++) {
        var result = getDotPatternAtPosition(lineText, charPos, dotPatterns[p]);
        if (result) return result;
    }
    return null;
}

function getDotPatternAtPosition(lineText, charPos, pattern) {
    var searchStr = pattern + '.';
    var searchStart = 0;

    while (searchStart < lineText.length) {
        var idx = lineText.indexOf(searchStr, searchStart);
        if (idx === -1) break;

        // Same validation as findDotPattern
        if (idx > 0) {
            var prevChar = lineText.charAt(idx - 1);
            var validPrev = ' \t({[,!+=?:|&;>.';
            if (validPrev.indexOf(prevChar) === -1) {
                searchStart = idx + searchStr.length;
                continue;
            }
        }

        var keyStart = idx + searchStr.length;
        var keyEnd = keyStart;
        while (keyEnd < lineText.length) {
            var ch = lineText.charCodeAt(keyEnd);
            var isAlphaNum = (ch >= 97 && ch <= 122) || (ch >= 65 && ch <= 90) ||
                             (ch >= 48 && ch <= 57) || (ch === 95);
            if (!isAlphaNum) break;
            keyEnd++;
        }

        if (charPos >= idx && charPos < keyEnd) {
            var keyName = lineText.substring(keyStart, keyEnd);
            if (keyExistsInAnyLanguage(keyName)) {
                return { key: keyName, start: idx, end: keyEnd };
            }
        }

        searchStart = keyEnd > idx + searchStr.length ? keyEnd : idx + searchStr.length;
    }
    return null;
}

function getFunctionKeyAtPosition(lineText, charPos) {
    for (var p = 0; p < functionPatterns.length; p++) {
        var result = getFunctionPatternAtPosition(lineText, charPos, functionPatterns[p]);
        if (result) return result;
    }
    return null;
}

function getFunctionPatternAtPosition(lineText, charPos, funcName) {
    var searchStart = 0;

    while (searchStart < lineText.length) {
        var singleIdx = lineText.indexOf(funcName + "('", searchStart);
        var doubleIdx = lineText.indexOf(funcName + '("', searchStart);

        var funcIndex, quoteChar;
        if (singleIdx === -1 && doubleIdx === -1) break;
        if (singleIdx === -1) { funcIndex = doubleIdx; quoteChar = '"'; }
        else if (doubleIdx === -1) { funcIndex = singleIdx; quoteChar = "'"; }
        else if (singleIdx <= doubleIdx) { funcIndex = singleIdx; quoteChar = "'"; }
        else { funcIndex = doubleIdx; quoteChar = '"'; }

        if (funcIndex > 0) {
            var prevCh = lineText.charAt(funcIndex - 1);
            if (isIdentChar(prevCh)) {
                searchStart = funcIndex + funcName.length + 2;
                continue;
            }
        }

        var keyStart = funcIndex + funcName.length + 2;
        var keyEnd = lineText.indexOf(quoteChar, keyStart);
        if (keyEnd === -1) { searchStart = keyStart; continue; }

        var closeParen = lineText.indexOf(')', keyEnd);
        if (closeParen === -1) { searchStart = keyEnd; continue; }

        if (charPos >= funcIndex && charPos <= closeParen) {
            var keyName = lineText.substring(keyStart, keyEnd);
            if (keyExistsInAnyLanguage(keyName)) {
                return { key: keyName, start: funcIndex, end: closeParen + 1 };
            }
        }

        searchStart = closeParen + 1;
    }
    return null;
}

function keyExistsInAnyLanguage(keyName) {
    for (var i = 0; i < languages.length; i++) {
        if (translations[languages[i].code] &&
            translations[languages[i].code].hasOwnProperty(keyName)) {
            return true;
        }
    }
    return false;
}

// ---- Commands ----

function cycleLanguage() {
    if (!previewEnabled) {
        // Currently OFF -> go back to first language and enable
        previewEnabled = true;
        currentLanguage = languages.length > 0 ? languages[0].code : 'en';
        var firstLabel = languages.length > 0 ? languages[0].label : 'EN';
        vscode.window.setStatusBarMessage('i18n preview: ' + firstLabel, 2000);
    } else {
        // Find current language index
        var currentIndex = -1;
        for (var i = 0; i < languages.length; i++) {
            if (languages[i].code === currentLanguage) {
                currentIndex = i;
                break;
            }
        }

        if (currentIndex >= 0 && currentIndex < languages.length - 1) {
            // Next language
            currentLanguage = languages[currentIndex + 1].code;
            vscode.window.setStatusBarMessage('i18n preview: ' + languages[currentIndex + 1].label, 2000);
        } else {
            // Last language (or not found) -> turn OFF
            previewEnabled = false;
            vscode.window.setStatusBarMessage('i18n preview: OFF', 2000);
        }
    }

    updateStatusBar();

    var editor = vscode.window.activeTextEditor;
    if (editor) {
        updateDecorations(editor);
    }
}

function togglePreview() {
    previewEnabled = !previewEnabled;
    updateStatusBar();

    vscode.window.showInformationMessage(
        previewEnabled ? 'i18n inline preview enabled' : 'i18n inline preview disabled'
    );

    var editor = vscode.window.activeTextEditor;
    if (editor) {
        updateDecorations(editor);
    }
}

function updateStatusBar() {
    if (!statusBarItem) return;

    if (previewEnabled) {
        var langLabel = currentLanguage.toUpperCase();
        for (var i = 0; i < languages.length; i++) {
            if (languages[i].code === currentLanguage) {
                langLabel = languages[i].label;
                break;
            }
        }
        statusBarItem.text = '$(globe) i18n: ' + langLabel;
        statusBarItem.backgroundColor = undefined;
    } else {
        statusBarItem.text = '$(globe) i18n: OFF';
        statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    }
}

// ---- Event Handlers ----

function onDocumentChange(event) {
    var editor = vscode.window.activeTextEditor;
    if (!editor || event.document !== editor.document) return;

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
        updateDecorations(editor);
    }, 300);
}

function onEditorSwitch(editor) {
    if (editor) {
        updateDecorations(editor);
    }
}

function onConfigChange(event) {
    if (event.affectsConfiguration('i18nInlinePreview')) {
        loadConfig();
        loadAllTranslations();
        updateStatusBar();

        var editor = vscode.window.activeTextEditor;
        if (editor) {
            updateDecorations(editor);
        }
    }
}

// ---- File Watchers ----

function setupFileWatchers(context) {
    var folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) return;

    var folder = folders[0];

    // Derive unique glob patterns from configured locale files
    var watchPatterns = {};
    for (var i = 0; i < localeFiles.length; i++) {
        var globPattern = localeFiles[i].pattern.replace('{lang}', '*');
        watchPatterns[globPattern] = true;
    }

    var patterns = Object.keys(watchPatterns);
    for (var j = 0; j < patterns.length; j++) {
        var watcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(folder, patterns[j])
        );
        watcher.onDidChange(onLocaleFileChanged);
        watcher.onDidCreate(onLocaleFileChanged);
        context.subscriptions.push(watcher);
    }
}

function onLocaleFileChanged(uri) {
    console.log('i18n Inline Preview: Locale file changed - ' + path.basename(uri.fsPath));
    loadAllTranslations();

    var editor = vscode.window.activeTextEditor;
    if (editor) {
        updateDecorations(editor);
    }
}

// ---- Deactivation ----

function deactivate() {
    if (decorationType) {
        decorationType.dispose();
        decorationType = null;
    }
    if (statusBarItem) {
        statusBarItem.dispose();
        statusBarItem = null;
    }
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
    }
    translations = {};
}

module.exports = { activate, deactivate };
